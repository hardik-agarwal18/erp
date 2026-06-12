
import { Prisma } from "@prisma/client";

import prisma, {
  type DatabaseTransactionClient,
} from "../../config/database.js";
import type { AuditAction, AuditEntityType } from "./audit.constants.js";

export type CreateAuditLogRecordInput = {
  action: AuditAction;
  entityId?: string | null;
  entityType: AuditEntityType;
  metadata?: Prisma.InputJsonValue;
  organizationId: string;
  userId: string;
};

const resolveClient = (tx?: DatabaseTransactionClient) => tx ?? prisma;

export const auditRepository = {
  create: (
    payload: CreateAuditLogRecordInput,
    tx?: DatabaseTransactionClient,
  ) => {
    return resolveClient(tx).auditLog.create({
      data: {
        organizationId: payload.organizationId,
        actorUserId: payload.userId,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId ?? null,
        metadata: payload.metadata,
      },
    });
  },
  listOrganizationLogs: async (organizationId: string, query: any = {}) => {
    return resolveClient().auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: query.limit ? Number(query.limit) : 100,
      include: {
        actor: { select: { name: true, email: true } },
      }
    });
  },
};

export default auditRepository;
