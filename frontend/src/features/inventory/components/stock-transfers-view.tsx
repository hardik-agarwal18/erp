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
import { useCreateStockTransferMutation, useInventoryManagementQuery } from "../hooks/use-inventory-query";
import { stockTransferSchema, type StockTransferSchema } from "../schema";
import { InventoryModuleNav } from "./inventory-module-nav";

export function StockTransfersView() {
  const query = useInventoryManagementQuery();
  const mutation = useCreateStockTransferMutation();
  const form = useForm<StockTransferSchema>({
    resolver: zodResolver(stockTransferSchema),
    defaultValues: {
      sku: "PM-2201",
      fromWarehouse: "Dallas Central",
      toWarehouse: "Chicago North",
      quantity: 24,
      eta: "2026-06-01",
      requestedBy: "Mila Torres",
    },
  });

  if (query.isError) {
    return <ModuleError title="Transfers unavailable" message="We could not load stock transfer movements and requests." retry={() => query.refetch()} />;
  }

  if (!query.data?.transfers.length) {
    return <EmptyState title="No stock transfers" description="Create the first transfer to balance stock across locations." actionLabel="Create transfer" />;
  }

  const { transfers } = query.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock Transfers"
        description="Plan and track stock movements between warehouses, plants, and staging nodes."
        actions={<Button size="sm" variant="outline">Carrier Manifest</Button>}
      />
      <InventoryModuleNav activePath="/inventory/transfers" />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.8fr)]">
        <Card>
          <CardContent className="p-4">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Reference</TableHeaderCell>
                    <TableHeaderCell>Item</TableHeaderCell>
                    <TableHeaderCell>From</TableHeaderCell>
                    <TableHeaderCell>To</TableHeaderCell>
                    <TableHeaderCell className="text-right">Quantity</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>ETA</TableHeaderCell>
                    <TableHeaderCell>Requested By</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {transfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium text-slate-950">{transfer.reference}</TableCell>
                      <TableCell>{transfer.itemName}</TableCell>
                      <TableCell>{transfer.fromWarehouse}</TableCell>
                      <TableCell>{transfer.toWarehouse}</TableCell>
                      <TableCell className="text-right">{transfer.quantity}</TableCell>
                      <TableCell>
                        <Badge variant={transfer.status === "received" ? "success" : transfer.status === "in_transit" ? "info" : "warning"}>
                          {transfer.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{transfer.eta}</TableCell>
                      <TableCell>{transfer.requestedBy}</TableCell>
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
              <CardTitle>Create Transfer</CardTitle>
              <CardDescription>Move stock to demand-heavy locations before service levels degrade.</CardDescription>
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
                <Label htmlFor="transfer-sku">SKU</Label>
                <Input id="transfer-sku" {...form.register("sku")} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="transfer-from">From Warehouse</Label>
                  <Select id="transfer-from" {...form.register("fromWarehouse")}>
                    <option value="Dallas Central">Dallas Central</option>
                    <option value="Chicago North">Chicago North</option>
                    <option value="Phoenix West">Phoenix West</option>
                    <option value="Atlanta South">Atlanta South</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="transfer-to">To Warehouse</Label>
                  <Select id="transfer-to" {...form.register("toWarehouse")}>
                    <option value="Chicago North">Chicago North</option>
                    <option value="Dallas Central">Dallas Central</option>
                    <option value="Phoenix West">Phoenix West</option>
                    <option value="Atlanta South">Atlanta South</option>
                  </Select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="transfer-quantity">Quantity</Label>
                  <Input id="transfer-quantity" type="number" {...form.register("quantity", { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="transfer-eta">ETA</Label>
                  <Input id="transfer-eta" {...form.register("eta")} />
                </div>
              </div>
              <div>
                <Label htmlFor="transfer-requested-by">Requested By</Label>
                <Input id="transfer-requested-by" {...form.register("requestedBy")} />
              </div>
              <Button className="w-full" disabled={mutation.isPending} type="submit">
                {mutation.isPending ? "Creating transfer..." : "Create transfer"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
