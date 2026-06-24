import { apiClient } from "@/api/client";

export interface BankAccount {
  id: string;
  name: string;
  type: "BANK" | "CASH" | "PETTY_CASH" | "WALLET" | "CREDIT_CARD" | "LOAN" | "DEPOSIT";
  accountNumber?: string;
  bankName?: string;
  branchName?: string;
  ifscCode?: string;
  currency: string;
  openingBalance?: string;
  openingBalanceDate?: string;
  linkedAccountId: string;
  isActive: boolean;
  requiresCustodian?: boolean;
  custodianId?: string;
  linkedAccount?: {
    id: string;
    name: string;
    code: string;
  };
  custodian?: {
    id: string;
    firstName?: string;
    lastName?: string;
    employeeCode?: string;
  };
}

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "BANK_FEE" | "INTEREST";
  amount: string;
  reference?: string;
  description?: string;
  transactionDate: string;
  status: "PENDING" | "CLEARED" | "RECONCILED";
  bankAccount?: BankAccount;
}

export const getBankAccounts = async (): Promise<BankAccount[]> => {
  const { data } = await apiClient.get("/api/v1/treasury/accounts");
  return data;
};

export const createBankAccount = async (payload: Partial<BankAccount>): Promise<BankAccount> => {
  const { data } = await apiClient.post("/api/v1/treasury/accounts", payload);
  return data;
};

export const freezeBankAccount = async (accountId: string): Promise<BankAccount> => {
  const { data } = await apiClient.post(`/api/v1/treasury/accounts/${accountId}/freeze`);
  return data;
};

export const closeBankAccount = async (accountId: string): Promise<BankAccount> => {
  const { data } = await apiClient.post(`/api/v1/treasury/accounts/${accountId}/close`);
  return data;
};

export const getBankTransactions = async (): Promise<BankTransaction[]> => {
  const { data } = await apiClient.get("/api/v1/treasury/transactions");
  return data;
};

export const createBankTransaction = async (payload: Partial<BankTransaction>): Promise<BankTransaction> => {
  const { data } = await apiClient.post("/api/v1/treasury/transactions", payload);
  return data;
};

export const reconcileBankTransaction = async (transactionId: string): Promise<BankTransaction> => {
  const { data } = await apiClient.post("/api/v1/treasury/transactions/" + transactionId + "/reconcile");
  return data;
};

// --- Transfers ---
export interface TreasuryTransfer {
  id: string;
  transferNumber: string;
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  transferDate: string;
  reference?: string;
  externalReference?: string;
  description?: string;
  notes?: string;
  status: "DRAFT" | "POSTED" | "CANCELLED" | "REVERSED";
  reversalReason?: string;
  reversedAt?: string;
  reversedById?: string;
  fromAccount?: BankAccount;
  toAccount?: BankAccount;
  createdBy?: { name: string; email: string };
  attachments?: { id: string; fileId: string; fileName: string; createdAt: string }[];
}

export const getTreasuryTransfers = async (): Promise<TreasuryTransfer[]> => {
  const { data } = await apiClient.get("/api/v1/treasury/transfers");
  return data;
};

export const createTreasuryTransfer = async (payload: Partial<TreasuryTransfer>): Promise<TreasuryTransfer> => {
  const { data } = await apiClient.post("/api/v1/treasury/transfers", payload);
  return data;
};

export const reverseTreasuryTransfer = async (transferId: string, reversalReason: string): Promise<TreasuryTransfer> => {
  const { data } = await apiClient.post(`/api/v1/treasury/transfers/${transferId}/reverse`, { reversalReason });
  return data;
};

// --- Cash Counts ---
export interface CashCount {
  id: string;
  countNumber: string;
  bankAccountId: string;
  expectedBalance: string;
  countedBalance: string;
  varianceAmount: string;
  notes?: string;
  countStartedAt?: string;
  countCompletedAt?: string;
  countDate: string;
  countedById: string;
  verifiedByEmployeeId?: string;
  status: "DRAFT" | "POSTED" | "VOID";
  bankAccount?: BankAccount;
  countedBy?: { firstName: string; lastName: string; employeeCode: string };
  verifiedBy?: { firstName: string; lastName: string; employeeCode: string };
}

export const getCashCounts = async (): Promise<CashCount[]> => {
  const { data } = await apiClient.get("/api/v1/treasury/cash-counts");
  return data;
};

export const createCashCount = async (payload: Partial<CashCount>): Promise<CashCount> => {
  const { data } = await apiClient.post("/api/v1/treasury/cash-counts", payload);
  return data;
};

export const postCashCount = async (id: string): Promise<CashCount> => {
  const { data } = await apiClient.post(`/api/v1/treasury/cash-counts/${id}/post`);
  return data;
};

export const voidCashCount = async (id: string): Promise<CashCount> => {
  const { data } = await apiClient.post(`/api/v1/treasury/cash-counts/${id}/void`);
  return data;
};

// --- Dashboard ---
export interface TreasuryDashboardSummary {
  totalBank: number;
  totalCash: number;
  totalWallet: number;
  totalCreditCard: number;
  availableLiquidity: number;
  netTreasuryPosition: number;
  balancesByType: Record<string, { accountId: string; name: string; balance: number }[]>;
  recentTransfers: TreasuryTransfer[];
}

export const getTreasuryDashboard = async (): Promise<TreasuryDashboardSummary> => {
  const { data } = await apiClient.get("/api/v1/treasury/dashboard");
  return data;
};

export interface TreasuryAlert {
  type: string;
  severity: "info" | "warning" | "critical";
  count: number;
  link: string;
}

export const getTreasuryAlerts = async (): Promise<TreasuryAlert[]> => {
  const { data } = await apiClient.get("/api/v1/treasury/alerts");
  return data;
};

export interface TreasuryActivity {
  id: string;
  type: string;
  date: string;
  title: string;
  description: string;
  reference?: string;
}

export const getTreasuryActivity = async (limit: number = 50): Promise<TreasuryActivity[]> => {
  const { data } = await apiClient.get(`/api/v1/treasury/activity?limit=${limit}`);
  return data;
};
