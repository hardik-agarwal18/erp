import { jest } from "@jest/globals";

// Mocking dependencies
import { authRepository } from "../../../src/modules/auth/auth.repository.js";
import { redisClient } from "../../../src/config/redis.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../../../src/services/mail/index.js";
import { auditService } from "../../../src/services/audit/index.js";
import { comparePassword, hashPassword } from "../../../src/lib/bcrypt.js";
import { verifyToken } from "../../../src/lib/jwt.js";
import { generateAccessToken, generateEmailVerificationToken, generatePasswordResetToken, generateRefreshToken } from "../../../src/modules/auth/auth.tokens.js";

jest.mock("../../../src/modules/auth/auth.repository.js");
jest.mock("../../../src/queue/connection.js", () => ({
  queueConnection: { duplicate: jest.fn().mockReturnThis() },
}));
jest.mock("../../../src/queue/queue.service.js", () => ({
  mailQueue: { add: jest.fn() },
  pdfGenerationQueue: { add: jest.fn() },
  storageCleanupQueue: { add: jest.fn() },
  reportsQueue: { add: jest.fn() },
  auditExportsQueue: { add: jest.fn() },
}));
jest.mock("../../../src/config/redis.js", () => ({
  redisClient: {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  }
}));
jest.mock("../../../src/services/mail/index.js");
jest.mock("../../../src/services/audit/index.js", () => ({
  AUDIT_ACTIONS: {
    AUTH_REGISTER: "auth.register",
    AUTH_LOGIN: "auth.login",
    AUTH_LOGOUT: "auth.logout",
    AUTH_LOGOUT_ALL: "auth.logout_all",
    AUTH_WORKSPACE_SWITCHED: "auth.workspace_switched",
  },
  auditService: {
    recordAuthEvent: jest.fn(),
  }
}));
jest.mock("../../../src/lib/bcrypt.js");
jest.mock("../../../src/lib/jwt.js");
jest.mock("../../../src/modules/auth/auth.tokens.js");
jest.mock("../../../src/config/env.js", () => ({
  env: {
    EMAIL_VERIFY_SECRET: "test-secret",
    PASSWORD_RESET_SECRET: "test-secret",
    JWT_REFRESH_SECRET: "test-secret",
  }
}));
jest.mock("../../../src/modules/auth/auth.utils.js", () => ({
  hashToken: jest.fn().mockReturnValue("mocked-hash"),
  getRequestMetadata: jest.fn().mockReturnValue({ device: "TestAgent", ipAddress: "127.0.0.1" }),
  buildVerificationUrl: jest.fn().mockReturnValue("http://localhost/verify"),
  buildPasswordResetUrl: jest.fn().mockReturnValue("http://localhost/reset"),
  buildInvitationUrl: jest.fn().mockReturnValue("http://localhost/invite"),
}));

import { authService } from "../../../src/modules/auth/auth.service.js";
import ApiError from "../../../src/utils/ApiError.js";

describe("authService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should throw 409 if email already in use", async () => {
      (authRepository.findUserByEmail as jest.Mock).mockResolvedValue({ id: "u1" });

      await expect(authService.register({ name: "User", email: "test@example.com", password: "pwd" }))
        .rejects.toThrow(ApiError);
    });

    it("should create a user, verification token, and send email", async () => {
      (authRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue("hashedPwd");
      (authRepository.createUser as jest.Mock).mockResolvedValue({ id: "u1", email: "test@example.com", name: "User" });
      (generateEmailVerificationToken as jest.Mock).mockReturnValue("email-token");

      const user = await authService.register({ name: "User", email: "test@example.com", password: "pwd" });

      expect(authRepository.createUser).toHaveBeenCalledWith({ name: "User", email: "test@example.com", password: "hashedPwd" });
      expect(authRepository.createEmailVerificationToken).toHaveBeenCalled();
      expect(sendVerificationEmail).toHaveBeenCalled();
      expect(auditService.recordAuthEvent).toHaveBeenCalled();
      expect(user.id).toBe("u1");
    });
  });

  describe("login", () => {
    it("should throw 401 if user not found", async () => {
      (authRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);
      await expect(authService.login({ email: "x", password: "y" }, {} as any)).rejects.toThrow(ApiError);
    });

    it("should throw 401 if password mismatch", async () => {
      (authRepository.findUserByEmail as jest.Mock).mockResolvedValue({ password: "hashed" });
      (comparePassword as jest.Mock).mockResolvedValue(false);
      await expect(authService.login({ email: "x", password: "y" }, {} as any)).rejects.toThrow(ApiError);
    });

    it("should throw 403 if email not verified", async () => {
      (authRepository.findUserByEmail as jest.Mock).mockResolvedValue({ password: "hashed", isVerified: false });
      (comparePassword as jest.Mock).mockResolvedValue(true);
      await expect(authService.login({ email: "x", password: "y" }, {} as any)).rejects.toThrow(ApiError);
    });

    it("should return tokens and user info on success", async () => {
      (authRepository.findUserByEmail as jest.Mock).mockResolvedValue({ id: "u1", password: "hashed", isVerified: true });
      (comparePassword as jest.Mock).mockResolvedValue(true);
      (authRepository.listUserMemberships as jest.Mock).mockResolvedValue([{
        id: "m1", roleId: "r1", role: { name: "admin" },
        organization: { id: "o1", name: "Org", slug: "org", logo: null, ownerId: "u1", createdAt: new Date() }
      }]);
      (authRepository.findMembership as jest.Mock).mockResolvedValue({
        id: "m1", roleId: "r1", role: { name: "admin" }, organizationId: "o1",
        organization: { id: "o1", name: "Org", slug: "org", logo: null, ownerId: "u1", createdAt: new Date() }
      });
      (authRepository.createRefreshSession as jest.Mock).mockResolvedValue({});
      (redisClient.set as jest.Mock).mockResolvedValue("OK");

      (generateAccessToken as jest.Mock).mockReturnValue({ token: "access", jti: "jti-1" });
      (generateRefreshToken as jest.Mock).mockReturnValue("refresh");

      const req = {
        get: (header: string) => header === "user-agent" ? "TestAgent/1.0" : undefined,
        ip: "127.0.0.1",
        headers: {},
      } as any;

      const result = await authService.login({ email: "x", password: "y" }, req);

      expect(result.accessToken).toBe("access");
      expect(result.refreshToken).toBe("refresh");
      expect(result.activeOrganization?.id).toBe("o1");
    });
  });
});
