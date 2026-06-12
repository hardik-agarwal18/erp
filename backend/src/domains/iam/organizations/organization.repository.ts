
import prisma from "../../../config/database.js";

export const organizationRepository = {
  findById: (id: string) => {
    return prisma.organization.findUnique({ where: { id } });
  },
  findBySlug: (slug: string) => {
    return prisma.organization.findUnique({ where: { slug } });
  },
  listForUser: (userId: string) => {
    return prisma.organizationMember.findMany({
      where: { userId },
      orderBy: { joinedAt: "asc" },
      select: {
        id: true,
        roleId: true,
        role: {
          select: {
            name: true,
          },
        },
        organization: true,
      },
    });
  },
  listMembers: (organizationId: string) => {
    return prisma.organizationMember.findMany({
      where: { organizationId },
      orderBy: { joinedAt: "asc" },
      select: {
        id: true,
        userId: true,
        joinedAt: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isVerified: true,
          },
        },
      },
    });
  },
  findMemberById: (id: string) => {
    return prisma.organizationMember.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },
  findMemberByUserId: (organizationId: string, userId: string) => {
    return prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },
  findRoleById: (organizationId: string, roleId: string) => {
    return prisma.role.findFirst({
      where: { id: roleId, organizationId },
      include: {
        rolePermissions: {
          select: {
            permission: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  },
  findRoleByName: (organizationId: string, name: string) => {
    return prisma.role.findFirst({
      where: { organizationId, name: name.toLowerCase() },
      include: {
        rolePermissions: {
          select: {
            permission: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  },
  findInvitationByEmail: (organizationId: string, email: string) => {
    return prisma.invitation.findFirst({
      where: {
        organizationId,
        email,
        acceptedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });
  },
  findInvitationByToken: (token: string) => {
    return prisma.invitation.findUnique({
      where: { token },
      include: {
        role: true,
        organization: true,
      },
    });
  },
  listInvitations: (organizationId: string) => {
    return prisma.invitation.findMany({
      where: { organizationId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  },
};
