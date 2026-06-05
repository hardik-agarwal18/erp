import { apiClient } from "@/api/client";
import { apiEndpoints } from "@/api/endpoints";
import type { ApiResponse, PaginatedResponse } from "@/api/types";
import type { Payment, PaymentsPayload } from "./types";
import type { PaymentFormSchema } from "./schema";

type BackendPayment = {
  id: string;
  organizationId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  reference: string | null;
  createdAt: string;
  invoice?: {
    invoiceNumber: string;
    customerId: string;
    customer?: {
      name: string;
    };
  };
};

function mapBackendPayment(payment: BackendPayment): Payment {
  return {
    id: payment.id,
    invoiceId: payment.invoiceId,
    invoiceNumber: payment.invoice?.invoiceNumber,
    customerId: payment.invoice?.customerId,
    customerName: payment.invoice?.customer?.name,
    amount: Number(payment.amount),
    paymentMethod: payment.paymentMethod,
    paymentDate: payment.paymentDate.slice(0, 10),
    reference: payment.reference ?? undefined,
    workspaceId: payment.organizationId,
  };
}

export async function getPayments() {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<BackendPayment>>>(apiEndpoints.payments.list, {
    params: { page: 1, limit: 100 },
  });

  const payments = response.data.data.items.map(mapBackendPayment);

  const payload: PaymentsPayload = {
    payments,
    summary: {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    },
  };

  return payload;
}

export async function getPaymentById(paymentId: string) {
  // Since there is no explicit GET /payments/:id, we fetch the list and find it.
  const payload = await getPayments();
  const payment = payload.payments.find((p) => p.id === paymentId);
  if (!payment) {
    throw new Error("Payment not found");
  }
  return payment;
}

export async function createPayment(input: PaymentFormSchema) {
  const response = await apiClient.post<ApiResponse<BackendPayment>>(apiEndpoints.payments.list, input);
  return mapBackendPayment(response.data.data);
}
