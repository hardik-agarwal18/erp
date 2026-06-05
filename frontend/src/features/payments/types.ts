export type Payment = {
  id: string;
  invoiceId: string;
  invoiceNumber?: string;
  customerId?: string;
  customerName?: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  reference?: string;
  workspaceId: string;
};

export type PaymentsPayload = {
  payments: Payment[];
  summary: {
    totalPayments: number;
    totalAmount: number;
  };
};
