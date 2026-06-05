import { Prisma } from "@prisma/client";

import type { DatabaseTransactionClient } from "../../config/database.js";
import type { AuditAction, AuditEntityType } from "../../services/audit/index.js";
import { auditService } from "../../services/audit/index.js";

type AuditLogInput = {
  organizationId: string;
  actorUserId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export const createAuditLog = async (
  payload: AuditLogInput,
  tx?: DatabaseTransactionClient,
) => {
  return auditService.record(
    {
      organizationId: payload.organizationId,
      userId: payload.actorUserId,
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId ?? null,
      metadata: payload.metadata,
    },
    tx,
  );
};
