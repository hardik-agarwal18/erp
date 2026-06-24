"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { getAdvances, getAdvanceSettlements } from "@/services/advances.service";
import { getTreasuryDashboard } from "@/services/treasury.service";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Download, PieChart, TrendingUp, BarChart3, AlertCircle, FileSpreadsheet } from "lucide-react";

export default function TreasuryReportsPage() {
  const [activeReport, setActiveReport] = useState<string | null>(null);

  const { data: dashboard } = useQuery({
    queryKey: ["treasury", "dashboard"],
    queryFn: getTreasuryDashboard,
  });

  const { data: outstandingAdvances } = useQuery({
    queryKey: ["advances", "outstanding"],
    queryFn: () => getAdvances({ status: "ISSUED" }),
  });

  const { data: settlements } = useQuery({
    queryKey: ["advances", "settlements"],
    queryFn: () => getAdvanceSettlements(),
  });

  const formatCurrency = (amount: string | number | undefined) => {
    if (amount === undefined) return "-";
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(amount));
  };

  const handleExportCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(",")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderReportCards = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveReport("cash-position")}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Cash Position</CardTitle>
          <PieChart className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(dashboard?.availableLiquidity || 0)}</div>
          <p className="text-xs text-muted-foreground mt-1">Total accessible liquidity</p>
        </CardContent>
      </Card>
      
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveReport("outstanding-advances")}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Outstanding Advances</CardTitle>
          <BarChart3 className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{outstandingAdvances?.length || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">Active issued advances</p>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveReport("settlement-history")}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Settlement History</CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{settlements?.length || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">Total processed settlements</p>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-md transition-shadow bg-slate-50 border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Advance Aging</CardTitle>
          <AlertCircle className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium text-slate-600">Coming Soon</div>
          <p className="text-xs text-muted-foreground mt-1">Aging buckets analysis</p>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-md transition-shadow bg-slate-50 border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-500">Cash Variances</CardTitle>
          <FileSpreadsheet className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium text-slate-600">Coming Soon</div>
          <p className="text-xs text-muted-foreground mt-1">Shortage/Overage tracking</p>
        </CardContent>
      </Card>
    </div>
  );

  const renderActiveReport = () => {
    switch (activeReport) {
      case "outstanding-advances":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setActiveReport(null)} className="-ml-4">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Analytics
              </Button>
              <Button variant="outline" onClick={() => handleExportCSV(
                outstandingAdvances?.map(a => ({ Number: a.advanceNumber, Type: a.type, Amount: a.amount, Outstanding: a.outstandingAmount })) || [],
                "Outstanding_Advances"
              )}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Outstanding Advances</CardTitle>
                <CardDescription>Detailed list of all currently issued advances awaiting settlement.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Advance No.</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outstandingAdvances?.map((adv) => (
                      <TableRow key={adv.id}>
                        <TableCell className="font-medium">{adv.advanceNumber}</TableCell>
                        <TableCell>{format(new Date(adv.createdAt), "MMM d, yyyy")}</TableCell>
                        <TableCell>{adv.type.replace('_', ' ')}</TableCell>
                        <TableCell className="text-right">{formatCurrency(adv.amount)}</TableCell>
                        <TableCell className="text-right font-medium text-slate-900">{formatCurrency(adv.outstandingAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );

      case "settlement-history":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setActiveReport(null)} className="-ml-4">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Analytics
              </Button>
              <Button variant="outline" onClick={() => handleExportCSV(
                settlements?.map(s => ({ Number: s.settlementNumber, Advance: s.advance.advanceNumber, Type: s.type, Amount: s.amount })) || [],
                "Settlement_History"
              )}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Settlement History</CardTitle>
                <CardDescription>Log of all advance settlements processed across the organization.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Settlement No.</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Advance Ref.</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount Applied</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlements?.map((set) => (
                      <TableRow key={set.id}>
                        <TableCell className="font-medium">{set.settlementNumber}</TableCell>
                        <TableCell>{format(new Date(set.settlementDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>{set.advance?.advanceNumber}</TableCell>
                        <TableCell>{set.type.replace('_', ' ')}</TableCell>
                        <TableCell className="text-right font-medium text-slate-900">{formatCurrency(set.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );

      case "cash-position":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setActiveReport(null)} className="-ml-4">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Analytics
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Cash Position Detail</CardTitle>
                <CardDescription>Breakdown of available liquidity across different account types.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Type</TableHead>
                      <TableHead className="text-right">Total Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Bank Accounts</TableCell>
                      <TableCell className="text-right">{formatCurrency(dashboard?.totalBank)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Cash & Petty Cash</TableCell>
                      <TableCell className="text-right">{formatCurrency(dashboard?.totalCash)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Wallets</TableCell>
                      <TableCell className="text-right">{formatCurrency(dashboard?.totalWallet)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-slate-50">
                      <TableCell className="font-bold">Total Available Liquidity</TableCell>
                      <TableCell className="text-right font-bold text-emerald-700">{formatCurrency(dashboard?.availableLiquidity)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AppShell activePath="/treasury/reports">
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Treasury Analytics</h2>
            <p className="text-muted-foreground mt-1">Actionable insights and downloadable reports for treasury operations.</p>
          </div>
        </div>

        {activeReport ? renderActiveReport() : renderReportCards()}
      </div>
    </AppShell>
  );
}
