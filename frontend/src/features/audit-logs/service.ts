import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import type { ApiResponse } from "@/api/types";
import type { AuditLog } from "./types";

type BackendAuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: { name: string; email: string };
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  details?: any;
};

export async function getAuditLogs(organizationId: string) {
  const response = await apiClient.get<ApiResponse<BackendAuditLog[]>>(
    apiEndpoints.auditLogs.list(organizationId)
  );

  return response.data.data.map((log) => ({
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    actorName: log.actor?.name || "System",
    actorEmail: log.actor?.email || "system@local",
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    createdAt: log.createdAt,
    details: log.details,
  } as AuditLog));
}
