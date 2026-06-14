
import { accountingRepository } from "./accounting.repository.js";
import ApiError from "../../../utils/ApiError.js";
import { CreateJournalEntryInput, TrialBalanceFilters, CreateAccountInput } from "./accounting.types.js";
import { AccountType, Prisma, BalanceType } from "@prisma/client";
import { accountMappingService } from "./mapping.service.js";

export const accountingService = {
  // ACCOUNTS
  seedDefaultAccounts: async (organizationId: string) => {
    interface AccountSeed { code: string; name: string; type: AccountType; normalBalance: BalanceType; isSystem?: boolean; children?: AccountSeed[]; }
    const defaultAccounts: AccountSeed[] = [
      // Assets
      { code: "1000", name: "Current Assets", type: AccountType.ASSET, normalBalance: BalanceType.DEBIT, isSystem: true, children: [
        { code: "1010", name: "Cash", type: AccountType.ASSET, normalBalance: BalanceType.DEBIT, isSystem: true },
        { code: "1020", name: "Petty Cash", type: AccountType.ASSET, normalBalance: BalanceType.DEBIT, isSystem: true },
        { code: "1030", name: "Bank Account", type: AccountType.ASSET, normalBalance: BalanceType.DEBIT, isSystem: true },
        { code: "1100", name: "Accounts Receivable", type: AccountType.ASSET, normalBalance: BalanceType.DEBIT, isSystem: true },
        { code: "1200", name: "Inventory Asset", type: AccountType.ASSET, normalBalance: BalanceType.DEBIT, isSystem: true, children: [
          { code: "1210", name: "Raw Materials Inventory", type: AccountType.ASSET, normalBalance: BalanceType.DEBIT, isSystem: true },
          { code: "1220", name: "Finished Goods Inventory", type: AccountType.ASSET, normalBalance: BalanceType.DEBIT, isSystem: true },
        ]},
        { code: "1300", name: "Input GST Receivable", type: AccountType.ASSET, normalBalance: BalanceType.DEBIT, isSystem: true },
        { code: "1400", name: "Employee Advances", type: AccountType.ASSET, normalBalance: BalanceType.DEBIT, isSystem: true },
        { code: "1500", name: "Security Deposits", type: AccountType.ASSET, normalBalance: BalanceType.DEBIT, isSystem: true },
        { code: "1600", name: "Prepaid Expenses", type: AccountType.ASSET, normalBalance: BalanceType.DEBIT, isSystem: true },
      ]},
      { code: "1700", name: "Fixed Assets", type: AccountType.ASSET, normalBalance: BalanceType.DEBIT, isSystem: true, children: [
        { code: "1710", name: "Furniture & Fixtures", type: AccountType.ASSET, normalBalance: BalanceType.DEBIT, isSystem: true },
        { code: "1720", name: "Computers & Equipment", type: AccountType.ASSET, normalBalance: BalanceType.DEBIT, isSystem: true },
        { code: "1730", name: "Vehicles", type: AccountType.ASSET, normalBalance: BalanceType.DEBIT, isSystem: true },
      ]},
      { code: "1800", name: "Accumulated Depreciation", type: AccountType.ASSET, normalBalance: BalanceType.CREDIT, isSystem: true },
      
      // Liabilities
      { code: "2000", name: "Current Liabilities", type: AccountType.LIABILITY, normalBalance: BalanceType.CREDIT, isSystem: true, children: [
        { code: "2010", name: "Accounts Payable", type: AccountType.LIABILITY, normalBalance: BalanceType.CREDIT, isSystem: true },
        { code: "2100", name: "Output GST Payable", type: AccountType.LIABILITY, normalBalance: BalanceType.CREDIT, isSystem: true },
        { code: "2110", name: "TDS Payable", type: AccountType.LIABILITY, normalBalance: BalanceType.CREDIT, isSystem: true },
        { code: "2120", name: "PF Payable", type: AccountType.LIABILITY, normalBalance: BalanceType.CREDIT, isSystem: true },
        { code: "2130", name: "ESI Payable", type: AccountType.LIABILITY, normalBalance: BalanceType.CREDIT, isSystem: true },
        { code: "2200", name: "Salary Payable", type: AccountType.LIABILITY, normalBalance: BalanceType.CREDIT, isSystem: true },
        { code: "2300", name: "Customer Advances", type: AccountType.LIABILITY, normalBalance: BalanceType.CREDIT, isSystem: true },
      ]},
      { code: "2400", name: "Loans Payable", type: AccountType.LIABILITY, normalBalance: BalanceType.CREDIT, isSystem: true, children: [
        { code: "2410", name: "Short Term Loans", type: AccountType.LIABILITY, normalBalance: BalanceType.CREDIT, isSystem: true },
        { code: "2420", name: "Long Term Loans", type: AccountType.LIABILITY, normalBalance: BalanceType.CREDIT, isSystem: true },
      ]},

      // Equity
      { code: "3000", name: "Owner Capital", type: AccountType.EQUITY, normalBalance: BalanceType.CREDIT, isSystem: true },
      { code: "3100", name: "Retained Earnings", type: AccountType.EQUITY, normalBalance: BalanceType.CREDIT, isSystem: true },
      { code: "3200", name: "Current Year Earnings", type: AccountType.EQUITY, normalBalance: BalanceType.CREDIT, isSystem: true },
      { code: "3300", name: "Drawings", type: AccountType.EQUITY, normalBalance: BalanceType.DEBIT, isSystem: true },

      // Revenue
      { code: "4000", name: "Operating Revenue", type: AccountType.REVENUE, normalBalance: BalanceType.CREDIT, isSystem: true, children: [
        { code: "4010", name: "Sales Revenue", type: AccountType.REVENUE, normalBalance: BalanceType.CREDIT, isSystem: true },
        { code: "4100", name: "Service Revenue", type: AccountType.REVENUE, normalBalance: BalanceType.CREDIT, isSystem: true },
      ]},
      { code: "4200", name: "Other Income", type: AccountType.REVENUE, normalBalance: BalanceType.CREDIT, isSystem: true, children: [
        { code: "4300", name: "Interest Income", type: AccountType.REVENUE, normalBalance: BalanceType.CREDIT, isSystem: true },
        { code: "4400", name: "Discount Received", type: AccountType.REVENUE, normalBalance: BalanceType.CREDIT, isSystem: true },
      ]},

      // Expenses
      { code: "5000", name: "Direct Expenses (COGS)", type: AccountType.EXPENSE, normalBalance: BalanceType.DEBIT, isSystem: true, children: [
        { code: "5010", name: "Cost of Goods Sold", type: AccountType.EXPENSE, normalBalance: BalanceType.DEBIT, isSystem: true },
        { code: "5100", name: "Purchase Expense", type: AccountType.EXPENSE, normalBalance: BalanceType.DEBIT, isSystem: true },
        { code: "5200", name: "Freight Inward", type: AccountType.EXPENSE, normalBalance: BalanceType.DEBIT, isSystem: true },
        { code: "5300", name: "Inventory Adjustment Loss", type: AccountType.EXPENSE, normalBalance: BalanceType.DEBIT, isSystem: true },
      ]},
      { code: "6000", name: "Operating Expenses", type: AccountType.EXPENSE, normalBalance: BalanceType.DEBIT, isSystem: true, children: [
        { code: "6010", name: "Salary Expense", type: AccountType.EXPENSE, normalBalance: BalanceType.DEBIT, isSystem: true },
        { code: "6100", name: "Rent Expense", type: AccountType.EXPENSE, normalBalance: BalanceType.DEBIT, isSystem: true },
        { code: "6200", name: "Electricity Expense", type: AccountType.EXPENSE, normalBalance: BalanceType.DEBIT, isSystem: true },
        { code: "6300", name: "Internet Expense", type: AccountType.EXPENSE, normalBalance: BalanceType.DEBIT, isSystem: true },
        { code: "6400", name: "Software Expense", type: AccountType.EXPENSE, normalBalance: BalanceType.DEBIT, isSystem: true },
        { code: "6500", name: "Marketing Expense", type: AccountType.EXPENSE, normalBalance: BalanceType.DEBIT, isSystem: true },
        { code: "6600", name: "Travel Expense", type: AccountType.EXPENSE, normalBalance: BalanceType.DEBIT, isSystem: true },
        { code: "6700", name: "Office Expense", type: AccountType.EXPENSE, normalBalance: BalanceType.DEBIT, isSystem: true },
        { code: "6800", name: "Professional Fees", type: AccountType.EXPENSE, normalBalance: BalanceType.DEBIT, isSystem: true },
        { code: "6900", name: "Bank Charges", type: AccountType.EXPENSE, normalBalance: BalanceType.DEBIT, isSystem: true },
      ]},
      { code: "7000", name: "Depreciation & Finance", type: AccountType.EXPENSE, normalBalance: BalanceType.DEBIT, isSystem: true, children: [
        { code: "7010", name: "Depreciation Expense", type: AccountType.EXPENSE, normalBalance: BalanceType.DEBIT, isSystem: true },
        { code: "7100", name: "Interest Expense", type: AccountType.EXPENSE, normalBalance: BalanceType.DEBIT, isSystem: true },
      ]}
    ];

    const seedLevel = async (accounts: AccountSeed[], parentId?: string) => {
      for (const acc of accounts) {
        let existing = await accountingRepository.getAccountByCode(organizationId, acc.code);
        if (!existing) {
          existing = await accountingRepository.createAccount(organizationId, {
            code: acc.code,
            name: acc.name,
            type: acc.type,
            normalBalance: acc.normalBalance,
            isSystem: acc.isSystem,
            parentId: parentId
          });
        }
        if (acc.children && acc.children.length > 0) {
          await seedLevel(acc.children, existing.id);
        }
      }
    };

    await seedLevel(defaultAccounts);

    // Setup required mappings
    const mappingsToSetup = [
      { key: "arAccountId", code: "1100" },
      { key: "apAccountId", code: "2010" },
      { key: "cogsAccountId", code: "5010" },
      { key: "inventoryAccountId", code: "1200" },
      { key: "grniAccountId", code: "2010" }, // Using AP for GRNI as fallback
      { key: "taxReceivableAccountId", code: "1300" },
      { key: "taxPayableAccountId", code: "2100" },
      { key: "revenueAccountId", code: "4010" },
    ];

    for (const m of mappingsToSetup) {
      const acc = await accountingRepository.getAccountByCode(organizationId, m.code);
      if (acc) {
        await accountMappingService.setMapping(organizationId, m.key, acc.id);
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

  createAccount: async (organizationId: string, payload: CreateAccountInput) => {
    const existing = await accountingRepository.getAccountByCode(organizationId, payload.code);
    if (existing) {
      throw new ApiError(400, `Account with code ${payload.code} already exists.`);
    }
    return accountingRepository.createAccount(organizationId, payload);
  },

  updateAccount: async (organizationId: string, id: string, payload: { name?: string; description?: string }) => {
    const accounts = await accountingRepository.listAccounts(organizationId);
    const existing = accounts.find((a: any) => a.id === id);
    if (!existing) {
      throw new ApiError(404, "Account not found");
    }
    if (existing.isSystem) {
      throw new ApiError(400, "Cannot modify system accounts.");
    }
    return accountingRepository.updateAccount(organizationId, id, payload);
  },

  validateAccountingSetup: async (organizationId: string) => {
    const mappings = await accountingRepository.getDefaultAccountMapping(organizationId);
    if (!mappings || !mappings.arAccountId || !mappings.apAccountId || !mappings.revenueAccountId || !mappings.inventoryAccountId || !mappings.cogsAccountId) {
      throw new ApiError(500, "Accounting setup is incomplete. Critical accounts (AR, AP, Revenue, Inventory, COGS) must be mapped before automated journals can run.");
    }
    return mappings;
  },

  // JOURNALS
  postJournalEntry: async (organizationId: string, data: CreateJournalEntryInput) => {
    // Removed sourceEventId logic
    
    // Validate double entry (Debits == Credits)
    let totalDebit = new Prisma.Decimal(0);
    let totalCredit = new Prisma.Decimal(0);

    for (const line of data.lines) {
      totalDebit = totalDebit.plus(line.debit);
      totalCredit = totalCredit.plus(line.credit);
    }

    if (!totalDebit.equals(totalCredit)) {
      throw new ApiError(400, `Journal entry must balance. Debits: ${totalDebit.toString()}, Credits: ${totalCredit.toString()}`);
    }

    if (totalDebit.lte(0)) {
      throw new ApiError(400, "Journal entry must have a non-zero value");
    }

    const postedDate = data.postedAt || new Date();
    const period = await accountingRepository.getAccountingPeriodForDate(organizationId, postedDate);
    
    if (period && period.isClosed) {
      throw new ApiError(400, `Accounting period for ${postedDate.toISOString()} is closed.`);
    }

    // Check fiscal year
    const fiscalYear = await accountingRepository.getActiveFiscalYear(organizationId);
    if (!fiscalYear) {
      throw new ApiError(400, "No active fiscal year found to post journal entry.");
    }

    return accountingRepository.createJournalEntry(organizationId, data);
  },

  listJournals: async (organizationId: string, filters: { startDate?: Date; endDate?: Date; referenceType?: string; accountId?: string; page?: number; limit?: number }) => {
    return accountingRepository.listJournals(organizationId, filters);
  },

  getJournalById: async (organizationId: string, id: string) => {
    const journal = await accountingRepository.getJournalById(organizationId, id);
    if (!journal) {
      throw new ApiError(404, "Journal entry not found");
    }
    return journal;
  },

  reverseJournalEntry: async (organizationId: string, id: string, reversalDate?: Date) => {
    const dateToUse = reversalDate || new Date();
    const period = await accountingRepository.getAccountingPeriodForDate(organizationId, dateToUse);
    
    if (period && period.isClosed) {
      throw new ApiError(400, `Accounting period for ${dateToUse.toISOString()} is closed.`);
    }

    const fiscalYear = await accountingRepository.getActiveFiscalYear(organizationId);
    if (!fiscalYear) {
      throw new ApiError(400, "No active fiscal year found to post reversal journal entry.");
    }

    try {
      return await accountingRepository.reverseJournalEntry(organizationId, id, dateToUse);
    } catch (error: any) {
      throw new ApiError(400, error.message || "Failed to reverse journal entry");
    }
  },

  postOpeningBalances: async (organizationId: string, date: Date, lines: { accountId: string; debit: number; credit: number }[]) => {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      totalDebit += Number(line.debit);
      totalCredit += Number(line.credit);
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new ApiError(400, `Opening balances must balance. Total Debit: ${totalDebit}, Total Credit: ${totalCredit}`);
    }

    const payload: CreateJournalEntryInput = {
      referenceId: "OPENING_BALANCE",
      referenceType: "OPENING_BALANCE",
      description: "Opening Balances Migration",
      postedAt: date,
      lines: lines.map(l => ({
        accountId: l.accountId,
        debit: l.debit,
        credit: l.credit,
        description: "Opening Balance"
      }))
    };

    return accountingService.postJournalEntry(organizationId, payload);
  },

  postInvoiceJournal: async (organizationId: string, invoiceId: string, invoiceNumber: string, subtotal: number, taxAmount: number, discountAmount: number, totalAmount: number) => {
    const mappings = await accountingRepository.getDefaultAccountMapping(organizationId);
    if (!mappings || !mappings.arAccountId || !mappings.revenueAccountId || !mappings.taxPayableAccountId) {
      throw new ApiError(500, "Missing default accounting mappings (AR, Revenue, or Tax Payable). Please configure default accounts.");
    }

    const lines = [
      { accountId: mappings.arAccountId, debit: totalAmount, credit: 0 },
      { accountId: mappings.revenueAccountId, debit: 0, credit: subtotal - discountAmount },
    ];

    if (taxAmount > 0) {
      lines.push({ accountId: mappings.taxPayableAccountId, debit: 0, credit: taxAmount });
    }

    return accountingService.postJournalEntry(organizationId, {
      description: `Invoice ${invoiceNumber} issued`,
      referenceType: "INVOICE",
      referenceId: invoiceId,
      lines,
    });
  },

  postPaymentJournal: async (organizationId: string, paymentId: string, invoiceNumber: string, amount: number, paymentMethod: string) => {
    const mappings = await accountingRepository.getDefaultAccountMapping(organizationId);
    if (!mappings || !mappings.arAccountId) {
      throw new ApiError(500, "Missing default accounting mappings for AR. Please configure default accounts.");
    }

    // In a full implementation, paymentMethod should map to a specific bank or cash account ID.
    // For now we will rely on a generic Bank/Cash account if available in mappings.
    // Assuming we added cashAccountId and bankAccountId, but let's just use what's available.
    // Since we didn't add bank/cash to DefaultAccountMapping explicitly, we might need to look it up 
    // or assume the user will provide the debitAccountId explicitly in a mature setup.
    // To keep it simple and remove hardcoded "1000", we should query by type or use BankAccount model.
    // We will query the first Bank account.
    const bankAccounts = await accountingRepository.listAccounts(organizationId);
    const cashAccount = bankAccounts.find((a: any) => a.name === "Cash" || a.code === "1000");
    const bankAccount = bankAccounts.find((a: any) => a.name === "Bank" || a.code === "1010");
    
    if (!cashAccount || !bankAccount) {
      throw new ApiError(500, "Missing bank/cash accounts. Please configure default accounts.");
    }

    const debitAccount = ["BANK_TRANSFER", "UPI", "CARD", "CHEQUE"].includes(paymentMethod) ? bankAccount : cashAccount;

    const lines = [
      { accountId: debitAccount.id, debit: amount, credit: 0 },
      { accountId: mappings.arAccountId, debit: 0, credit: amount },
    ];

    return accountingService.postJournalEntry(organizationId, {
      description: `Payment received for Invoice ${invoiceNumber}`,
      referenceType: "PAYMENT",
      referenceId: paymentId,
      lines,
    });
  },

  postExpenseJournal: async (organizationId: string, expenseId: string, description: string, amount: number, category?: string) => {
    const accounts = await accountingRepository.listAccounts(organizationId);
    
    // Attempt to match category to specific expense account
    const categoryMapping: Record<string, string> = {
      "SALARY": "Salary Expense",
      "RENT": "Rent Expense",
      "UTILITIES": "Electricity Expense",
      "MARKETING": "Marketing Expense",
      "TRAVEL": "Travel Expense",
      "SOFTWARE": "Software Expense",
      "OTHER": "Office Expense"
    };
    
    const targetAccountName = category ? categoryMapping[category] : undefined;
    let expAccount = accounts.find((a: any) => a.name === targetAccountName);
    
    // Fallback to first EXPENSE account
    if (!expAccount) {
      expAccount = accounts.find((a: any) => a.type === "EXPENSE");
    }

    const cashAccount = accounts.find((a: any) => a.name === "Cash" || a.code === "1000");

    if (!expAccount || !cashAccount) {
      throw new ApiError(500, "Missing default expense or cash accounts.");
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
    const mappings = await accountingRepository.getDefaultAccountMapping(organizationId);
    if (!mappings || !mappings.inventoryAccountId || !mappings.apAccountId || !mappings.taxReceivableAccountId) {
      throw new ApiError(500, "Missing default accounting mappings for Inventory, AP, or Tax Receivable. Please configure accounts.");
    }

    const lines = [
      { accountId: mappings.inventoryAccountId, debit: subtotal - discountAmount, credit: 0 },
      { accountId: mappings.apAccountId, debit: 0, credit: totalAmount },
    ];

    if (taxAmount > 0) {
      lines.push({ accountId: mappings.taxReceivableAccountId, debit: taxAmount, credit: 0 }); // Debit tax for purchases
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
    let totalDebit = new Prisma.Decimal(0);
    let totalCredit = new Prisma.Decimal(0);

    for (const line of lines!) {
      if (!line) continue;
      totalDebit = totalDebit.plus(line.totalDebit);
      totalCredit = totalCredit.plus(line.totalCredit);
    }

    return {
      accounts: lines,
      totals: {
        debit: totalDebit.toNumber(),
        credit: totalCredit.toNumber(),
        isBalanced: totalDebit.minus(totalCredit).abs().toNumber() < 0.01,
      }
    };
  },

  getProfitAndLoss: async (organizationId: string, startDate?: Date, endDate?: Date) => {
    const tb = await accountingRepository.getTrialBalance(organizationId, startDate, endDate);
    const revenues = tb.filter((a: any) => a.accountType === "REVENUE");
    const expenses = tb.filter((a: any) => a.accountType === "EXPENSE");

    const totalRevenue = revenues.reduce((sum: Prisma.Decimal, a: any) => sum.plus(a.netBalance), new Prisma.Decimal(0));
    const totalExpense = expenses.reduce((sum: Prisma.Decimal, a: any) => sum.plus(a.netBalance), new Prisma.Decimal(0));

    return {
      revenues,
      expenses,
      totals: {
        revenue: totalRevenue.toNumber(),
        expense: totalExpense.toNumber(),
      },
      netProfit: totalRevenue.minus(totalExpense).toNumber(),
    };
  },

  getBalanceSheet: async (organizationId: string, asOfDate?: Date) => {
    const tb = await accountingRepository.getTrialBalance(organizationId, undefined, asOfDate);
    const assets = tb.filter((a: any) => a.accountType === "ASSET");
    const liabilities = tb.filter((a: any) => a.accountType === "LIABILITY");
    const equity = tb.filter((a: any) => a.accountType === "EQUITY");

    const revenues = tb.filter((a: any) => a.accountType === "REVENUE");
    const expenses = tb.filter((a: any) => a.accountType === "EXPENSE");
    const totalRevenue = revenues.reduce((sum: Prisma.Decimal, a: any) => sum.plus(a.netBalance), new Prisma.Decimal(0));
    const totalExpense = expenses.reduce((sum: Prisma.Decimal, a: any) => sum.plus(a.netBalance), new Prisma.Decimal(0));
    const netProfit = totalRevenue.minus(totalExpense);

    if (!netProfit.isZero()) {
      equity.push({
        accountId: "virtual-retained-earnings",
        accountCode: "-",
        accountName: "Current Year Earnings",
        accountType: "EQUITY" as AccountType,
        totalDebit: netProfit.isNegative() ? netProfit.abs() : new Prisma.Decimal(0),
        totalCredit: netProfit.isPositive() ? netProfit : new Prisma.Decimal(0),
        netBalance: netProfit,
      } as any);
    }

    const totalAssets = assets.reduce((sum: Prisma.Decimal, a: any) => sum.plus(a.netBalance), new Prisma.Decimal(0));
    const totalLiabilities = liabilities.reduce((sum: Prisma.Decimal, a: any) => sum.plus(a.netBalance), new Prisma.Decimal(0));
    const totalEquity = equity.reduce((sum: Prisma.Decimal, a: any) => sum.plus(a.netBalance), new Prisma.Decimal(0));

    return {
      assets,
      liabilities,
      equity,
      totals: {
        assets: totalAssets.toNumber(),
        liabilities: totalLiabilities.toNumber(),
        equity: totalEquity.toNumber(),
      },
      isBalanced: totalAssets.minus(totalLiabilities.plus(totalEquity)).abs().toNumber() < 0.01,
    };
  },

  // FISCAL YEAR
  createFiscalYear: async (organizationId: string, payload: { name: string; startDate: Date; endDate: Date }) => {
    return accountingRepository.createFiscalYear(organizationId, payload.name, payload.startDate, payload.endDate);
  },

  listFiscalYears: async (organizationId: string) => {
    return accountingRepository.listFiscalYears(organizationId);
  },

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


