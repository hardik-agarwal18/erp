"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ModuleError } from "@/components/states/module-error";
import { PageLoader } from "@/components/states/page-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";
import { usePayment } from "../hooks/use-payment";

export function PaymentDetailsView({ paymentId }: { paymentId: string }) {
  const { data: payment, isError, isLoading, refetch } = usePayment(paymentId);

  if (isLoading) {
    return <PageLoader label="Loading payment details..." />;
  }

  if (isError || !payment) {
    return <ModuleError title="Payment not found" message="This payment record may have been deleted or does not exist." retry={() => refetch()} />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={`Payment ${payment.id.slice(0, 8)}`}
        description={`Payment received on ${payment.paymentDate}`}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Amount</p>
              <p className="text-lg font-semibold">{formatCurrency(payment.amount)}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Date</p>
              <p className="text-lg font-semibold">{payment.paymentDate}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Method</p>
              <Badge variant="neutral">{payment.paymentMethod}</Badge>
            </div>
            <div>
              <p className="text-sm text-slate-500">Reference</p>
              <p className="text-base">{payment.reference || "None"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Linked Invoice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Invoice Number</p>
              <Link className="text-blue-600 hover:underline" href={`/invoices/${payment.invoiceId}`}>
                {payment.invoiceNumber || payment.invoiceId}
              </Link>
            </div>
            <div>
              <p className="text-sm text-slate-500">Customer</p>
              {payment.customerId ? (
                <Link className="text-blue-600 hover:underline" href={`/customers/${payment.customerId}`}>
                  {payment.customerName || payment.customerId}
                </Link>
              ) : (
                <span>{payment.customerName || "Unknown"}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
