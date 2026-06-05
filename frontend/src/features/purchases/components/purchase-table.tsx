"use client";

import Link from "next/link";

import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { PurchaseOrderDetail } from "../types";
import { formatCurrency } from "@/utils/formatters";
import { PurchaseStatusBadge } from "./purchase-status-badge";

export function PurchaseTable({ orders }: { orders: PurchaseOrderDetail[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Vendor</TableHeaderCell>
            <TableHeaderCell>PO #</TableHeaderCell>
            <TableHeaderCell>Order Date</TableHeaderCell>
            <TableHeaderCell>Expected</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="text-right">Amount</TableHeaderCell>
            <TableHeaderCell>Buyer</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium text-slate-950">{order.vendor}</TableCell>
              <TableCell>{order.number}</TableCell>
              <TableCell>{order.orderDate ?? "-"}</TableCell>
              <TableCell>{order.expectedDate}</TableCell>
              <TableCell>
                <PurchaseStatusBadge status={order.status} />
              </TableCell>
              <TableCell className="text-right">{formatCurrency(order.amount)}</TableCell>
              <TableCell>{order.buyer}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3 text-sm">
                  <Link className="font-medium text-slate-900 hover:text-blue-700" href={`/purchases/${order.id}`}>
                    View
                  </Link>
                  <Link className="text-slate-600 hover:text-slate-900" href="/purchases/goods-received-notes">
                    GRNs
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
