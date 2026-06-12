
import { Response } from "express";

export interface SuccessApiResponse<T> {
  success: true;
  message?: string;
  data?: T;
}

export interface ErrorApiResponse {
  success: false;
  message: string;
  errors: unknown[];
}

type SuccessResponseOptions<T> = {
  data?: T;
  message?: string;
  statusCode?: number;
};

type ErrorResponseOptions = {
  message?: string;
  errors?: unknown[];
  statusCode?: number;
};

/**
 * Sends a standardized success response.
 */
export const sendSuccess = <T>(
  response: Response,
  options: SuccessResponseOptions<T> = {},
): Response<SuccessApiResponse<T>> => {
  const payload: SuccessApiResponse<T> = {
    success: true,
  };

  if (options.message) {
    payload.message = options.message;
  }

  if (options.data !== undefined) {
    payload.data = options.data;
  }

  return response.status(options.statusCode ?? 200).json(payload);
};

/**
 * Sends a standardized error response.
 */
export const sendError = (
  response: Response,
  options: ErrorResponseOptions = {},
): Response<ErrorApiResponse> => {
  const payload: ErrorApiResponse = {
    success: false,
    message: options.message ?? "An error occurred",
    errors: options.errors ?? [],
  };

  return response.status(options.statusCode ?? 500).json(payload);
};
