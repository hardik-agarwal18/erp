import { transactionRepository } from "./transaction.repository.js";
import { TransactionFilters } from "./transaction.types.js";

export const transactionService = {
  listTransactions: (
    organizationId: string,
    filters: TransactionFilters,
    query: Record<string, unknown>,
  ) => {
    return transactionRepository.listTransactions(
      organizationId,
      filters,
      query,
    );
  },
  getTransaction: async (organizationId: string, transactionId: string) => {
    const transaction = await transactionRepository.getTransaction(
      organizationId,
      transactionId,
    );
    if (!transaction) {
      const { ApiError } = await import("../../shared/utils/ApiError.js");
      throw new ApiError(404, "Transaction not found");
    }
    return transaction;
  },
};
