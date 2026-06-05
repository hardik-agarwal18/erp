"use client";

import Link from "next/link";

import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { Transaction } from "@/types/app";
import { formatCurrency } from "@/utils/formatters";
import { TransactionStatusBadge } from "./transaction-status-badge";

export function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Reference</TableHeaderCell>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell>Counterparty</TableHeaderCell>
            <TableHeaderCell>Account</TableHeaderCell>
            <TableHeaderCell>Kind</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="text-right">Amount</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-medium text-slate-950">{transaction.reference}</TableCell>
              <TableCell>{transaction.date}</TableCell>
              <TableCell>{transaction.counterparty}</TableCell>
              <TableCell>{transaction.account}</TableCell>
              <TableCell>{transaction.kind}</TableCell>
              <TableCell>
                <TransactionStatusBadge status={transaction.status} />
              </TableCell>
              <TableCell className="text-right">{formatCurrency(transaction.direction === "inflow" ? transaction.amount : -transaction.amount)}</TableCell>
              <TableCell>
                <Link className="font-medium text-slate-900 hover:text-blue-700" href={`/transactions/${transaction.id}`}>
                  View
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
