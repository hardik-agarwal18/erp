
import { accountingRepository } from "./accounting.repository.js";
import ApiError from "../../../utils/ApiError.js";
import { CreateJournalEntryInput, TrialBalanceFilters } from "./accounting.types.js";
import { AccountType } from "@prisma/client";

export const accountingService = {
  // ACCOUNTS
  seedDefaultAccounts: async (organizationId: string) => {
    const defaultAccounts = [
      // Assets (1000)
      { code: "1000", name: "Cash", type: AccountType.ASSET, isSystem: true },
      { code: "1010", name: "Bank", type: AccountType.ASSET, isSystem: true },
      { code: "1200", name: "Accounts Receivable", type: AccountType.ASSET, isSystem: true },
      { code: "1300", name: "Inventory", type: AccountType.ASSET, isSystem: true },
      
      // Liabilities (2000)
      { code: "2000", name: "Accounts Payable", type: AccountType.LIABILITY, isSystem: true },
      { code: "2100", name: "Tax Payable", type: AccountType.LIABILITY, isSystem: true },
      
      // Equity (3000)
      { code: "3000", name: "Owner's Equity", type: AccountType.EQUITY, isSystem: true },
      { code: "3100", name: "Retained Earnings", type: AccountType.EQUITY, isSystem: true },
      
      // Revenue (4000)
      { code: "4000", name: "Sales Revenue", type: AccountType.REVENUE, isSystem: true },
      { code: "4100", name: "Other Income", type: AccountType.REVENUE, isSystem: true },
      
      // Expenses (5000)
      { code: "5000", name: "Cost of Goods Sold", type: AccountType.EXPENSE, isSystem: true },
      { code: "5100", name: "Operating Expenses", type: AccountType.EXPENSE, isSystem: true },
      { code: "5200", name: "Salary Expense", type: AccountType.EXPENSE, isSystem: true },
      { code: "5300", name: "Rent Expense", type: AccountType.EXPENSE, isSystem: true },
    ];

    for (const acc of defaultAccounts) {
      const existing = await accountingRepository.getAccountByCode(organizationId, acc.code);
      if (!existing) {
        await accountingRepository.createAccount(organizationId, acc);
      }
    }
  },

  getSystemAccount: async (organizationId: string, name: string) => {
    const account = await accountingRepository.getSystemAccount(organizationId, name);
    if (!account) {
      throw new ApiError(500, `System account '${name}' is missing for organization. Please seed accounts.`);
    }
    return account;
  },

  listAccounts: async (organizationId: string) => {
    return accountingRepository.listAccounts(organizationId);
  },

  // JOURNALS
  postJournalEntry: async (organizationId: string, data: CreateJournalEntryInput) => {
    // Validate double entry (Debits == Credits)
    const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + line.credit, 0);

    // Using a small epsilon for floating point issues, though Decimal handles this better, 
    // it's good practice.
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new ApiError(400, `Journal entry must balance. Debits: ${totalDebit}, Credits: ${totalCredit}`);
    }

    if (totalDebit <= 0) {
      throw new ApiError(400, "Journal entry must have a non-zero value");
    }

    // Check fiscal year
    const fiscalYear = await accountingRepository.getActiveFiscalYear(organizationId);
    if (!fiscalYear) {
      throw new ApiError(400, "No active fiscal year found to post journal entry.");
    }

    return accountingRepository.createJournalEntry(organizationId, data);
  },

  postInvoiceJournal: async (organizationId: string, invoiceId: string, invoiceNumber: string, subtotal: number, taxAmount: number, discountAmount: number, totalAmount: number) => {
    const arAccount = await accountingRepository.getAccountByCode(organizationId, "1200");
    const revAccount = await accountingRepository.getAccountByCode(organizationId, "4000");
    const taxAccount = await accountingRepository.getAccountByCode(organizationId, "2100");

    if (!arAccount || !revAccount || !taxAccount) {
      throw new ApiError(500, "Missing default accounting accounts. Please seed accounts.");
    }

    const lines = [
      { accountId: arAccount.id, debit: totalAmount, credit: 0 },
      { accountId: revAccount.id, debit: 0, credit: subtotal - discountAmount },
    ];

    if (taxAmount > 0) {
      lines.push({ accountId: taxAccount.id, debit: 0, credit: taxAmount });
    }

    return accountingService.postJournalEntry(organizationId, {
      description: `Invoice ${invoiceNumber} issued`,
      referenceType: "INVOICE",
      referenceId: invoiceId,
      lines,
    });
  },

  postPaymentJournal: async (organizationId: string, paymentId: string, invoiceNumber: string, amount: number, paymentMethod: string) => {
    const cashAccount = await accountingRepository.getAccountByCode(organizationId, "1000");
    const bankAccount = await accountingRepository.getAccountByCode(organizationId, "1010");
    const arAccount = await accountingRepository.getAccountByCode(organizationId, "1200");

    if (!cashAccount || !bankAccount || !arAccount) {
      throw new ApiError(500, "Missing default accounting accounts.");
    }

    // Debit Bank if Bank Transfer/UPI/Card/Cheque, otherwise Cash
    const debitAccount = ["BANK_TRANSFER", "UPI", "CARD", "CHEQUE"].includes(paymentMethod) ? bankAccount : cashAccount;

    const lines = [
      { accountId: debitAccount.id, debit: amount, credit: 0 },
      { accountId: arAccount.id, debit: 0, credit: amount },
    ];

    return accountingService.postJournalEntry(organizationId, {
      description: `Payment received for Invoice ${invoiceNumber}`,
      referenceType: "PAYMENT",
      referenceId: paymentId,
      lines,
    });
  },

  postExpenseJournal: async (organizationId: string, expenseId: string, description: string, amount: number) => {
    const expAccount = await accountingRepository.getAccountByCode(organizationId, "5100"); // Operating Expenses
    const cashAccount = await accountingRepository.getAccountByCode(organizationId, "1000"); // Paid via Cash

    if (!expAccount || !cashAccount) {
      throw new ApiError(500, "Missing default accounting accounts.");
    }

    const lines = [
      { accountId: expAccount.id, debit: amount, credit: 0 },
      { accountId: cashAccount.id, debit: 0, credit: amount },
    ];

    return accountingService.postJournalEntry(organizationId, {
      description: `Expense: ${description}`,
      referenceType: "EXPENSE",
      referenceId: expenseId,
      lines,
    });
  },

  postVendorInvoice: async (organizationId: string, invoiceId: string, invoiceNumber: string, subtotal: number, taxAmount: number, discountAmount: number, totalAmount: number) => {
    // Determine the target asset/expense account. For Phase 5, we assume inventory purchases.
    // In the future, this can be dynamically determined per line item.
    const invAccount = await accountingRepository.getAccountByCode(organizationId, "1300"); // Inventory
    const apAccount = await accountingRepository.getAccountByCode(organizationId, "2000"); // Accounts Payable
    const taxAccount = await accountingRepository.getAccountByCode(organizationId, "2100"); // Tax Payable (Input tax could be separated, but using same for now or a dedicated input tax)

    if (!invAccount || !apAccount || !taxAccount) {
      throw new ApiError(500, "Missing default accounting accounts (1300, 2000, or 2100). Please seed accounts.");
    }

    const lines = [
      { accountId: invAccount.id, debit: subtotal - discountAmount, credit: 0 },
      { accountId: apAccount.id, debit: 0, credit: totalAmount },
    ];

    if (taxAmount > 0) {
      lines.push({ accountId: taxAccount.id, debit: taxAmount, credit: 0 }); // Debit tax for purchases
    }

    return accountingService.postJournalEntry(organizationId, {
      description: `Vendor Invoice ${invoiceNumber} posted`,
      referenceType: "VENDOR_INVOICE",
      referenceId: invoiceId,
      lines,
    });
  },

  // REPORTING
  getTrialBalance: async (organizationId: string, filters: TrialBalanceFilters) => {
    const lines = await accountingRepository.getTrialBalance(organizationId, filters.startDate, filters.endDate);
    
    // Calculate totals
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines!) {
      if (!line) continue;
      totalDebit += line.totalDebit;
      totalCredit += line.totalCredit;
    }

    return {
      accounts: lines,
      totals: {
        debit: totalDebit,
        credit: totalCredit,
        isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
      }
    };
  },

  // FISCAL YEAR
  seedFiscalYear: async (organizationId: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    // Assuming standard Apr 1 to Mar 31 for India/UK style, or Jan-Dec.
    // We'll default to Jan 1 - Dec 31 for simplicity, can be configurable.
    const start = new Date(currentYear, 0, 1);
    const end = new Date(currentYear, 11, 31, 23, 59, 59);

    const existing = await accountingRepository.getActiveFiscalYear(organizationId);
    if (!existing) {
      await accountingRepository.createFiscalYear(organizationId, `FY${currentYear}`, start, end);
    }
  }
};
