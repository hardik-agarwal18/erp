import type { NavigationItem } from "@/types/app";

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", feature: "dashboard" },
  { label: "Customers", href: "/customers", feature: "customers" },
  { label: "Vendors", href: "/vendors", feature: "vendors" },
  { label: "Invoices", href: "/invoices", feature: "invoices" },
  { label: "Inventory", href: "/inventory", feature: "inventory" },
  { label: "Purchases", href: "/purchases", feature: "purchases" },
];
