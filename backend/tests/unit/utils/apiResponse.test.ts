import { jest } from "@jest/globals";
import { Response } from "express";
import { sendSuccess, sendError } from "../../../src/utils/apiResponse.js";

function makeRes(): { status: jest.Mock; json: jest.Mock } {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("sendSuccess", () => {
  describe("with data and message", () => {
    it("should return 200 by default and include data and message", () => {
      const res = makeRes();
      sendSuccess(res as unknown as Response, { data: { id: "1" }, message: "Created" });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: "1" }, message: "Created" });
    });

    it("should use custom statusCode when provided", () => {
      const res = makeRes();
      sendSuccess(res as unknown as Response, { statusCode: 201, data: { id: "2" } });

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should omit data field when data is not provided", () => {
      const res = makeRes();
      sendSuccess(res as unknown as Response, { message: "OK" });

      const body = res.json.mock.calls[0][0];
      expect(body.data).toBeUndefined();
    });

    it("should omit message field when message is not provided", () => {
      const res = makeRes();
      sendSuccess(res as unknown as Response, { data: { id: "1" } });

      const body = res.json.mock.calls[0][0];
      expect(body.message).toBeUndefined();
    });

    it("should work with no options at all", () => {
      const res = makeRes();
      sendSuccess(res as unknown as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    it("should include data when data is 0 (falsy check)", () => {
      const res = makeRes();
      sendSuccess(res as unknown as Response, { data: 0 as any });

      const body = res.json.mock.calls[0][0];
      expect(body.data).toBe(0);
    });

    it("should include data when data is an empty array", () => {
      const res = makeRes();
      sendSuccess(res as unknown as Response, { data: [] as any });

      const body = res.json.mock.calls[0][0];
      expect(body.data).toEqual([]);
    });
  });
});

describe("sendError", () => {
  it("should return 500 by default with generic error message", () => {
    const res = makeRes();
    sendError(res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "An error occurred",
      errors: [],
    });
  });

  it("should use custom statusCode and message", () => {
    const res = makeRes();
    sendError(res as unknown as Response, { statusCode: 404, message: "Not found" });

    expect(res.status).toHaveBeenCalledWith(404);
    const body = res.json.mock.calls[0][0];
    expect(body.message).toBe("Not found");
    expect(body.success).toBe(false);
  });

  it("should include errors array when provided", () => {
    const res = makeRes();
    const errors = [{ field: "email", msg: "required" }];
    sendError(res as unknown as Response, { statusCode: 422, message: "Validation", errors });

    const body = res.json.mock.calls[0][0];
    expect(body.errors).toEqual(errors);
  });

  it("should default to empty errors array when none provided", () => {
    const res = makeRes();
    sendError(res as unknown as Response, { statusCode: 400, message: "Bad request" });

    const body = res.json.mock.calls[0][0];
    expect(body.errors).toEqual([]);
  });

  it("should always set success: false", () => {
    const res = makeRes();
    sendError(res as unknown as Response, { statusCode: 200 });

    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(false);
  });
});
