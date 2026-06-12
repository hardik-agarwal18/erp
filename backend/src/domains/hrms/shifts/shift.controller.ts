// @ts-nocheck
import { Request, Response } from "express";
import { shiftService } from "./shift.service.js";
import { createShiftSchema, updateShiftSchema, assignShiftSchema } from "./shift.validators.js";
import asyncHandler from "../../../../shared/utils/asyncHandler.js";

export const shiftController = {
  createShift: asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createShiftSchema.parse(req.body);
    const shift = await shiftService.createShift(
      req.organization!.id,
      req.user!.id,
      validatedData
    );
    res.status(201).json({ status: "success", data: shift });
  }),

  updateShift: asyncHandler(async (req: Request, res: Response) => {
    const validatedData = updateShiftSchema.parse(req.body);
    const shift = await shiftService.updateShift(
      req.organization!.id,
      req.params.id as string,
      req.user!.id,
      validatedData
    );
    res.json({ status: "success", data: shift });
  }),

  listShifts: asyncHandler(async (req: Request, res: Response) => {
    const isActive = req.query.isActive ? req.query.isActive === "true" : undefined;
    const shifts = await shiftService.listShifts(req.organization!.id, isActive);
    res.json({ status: "success", data: shifts });
  }),

  deleteShift: asyncHandler(async (req: Request, res: Response) => {
    await shiftService.deleteShift(
      req.organization!.id,
      req.params.id as string,
      req.user!.id
    );
    res.status(204).send();
  }),

  assignShift: asyncHandler(async (req: Request, res: Response) => {
    const validatedData = assignShiftSchema.parse(req.body);
    const assignment = await shiftService.assignShift(
      req.organization!.id,
      req.params.employeeId as string,
      validatedData.shiftId,
      validatedData.effectiveFrom,
      req.user!.id
    );
    res.status(201).json({ status: "success", data: assignment });
  }),

  getEmployeeShifts: asyncHandler(async (req: Request, res: Response) => {
    const shifts = await shiftService.getEmployeeShifts(
      req.organization!.id,
      req.params.employeeId as string
    );
    res.json({ status: "success", data: shifts });
  }),

  getDashboardMetrics: asyncHandler(async (req: Request, res: Response) => {
    const metrics = await shiftService.getDashboardMetrics(req.organization!.id);
    res.json({ status: "success", data: metrics });
  })
};
