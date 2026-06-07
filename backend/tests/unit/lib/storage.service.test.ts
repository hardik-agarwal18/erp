import { jest } from "@jest/globals";

// ── Mock providers before any import ─────────────────────────────────────────
const mockUpload = jest.fn();
const mockGetSignedUrl = jest.fn();
const mockDownload = jest.fn();
const mockDelete = jest.fn();
const mockList = jest.fn();

const mockProvider = {
  upload: mockUpload,
  getSignedUrl: mockGetSignedUrl,
  download: mockDownload,
  delete: mockDelete,
  list: mockList,
};

jest.mock("../../../src/lib/storage/providers/local.provider.js", () => ({
  LocalStorageProvider: jest.fn().mockImplementation(() => mockProvider),
}));

jest.mock("../../../src/lib/storage/providers/s3.provider.js", () => ({
  S3StorageProvider: jest.fn().mockImplementation(() => mockProvider),
}));

jest.mock("../../../src/config/env.js", () => ({
  env: { STORAGE_PROVIDER: "local" },
}));

// Import AFTER mocks so the singleton uses the mocked providers
import { storageService } from "../../../src/lib/storage/storage.service.js";

describe("StorageService (singleton)", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("uploadFile()", () => {
    it("should call provider.upload with correct args", async () => {
      mockUpload.mockResolvedValue("invoices/inv-001.pdf");

      const result = await storageService.uploadFile(
        "invoices/inv-001.pdf",
        Buffer.from("data"),
        "application/pdf",
      );

      expect(mockUpload).toHaveBeenCalledWith(
        "invoices/inv-001.pdf",
        Buffer.from("data"),
        { contentType: "application/pdf" },
      );
      expect(result).toBe("invoices/inv-001.pdf");
    });

    it("should call provider.upload with undefined contentType when not given", async () => {
      mockUpload.mockResolvedValue("file.pdf");

      await storageService.uploadFile("file.pdf", Buffer.from("x"));

      expect(mockUpload).toHaveBeenCalledWith(
        "file.pdf",
        Buffer.from("x"),
        { contentType: undefined },
      );
    });
  });

  describe("getSignedUrl()", () => {
    it("should delegate to provider.getSignedUrl", async () => {
      mockGetSignedUrl.mockResolvedValue("https://signed-url");

      const url = await storageService.getSignedUrl("file.pdf", 3600);

      expect(mockGetSignedUrl).toHaveBeenCalledWith("file.pdf", 3600);
      expect(url).toBe("https://signed-url");
    });
  });

  describe("getFile()", () => {
    it("should delegate to provider.download", async () => {
      const buf = Buffer.from("content");
      mockDownload.mockResolvedValue(buf);

      const result = await storageService.getFile("file.pdf");

      expect(mockDownload).toHaveBeenCalledWith("file.pdf");
      expect(result).toEqual(buf);
    });
  });

  describe("deleteFile()", () => {
    it("should delegate to provider.delete", async () => {
      mockDelete.mockResolvedValue(undefined);

      await storageService.deleteFile("file.pdf");

      expect(mockDelete).toHaveBeenCalledWith("file.pdf");
    });
  });

  describe("listFiles()", () => {
    it("should delegate to provider.list with prefix", async () => {
      mockList.mockResolvedValue([{ path: "file.pdf", lastModified: new Date() }]);

      const result = await storageService.listFiles("invoices/");

      expect(mockList).toHaveBeenCalledWith("invoices/");
      expect(result).toHaveLength(1);
    });

    it("should call list with undefined when no prefix given", async () => {
      mockList.mockResolvedValue([]);

      await storageService.listFiles();

      expect(mockList).toHaveBeenCalledWith(undefined);
    });
  });
});
