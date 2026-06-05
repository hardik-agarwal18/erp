"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCompactCurrency } from "@/utils/formatters";
import { usePayments } from "../hooks/use-payments";
import { PaymentTable } from "./payment-table";
import type { Payment } from "../types";

const EMPTY_PAYMENTS: Payment[] = [];

export function PaymentsView() {
  const query = usePayments();
  const [search, setSearch] = useState("");

  const data = query.data;
  const payments = data?.payments ?? EMPTY_PAYMENTS;

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (search.length === 0) return true;
      const lowerSearch = search.toLowerCase();
      return (
        payment.invoiceNumber?.toLowerCase().includes(lowerSearch) ||
        payment.customerName?.toLowerCase().includes(lowerSearch) ||
        String(payment.amount).includes(lowerSearch)
      );
    });
  }, [payments, search]);

  if (query.isError) {
    return <ModuleError title="Payments unavailable" message="We could not load payments for this workspace." retry={() => query.refetch()} />;
  }

  if (data && payments.length === 0) {
    return <EmptyState title="No payments found" description="Payments made towards invoices will appear here." />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payment Management"
        description="Track all incoming payments linked to invoices."
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total Payments</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {data?.summary.totalPayments ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total Amount Collected</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {formatCompactCurrency(data?.summary.totalAmount ?? 0)}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              className="pl-9"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices or customers..."
              value={search}
            />
          </div>
          {filteredPayments.length ? (
            <PaymentTable payments={filteredPayments} />
          ) : (
            <EmptyState title="No matching payments" description="Adjust your search to widen the list." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
