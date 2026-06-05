"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Payment } from "../types";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";

export function PaymentTable({ payments }: { payments: Payment[] }) {
  return (
    <div className="rounded-md border border-slate-200">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell>Invoice #</TableHeaderCell>
            <TableHeaderCell>Customer</TableHeaderCell>
            <TableHeaderCell>Method</TableHeaderCell>
            <TableHeaderCell className="text-right">Amount</TableHeaderCell>
            <TableHeaderCell className="w-[80px]" />
          </TableRow>
        </TableHead>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">{payment.paymentDate}</TableCell>
              <TableCell>
                <Link className="hover:underline text-blue-600" href={`/invoices/${payment.invoiceId}`}>
                  {payment.invoiceNumber || payment.invoiceId.slice(0, 8)}
                </Link>
              </TableCell>
              <TableCell>{payment.customerName || "—"}</TableCell>
              <TableCell>
                <Badge variant="neutral">{payment.paymentMethod}</Badge>
              </TableCell>
              <TableCell className="text-right font-medium text-slate-950">
                {formatCurrency(payment.amount)}
              </TableCell>
              <TableCell>
                <Button asChild size="icon" variant="ghost">
                  <Link href={`/payments/${payment.id}`}>
                    <ArrowRight className="h-4 w-4" />
                    <span className="sr-only">View {payment.id}</span>
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
