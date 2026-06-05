"use client";

import Link from "next/link";

import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { Invoice } from "@/types/app";
import { formatCurrency } from "@/utils/formatters";
import { InvoiceStatusBadge } from "./invoice-status-badge";

export function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Invoice</TableHeaderCell>
            <TableHeaderCell>Customer</TableHeaderCell>
            <TableHeaderCell>Issue Date</TableHeaderCell>
            <TableHeaderCell>Due Date</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="text-right">Amount</TableHeaderCell>
            <TableHeaderCell className="text-right">Balance</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium text-slate-950">{invoice.invoiceNumber}</TableCell>
              <TableCell>{invoice.customer}</TableCell>
              <TableCell>{invoice.issueDate ?? "-"}</TableCell>
              <TableCell>{invoice.dueDate}</TableCell>
              <TableCell>
                <InvoiceStatusBadge status={invoice.status} />
              </TableCell>
              <TableCell className="text-right">{formatCurrency(invoice.amount, invoice.currency ?? "USD")}</TableCell>
              <TableCell className="text-right">{formatCurrency(invoice.balance, invoice.currency ?? "USD")}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3 text-sm">
                  <Link className="font-medium text-slate-900 hover:text-blue-700" href={`/invoices/${invoice.id}`}>
                    View
                  </Link>
                  <Link className="text-slate-600 hover:text-slate-900" href={`/invoices/${invoice.id}/edit`}>
                    Edit
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
