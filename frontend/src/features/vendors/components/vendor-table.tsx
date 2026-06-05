"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { Vendor } from "@/types/app";
import { formatCurrency } from "@/utils/formatters";

export function VendorTable({ vendors }: { vendors: Vendor[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Code</TableHeaderCell>
            <TableHeaderCell>Vendor</TableHeaderCell>
            <TableHeaderCell>Category</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Manager</TableHeaderCell>
            <TableHeaderCell>Terms</TableHeaderCell>
            <TableHeaderCell className="text-right">Outstanding</TableHeaderCell>
            <TableHeaderCell className="text-right">Spend</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {vendors.map((vendor) => (
            <TableRow key={vendor.id}>
              <TableCell className="font-medium text-slate-950">{vendor.code}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-slate-950">{vendor.name}</p>
                  <p className="text-xs text-slate-500">{vendor.email}</p>
                </div>
              </TableCell>
              <TableCell>{vendor.category.replace("_", " ")}</TableCell>
              <TableCell>
                <Badge
                  variant={vendor.status === "active" ? "success" : vendor.status === "review" ? "warning" : "neutral"}
                >
                  {vendor.status}
                </Badge>
              </TableCell>
              <TableCell>{vendor.accountManager}</TableCell>
              <TableCell>{vendor.paymentTerms}</TableCell>
              <TableCell className="text-right">{formatCurrency(vendor.outstandingBalance)}</TableCell>
              <TableCell className="text-right">{formatCurrency(vendor.totalSpend)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3 text-sm">
                  <Link className="font-medium text-slate-900 hover:text-blue-700" href={`/vendors/${vendor.id}`}>
                    View
                  </Link>
                  <Link className="text-slate-600 hover:text-slate-900" href={`/vendors/${vendor.id}/edit`}>
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
