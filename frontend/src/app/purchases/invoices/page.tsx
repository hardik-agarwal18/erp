"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Receipt, Search, Filter } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { purchasesService } from "@/services/purchases.service";
import { useRouter } from "next/navigation";

export default function VendorBillsPage() {
  const router = useRouter();
  
  const { data: invoicesResponse, isLoading } = useQuery({
    queryKey: ["vendor-invoices"],
    queryFn: () => purchasesService.listInvoices(),
  });

  const invoices = invoicesResponse?.data || [];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Approved</Badge>;
      case "PAID":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Paid</Badge>;
      case "PENDING_APPROVAL":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Pending Approval</Badge>;
      case "VOID":
        return <Badge variant="neutral">Void</Badge>;
      default:
        return <Badge variant="neutral" className="bg-slate-50 text-slate-600">Draft</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="Vendor Bills"
        description="Manage invoices received from your suppliers and track 3-way matching."
        actions={
          <Button onClick={() => router.push("/purchases/invoices/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Record Bill
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search bills by invoice number or PO..." className="pl-9 bg-slate-50 dark:bg-slate-900/50" />
            </div>
            <Button variant="outline" className="sm:w-auto w-full">
              <Filter className="mr-2 h-4 w-4" /> Filters
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-medium border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Invoice #</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">PO Number</th>
                  <th className="px-6 py-4 font-medium text-right">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20 ml-auto" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
                    </tr>
                  ))
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <Receipt className="h-8 w-8 mx-auto mb-3 text-slate-300" />
                      No vendor bills found.
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4 font-medium font-mono text-blue-600 dark:text-blue-400">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {format(new Date(invoice.date), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">
                        {invoice.poNumber || "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {formatCurrency(invoice.total)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => router.push(`/purchases/invoices/${invoice.id}/match-summary`)}
                        >
                          View Matching
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
