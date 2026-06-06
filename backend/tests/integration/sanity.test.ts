import { expect, it, describe, beforeEach, afterAll, beforeAll } from "@jest/globals";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

describe("DB sanity check", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "User", "Organization", "OrganizationMember", "RefreshSession" RESTART IDENTITY CASCADE;`
    );
  });

  for (let i = 0; i < 5; i++) {
    it(`runs test ${i}`, async () => {
      const user = await prisma.user.create({
        data: {
          name: "Test",
          email: `test${i}@example.com`,
          password: "hash",
        },
      });

      const org = await prisma.$transaction(async (tx) => {
        return tx.organization.create({
          data: {
            name: "Org",
            slug: `org-${i}`,
            joinCode: `ORG-${i}-XXXXXX`,
            ownerId: user.id,
          },
        });
      });

      expect(org.ownerId).toBe(user.id);
    });
  }
});
