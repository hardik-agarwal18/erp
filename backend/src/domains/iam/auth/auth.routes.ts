
import { Router } from "express";

import asyncHandler from "../../../utils/asyncHandler.js";
import { validate } from "../../../middleware/validate.middleware.js";
import { authController } from "./auth.controller.js";
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  switchWorkspaceSchema,
  updateProfileSchema,
  requestEmailChangeSchema,
  verifyEmailChangeSchema,
  verifyEmailSchema,
} from "./auth.validators.js";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { requireRefreshToken } from "./auth.middleware.js";

const router = Router();

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(authController.register),
);
router.post(
  "/signup",
  validate(registerSchema),
  asyncHandler(authController.signup),
);
router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(authController.login),
);
router.post("/logout", authMiddleware, asyncHandler(authController.logout));
router.post(
  "/logout-all",
  authMiddleware,
  asyncHandler(authController.logoutAll),
);
router.post(
  "/refresh",
  requireRefreshToken,
  validate(refreshTokenSchema),
  asyncHandler(authController.refresh),
);
router.post(
  "/switch-workspace",
  authMiddleware,
  requireRefreshToken,
  validate(refreshTokenSchema),
  validate(switchWorkspaceSchema),
  asyncHandler(authController.switchWorkspace),
);
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);
router.get(
  "/verify-email",
  validate(verifyEmailSchema),
  asyncHandler(authController.verifyEmail),
);
router.post(
  "/resend-verification",
  validate(resendVerificationSchema),
  asyncHandler(authController.resendVerification),
);
router.get("/me", authMiddleware, asyncHandler(authController.getMe));
router.patch(
  "/me",
  authMiddleware,
  validate(updateProfileSchema),
  asyncHandler(authController.updateProfile),
);

router.post(
  "/email-change/request",
  authMiddleware,
  validate(requestEmailChangeSchema),
  asyncHandler(authController.requestEmailChange),
);

router.post(
  "/email-change/verify",
  authMiddleware,
  validate(verifyEmailChangeSchema),
  asyncHandler(authController.verifyEmailChange),
);

export default router;
