"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useExport } from "../hooks/use-export";

function ReportExportCard({ title, description, reportType }: { title: string; description: string; reportType: string }) {
  const { requestExport, isRequesting, status, url, reset } = useExport();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "completed" && url ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-green-600 font-medium">Export completed successfully.</p>
            <div className="flex gap-3">
              <Button asChild>
                <a href={url} target="_blank" rel="noreferrer">Download CSV</a>
              </Button>
              <Button variant="outline" onClick={reset}>Export Another</Button>
            </div>
          </div>
        ) : status === "failed" ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-rose-600 font-medium">Export failed.</p>
            <Button variant="outline" onClick={reset}>Try Again</Button>
          </div>
        ) : isRequesting || (status && status !== "completed") ? (
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating export... ({status || "queued"})
          </div>
        ) : (
          <Button onClick={() => requestExport(reportType)}>
            <Download className="mr-2 h-4 w-4" />
            Request Export
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function ReportsView() {
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Reports & Analytics"
        description="Generate and export comprehensive CSV reports from your ERP data."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <ReportExportCard
          title="Sales Report"
          description="Export all invoices, grouped by customer, including totals and status."
          reportType="sales"
        />
        <ReportExportCard
          title="Inventory Report"
          description="Export current stock levels, valuation, and low stock items."
          reportType="inventory"
        />
        <ReportExportCard
          title="Tax Report"
          description="Export total tax collected vs paid over a period."
          reportType="tax"
        />
        <ReportExportCard
          title="Expense Report"
          description="Export categorized business expenses."
          reportType="expenses"
        />
      </div>
    </div>
  );
}
