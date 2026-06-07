import { sendSuccess } from "../../utils/apiResponse.js";
import { Request, Response } from "express";

import { reportService } from "./report.service.js";

export const reportController = {
  salesReport: async (req: Request, res: Response) => {
    const report = await reportService.salesReport(req.organization!.id, {
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    });
    sendSuccess(res, { statusCode: 200, data: report });
  },
  expenseReport: async (req: Request, res: Response) => {
    const report = await reportService.expenseReport(req.organization!.id, {
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    });
    sendSuccess(res, { statusCode: 200, data: report });
  },
  inventoryReport: async (req: Request, res: Response) => {
    const report = await reportService.inventoryReport(req.organization!.id);
    sendSuccess(res, { statusCode: 200, data: report });
  },
  taxReport: async (req: Request, res: Response) => {
    const report = await reportService.taxReport(req.organization!.id, {
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    });
    sendSuccess(res, { statusCode: 200, data: report });
  },
  dashboard: async (req: Request, res: Response) => {
    const report = await reportService.dashboardMetrics(req.organization!.id);
    sendSuccess(res, { statusCode: 200, data: report });
  },
  exportReport: async (req: Request, res: Response) => {
    const { reportType } = req.body;
    const { reportsQueue } = await import("../../queue/queue.service.js");
    const job = await reportsQueue.add("export-report", {
      organizationId: req.organization!.id,
      userId: req.user!.id,
      reportType,
    });
    sendSuccess(res, { statusCode: 202, data: { jobId: job.id } });
  },
  getExportStatus: async (req: Request, res: Response) => {
    const { reportsQueue } = await import("../../queue/queue.service.js");
    const job = await reportsQueue.getJob(req.params.jobId as string);
    if (!job) {
      return res.status(404).json({ success: false, message: "Export job not found" });
    }
    const state = await job.getState();
    const result = job.returnvalue;
    sendSuccess(res, { statusCode: 200, data: { id: job.id, status: state, url: result?.url } });
  },
};
