import { slugify } from "../../../src/shared/utils/slug.js";

describe("slugify", () => {
  it("normalizes strings into URL-safe slugs", () => {
    expect(slugify("  Acme Corporation  ")).toBe("acme-corporation");
    expect(slugify("Hello@@World!!")).toBe("hello-world");
  });
});
