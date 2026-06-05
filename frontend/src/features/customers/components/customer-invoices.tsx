import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { Invoice } from "@/types/app";
import { formatCurrency } from "@/utils/formatters";

export function CustomerInvoices({ invoices }: { invoices: Invoice[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Customer Invoices</CardTitle>
          <CardDescription>Receivables tied to this customer account.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Invoice #</TableHeaderCell>
                <TableHeaderCell>Due Date</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Amount</TableHeaderCell>
                <TableHeaderCell className="text-right">Balance</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium text-slate-950">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.dueDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        invoice.status === "paid"
                          ? "success"
                          : invoice.status === "overdue"
                            ? "danger"
                            : invoice.status === "partial"
                              ? "warning"
                              : "info"
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
