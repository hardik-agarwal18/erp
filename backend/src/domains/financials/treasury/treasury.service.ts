import { treasuryRepository } from "./treasury.repository.js";
import { accountingService } from "../accounting/accounting.service.js";
import { accountingRepository } from "../accounting/accounting.repository.js";
import { AccountType, BalanceType } from "@prisma/client";
import ApiError from "../../../utils/ApiError.js";
import {
  CreateBankAccountInput,
  CreateBankTransactionInput,
  BankTransactionFilters,
  UpdateBankAccountInput,
} from "./treasury.types.js";
import { 
  emitTreasuryAccountCreated, 
  emitTreasuryAccountFrozen, 
  emitTreasuryAccountClosed 
} from "../../../shared/events/event-bus.js";

export const treasuryService = {
  // --- Bank Accounts ---
  createBankAccount: async (organizationId: string, data: CreateBankAccountInput) => {
    // 1. Create a corresponding GL Account for this Bank Account
    const accountCode = await generateBankAccountCode(organizationId);
    
    // Check if parent account "Bank Account" or "Current Assets" exists to link to
    const accounts = await accountingRepository.listAccounts(organizationId);
    
    let isAsset = true;
    if (data.type === "CREDIT_CARD" || data.type === "LOAN") {
      isAsset = false;
    }

    const parentSearchName = isAsset ? "Bank Account" : "Current Liabilities";
    const parentAccount = accounts.find((a: any) => a.name === parentSearchName);
    const parentId = parentAccount ? parentAccount.id : undefined;

    const glAccount = await accountingRepository.createAccount(organizationId, {
      code: accountCode,
      name: data.name,
      type: isAsset ? AccountType.ASSET : AccountType.LIABILITY,
      normalBalance: isAsset ? BalanceType.DEBIT : BalanceType.CREDIT,
      parentId,
      isSystem: false,
    });

    const requiresCustodian = data.type === 'CASH' || data.type === 'PETTY_CASH' || data.requiresCustodian;

    if (requiresCustodian && !data.custodianId) {
      throw new ApiError(400, "A custodian must be assigned for CASH and PETTY_CASH accounts.");
    }

    const { openingBalance, openingBalanceDate, ...bankAccountData } = data;

    // 2. Create the Bank Account linked to the new GL Account
    const bankAccount = await treasuryRepository.createBankAccount(organizationId, glAccount.id, {
      ...bankAccountData,
      requiresCustodian,
      custodianId: requiresCustodian ? data.custodianId : undefined,
    });

    if (openingBalance && Number(openingBalance) !== 0) {
      let equityAccount = accounts.find((a: any) => a.name === "Opening Balance Equity" || a.code === "3000");
      if (!equityAccount) {
        equityAccount = await accountingRepository.createAccount(organizationId, {
          code: "3000",
          name: "Opening Balance Equity",
          type: AccountType.EQUITY,
          normalBalance: BalanceType.CREDIT,
          isSystem: true,
        });
      }

      const amount = Number(openingBalance);
      const isPositive = amount > 0;
      const absAmount = Math.abs(amount);

      let debitAccountId, creditAccountId;
      
      if (isAsset) {
         if (isPositive) {
           debitAccountId = glAccount.id;
           creditAccountId = equityAccount.id;
         } else {
           debitAccountId = equityAccount.id;
           creditAccountId = glAccount.id;
         }
      } else {
         // Liability: Positive opening balance means we have outstanding debt (Credit balance)
         if (isPositive) {
           debitAccountId = equityAccount.id;
           creditAccountId = glAccount.id;
         } else {
           debitAccountId = glAccount.id;
           creditAccountId = equityAccount.id;
         }
      }

      const lines = [
        {
          accountId: debitAccountId,
          debit: absAmount,
          credit: 0,
          description: "Opening Balance",
        },
        {
          accountId: creditAccountId,
          debit: 0,
          credit: absAmount,
          description: "Opening Balance Offset",
        }
      ];

      const journalEntry = await accountingService.postJournalEntry(organizationId, {
        description: `Opening Balance for ${bankAccount.name}`,
        referenceType: "BANK_TRANSACTION",
        referenceId: "OPENING_BALANCE",
        postedAt: openingBalanceDate || new Date(),
        lines,
      });

      await treasuryRepository.createBankTransaction(organizationId, {
        bankAccountId: bankAccount.id,
        type: isAsset ? (isPositive ? "DEPOSIT" : "WITHDRAWAL") : (isPositive ? "WITHDRAWAL" : "DEPOSIT"),
        amount: absAmount,
        description: "Opening Balance",
        reference: "OPENING_BALANCE",
        transactionDate: openingBalanceDate || new Date(),
        status: "CLEARED",
      }, journalEntry.id);
    }

    emitTreasuryAccountCreated({
      organizationId,
      accountId: bankAccount.id,
    });

    return bankAccount;
  },

  updateBankAccount: async (organizationId: string, id: string, data: UpdateBankAccountInput) => {
    const existing = await treasuryRepository.getBankAccountById(organizationId, id);
    if (!existing) {
      throw new ApiError(404, "Bank Account not found");
    }

    const type = data.type || existing.type;
    const requiresCustodian = type === 'CASH' || type === 'PETTY_CASH' || (data.requiresCustodian ?? existing.requiresCustodian);
    const custodianId = data.custodianId !== undefined ? data.custodianId : existing.custodianId;

    if (requiresCustodian && !custodianId) {
      throw new ApiError(400, "A custodian must be assigned for CASH and PETTY_CASH accounts.");
    }

    // If name is changing, update the linked GL account name as well
    if (data.name && data.name !== existing.name) {
      await accountingRepository.updateAccount(organizationId, existing.linkedAccountId, {
        name: data.name,
      });
    }

    return treasuryRepository.updateBankAccount(organizationId, id, {
      ...data,
      requiresCustodian,
      custodianId: requiresCustodian ? custodianId : undefined,
    } as any);
  },

  getBankAccountById: async (organizationId: string, id: string) => {
    const account = await treasuryRepository.getBankAccountById(organizationId, id);
    if (!account) {
      throw new ApiError(404, "Bank Account not found");
    }
    return account;
  },

  freezeBankAccount: async (organizationId: string, id: string) => {
    const existing = await treasuryRepository.getBankAccountById(organizationId, id);
    if (!existing) {
      throw new ApiError(404, "Bank Account not found");
    }

    const updated = await treasuryRepository.updateBankAccount(organizationId, id, { isFrozen: true } as any);
    emitTreasuryAccountFrozen({ organizationId, accountId: id });
    return updated;
  },

  closeBankAccount: async (organizationId: string, id: string, userId: string) => {
    const existing = await treasuryRepository.getBankAccountById(organizationId, id);
    if (!existing) {
      throw new ApiError(404, "Bank Account not found");
    }

    if (existing.closedAt) {
      throw new ApiError(400, "Bank Account is already closed.");
    }

    const updated = await treasuryRepository.updateBankAccount(organizationId, id, { 
      closedAt: new Date(),
      closedById: userId,
      isActive: false
    } as any);
    
    emitTreasuryAccountClosed({ organizationId, accountId: id });
    return updated;
  },

  listBankAccounts: async (organizationId: string) => {
    return treasuryRepository.listBankAccounts(organizationId);
  },

  // --- Bank Transactions ---
  createBankTransaction: async (organizationId: string, data: CreateBankTransactionInput) => {
    const bankAccount = await treasuryRepository.getBankAccountById(organizationId, data.bankAccountId);
    if (!bankAccount) {
      throw new ApiError(404, "Bank Account not found");
    }

    const accounts = await accountingRepository.listAccounts(organizationId);
    
    // Find offset accounts for different transaction types
    let offsetAccountId: string;
    let bankIsDebit = false; // By default, let's assume it's a withdrawal (credit to bank)

    if (data.offsetAccountId) {
      offsetAccountId = data.offsetAccountId;
    } else {
      if (data.type === "DEPOSIT") {
        bankIsDebit = true;
        // Default offset for a generic deposit might be "Other Income" or a suspense account.
        // Ideally, the user selects the offset account. For a simplified module, we map to Sales/Other Income.
        const otherIncome = accounts.find((a: any) => a.name === "Other Income" || a.code === "4200");
        if (!otherIncome) throw new ApiError(500, "Could not find generic income account for deposit.");
        offsetAccountId = otherIncome.id;
      } else if (data.type === "WITHDRAWAL") {
        bankIsDebit = false;
        const otherExpense = accounts.find((a: any) => a.name === "Office Expense" || a.code === "6700");
        if (!otherExpense) throw new ApiError(500, "Could not find generic expense account for withdrawal.");
        offsetAccountId = otherExpense.id;
      } else if (data.type === "BANK_FEE") {
        bankIsDebit = false;
        const bankCharges = accounts.find((a: any) => a.name === "Bank Charges" || a.code === "6900");
        if (!bankCharges) throw new ApiError(500, "Could not find Bank Charges account.");
        offsetAccountId = bankCharges.id;
      } else if (data.type === "INTEREST") {
        bankIsDebit = true;
        const interestIncome = accounts.find((a: any) => a.name === "Interest Income" || a.code === "4300");
        if (!interestIncome) throw new ApiError(500, "Could not find Interest Income account.");
        offsetAccountId = interestIncome.id;
      } else {
        throw new ApiError(400, "Invalid transaction type");
      }
    }

    const amount = Number(data.amount);
    if (amount <= 0) {
      throw new ApiError(400, "Amount must be strictly positive.");
    }

    // Prepare Journal Lines
    const lines = [
      {
        accountId: bankAccount.linkedAccountId,
        debit: bankIsDebit ? amount : 0,
        credit: bankIsDebit ? 0 : amount,
        description: data.description || `${data.type} - ${bankAccount.name}`,
      },
      {
        accountId: offsetAccountId,
        debit: bankIsDebit ? 0 : amount,
        credit: bankIsDebit ? amount : 0,
        description: data.description || `${data.type} offset`,
      }
    ];

    // Post to GL
    const journalEntry = await accountingService.postJournalEntry(organizationId, {
      description: data.description || `Bank ${data.type} via ${bankAccount.name}`,
      referenceType: "BANK_TRANSACTION",
      referenceId: data.reference || "BANK",
      postedAt: data.transactionDate,
      lines,
    });

    // Create Bank Transaction
    return treasuryRepository.createBankTransaction(organizationId, data, journalEntry.id);
  },

  reconcileTransaction: async (transactionId: string) => {
    return treasuryRepository.reconcileTransaction(transactionId);
  },

  listBankTransactions: async (organizationId: string, filters: BankTransactionFilters) => {
    return treasuryRepository.listBankTransactions(organizationId, filters);
  },
};

// Helper to generate a unique GL code for the new bank account
async function generateBankAccountCode(organizationId: string): Promise<string> {
  const accounts = await accountingRepository.listAccounts(organizationId);
  const bankAccounts = accounts.filter((a: any) => a.code.startsWith("103") && a.code !== "1030");
  
  if (bankAccounts.length === 0) {
    return "1031";
  }
  
  const codes = bankAccounts.map((a: any) => parseInt(a.code, 10)).filter((n: number) => !isNaN(n));
  const maxCode = Math.max(...codes);
  return (maxCode + 1).toString();
}
