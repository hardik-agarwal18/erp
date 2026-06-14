export interface CreateBankAccountInput {
  name: string;
  accountNumber?: string;
  bankName?: string;
  branchName?: string;
  ifscCode?: string;
  currency?: string;
  currentBalance?: string;
}

export interface UpdateBankAccountInput {
  name?: string;
  accountNumber?: string;
  bankName?: string;
  branchName?: string;
  ifscCode?: string;
  currency?: string;
  isActive?: boolean;
}

export interface CreateBankTransactionInput {
  bankAccountId: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "BANK_FEE" | "INTEREST";
  amount: number;
  reference?: string;
  description?: string;
  transactionDate: Date;
  status?: "PENDING" | "CLEARED" | "RECONCILED";
}

export interface BankTransactionFilters {
  bankAccountId?: string;
  type?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}
