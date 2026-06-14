"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Filter, AlertCircle } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accountingService } from "@/services/accounting.service";

export default function BalanceSheetPage() {
  const [asOfDate, setAsOfDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const { data: bsResponse, isLoading } = useQuery({
    queryKey: ["balance-sheet", asOfDate],
    queryFn: () => accountingService.getBalanceSheet({ asOfDate }),
  });

  const report = bsResponse?.data;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="Balance Sheet"
        description="A snapshot of your organization's assets, liabilities, and equity at a specific point in time."
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
            <Label htmlFor="asOfDate">As Of Date</Label>
            <Input 
              id="asOfDate" 
              type="date"
              value={asOfDate} 
              onChange={(e) => setAsOfDate(e.target.value)} 
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
        <div className="space-y-6">
          {!report.isBalanced && (
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 p-4 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Balance Sheet is Out of Balance</p>
                <p className="text-sm">Total Assets do not equal Total Liabilities + Equity. Check for unposted journal entries or systemic issues.</p>
              </div>
            </div>
          )}

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Assets Column */}
            <div className="space-y-6">
              <Card className="h-full border-t-4 border-t-blue-500">
                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b pb-4">
                  <CardTitle className="text-xl">Assets</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {report.assets.length === 0 ? (
                        <tr><td className="p-4 text-slate-500">No asset accounts.</td></tr>
                      ) : (
                        report.assets.map(acc => (
                          <tr key={acc.accountId} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                            <td className="p-4 pl-6">{acc.accountCode} - {acc.accountName}</td>
                            <td className="p-4 text-right font-medium">{formatCurrency(acc.netBalance)}</td>
                          </tr>
                        ))
                      )}
                      <tr className="bg-blue-50 dark:bg-blue-900/20 font-semibold text-base border-t-2 border-blue-200 dark:border-blue-800">
                        <td className="p-4 text-slate-900 dark:text-slate-100">Total Assets</td>
                        <td className="p-4 text-right text-blue-700 dark:text-blue-400">
                          {formatCurrency(report.totals.assets)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>

            {/* Liabilities & Equity Column */}
            <div className="space-y-6">
              <Card className="border-t-4 border-t-rose-500">
                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b pb-4">
                  <CardTitle className="text-xl">Liabilities</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {report.liabilities.length === 0 ? (
                        <tr><td className="p-4 text-slate-500">No liability accounts.</td></tr>
                      ) : (
                        report.liabilities.map(acc => (
                          <tr key={acc.accountId} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                            <td className="p-4 pl-6">{acc.accountCode} - {acc.accountName}</td>
                            <td className="p-4 text-right font-medium">{formatCurrency(acc.netBalance)}</td>
                          </tr>
                        ))
                      )}
                      <tr className="bg-rose-50 dark:bg-rose-900/20 font-semibold text-base border-t-2 border-rose-200 dark:border-rose-800">
                        <td className="p-4 text-slate-900 dark:text-slate-100">Total Liabilities</td>
                        <td className="p-4 text-right text-rose-700 dark:text-rose-400">
                          {formatCurrency(report.totals.liabilities)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-purple-500">
                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b pb-4">
                  <CardTitle className="text-xl">Equity</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {report.equity.length === 0 ? (
                        <tr><td className="p-4 text-slate-500">No equity accounts.</td></tr>
                      ) : (
                        report.equity.map(acc => (
                          <tr key={acc.accountId} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                            <td className="p-4 pl-6">{acc.accountCode} - {acc.accountName}</td>
                            <td className="p-4 text-right font-medium">{formatCurrency(acc.netBalance)}</td>
                          </tr>
                        ))
                      )}
                      <tr className="bg-purple-50 dark:bg-purple-900/20 font-semibold text-base border-t-2 border-purple-200 dark:border-purple-800">
                        <td className="p-4 text-slate-900 dark:text-slate-100">Total Equity</td>
                        <td className="p-4 text-right text-purple-700 dark:text-purple-400">
                          {formatCurrency(report.totals.equity)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card className={`border-2 ${report.isBalanced ? 'border-slate-200 dark:border-slate-800' : 'border-rose-300 dark:border-rose-800'}`}>
                <CardContent className="p-4 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
                  <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">Total Liabilities & Equity</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {formatCurrency(report.totals.liabilities + report.totals.equity)}
                  </span>
                </CardContent>
              </Card>
            </div>
          </div>
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
