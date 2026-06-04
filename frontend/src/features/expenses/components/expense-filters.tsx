"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export type ExpenseFiltersState = {
  search: string;
  category: string;
};

export function ExpenseFilters({
  filters,
  onChange,
}: {
  filters: ExpenseFiltersState;
  onChange: (filters: ExpenseFiltersState) => void;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="search-expenses" className="sr-only">
          Search expenses
        </Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            id="search-expenses"
            className="pl-9"
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search by description or amount..."
            value={filters.search}
          />
        </div>
      </div>
      <div className="w-full space-y-2 md:w-48">
        <Label htmlFor="filter-category" className="sr-only">
          Category
        </Label>
        <Select
          id="filter-category"
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          value={filters.category}
        >
          <option value="all">All categories</option>
          <option value="SALARY">Salary</option>
          <option value="RENT">Rent</option>
          <option value="UTILITIES">Utilities</option>
          <option value="MARKETING">Marketing</option>
          <option value="TRAVEL">Travel</option>
          <option value="SOFTWARE">Software</option>
          <option value="OTHER">Other</option>
        </Select>
      </div>
    </div>
  );
}
