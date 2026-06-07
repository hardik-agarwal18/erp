import { jest } from "@jest/globals";
import ApiError, { MailDeliveryError } from "../../../src/utils/ApiError.js";

describe("ApiError", () => {
  describe("constructor", () => {
    it("should create an instance with correct statusCode and message", () => {
      const err = new ApiError(404, "Not found");
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe("Not found");
    });

    it("should be an instance of Error", () => {
      const err = new ApiError(500, "Server error");
      expect(err).toBeInstanceOf(Error);
    });

    it("should be an instance of ApiError", () => {
      const err = new ApiError(500, "Server error");
      expect(err).toBeInstanceOf(ApiError);
    });

    it("should store details when provided", () => {
      const details = { field: "email", issue: "invalid" };
      const err = new ApiError(422, "Validation", details);
      expect(err.details).toEqual(details);
    });

    it("should have undefined details when not provided", () => {
      const err = new ApiError(400, "Bad request");
      expect(err.details).toBeUndefined();
    });

    it("should accept array details", () => {
      const details = [{ msg: "required" }, { msg: "too short" }];
      const err = new ApiError(400, "Multiple errors", details);
      expect(err.details).toEqual(details);
    });

    it("should set the correct status code for 200 (edge case)", () => {
      const err = new ApiError(200, "OK");
      expect(err.statusCode).toBe(200);
    });

    it("should work for all standard HTTP error codes", () => {
      const codes = [400, 401, 403, 404, 409, 422, 429, 500, 503];
      codes.forEach((code) => {
        const err = new ApiError(code, `Error ${code}`);
        expect(err.statusCode).toBe(code);
      });
    });
  });

  describe("MailDeliveryError", () => {
    it("should create with status 500 and fixed message", () => {
      const err = new MailDeliveryError();
      expect(err.statusCode).toBe(500);
      expect(err.message).toBe("Unable to send email");
    });

    it("should be an instance of ApiError", () => {
      const err = new MailDeliveryError();
      expect(err).toBeInstanceOf(ApiError);
    });

    it("should be an instance of Error", () => {
      const err = new MailDeliveryError();
      expect(err).toBeInstanceOf(Error);
    });
  });
});
