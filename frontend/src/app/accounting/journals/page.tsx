"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, BookOpen, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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
import { accountingService, JournalEntry, Account } from "@/services/accounting.service";

function JournalEntriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountIdFilter = searchParams.get("accountId") || undefined;

  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<{ accountId: string; debit: number; credit: number; description: string }[]>([
    { accountId: "", debit: 0, credit: 0, description: "" },
    { accountId: "", debit: 0, credit: 0, description: "" }
  ]);

  const getReferenceLink = (type: string | null | undefined, id: string | null | undefined) => {
    if (!type || !id) return null;
    const t = type.toUpperCase().replace(/[^A-Z]/g, '');
    if (t === "VENDORINVOICE") return `/purchases/invoices/${id}`;
    if (t === "SALESINVOICE" || t === "INVOICE") return `/invoices/${id}`;
    if (t === "VENDORPAYMENT" || t === "CUSTOMERPAYMENT" || t === "PAYMENT") return `/payments/${id}`;
    if (t === "GOODSRECEIPTNOTE" || t === "GRN") return `/purchases/goods-received-notes/${id}`;
    if (t === "EXPENSE") return `/expenses/${id}`;
    return null;
  };

  const { data: journalsResponse, isLoading: isLoadingJournals } = useQuery({
    queryKey: ["journals", accountIdFilter],
    queryFn: () => accountingService.listJournals({ accountId: accountIdFilter }),
  });

  const { data: accountsResponse, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: () => accountingService.listAccounts(),
  });

  const journals = journalsResponse?.data || [];
  const accounts = accountsResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: accountingService.createJournal,
    onSuccess: () => {
      toast.success("Journal entry created successfully");
      queryClient.invalidateQueries({ queryKey: ["journals"] });
      setIsModalOpen(false);
    },
    onError: () => toast.error("Failed to create journal entry")
  });

  const openCreateModal = () => {
    setDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setLines([
      { accountId: "", debit: 0, credit: 0, description: "" },
      { accountId: "", debit: 0, credit: 0, description: "" }
    ]);
    setIsModalOpen(true);
  };

  const addLine = () => {
    setLines([...lines, { accountId: "", debit: 0, credit: 0, description: "" }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 2) {
      const newLines = [...lines];
      newLines.splice(index, 1);
      setLines(newLines);
    }
  };

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...lines];
    (newLines[index] as any)[field] = value;
    
    // Auto-balance logic: if debit is entered, credit must be 0 and vice versa
    if (field === "debit" && value > 0) newLines[index].credit = 0;
    if (field === "credit" && value > 0) newLines[index].debit = 0;

    setLines(newLines);
  };

  const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleSave = () => {
    if (!date || !description) {
      toast.error("Date and description are required");
      return;
    }

    if (!isBalanced) {
      toast.error("Journal entry must be balanced (Total Debits = Total Credits)");
      return;
    }

    const invalidLines = lines.filter(l => !l.accountId || (l.debit === 0 && l.credit === 0));
    if (invalidLines.length > 0) {
      toast.error("All lines must have an account and a debit or credit amount");
      return;
    }

    createMutation.mutate({ 
      date: new Date(date).toISOString(), 
      description,
      lines: lines.map(l => ({
        accountId: l.accountId,
        debit: Number(l.debit),
        credit: Number(l.credit),
        description: l.description || null
      }))
    });
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title={accountIdFilter ? `Ledger Transactions` : `Journal Entries`}
        description="Record manual journal entries and view general ledger transactions."
        actions={
          <div className="flex gap-2">
            {accountIdFilter && (
              <Button variant="outline" onClick={() => router.push('/accounting/journals')}>
                Clear Filter
              </Button>
            )}
            <Button onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              New Journal Entry
            </Button>
          </div>
        }
      />

      <div className="mb-4">
        <Label htmlFor="accountFilter" className="mb-2 block">Filter by Account</Label>
        <Select 
          value={accountIdFilter || "ALL"} 
          onChange={(e) => {
            const val = e.target.value;
            if (val === "ALL") router.push('/accounting/journals');
            else router.push(`/accounting/journals?accountId=${val}`);
          }}
        >
          <option value="ALL">All Accounts</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name} ({acc.type})</option>
          ))}
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-medium border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Journal #</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium text-right">Total Amount</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isLoadingJournals ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-20 ml-auto" /></td>
                      <td className="px-6 py-4 text-center"><Skeleton className="h-6 w-16 rounded-full mx-auto" /></td>
                    </tr>
                  ))
                ) : journals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <BookOpen className="h-8 w-8 mx-auto mb-3 text-slate-300" />
                      No journal entries found.
                    </td>
                  </tr>
                ) : (
                  journals.map((journal) => {
                    const totalAmount = journal.lines?.reduce((sum, line) => sum + Number(line.debit), 0) || 0;
                    
                    return (
                      <tr key={journal.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="px-6 py-4 font-medium font-mono text-slate-700 dark:text-slate-300">
                          {journal.entryNumber}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {format(new Date(journal.postedAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-6 py-4 text-slate-900 dark:text-slate-100 max-w-md truncate">
                          <div className="flex flex-col gap-1">
                            <span>{journal.description}</span>
                            {journal.referenceType && journal.referenceId && getReferenceLink(journal.referenceType, journal.referenceId) && (
                              <Link 
                                href={getReferenceLink(journal.referenceType, journal.referenceId)!}
                                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline inline-flex items-center gap-1 w-fit"
                              >
                                View Source <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-medium">
                          {accountIdFilter ? (
                            <div className="flex justify-end gap-2">
                              {journal.lines?.filter(l => l.accountId === accountIdFilter).reduce((sum, l) => sum + Number(l.debit), 0) > 0 && (
                                <span className="text-emerald-600">Dr {journal.lines?.filter(l => l.accountId === accountIdFilter).reduce((sum, l) => sum + Number(l.debit), 0).toFixed(2)}</span>
                              )}
                              {journal.lines?.filter(l => l.accountId === accountIdFilter).reduce((sum, l) => sum + Number(l.credit), 0) > 0 && (
                                <span className="text-rose-600">Cr {journal.lines?.filter(l => l.accountId === accountIdFilter).reduce((sum, l) => sum + Number(l.credit), 0).toFixed(2)}</span>
                              )}
                            </div>
                          ) : (
                            <span>${totalAmount.toFixed(2)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {journal.isPosted ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Posted</Badge>
                          ) : (
                            <Badge variant="neutral" className="bg-amber-500/10 text-amber-600 border-amber-200">Draft</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>New Journal Entry</DialogTitle>
            <DialogDescription>
              Record a multi-line manual journal entry. Total debits must equal total credits.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
                <Input 
                  id="date" 
                  type="date"
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Reference / Description <span className="text-red-500">*</span></Label>
                <Input 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="e.g. Month-end depreciation adjustment"
                />
              </div>
            </div>

            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-medium border-b">
                  <tr>
                    <th className="px-4 py-3 w-[35%]">Account</th>
                    <th className="px-4 py-3 w-[25%]">Description</th>
                    <th className="px-4 py-3 w-[15%]">Debit</th>
                    <th className="px-4 py-3 w-[15%]">Credit</th>
                    <th className="px-4 py-3 w-[10%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lines.map((line, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">
                        <Select 
                          value={line.accountId} 
                          onChange={(e) => updateLine(index, "accountId", e.target.value)}
                          className="border-0 bg-transparent h-8 w-full p-0 shadow-none text-slate-700 dark:text-slate-300"
                        >
                          <option value="" disabled>Select account...</option>
                          {accounts.map((acc: Account) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.code} - {acc.name}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-4 py-2">
                        <Input 
                          value={line.description}
                          onChange={(e) => updateLine(index, "description", e.target.value)}
                          placeholder="Line description..."
                          className="h-8 border-0 bg-transparent shadow-none px-0"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input 
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.debit || ""}
                          onChange={(e) => updateLine(index, "debit", parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="h-8 border-0 bg-transparent shadow-none px-0 text-right"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input 
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.credit || ""}
                          onChange={(e) => updateLine(index, "credit", parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="h-8 border-0 bg-transparent shadow-none px-0 text-right"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                          onClick={() => removeLine(index)}
                          disabled={lines.length <= 2}
                        >
                          &times;
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-900/50 border-t font-medium">
                  <tr>
                    <td colSpan={2} className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={addLine} className="h-8 px-2 text-blue-600">
                        <Plus className="h-3 w-3 mr-1" /> Add Line
                      </Button>
                    </td>
                    <td className="px-4 py-3 text-right">${totalDebit.toFixed(2)}</td>
                    <td className={`px-4 py-3 text-right ${isBalanced ? 'text-emerald-600' : 'text-red-500'}`}>
                      ${totalCredit.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            {!isBalanced && totalDebit > 0 && totalCredit > 0 && (
              <div className="text-sm text-red-500 text-right">
                Out of balance by ${Math.abs(totalDebit - totalCredit).toFixed(2)}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={createMutation.isPending || !isBalanced}
            >
              {createMutation.isPending ? "Posting..." : "Post Journal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function JournalEntriesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JournalEntriesContent />
    </Suspense>
  );
}
