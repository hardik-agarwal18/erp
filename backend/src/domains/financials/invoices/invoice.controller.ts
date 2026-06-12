
import { sendSuccess } from "../../../utils/apiResponse.js";
import { Request, Response } from "express";

import { invoiceService } from "./invoice.service.js";

export const invoiceController = {
  createInvoice: async (req: Request, res: Response) => {
    const invoice = await invoiceService.createInvoice(
      req.organization!.id,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, { statusCode: 201, data: invoice });
  },
  updateInvoice: async (req: Request, res: Response) => {
    const invoice = await invoiceService.updateInvoice(
      req.organization!.id,
      req.user!.id,
      req.params.id as string,
      req.body,
    );
    sendSuccess(res, { statusCode: 200, data: invoice });
  },
  listInvoices: async (req: Request, res: Response) => {
    const invoices = await invoiceService.listInvoices(
      req.organization!.id,
      {
        status: req.query.status as string | undefined,
        search: req.query.search as string | undefined,
      },
      req.query,
    );
    sendSuccess(res, { statusCode: 200, data: invoices });
  },
  getInvoice: async (req: Request, res: Response) => {
    const invoice = await invoiceService.getInvoice(
      req.organization!.id,
      req.params.id as string,
    );
    sendSuccess(res, { statusCode: 200, data: invoice });
  },
  deleteInvoice: async (req: Request, res: Response) => {
    await invoiceService.deleteInvoice(
      req.organization!.id,
      req.user!.id,
      req.params.id as string,
    );
    sendSuccess(res, { statusCode: 200, message: "Invoice deleted successfully" });
  },
  exportPdf: async (req: Request, res: Response) => {
    const pdfBuffer = await invoiceService.exportInvoicePdf(
      req.organization!.id,
      req.params.id as string,
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Invoice-${req.params.id}.pdf"`
    );
    res.send(pdfBuffer);
  },
  sendEmail: async (req: Request, res: Response) => {
    await invoiceService.sendInvoiceEmail(
      req.organization!.id,
      req.params.id as string,
      req.body.email,
    );
    sendSuccess(res, { statusCode: 200, message: "Invoice email queued for sending" });
  },
  getEmailHistory: async (req: Request, res: Response) => {
    const history = await invoiceService.getInvoiceEmailHistory(
      req.organization!.id,
      req.params.id as string,
    );
    sendSuccess(res, { statusCode: 200, data: history });
  },
};
