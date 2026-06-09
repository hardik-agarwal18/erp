import crypto from "crypto";
import { redisClient } from "../../config/redis.js";
import ApiError from "../../utils/ApiError.js";
import { authRepository } from "./auth.repository.js";
import { sendEmailChangeCurrentVerification, sendEmailChangeNewVerification } from "../../mail/mail.service.js";

const OTP_EXPIRY = 600; // 10 minutes

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

export const emailChangeService = {
  requestEmailChange: async (userId: string, newEmail: string) => {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.email === newEmail) {
      throw new ApiError(400, "New email must be different from current email");
    }

    const existing = await authRepository.findUserByEmail(newEmail);
    if (existing) {
      throw new ApiError(409, "Email already in use");
    }

    const currentEmailOtp = generateOTP();
    const newEmailOtp = generateOTP();

    const requestData = {
      newEmail,
      currentEmailOtp,
      newEmailOtp,
    };

    // Store in Redis with 10 minute expiry
    await redisClient.set(
      `email_change:${userId}`,
      JSON.stringify(requestData),
      { EX: OTP_EXPIRY }
    );

    // Send emails
    await sendEmailChangeCurrentVerification(user.email, user.name, currentEmailOtp);
    await sendEmailChangeNewVerification(newEmail, user.name, newEmailOtp);
  },

  verifyEmailChange: async (userId: string, currentEmailOtp: string, newEmailOtp: string) => {
    const dataStr = await redisClient.get(`email_change:${userId}`);
    if (!dataStr) {
      throw new ApiError(400, "Email change request expired or not found");
    }

    const data = JSON.parse(dataStr) as {
      newEmail: string;
      currentEmailOtp: string;
      newEmailOtp: string;
    };

    if (data.currentEmailOtp !== currentEmailOtp || data.newEmailOtp !== newEmailOtp) {
      throw new ApiError(400, "Invalid verification codes");
    }

    const existing = await authRepository.findUserByEmail(data.newEmail);
    if (existing) {
      await redisClient.del(`email_change:${userId}`);
      throw new ApiError(409, "Email already in use");
    }

    // Update the email
    const updatedUser = await authRepository.updateUser(userId, {
      email: data.newEmail,
      isVerified: true, // It is verified because they provided the OTP for the new email
    });

    // Clean up
    await redisClient.del(`email_change:${userId}`);

    return updatedUser;
  },
};
