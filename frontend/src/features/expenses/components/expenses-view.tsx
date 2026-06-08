"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCompactCurrency } from "@/utils/formatters";
import { useExpenses } from "../hooks/use-expenses";
import { ExpenseTable } from "./expense-table";
import { ExpenseFilters, type ExpenseFiltersState } from "./expense-filters";
import type { Expense } from "../types";

const EMPTY_EXPENSES: Expense[] = [];

export function ExpensesView() {
  const query = useExpenses();
  const [filters, setFilters] = useState<ExpenseFiltersState>({
    search: "",
    category: "all",
  });

  const data = query.data;
  const expenses = data?.expenses ?? EMPTY_EXPENSES;

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch =
        filters.search.length === 0 ||
        expense.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        String(expense.amount).includes(filters.search);

      const matchesCategory = filters.category === "all" || expense.category === filters.category;

      return matchesSearch && matchesCategory;
    });
  }, [expenses, filters]);

  if (query.isError) {
    return <ModuleError title="Expenses unavailable" message="We could not load expenses for this workspace." retry={() => query.refetch()} />;
  }

  if (data && expenses.length === 0) {
    return <EmptyState title="No expenses found" description="Create your first expense to track outflows." actionLabel="Create expense" />;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Expense Management"
        description="Track operational costs and categorize business expenditures."
        actions={
          <>
            <Button asChild size="sm">
              <Link href="/expenses/create">
                <Plus className="mr-2 h-4 w-4" />
                New Expense
              </Link>
            </Button>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total Expenses</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {data?.summary.totalExpenses ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total Amount</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {formatCompactCurrency(data?.summary.totalAmount ?? 0)}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="space-y-4 p-4">
          <ExpenseFilters filters={filters} onChange={setFilters} />
          {filteredExpenses.length ? (
            <ExpenseTable expenses={filteredExpenses} />
          ) : (
            <EmptyState title="No matching expenses" description="Adjust your filters to widen the list." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
