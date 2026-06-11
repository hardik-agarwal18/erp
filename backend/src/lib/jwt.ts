// @ts-nocheck
import jwt, { SignOptions } from "jsonwebtoken";

export const signToken = <T extends object>(
  payload: T,
  secret: string,
  options: SignOptions,
) => {
  return jwt.sign(payload, secret, options);
};

export const verifyToken = <T>(token: string, secret: string) => {
  return jwt.verify(token, secret) as T;
};
