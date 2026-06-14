"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { getBankAccounts, createBankAccount, BankAccount } from "@/services/treasury.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Plus, Landmark } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function BankAccountsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: accounts, isLoading } = useQuery({
    queryKey: ["treasury", "accounts"],
    queryFn: getBankAccounts,
  });

  const [formData, setFormData] = useState({
    name: "",
    accountNumber: "",
    bankName: "",
    branchName: "",
    ifscCode: "",
    currency: "INR",
    currentBalance: "",
  });

  const createMutation = useMutation({
    mutationFn: createBankAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasury", "accounts"] });
      setIsDialogOpen(false);
      setFormData({ name: "", accountNumber: "", bankName: "", branchName: "", ifscCode: "", currency: "INR", currentBalance: "" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <AppShell activePath="/treasury/accounts">
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Bank Accounts</h2>
            <p className="text-muted-foreground mt-1">Manage your organization&apos;s bank accounts.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Bank Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Add Bank Account</DialogTitle>
                  <DialogDescription>
                    Enter the details of your new bank account. A corresponding GL account will be automatically created.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Account Name (e.g., HDFC Current) <span className="text-red-500">*</span></Label>
                    <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input id="bankName" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input id="accountNumber" value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="ifscCode">IFSC / Routing Code</Label>
                      <Input id="ifscCode" value={formData.ifscCode} onChange={e => setFormData({...formData, ifscCode: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="branchName">Branch Name</Label>
                      <Input id="branchName" value={formData.branchName} onChange={e => setFormData({...formData, branchName: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="currentBalance">Current Balance <span className="text-red-500">*</span></Label>
                    <Input id="currentBalance" type="number" step="0.01" required value={formData.currentBalance} onChange={e => setFormData({...formData, currentBalance: e.target.value})} />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Saving..." : "Save Account"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accounts?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configured Accounts</CardTitle>
            <CardDescription>A list of all linked bank accounts in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Loading accounts...</div>
            ) : accounts && accounts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Account No.</TableHead>
                    <TableHead>IFSC</TableHead>
                    <TableHead>GL Account Code</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((acc: BankAccount) => (
                    <TableRow key={acc.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-slate-500" />
                        {acc.name}
                      </TableCell>
                      <TableCell>{acc.bankName || "-"}</TableCell>
                      <TableCell>{acc.accountNumber || "-"}</TableCell>
                      <TableCell>{acc.ifscCode || "-"}</TableCell>
                      <TableCell>{acc.linkedAccount?.code}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          Active
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-10 text-center flex flex-col items-center">
                <Landmark className="h-10 w-10 text-slate-200 mb-4" />
                <p className="text-sm text-slate-500 font-medium">No bank accounts configured.</p>
                <Button variant="outline" onClick={() => setIsDialogOpen(true)} className="mt-2">
                  Create your first bank account
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
