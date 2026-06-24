"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { getTreasuryTransfers, createTreasuryTransfer, reverseTreasuryTransfer, getBankAccounts, TreasuryTransfer } from "@/services/treasury.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRightLeft, Plus, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { format } from "date-fns";

export default function TreasuryTransfersPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: accounts } = useQuery({
    queryKey: ["treasury", "accounts"],
    queryFn: getBankAccounts,
  });

  const { data: transfers, isLoading } = useQuery({
    queryKey: ["treasury", "transfers"],
    queryFn: getTreasuryTransfers,
  });

  const [formData, setFormData] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    transferDate: new Date().toISOString().split('T')[0],
    reference: "",
    externalReference: "",
    description: "",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: createTreasuryTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasury", "transfers"] });
      queryClient.invalidateQueries({ queryKey: ["treasury", "dashboard"] });
      setIsDialogOpen(false);
      setFormData({ fromAccountId: "", toAccountId: "", amount: "", transferDate: new Date().toISOString().split('T')[0], reference: "", externalReference: "", description: "", notes: "" });
    },
  });

  const reverseMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => reverseTreasuryTransfer(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasury", "transfers"] });
      queryClient.invalidateQueries({ queryKey: ["treasury", "dashboard"] });
    },
  });

  const handleReverse = (id: string) => {
    const reason = window.prompt("Reason for reversal:");
    if (reason) {
      reverseMutation.mutate({ id, reason });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      amount: formData.amount,
      transferDate: new Date(formData.transferDate).toISOString(),
    });
  };

  return (
    <AppShell activePath="/treasury/transfers">
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Transfers</h2>
            <p className="text-muted-foreground mt-1">Move funds between your financial accounts.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Transfer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Transfer Funds</DialogTitle>
                  <DialogDescription>
                    Record a transfer between two of your accounts. A journal entry will be posted automatically.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>From Account</Label>
                      <Select required value={formData.fromAccountId} onChange={(e: any) => setFormData({...formData, fromAccountId: e.target.value})}>
                        <option value="" disabled>Select account</option>
                        {accounts?.map((acc: any) => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>To Account</Label>
                      <Select required value={formData.toAccountId} onChange={(e: any) => setFormData({...formData, toAccountId: e.target.value})}>
                        <option value="" disabled>Select account</option>
                        {accounts?.map((acc: any) => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Amount <span className="text-red-500">*</span></Label>
                      <Input id="amount" type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="transferDate">Date <span className="text-red-500">*</span></Label>
                      <Input id="transferDate" type="date" required value={formData.transferDate} onChange={e => setFormData({...formData, transferDate: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="reference">Internal Reference</Label>
                      <Input id="reference" placeholder="e.g. TR-1002" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="externalReference">External Reference (UTR)</Label>
                      <Input id="externalReference" placeholder="e.g. UTR1234567" value={formData.externalReference} onChange={e => setFormData({...formData, externalReference: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Input id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Input id="notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending || !formData.fromAccountId || !formData.toAccountId || formData.fromAccountId === formData.toAccountId}>
                    {createMutation.isPending ? "Processing..." : "Transfer Funds"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transfer History</CardTitle>
            <CardDescription>Recent transfers between accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Loading transfers...</div>
            ) : transfers && transfers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transfer ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>From Account</TableHead>
                    <TableHead>To Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((tx: TreasuryTransfer) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium text-slate-700">
                        {tx.transferNumber}
                      </TableCell>
                      <TableCell>{format(new Date(tx.transferDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>{tx.fromAccount?.name}</TableCell>
                      <TableCell>{tx.toAccount?.name}</TableCell>
                      <TableCell className="text-right font-medium text-slate-900">
                        ₹ {Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${tx.status === 'REVERSED' ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' : 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'}`}>
                          {tx.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {tx.status === "POSTED" && (
                          <Button variant="ghost" size="sm" onClick={() => handleReverse(tx.id)} disabled={reverseMutation.isPending}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reverse
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-10 text-center flex flex-col items-center">
                <ArrowRightLeft className="h-10 w-10 text-slate-200 mb-4" />
                <p className="text-sm text-slate-500 font-medium">No transfers found.</p>
                <Button variant="outline" onClick={() => setIsDialogOpen(true)} className="mt-2">
                  Create your first transfer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
