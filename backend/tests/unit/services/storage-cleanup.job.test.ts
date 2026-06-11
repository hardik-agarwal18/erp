import { jest } from "@jest/globals";

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();
const mockLoggerDebug = jest.fn();
const mockLoggerWarn = jest.fn();

import { storageService } from "../../../src/lib/storage/storage.service.js";
import logger from "../../../src/config/logger.js";

jest.mock("../../../src/config/env.js", () => ({
  env: { NODE_ENV: "test" },
}));

jest.spyOn(logger, "info").mockImplementation(mockLoggerInfo);
jest.spyOn(logger, "error").mockImplementation(mockLoggerError);
jest.spyOn(logger, "debug").mockImplementation(mockLoggerDebug);
jest.spyOn(logger, "warn").mockImplementation(mockLoggerWarn);

import { processCleanupJob } from "../../../src/queue/jobs/storage-cleanup.job.js";

const makeJob = () => ({ id: "cleanup-1" } as any);

describe("storage-cleanup.job — processCleanupJob()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.EXPORT_RETENTION_DAYS;
  });

  it("should delete files in /exports/reports/ older than retention period", async () => {
    const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
    jest.spyOn(storageService, "listFiles").mockResolvedValue([
      { path: "organizations/org-1/exports/reports/report.pdf", lastModified: oldDate },
    ]);
    const deleteSpy = jest.spyOn(storageService, "deleteFile").mockResolvedValue(undefined);

    const result = await processCleanupJob(makeJob());

    expect(deleteSpy).toHaveBeenCalledWith("organizations/org-1/exports/reports/report.pdf");
    expect(result).toEqual({ status: "OK", deletedCount: 1 });
  });

  it("should delete files in /exports/audit/ older than retention period", async () => {
    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    jest.spyOn(storageService, "listFiles").mockResolvedValue([
      { path: "organizations/org-1/exports/audit/audit.csv", lastModified: oldDate },
    ]);
    const deleteSpy = jest.spyOn(storageService, "deleteFile").mockResolvedValue(undefined);

    const result = await processCleanupJob(makeJob());

    expect(deleteSpy).toHaveBeenCalledWith("organizations/org-1/exports/audit/audit.csv");
    expect(result).toMatchObject({ deletedCount: 1 });
  });

  it("should delete files in /temp/pdfs/ older than retention period", async () => {
    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    jest.spyOn(storageService, "listFiles").mockResolvedValue([
      { path: "organizations/org-1/temp/pdfs/invoice.pdf", lastModified: oldDate },
    ]);
    const deleteSpy = jest.spyOn(storageService, "deleteFile").mockResolvedValue(undefined);

    const result = await processCleanupJob(makeJob());

    expect(deleteSpy).toHaveBeenCalled();
    expect(result).toMatchObject({ deletedCount: 1 });
  });

  it("should NOT delete files that are still within the retention window", async () => {
    const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // only 2 days ago
    jest.spyOn(storageService, "listFiles").mockResolvedValue([
      { path: "organizations/org-1/exports/reports/new-report.pdf", lastModified: recentDate },
    ]);
    const deleteSpy = jest.spyOn(storageService, "deleteFile").mockResolvedValue(undefined);

    const result = await processCleanupJob(makeJob());

    expect(deleteSpy).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "OK", deletedCount: 0 });
  });

  it("should NOT delete files outside the tracked path patterns", async () => {
    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    jest.spyOn(storageService, "listFiles").mockResolvedValue([
      { path: "organizations/org-1/invoices/invoice.pdf", lastModified: oldDate }, // not tracked
    ]);
    const deleteSpy = jest.spyOn(storageService, "deleteFile").mockResolvedValue(undefined);

    const result = await processCleanupJob(makeJob());

    expect(deleteSpy).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "OK", deletedCount: 0 });
  });

  it("should respect a custom EXPORT_RETENTION_DAYS env var", async () => {
    process.env.EXPORT_RETENTION_DAYS = "3";
    // File is 4 days old — should be deleted (> 3 day retention)
    const oldDate = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    jest.spyOn(storageService, "listFiles").mockResolvedValue([
      { path: "organizations/org-1/exports/reports/r.pdf", lastModified: oldDate },
    ]);
    const deleteSpy = jest.spyOn(storageService, "deleteFile").mockResolvedValue(undefined);

    const result = await processCleanupJob(makeJob());

    expect(deleteSpy).toHaveBeenCalled();
    expect(result).toMatchObject({ deletedCount: 1 });
  });

  it("should return deletedCount 0 when no files exist", async () => {
    jest.spyOn(storageService, "listFiles").mockResolvedValue([]);
    const deleteSpy = jest.spyOn(storageService, "deleteFile").mockResolvedValue(undefined);

    const result = await processCleanupJob(makeJob());

    expect(deleteSpy).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "OK", deletedCount: 0 });
  });

  it("should throw and log error when listFiles fails", async () => {
    jest.spyOn(storageService, "listFiles").mockRejectedValue(new Error("Storage unavailable"));

    await expect(processCleanupJob(makeJob())).rejects.toThrow("Storage unavailable");
    expect(mockLoggerError).toHaveBeenCalled();
  });

  it("should log start and completion info messages", async () => {
    jest.spyOn(storageService, "listFiles").mockResolvedValue([]);

    await processCleanupJob(makeJob());

    expect(mockLoggerInfo).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: "cleanup-1" }),
      "Starting storage cleanup job",
    );
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      expect.objectContaining({ deletedCount: 0 }),
      "Storage cleanup job completed",
    );
  });
});
