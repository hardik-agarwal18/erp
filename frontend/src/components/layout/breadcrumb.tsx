"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

const segmentLabels: Record<string, string> = {
  dashboard: "Dashboard",
  customers: "Customers",
  vendors: "Vendors",
  invoices: "Invoices",
  inventory: "Inventory",
  purchases: "Purchases",
  create: "Create",
  edit: "Edit",
};

export function Breadcrumb({ activePath }: { activePath: string }) {
  const segments = activePath.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
      <Link className="font-medium text-slate-600 hover:text-slate-950" href="/dashboard">
        Workspace
      </Link>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        return (
          <div key={href} className="flex items-center gap-2">
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              className={index === segments.length - 1 ? "font-semibold text-slate-950" : "hover:text-slate-900"}
              href={href}
            >
              {segmentLabels[segment] ?? segment}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
