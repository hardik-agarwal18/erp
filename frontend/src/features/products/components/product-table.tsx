"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { Product } from "@/types/app";
import { formatCurrency, formatNumber } from "@/utils/formatters";

export function ProductTable({ products }: { products: Product[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Code</TableHeaderCell>
            <TableHeaderCell>Product</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Supplier</TableHeaderCell>
            <TableHeaderCell className="text-right">Available</TableHeaderCell>
            <TableHeaderCell className="text-right">Cost</TableHeaderCell>
            <TableHeaderCell className="text-right">Sell</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium text-slate-950">{product.code}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-slate-950">{product.name}</p>
                  <p className="text-xs text-slate-500">
                    {product.sku} · {product.category}
                  </p>
                </div>
              </TableCell>
              <TableCell>{product.type.replace("_", " ")}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    product.status === "active" ? "success" : product.status === "draft" ? "warning" : "neutral"
                  }
                >
                  {product.status}
                </Badge>
              </TableCell>
              <TableCell>{product.supplier.vendorName}</TableCell>
              <TableCell className="text-right">{formatNumber(product.inventory.available)}</TableCell>
              <TableCell className="text-right">{formatCurrency(product.pricing.costPrice, product.pricing.currency)}</TableCell>
              <TableCell className="text-right">{formatCurrency(product.pricing.salePrice, product.pricing.currency)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3 text-sm">
                  <Link className="font-medium text-slate-900 hover:text-blue-700" href={`/products/${product.id}`}>
                    View
                  </Link>
                  <Link className="text-slate-600 hover:text-slate-900" href={`/products/${product.id}/edit`}>
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
