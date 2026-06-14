import { apiClient } from "@/api/client";

export interface BankAccount {
  id: string;
  name: string;
  accountNumber?: string;
  bankName?: string;
  branchName?: string;
  ifscCode?: string;
  currency: string;
  currentBalance?: string;
  linkedAccountId: string;
  isActive: boolean;
  linkedAccount?: {
    id: string;
    name: string;
    code: string;
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
