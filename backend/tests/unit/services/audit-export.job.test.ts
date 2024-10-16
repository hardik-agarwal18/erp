import { jest } from "@jest/globals";

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const mockUserFindUnique = jest.fn();
const mockAuditLogFindMany = jest.fn();
const mockUploadFile = jest.fn();
const mockGetSignedUrl = jest.fn();
const mockMailQueueAdd = jest.fn();
const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();

jest.mock("../../../src/config/database.js", () => ({
  __esModule: true,
  default: {
    user: { findUnique: mockUserFindUnique },
    auditLog: { findMany: mockAuditLogFindMany },
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

import { processAuditExportJob } from "../../../src/queue/jobs/audit-export.job.js";

const makeJob = (overrides: object = {}) =>
  ({
    id: "audit-export-1",
    data: {
      organizationId: "org-1",
      userId: "user-1",
      startDate: undefined,
      endDate: undefined,
      ...overrides,
    },
  } as any);

const fakeUser = { email: "admin@corp.com" };

const fakeAuditLog = {
  id: "log-1",
  actorUserId: "user-1",
  action: "customer.created",
  entityType: "customer",
  entityId: "cust-1",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  metadata: { note: "test" },
};

describe("audit-export.job — processAuditExportJob()", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should throw when user is not found", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    await expect(processAuditExportJob(makeJob())).rejects.toThrow("User user-1 not found");
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  it("should generate a CSV, upload it, and enqueue an email on success", async () => {
    mockUserFindUnique.mockResolvedValue(fakeUser);
    // First batch returns 1 log; second batch returns 0 (end of pagination)
    mockAuditLogFindMany
      .mockResolvedValueOnce([fakeAuditLog])
      .mockResolvedValueOnce([]);
    mockUploadFile.mockResolvedValue(undefined);
    mockGetSignedUrl.mockResolvedValue("https://signed.url/audit.csv");
    mockMailQueueAdd.mockResolvedValue({});

    const result = await processAuditExportJob(makeJob());

    expect(mockUploadFile).toHaveBeenCalledWith(
      expect.stringContaining("exports/audit/"),
      expect.any(Buffer),
      "text/csv",
    );
    expect(mockGetSignedUrl).toHaveBeenCalledWith(expect.any(String), 7 * 24 * 60 * 60);
    expect(mockMailQueueAdd).toHaveBeenCalledWith(
      "export-email",
      expect.objectContaining({ type: "export" }),
    );
    expect(result).toMatchObject({ status: "COMPLETED", url: "https://signed.url/audit.csv" });
  });

  it("should apply startDate / endDate date filters when provided", async () => {
    mockUserFindUnique.mockResolvedValue(fakeUser);
    mockAuditLogFindMany.mockResolvedValue([]); // no logs
    mockUploadFile.mockResolvedValue(undefined);
    mockGetSignedUrl.mockResolvedValue("https://url");
    mockMailQueueAdd.mockResolvedValue({});

    await processAuditExportJob(
      makeJob({ startDate: "2026-01-01", endDate: "2026-01-31" }),
    );

    expect(mockAuditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({
            gte: new Date("2026-01-01"),
            lte: new Date("2026-01-31"),
          }),
        }),
      }),
    );
  });

  it("should paginate through batches of 1000 records", async () => {
    mockUserFindUnique.mockResolvedValue(fakeUser);
    // Return 2 batches then stop
    const batch1 = Array.from({ length: 1000 }, (_, i) => ({
      ...fakeAuditLog,
      id: `log-${i}`,
      createdAt: new Date(),
    }));
    mockAuditLogFindMany
      .mockResolvedValueOnce(batch1)
      .mockResolvedValueOnce([fakeAuditLog])
      .mockResolvedValueOnce([]);
    mockUploadFile.mockResolvedValue(undefined);
    mockGetSignedUrl.mockResolvedValue("https://url");
    mockMailQueueAdd.mockResolvedValue({});

    const result = await processAuditExportJob(makeJob());

    // 3 calls: full batch → partial batch → empty (stop)
    expect(mockAuditLogFindMany).toHaveBeenCalledTimes(3);
    expect(result.status).toBe("COMPLETED");
  });

  it("should handle audit logs with null entityId and null metadata", async () => {
    mockUserFindUnique.mockResolvedValue(fakeUser);
    mockAuditLogFindMany
      .mockResolvedValueOnce([{ ...fakeAuditLog, entityId: null, metadata: null }])
      .mockResolvedValueOnce([]);
    mockUploadFile.mockResolvedValue(undefined);
    mockGetSignedUrl.mockResolvedValue("https://url");
    mockMailQueueAdd.mockResolvedValue({});

    // Should not throw even with null fields
    const result = await processAuditExportJob(makeJob());
    expect(result.status).toBe("COMPLETED");
  });

  it("should log error and rethrow when auditLog query fails", async () => {
    mockUserFindUnique.mockResolvedValue(fakeUser);
    mockAuditLogFindMany.mockRejectedValue(new Error("DB query failed"));

    await expect(processAuditExportJob(makeJob())).rejects.toThrow("DB query failed");
    expect(mockLoggerError).toHaveBeenCalled();
  });
});
