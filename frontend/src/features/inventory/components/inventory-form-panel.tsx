"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { stockAdjustmentSchema, type StockAdjustmentSchema } from "../schema";
import { useCreateStockAdjustmentMutation } from "../hooks/use-inventory-query";

export function InventoryFormPanel() {
  const mutation = useCreateStockAdjustmentMutation();
  const form = useForm<StockAdjustmentSchema>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      sku: "CB-4401",
      warehouse: "Chicago North",
      quantity: 4,
      direction: "decrease",
      reason: "cycle_count",
      requestedBy: "Mila Torres",
      note: "Cycle count correction before daily close.",
    },
  });

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Quick Adjustment</CardTitle>
          <CardDescription>Post controlled quantity corrections directly from the dashboard.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={form.handleSubmit(async (values) => {
            await mutation.mutateAsync(values);
          })}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="inventory-sku">SKU</Label>
              <Input id="inventory-sku" {...form.register("sku")} />
            </div>
            <div>
              <Label htmlFor="inventory-warehouse">Warehouse</Label>
              <Select id="inventory-warehouse" {...form.register("warehouse")}>
                <option value="Dallas Central">Dallas Central</option>
                <option value="Chicago North">Chicago North</option>
                <option value="Phoenix West">Phoenix West</option>
                <option value="Atlanta South">Atlanta South</option>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="inventory-quantity">Quantity</Label>
              <Input id="inventory-quantity" type="number" {...form.register("quantity", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="inventory-direction">Direction</Label>
              <Select id="inventory-direction" {...form.register("direction")}>
                <option value="increase">Increase</option>
                <option value="decrease">Decrease</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="inventory-reason">Reason</Label>
              <Select id="inventory-reason" {...form.register("reason")}>
                <option value="cycle_count">Cycle count</option>
                <option value="damage">Damage</option>
                <option value="receipt_correction">Receipt correction</option>
                <option value="return">Return</option>
                <option value="production_issue">Production issue</option>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="inventory-requested-by">Requested By</Label>
            <Input id="inventory-requested-by" {...form.register("requestedBy")} />
          </div>
          <div>
            <Label htmlFor="inventory-note">Note</Label>
            <Input id="inventory-note" {...form.register("note")} />
          </div>
          <Button className="w-full" disabled={mutation.isPending} type="submit">
            {mutation.isPending ? "Posting adjustment..." : "Post adjustment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
