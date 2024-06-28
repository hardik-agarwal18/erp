import type { Express } from "express";
import request from "supertest";

import { hashPassword } from "../../src/lib/bcrypt.js";
import { prisma, redisClient } from "../setup/testDb.js";
import { extractAuthCookies } from "./token.helper.js";

type CreateTestUserInput = {
  name?: string;
  email?: string;
  password?: string;
  isVerified?: boolean;
};

export const DEFAULT_TEST_PASSWORD = "Password123!";

let userCounter = 0;

export const createTestUser = async ({
  name,
  email,
  password = DEFAULT_TEST_PASSWORD,
  isVerified = true,
}: CreateTestUserInput = {}) => {
  userCounter += 1;
  const passwordHash = await hashPassword(password);

  return prisma.user.create({
    data: {
      name: name ?? `Test User ${userCounter}`,
      email: email ?? `user${userCounter}@example.com`,
      password: passwordHash,
      isVerified,
    },
  });
};

export const signupTestUser = async (
  app: Express,
  payload?: { name?: string; email?: string; password?: string },
) => {
  userCounter += 1;
  const requestPayload = {
    name: payload?.name ?? `Signup User ${userCounter}`,
    email: payload?.email ?? `signup${userCounter}@example.com`,
    password: payload?.password ?? DEFAULT_TEST_PASSWORD,
  };

  const response = await request(app).post("/api/v1/auth/signup").send(requestPayload);

  return { response, payload: requestPayload };
};

export const loginTestUser = async (
  app: Express,
  payload: { email: string; password?: string },
) => {
  const response = await request(app).post("/api/v1/auth/login").send({
    email: payload.email,
    password: payload.password ?? DEFAULT_TEST_PASSWORD,
  });

  const cookies = extractAuthCookies(response);
  const accessToken = response.body.data?.accessToken as string | undefined;

  return {
    response,
    accessToken,
    ...cookies,
  };
};

export const createAuthenticatedUser = async (
  app: Express,
  input?: CreateTestUserInput,
) => {
  const password = input?.password ?? DEFAULT_TEST_PASSWORD;
  const user = await createTestUser({ ...input, password });
  const login = await loginTestUser(app, { email: user.email, password });

  return { user, password, ...login };
};

export const listRedisRefreshSessions = async () => {
  return redisClient.keys("refresh:*");
};
