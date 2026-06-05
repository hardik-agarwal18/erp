"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { goodsReceivedNoteSchema, type GoodsReceivedNoteSchema } from "../schema";
import type { GoodsReceivedNoteFormValues } from "../types";

export function GoodsReceivedNoteForm({
  defaultValues,
  pending,
  onSubmit,
}: {
  defaultValues: GoodsReceivedNoteFormValues;
  pending?: boolean;
  onSubmit: (values: GoodsReceivedNoteSchema) => Promise<void> | void;
}) {
  const form = useForm<GoodsReceivedNoteSchema>({
    resolver: zodResolver(goodsReceivedNoteSchema),
    defaultValues,
  });

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Create GRN</CardTitle>
          <CardDescription>Capture received quantities and post them against purchase orders.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={form.handleSubmit(async (values) => onSubmit(values))}>
          <div>
            <Label htmlFor="grn-po-number">PO #</Label>
            <Input id="grn-po-number" {...form.register("purchaseOrderNumber")} />
          </div>
          <div>
            <Label htmlFor="grn-vendor">Vendor</Label>
            <Input id="grn-vendor" {...form.register("vendor")} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="grn-warehouse">Warehouse</Label>
              <Input id="grn-warehouse" {...form.register("warehouse")} />
            </div>
            <div>
              <Label htmlFor="grn-date">Received Date</Label>
              <Input id="grn-date" type="date" {...form.register("receivedDate")} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="grn-by">Received By</Label>
              <Input id="grn-by" {...form.register("receivedBy")} />
            </div>
            <div>
              <Label htmlFor="grn-items">Items Received</Label>
              <Input id="grn-items" type="number" {...form.register("itemsReceived", { valueAsNumber: true })} />
            </div>
          </div>
          <Button className="w-full" disabled={pending} type="submit">
            {pending ? "Saving GRN..." : "Save goods received note"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
