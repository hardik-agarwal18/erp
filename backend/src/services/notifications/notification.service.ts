import prisma from "../../config/database.js";
import { parsePagination } from "../../shared/utils/pagination.js";

export const notificationService = {
  createNotification: async (
    organizationId: string,
    payload: {
      userId: string;
      title: string;
      message: string;
      type: "ALERT" | "REMINDER" | "SYSTEM" | "APPROVAL";
      entityType?: string;
      entityId?: string;
    }
  ) => {
    return prisma.notification.create({
      data: {
        organizationId,
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        entityType: payload.entityType,
        entityId: payload.entityId,
      },
    });
  },

  listUserNotifications: async (organizationId: string, userId: string, query: Record<string, unknown>) => {
    const pagination = parsePagination(query);
    const where = { organizationId, userId };

    const [items, total, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);

    return {
      items,
      total,
      unreadCount,
      page: pagination.page,
      limit: pagination.limit,
    };
  },

  markAsRead: async (organizationId: string, userId: string, notificationIds: string[]) => {
    return prisma.notification.updateMany({
      where: {
        organizationId,
        userId,
        id: { in: notificationIds },
      },
      data: {
        isRead: true,
      },
    });
  },

  markAllAsRead: async (organizationId: string, userId: string) => {
    return prisma.notification.updateMany({
      where: {
        organizationId,
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  },
};
