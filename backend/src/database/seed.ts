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

const DEFAULT_SUPER_ADMIN_PASSWORD = "ChangeMe123!";
const DEFAULT_ORGANIZATION_SLUG = "default-organization";

const ROLE_DEFINITIONS = [
  {
    name: "SUPER_ADMIN",
    description: "Platform bootstrap administrator for the default tenant.",
  },
  {
    name: "ORGANIZATION_OWNER",
    description: "Owns the organization and can manage all ERP modules.",
  },
  {
    name: "ADMIN",
    description: "Administrative operator with broad ERP access.",
  },
  {
    name: "MANAGER",
    description: "Operational manager with day-to-day supervisory access.",
  },
  {
    name: "EMPLOYEE",
    description: "Standard employee role with limited operational access.",
  },
] as const;

const PERMISSIONS = [
  "CUSTOMER_CREATE",
  "CUSTOMER_READ",
  "CUSTOMER_UPDATE",
  "CUSTOMER_DELETE",
  "PRODUCT_CREATE",
  "PRODUCT_READ",
  "PRODUCT_UPDATE",
  "PRODUCT_DELETE",
  "INVOICE_CREATE",
  "INVOICE_READ",
  "INVOICE_UPDATE",
  "INVOICE_DELETE",
] as const;

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
    for (const permissionName of PERMISSIONS) {
      await tx.permission.upsert({
        where: {
          name: permissionName,
        },
        update: {},
        create: {
          name: permissionName,
          description: permissionName
            .toLowerCase()
            .split("_")
            .join(" "),
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
          in: [...PERMISSIONS],
        },
      },
    });

    const permissionsByName = new Map(
      permissionRecords.map((permission) => [permission.name, permission]),
    );

    for (const roleDefinition of ROLE_DEFINITIONS) {
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

      await tx.rolePermission.createMany({
        data: permissionRecords.map((permission) => ({
          roleId: role.id,
          permissionId: permission.id,
        })),
        skipDuplicates: true,
      });
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
          seededRoles: ROLE_DEFINITIONS.map((role) => role.name),
          seededPermissions: [...PERMISSIONS],
          customerCreatePermissionId: customerCreatePermission?.id ?? null,
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
