import { jest } from "@jest/globals";

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const mockUserFindUnique = jest.fn();
const mockInvoiceFindMany = jest.fn();
const mockExpenseFindMany = jest.fn();
const mockUploadFile = jest.fn();
const mockGetSignedUrl = jest.fn();
const mockMailQueueAdd = jest.fn();
const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();

jest.mock("../../../src/config/database.js", () => ({
  __esModule: true,
  default: {
    user: { findUnique: mockUserFindUnique },
    invoice: { findMany: mockInvoiceFindMany },
    expense: { findMany: mockExpenseFindMany },
  },
}));

jest.mock("../../../src/lib/storage/storage.service.js", () => ({
  storageService: { uploadFile: mockUploadFile, getSignedUrl: mockGetSignedUrl },
}));

jest.mock("../../../src/queue/queue.service.js", () => ({
  mailQueue: { add: mockMailQueueAdd },
}));

jest.mock("../../../src/config/logger.js", () => ({
  __esModule: true,
  default: { info: mockLoggerInfo, error: mockLoggerError, warn: jest.fn(), debug: jest.fn() },
}));

import { processReportJob } from "../../../src/queue/jobs/report-export.job.js";

const makeJob = (reportType: string, overrides: object = {}) =>
  ({
    id: "report-job-1",
    data: { organizationId: "org-1", userId: "user-1", reportType, ...overrides },
  } as any);

const fakeUser = { email: "admin@corp.com" };

const fakeInvoice = {
  id: "inv-1",
  invoiceNumber: "INV-001",
  status: "PAID",
  totalAmount: 500,
  issueDate: new Date("2026-01-15"),
};

const fakeExpense = {
  id: "exp-1",
  amount: 200,
  category: "Travel",
  expenseDate: new Date("2026-01-20"),
};

describe("report-export.job — processReportJob()", () => {
  beforeEach(() => jest.clearAllMocks());

  // ── User not found ──────────────────────────────────────────────────────────
  it("should throw when user is not found", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    await expect(processReportJob(makeJob("sales"))).rejects.toThrow("User user-1 not found");
  });

  // ── Sales report ────────────────────────────────────────────────────────────
  it("should generate a sales CSV report and return COMPLETED status", async () => {
    mockUserFindUnique.mockResolvedValue(fakeUser);
    mockInvoiceFindMany
      .mockResolvedValueOnce([fakeInvoice])
      .mockResolvedValueOnce([]); // end pagination
    mockUploadFile.mockResolvedValue(undefined);
    mockGetSignedUrl.mockResolvedValue("https://signed.url/sales.csv");
    mockMailQueueAdd.mockResolvedValue({});

    const result = await processReportJob(makeJob("sales"));

    expect(mockInvoiceFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: "org-1" } }),
    );
    expect(mockUploadFile).toHaveBeenCalledWith(
      expect.stringContaining("exports/reports/sales"),
      expect.any(Buffer),
      "text/csv",
    );
    expect(result).toMatchObject({ status: "COMPLETED", url: "https://signed.url/sales.csv" });
  });

  it("should paginate through multiple batches for sales report", async () => {
    mockUserFindUnique.mockResolvedValue(fakeUser);
    const batch1 = Array.from({ length: 1000 }, (_, i) => ({
      ...fakeInvoice,
      id: `inv-${i}`,
      issueDate: new Date(),
    }));
    mockInvoiceFindMany
      .mockResolvedValueOnce(batch1)
      .mockResolvedValueOnce([fakeInvoice])
      .mockResolvedValueOnce([]);
    mockUploadFile.mockResolvedValue(undefined);
    mockGetSignedUrl.mockResolvedValue("https://url");
    mockMailQueueAdd.mockResolvedValue({});

    const result = await processReportJob(makeJob("sales"));

    expect(mockInvoiceFindMany).toHaveBeenCalledTimes(3);
    expect(result.status).toBe("COMPLETED");
  });

  // ── Expense report ──────────────────────────────────────────────────────────
  it("should generate an expense CSV report", async () => {
    mockUserFindUnique.mockResolvedValue(fakeUser);
    mockExpenseFindMany
      .mockResolvedValueOnce([fakeExpense])
      .mockResolvedValueOnce([]);
    mockUploadFile.mockResolvedValue(undefined);
    mockGetSignedUrl.mockResolvedValue("https://signed.url/expense.csv");
    mockMailQueueAdd.mockResolvedValue({});

    const result = await processReportJob(makeJob("expense"));

    expect(mockExpenseFindMany).toHaveBeenCalled();
    expect(result).toMatchObject({ status: "COMPLETED" });
  });

  it("should paginate through multiple batches for expense report", async () => {
    mockUserFindUnique.mockResolvedValue(fakeUser);
    const batch1 = Array.from({ length: 1000 }, (_, i) => ({
      ...fakeExpense,
      id: `exp-${i}`,
      expenseDate: new Date(),
    }));
    mockExpenseFindMany
      .mockResolvedValueOnce(batch1)
      .mockResolvedValueOnce([fakeExpense])
      .mockResolvedValueOnce([]);
    mockUploadFile.mockResolvedValue(undefined);
    mockGetSignedUrl.mockResolvedValue("https://url");
    mockMailQueueAdd.mockResolvedValue({});

    const result = await processReportJob(makeJob("expense"));

    expect(mockExpenseFindMany).toHaveBeenCalledTimes(3);
    expect(result.status).toBe("COMPLETED");
  });

  // ── Fallback / unknown report type ──────────────────────────────────────────
  it("should generate a mocked fallback row for unknown report types", async () => {
    mockUserFindUnique.mockResolvedValue(fakeUser);
    mockUploadFile.mockResolvedValue(undefined);
    mockGetSignedUrl.mockResolvedValue("https://url/inventory.csv");
    mockMailQueueAdd.mockResolvedValue({});

    const result = await processReportJob(makeJob("inventory"));

    expect(mockInvoiceFindMany).not.toHaveBeenCalled();
    expect(mockExpenseFindMany).not.toHaveBeenCalled();
    expect(result.status).toBe("COMPLETED");
  });

  // ── Email queued ────────────────────────────────────────────────────────────
  it("should enqueue an export email after generating the report", async () => {
    mockUserFindUnique.mockResolvedValue(fakeUser);
    mockInvoiceFindMany.mockResolvedValue([]);
    mockUploadFile.mockResolvedValue(undefined);
    mockGetSignedUrl.mockResolvedValue("https://url");
    mockMailQueueAdd.mockResolvedValue({});

    await processReportJob(makeJob("sales"));

    expect(mockMailQueueAdd).toHaveBeenCalledWith(
      "export-email",
      expect.objectContaining({
        type: "export",
        payload: expect.objectContaining({ to: "admin@corp.com" }),
      }),
    );
  });

  // ── Error handling ──────────────────────────────────────────────────────────
  it("should log error and rethrow when invoice query fails", async () => {
    mockUserFindUnique.mockResolvedValue(fakeUser);
    mockInvoiceFindMany.mockRejectedValue(new Error("DB error"));

    await expect(processReportJob(makeJob("sales"))).rejects.toThrow("DB error");
    expect(mockLoggerError).toHaveBeenCalled();
  });

  it("should log error and rethrow when expense query fails", async () => {
    mockUserFindUnique.mockResolvedValue(fakeUser);
    mockExpenseFindMany.mockRejectedValue(new Error("DB expense error"));

    await expect(processReportJob(makeJob("expense"))).rejects.toThrow("DB expense error");
    expect(mockLoggerError).toHaveBeenCalled();
  });
});
