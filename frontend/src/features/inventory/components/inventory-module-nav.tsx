"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

const links = [
  { href: "/inventory", label: "Dashboard" },
  { href: "/inventory/adjustments", label: "Stock Adjustments" },
  { href: "/inventory/transfers", label: "Stock Transfers" },
  { href: "/inventory/audit", label: "Inventory Audit" },
  { href: "/inventory/warehouses", label: "Warehouse Management" },
];

export function InventoryModuleNav({ activePath }: { activePath: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        const active = activePath === link.href;

        return (
          <Link
            key={link.href}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition",
              active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            )}
            href={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
