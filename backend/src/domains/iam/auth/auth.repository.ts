// @ts-nocheck
import prisma from "../../../config/database.js";

export const authRepository = {
  findUserByEmail: (email: string) => {
    return prisma.user.findUnique({ where: { email } });
  },
  updateUserPassword: (userId: string, password: string) => {
    return prisma.user.update({ where: { id: userId }, data: { password } });
  },
  findUserById: (id: string) => {
    return prisma.user.findUnique({ where: { id } });
  },
  updateUser: (userId: string, data: { name?: string; email?: string; isVerified?: boolean }) => {
    return prisma.user.update({ where: { id: userId }, data });
  },
  listUserMemberships: (userId: string) => {
    return prisma.organizationMember.findMany({
      where: { userId },
      orderBy: { joinedAt: "asc" },
      select: {
        id: true,
        organizationId: true,
        roleId: true,
        role: {
          select: {
            name: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            ownerId: true,
            createdAt: true,
          },
        },
      },
    });
  },
  findMembership: (userId: string, organizationId: string) => {
    return prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      select: {
        id: true,
        organizationId: true,
        roleId: true,
        role: {
          select: {
            name: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            ownerId: true,
            createdAt: true,
          },
        },
      },
    });
  },
  createUser: (data: { name: string; email: string; password: string }) => {
    return prisma.user.create({ data });
  },
  markUserVerified: (userId: string) => {
    return prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });
  },
  createRefreshSession: (data: {
    id: string;
    userId: string;
    activeOrganizationId?: string | null;
    refreshToken: string;
    device?: string;
    ipAddress?: string;
    expiresAt: Date;
  }) => {
    return prisma.refreshSession.create({ data });
  },
  findRefreshSession: (id: string) => {
    return prisma.refreshSession.findUnique({ where: { id } });
  },
  updateRefreshSessionOrganization: (
    id: string,
    activeOrganizationId: string | null,
  ) => {
    return prisma.refreshSession.update({
      where: { id },
      data: { activeOrganizationId },
    });
  },
  revokeRefreshSession: (id: string) => {
    return prisma.refreshSession.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  },
  revokeAllRefreshSessions: (userId: string) => {
    return prisma.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
  listActiveRefreshSessions: (userId: string) => {
    return prisma.refreshSession.findMany({
      where: { userId, revokedAt: null },
      select: { id: true },
    });
  },
  createEmailVerificationToken: (data: {
    userId: string;
    token: string;
    expiresAt: Date;
  }) => {
    return prisma.emailVerificationToken.create({ data });
  },
  findEmailVerificationToken: (token: string) => {
    return prisma.emailVerificationToken.findUnique({ where: { token } });
  },
  deleteEmailVerificationToken: (token: string) => {
    return prisma.emailVerificationToken.delete({ where: { token } });
  },
  findValidEmailVerificationTokenForUser: (userId: string) => {
    return prisma.emailVerificationToken.findFirst({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { expiresAt: "desc" },
    });
  },
  deleteEmailVerificationTokensForUser: (userId: string) => {
    return prisma.emailVerificationToken.deleteMany({ where: { userId } });
  },
  createPasswordResetToken: (data: {
    userId: string;
    token: string;
    expiresAt: Date;
  }) => {
    return prisma.passwordResetToken.create({ data });
  },
  findPasswordResetToken: (token: string) => {
    return prisma.passwordResetToken.findUnique({ where: { token } });
  },
  deletePasswordResetToken: (token: string) => {
    return prisma.passwordResetToken.delete({ where: { token } });
  },
  deletePasswordResetTokensForUser: (userId: string) => {
    return prisma.passwordResetToken.deleteMany({ where: { userId } });
  },
};
