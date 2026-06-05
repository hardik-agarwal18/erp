import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { PurchaseOrder } from "@/types/app";
import { formatCurrency } from "@/utils/formatters";

export function VendorPurchaseOrders({ orders }: { orders: PurchaseOrder[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>Open and historical procurement linked to this vendor.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>PO #</TableHeaderCell>
                <TableHeaderCell>Expected Date</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Warehouse</TableHeaderCell>
                <TableHeaderCell className="text-right">Amount</TableHeaderCell>
                <TableHeaderCell>Approval</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium text-slate-950">{order.number}</TableCell>
                  <TableCell>{order.expectedDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.status === "approved" || order.status === "received"
                          ? "success"
                          : order.status === "pending_approval"
                            ? "warning"
                            : order.status === "billed"
                              ? "info"
                              : "neutral"
                      }
                    >
                      {order.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.warehouse}</TableCell>
                  <TableCell className="text-right">{formatCurrency(order.amount)}</TableCell>
                  <TableCell>{order.approvalStage}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
