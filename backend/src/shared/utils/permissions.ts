import prisma from "../../config/database.js";
import { redisClient } from "../../redis/redisClient.js";

const PERMISSION_CACHE_TTL_SECONDS = 5 * 60;

const permissionCacheKey = (memberId: string) => `member-permissions:${memberId}`;

export const getCachedMemberPermissions = async (memberId: string) => {
  const cached = await redisClient.get(permissionCacheKey(memberId));
  if (cached) {
    return JSON.parse(cached) as string[];
  }

  const member = await prisma.organizationMember.findUnique({
    where: { id: memberId },
    select: {
      role: {
        select: {
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
      },
    },
  });

  const permissions =
    member?.role.rolePermissions.map(
      (rolePermission) => rolePermission.permission.name,
    ) ?? [];

  await redisClient.set(permissionCacheKey(memberId), JSON.stringify(permissions), {
    EX: PERMISSION_CACHE_TTL_SECONDS,
  });

  return permissions;
};

export const clearMemberPermissionCache = async (memberId: string) => {
  await redisClient.del(permissionCacheKey(memberId));
};

export const clearMembersPermissionCache = async (memberIds: string[]) => {
  if (memberIds.length === 0) {
    return;
  }

  await redisClient.del(memberIds.map((memberId) => permissionCacheKey(memberId)));
};
