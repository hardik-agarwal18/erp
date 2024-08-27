import { jest } from "@jest/globals";
import { Request, Response } from "express";

import { authController } from "../../../src/modules/auth/auth.controller.js";
import { authService } from "../../../src/modules/auth/auth.service.js";
import { setAuthCookies, clearAuthCookies } from "../../../src/lib/cookies.js";

jest.mock("../../../src/modules/auth/auth.service.js");
jest.mock("../../../src/lib/cookies.js");

import ApiError from "../../../src/utils/ApiError.js";

describe("authController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      cookies: {},
      headers: {},
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Partial<Response>;
  });

  describe("register & signup", () => {
    it("should call authService.register and return 201", async () => {
      req.body = { email: "test@example.com", password: "password", name: "Test User" };
      
      await authController.register(req as Request, res as Response);
      
      expect(authService.register).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: "Registration successful. Please verify your email.",
      }));
    });

    it("should alias signup to register", async () => {
      req.body = { email: "test@example.com", password: "password", name: "Test User" };
      await authController.signup(req as Request, res as Response);
      expect(authService.register).toHaveBeenCalledWith(req.body);
    });
  });

  describe("login", () => {
    it("should login user and set auth cookies", async () => {
      req.body = { email: "test@example.com", password: "password" };
      const mockLoginResponse = {
        user: { id: "u1", name: "User", email: "test@example.com", isVerified: true },
        accessToken: "access-token",
        refreshToken: "refresh-token",
        csrfToken: "csrf-token",
        organizations: [],
        activeOrganization: null,
      };

      (authService.login as jest.Mock).mockResolvedValue(mockLoginResponse);

      await authController.login(req as Request, res as Response);

      expect(authService.login).toHaveBeenCalledWith(req.body, req);
      expect(setAuthCookies).toHaveBeenCalledWith(res, "refresh-token", "csrf-token");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: "Login successful",
        data: expect.objectContaining({
          accessToken: "access-token",
          user: expect.objectContaining({ id: "u1" })
        }),
      }));
    });
  });

  describe("logout", () => {
    it("should throw 401 if user is not attached", async () => {
      req.user = undefined;
      await expect(authController.logout(req as Request, res as Response)).rejects.toThrow(ApiError);
    });

    it("should call authService.logout and clear cookies", async () => {
      req.user = { id: "u1", organizationId: "org1" } as any;
      req.cookies = { refreshToken: "rt" };
      req.auth = { jti: "token-id" } as any;

      await authController.logout(req as Request, res as Response);

      expect(authService.logout).toHaveBeenCalledWith("u1", "rt", req.auth, "org1");
      expect(clearAuthCookies).toHaveBeenCalledWith(res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: "Logged out"
      }));
    });
  });

  describe("logoutAll", () => {
    it("should throw 401 if user is not attached", async () => {
      req.user = undefined;
      await expect(authController.logoutAll(req as Request, res as Response)).rejects.toThrow(ApiError);
    });

    it("should call authService.logoutAll and clear cookies", async () => {
      req.user = { id: "u1", organizationId: "org1" } as any;
      req.auth = { jti: "token-id" } as any;

      await authController.logoutAll(req as Request, res as Response);

      expect(authService.logoutAll).toHaveBeenCalledWith("u1", req.auth, "org1");
      expect(clearAuthCookies).toHaveBeenCalledWith(res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: "Logged out from all devices"
      }));
    });
  });

  describe("refresh", () => {
    it("should throw 401 if refresh token missing", async () => {
      req.cookies = {};
      await expect(authController.refresh(req as Request, res as Response)).rejects.toThrow(ApiError);
    });

    it("should refresh tokens and set cookies", async () => {
      req.cookies = { refreshToken: "rt" };
      req.headers = { "x-csrf-token": "csrf" };

      (authService.refresh as jest.Mock).mockResolvedValue({
        accessToken: "new-access",
        refreshToken: "new-refresh",
        csrfToken: "new-csrf"
      });

      await authController.refresh(req as Request, res as Response);

      expect(authService.refresh).toHaveBeenCalledWith("rt", "csrf", req);
      expect(setAuthCookies).toHaveBeenCalledWith(res, "new-refresh", "new-csrf");
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: { accessToken: "new-access" }
      }));
    });
  });

  describe("switchWorkspace", () => {
    it("should throw 401 if user missing", async () => {
      await expect(authController.switchWorkspace(req as Request, res as Response)).rejects.toThrow(ApiError);
    });

    it("should throw 401 if refresh token missing", async () => {
      req.user = { id: "u1" } as any;
      req.cookies = {};
      await expect(authController.switchWorkspace(req as Request, res as Response)).rejects.toThrow(ApiError);
    });

    it("should call authService.switchWorkspace", async () => {
      req.user = { id: "u1" } as any;
      req.cookies = { refreshToken: "rt" };
      req.headers = { "x-csrf-token": "csrf" };
      req.body = { organizationId: "org2" };

      (authService.switchWorkspace as jest.Mock).mockResolvedValue({
        accessToken: "new-access"
      });

      await authController.switchWorkspace(req as Request, res as Response);

      expect(authService.switchWorkspace).toHaveBeenCalledWith("u1", "org2", "rt", "csrf");
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: "Workspace switched"
      }));
    });
  });

  describe("verifyEmail", () => {
    it("should verify email with token", async () => {
      req.query = { token: "token123" };
      await authController.verifyEmail(req as Request, res as Response);
      expect(authService.verifyEmail).toHaveBeenCalledWith("token123");
    });
  });

  describe("resendVerification", () => {
    it("should call resendVerification", async () => {
      req.body = { email: "test@example.com" };
      await authController.resendVerification(req as Request, res as Response);
      expect(authService.resendVerification).toHaveBeenCalledWith("test@example.com");
    });
  });

  describe("forgotPassword", () => {
    it("should call forgotPassword", async () => {
      req.body = { email: "test@example.com" };
      await authController.forgotPassword(req as Request, res as Response);
      expect(authService.forgotPassword).toHaveBeenCalledWith("test@example.com");
    });
  });

  describe("resetPassword", () => {
    it("should call resetPassword", async () => {
      req.body = { token: "token123", password: "newpassword" };
      await authController.resetPassword(req as Request, res as Response);
      expect(authService.resetPassword).toHaveBeenCalledWith("token123", "newpassword");
    });
  });

  describe("getMe", () => {
    it("should throw 401 if user missing", async () => {
      await expect(authController.getMe(req as Request, res as Response)).rejects.toThrow(ApiError);
    });

    it("should call getMe with user id and org id", async () => {
      req.user = { id: "u1", organizationId: "org1" } as any;
      (authService.getMe as jest.Mock).mockResolvedValue({ id: "u1", name: "Test" } as any);

      await authController.getMe(req as Request, res as Response);

      expect(authService.getMe).toHaveBeenCalledWith("u1", "org1");
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ id: "u1" })
      }));
    });
  });
});
