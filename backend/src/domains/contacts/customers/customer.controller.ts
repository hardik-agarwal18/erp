
import { sendSuccess } from "../../../utils/apiResponse.js";
import { Request, Response } from "express";

import { customerService } from "./customer.service.js";

export const customerController = {
  createCustomer: async (req: Request, res: Response) => {
    const customer = await customerService.createCustomer(
      req.organization!.id,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, { statusCode: 201, data: customer });
  },
  getCustomerById: async (req: Request, res: Response) => {
    const customer = await customerService.getCustomerById(
      req.organization!.id,
      req.params.id as string,
    );
    sendSuccess(res, { statusCode: 200, data: customer });
  },
  updateCustomer: async (req: Request, res: Response) => {
    const customer = await customerService.updateCustomer(
      req.organization!.id,
      req.user!.id,
      req.params.id as string,
      req.body,
    );
    sendSuccess(res, { statusCode: 200, data: customer });
  },
  archiveCustomer: async (req: Request, res: Response) => {
    await customerService.archiveCustomer(
      req.organization!.id,
      req.user!.id,
      req.params.id as string,
    );
    sendSuccess(res, { statusCode: 200, message: "Customer archived" });
  },
  listCustomers: async (req: Request, res: Response) => {
    const customers = await customerService.listCustomers(
      req.organization!.id,
      { 
        search: req.query.search as string | undefined,
        status: req.query.status as string | undefined,
        type: req.query.type as string | undefined,
      },
      req.query,
    );
    sendSuccess(res, { statusCode: 200, data: customers });
  },
  getLedger: async (req: Request, res: Response) => {
    const ledger = await customerService.getLedger(
      req.organization!.id,
      req.params.id as string,
    );
    sendSuccess(res, { statusCode: 200, data: ledger });
  },
  getExposure: async (req: Request, res: Response) => {
    const { creditService } = await import("./credit.service.js");
    const exposure = await creditService.calculateExposure(
      req.organization!.id,
      req.params.id as string,
    );
    sendSuccess(res, { statusCode: 200, data: exposure });
  },
  requestCreditLimit: async (req: Request, res: Response) => {
    const { creditService } = await import("./credit.service.js");
    const result = await creditService.requestCreditLimitUpdate(
      req.organization!.id,
      req.user!.id,
      req.params.id as string,
      req.body.creditLimit,
      req.body.creditDays,
      req.body.reason,
    );
    sendSuccess(res, { statusCode: 200, data: result });
  },
};
