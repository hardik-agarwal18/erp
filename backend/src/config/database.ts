// @ts-nocheck
import { extendedPrisma } from "../database/extensions.js";
import {
  connectDatabase as connectPrismaDatabase,
  disconnectDatabase as disconnectPrismaDatabase,
  registerDatabaseShutdownHooks,
} from "../database/prisma.js";

export const prisma = extendedPrisma;
export type DatabaseClient = typeof prisma;
export type DatabaseTransactionClient =
  Parameters<Parameters<DatabaseClient["$transaction"]>[0]>[0];

export const connectDatabase = connectPrismaDatabase;
export const disconnectDatabase = disconnectPrismaDatabase;
export const registerDatabaseShutdown = registerDatabaseShutdownHooks;

export default prisma;
