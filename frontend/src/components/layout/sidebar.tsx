"use client";

import type { ComponentType } from "react";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Activity, ArrowLeftRight, BarChart3, Boxes, ChevronDown, ChevronLeft, ChevronRight, FileSpreadsheet, LayoutDashboard, Settings2, ShoppingCart, Truck, UsersRound, WalletCards, Star, X } from "lucide-react";

import { appConfig } from "@/config/app-config";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/hooks/use-workspace";
import { useUiStore } from "@/store/ui-store";
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
      { label: "Taxes", href: "/taxes", icon: Settings2, feature: "taxes" },
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
  
  const [favoriteHrefs, setFavoriteHrefs] = useState<string[]>([]);
  const [recentHrefs, setRecentHrefs] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  const { workspace, canAccess } = useWorkspace();
  const { sidebarOpen, setSidebarOpen } = useUiStore();
  const activeLookup = useMemo(() => activePath, [activePath]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [activePath, setSidebarOpen]);

  // Build a flat map of all routable items for Quick Access
  const allRoutes = useMemo(() => {
    const map = new Map<string, SidebarItem>();
    navigationSections.forEach(section => {
      section.items.forEach(item => {
        if (item.href) map.set(item.href, item);
        if (item.children) {
          item.children.forEach(child => {
            map.set(child.href, { label: child.label, href: child.href, icon: item.icon, feature: item.feature });
          });
        }
      });
    });
    return map;
  }, []);

  // Hydrate local storage
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedCollapsed = localStorage.getItem("erp:sidebar:collapsed");
      if (savedCollapsed) setCollapsed(JSON.parse(savedCollapsed));
      
      const savedGroups = localStorage.getItem("erp:sidebar:groups");
      if (savedGroups) setExpandedGroups(JSON.parse(savedGroups));

      const savedFavs = localStorage.getItem("erp:sidebar:favorites");
      if (savedFavs) setFavoriteHrefs(JSON.parse(savedFavs));

      const savedRecent = localStorage.getItem("erp:sidebar:recent");
      if (savedRecent) setRecentHrefs(JSON.parse(savedRecent));
    } catch (err) {
      console.error("Failed to parse sidebar local storage", err);
    }
  }, []);

  // Sync to local storage
  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem("erp:sidebar:collapsed", JSON.stringify(collapsed));
  }, [collapsed, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem("erp:sidebar:groups", JSON.stringify(expandedGroups));
  }, [expandedGroups, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem("erp:sidebar:favorites", JSON.stringify(favoriteHrefs));
  }, [favoriteHrefs, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem("erp:sidebar:recent", JSON.stringify(recentHrefs));
  }, [recentHrefs, isMounted]);

  // Track Recent Pages
  useEffect(() => {
    if (!activePath || !isMounted) return;
    // Only track if it's a known route from the sidebar hierarchy
    if (!allRoutes.has(activePath)) return;
    
    setRecentHrefs(prev => {
      const next = [activePath, ...prev.filter(h => h !== activePath)].slice(0, 5);
      return next;
    });
  }, [activePath, isMounted, allRoutes]);

  const toggleFavorite = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    e.stopPropagation();
    setFavoriteHrefs(prev => prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]);
  };

  const renderLink = (href: string, label: string, Icon: ComponentType<{ className?: string }>, isNested = false) => {
    const active = activeLookup.startsWith(href);
    const isFav = favoriteHrefs.includes(href);
    
    return (
      <Link
        key={href}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all duration-200",
          isNested ? "pl-11 pr-3" : "px-3",
          active 
            ? "bg-slate-800 text-white shadow-sm" 
            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100",
          collapsed && "justify-center px-2 pl-2"
        )}
        href={href}
        title={collapsed ? label : undefined}
      >
        {active && !collapsed && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1 rounded-r-md bg-blue-500" />
        )}
        {!isNested && <Icon className="h-4 w-4 shrink-0" />}
        {!collapsed && (
          <>
            <span className={cn("flex-1 truncate", isNested && "text-[13px]")}>{label}</span>
            <button
              onClick={(e) => toggleFavorite(e, href)}
              className={cn(
                "opacity-0 transition-opacity group-hover:opacity-100",
                isFav && "opacity-100 text-yellow-500 hover:text-yellow-400"
              )}
            >
              <Star className={cn("h-4 w-4", isFav && "fill-current")} />
            </button>
          </>
        )}
      </Link>
    );
  };

  const renderQuickAccess = () => {
    if (!isMounted) return null;
    
    const favItems = favoriteHrefs.map(h => allRoutes.get(h)).filter(Boolean) as SidebarItem[];
    const recItems = recentHrefs.map(h => allRoutes.get(h)).filter(Boolean) as SidebarItem[];

    if (favItems.length === 0 && recItems.length === 0) return null;

    return (
      <div className="mb-6 space-y-6">
        {favItems.length > 0 && (
          <div>
            {!collapsed && <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 mb-2">Favorites</p>}
            <nav className="space-y-1">
              {favItems.map(item => renderLink(item.href!, item.label, item.icon))}
            </nav>
          </div>
        )}
        {recItems.length > 0 && (
          <div>
            {!collapsed && <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 mb-2">Recent Pages</p>}
            <nav className="space-y-1">
              {recItems.map(item => renderLink(item.href!, item.label, item.icon))}
            </nav>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm xl:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-slate-200 bg-slate-950 text-slate-100 transition-all duration-300 xl:static xl:flex",
          collapsed ? "w-[72px]" : "w-[260px]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
        )}
      >
      <div className="flex h-[72px] items-center justify-between border-b border-slate-800 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
            <BarChart3 className="h-5 w-5" />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-slate-50">{workspace.name}</h1>
              <p className="truncate text-[10px] uppercase tracking-[0.22em] text-slate-500">{appConfig.name}</p>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden xl:flex rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            onClick={() => setCollapsed((value) => !value)}
            type="button"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <button
            aria-label="Close sidebar"
            className="xl:hidden rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            onClick={() => setSidebarOpen(false)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-6 custom-scrollbar">
        {renderQuickAccess()}

        {navigationSections.map((section) => (
          <div key={section.label} className="mb-6">
            {!collapsed ? (
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 mb-2">{section.label}</p>
            ) : null}
            <nav className="space-y-1">
              {section.items
                .filter((item) => !item.feature || canAccess(item.feature))
                .map((item) => {
                  const Icon = item.icon;
                  const active = item.href 
                    ? activeLookup.startsWith(item.href) 
                    : item.children?.some((child) => activeLookup.startsWith(child.href));

                  if (item.children) {
                    const expanded = expandedGroups[item.label] ?? false;

                    return (
                      <div key={item.label} className="mb-1">
                        <button
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            active && collapsed ? "bg-slate-800 text-white" : "",
                            !active && "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100",
                            collapsed && "justify-center px-2"
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
                          <Icon className={cn("h-4 w-4 shrink-0", active && !collapsed && "text-blue-400")} />
                          {!collapsed ? (
                            <>
                              <span className={cn("flex-1 text-left", active && "text-slate-50")}>{item.label}</span>
                              <ChevronDown className={cn("h-4 w-4 transition-transform text-slate-500", expanded && "rotate-180")} />
                            </>
                          ) : null}
                        </button>
                        {!collapsed && expanded ? (
                          <div className="mt-1 space-y-1">
                            {item.children.map((child) => renderLink(child.href, child.label, Icon, true))}
                          </div>
                        ) : null}
                      </div>
                    );
                  }

                  return renderLink(item.href ?? "/dashboard", item.label, Icon);
                })}
            </nav>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800 p-4">
        <div className={cn("rounded-2xl bg-slate-900 p-4 ring-1 ring-white/5", collapsed && "p-3 text-center")}>
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{collapsed ? "MT" : "Multi-tenant"}</p>
          {!collapsed ? (
            <>
              <p className="mt-1.5 text-sm font-semibold text-slate-200">System Ready</p>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">Workspace-aware shell with nested workflows.</p>
            </>
          ) : (
            <p className="mt-1 text-xs font-semibold text-slate-200">OK</p>
          )}
        </div>
      </div>
    </aside>
    </>
  );
}
