import { Request, Response, NextFunction } from "express";
import { vendorPaymentsService } from "./vendor-payments.service.js";

export const vendorPaymentsController = {
  createPayment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId!;
      const userId = req.user!.id;
      const { invoiceId } = req.params;
      
      const payment = await vendorPaymentsService.createPayment(organizationId, userId, { ...req.body, invoiceId });
      res.status(201).json(payment);
    } catch (error) {
      next(error);
    }
  },

  listPayments: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user!.organizationId!;
      const { invoiceId } = req.params;
      
      const payments = await vendorPaymentsService.listPayments(organizationId, invoiceId as string);
      res.json(payments);
    } catch (error) {
      next(error);
    }
  }
};
