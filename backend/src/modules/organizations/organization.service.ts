import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";

import prisma, {
  type DatabaseTransactionClient,
} from "../../config/database.js";
import { sendInvitationEmail } from "../../mail/mail.service.js";
import {
  DEFAULT_PERMISSIONS,
  SYSTEM_ROLE_NAMES,
  SYSTEM_ROLE_PERMISSIONS,
} from "../../shared/constants/rbac.js";
import {
  clearMemberPermissionCache,
  clearMembersPermissionCache,
} from "../../shared/utils/permissions.js";
import { slugify } from "../../shared/utils/slug.js";
import ApiError from "../../utils/ApiError.js";
import { buildInvitationUrl } from "../auth/auth.utils.js";
import { authRepository } from "../auth/auth.repository.js";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  auditService,
} from "../../services/audit/index.js";
import { organizationRepository } from "./organization.repository.js";
import {
  CreateOrganizationInput,
  InviteMemberInput,
  UpdateOrganizationInput,
} from "./organization.types.js";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const buildUniqueSlug = async (candidate: string) => {
  const base = slugify(candidate);
  if (!base) {
    throw new ApiError(400, "A valid organization slug is required");
  }

  let attempt = base;
  let suffix = 1;
  while (await organizationRepository.findBySlug(attempt)) {
    suffix += 1;
    attempt = `${base}-${suffix}`;
  }

  return attempt;
};

const createSystemAuthorization = async (
  tx: DatabaseTransactionClient,
  organizationId: string,
) => {
  await tx.permission.createMany({
    data: DEFAULT_PERMISSIONS.map((permission) => ({
      name: permission.name,
      description: permission.description,
    })),
    skipDuplicates: true,
  });

  const permissions = await tx.permission.findMany({
    where: {
      name: {
        in: DEFAULT_PERMISSIONS.map((permission) => permission.name),
      },
    },
  });

  const permissionIdByName = new Map(
    permissions.map((permission) => [permission.name, permission.id]),
  );

  const roles = new Map<string, { id: string; name: string }>();

  for (const roleName of SYSTEM_ROLE_NAMES) {
    const role = await tx.role.create({
      data: {
        organizationId,
        name: roleName,
        description: `${roleName} role`,
        isSystem: true,
      },
    });

    roles.set(roleName, role);

    await tx.rolePermission.createMany({
      data: SYSTEM_ROLE_PERMISSIONS[roleName].map((permissionName) => ({
        roleId: role.id,
        permissionId: permissionIdByName.get(permissionName)!,
      })),
      skipDuplicates: true,
    });
  }

  return roles;
};

const resolveAssignableRole = async (
  organizationId: string,
  roleId?: string,
  roleName?: string,
) => {
  const role = roleId
    ? await organizationRepository.findRoleById(organizationId, roleId)
    : await organizationRepository.findRoleByName(
        organizationId,
        roleName ?? "member",
      );

  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  if (role.name === "owner") {
    throw new ApiError(
      400,
      "Owner role can only be assigned via ownership transfer",
    );
  }

  return role;
};

const assertOwner = (ownerId: string, actorUserId: string) => {
  if (ownerId !== actorUserId) {
    throw new ApiError(
      403,
      "Only the organization owner can perform this action",
    );
  }
};

export const organizationService = {
  createOrganization: async (
    userId: string,
    payload: CreateOrganizationInput,
  ) => {
    const slug = await buildUniqueSlug(payload.slug ?? payload.name);
    const joinCode = `${payload.name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, "O")}-${randomBytes(3).toString("hex").toUpperCase()}`;

    const organization = await prisma.$transaction(async (tx) => {
      const createdOrganization = await tx.organization.create({
        data: {
          name: payload.name,
          slug,
          joinCode,
          logo: payload.logo,
          settings: payload.settings as Prisma.InputJsonValue | undefined,
          ownerId: userId,
        },
      });

      const systemRoles = await createSystemAuthorization(
        tx,
        createdOrganization.id,
      );

      await tx.organizationMember.create({
        data: {
          organizationId: createdOrganization.id,
          userId,
          roleId: systemRoles.get("owner")!.id,
        },
      });

      await auditService.record(
        {
          organizationId: createdOrganization.id,
          userId,
          action: AUDIT_ACTIONS.ORGANIZATION_CREATED,
          entityType: AUDIT_ENTITY_TYPES.ORGANIZATION,
          entityId: createdOrganization.id,
          metadata: {
            slug: createdOrganization.slug,
          },
        },
        tx,
      );

      return createdOrganization;
    }, { timeout: 30000 });

    const membership = await authRepository.findMembership(
      userId,
      organization.id,
    );

    if (payload.invites && payload.invites.length > 0) {
      await Promise.allSettled(
        payload.invites.map((email) =>
          organizationService.inviteMember(organization.id, userId, {
            email,
            roleName: "member",
          }).catch(err => {
            // Log error but don't fail org creation
            console.error(`Failed to invite ${email} during onboarding`, err);
          })
        )
      );
    }

    return {
      ...organization,
      membershipId: membership?.id ?? null,
      role: membership?.role.name ?? "owner",
    };
  },

  listOrganizations: async (userId: string) => {
    const memberships = await organizationRepository.listForUser(userId);

    return memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      logo: membership.organization.logo,
      ownerId: membership.organization.ownerId,
      settings: membership.organization.settings,
      createdAt: membership.organization.createdAt,
      updatedAt: membership.organization.updatedAt,
      membershipId: membership.id,
      roleId: membership.roleId,
      role: membership.role.name,
    }));
  },

  getOrganization: async (organizationId: string) => {
    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw new ApiError(404, "Organization not found");
    }

    return organization;
  },

  updateOrganization: async (
    organizationId: string,
    actorUserId: string,
    payload: UpdateOrganizationInput,
  ) => {
    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw new ApiError(404, "Organization not found");
    }

    let nextSlug: string | undefined;
    if (payload.slug) {
      nextSlug = slugify(payload.slug);
      const existing = await organizationRepository.findBySlug(nextSlug);
      if (existing && existing.id !== organizationId) {
        throw new ApiError(409, "Organization slug is already in use");
      }
    }

    if (payload.settings && organization.ownerId !== actorUserId) {
      throw new ApiError(
        403,
        "Only the owner can change organization settings",
      );
    }

    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: payload.name,
        slug: nextSlug,
        logo: payload.logo,
        settings: payload.settings as Prisma.InputJsonValue | undefined,
      },
    });

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.ORGANIZATION_UPDATED,
      entityType: AUDIT_ENTITY_TYPES.ORGANIZATION,
      entityId: organizationId,
      metadata: {
        name: updatedOrganization.name,
        slug: updatedOrganization.slug,
      },
    });

    return updatedOrganization;
  },

  deleteOrganization: async (organizationId: string, actorUserId: string) => {
    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw new ApiError(404, "Organization not found");
    }

    assertOwner(organization.ownerId, actorUserId);

    await prisma.organization.delete({
      where: { id: organizationId },
    });
  },

  listMembers: async (organizationId: string) => {
    return organizationRepository.listMembers(organizationId);
  },

  inviteMember: async (
    organizationId: string,
    actorUserId: string,
    payload: InviteMemberInput,
  ) => {
    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw new ApiError(404, "Organization not found");
    }

    const normalizedEmail = payload.email.trim().toLowerCase();
    const existingUser = await authRepository.findUserByEmail(normalizedEmail);
    if (existingUser) {
      const existingMembership =
        await organizationRepository.findMemberByUserId(
          organizationId,
          existingUser.id,
        );
      if (existingMembership) {
        throw new ApiError(
          409,
          "User is already a member of this organization",
        );
      }
    }

    const role = await resolveAssignableRole(
      organizationId,
      payload.roleId,
      payload.roleName,
    );

    const pending = await organizationRepository.findInvitationByEmail(
      organizationId,
      normalizedEmail,
    );

    if (pending && pending.expiresAt > new Date()) {
      throw new ApiError(
        409,
        "An active invitation already exists for this email",
      );
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

    const invitation = await prisma.invitation.create({
      data: {
        organizationId,
        email: normalizedEmail,
        roleId: role.id,
        token,
        expiresAt,
        invitedBy: actorUserId,
      },
    });

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.INVITATION_SENT,
      entityType: AUDIT_ENTITY_TYPES.INVITATION,
      entityId: invitation.id,
      metadata: {
        email: normalizedEmail,
        roleId: role.id,
      },
    });

    await sendInvitationEmail(
      normalizedEmail,
      organization.name,
      role.name,
      buildInvitationUrl(token),
      Math.ceil(INVITATION_TTL_MS / (60 * 60 * 1000)),
    );

    return invitation;
  },

  updateMemberRole: async (
    organizationId: string,
    memberId: string,
    actorUserId: string,
    actorRoleName: string,
    roleId: string,
  ) => {
    const targetMember = await organizationRepository.findMemberById(memberId);
    if (!targetMember || targetMember.organizationId !== organizationId) {
      throw new ApiError(404, "Member not found");
    }

    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw new ApiError(404, "Organization not found");
    }

    if (targetMember.role.name === "owner") {
      throw new ApiError(
        400,
        "Use ownership transfer to change the owner role",
      );
    }

    if (actorRoleName !== "owner" && targetMember.role.name === "admin") {
      throw new ApiError(403, "Only the owner can change an admin role");
    }

    const role = await resolveAssignableRole(organizationId, roleId);
    if (
      actorRoleName !== "owner" &&
      (role.name === "admin" || role.name === "manager")
    ) {
      throw new ApiError(403, "Only the owner can assign elevated roles");
    }

    const updated = await prisma.organizationMember.update({
      where: { id: memberId },
      data: { roleId: role.id },
    });

    await clearMemberPermissionCache(updated.id);

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.ORGANIZATION_MEMBER_ROLE_UPDATED,
      entityType: AUDIT_ENTITY_TYPES.ORGANIZATION_MEMBER,
      entityId: memberId,
      metadata: {
        targetUserId: targetMember.userId,
        roleId: role.id,
      },
    });

    return updated;
  },

  removeMember: async (
    organizationId: string,
    memberId: string,
    actorUserId: string,
    actorRoleName: string,
  ) => {
    const targetMember = await organizationRepository.findMemberById(memberId);
    if (!targetMember || targetMember.organizationId !== organizationId) {
      throw new ApiError(404, "Member not found");
    }

    if (targetMember.userId === actorUserId) {
      throw new ApiError(400, "Use leave organization for removing yourself");
    }

    if (targetMember.role.name === "owner") {
      throw new ApiError(400, "Organization owner cannot be removed");
    }

    if (actorRoleName !== "owner" && targetMember.role.name === "admin") {
      throw new ApiError(403, "Only the owner can remove an admin");
    }

    await prisma.organizationMember.delete({
      where: { id: memberId },
    });

    await clearMemberPermissionCache(memberId);

    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.ORGANIZATION_MEMBER_REMOVED,
      entityType: AUDIT_ENTITY_TYPES.ORGANIZATION_MEMBER,
      entityId: memberId,
      metadata: {
        targetUserId: targetMember.userId,
      },
    });
  },

  leaveOrganization: async (organizationId: string, userId: string) => {
    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw new ApiError(404, "Organization not found");
    }

    if (organization.ownerId === userId) {
      throw new ApiError(
        400,
        "Transfer ownership before leaving the organization",
      );
    }

    const membership = await organizationRepository.findMemberByUserId(
      organizationId,
      userId,
    );

    if (!membership) {
      throw new ApiError(404, "Membership not found");
    }

    await prisma.organizationMember.delete({
      where: { id: membership.id },
    });

    await clearMemberPermissionCache(membership.id);

    await auditService.record({
      organizationId,
      userId,
      action: AUDIT_ACTIONS.ORGANIZATION_LEFT,
      entityType: AUDIT_ENTITY_TYPES.ORGANIZATION_MEMBER,
      entityId: membership.id,
      metadata: {
        targetUserId: userId,
      },
    });
  },

  transferOwnership: async (
    organizationId: string,
    actorUserId: string,
    targetMemberId: string,
  ) => {
    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw new ApiError(404, "Organization not found");
    }

    assertOwner(organization.ownerId, actorUserId);

    const targetMember =
      await organizationRepository.findMemberById(targetMemberId);
    if (!targetMember || targetMember.organizationId !== organizationId) {
      throw new ApiError(404, "Target member not found");
    }

    const currentOwnerMember = await organizationRepository.findMemberByUserId(
      organizationId,
      actorUserId,
    );
    const ownerRole = await organizationRepository.findRoleByName(
      organizationId,
      "owner",
    );
    const adminRole = await organizationRepository.findRoleByName(
      organizationId,
      "admin",
    );

    if (!currentOwnerMember || !ownerRole || !adminRole) {
      throw new ApiError(500, "Organization authorization is misconfigured");
    }

    await prisma.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id: organizationId },
        data: { ownerId: targetMember.userId },
      });

      await tx.organizationMember.update({
        where: { id: targetMember.id },
        data: { roleId: ownerRole.id },
      });

      await tx.organizationMember.update({
        where: { id: currentOwnerMember.id },
        data: { roleId: adminRole.id },
      });

      await auditService.record(
        {
          organizationId,
          userId: actorUserId,
          action: AUDIT_ACTIONS.ORGANIZATION_OWNERSHIP_TRANSFERRED,
          entityType: AUDIT_ENTITY_TYPES.ORGANIZATION,
          entityId: organizationId,
          metadata: {
            previousOwnerUserId: actorUserId,
            newOwnerUserId: targetMember.userId,
          },
        },
        tx,
      );
    }, { timeout: 30000 });

    await clearMembersPermissionCache([targetMember.id, currentOwnerMember.id]);
  },

  acceptInvitation: async (token: string, password?: string, name?: string) => {
    const invitation =
      await organizationRepository.findInvitationByToken(token);
    if (!invitation || invitation.acceptedAt) {
      throw new ApiError(404, "Invitation not found");
    }

    if (invitation.expiresAt < new Date()) {
      throw new ApiError(400, "Invitation expired");
    }

    if (invitation.role.name === "owner") {
      throw new ApiError(400, "Invalid invitation role");
    }

    let user = await authRepository.findUserByEmail(invitation.email);
    const createdNewUser = !user;
    if (!user) {
      if (!password || !name) {
        throw new ApiError(
          400,
          "Name and password are required to accept this invitation",
        );
      }

      user = await authRepository.createUser({
        name,
        email: invitation.email,
        password: await import("../../lib/bcrypt.js").then(({ hashPassword }) =>
          hashPassword(password),
        ),
      });

      await authRepository.markUserVerified(user.id);
    }

    const existingMembership = await organizationRepository.findMemberByUserId(
      invitation.organizationId,
      user.id,
    );
    if (existingMembership) {
      throw new ApiError(409, "User is already a member of this organization");
    }

    const membership = await prisma.$transaction(async (tx) => {
      const createdMembership = await tx.organizationMember.create({
        data: {
          organizationId: invitation.organizationId,
          userId: user!.id,
          roleId: invitation.roleId,
        },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      await auditService.record(
        {
          organizationId: invitation.organizationId,
          userId: user!.id,
          action: AUDIT_ACTIONS.INVITATION_ACCEPTED,
          entityType: AUDIT_ENTITY_TYPES.INVITATION,
          entityId: invitation.id,
          metadata: {
            invitedBy: invitation.invitedBy,
            roleId: invitation.roleId,
            createdNewUser,
          },
        },
        tx,
      );

      return createdMembership;
    }, { timeout: 30000 });

    await clearMemberPermissionCache(membership.id);

    return {
      organizationId: invitation.organizationId,
      organizationName: invitation.organization.name,
      userId: user.id,
      membershipId: membership.id,
      role: invitation.role.name,
    };
  },
};
