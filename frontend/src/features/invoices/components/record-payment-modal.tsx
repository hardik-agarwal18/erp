"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { paymentFormSchema, type PaymentFormSchema } from "../../payments/schema";
import { createPayment } from "../../payments/service";
import { BankAccountSelector } from "../../treasury/components/bank-account-selector";
import { useQueryClient } from "@tanstack/react-query";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  balance: number;
}

export function RecordPaymentModal({ isOpen, onClose, invoiceId, balance }: RecordPaymentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<PaymentFormSchema>({
    resolver: zodResolver(paymentFormSchema) as any,
    defaultValues: {
      invoiceId,
      amount: balance,
      paymentMethod: "BANK_TRANSFER",
      paymentDate: new Date().toISOString().slice(0, 10),
      reference: "",
      bankAccountId: "",
    },
  });

  const onSubmit = async (values: PaymentFormSchema) => {
    try {
      setIsSubmitting(true);
      await createPayment(values);
      toast.success("Payment recorded successfully");
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment received from the customer for this invoice.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Amount</Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                {...form.register("amount")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-date">Date</Label>
              <Input
                id="payment-date"
                type="date"
                {...form.register("paymentDate")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select id="payment-method" {...form.register("paymentMethod")}>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="CHEQUE">Cheque</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank-account">Deposit To (Bank Account)</Label>
            <Controller
              control={form.control}
              name="bankAccountId"
              render={({ field }) => (
                <BankAccountSelector
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-reference">Reference (Optional)</Label>
            <Input
              id="payment-reference"
              placeholder="e.g. Transaction ID"
              {...form.register("reference")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
