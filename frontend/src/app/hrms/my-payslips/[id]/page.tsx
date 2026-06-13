"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, Building2, Calendar } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { payrollService } from "@/services/payroll.service";

export default function PayslipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [payslip, setPayslip] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchPayslip(params.id as string);
    }
  }, [params.id]);

  const fetchPayslip = async (id: string) => {
    try {
      const data = await payrollService.getPayslipDetails(id);
      setPayslip(data);
    } catch (error) {
      toast.error("Failed to load payslip details");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!payslip) return;
    setIsDownloading(true);
    try {
      const blob = await payrollService.downloadPayslipPdf(payslip.id);
      const url = window.URL.createObjectURL(new Blob([blob as any]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Payslip_${payslip.month}_${payslip.year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Payslip downloaded successfully");
    } catch (error) {
      toast.error("Failed to download payslip");
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  const getMonthName = (m: number) => {
    const date = new Date();
    date.setMonth(m - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex gap-4 items-center">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardContent className="p-8 space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!payslip) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[80vh] p-4 text-center">
        <FileText className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-700">Payslip Not Found</h2>
        <p className="text-slate-500 mt-2 mb-6">The payslip you are looking for does not exist or you don&apos;t have access.</p>
        <Button onClick={() => router.push("/hrms/my-payslips")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to My Payslips
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/hrms/my-payslips")} className="rounded-full shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader
          title={`Payslip for ${getMonthName(payslip.month)} ${payslip.year}`}
          description="Detailed breakdown of your salary, deductions, and net pay."
          actions={
            <Button onClick={handleDownload} disabled={isDownloading}>
              <Download className="mr-2 h-4 w-4" />
              {isDownloading ? "Generating PDF..." : "Download PDF"}
            </Button>
          }
        />
      </div>

      <Card className="overflow-hidden border-t-4 border-t-blue-600 shadow-lg">
        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b pb-6 pt-8">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Antigravity ERP</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">123 Business Avenue, Tech District</p>
                </div>
              </div>
              
              <div className="pt-4 grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                <div className="text-slate-500">Employee Name:</div>
                <div className="font-medium text-slate-900 dark:text-slate-100">{payslip.employee?.firstName} {payslip.employee?.lastName}</div>
                
                <div className="text-slate-500">Employee ID:</div>
                <div className="font-medium text-slate-900 dark:text-slate-100">{payslip.employee?.id?.substring(0, 8).toUpperCase()}</div>
                
                <div className="text-slate-500">Department:</div>
                <div className="font-medium text-slate-900 dark:text-slate-100">{payslip.employee?.department?.name || "N/A"}</div>
              </div>
            </div>

            <div className="space-y-4 md:text-right">
              <div className="inline-flex flex-col items-end">
                <div className="text-sm text-slate-500 flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4" /> Pay Period
                </div>
                <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {getMonthName(payslip.month)} {payslip.year}
                </div>
              </div>
              
              <div className="pt-4 grid grid-cols-2 md:flex md:flex-col gap-2 text-sm text-left md:text-right">
                <div className="text-slate-500 md:hidden">Status:</div>
                <div className="font-medium">
                  {payslip.status === "PAID" ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Paid</Badge>
                  ) : (
                    <Badge variant="neutral" className="uppercase">{payslip.status}</Badge>
                  )}
                </div>
                
                <div className="text-slate-500 md:hidden">Paid On:</div>
                {payslip.status === "PAID" && (
                  <div className="text-slate-500 text-sm">
                    {new Date(payslip.updatedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
            {/* Earnings */}
            <div>
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                Earnings
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Basic Salary</span>
                  <span className="font-medium">{formatCurrency(payslip.basicPay)}</span>
                </div>
                {/* Dynamically render other earnings if they exist in the response */}
                {payslip.lines?.filter((l: any) => l.type === "EARNING").map((line: any) => (
                  <div key={line.id} className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 dark:text-slate-400">{line.name}</span>
                    <span className="font-medium">{formatCurrency(line.amount)}</span>
                  </div>
                ))}
                
                <div className="pt-4 mt-4 border-t border-dashed border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Total Gross Pay</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(payslip.grossPay)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                Deductions
              </div>
              <div className="p-6 space-y-4">
                {payslip.lines?.filter((l: any) => l.type === "DEDUCTION").length === 0 && payslip.deductions === 0 ? (
                  <div className="text-sm text-slate-500 text-center py-2">No deductions</div>
                ) : (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Tax</span>
                      <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(payslip.tax || 0)}</span>
                    </div>
                    {payslip.lines?.filter((l: any) => l.type === "DEDUCTION").map((line: any) => (
                      <div key={line.id} className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400">{line.name}</span>
                        <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(line.amount)}</span>
                      </div>
                    ))}
                    <div className="pt-4 mt-4 border-t border-dashed border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">Total Deductions</span>
                      <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(payslip.deductions)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Net Pay */}
          <div className="bg-emerald-50 dark:bg-emerald-950/20 p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-t-2 border-emerald-100 dark:border-emerald-900/50">
            <div>
              <div className="text-sm font-medium text-emerald-800 dark:text-emerald-500 uppercase tracking-wider mb-1">Net Pay</div>
              <div className="text-slate-600 dark:text-slate-400 text-sm max-w-sm">
                This is the final amount transferred to your designated bank account.
              </div>
            </div>
            <div className="text-4xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(payslip.netPay)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
