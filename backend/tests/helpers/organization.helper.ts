import { organizationService } from "../../src/domains/iam/organizations/organization.service.js";
import { prisma } from "../setup/testDb.js";

export const createOrganization = async (
  userId: string,
  payload?: { name?: string; slug?: string },
) => {
  return organizationService.createOrganization(userId, {
    name: payload?.name ?? "Test Organization",
    slug: payload?.slug,
  });
};

export const getRoleByName = async (organizationId: string, roleName: string) => {
  return prisma.role.findFirstOrThrow({
    where: {
      organizationId,
      name: roleName,
    },
  });
};

export const addMember = async (
  organizationId: string,
  userId: string,
  roleName = "member",
) => {
  const role = await getRoleByName(organizationId, roleName);

  return prisma.organizationMember.create({
    data: {
      organizationId,
      userId,
      roleId: role.id,
    },
  });
};

export const assignRole = async (memberId: string, roleName: string) => {
  const membership = await prisma.organizationMember.findUniqueOrThrow({
    where: { id: memberId },
  });
  const role = await getRoleByName(membership.organizationId, roleName);

  return prisma.organizationMember.update({
    where: { id: memberId },
    data: { roleId: role.id },
  });
};

export const createInvitation = async (
  organizationId: string,
  actorUserId: string,
  email: string,
  roleName = "member",
) => {
  return organizationService.inviteMember(organizationId, actorUserId, {
    email,
    roleName,
  });
};
