import { jest } from "@jest/globals";

// Mocking dependencies
import { transactionRepository } from "../../../src/modules/transactions/transaction.repository.js";

jest.mock("../../../src/modules/transactions/transaction.repository.js");

import { transactionService } from "../../../src/modules/transactions/transaction.service.js";

describe("transactionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listTransactions", () => {
    it("should list transactions", async () => {
      (transactionRepository.listTransactions as jest.Mock).mockResolvedValue([{ id: "tx1" }]);
      const result = await transactionService.listTransactions("o1", {}, {});
      expect(result).toHaveLength(1);
      expect(transactionRepository.listTransactions).toHaveBeenCalledWith("o1", {}, {});
    });
  });
});
