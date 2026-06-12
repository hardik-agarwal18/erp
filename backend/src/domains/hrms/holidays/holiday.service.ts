// @ts-nocheck
import { PrismaClient, Holiday } from "@prisma/client";
import ApiError from "../../../../utils/ApiError.js";
import { parseISO, startOfDay, endOfDay, startOfYear, endOfYear, startOfMonth, endOfMonth } from "date-fns";

const prisma = new PrismaClient();

export class HolidayService {
  /**
   * Create a new holiday
   */
  async createHoliday(
    organizationId: string,
    data: { name: string; date: string; isOptional?: boolean }
  ): Promise<Holiday> {
    const holidayDate = startOfDay(parseISO(data.date));

    // Check if holiday already exists for this date
    const existing = await prisma.holiday.findUnique({
      where: {
        organizationId_date: {
          organizationId,
          date: holidayDate,
        },
      },
    });

    if (existing) {
      throw new ApiError(400, "A holiday is already configured for this date.");
    }

    const holiday = await prisma.holiday.create({
      data: {
        organizationId,
        name: data.name,
        date: holidayDate,
        isOptional: data.isOptional ?? false,
      },
    });

    return holiday;
  }

  /**
   * Update a holiday
   */
  async updateHoliday(
    organizationId: string,
    id: string,
    data: { name?: string; date?: string; isOptional?: boolean }
  ): Promise<Holiday> {
    const existing = await prisma.holiday.findUnique({
      where: { id },
    });

    if (!existing || existing.organizationId !== organizationId) {
      throw new ApiError(404, "Holiday not found");
    }

    let holidayDate = existing.date;
    if (data.date) {
      holidayDate = startOfDay(parseISO(data.date));
      // Check for conflict if date is changing
      if (holidayDate.getTime() !== existing.date.getTime()) {
        const conflict = await prisma.holiday.findUnique({
          where: {
            organizationId_date: {
              organizationId,
              date: holidayDate,
            },
          },
        });
        if (conflict) {
          throw new ApiError(400, "Another holiday is already configured for the new date.");
        }
      }
    }

    const holiday = await prisma.holiday.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : existing.name,
        date: holidayDate,
        isOptional: data.isOptional !== undefined ? data.isOptional : existing.isOptional,
      },
    });

    return holiday;
  }

  /**
   * Delete a holiday
   */
  async deleteHoliday(organizationId: string, id: string): Promise<void> {
    const existing = await prisma.holiday.findUnique({
      where: { id },
    });

    if (!existing || existing.organizationId !== organizationId) {
      throw new ApiError(404, "Holiday not found");
    }

    await prisma.holiday.delete({
      where: { id },
    });
  }

  /**
   * Get all holidays with pagination and optional year/month filtering
   */
  async getHolidays(
    organizationId: string,
    options: {
      page?: number;
      limit?: number;
      year?: string;
      month?: string;
    }
  ) {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    let dateFilter: any = {};
    if (options.year) {
      const yearStr = `${options.year}-01-01T00:00:00.000Z`;
      const yearStart = startOfYear(parseISO(yearStr));
      const yearEnd = endOfYear(parseISO(yearStr));

      if (options.month) {
        const monthStr = `${options.year}-${options.month.padStart(2, "0")}-01T00:00:00.000Z`;
        const monthStart = startOfMonth(parseISO(monthStr));
        const monthEnd = endOfMonth(parseISO(monthStr));
        dateFilter = { gte: monthStart, lte: monthEnd };
      } else {
        dateFilter = { gte: yearStart, lte: yearEnd };
      }
    }

    const where = {
      organizationId,
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.holiday.findMany({
        where,
        orderBy: { date: "asc" },
        skip,
        take: limit,
      }),
      prisma.holiday.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a holiday by ID
   */
  async getHolidayById(organizationId: string, id: string): Promise<Holiday> {
    const holiday = await prisma.holiday.findUnique({
      where: { id },
    });

    if (!holiday || holiday.organizationId !== organizationId) {
      throw new ApiError(404, "Holiday not found");
    }

    return holiday;
  }
}

export const holidayService = new HolidayService();
