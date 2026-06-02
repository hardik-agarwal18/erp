import { z } from "zod";

export const paymentFormSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentDate: z.string().min(1, "Payment date is required"),
  reference: z.string().optional(),
});

export type PaymentFormSchema = z.infer<typeof paymentFormSchema>;
