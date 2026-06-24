"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { getTreasuryDashboard, getTreasuryAlerts, TreasuryDashboardSummary, TreasuryTransfer, TreasuryAlert } from "@/services/treasury.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, ArrowRightLeft, CreditCard, Wallet, Banknote, LineChart, AlertTriangle, AlertCircle, Info, Activity, CheckSquare } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function TreasuryDashboardPage() {
  const { data: dashboard, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ["treasury", "dashboard"],
    queryFn: getTreasuryDashboard,
  });

  const { data: alerts, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ["treasury", "alerts"],
    queryFn: getTreasuryAlerts,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <AlertTriangle className="h-5 w-5 text-rose-500" />;
      case "warning": return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "info": return <Info className="h-5 w-5 text-blue-500" />;
      default: return <Activity className="h-5 w-5 text-slate-500" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-rose-50 border-rose-100 text-rose-900";
      case "warning": return "bg-amber-50 border-amber-100 text-amber-900";
      case "info": return "bg-blue-50 border-blue-100 text-blue-900";
      default: return "bg-slate-50 border-slate-200 text-slate-900";
    }
  };

  const formatAlertType = (type: string) => {
    return type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
  };

  return (
    <AppShell activePath="/treasury">
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Treasury Overview</h2>
            <p className="text-muted-foreground mt-1">Net position, liquidity, and system alerts.</p>
          </div>
        </div>

        {isLoadingDashboard || isLoadingAlerts ? (
          <div className="py-12 text-center text-muted-foreground">Loading dashboard data...</div>
        ) : dashboard ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card className="bg-slate-950 border-slate-900 col-span-2 md:col-span-1 lg:col-span-1 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-300">Net Treasury Position</CardTitle>
                  <LineChart className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(dashboard.netTreasuryPosition)}</div>
                  <p className="text-xs text-slate-400 mt-1">Available Liquidity minus Exposure</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-50 border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">Available Liquidity</CardTitle>
                  <Activity className="h-4 w-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">{formatCurrency(dashboard.availableLiquidity)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total accessible cash</p>
                </CardContent>
              </Card>
              <Card className="bg-emerald-50/50 border-emerald-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-emerald-800">Bank Accounts</CardTitle>
                  <Landmark className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-950">{formatCurrency(dashboard.totalBank)}</div>
                </CardContent>
              </Card>
              <Card className="bg-blue-50/50 border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-800">Cash Accounts</CardTitle>
                  <Banknote className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-950">{formatCurrency(dashboard.totalCash)}</div>
                </CardContent>
              </Card>
              <Card className="bg-purple-50/50 border-purple-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-800">Wallets</CardTitle>
                  <Wallet className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-950">{formatCurrency(dashboard.totalWallet)}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-5">
                <CardHeader>
                  <CardTitle>Treasury Alerts</CardTitle>
                  <CardDescription>Actionable items requiring attention.</CardDescription>
                </CardHeader>
                <CardContent>
                  {alerts && alerts.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {alerts.map((alert, idx) => (
                        <Link key={idx} href={alert.link}>
                          <div className={cn("flex items-center justify-between p-4 rounded-xl border transition-colors hover:opacity-90", getAlertColor(alert.severity))}>
                            <div className="flex items-center gap-3">
                              {getAlertIcon(alert.severity)}
                              <div>
                                <p className="text-sm font-medium">{formatAlertType(alert.type)}</p>
                                <p className="text-xs opacity-80">{alert.count} item{alert.count > 1 ? 's' : ''} pending</p>
                              </div>
                            </div>
                            <div className="text-xl font-bold opacity-80">{alert.count}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center flex flex-col items-center border rounded-xl bg-slate-50/50 border-dashed">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                        <CheckSquare className="h-5 w-5 text-emerald-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-700">All clear</p>
                      <p className="text-xs text-slate-500 mt-1">No pending alerts requiring attention.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Credit Exposure</CardTitle>
                  <CardDescription>Outstanding liabilities against liquidity.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-500">Credit Card Dues</span>
                      <span className="text-sm font-bold text-rose-600">{formatCurrency(dashboard.totalCreditCard)}</span>
                    </div>
                  </div>
                  {/* Additional exposures like loans can be added here later */}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Recent Transfers</CardTitle>
                  <CardDescription>Latest fund movements between accounts.</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboard.recentTransfers && dashboard.recentTransfers.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>From</TableHead>
                          <TableHead>To</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboard.recentTransfers.map((tx: TreasuryTransfer) => (
                          <TableRow key={tx.id}>
                            <TableCell>{format(new Date(tx.transferDate), "MMM d, yyyy")}</TableCell>
                            <TableCell>{tx.fromAccount?.name}</TableCell>
                            <TableCell>{tx.toAccount?.name}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(Number(tx.amount))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="py-8 text-center flex flex-col items-center">
                      <ArrowRightLeft className="h-8 w-8 text-slate-200 mb-3" />
                      <p className="text-sm text-slate-500">No recent transfers.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Account Balances</CardTitle>
                  <CardDescription>Summary of balances by type.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(dashboard.balancesByType).filter(([type, accounts]) => type !== 'CREDIT_CARD' && accounts.length > 0).map(([type, accounts]) => (
                    <div key={type}>
                      <h4 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">{type.replace("_", " ")}</h4>
                      <div className="space-y-3">
                        {accounts.map(acc => (
                          <div key={acc.accountId} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {type === "LOAN" ? <CreditCard className="h-4 w-4 text-rose-500" /> : <Landmark className="h-4 w-4 text-emerald-500" />}
                              <span className="text-sm font-medium">{acc.name}</span>
                            </div>
                            <span className="text-sm font-medium text-slate-900">
                              {formatCurrency(acc.balance)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
