export type BankAccountType = "BANK" | "CASH" | "WALLET" | "CREDIT_CARD" | string;
export type TreasuryTransferStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "COMPLETED" | "REVERSED" | "FAILED" | string;

export interface CreateBankAccountInput {
  name: string;
  type: BankAccountType;
  accountNumber?: string;
  bankName?: string;
  branchName?: string;
  ifscCode?: string;
  currency?: string;
  openingBalance?: number;
  openingBalanceDate?: Date;
  requiresCustodian?: boolean;
  custodianId?: string;
}

export interface UpdateBankAccountInput {
  name?: string;
  type?: BankAccountType;
  accountNumber?: string;
  bankName?: string;
  branchName?: string;
  ifscCode?: string;
  currency?: string;
  isActive?: boolean;
  requiresCustodian?: boolean;
  custodianId?: string;
}

export interface CreateBankTransactionInput {
  bankAccountId: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "BANK_FEE" | "INTEREST";
  amount: number;
  reference?: string;
  description?: string;
  transactionDate: Date;
  status?: "PENDING" | "CLEARED" | "RECONCILED";
  offsetAccountId?: string;
}

export interface BankTransactionFilters {
  bankAccountId?: string;
  type?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface CreateTreasuryTransferInput {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  transferDate: Date;
  reference?: string;
  externalReference?: string;
  description?: string;
  notes?: string;
  status?: TreasuryTransferStatus;
  attachments?: { fileId: string; fileName: string }[];
}

export interface ReverseTreasuryTransferInput {
  reversalReason: string;
}

export interface TreasuryTransferFilters {
  status?: TreasuryTransferStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface TreasuryDashboardSummary {
  totalBank: number;
  totalCash: number;
  totalWallet: number;
  totalCreditCard: number;
  availableLiquidity: number;
  netTreasuryPosition: number;
  balancesByType: Record<BankAccountType, { accountId: string; name: string; balance: number }[]>;
  recentTransfers: any[]; // we can type this better later
}
