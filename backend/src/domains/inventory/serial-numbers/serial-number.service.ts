
import ApiError from "../../../utils/ApiError.js";
import prisma from "../../../config/database.js";
import { serialNumberRepository } from "./serial-number.repository.js";
import { SerialNumberFilters } from "./serial-number.types.js";

export const serialNumberService = {
  list: (organizationId: string, filters: SerialNumberFilters, query: Record<string, unknown>) => {
    return serialNumberRepository.list(organizationId, filters, query);
  },

  getById: async (id: string, organizationId: string) => {
    const serial = await serialNumberRepository.findById(id, organizationId);
    if (!serial) {
      throw new ApiError(404, "Serial number not found");
    }
    return serial;
  },

  lookupBySerial: async (serialNumber: string, organizationId: string) => {
    const serial = await serialNumberRepository.findBySerialNumber(serialNumber, organizationId);
    if (!serial) {
      throw new ApiError(404, "Serial number not found");
    }
    return serial;
  },

  getTraceability: async (id: string, organizationId: string) => {
    const serial = await serialNumberRepository.findById(id, organizationId);
    if (!serial) {
      throw new ApiError(404, "Serial number not found");
    }

    const movements = await prisma.inventoryMovement.findMany({
      where: {
        organizationId,
        serialNumberId: id,
      },
      include: {
        godown: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return movements.map((m) => {
      let customer = undefined;
      // We could infer customer if it's a CHALLAN dispatch
      // But we will stick to basic info for now.
      return {
        date: m.createdAt,
        eventType: m.type,
        referenceId: m.referenceId,
        godown: m.godown?.name,
      };
    });
  },
};
