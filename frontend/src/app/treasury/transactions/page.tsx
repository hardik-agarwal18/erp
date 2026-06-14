"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { getBankTransactions, createBankTransaction, getBankAccounts, BankAccount, BankTransaction, reconcileBankTransaction } from "@/services/treasury.service";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ArrowDownToLine, ArrowUpFromLine, Receipt } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { format } from "date-fns";

export default function BankTransactionsPage() {
  const queryClient = useQueryClient();
  const reconcileMutation = useMutation({
    mutationFn: reconcileBankTransaction,
    onSuccess: () => {
      toast.success("Transaction reconciled successfully");
      queryClient.invalidateQueries({ queryKey: ["bankTransactions"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to reconcile");
    }
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["treasury", "transactions"],
    queryFn: getBankTransactions,
  });

  const { data: accounts } = useQuery({
    queryKey: ["treasury", "accounts"],
    queryFn: getBankAccounts,
  });

  const [formData, setFormData] = useState({
    bankAccountId: "",
    type: "WITHDRAWAL" as "DEPOSIT" | "WITHDRAWAL" | "BANK_FEE" | "INTEREST",
    amount: "",
    reference: "",
    description: "",
    transactionDate: format(new Date(), "yyyy-MM-dd"),
  });

  const createMutation = useMutation({
    mutationFn: createBankTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasury", "transactions"] });
      setIsDialogOpen(false);
      setFormData({ bankAccountId: "", type: "WITHDRAWAL", amount: "", reference: "", description: "", transactionDate: format(new Date(), "yyyy-MM-dd") });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      amount: formData.amount,
    });
  };

  return (
    <AppShell activePath="/treasury/transactions">
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Bank Transactions</h2>
            <p className="text-muted-foreground mt-1">Record and view deposits, withdrawals, and bank fees.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Record Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Record Bank Transaction</DialogTitle>
                  <DialogDescription>
                    This will automatically post a corresponding Journal Entry to the General Ledger.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bankAccountId">Bank Account</Label>
                    <Select value={formData.bankAccountId} onChange={e => setFormData({...formData, bankAccountId: e.target.value})}>
                      <option value="" disabled>Select a bank account</option>
                      {accounts?.map((acc: BankAccount) => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type">Transaction Type</Label>
                      <Select value={formData.type} onChange={(e: any) => setFormData({...formData, type: e.target.value})}>
                        <option value="DEPOSIT">Deposit</option>
                        <option value="WITHDRAWAL">Withdrawal</option>
                        <option value="BANK_FEE">Bank Fee</option>
                        <option value="INTEREST">Interest Earned</option>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input id="amount" type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="date">Date</Label>
                      <Input id="date" type="date" required value={formData.transactionDate} onChange={e => setFormData({...formData, transactionDate: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="reference">Reference No.</Label>
                      <Input id="reference" placeholder="Cheque / UTR" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending || !formData.bankAccountId}>
                    {createMutation.isPending ? "Saving..." : "Record Transaction"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Loading transactions...</div>
            ) : transactions && transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Bank Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn: BankTransaction) => (
                    <TableRow key={txn.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(txn.transactionDate), "dd MMM, yyyy")}
                      </TableCell>
                      <TableCell>{txn.bankAccount?.name}</TableCell>
                      <TableCell>{txn.description || "-"}</TableCell>
                      <TableCell>{txn.reference || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {["DEPOSIT", "INTEREST"].includes(txn.type) ? (
                            <ArrowDownToLine className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <ArrowUpFromLine className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">{txn.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{Number(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-10 text-center flex flex-col items-center">
                <Receipt className="h-10 w-10 text-slate-200 mb-4" />
                <p className="text-sm text-slate-500 font-medium">No transactions found.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
