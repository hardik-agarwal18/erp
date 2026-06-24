import { describe, it, expect, vi } from "vitest";
import { runWithDatabaseContext } from "../../src/database/extensions.js";
import { extendedPrisma } from "../../src/database/extensions.js";

// Mock the root delegate
vi.mock("../../src/database/prisma.js", () => {
  return {
    prisma: {
      customer: {
        findFirst: vi.fn().mockResolvedValue({ id: "cust_1", organizationId: "org_1" }),
        update: vi.fn(),
      }
    }
  };
});

describe("Dynamic Tenant Enforcement", () => {
  it("should automatically inject organizationId into queries for tenant-owned models", async () => {
    await runWithDatabaseContext(
      { organizationId: "org_1", actorUserId: "user_1" },
      async () => {
        // Find should work seamlessly
        const customer = await extendedPrisma.customer.findUnique({
          where: { id: "cust_1" }
        });
        
        expect(customer).toBeDefined();
        expect(customer?.organizationId).toBe("org_1");
      }
    );
  });

  it("should block cross-tenant creation explicitly", async () => {
    await runWithDatabaseContext(
      { organizationId: "org_1", actorUserId: "user_1" },
      async () => {
        await expect(extendedPrisma.customer.create({
          data: {
            name: "Cross Tenant Hacker",
            organizationId: "org_2" // Deliberately attempting cross-tenant injection
          } as any
        })).rejects.toThrow(/Tenant mismatch for model "Customer"/);
      }
    );
  });
});
