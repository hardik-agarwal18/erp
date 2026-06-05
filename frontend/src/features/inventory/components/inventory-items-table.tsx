import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { InventoryItem } from "@/types/app";
import { formatCurrency } from "@/utils/formatters";

export function InventoryItemsTable({ items }: { items: InventoryItem[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>Item</TableHeaderCell>
            <TableHeaderCell>SKU</TableHeaderCell>
            <TableHeaderCell>Category</TableHeaderCell>
            <TableHeaderCell>Warehouse</TableHeaderCell>
            <TableHeaderCell className="text-right">On Hand</TableHeaderCell>
            <TableHeaderCell className="text-right">Reserved</TableHeaderCell>
            <TableHeaderCell className="text-right">Available</TableHeaderCell>
            <TableHeaderCell className="text-right">Reorder</TableHeaderCell>
            <TableHeaderCell className="text-right">Valuation</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium text-slate-950">{item.name}</TableCell>
              <TableCell>{item.sku}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>{item.warehouse}</TableCell>
              <TableCell className="text-right">{item.onHand}</TableCell>
              <TableCell className="text-right">{item.reserved}</TableCell>
              <TableCell className="text-right">{item.onHand - item.reserved}</TableCell>
              <TableCell className="text-right">{item.reorderPoint}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.valuation)}</TableCell>
              <TableCell>
                <Badge variant={item.status === "out_of_stock" ? "danger" : item.status === "low_stock" ? "warning" : "success"}>
                  {item.status.replace("_", " ")}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
