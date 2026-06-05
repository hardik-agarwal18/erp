"use client";

import Link from "next/link";
import { ArrowRight, MoreHorizontal } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Expense } from "../types";
import { formatCurrency } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";

export function ExpenseTable({ expenses }: { expenses: Expense[] }) {
  return (
    <div className="rounded-md border border-slate-200">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Date</TableHeaderCell>
            <TableHeaderCell>Category</TableHeaderCell>
            <TableHeaderCell>Description</TableHeaderCell>
            <TableHeaderCell className="text-right">Amount</TableHeaderCell>
            <TableHeaderCell className="w-[80px]" />
          </TableRow>
        </TableHead>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="font-medium">{expense.expenseDate}</TableCell>
              <TableCell>
                <Badge variant="neutral">{expense.category}</Badge>
              </TableCell>
              <TableCell className="text-slate-500">{expense.description || "—"}</TableCell>
              <TableCell className="text-right font-medium text-slate-950">
                {formatCurrency(expense.amount)}
              </TableCell>
              <TableCell>
                <Button asChild size="icon" variant="ghost">
                  <Link href={`/expenses/${expense.id}`}>
                    <ArrowRight className="h-4 w-4" />
                    <span className="sr-only">View {expense.id}</span>
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
