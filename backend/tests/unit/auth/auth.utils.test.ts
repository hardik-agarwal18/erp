import { jest } from "@jest/globals";
import { Request } from "express";

jest.mock("../../../src/config/env.js", () => ({
  env: {
    APP_URL: "http://localhost:5000",
    NODE_ENV: "test",
  },
}));

import {
  hashToken,
  getRequestMetadata,
  buildVerificationUrl,
  buildPasswordResetUrl,
  buildInvitationUrl,
} from "../../../src/domains/iam/auth/auth.utils.js";

describe("auth.utils", () => {
  // ── hashToken ─────────────────────────────────────────────────────────────
  describe("hashToken()", () => {
    it("should return a SHA-256 hex string for any input", () => {
      const hash = hashToken("my-secret-token");
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should produce the same hash for the same input (deterministic)", () => {
      expect(hashToken("abc")).toBe(hashToken("abc"));
    });

    it("should produce different hashes for different inputs", () => {
      expect(hashToken("token-A")).not.toBe(hashToken("token-B"));
    });

    it("should handle an empty string without throwing", () => {
      expect(() => hashToken("")).not.toThrow();
      expect(hashToken("")).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  // ── getRequestMetadata ────────────────────────────────────────────────────
  describe("getRequestMetadata()", () => {
    it("should return device from user-agent header when present", () => {
      const req = {
        get: (header: string) => header === "user-agent" ? "Mozilla/5.0" : undefined,
        ip: "127.0.0.1",
      } as unknown as Request;

      const result = getRequestMetadata(req);

      expect(result.device).toBe("Mozilla/5.0");
      expect(result.ipAddress).toBe("127.0.0.1");
    });

    it("should return 'unknown' as device when user-agent header is absent", () => {
      const req = {
        get: (_header: string) => undefined,
        ip: "192.168.1.1",
      } as unknown as Request;

      const result = getRequestMetadata(req);

      expect(result.device).toBe("unknown");
      expect(result.ipAddress).toBe("192.168.1.1");
    });

    it("should include ipAddress from req.ip", () => {
      const req = {
        get: () => "PostmanRuntime/7.0",
        ip: "10.0.0.1",
      } as unknown as Request;

      expect(getRequestMetadata(req).ipAddress).toBe("10.0.0.1");
    });
  });

  // ── buildVerificationUrl ──────────────────────────────────────────────────
  describe("buildVerificationUrl()", () => {
    it("should build the correct URL with encoded token", () => {
      const url = buildVerificationUrl("my.token+special=");
      expect(url).toBe(
        "http://localhost:5000/verify-email?token=my.token%2Bspecial%3D",
      );
    });

    it("should include the APP_URL as base", () => {
      expect(buildVerificationUrl("t")).toContain("http://localhost:5000");
    });
  });

  // ── buildPasswordResetUrl ─────────────────────────────────────────────────
  describe("buildPasswordResetUrl()", () => {
    it("should build the correct reset URL with encoded token", () => {
      const url = buildPasswordResetUrl("reset.token+value=");
      expect(url).toBe(
        "http://localhost:5000/reset-password?token=reset.token%2Bvalue%3D",
      );
    });
  });

  // ── buildInvitationUrl ────────────────────────────────────────────────────
  describe("buildInvitationUrl()", () => {
    it("should build the correct invitation URL with encoded token", () => {
      const url = buildInvitationUrl("invite.token/abc");
      expect(url).toBe(
        "http://localhost:5000/accept-invitation?token=invite.token%2Fabc",
      );
    });
  });
});
