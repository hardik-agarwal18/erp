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
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { useCreateStockAdjustmentMutation, useInventoryManagementQuery } from "../hooks/use-inventory-query";
import { stockAdjustmentSchema, type StockAdjustmentSchema } from "../schema";
import { InventoryModuleNav } from "./inventory-module-nav";

export function StockAdjustmentsView() {
  const query = useInventoryManagementQuery();
  const mutation = useCreateStockAdjustmentMutation();
  const form = useForm<StockAdjustmentSchema>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      sku: "RM-2044",
      warehouse: "Phoenix West",
      quantity: 3,
      direction: "decrease",
      reason: "production_issue",
      requestedBy: "Anya Shah",
      note: "Material consumed outside standard issue during rework.",
    },
  });

  if (query.isError) {
    return <ModuleError title="Adjustments unavailable" message="We could not load stock adjustment history and controls." retry={() => query.refetch()} />;
  }

  if (!query.data?.adjustments.length) {
    return <EmptyState title="No stock adjustments" description="Post the first adjustment to begin variance tracking." actionLabel="Post adjustment" />;
  }

  const { adjustments } = query.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock Adjustments"
        description="Controlled quantity corrections for cycle counts, damage, returns, and production variances."
        actions={<Button size="sm" variant="outline">Export Log</Button>}
      />
      <InventoryModuleNav activePath="/inventory/adjustments" />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.8fr)]">
        <Card>
          <CardContent className="p-4">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>SKU</TableHeaderCell>
                    <TableHeaderCell>Warehouse</TableHeaderCell>
                    <TableHeaderCell>Direction</TableHeaderCell>
                    <TableHeaderCell>Reason</TableHeaderCell>
                    <TableHeaderCell className="text-right">Quantity</TableHeaderCell>
                    <TableHeaderCell>Owner</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Posted</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {adjustments.map((adjustment) => (
                    <TableRow key={adjustment.id}>
                      <TableCell className="font-medium text-slate-950">{adjustment.sku}</TableCell>
                      <TableCell>{adjustment.warehouse}</TableCell>
                      <TableCell>{adjustment.direction}</TableCell>
                      <TableCell>{adjustment.reason.replace("_", " ")}</TableCell>
                      <TableCell className="text-right">{adjustment.quantity}</TableCell>
                      <TableCell>{adjustment.requestedBy}</TableCell>
                      <TableCell>
                        <Badge variant={adjustment.status === "posted" ? "success" : "warning"}>{adjustment.status.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell>{adjustment.postedAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Post Adjustment</CardTitle>
              <CardDescription>Capture and route quantity corrections for supervisor review.</CardDescription>
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
                <Label htmlFor="adjustment-sku">SKU</Label>
                <Input id="adjustment-sku" {...form.register("sku")} />
              </div>
              <div>
                <Label htmlFor="adjustment-warehouse">Warehouse</Label>
                <Select id="adjustment-warehouse" {...form.register("warehouse")}>
                  <option value="Dallas Central">Dallas Central</option>
                  <option value="Chicago North">Chicago North</option>
                  <option value="Phoenix West">Phoenix West</option>
                  <option value="Atlanta South">Atlanta South</option>
                </Select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="adjustment-quantity">Quantity</Label>
                  <Input id="adjustment-quantity" type="number" {...form.register("quantity", { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="adjustment-direction">Direction</Label>
                  <Select id="adjustment-direction" {...form.register("direction")}>
                    <option value="increase">Increase</option>
                    <option value="decrease">Decrease</option>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="adjustment-reason">Reason</Label>
                <Select id="adjustment-reason" {...form.register("reason")}>
                  <option value="cycle_count">Cycle count</option>
                  <option value="damage">Damage</option>
                  <option value="receipt_correction">Receipt correction</option>
                  <option value="return">Return</option>
                  <option value="production_issue">Production issue</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="adjustment-requested-by">Requested By</Label>
                <Input id="adjustment-requested-by" {...form.register("requestedBy")} />
              </div>
              <div>
                <Label htmlFor="adjustment-note">Review Note</Label>
                <Input id="adjustment-note" {...form.register("note")} />
              </div>
              <Button className="w-full" disabled={mutation.isPending} type="submit">
                {mutation.isPending ? "Submitting..." : "Submit adjustment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
