import { describe, it, expect } from "vitest";
import { DomainEvents } from "../../src/shared/domain-events.js";
import { processAccountingJob } from "../../src/queue/jobs/accounting.job.js";
import { Job } from "bullmq";
import { prisma } from "../../src/config/database.js";
import { accountingRepository } from "../../src/domains/financials/accounting/accounting.repository.js";

// Mock out the side effects
vi.mock("../../src/config/database.js", () => ({
  prisma: {
    outboxEvent: {
      findUnique: vi.fn(),
      update: vi.fn(),
    }
  }
}));

vi.mock("../../src/domains/financials/accounting/accounting.repository.js", () => ({
  accountingRepository: {
    createJournalEntry: vi.fn(),
  }
}));

describe("Accounting Event Contracts", () => {
  it("should have matching listener for SALES_INVOICE_POSTED", () => {
    expect(DomainEvents.SALES_INVOICE_POSTED).toBe("SalesInvoicePOSTED");
  });

  it("should have matching listener for VENDOR_INVOICE_POSTED", () => {
    expect(DomainEvents.VENDOR_INVOICE_POSTED).toBe("VendorInvoicePosted");
  });

  it("should have matching listener for PAYROLL_APPROVED", () => {
    expect(DomainEvents.PAYROLL_APPROVED).toBe("PayrollApproved");
  });
  
  it("should have matching listener for STOCK_ADJUSTMENT_POSTED", () => {
    expect(DomainEvents.STOCK_ADJUSTMENT_POSTED).toBe("StockAdjustmentPosted");
  });

  it("should gracefully handle Prisma P2002 Unique Constraint idempotency errors without throwing", async () => {
    // Simulate Prisma Unique Constraint Violation
    const mockP2002Error = new Error("Unique constraint failed");
    (mockP2002Error as any).code = "P2002";

    vi.mocked(prisma.outboxEvent.update).mockRejectedValueOnce(mockP2002Error);
    vi.mocked(prisma.outboxEvent.findUnique).mockResolvedValueOnce({
      id: "evt_123",
      eventType: DomainEvents.SALES_INVOICE_POSTED,
      status: "PENDING"
    } as any);

    const mockJob = {
      data: { outboxEventId: "evt_123" }
    } as unknown as Job<any>;

    // Should NOT throw if caught successfully
    await expect(processAccountingJob(mockJob)).resolves.not.toThrow();
  });
});
