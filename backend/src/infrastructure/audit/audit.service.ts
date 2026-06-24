import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

import crypto from "crypto";

export interface AuditLogPayload {
  organizationId: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  correlationId?: string;
  rootCorrelationId?: string;
  ipAddress?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
}

export const auditService = {
  log: async (payload: AuditLogPayload) => {
    try {
      // Find the previous hash in the organization chain
      const lastLog = await prisma.auditLog.findFirst({
        where: { organizationId: payload.organizationId },
        orderBy: { createdAt: "desc" },
        select: { hash: true },
      });

      const previousHash = lastLog?.hash || null;
      const timestamp = new Date().toISOString();

      // Hash = hash(previousHash + timestamp + action + entityId + oldValues + newValues)
      const dataToHash = [
        previousHash || "",
        timestamp,
        payload.action,
        payload.entityId || "",
        JSON.stringify(payload.oldValues || {}),
        JSON.stringify(payload.newValues || {}),
      ].join("|");

      const hash = crypto.createHash("sha256").update(dataToHash).digest("hex");

      await prisma.auditLog.create({
        data: {
          organizationId: payload.organizationId,
          actorUserId: payload.actorUserId,
          action: payload.action,
          entityType: payload.entityType,
          entityId: payload.entityId,
          correlationId: payload.correlationId,
          rootCorrelationId: payload.rootCorrelationId,
          ipAddress: payload.ipAddress,
          oldValues: payload.oldValues as Prisma.InputJsonValue | undefined,
          newValues: payload.newValues as Prisma.InputJsonValue | undefined,
          metadata: payload.metadata as Prisma.InputJsonValue | undefined,
          previousHash,
          hash,
        },
      });
    } catch (error) {
      // In production, we might want to push this to a dead-letter queue or alert
      // We don't throw here to prevent audit failures from failing business transactions
      console.error("[AuditService] Failed to persist audit log:", error);
    }
  },

  getLogs: async (organizationId: string, filters?: { entityType?: string, entityId?: string, action?: string }, limit = 100) => {
    return prisma.auditLog.findMany({
      where: {
        organizationId,
        ...(filters?.entityType && { entityType: filters.entityType }),
        ...(filters?.entityId && { entityId: filters.entityId }),
        ...(filters?.action && { action: filters.action }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        actor: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true }
        }
      }
    });
  }
};
