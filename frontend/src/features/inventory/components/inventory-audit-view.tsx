"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { EmptyState } from "@/components/states/empty-state";
import { ModuleError } from "@/components/states/module-error";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useInventoryManagementQuery, useScheduleInventoryAuditMutation } from "../hooks/use-inventory-query";
import { inventoryAuditSchema, type InventoryAuditSchema } from "../schema";
import { InventoryModuleNav } from "./inventory-module-nav";

export function InventoryAuditView() {
  const query = useInventoryManagementQuery();
  const mutation = useScheduleInventoryAuditMutation();
  const form = useForm<InventoryAuditSchema>({
    resolver: zodResolver(inventoryAuditSchema),
    defaultValues: {
      warehouse: "Chicago North",
      cycle: "weekly",
      scope: "Electronics reserve bins",
      scheduledDate: "2026-06-02",
      owner: "Mila Torres",
    },
  });

  if (query.isError) {
    return <ModuleError title="Audit unavailable" message="We could not load cycle count schedules and variance records." retry={() => query.refetch()} />;
  }

  if (!query.data?.audits.length) {
    return <EmptyState title="No audits scheduled" description="Plan a cycle count to start variance control." actionLabel="Schedule audit" />;
  }

  const { audits } = query.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory Audit"
        description="Cycle count planning, variance ownership, and count execution visibility."
        actions={<Button size="sm" variant="outline">Variance Report</Button>}
      />
      <InventoryModuleNav activePath="/inventory/audit" />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.82fr)]">
        <div className="space-y-4">
          {audits.map((audit) => (
            <Card key={audit.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{audit.warehouse}</p>
                    <p className="text-sm text-slate-500">
                      {audit.scope} · {audit.cycle} count
                    </p>
                  </div>
                  <Badge variant={audit.status === "completed" ? "success" : audit.status === "in_progress" ? "info" : "warning"}>
                    {audit.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">Scheduled: {audit.scheduledDate}</div>
                  <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">Owner: {audit.owner}</div>
                  <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">Variance: {audit.varianceUnits} units</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Schedule Cycle Count</CardTitle>
              <CardDescription>Set count cadence, scope, and ownership for the next audit run.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={form.handleSubmit(async (values) => {
                await mutation.mutateAsync(values);
              })}
            >
              <div>
                <Label htmlFor="audit-warehouse">Warehouse</Label>
                <Select id="audit-warehouse" {...form.register("warehouse")}>
                  <option value="Dallas Central">Dallas Central</option>
                  <option value="Chicago North">Chicago North</option>
                  <option value="Phoenix West">Phoenix West</option>
                  <option value="Atlanta South">Atlanta South</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="audit-cycle">Cycle</Label>
                <Select id="audit-cycle" {...form.register("cycle")}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="audit-scope">Scope</Label>
                <Input id="audit-scope" {...form.register("scope")} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="audit-date">Scheduled Date</Label>
                  <Input id="audit-date" {...form.register("scheduledDate")} />
                </div>
                <div>
                  <Label htmlFor="audit-owner">Owner</Label>
                  <Input id="audit-owner" {...form.register("owner")} />
                </div>
              </div>
              <Button className="w-full" disabled={mutation.isPending} type="submit">
                {mutation.isPending ? "Scheduling..." : "Schedule audit"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
