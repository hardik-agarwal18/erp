import { jest } from "@jest/globals";

// ── Mock fs/promises ─────────────────────────────────────────────────────────
jest.mock("fs/promises", () => ({
  default: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
    unlink: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
  },
}));

jest.mock("../../../src/config/env.js", () => ({
  env: {
    STORAGE_LOCAL_PATH: "./uploads",
    APP_URL: "http://localhost:5000",
  },
}));

import fs from "fs/promises";
import { LocalStorageProvider } from "../../../src/lib/storage/providers/local.provider.js";

describe("LocalStorageProvider", () => {
  let provider: LocalStorageProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new LocalStorageProvider("./uploads");
  });

  describe("upload()", () => {
    it("should create directories and write file, returning the file path", async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const result = await provider.upload("invoices/inv-001.pdf", Buffer.from("data"));

      expect(fs.mkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
      expect(fs.writeFile).toHaveBeenCalled();
      expect(result).toBe("invoices/inv-001.pdf");
    });

    it("should propagate errors from fs.writeFile (permission error)", async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockRejectedValue(new Error("EACCES: permission denied"));

      await expect(provider.upload("test.pdf", Buffer.from("x"))).rejects.toThrow(
        "EACCES: permission denied",
      );
    });

    it("should propagate errors from fs.mkdir", async () => {
      (fs.mkdir as jest.Mock).mockRejectedValue(new Error("EPERM: operation not permitted"));

      await expect(provider.upload("path/file.pdf", Buffer.from("x"))).rejects.toThrow(
        "EPERM: operation not permitted",
      );
    });
  });

  describe("download()", () => {
    it("should read and return file content as Buffer", async () => {
      const data = Buffer.from("file content");
      (fs.readFile as jest.Mock).mockResolvedValue(data);

      const result = await provider.download("reports/r1.pdf");

      expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining("r1.pdf"));
      expect(result).toEqual(data);
    });

    it("should throw when file does not exist", async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(new Error("ENOENT: no such file"));

      await expect(provider.download("missing-file.pdf")).rejects.toThrow("ENOENT");
    });
  });

  describe("delete()", () => {
    it("should call fs.unlink to delete the file", async () => {
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      await provider.delete("invoices/old.pdf");

      expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining("old.pdf"));
    });

    it("should silently ignore errors from fs.unlink (file not found)", async () => {
      (fs.unlink as jest.Mock).mockRejectedValue(new Error("ENOENT"));

      // Should NOT throw, because delete() catches all errors
      await expect(provider.delete("missing.pdf")).resolves.toBeUndefined();
    });
  });

  describe("getSignedUrl()", () => {
    it("should return a URL in the form APP_URL/api/v1/storage/path", async () => {
      const url = await provider.getSignedUrl("invoices/inv-001.pdf");

      expect(url).toBe("http://localhost:5000/api/v1/storage/invoices/inv-001.pdf");
    });

    it("should include expiresIn parameter even though local provider ignores it", async () => {
      // Should not throw; just returns a local URL ignoring expiry
      const url = await provider.getSignedUrl("test.pdf", 3600);
      expect(url).toContain("test.pdf");
    });
  });

  describe("list()", () => {
    it("should return an empty array when the path does not exist", async () => {
      (fs.stat as jest.Mock).mockResolvedValue(null); // null = path doesn't exist

      const result = await provider.list("nonexistent/");

      expect(result).toEqual([]);
    });

    it("should return a single file when path points to a file (not directory)", async () => {
      (fs.stat as jest.Mock).mockResolvedValue({
        isDirectory: () => false,
        mtime: new Date("2026-01-01"),
      });

      const result = await provider.list("file.pdf");

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ lastModified: new Date("2026-01-01") });
    });
  });
});
