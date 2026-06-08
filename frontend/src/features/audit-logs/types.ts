export type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorName: string;
  actorEmail: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  details?: Record<string, any>;
};
