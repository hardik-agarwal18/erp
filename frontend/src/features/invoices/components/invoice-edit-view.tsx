"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "@/hooks/use-workspace";
import { queryKeys } from "@/lib/query-keys";
import { useInvoiceDetailQuery } from "../hooks/use-invoices-query";
import { updateLiveInvoice } from "../service";

export function InvoiceEditView({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { workspace } = useWorkspace();
  const detailQuery = useInvoiceDetailQuery(invoiceId);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateLiveInvoice>[1]) => updateLiveInvoice(invoiceId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.invoiceDetail(workspace.id, invoiceId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.invoices(workspace.id) });
      router.push(`/invoices/${invoiceId}`);
    },
  });

  if (detailQuery.isError) {
    return <ModuleError title="Invoice unavailable" message="We could not open this invoice for editing." retry={() => detailQuery.refetch()} />;
  }

  if (!detailQuery.data) {
    return <EmptyState title="Invoice not found" description="The requested invoice record could not be loaded for editing." />;
  }

  const invoice = detailQuery.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Edit ${invoice.invoiceNumber}`}
        description="Update the backend-supported invoice fields: status, due date, and notes."
        actions={
          <Button size="sm" variant="outline" onClick={() => router.push(`/invoices/${invoice.id}`)}>
            View Invoice
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Invoice Controls</CardTitle>
              <CardDescription>The backend only supports updating status, due date, and notes on existing invoices.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);

                try {
                  setError(null);
                  await mutation.mutateAsync({
                    status: String(formData.get("status")) as "DRAFT" | "ISSUED" | "CANCELLED",
                    dueDate: formData.get("dueDate") ? new Date(String(formData.get("dueDate"))).toISOString() : undefined,
                    notes: String(formData.get("notes") || ""),
                  });
                } catch (submissionError) {
                  setError(submissionError instanceof Error ? submissionError.message : "Unable to update invoice");
                }
              }}
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <Label htmlFor="invoice-status">Status</Label>
                  <Select defaultValue={invoice.status === "draft" ? "DRAFT" : invoice.status === "sent" ? "ISSUED" : invoice.status === "paid" ? "ISSUED" : invoice.status === "partial" ? "ISSUED" : "CANCELLED"} id="invoice-status" name="status">
                    <option value="DRAFT">Draft</option>
                    <option value="ISSUED">Issued</option>
                    <option value="CANCELLED">Cancelled</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="invoice-due-date">Due date</Label>
                  <Input defaultValue={invoice.dueDate} id="invoice-due-date" name="dueDate" type="date" />
                </div>
              </div>
              <div>
                <Label htmlFor="invoice-notes">Notes</Label>
                <Textarea defaultValue={invoice.notes} id="invoice-notes" name="notes" />
              </div>
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <Button className="w-full lg:w-auto" disabled={mutation.isPending} type="submit">
                {mutation.isPending ? "Saving changes..." : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-4">
            <p className="text-sm font-semibold text-slate-950">Live backend constraints</p>
            {[
              "Invoice header content and line items are generated at creation time.",
              "Existing line items are not patchable through the current backend API.",
              "Changing status from Draft to Issued may trigger stock reductions for physical products.",
              "Invoice payments are tracked separately through the payments backend module.",
            ].map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-600">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
