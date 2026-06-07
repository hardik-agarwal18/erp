import { jest } from "@jest/globals";

// ── Mock AWS SDK ─────────────────────────────────────────────────────────────
const mockSend = jest.fn();

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  ListObjectsV2Command: jest.fn(),
}));

jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));

jest.mock("../../../src/config/env.js", () => ({
  env: {
    S3_REGION: "us-east-1",
    S3_ACCESS_KEY: "access-key",
    S3_SECRET_KEY: "secret-key",
    S3_BUCKET: "test-bucket",
    S3_ENDPOINT: undefined,
  },
}));

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3StorageProvider } from "../../../src/lib/storage/providers/s3.provider.js";
import { Readable } from "stream";

describe("S3StorageProvider", () => {
  let provider: S3StorageProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new S3StorageProvider();
  });

  describe("upload()", () => {
    it("should call S3Client.send with PutObjectCommand and return the file path", async () => {
      mockSend.mockResolvedValue({});

      const result = await provider.upload("invoices/inv-001.pdf", Buffer.from("pdf data"), {
        contentType: "application/pdf",
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(result).toBe("invoices/inv-001.pdf");
    });

    it("should propagate errors from the S3 client", async () => {
      mockSend.mockRejectedValue(new Error("S3 upload failed"));

      await expect(provider.upload("test.pdf", Buffer.from("x"))).rejects.toThrow(
        "S3 upload failed",
      );
    });
  });

  describe("download()", () => {
    it("should stream the S3 object Body into a Buffer", async () => {
      const readable = Readable.from([Buffer.from("chunk1"), Buffer.from("chunk2")]);
      mockSend.mockResolvedValue({ Body: readable });

      const result = await provider.download("reports/r1.pdf");

      expect(result).toBeInstanceOf(Buffer);
    });

    it("should reject when the stream emits an error", async () => {
      const readable = new Readable({
        read() {
          this.emit("error", new Error("Stream error"));
        },
      });
      mockSend.mockResolvedValue({ Body: readable });

      await expect(provider.download("bad-file.pdf")).rejects.toThrow("Stream error");
    });

    it("should propagate S3 client errors", async () => {
      mockSend.mockRejectedValue(new Error("NoSuchKey"));

      await expect(provider.download("missing.pdf")).rejects.toThrow("NoSuchKey");
    });
  });

  describe("delete()", () => {
    it("should call S3Client.send with DeleteObjectCommand", async () => {
      mockSend.mockResolvedValue({});

      await provider.delete("old-invoice.pdf");

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("should propagate S3 errors on delete", async () => {
      mockSend.mockRejectedValue(new Error("AccessDenied"));

      await expect(provider.delete("protected.pdf")).rejects.toThrow("AccessDenied");
    });
  });

  describe("getSignedUrl()", () => {
    it("should call @aws-sdk/s3-request-presigner getSignedUrl and return the URL", async () => {
      (getSignedUrl as jest.Mock).mockResolvedValue("https://s3.signed.url/file.pdf");

      const url = await provider.getSignedUrl("file.pdf");

      expect(getSignedUrl).toHaveBeenCalled();
      expect(url).toBe("https://s3.signed.url/file.pdf");
    });

    it("should use the default expiresIn of 3600 seconds", async () => {
      (getSignedUrl as jest.Mock).mockResolvedValue("https://url");

      await provider.getSignedUrl("file.pdf");

      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 3600 },
      );
    });

    it("should use custom expiresIn when provided", async () => {
      (getSignedUrl as jest.Mock).mockResolvedValue("https://url");

      await provider.getSignedUrl("file.pdf", 7200);

      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 7200 },
      );
    });
  });

  describe("list()", () => {
    it("should return all objects from a single page S3 response", async () => {
      mockSend.mockResolvedValue({
        Contents: [
          { Key: "file1.pdf", LastModified: new Date("2026-01-01") },
          { Key: "file2.pdf", LastModified: new Date("2026-01-02") },
        ],
        IsTruncated: false,
      });

      const result = await provider.list("invoices/");

      expect(result).toHaveLength(2);
      expect(result[0].path).toBe("file1.pdf");
    });

    it("should paginate through multiple pages", async () => {
      mockSend
        .mockResolvedValueOnce({
          Contents: [{ Key: "file1.pdf", LastModified: new Date() }],
          IsTruncated: true,
          NextContinuationToken: "token-2",
        })
        .mockResolvedValueOnce({
          Contents: [{ Key: "file2.pdf", LastModified: new Date() }],
          IsTruncated: false,
        });

      const result = await provider.list("");

      expect(result).toHaveLength(2);
    });

    it("should return empty array when Contents is absent", async () => {
      mockSend.mockResolvedValue({ IsTruncated: false });

      const result = await provider.list("empty/");

      expect(result).toEqual([]);
    });
  });
});
