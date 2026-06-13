"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Filter, Printer, AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { accountingService } from "@/services/accounting.service";

type DateFilterType = "THIS_MONTH" | "LAST_MONTH" | "CURRENT_FY" | "CUSTOM";

export default function TrialBalancePage() {
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>("THIS_MONTH");
  
  // Calculate default dates
  const getInitialDates = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      start: firstDay.toISOString().split("T")[0],
      end: lastDay.toISOString().split("T")[0],
    };
  };

  const [startDate, setStartDate] = useState(getInitialDates().start);
  const [endDate, setEndDate] = useState(getInitialDates().end);

  const handleDateFilterChange = (type: DateFilterType) => {
    setDateFilterType(type);
    const today = new Date();
    
    if (type === "THIS_MONTH") {
      setStartDate(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]);
      setEndDate(new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0]);
    } else if (type === "LAST_MONTH") {
      setStartDate(new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split("T")[0]);
      setEndDate(new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split("T")[0]);
    } else if (type === "CURRENT_FY") {
      // Assuming April to March for FY, adjust as needed or fetch from API
      const currentMonth = today.getMonth();
      const startYear = currentMonth >= 3 ? today.getFullYear() : today.getFullYear() - 1;
      setStartDate(new Date(startYear, 3, 1).toISOString().split("T")[0]);
      setEndDate(new Date(startYear + 1, 2, 31).toISOString().split("T")[0]);
    }
  };

  const { data: tbResponse, isLoading } = useQuery({
    queryKey: ["trial-balance", startDate, endDate],
    queryFn: () => accountingService.getTrialBalance({ startDate, endDate }),
  });

  const report = tbResponse?.data;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  };

  const handleExportCSV = () => {
    if (!report) return;
    
    const headers = ["Account Code", "Account Name", "Type", "Debit", "Credit"];
    const rows = report.accounts.map(acc => [
      acc.accountCode,
      `"${acc.accountName}"`,
      acc.accountType,
      acc.totalDebit,
      acc.totalCredit
    ]);
    
    // Add totals row
    rows.push(["", '"Total"', "", report.totals.debit, report.totals.credit]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trial_balance_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const difference = report ? Math.abs(report.totals.debit - report.totals.credit) : 0;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 print:p-0 print:m-0 print:space-y-4">
      <div className="print:hidden">
        <PageHeader
          title="Trial Balance"
          description="Verify that your total debits equal total credits across all accounts."
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          }
        />
      </div>

      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">Trial Balance Report</h1>
        <p className="text-slate-500">Period: {startDate} to {endDate}</p>
      </div>

      <Card className="mb-6 print:hidden">
        <CardContent className="p-4 flex flex-col md:flex-row items-end gap-4">
          <div className="space-y-2 w-full md:w-48">
            <Label htmlFor="dateFilter">Period Filter</Label>
            <Select 
              id="dateFilter"
              value={dateFilterType}
              onChange={(e) => handleDateFilterChange(e.target.value as DateFilterType)}
            >
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_MONTH">Last Month</option>
              <option value="CURRENT_FY">Current Fiscal Year</option>
              <option value="CUSTOM">Custom Range</option>
            </Select>
          </div>
          
          <div className="space-y-2 flex-1">
            <Label htmlFor="startDate">Start Date</Label>
            <Input 
              id="startDate" 
              type="date"
              value={startDate} 
              onChange={(e) => {
                setStartDate(e.target.value);
                setDateFilterType("CUSTOM");
              }} 
            />
          </div>
          <div className="space-y-2 flex-1">
            <Label htmlFor="endDate">End Date</Label>
            <Input 
              id="endDate" 
              type="date"
              value={endDate} 
              onChange={(e) => {
                setEndDate(e.target.value);
                setDateFilterType("CUSTOM");
              }} 
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ) : report ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-500 mb-1">Total Debits</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(report.totals.debit)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-500 mb-1">Total Credits</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(report.totals.credit)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-500 mb-1">Difference</p>
                <p className={`text-2xl font-bold ${difference > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
                  {formatCurrency(difference)}
                </p>
              </CardContent>
            </Card>
            <Card className={report.totals.isBalanced ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200" : "bg-rose-50 dark:bg-rose-900/20 border-rose-200"}>
              <CardContent className="p-6 flex items-center justify-between h-full">
                <div>
                  <p className={`text-sm font-medium mb-1 ${report.totals.isBalanced ? "text-emerald-700" : "text-rose-700"}`}>Status</p>
                  <p className={`text-xl font-bold ${report.totals.isBalanced ? "text-emerald-700" : "text-rose-700"}`}>
                    {report.totals.isBalanced ? "Balanced" : "Out of Balance"}
                  </p>
                </div>
                {report.totals.isBalanced ? (
                  <CheckCircle2 className="h-10 w-10 text-emerald-500/50" />
                ) : (
                  <AlertCircle className="h-10 w-10 text-rose-500/50" />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Details Table */}
          <Card className="print:shadow-none print:border-none">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-medium border-b">
                    <tr>
                      <th className="px-6 py-4">Account Code</th>
                      <th className="px-6 py-4">Account Name</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4 text-right">Debit</th>
                      <th className="px-6 py-4 text-right">Credit</th>
                      <th className="px-6 py-4 text-center print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {report.accounts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                          No accounting data found for this period.
                        </td>
                      </tr>
                    ) : (
                      report.accounts.map((acc) => (
                        <tr key={acc.accountId} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group">
                          <td className="px-6 py-3 font-mono text-slate-600 dark:text-slate-400">
                            {acc.accountCode}
                          </td>
                          <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-100">
                            {acc.accountName}
                          </td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                              {acc.accountType}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            {acc.totalDebit > 0 ? formatCurrency(acc.totalDebit) : "-"}
                          </td>
                          <td className="px-6 py-3 text-right">
                            {acc.totalCredit > 0 ? formatCurrency(acc.totalCredit) : "-"}
                          </td>
                          <td className="px-6 py-3 text-center print:hidden">
                            <Link href={`/accounting/journals?accountId=${acc.accountId}`}>
                              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                View Ledgers <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-900/50 border-t-2 border-slate-200 dark:border-slate-800 font-bold">
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-slate-900 dark:text-slate-100">Total</td>
                      <td className="px-6 py-4 text-right text-slate-900 dark:text-slate-100">{formatCurrency(report.totals.debit)}</td>
                      <td className="px-6 py-4 text-right text-slate-900 dark:text-slate-100">{formatCurrency(report.totals.credit)}</td>
                      <td className="print:hidden"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            Failed to load trial balance.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
