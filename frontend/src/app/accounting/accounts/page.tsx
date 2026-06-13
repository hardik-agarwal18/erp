"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { accountingService, Account, AccountType } from "@/services/accounting.service";

export default function ChartOfAccountsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType | "">("");
  const [description, setDescription] = useState("");

  const { data: accountsResponse, isLoading } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => accountingService.listAccounts(),
  });

  const accounts = accountsResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: accountingService.createAccount,
    onSuccess: () => {
      toast.success("Account created successfully");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setIsModalOpen(false);
    },
    onError: () => toast.error("Failed to create account")
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => accountingService.updateAccount(editingAccount!.id, data),
    onSuccess: () => {
      toast.success("Account updated successfully");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setIsModalOpen(false);
    },
    onError: () => toast.error("Failed to update account")
  });

  const openCreateModal = () => {
    setEditingAccount(null);
    setCode("");
    setName("");
    setType("");
    setDescription("");
    setIsModalOpen(true);
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setCode(account.code);
    setName(account.name);
    setType(account.type);
    setDescription(account.description || "");
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!code || !name || !type) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = { code, name, type, description };

    if (editingAccount) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case "ASSET": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200";
      case "LIABILITY": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200";
      case "EQUITY": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200";
      case "REVENUE": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200";
      case "EXPENSE": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200";
      default: return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="Chart of Accounts"
        description="Manage your financial accounts and ledger structure."
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            New Account
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-medium border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Code</th>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                      <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                    </tr>
                  ))
                ) : accounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No accounts found. Create your first account to get started.
                    </td>
                  </tr>
                ) : (
                  accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4 font-medium font-mono text-slate-700 dark:text-slate-300">
                        {account.code}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 dark:text-slate-100">{account.name}</span>
                          {account.isSystem && (
                            <span title="System Account"><ShieldAlert className="h-3 w-3 text-amber-500" /></span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="neutral" className={getAccountTypeColor(account.type)}>
                          {account.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 truncate max-w-xs">
                        {account.description || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {account.isActive ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20">Active</Badge>
                        ) : (
                          <Badge variant="neutral">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditModal(account)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Edit Account" : "Create Account"}</DialogTitle>
            <DialogDescription>
              {editingAccount 
                ? (editingAccount.isSystem ? "Note: System accounts have restricted editing capabilities." : "Update the details for this account.")
                : "Add a new account to your chart of accounts."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Account Code <span className="text-red-500">*</span></Label>
                <Input 
                  id="code" 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)} 
                  disabled={editingAccount?.isSystem}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Account Type <span className="text-red-500">*</span></Label>
                <Select 
                  id="type"
                  value={type} 
                  onChange={(e) => setType(e.target.value as AccountType)}
                  disabled={editingAccount?.isSystem}
                >
                  <option value="" disabled>Select type</option>
                  <option value="ASSET">Asset</option>
                  <option value="LIABILITY">Liability</option>
                  <option value="EQUITY">Equity</option>
                  <option value="REVENUE">Revenue</option>
                  <option value="EXPENSE">Expense</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Account Name <span className="text-red-500">*</span></Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                disabled={editingAccount?.isSystem}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
