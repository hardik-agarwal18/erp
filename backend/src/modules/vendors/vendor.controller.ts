import { sendSuccess } from "../../utils/apiResponse.js";
import { Request, Response } from "express";

import { vendorService } from "./vendor.service.js";

export const vendorController = {
  createVendor: async (req: Request, res: Response) => {
    const vendor = await vendorService.createVendor(
      req.organization!.id,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, { statusCode: 201, data: vendor });
  },
  updateVendor: async (req: Request, res: Response) => {
    const vendor = await vendorService.updateVendor(
      req.organization!.id,
      req.user!.id,
      req.params.id as string,
      req.body,
    );
    sendSuccess(res, { statusCode: 200, data: vendor });
  },
  archiveVendor: async (req: Request, res: Response) => {
    await vendorService.archiveVendor(
      req.organization!.id,
      req.user!.id,
      req.params.id as string,
    );
    sendSuccess(res, { statusCode: 200, message: "Vendor archived" });
  },
  listVendors: async (req: Request, res: Response) => {
    const vendors = await vendorService.listVendors(
      req.organization!.id,
      { search: req.query.search as string | undefined },
      req.query,
    );
    sendSuccess(res, { statusCode: 200, data: vendors });
  },
  getLedger: async (req: Request, res: Response) => {
    const ledger = await vendorService.getLedger(
      req.organization!.id,
      req.params.id as string,
    );
    sendSuccess(res, { statusCode: 200, data: ledger });
  },
  getVendor: async (req: Request, res: Response) => {
    const vendor = await vendorService.getVendor(
      req.organization!.id,
      req.params.id as string,
    );
    sendSuccess(res, { statusCode: 200, data: vendor });
  },
};
