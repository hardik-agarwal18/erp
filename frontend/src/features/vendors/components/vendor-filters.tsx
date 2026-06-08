"use client";

import { Filter, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { VendorFiltersState } from "../types";

export function VendorFilters({
  filters,
  onChange,
}: {
  filters: VendorFiltersState;
  onChange: (filters: VendorFiltersState) => void;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
        <Search className="h-4 w-4 text-slate-400" />
        <Input
          className="border-0 bg-transparent px-0"
          placeholder="Search vendor code, name, category..."
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value as VendorFiltersState["status"] })}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="review">Review</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Select value={filters.category} onChange={(event) => onChange({ ...filters, category: event.target.value as VendorFiltersState["category"] })}>
          <option value="all">All categories</option>
          <option value="raw_materials">Raw materials</option>
          <option value="services">Services</option>
          <option value="logistics">Logistics</option>
          <option value="electronics">Electronics</option>
        </Select>
        <Button size="sm" variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Advanced
        </Button>
      </div>
    </div>
  );
}
