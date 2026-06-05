"use client";

import { Filter, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CustomerFiltersState } from "../types";

export function CustomerFilters({
  filters,
  onChange,
}: {
  filters: CustomerFiltersState;
  onChange: (filters: CustomerFiltersState) => void;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
        <Search className="h-4 w-4 text-slate-400" />
        <Input
          className="border-0 bg-transparent px-0"
          placeholder="Search customer code, name, owner..."
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value as CustomerFiltersState["status"] })}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="at_risk">At risk</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Select value={filters.segment} onChange={(event) => onChange({ ...filters, segment: event.target.value as CustomerFiltersState["segment"] })}>
          <option value="all">All segments</option>
          <option value="enterprise">Enterprise</option>
          <option value="mid_market">Mid-market</option>
          <option value="smb">SMB</option>
        </Select>
        <Button size="sm" variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Advanced
        </Button>
      </div>
    </div>
  );
}
