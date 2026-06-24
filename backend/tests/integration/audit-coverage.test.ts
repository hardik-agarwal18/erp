import { describe, it, expect, vi, beforeEach } from "vitest";
import { runWithDatabaseContext } from "../../src/database/extensions.js";
import { extendedPrisma } from "../../src/database/extensions.js";

const mockAuditCreate = vi.fn();

vi.mock("../../src/database/prisma.js", () => {
  return {
    prisma: {
      customer: {
        create: vi.fn().mockResolvedValue({ id: "cust_1", organizationId: "org_1", name: "Test Cust" }),
      },
      auditLog: {
        create: (...args: any[]) => mockAuditCreate(...args),
      }
    }
  };
});

describe("Automatic Audit Coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should automatically write an AuditLog upon creation of a business entity", async () => {
    await runWithDatabaseContext(
      { organizationId: "org_1", actorUserId: "user_1" },
      async () => {
        // Trigger a simulated create
        const customer = await extendedPrisma.customer.create({
          data: { name: "Test Cust" } as any
        });
        
        expect(customer.id).toBe("cust_1");
        
        // Assert that auditLog.create was triggered implicitly by the middleware
        expect(mockAuditCreate).toHaveBeenCalledTimes(1);
        expect(mockAuditCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              action: "CREATE",
              entityType: "Customer",
              entityId: "cust_1",
              organizationId: "org_1",
              actorUserId: "user_1"
            })
          })
        );
      }
    );
  });
});
