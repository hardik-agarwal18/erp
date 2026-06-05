import { jest } from "@jest/globals";

jest.mock("../../../src/services/audit/index.js", () => ({
  AUDIT_ACTIONS: {
    CUSTOMER_CREATED: "customer.created",
  },
  AUDIT_ENTITY_TYPES: {
    CUSTOMER: "customer",
    AUTH: "auth",
  },
  auditService: {
    record: jest.fn(),
  },
}));

// Mock database client (for the tx param)
jest.mock("../../../src/config/database.js", () => ({
  default: {},
}));

import { auditService } from "../../../src/services/audit/index.js";
import { createAuditLog } from "../../../src/shared/utils/audit.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../../../src/services/audit/index.js";

describe("createAuditLog", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("Happy path", () => {
    it("should call auditService.record with correctly mapped fields", async () => {
      (auditService.record as jest.Mock).mockResolvedValue({ id: "log-1" });

      await createAuditLog({
        organizationId: "org-1",
        actorUserId: "user-1",
        action: AUDIT_ACTIONS.CUSTOMER_CREATED,
        entityType: AUDIT_ENTITY_TYPES.CUSTOMER,
        entityId: "cust-1",
        metadata: { reason: "test" },
      });

      expect(auditService.record).toHaveBeenCalledWith(
        {
          organizationId: "org-1",
          userId: "user-1",
          action: AUDIT_ACTIONS.CUSTOMER_CREATED,
          entityType: AUDIT_ENTITY_TYPES.CUSTOMER,
          entityId: "cust-1",
          metadata: { reason: "test" },
        },
        undefined,
      );
    });

    it("should pass the tx client when provided", async () => {
      (auditService.record as jest.Mock).mockResolvedValue({ id: "log-2" });
      const mockTx = {} as any;

      await createAuditLog(
        {
          organizationId: "org-1",
          actorUserId: "user-1",
          action: AUDIT_ACTIONS.CUSTOMER_CREATED,
          entityType: AUDIT_ENTITY_TYPES.CUSTOMER,
        },
        mockTx,
      );

      expect(auditService.record).toHaveBeenCalledWith(expect.anything(), mockTx);
    });
  });

  describe("entityId handling", () => {
    it("should default entityId to null when not provided", async () => {
      (auditService.record as jest.Mock).mockResolvedValue({ id: "log-3" });

      await createAuditLog({
        organizationId: "org-1",
        actorUserId: "user-1",
        action: AUDIT_ACTIONS.CUSTOMER_CREATED,
        entityType: AUDIT_ENTITY_TYPES.CUSTOMER,
        // entityId omitted
      });

      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ entityId: null }),
        undefined,
      );
    });

    it("should default entityId to null when explicitly undefined", async () => {
      (auditService.record as jest.Mock).mockResolvedValue({ id: "log-4" });

      await createAuditLog({
        organizationId: "org-1",
        actorUserId: "user-1",
        action: AUDIT_ACTIONS.CUSTOMER_CREATED,
        entityType: AUDIT_ENTITY_TYPES.CUSTOMER,
        entityId: undefined,
      });

      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ entityId: null }),
        undefined,
      );
    });
  });

  describe("Error propagation", () => {
    it("should rethrow errors from auditService.record", async () => {
      (auditService.record as jest.Mock).mockRejectedValue(new Error("DB failure"));

      await expect(
        createAuditLog({
          organizationId: "org-1",
          actorUserId: "user-1",
          action: AUDIT_ACTIONS.CUSTOMER_CREATED,
          entityType: AUDIT_ENTITY_TYPES.CUSTOMER,
        }),
      ).rejects.toThrow("DB failure");
    });
  });
});
