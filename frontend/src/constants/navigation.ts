import type { NavigationItem } from "@/types/app";

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", feature: "dashboard" },
  { label: "Approvals", href: "/approvals", feature: "approvals" },
  { label: "HRMS", href: "/hrms", feature: "hrms" },
  { label: "Customers", href: "/customers", feature: "customers" },
  { label: "Vendors", href: "/vendors", feature: "vendors" },
  { label: "Invoices", href: "/invoices", feature: "invoices" },
  { label: "Transactions", href: "/transactions", feature: "transactions" },
  { label: "Inventory", href: "/inventory", feature: "inventory" },
  { label: "Purchases", href: "/purchases", feature: "purchases" },
  { label: "Chart of Accounts", href: "/accounting/accounts", feature: "transactions" },
  { label: "Journal Entries", href: "/accounting/journals", feature: "transactions" },
  { label: "Fiscal Years", href: "/accounting/fiscal-years", feature: "transactions" },
  { label: "Profit & Loss", href: "/accounting/profit-loss", feature: "transactions" },
  { label: "Balance Sheet", href: "/accounting/balance-sheet", feature: "transactions" },
];
