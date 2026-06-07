import { slugify } from "../../../src/shared/utils/slug.js";

describe("slugify", () => {
  describe("Normal strings", () => {
    it("should convert a normal string to lowercase with hyphens", () => {
      expect(slugify("Hello World")).toBe("hello-world");
    });

    it("should convert multiple spaces into a single hyphen", () => {
      expect(slugify("Hello   World")).toBe("hello-world");
    });

    it("should trim leading and trailing whitespace", () => {
      expect(slugify("  hello world  ")).toBe("hello-world");
    });
  });

  describe("Special characters", () => {
    it("should replace special characters with hyphens", () => {
      expect(slugify("Hello, World!")).toBe("hello-world");
    });

    it("should handle mixed alphanumeric and specials", () => {
      expect(slugify("Acme Corp. (2026)")).toBe("acme-corp-2026");
    });

    it("should handle underscores as non-alphanumeric characters", () => {
      expect(slugify("hello_world")).toBe("hello-world");
    });

    it("should remove leading and trailing hyphens from the result", () => {
      expect(slugify("--hello--")).toBe("hello");
    });

    it("should collapse consecutive hyphens", () => {
      expect(slugify("hello---world")).toBe("hello-world");
    });
  });

  describe("Unicode and international characters", () => {
    it("should replace unicode letters that are not a-z with hyphens", () => {
      // Non-ASCII characters fall outside [a-z0-9]
      const result = slugify("Ünîcödé");
      expect(result).not.toContain("Ü");
    });
  });

  describe("Edge cases", () => {
    it("should return an empty string for an empty input", () => {
      expect(slugify("")).toBe("");
    });

    it("should return an empty string for a string of only special chars", () => {
      expect(slugify("!!!")).toBe("");
    });

    it("should handle a very long string", () => {
      const long = "a".repeat(1000);
      expect(slugify(long)).toBe("a".repeat(1000));
    });

    it("should handle digits correctly", () => {
      expect(slugify("Invoice 2026")).toBe("invoice-2026");
    });

    it("should handle a single character", () => {
      expect(slugify("A")).toBe("a");
    });
  });
});
