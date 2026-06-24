export type CreateCustomerReceiptInput = {
  customerId: string;
  receiptDate: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  receivedIntoAccountId: string; // The Bank/Cash GL account ID
  allocations?: Array<{
    invoiceId: string;
    allocatedAmount: number;
  }>;
};
