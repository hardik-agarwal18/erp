
import { Prisma } from "@prisma/client";

import type { DatabaseTransactionClient } from "../../config/database.js";
import { auditRepository } from "./audit.repository.js";
import {
  AUDIT_ENTITY_TYPES,
  type AuditAction,
  type AuditEntityType,
} from "./audit.constants.js";

export type AuditLogInput = {
  organizationId: string;
  userId: string;
  entityType: AuditEntityType;
  entityId?: string | null;
  action: AuditAction;
  metadata?: Prisma.InputJsonValue;
};

export type OptionalAuditLogInput = {
  organizationId?: string | null;
  userId?: string | null;
  entityType: AuditEntityType;
  entityId?: string | null;
  action: AuditAction;
  metadata?: Prisma.InputJsonValue;
};

/**
 * Centralized audit logging service for tenant-aware ERP events.
 */
export const auditService = {
  /**
   * Persists a required audit event.
   */
  record: (
    payload: AuditLogInput,
    tx?: DatabaseTransactionClient,
  ) => {
    return auditRepository.create(payload, tx);
  },

  /**
   * Persists an audit event only when tenant and actor context are available.
   */
  recordIfContext: (
    payload: OptionalAuditLogInput,
    tx?: DatabaseTransactionClient,
  ) => {
    if (!payload.organizationId || !payload.userId) {
      return Promise.resolve(null);
    }

    return auditService.record(
      {
        organizationId: payload.organizationId,
        userId: payload.userId,
        entityType: payload.entityType,
        entityId: payload.entityId,
        action: payload.action,
        metadata: payload.metadata,
      },
      tx,
    );
  },

  /**
   * Records authentication-related events when tenant context is known.
   */
  recordAuthEvent: (
    payload: {
      action: AuditAction;
      organizationId?: string | null;
      userId?: string | null;
      metadata?: Prisma.InputJsonValue;
    },
    tx?: DatabaseTransactionClient,
  ) => {
    return auditService.recordIfContext(
      {
        organizationId: payload.organizationId,
        userId: payload.userId,
        entityType: AUDIT_ENTITY_TYPES.AUTH,
        entityId: payload.userId ?? null,
        action: payload.action,
        metadata: payload.metadata,
      },
      tx,
    );
  },
};

export default auditService;
