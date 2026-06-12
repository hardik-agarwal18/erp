
import { Request, Response } from "express";

import { authService } from "./auth.service.js";
import { emailChangeService } from "./email-change.service.js";
import { clearAuthCookies, setAuthCookies } from "../../../lib/cookies.js";
import { REFRESH_COOKIE_NAME } from "./auth.constants.js";
import ApiError from "../../../utils/ApiError.js";
import { sendSuccess } from "../../../utils/apiResponse.js";

export const authController = {
  register: async (req: Request, res: Response): Promise<Response> => {
    await authService.register(req.body);
    return sendSuccess(res, {
      statusCode: 201,
      message: "Registration successful. Please verify your email.",
    });
  },

  signup: async (req: Request, res: Response): Promise<Response> =>
    authController.register(req, res),

  login: async (req: Request, res: Response): Promise<Response> => {
    const {
      user,
      accessToken,
      refreshToken,
      csrfToken,
      organizations,
      activeOrganization,
    } = await authService.login(req.body, req);

    setAuthCookies(res, refreshToken, csrfToken);

    return sendSuccess(res, {
      message: "Login successful",
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
        },
        organizations,
        activeOrganization,
      },
    });
  },

  logout: async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    await authService.logout(
      req.user.id,
      req.cookies?.[REFRESH_COOKIE_NAME],
      req.auth,
      req.user.organizationId ?? null,
    );

    clearAuthCookies(res);

    return sendSuccess(res, { message: "Logged out" });
  },

  logoutAll: async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    await authService.logoutAll(
      req.user.id,
      req.auth,
      req.user.organizationId ?? null,
    );
    clearAuthCookies(res);
    return sendSuccess(res, { message: "Logged out from all devices" });
  },

  refresh: async (req: Request, res: Response): Promise<Response> => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    const csrfToken = req.headers["x-csrf-token"] as string | undefined;

    if (!refreshToken) {
      throw new ApiError(401, "Refresh token missing");
    }

    const tokens = await authService.refresh(refreshToken, csrfToken, req);
    setAuthCookies(res, tokens.refreshToken, tokens.csrfToken);

    return sendSuccess(res, {
      message: "Token refreshed",
      data: {
        accessToken: tokens.accessToken,
      },
    });
  },

  switchWorkspace: async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    const csrfToken = req.headers["x-csrf-token"] as string | undefined;

    if (!refreshToken) {
      throw new ApiError(401, "Refresh token missing");
    }

    const data = await authService.switchWorkspace(
      req.user.id,
      req.body.organizationId,
      refreshToken,
      csrfToken,
    );

    return sendSuccess(res, {
      message: "Workspace switched",
      data,
    });
  },

  verifyEmail: async (req: Request, res: Response): Promise<Response> => {
    const token = req.query.token as string;
    await authService.verifyEmail(token);
    return sendSuccess(res, { message: "Email verified" });
  },

  resendVerification: async (req: Request, res: Response): Promise<Response> => {
    await authService.resendVerification(req.body.email);
    return sendSuccess(res, {
      message: "If the account exists, a verification email was sent.",
    });
  },

  forgotPassword: async (req: Request, res: Response): Promise<Response> => {
    await authService.forgotPassword(req.body.email);
    return sendSuccess(res, {
      message: "If the account exists, a reset email was sent.",
    });
  },

  resetPassword: async (req: Request, res: Response): Promise<Response> => {
    await authService.resetPassword(req.body.token, req.body.password);
    return sendSuccess(res, { message: "Password updated" });
  },

  updateProfile: async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    // Ignore email here, handled by requestEmailChange
    const { name } = req.body;
    const updatedUser = await authService.updateProfile(req.user.id, { name });
    return sendSuccess(res, {
      message: "Profile updated successfully",
      data: updatedUser,
    });
  },

  requestEmailChange: async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }
    await emailChangeService.requestEmailChange(req.user.id, req.body.newEmail);
    return sendSuccess(res, {
      message: "Email change requested. Please check both your current and new email for OTP codes.",
    });
  },

  verifyEmailChange: async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }
    const { currentEmailOtp, newEmailOtp } = req.body;
    const updatedUser = await emailChangeService.verifyEmailChange(req.user.id, currentEmailOtp, newEmailOtp);
    return sendSuccess(res, {
      message: "Email successfully updated.",
      data: updatedUser,
    });
  },

  getMe: async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    const user = await authService.getMe(
      req.user.id,
      req.user.organizationId ?? null,
    );
    return sendSuccess(res, {
      data: user,
    });
  },
};
