"use client";

import { Activity, AlertTriangle, ArrowDown, ArrowUp, Landmark, Wallet } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useDashboardQuery } from "../hooks/use-dashboard-query";
import { formatCompactCurrency, formatCurrency } from "@/utils/formatters";

const axisProps = {
  axisLine: false,
  tickLine: false,
  tick: { fill: "#64748b", fontSize: 12 },
};

export function DashboardView() {
  const query = useDashboardQuery();

  if (query.isError) {
    return <ModuleError title="Dashboard unavailable" message="We could not load accounting and inventory insights for this workspace." retry={() => query.refetch()} />;
  }

  if (!query.data) {
    return <EmptyState title="No dashboard data" description="This workspace has not generated financial summaries yet." />;
  }

  const data = query.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Precision Ledger Dashboard"
        description="Stitch-guided executive overview for accounting, receivables, cash, and stock exposure."
        actions={
          <>
            <Button size="sm" variant="outline">
              Export Pack
            </Button>
            <Button size="sm">Close Month</Button>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-6">
        {data.kpis.map((metric) => {
          const positive = metric.trend >= 0;
          return (
            <Card key={metric.label}>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{metric.label}</p>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="text-2xl font-semibold text-slate-950">{formatCompactCurrency(metric.value)}</p>
                  <Badge variant={positive ? "success" : "danger"}>
                    {positive ? <ArrowUp className="mr-1 h-3 w-3" /> : <ArrowDown className="mr-1 h-3 w-3" />}
                    {Math.abs(metric.trend)}%
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-slate-500">{metric.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.85fr)]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Revenue & Forecast</CardTitle>
              <CardDescription>Designed from the Stitch dashboard screen for a 1440px executive view.</CardDescription>
            </div>
            <Badge variant="info">12 months</Badge>
          </CardHeader>
          <CardContent className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenueTrend}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={(value) => `$${value}k`} />
                <Tooltip />
                <Legend />
                <Line dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={false} />
                <Line dataKey="forecast" stroke="#14b8a6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Liquidity Snapshot</CardTitle>
              <CardDescription>Bank balances and liabilities summary.</CardDescription>
            </div>
            <Wallet className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent className="space-y-4">
            {data.bankBalances.map((balance) => (
              <div key={balance.label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">{balance.label}</p>
                  <p className="text-xs text-slate-500">Bank account balance</p>
                </div>
                <p className="text-base font-semibold text-slate-950">{formatCurrency(balance.amount)}</p>
              </div>
            ))}
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="mb-3 flex items-center gap-2">
                <Landmark className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-semibold text-slate-950">Receivables vs Payables</p>
              </div>
              {data.receivablesVsPayables.map((item) => (
                <div key={item.label} className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-semibold text-slate-950">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(320px,0.92fr)]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Expense</CardTitle>
              <CardDescription>Operating expense and payroll movement.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.expenseTrend}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={(value) => `$${value}k`} />
                <Tooltip />
                <Legend />
                <Bar dataKey="expenses" fill="#0f172a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="payroll" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Cash Flow</CardTitle>
              <CardDescription>Inflow, outflow, and net generation.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.cashFlowTrend}>
                <defs>
                  <linearGradient id="cashFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={(value) => `$${value}k`} />
                <Tooltip />
                <Legend />
                <Area dataKey="inflow" stroke="#14b8a6" fill="url(#cashFill)" strokeWidth={2.5} />
                <Line dataKey="outflow" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line dataKey="net" stroke="#2563eb" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Activity Feed</CardTitle>
              <CardDescription>Recent cross-functional ERP events.</CardDescription>
            </div>
            <Activity className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent className="space-y-3">
            {data.activity.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                  <span className="text-xs text-slate-400">{item.time}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Low Stock Alerts</CardTitle>
              <CardDescription>Directly modeled from the Stitch inventory insights panel.</CardDescription>
            </div>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="space-y-3">
            {data.lowStockAlerts.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{item.item}</p>
                  <p className="text-xs text-slate-500">
                    {item.sku} · {item.warehouse}
                  </p>
                </div>
                <Badge variant={item.severity === "critical" ? "danger" : "warning"}>{item.remaining} left</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Outstanding Invoices</CardTitle>
              <CardDescription>Collections list for the next finance actions.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.outstandingInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{invoice.customer}</p>
                  <p className="text-xs text-slate-500">Due {invoice.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-950">{formatCurrency(invoice.amount)}</p>
                  <Badge variant={invoice.status === "overdue" ? "danger" : "warning"}>{invoice.status.replace("_", " ")}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
