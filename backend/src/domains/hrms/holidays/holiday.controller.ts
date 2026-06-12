
import { Request, Response } from "express";
import { holidayService } from "./holiday.service.js";
import { createHolidaySchema, updateHolidaySchema } from "./holiday.validators.js";
import asyncHandler from "../../../utils/asyncHandler.js";

export const holidayController = {
  createHoliday: asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createHolidaySchema.parse(req.body);
    const holiday = await holidayService.createHoliday(
      req.organization!.id as string,
      validatedData.body
    );
    res.status(201).json({ status: "success", data: holiday });
  }),

  getHolidays: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, year, month } = req.query;

    const result = await holidayService.getHolidays(req.organization!.id as string, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      year: year as string,
      month: month as string,
    });

    res.json({ status: "success", data: result });
  }),

  getHolidayById: asyncHandler(async (req: Request, res: Response) => {
    const holiday = await holidayService.getHolidayById(req.organization!.id as string, req.params.id as string);
    res.json({ status: "success", data: holiday });
  }),

  updateHoliday: asyncHandler(async (req: Request, res: Response) => {
    const validatedData = updateHolidaySchema.parse(req);
    const holiday = await holidayService.updateHoliday(
      req.organization!.id as string,
      req.params.id as string,
      validatedData.body
    );
    res.json({ status: "success", data: holiday });
  }),

  deleteHoliday: asyncHandler(async (req: Request, res: Response) => {
    await holidayService.deleteHoliday(req.organization!.id as string, req.params.id as string);
    res.status(204).send();
  })
};