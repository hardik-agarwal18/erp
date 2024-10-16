import { jest } from "@jest/globals";
import { Request, Response } from "express";

import { reportController } from "../../../src/modules/reports/report.controller.js";
import { reportService } from "../../../src/modules/reports/report.service.js";

jest.mock("../../../src/modules/reports/report.service.js");
jest.mock("../../../src/queue/queue.service.js", () => ({
  reportsQueue: {
    add: jest.fn().mockResolvedValue({ id: "job1" }),
    getJob: jest.fn().mockResolvedValue({ id: "job1", getState: jest.fn().mockResolvedValue("completed"), returnvalue: { url: "test-url" } }),
  },
}));

describe("reportController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      organization: { id: "o1" } as any,
      user: { id: "u1" } as any,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Partial<Response>;
  });

  it("should return sales report", async () => {
    (reportService.salesReport as jest.Mock).mockResolvedValue({ totalSales: 100 });
    await reportController.salesReport(req as Request, res as Response);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { totalSales: 100 } }));
  });

  it("should return expense report", async () => {
    (reportService.expenseReport as jest.Mock).mockResolvedValue({ totalExpenses: 100 });
    await reportController.expenseReport(req as Request, res as Response);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { totalExpenses: 100 } }));
  });

  it("should return inventory report", async () => {
    (reportService.inventoryReport as jest.Mock).mockResolvedValue({ stockValue: 100 });
    await reportController.inventoryReport(req as Request, res as Response);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { stockValue: 100 } }));
  });

  it("should return tax report", async () => {
    (reportService.taxReport as jest.Mock).mockResolvedValue({ taxLiability: 100 });
    await reportController.taxReport(req as Request, res as Response);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { taxLiability: 100 } }));
  });

  it("should return dashboard", async () => {
    (reportService.dashboardMetrics as jest.Mock).mockResolvedValue({ profitEstimate: 100 });
    await reportController.dashboard(req as Request, res as Response);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { profitEstimate: 100 } }));
  });

  it("should start export job", async () => {
    req.body = { reportType: "sales" };
    await reportController.exportReport(req as Request, res as Response);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { jobId: "job1" } }));
  });

  it("should get export status", async () => {
    req.params = { jobId: "job1" };
    await reportController.getExportStatus(req as Request, res as Response);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { id: "job1", status: "completed", url: "test-url" } }));
  });
});
