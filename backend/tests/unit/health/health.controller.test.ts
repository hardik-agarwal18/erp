import { jest } from "@jest/globals";
import { Request, Response } from "express";

import { getLiveness, getReadiness } from "../../../src/domains/core/health/health.controller.js";
import { getSystemHealth } from "../../../src/domains/core/health/health.service.js";

jest.mock("../../../src/domains/core/health/health.service.js");

describe("healthController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {};

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Partial<Response>;
  });

  it("should return liveness", () => {
    getLiveness(req as Request, res as Response);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: "alive" });
  });

  it("should return readiness when all checks are ok", async () => {
    (getSystemHealth as jest.Mock).mockResolvedValue({ database: "ok", redis: "ok", storage: "ok", queues: "ok", mail: "ok" });

    await getReadiness(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: "ready", checks: { database: "ok", redis: "ok", storage: "ok", queues: "ok", mail: "ok" } });
  });

  it("should return 503 when some checks are failing", async () => {
    (getSystemHealth as jest.Mock).mockResolvedValue({ database: "ok", redis: "error", storage: "ok", queues: "ok", mail: "ok" });

    await getReadiness(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ status: "error", checks: { database: "ok", redis: "error", storage: "ok", queues: "ok", mail: "ok" } });
  });

  it("should handle error in getSystemHealth", async () => {
    (getSystemHealth as jest.Mock).mockRejectedValue(new Error("Test Error"));

    await getReadiness(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ status: "error", checks: { database: "error", redis: "error", storage: "error", queues: "error", mail: "error" } });
  });
});
