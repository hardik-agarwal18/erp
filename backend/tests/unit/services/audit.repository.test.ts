import { jest } from "@jest/globals";

// ── Hoist mock functions BEFORE any imports ──────────────────────────────────
const mockAuditLogCreate = jest.fn();
const mockAuditLogFindMany = jest.fn();

jest.mock("../../../src/config/database.js", () => ({
  __esModule: true,
  default: {
    auditLog: {
      create: mockAuditLogCreate,
      findMany: mockAuditLogFindMany,
    },
  },
}));

jest.mock("../../../src/services/audit/audit.constants.js", () => ({
  AUDIT_ACTIONS: { CUSTOMER_CREATED: "customer.created" },
  AUDIT_ENTITY_TYPES: { CUSTOMER: "customer" },
}));

import { auditRepository } from "../../../src/services/audit/audit.repository.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../../../src/services/audit/audit.constants.js";

const basePayload = {
  organizationId: "org-1",
  userId: "user-1",
  entityType: AUDIT_ENTITY_TYPES.CUSTOMER,
  entityId: "cust-1",
  action: AUDIT_ACTIONS.CUSTOMER_CREATED,
  metadata: { note: "test" },
};

describe("auditRepository", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("create()", () => {
    it("should call prisma.auditLog.create with correct data", async () => {
      mockAuditLogCreate.mockResolvedValue({ id: "log-1" });

      const result = await auditRepository.create(basePayload);

      expect(mockAuditLogCreate).toHaveBeenCalledWith({
        data: {
          organizationId: "org-1",
          actorUserId: "user-1",
          action: AUDIT_ACTIONS.CUSTOMER_CREATED,
          entityType: AUDIT_ENTITY_TYPES.CUSTOMER,
          entityId: "cust-1",
          metadata: { note: "test" },
        },
      });
      expect(result).toEqual({ id: "log-1" });
    });

    it("should default entityId to null when not provided", async () => {
      mockAuditLogCreate.mockResolvedValue({ id: "log-2" });

      await auditRepository.create({ ...basePayload, entityId: undefined });

      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ entityId: null }),
        }),
      );
    });

    it("should use the provided tx client instead of prisma", async () => {
      const mockTxCreate = jest.fn().mockResolvedValue({ id: "log-tx" });
      const mockTx = {
        auditLog: { create: mockTxCreate },
      } as any;

      await auditRepository.create(basePayload, mockTx);

      expect(mockTxCreate).toHaveBeenCalled();
      expect(mockAuditLogCreate).not.toHaveBeenCalled();
    });

    it("should propagate database errors", async () => {
      mockAuditLogCreate.mockRejectedValue(new Error("DB failure"));

      await expect(auditRepository.create(basePayload)).rejects.toThrow("DB failure");
    });
  });

  describe("listOrganizationLogs()", () => {
    it("should return logs for the organization ordered by createdAt desc", async () => {
      mockAuditLogFindMany.mockResolvedValue([{ id: "log-1" }]);

      const result = await auditRepository.listOrganizationLogs("org-1");

      expect(mockAuditLogFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: "org-1" },
          orderBy: { createdAt: "desc" },
        }),
      );
      expect(result).toHaveLength(1);
    });

    it("should apply a custom limit from query", async () => {
      mockAuditLogFindMany.mockResolvedValue([]);

      await auditRepository.listOrganizationLogs("org-1", { limit: "50" });

      expect(mockAuditLogFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 50 }),
      );
    });

    it("should default to take:100 when limit is not specified", async () => {
      mockAuditLogFindMany.mockResolvedValue([]);

      await auditRepository.listOrganizationLogs("org-1");

      expect(mockAuditLogFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });
  });
});
