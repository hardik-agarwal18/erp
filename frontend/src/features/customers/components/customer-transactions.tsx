import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { CustomerTransaction } from "@/types/app";
import { formatCurrency } from "@/utils/formatters";

export function CustomerTransactions({ transactions }: { transactions: CustomerTransaction[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Ledger movement for the customer account.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Date</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Reference</TableHeaderCell>
                <TableHeaderCell className="text-right">Amount</TableHeaderCell>
                <TableHeaderCell className="text-right">Balance</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell>{transaction.type.replace("_", " ")}</TableCell>
                  <TableCell className="font-medium text-slate-950">{transaction.reference}</TableCell>
                  <TableCell className="text-right">{formatCurrency(transaction.amount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(transaction.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
