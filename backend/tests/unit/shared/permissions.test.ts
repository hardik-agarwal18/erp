import { jest } from "@jest/globals";

const mockFindUnique = jest.fn();

jest.mock("../../../src/config/database.js", () => ({
  __esModule: true,
  default: {
    organizationMember: { findUnique: mockFindUnique },
  },
}));

jest.mock("../../../src/config/redis.js", () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
}));

import { redisClient } from "../../../src/config/redis.js";
import {
  getCachedMemberPermissions,
  clearMemberPermissionCache,
  clearMembersPermissionCache,
} from "../../../src/shared/utils/permissions.js";

const MEMBER_ID = "mem-abc";
const CACHE_KEY = `member-permissions:${MEMBER_ID}`;

describe("permissions utility", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("getCachedMemberPermissions", () => {
    describe("Cache hit", () => {
      it("should return cached permissions without querying the database", async () => {
        const cached = ["read:invoices", "write:products"];
        (redisClient.get as jest.Mock).mockResolvedValue(JSON.stringify(cached));

        const result = await getCachedMemberPermissions(MEMBER_ID);

        expect(redisClient.get).toHaveBeenCalledWith(CACHE_KEY);
        expect(mockFindUnique).not.toHaveBeenCalled();
        expect(result).toEqual(cached);
      });
    });

    describe("Cache miss", () => {
      it("should query the DB, cache result, and return permissions", async () => {
        (redisClient.get as jest.Mock).mockResolvedValue(null);
        mockFindUnique.mockResolvedValue({
          role: {
            rolePermissions: [
              { permission: { name: "read:invoices" } },
              { permission: { name: "write:invoices" } },
            ],
          },
        });
        (redisClient.set as jest.Mock).mockResolvedValue("OK");

        const result = await getCachedMemberPermissions(MEMBER_ID);

        expect(mockFindUnique).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: MEMBER_ID } }),
        );
        expect(redisClient.set).toHaveBeenCalledWith(
          CACHE_KEY,
          JSON.stringify(["read:invoices", "write:invoices"]),
          { EX: 300 },
        );
        expect(result).toEqual(["read:invoices", "write:invoices"]);
      });

      it("should return empty array when member not found in DB", async () => {
        (redisClient.get as jest.Mock).mockResolvedValue(null);
        mockFindUnique.mockResolvedValue(null);
        (redisClient.set as jest.Mock).mockResolvedValue("OK");

        const result = await getCachedMemberPermissions(MEMBER_ID);

        expect(result).toEqual([]);
        expect(redisClient.set).toHaveBeenCalledWith(CACHE_KEY, "[]", { EX: 300 });
      });
    });
  });

  describe("clearMemberPermissionCache", () => {
    it("should delete the correct Redis key for the member", async () => {
      (redisClient.del as jest.Mock).mockResolvedValue(1);

      await clearMemberPermissionCache(MEMBER_ID);

      expect(redisClient.del).toHaveBeenCalledWith(CACHE_KEY);
    });
  });

  describe("clearMembersPermissionCache", () => {
    it("should delete Redis keys for all provided member IDs", async () => {
      (redisClient.del as jest.Mock).mockResolvedValue(2);

      await clearMembersPermissionCache(["mem-1", "mem-2"]);

      expect(redisClient.del).toHaveBeenCalledWith([
        "member-permissions:mem-1",
        "member-permissions:mem-2",
      ]);
    });

    it("should NOT call redisClient.del when memberIds array is empty", async () => {
      await clearMembersPermissionCache([]);

      expect(redisClient.del).not.toHaveBeenCalled();
    });
  });
});
