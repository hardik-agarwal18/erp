import { jest } from "@jest/globals";

// ── Mock the repository ──────────────────────────────────────────────────────
jest.mock("../../../src/services/audit/audit.repository.js", () => ({
  auditRepository: {
    create: jest.fn(),
    listOrganizationLogs: jest.fn(),
  },
}));

jest.mock("../../../src/services/audit/audit.constants.js", () => ({
  AUDIT_ACTIONS: {
    CUSTOMER_CREATED: "customer.created",
    LOGIN: "auth.login",
    LOGIN_FAILED: "auth.login.failed",
  },
  AUDIT_ENTITY_TYPES: {
    CUSTOMER: "customer",
    AUTH: "auth",
  },
}));

import { auditRepository } from "../../../src/services/audit/audit.repository.js";
import { auditService } from "../../../src/services/audit/audit.service.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../../../src/services/audit/audit.constants.js";

const basePayload = {
  organizationId: "org-1",
  userId: "user-1",
  entityType: AUDIT_ENTITY_TYPES.CUSTOMER,
  entityId: "cust-1",
  action: AUDIT_ACTIONS.CUSTOMER_CREATED,
};

describe("auditService", () => {
  beforeEach(() => jest.clearAllMocks());

  // ── record ──────────────────────────────────────────────────────────────
  describe("record()", () => {
    it("should delegate to auditRepository.create with the exact payload", async () => {
      (auditRepository.create as jest.Mock).mockResolvedValue({ id: "log-1" });

      await auditService.record(basePayload);

      expect(auditRepository.create).toHaveBeenCalledWith(basePayload, undefined);
    });

    it("should pass the tx client to auditRepository.create when provided", async () => {
      (auditRepository.create as jest.Mock).mockResolvedValue({ id: "log-2" });
      const mockTx = { auditLog: { create: jest.fn() } } as any;

      await auditService.record(basePayload, mockTx);

      expect(auditRepository.create).toHaveBeenCalledWith(basePayload, mockTx);
    });

    it("should propagate database errors from auditRepository.create", async () => {
      (auditRepository.create as jest.Mock).mockRejectedValue(new Error("DB Error"));

      await expect(auditService.record(basePayload)).rejects.toThrow("DB Error");
    });
  });

  // ── recordIfContext ──────────────────────────────────────────────────────
  describe("recordIfContext()", () => {
    it("should return null without calling repository when organizationId is missing", async () => {
      const result = await auditService.recordIfContext({
        organizationId: null,
        userId: "user-1",
        entityType: AUDIT_ENTITY_TYPES.CUSTOMER,
        action: AUDIT_ACTIONS.CUSTOMER_CREATED,
      });

      expect(result).toBeNull();
      expect(auditRepository.create).not.toHaveBeenCalled();
    });

    it("should return null without calling repository when userId is missing", async () => {
      const result = await auditService.recordIfContext({
        organizationId: "org-1",
        userId: null,
        entityType: AUDIT_ENTITY_TYPES.CUSTOMER,
        action: AUDIT_ACTIONS.CUSTOMER_CREATED,
      });

      expect(result).toBeNull();
      expect(auditRepository.create).not.toHaveBeenCalled();
    });

    it("should return null when both organizationId and userId are missing", async () => {
      const result = await auditService.recordIfContext({
        entityType: AUDIT_ENTITY_TYPES.CUSTOMER,
        action: AUDIT_ACTIONS.CUSTOMER_CREATED,
      });

      expect(result).toBeNull();
    });

    it("should call auditRepository.create when both organizationId and userId are present", async () => {
      (auditRepository.create as jest.Mock).mockResolvedValue({ id: "log-3" });

      await auditService.recordIfContext({
        organizationId: "org-1",
        userId: "user-1",
        entityType: AUDIT_ENTITY_TYPES.CUSTOMER,
        action: AUDIT_ACTIONS.CUSTOMER_CREATED,
        entityId: "cust-1",
        metadata: { extra: "data" },
      });

      expect(auditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: "org-1",
          userId: "user-1",
        }),
        undefined,
      );
    });
  });

  // ── recordAuthEvent ──────────────────────────────────────────────────────
  describe("recordAuthEvent()", () => {
    it("should record an AUTH entity type event when org and user IDs are present", async () => {
      (auditRepository.create as jest.Mock).mockResolvedValue({ id: "log-4" });

      await auditService.recordAuthEvent({
        action: AUDIT_ACTIONS.LOGIN,
        organizationId: "org-1",
        userId: "user-1",
      });

      expect(auditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: AUDIT_ENTITY_TYPES.AUTH,
          entityId: "user-1",
        }),
        undefined,
      );
    });

    it("should return null when organization context is missing", async () => {
      const result = await auditService.recordAuthEvent({
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        organizationId: null,
        userId: "user-1",
      });

      expect(result).toBeNull();
    });

    it("should return null when user context is missing", async () => {
      const result = await auditService.recordAuthEvent({
        action: AUDIT_ACTIONS.LOGIN,
        organizationId: "org-1",
        userId: null,
      });

      expect(result).toBeNull();
    });

    it("should include metadata in the audit record", async () => {
      (auditRepository.create as jest.Mock).mockResolvedValue({ id: "log-5" });

      await auditService.recordAuthEvent({
        action: AUDIT_ACTIONS.LOGIN,
        organizationId: "org-1",
        userId: "user-1",
        metadata: { ip: "127.0.0.1" },
      });

      expect(auditRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: { ip: "127.0.0.1" } }),
        undefined,
      );
    });
  });
});
