"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Printer } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { accountingService } from "@/services/accounting.service";

export default function AccountsReceivableAgingPage() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: tbResponse, isLoading } = useQuery({
    queryKey: ["aging-ar", asOfDate],
    queryFn: () => accountingService.getARAging({ asOfDate }),
  });

  const report = tbResponse?.data;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
  };

  const handleExportCSV = () => {
    if (!report) return;
    
    const headers = ["Current", "1-30 Days", "31-60 Days", "61-90 Days", "90+ Days", "Total Balance"];
    const rows = [[
      report.current,
      report.days1To30,
      report.days31To60,
      report.days61To90,
      report.days90Plus,
      report.total
    ]];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ar_aging_${asOfDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 print:p-0 print:m-0 print:space-y-4">
      <div className="print:hidden">
        <PageHeader
          title="Accounts Receivable Aging"
          description="View outstanding customer balances categorized by days past due."
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
        <h1 className="text-2xl font-bold">Accounts Receivable Aging</h1>
        <p className="text-slate-500">As of: {asOfDate}</p>
      </div>

      <Card className="mb-6 print:hidden">
        <CardContent className="p-4 flex flex-col md:flex-row items-end gap-4">
          <div className="space-y-2 flex-1">
            <Label htmlFor="asOfDate">As Of Date</Label>
            <Input 
              id="asOfDate" 
              type="date"
              value={asOfDate} 
              onChange={(e) => setAsOfDate(e.target.value)} 
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Card className="bg-slate-50 dark:bg-slate-900/50">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-500 mb-1">Total Outstanding</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(report.total)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-500 mb-1">Current (Not Due)</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(report.current)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-amber-600 mb-1">1 - 30 Days</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(report.days1To30)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-amber-600 mb-1">31 - 60 Days</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(report.days31To60)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-rose-600 mb-1">61 - 90 Days</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(report.days61To90)}
                </p>
              </CardContent>
            </Card>
            <Card className="border-rose-200 dark:border-rose-900">
              <CardContent className="p-6 bg-rose-50 dark:bg-rose-900/20">
                <p className="text-sm font-medium text-rose-700 dark:text-rose-400 mb-1">90+ Days</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(report.days90Plus)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center text-slate-500">
            Failed to load Accounts Receivable aging report.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
