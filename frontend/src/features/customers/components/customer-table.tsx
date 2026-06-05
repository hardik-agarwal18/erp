"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { Customer } from "@/types/app";
import { formatCurrency } from "@/utils/formatters";

export function CustomerTable({ customers }: { customers: Customer[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Code</TableHeaderCell>
            <TableHeaderCell>Customer</TableHeaderCell>
            <TableHeaderCell>Segment</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Owner</TableHeaderCell>
            <TableHeaderCell>Terms</TableHeaderCell>
            <TableHeaderCell className="text-right">Outstanding</TableHeaderCell>
            <TableHeaderCell className="text-right">Revenue</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium text-slate-950">{customer.code}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-slate-950">{customer.name}</p>
                  <p className="text-xs text-slate-500">{customer.email}</p>
                </div>
              </TableCell>
              <TableCell>{customer.segment.replace("_", " ")}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    customer.status === "active" ? "success" : customer.status === "at_risk" ? "warning" : "neutral"
                  }
                >
                  {customer.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell>{customer.owner}</TableCell>
              <TableCell>{customer.paymentTerms}</TableCell>
              <TableCell className="text-right">{formatCurrency(customer.outstandingBalance)}</TableCell>
              <TableCell className="text-right">{formatCurrency(customer.totalRevenue)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3 text-sm">
                  <Link className="font-medium text-slate-900 hover:text-blue-700" href={`/customers/${customer.id}`}>
                    View
                  </Link>
                  <Link className="text-slate-600 hover:text-slate-900" href={`/customers/${customer.id}/edit`}>
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
