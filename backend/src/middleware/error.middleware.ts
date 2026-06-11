// @ts-nocheck
import { NextFunction, Request, Response } from "express";

import ApiError from "../utils/ApiError.js";
import logger from "../config/logger.js";
import { sendError } from "../utils/apiResponse.js";

export const errorMiddleware = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const message =
    error instanceof ApiError ? error.message : "Internal server error";

  if (!(error instanceof ApiError)) {
    logger.error(
      {
        errorMessage: error.message,
        errorStack: error.stack,
      },
      "Unhandled error details",
    );
  }

  let errors: unknown[] = [];
  if (error instanceof ApiError && error.details) {
    if (Array.isArray(error.details)) {
      errors = error.details;
    } else {
      errors = [error.details];
    }
  }

  sendError(res, {
    statusCode,
    message,
    errors,
  });
};
