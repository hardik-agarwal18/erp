import { jest } from "@jest/globals";

// ── Hoist mock fns before any imports ────────────────────────────────────────
const mockHash = jest.fn();
const mockCompare = jest.fn();

jest.mock("bcrypt", () => ({
  __esModule: true,
  default: { hash: mockHash, compare: mockCompare },
}));

import { hashPassword, comparePassword } from "../../../src/lib/bcrypt.js";

describe("bcrypt library", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("hashPassword", () => {
    it("should call bcrypt.hash with the password and SALT_ROUNDS=12", async () => {
      mockHash.mockResolvedValue("hashed-password");

      const result = await hashPassword("myPassword123");

      expect(mockHash).toHaveBeenCalledWith("myPassword123", 12);
      expect(result).toBe("hashed-password");
    });

    it("should return different hashes for the same password across calls", async () => {
      mockHash.mockResolvedValueOnce("hash-1").mockResolvedValueOnce("hash-2");

      const hash1 = await hashPassword("same-password");
      const hash2 = await hashPassword("same-password");

      expect(hash1).not.toBe(hash2);
    });

    it("should handle an empty string password", async () => {
      mockHash.mockResolvedValue("hashed-empty");

      const result = await hashPassword("");

      expect(mockHash).toHaveBeenCalledWith("", 12);
      expect(result).toBe("hashed-empty");
    });

    it("should propagate errors from bcrypt.hash", async () => {
      mockHash.mockRejectedValue(new Error("Hash failed"));

      await expect(hashPassword("password")).rejects.toThrow("Hash failed");
    });
  });

  describe("comparePassword", () => {
    it("should return true when password matches the hash", async () => {
      mockCompare.mockResolvedValue(true);

      const result = await comparePassword("password123", "$2b$12$validhash");

      expect(mockCompare).toHaveBeenCalledWith("password123", "$2b$12$validhash");
      expect(result).toBe(true);
    });

    it("should return false when password does not match", async () => {
      mockCompare.mockResolvedValue(false);

      const result = await comparePassword("wrongPassword", "$2b$12$validhash");

      expect(result).toBe(false);
    });

    it("should handle an empty password string", async () => {
      mockCompare.mockResolvedValue(false);

      await comparePassword("", "$2b$12$validhash");

      expect(mockCompare).toHaveBeenCalledWith("", "$2b$12$validhash");
    });

    it("should propagate errors for an invalid hash format", async () => {
      mockCompare.mockRejectedValue(new Error("Invalid hash"));

      await expect(comparePassword("password", "not-a-bcrypt-hash")).rejects.toThrow("Invalid hash");
    });
  });
});
