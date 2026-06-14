"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Filter } from "lucide-react";
import { format } from "date-fns";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accountingService } from "@/services/accounting.service";

export default function ProfitAndLossPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const { data: plResponse, isLoading } = useQuery({
    queryKey: ["profit-loss", startDate, endDate],
    queryFn: () => accountingService.getProfitAndLoss({ startDate, endDate }),
  });

  const report = plResponse?.data;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="Profit & Loss Statement"
        description="View your organization's revenues, costs, and expenses over a specific period."
        actions={
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        }
      />

      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col sm:flex-row items-end gap-4">
          <div className="space-y-2 flex-1">
            <Label htmlFor="startDate">Start Date</Label>
            <Input 
              id="startDate" 
              type="date"
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
          </div>
          <div className="space-y-2 flex-1">
            <Label htmlFor="endDate">End Date</Label>
            <Input 
              id="endDate" 
              type="date"
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
            />
          </div>
          <Button variant="secondary" className="w-full sm:w-auto">
            <Filter className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <div className="pt-8 space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      ) : report ? (
        <div className="grid gap-6">
          <Card>
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b pb-4">
              <CardTitle className="text-xl">Operating Revenue</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {report.revenues.length === 0 ? (
                    <tr><td className="p-4 text-slate-500">No revenue accounts with balances.</td></tr>
                  ) : (
                    report.revenues.map(acc => (
                      <tr key={acc.accountId} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                        <td className="p-4 pl-8">{acc.accountCode} - {acc.accountName}</td>
                        <td className="p-4 text-right font-medium">{formatCurrency(acc.netBalance)}</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-slate-50 dark:bg-slate-900/50 font-semibold text-base">
                    <td className="p-4 text-slate-700 dark:text-slate-300">Total Revenue</td>
                    <td className="p-4 text-right text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(report.totals.revenue)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b pb-4">
              <CardTitle className="text-xl">Operating Expenses</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {report.expenses.length === 0 ? (
                    <tr><td className="p-4 text-slate-500">No expense accounts with balances.</td></tr>
                  ) : (
                    report.expenses.map(acc => (
                      <tr key={acc.accountId} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                        <td className="p-4 pl-8">{acc.accountCode} - {acc.accountName}</td>
                        <td className="p-4 text-right font-medium">{formatCurrency(acc.netBalance)}</td>
                      </tr>
                    ))
                  )}
                  <tr className="bg-slate-50 dark:bg-slate-900/50 font-semibold text-base">
                    <td className="p-4 text-slate-700 dark:text-slate-300">Total Expenses</td>
                    <td className="p-4 text-right text-rose-600 dark:text-rose-400">
                      {formatCurrency(report.totals.expense)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className={`border-2 ${report.netProfit >= 0 ? 'border-emerald-200 dark:border-emerald-900/50' : 'border-rose-200 dark:border-rose-900/50'}`}>
            <CardContent className="p-6 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">Net Profit</span>
              <span className={`text-3xl font-bold ${report.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatCurrency(report.netProfit)}
              </span>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            Failed to load report.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
