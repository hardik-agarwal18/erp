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
import { useInventoryManagementQuery, useSaveWarehouseSettingsMutation } from "../hooks/use-inventory-query";
import { warehouseSchema, type WarehouseSchema } from "../schema";
import { InventoryModuleNav } from "./inventory-module-nav";

export function WarehouseManagementView() {
  const query = useInventoryManagementQuery();
  const mutation = useSaveWarehouseSettingsMutation();
  const form = useForm<WarehouseSchema>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: "Phoenix West",
      manager: "Anya Shah",
      type: "plant",
      capacityUtilization: 95,
      openBins: 28,
      pendingPutaways: 17,
      pickingAccuracy: 95.7,
    },
  });

  if (query.isError) {
    return <ModuleError title="Warehouses unavailable" message="We could not load warehouse capacity and execution metrics." retry={() => query.refetch()} />;
  }

  if (!query.data?.warehouses.length) {
    return <EmptyState title="No warehouses found" description="Add a warehouse to start organizing stock operations." actionLabel="Create warehouse" />;
  }

  const { warehouses } = query.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Warehouse Management"
        description="Capacity, picking performance, putaway pressure, and operational ownership by location."
        actions={<Button size="sm" variant="outline">Capacity Snapshot</Button>}
      />
      <InventoryModuleNav activePath="/inventory/warehouses" />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.82fr)]">
        <div className="grid gap-4 md:grid-cols-2">
          {warehouses.map((warehouse) => (
            <Card key={warehouse.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{warehouse.name}</p>
                    <p className="text-sm text-slate-500">
                      {warehouse.type} · Manager {warehouse.manager}
                    </p>
                  </div>
                  <Badge variant={warehouse.status === "healthy" ? "success" : warehouse.status === "attention" ? "warning" : "danger"}>
                    {warehouse.status}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">Capacity: {warehouse.capacityUtilization}%</div>
                  <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">Open bins: {warehouse.openBins}</div>
                  <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">Pending putaways: {warehouse.pendingPutaways}</div>
                  <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-600">Picking accuracy: {warehouse.pickingAccuracy}%</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Update Warehouse Settings</CardTitle>
              <CardDescription>Refresh operational targets and utilization settings for a location.</CardDescription>
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
                <Label htmlFor="warehouse-name">Warehouse</Label>
                <Input id="warehouse-name" {...form.register("name")} />
              </div>
              <div>
                <Label htmlFor="warehouse-manager">Manager</Label>
                <Input id="warehouse-manager" {...form.register("manager")} />
              </div>
              <div>
                <Label htmlFor="warehouse-type">Type</Label>
                <Select id="warehouse-type" {...form.register("type")}>
                  <option value="distribution">Distribution</option>
                  <option value="plant">Plant</option>
                  <option value="staging">Staging</option>
                </Select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="warehouse-capacity">Capacity Utilization</Label>
                  <Input id="warehouse-capacity" type="number" {...form.register("capacityUtilization", { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="warehouse-open-bins">Open Bins</Label>
                  <Input id="warehouse-open-bins" type="number" {...form.register("openBins", { valueAsNumber: true })} />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="warehouse-putaways">Pending Putaways</Label>
                  <Input id="warehouse-putaways" type="number" {...form.register("pendingPutaways", { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="warehouse-accuracy">Picking Accuracy</Label>
                  <Input id="warehouse-accuracy" type="number" step="0.1" {...form.register("pickingAccuracy", { valueAsNumber: true })} />
                </div>
              </div>
              <Button className="w-full" disabled={mutation.isPending} type="submit">
                {mutation.isPending ? "Saving..." : "Save warehouse settings"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
