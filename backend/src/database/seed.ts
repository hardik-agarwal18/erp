import "dotenv/config";

import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";

import type { DatabaseTransactionClient } from "../config/database.js";
import { prisma } from "../config/database.js";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  auditService,
} from "../services/audit/index.js";

import { PERMISSIONS as NEW_PERMISSIONS } from "../shared/constants/permissions.js";
import { LEGACY_PERMISSIONS, SYSTEM_ROLE_PERMISSIONS, SYSTEM_ROLE_NAMES } from "../shared/constants/rbac.js";

const DEFAULT_SUPER_ADMIN_PASSWORD = "ChangeMe123!";
const DEFAULT_ORGANIZATION_SLUG = "default-organization";

const PLATFORM_ROLES = [
  {
    name: "SUPER_ADMIN",
    description: "Platform bootstrap administrator for the default tenant.",
  },
] as const;

const ORGANIZATION_ROLES = [
  { name: "owner", description: "Owns the organization and can manage all ERP modules." },
  { name: "admin", description: "Administrative operator with broad ERP access." },
  { name: "manager", description: "Operational manager with day-to-day supervisory access." },
  { name: "member", description: "Standard employee role with limited operational access." },
] as const;

const ALL_PERMISSIONS = [
  ...Object.values(NEW_PERMISSIONS),
  ...Object.values(LEGACY_PERMISSIONS),
];

/**
 * Seeds the baseline ERP tenant, RBAC catalog, and bootstrap super admin.
 */
export async function seedDatabase(): Promise<void> {
  const superAdminEmail =
    process.env.SEED_SUPER_ADMIN_EMAIL ?? "superadmin@erp.local";
  const superAdminName =
    process.env.SEED_SUPER_ADMIN_NAME ?? "ERP Super Admin";
  const superAdminPassword = await bcrypt.hash(
    process.env.SEED_SUPER_ADMIN_PASSWORD ?? DEFAULT_SUPER_ADMIN_PASSWORD,
    12,
  );

  await prisma.$transaction(async (tx: DatabaseTransactionClient) => {
    for (const permissionName of ALL_PERMISSIONS) {
      await tx.permission.upsert({
        where: {
          name: permissionName,
        },
        update: {},
        create: {
          name: permissionName,
          description: permissionName,
        },
      });
    }

    const superAdmin = await tx.user.upsert({
      where: {
        email: superAdminEmail,
      },
      update: {
        name: superAdminName,
        password: superAdminPassword,
        isVerified: true,
      },
      create: {
        name: superAdminName,
        email: superAdminEmail,
        password: superAdminPassword,
        isVerified: true,
      },
    });

    const organization = await tx.organization.upsert({
      where: {
        slug: process.env.SEED_DEFAULT_ORGANIZATION_SLUG ?? DEFAULT_ORGANIZATION_SLUG,
      },
      update: {
        name: process.env.SEED_DEFAULT_ORGANIZATION_NAME ?? "Default Organization",
        ownerId: superAdmin.id,
      },
      create: {
        name: process.env.SEED_DEFAULT_ORGANIZATION_NAME ?? "Default Organization",
        slug: process.env.SEED_DEFAULT_ORGANIZATION_SLUG ?? DEFAULT_ORGANIZATION_SLUG,
        ownerId: superAdmin.id,
        settings: {
          currency: "USD",
          timezone: "UTC",
        } satisfies Prisma.InputJsonValue,
      },
    });

    const permissionRecords = await tx.permission.findMany({
      where: {
        name: {
          in: ALL_PERMISSIONS,
        },
      },
    });

    const permissionsByName = new Map(
      permissionRecords.map((permission) => [permission.name, permission]),
    );

    const roleDefinitions = [...PLATFORM_ROLES, ...ORGANIZATION_ROLES];
    
    for (const roleDefinition of roleDefinitions) {
      const role = await tx.role.upsert({
        where: {
          organizationId_name: {
            organizationId: organization.id,
            name: roleDefinition.name,
          },
        },
        update: {
          description: roleDefinition.description,
          isSystem: true,
        },
        create: {
          organizationId: organization.id,
          name: roleDefinition.name,
          description: roleDefinition.description,
          isSystem: true,
        },
      });

      await tx.rolePermission.deleteMany({
        where: {
          roleId: role.id,
        },
      });

      // Assignment Logic:
      // SUPER_ADMIN gets all permissions.
      // Organization roles get permissions explicitly defined in SYSTEM_ROLE_PERMISSIONS.
      let permissionsToAssign: string[] = [];
      if (roleDefinition.name === "SUPER_ADMIN") {
        permissionsToAssign = ALL_PERMISSIONS;
      } else if (SYSTEM_ROLE_NAMES.includes(roleDefinition.name as any)) {
        permissionsToAssign = SYSTEM_ROLE_PERMISSIONS[roleDefinition.name as keyof typeof SYSTEM_ROLE_PERMISSIONS] || [];
      }

      const permissionIdsToAssign = permissionRecords
        .filter((p) => permissionsToAssign.includes(p.name))
        .map((p) => p.id);

      if (permissionIdsToAssign.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIdsToAssign.map((permissionId) => ({
            roleId: role.id,
            permissionId,
          })),
          skipDuplicates: true,
        });
      }
    }

    const ownerRole = await tx.role.findUniqueOrThrow({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: "SUPER_ADMIN",
        },
      },
    });

    await tx.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: superAdmin.id,
        },
      },
      update: {
        roleId: ownerRole.id,
      },
      create: {
        organizationId: organization.id,
        userId: superAdmin.id,
        roleId: ownerRole.id,
      },
    });

    await tx.invoiceSequence.upsert({
      where: {
        organizationId: organization.id,
      },
      update: {
        prefix: "INV",
      },
      create: {
        organizationId: organization.id,
        prefix: "INV",
        nextNumber: 1,
      },
    });

    const customerCreatePermission = permissionsByName.get("CUSTOMER_CREATE");

    await auditService.record(
      {
        organizationId: organization.id,
        userId: superAdmin.id,
        action: AUDIT_ACTIONS.SEED_COMPLETED,
        entityType: AUDIT_ENTITY_TYPES.ORGANIZATION,
        entityId: organization.id,
        metadata: {
          seededRoles: roleDefinitions.map((role) => role.name),
          seededPermissions: ALL_PERMISSIONS,
          customerCreatePermissionId: permissionsByName.get(NEW_PERMISSIONS.CUSTOMERS_CREATE)?.id ?? null,
        },
      },
      tx,
    );
  });
}

async function main(): Promise<void> {
  await seedDatabase();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error("[database] Seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
