import { parsePagination } from "../../../src/shared/utils/pagination.js";

describe("parsePagination", () => {
  describe("Default values", () => {
    it("should return page=1 and limit=20 when no input provided", () => {
      const result = parsePagination({});
      expect(result).toEqual({ page: 1, limit: 20, skip: 0, take: 20 });
    });

    it("should return page=1 when page is undefined", () => {
      const result = parsePagination({ limit: "10" });
      expect(result.page).toBe(1);
    });

    it("should return limit=20 when limit is undefined", () => {
      const result = parsePagination({ page: "1" });
      expect(result.limit).toBe(20);
    });
  });

  describe("Custom values", () => {
    it("should parse string page and limit correctly", () => {
      const result = parsePagination({ page: "3", limit: "15" });
      expect(result.page).toBe(3);
      expect(result.limit).toBe(15);
      expect(result.skip).toBe(30);
      expect(result.take).toBe(15);
    });

    it("should accept numeric page and limit", () => {
      const result = parsePagination({ page: 2, limit: 10 });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.skip).toBe(10);
    });
  });

  describe("Boundary values", () => {
    it("should floor fractional page values", () => {
      const result = parsePagination({ page: "2.9" });
      expect(result.page).toBe(2);
    });

    it("should floor fractional limit values", () => {
      const result = parsePagination({ limit: "15.7" });
      expect(result.limit).toBe(15);
    });

    it("should cap limit at 100 (maximum)", () => {
      const result = parsePagination({ limit: "500" });
      expect(result.limit).toBe(100);
    });

    it("should return page=1 when page is 0 or negative", () => {
      expect(parsePagination({ page: "0" }).page).toBe(1);
      expect(parsePagination({ page: "-5" }).page).toBe(1);
    });

    it("should return limit=20 when limit is 0 or negative", () => {
      expect(parsePagination({ limit: "0" }).limit).toBe(20);
      expect(parsePagination({ limit: "-10" }).limit).toBe(20);
    });
  });

  describe("Invalid values", () => {
    it("should return defaults when page is NaN string", () => {
      const result = parsePagination({ page: "abc" });
      expect(result.page).toBe(1);
    });

    it("should return defaults when limit is NaN string", () => {
      const result = parsePagination({ limit: "xyz" });
      expect(result.limit).toBe(20);
    });
  });

  describe("skip/take calculation", () => {
    it("should correctly calculate skip as (page-1)*limit", () => {
      const result = parsePagination({ page: "5", limit: "10" });
      expect(result.skip).toBe(40);
      expect(result.take).toBe(10);
    });

    it("should have skip=0 for page=1", () => {
      const result = parsePagination({ page: "1", limit: "20" });
      expect(result.skip).toBe(0);
    });
  });
});
