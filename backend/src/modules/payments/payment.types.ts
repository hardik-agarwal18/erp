export type CreatePaymentInput = {
  invoiceId: string;
  amount: number;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "UPI" | "CARD" | "CHEQUE" | "OTHER";
  paymentDate: string;
  reference?: string;
};
