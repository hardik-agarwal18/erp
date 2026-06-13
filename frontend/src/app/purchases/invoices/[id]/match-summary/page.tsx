"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, FileText, PackageCheck, Receipt } from "lucide-react";
import { format } from "date-fns";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { purchasesService } from "@/services/purchases.service";

export default function MatchSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const { data: invoiceResponse, isLoading: isLoadingInvoice } = useQuery({
    queryKey: ["vendor-invoice", invoiceId],
    queryFn: () => purchasesService.getInvoiceDetails(invoiceId),
  });

  const { data: matchResponse, isLoading: isLoadingMatch } = useQuery({
    queryKey: ["match-summary", invoiceId],
    queryFn: () => purchasesService.getMatchSummary(invoiceId),
  });

  const invoice = invoiceResponse?.data;
  const match = matchResponse?.data;
  const isLoading = isLoadingInvoice || isLoadingMatch;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Card>
          <CardContent className="p-8 space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-3 gap-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice || !match) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[80vh]">
        <h2 className="text-2xl font-bold text-slate-700">Invoice Not Found</h2>
        <Button className="mt-4" onClick={() => router.push("/purchases/invoices")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Bills
        </Button>
      </div>
    );
  }

  const isMatched = match.matchStatus === "MATCHED";
  const hasDiscrepancy = match.matchStatus === "DISCREPANCY";

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/purchases/invoices")} className="rounded-full shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader
          title={`3-Way Match Summary: ${invoice.invoiceNumber}`}
          description="Review the match status between the Purchase Order, Goods Received Note, and Vendor Invoice."
          className="flex-1"
        />
      </div>

      {/* Match Status Banner */}
      <div className={`p-4 rounded-lg flex items-start gap-4 border-l-4 ${
        isMatched 
          ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500" 
          : hasDiscrepancy
            ? "bg-amber-50 dark:bg-amber-950/20 border-amber-500"
            : "bg-rose-50 dark:bg-rose-950/20 border-rose-500"
      }`}>
        <div className="mt-1">
          {isMatched ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
          ) : hasDiscrepancy ? (
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
          ) : (
            <XCircle className="h-6 w-6 text-rose-600 dark:text-rose-500" />
          )}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${
            isMatched ? "text-emerald-800 dark:text-emerald-400" 
              : hasDiscrepancy ? "text-amber-800 dark:text-amber-400"
              : "text-rose-800 dark:text-rose-400"
          }`}>
            {isMatched ? "Documents Matched Successfully" 
              : hasDiscrepancy ? "Discrepancy Detected" 
              : "Missing Required Documents"}
          </h3>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {match.discrepancies.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {match.discrepancies.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            ) : (
              <p>All totals align perfectly across PO, GRN, and Invoice.</p>
            )}
          </div>
        </div>
        {hasDiscrepancy && (
          <Button variant="outline" className="shrink-0 bg-background border-amber-200">
            Request Approval Exception
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Document 1: Purchase Order */}
        <Card className={`border-t-4 ${match.poFound ? 'border-t-blue-500' : 'border-t-slate-300 dark:border-t-slate-700'}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">1. Purchase Order</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {match.poFound ? (
              <>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">PO Number</span>
                  <span className="font-mono font-medium">{match.poNumber}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Ordered Total</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(match.poTotal)}</span>
                </div>
                <div className="pt-2 text-center">
                  <Button variant="ghost" className="text-blue-600 dark:text-blue-400 h-auto p-0 hover:bg-transparent hover:underline">View Document</Button>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p>No PO Linked</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document 2: GRN */}
        <Card className={`border-t-4 ${match.grnFound ? 'border-t-emerald-500' : 'border-t-slate-300 dark:border-t-slate-700'}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-md">
                <PackageCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle className="text-lg">2. Goods Received</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {match.grnFound ? (
              <>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">GRN Numbers</span>
                  <span className="font-mono font-medium max-w-[120px] truncate" title={match.grnNumbers.join(", ")}>
                    {match.grnNumbers.join(", ")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Received Total</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(match.grnTotalReceived)}</span>
                </div>
                <div className="pt-2 text-center">
                  <Button variant="ghost" className="text-blue-600 dark:text-blue-400 h-auto p-0 hover:bg-transparent hover:underline">View Documents</Button>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <PackageCheck className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p>No Receipts Found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document 3: Invoice */}
        <Card className="border-t-4 border-t-purple-500">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                <Receipt className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-lg">3. Vendor Invoice</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Invoice Number</span>
              <span className="font-mono font-medium text-purple-600 dark:text-purple-400">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Invoice Total</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(match.invoiceTotal)}</span>
            </div>
            <div className="pt-2 text-center">
              <Button variant="ghost" className="text-blue-600 dark:text-blue-400 h-auto p-0 hover:bg-transparent hover:underline">View Invoice Details</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        {invoice.status === "DRAFT" ? (
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={async () => {
              try {
                await purchasesService.postInvoice(invoiceId);
                window.location.reload();
              } catch (e: any) {
                alert(e?.response?.data?.message || "Match failed or an error occurred.");
              }
            }}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" /> Post Bill & Verify Match
          </Button>
        ) : invoice.status === "PENDING_APPROVAL" && isMatched ? (
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <CheckCircle2 className="mr-2 h-4 w-4" /> Approve for Payment
          </Button>
        ) : invoice.status === "APPROVED" ? (
          <Button variant="secondary" disabled>
            Already Approved
          </Button>
        ) : invoice.status === "PAID" ? (
          <Button variant="secondary" disabled>
            Invoice Paid
          </Button>
        ) : invoice.status === "POSTED" ? (
          <Button variant="secondary" disabled>
            Posted to Accounting
          </Button>
        ) : (
          <Button variant="outline" disabled>
            {invoice.status}
          </Button>
        )}
      </div>
    </div>
  );
}
