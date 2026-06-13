import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export type Account = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  type: AccountType;
  description: string | null;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
};

export type JournalEntry = {
  id: string;
  organizationId: string;
  entryNumber: string;
  postedAt: string;
  description: string;
  referenceType?: string | null;
  referenceId?: string | null;
  isPosted: boolean;
  lines: JournalLine[];
  createdAt: string;
};

export type JournalLine = {
  id: string;
  accountId: string;
  account: { name: string; code: string };
  debit: number;
  credit: number;
  description: string | null;
};

export type FiscalYear = {
  id: string;
  organizationId: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isClosed: boolean;
};

export type TrialBalanceLine = {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
};

export type ProfitAndLossReport = {
  revenues: TrialBalanceLine[];
  expenses: TrialBalanceLine[];
  totals: {
    revenue: number;
    expense: number;
  };
  netProfit: number;
};

export type BalanceSheetReport = {
  assets: TrialBalanceLine[];
  liabilities: TrialBalanceLine[];
  equity: TrialBalanceLine[];
  totals: {
    assets: number;
    liabilities: number;
    equity: number;
  };
  isBalanced: boolean;
};

export const accountingService = {
  // Accounts
  listAccounts: async () => {
    const res = await apiClient.get<{ data: Account[] }>(apiEndpoints.accounting.accounts);
    return res.data;
  },

  createAccount: async (data: any) => {
    const res = await apiClient.post<{ data: Account }>(apiEndpoints.accounting.accounts, data);
    return res.data;
  },

  updateAccount: async (id: string, data: any) => {
    const res = await apiClient.patch<{ data: Account }>(apiEndpoints.accounting.updateAccount(id), data);
    return res.data;
  },

  // Journals
  listJournals: async (filters?: { accountId?: string }) => {
    const res = await apiClient.get<{ data: JournalEntry[] }>(apiEndpoints.accounting.journals, { params: filters });
    return res.data;
  },

  getJournalDetails: async (id: string) => {
    const res = await apiClient.get<{ data: JournalEntry }>(apiEndpoints.accounting.journalDetails(id));
    return res.data;
  },

  createJournal: async (data: any) => {
    const res = await apiClient.post<{ data: JournalEntry }>(apiEndpoints.accounting.journals, data);
    return res.data;
  },

  // Fiscal Years
  listFiscalYears: async () => {
    const res = await apiClient.get<{ data: FiscalYear[] }>(apiEndpoints.accounting.fiscalYears);
    return res.data;
  },

  createFiscalYear: async (data: any) => {
    const res = await apiClient.post<{ data: FiscalYear }>(apiEndpoints.accounting.fiscalYears, data);
    return res.data;
  },

  // Reporting
  getTrialBalance: async (filters?: { startDate?: string; endDate?: string }) => {
    const res = await apiClient.get<{ data: { accounts: TrialBalanceLine[], totals: { debit: number; credit: number; isBalanced: boolean; } } }>(apiEndpoints.accounting.reports.trialBalance, { params: filters });
    return res.data;
  },

  getProfitAndLoss: async (filters?: { startDate?: string; endDate?: string }) => {
    const res = await apiClient.get<{ data: ProfitAndLossReport }>(apiEndpoints.accounting.reports.profitLoss, { params: filters });
    return res.data;
  },

  getBalanceSheet: async (filters?: { asOfDate?: string }) => {
    const res = await apiClient.get<{ data: BalanceSheetReport }>(apiEndpoints.accounting.reports.balanceSheet, { params: filters });
    return res.data;
  },

  getARAging: async (filters?: { asOfDate?: string }) => {
    const res = await apiClient.get<{ data: AgingBucket }>(apiEndpoints.accounting.reports.agingAR, { params: filters });
    return res.data;
  },

  getAPAging: async (filters?: { asOfDate?: string }) => {
    const res = await apiClient.get<{ data: AgingBucket }>(apiEndpoints.accounting.reports.agingAP, { params: filters });
    return res.data;
  },
};

export type AgingBucket = {
  current: number;
  days1To30: number;
  days31To60: number;
  days61To90: number;
  days90Plus: number;
  total: number;
};
