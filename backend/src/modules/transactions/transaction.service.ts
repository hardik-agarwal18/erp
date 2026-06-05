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
};
