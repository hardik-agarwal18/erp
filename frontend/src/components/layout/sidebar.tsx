"use client";

import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeftRight, BarChart3, Boxes, ChevronDown, ChevronLeft, ChevronRight, FileSpreadsheet, LayoutDashboard, PackageCheck, Settings2, ShoppingCart, Truck, UsersRound, WalletCards } from "lucide-react";

import { appConfig } from "@/config/app-config";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/hooks/use-workspace";
import type { FeatureKey } from "@/types/app";

type SidebarItem = {
  label: string;
  href?: string;
  icon: ComponentType<{ className?: string }>;
  feature?: FeatureKey;
  children?: Array<{ label: string; href: string }>;
};

const navigationSections: Array<{ label: string; items: SidebarItem[] }> = [
  {
    label: "Operations",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Reports", href: "/reports", icon: FileSpreadsheet, feature: "reports" },
      {
        label: "Accounting",
        icon: WalletCards,
        feature: "customers",
        children: [
          { label: "Customers", href: "/customers" },
          { label: "Vendors", href: "/vendors" },
          { label: "Invoices", href: "/invoices" },
          { label: "Payments", href: "/payments" },
          { label: "Expenses", href: "/expenses" },
          { label: "Purchases", href: "/purchases" },
          { label: "Transactions", href: "/transactions" },
        ],
      },
      {
        label: "Inventory",
        icon: Boxes,
        feature: "inventory",
        children: [
          { label: "Dashboard", href: "/inventory" },
          { label: "Adjustments", href: "/inventory/adjustments" },
          { label: "Transfers", href: "/inventory/transfers" },
          { label: "Audit", href: "/inventory/audit" },
          { label: "Warehouses", href: "/inventory/warehouses" },
          { label: "Products", href: "/products" },
        ],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Customer Directory", href: "/customers", icon: UsersRound, feature: "customers" },
      { label: "Vendor Directory", href: "/vendors", icon: Truck, feature: "vendors" },
      { label: "Procurement", href: "/purchases", icon: ShoppingCart, feature: "purchases" },
      { label: "Transactions", href: "/transactions", icon: ArrowLeftRight, feature: "transactions" },
      { label: "Audit Logs", href: "/audit-logs", icon: Activity, feature: "audit_logs" },
      {
        label: "Settings",
        icon: Settings2,
        feature: "organizations",
        children: [
          { label: "Organization", href: "/settings/organization" },
          { label: "Members", href: "/settings/members" },
          { label: "Roles", href: "/settings/roles" },
        ],
      },
    ],
  },
];

export function Sidebar({ activePath }: { activePath: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Accounting: true,
    Inventory: true,
  });
  const { workspace, canAccess } = useWorkspace();

  const activeLookup = useMemo(() => activePath, [activePath]);

  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r border-slate-200 bg-slate-950 text-slate-100 transition-[width] duration-200 xl:flex xl:flex-col",
        collapsed ? "w-[88px]" : "w-[280px]",
      )}
    >
      <div className="flex h-[88px] items-center justify-between border-b border-slate-800 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
            <BarChart3 className="h-5 w-5" />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-xs uppercase tracking-[0.22em] text-slate-400">{appConfig.name}</p>
              <h1 className="truncate text-base font-semibold">{workspace.name}</h1>
            </div>
          ) : null}
        </div>
        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
          onClick={() => setCollapsed((value) => !value)}
          type="button"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {navigationSections.map((section) => (
          <div key={section.label} className="mb-5">
            {!collapsed ? (
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{section.label}</p>
            ) : null}
            <nav className="mt-2 space-y-1">
              {section.items
                .filter((item) => !item.feature || canAccess(item.feature))
                .map((item) => {
                const Icon = item.icon;
                const active =
                  item.href ? activeLookup.startsWith(item.href) : item.children?.some((child) => activeLookup.startsWith(child.href));

                if (item.children) {
                  const expanded = expandedGroups[item.label] ?? false;

                  return (
                    <div key={item.label}>
                      <button
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                          active ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/5 hover:text-white",
                          collapsed && "justify-center px-2",
                        )}
                        onClick={() =>
                          setExpandedGroups((current) => ({
                            ...current,
                            [item.label]: !expanded,
                          }))
                        }
                        title={collapsed ? item.label : undefined}
                        type="button"
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed ? (
                          <>
                            <span className="flex-1 text-left">{item.label}</span>
                            <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
                          </>
                        ) : null}
                      </button>
                      {!collapsed && expanded ? (
                        <div className="ml-4 mt-1 space-y-1 border-l border-slate-800 pl-4">
                          {item.children.map((child) => {
                            const childActive = activeLookup.startsWith(child.href);
                            return (
                              <Link
                                key={child.href + child.label}
                                className={cn(
                                  "flex rounded-lg px-3 py-2 text-sm transition",
                                  childActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white",
                                )}
                                href={child.href}
                              >
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                      active ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/5 hover:text-white",
                      collapsed && "justify-center px-2",
                    )}
                    href={item.href ?? "/dashboard"}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                  </Link>
                );
                })}
            </nav>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800 p-4">
        <div className={cn("rounded-2xl bg-white/5 p-4", collapsed && "p-3 text-center")}>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{collapsed ? "MT" : "Multi-tenant"}</p>
          {!collapsed ? (
            <>
              <p className="mt-2 text-2xl font-semibold">Ready</p>
              <p className="mt-1 text-sm text-slate-400">Workspace-aware shell with nested workflows and keyboard-first actions.</p>
            </>
          ) : (
            <p className="mt-2 text-sm font-semibold text-slate-200">Ready</p>
          )}
        </div>
      </div>
    </aside>
  );
}
