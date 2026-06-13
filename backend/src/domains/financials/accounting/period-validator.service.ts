import { accountingRepository } from "./accounting.repository.js";
import ApiError from "../../../utils/ApiError.js";

export const accountingPeriodValidator = {
  /**
   * Throws an error if the given date falls into a CLOSED accounting period,
   * or if no accounting period is found.
   */
  validateDateOpen: async (organizationId: string, date: Date) => {
    const period = await accountingRepository.getAccountingPeriodForDate(organizationId, date);
    
    if (!period) {
      throw new ApiError(400, "No accounting period found for the given date. Please create a Fiscal Year and periods first.");
    }

    if (period.isClosed) {
      throw new ApiError(400, `The accounting period for ${date.toISOString().split('T')[0]} is CLOSED. Transactions cannot be posted or reversed in a closed period.`);
    }

    return true;
  }
};

