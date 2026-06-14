"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Banknote, FileText, Plus, Receipt, Download, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { claimService, ExpenseClaimStatus } from "@/services/claim.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ClaimsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ExpenseClaimStatus | "ALL">("ALL");
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  
  const [claimForm, setClaimForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    category: "TRAVEL",
    amount: "",
    currency: "INR",
    description: "",
    receiptUrl: ""
  });

  const { data: claims, isLoading } = useQuery({
    queryKey: ["expense-claims", statusFilter],
    queryFn: () => claimService.listClaims(statusFilter === "ALL" ? undefined : statusFilter),
  });

  const submitClaimMutation = useMutation({
    mutationFn: (data: any) => claimService.submitClaim(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
      setIsSubmitModalOpen(false);
      toast.success("Expense claim submitted successfully");
      setClaimForm({
        date: format(new Date(), "yyyy-MM-dd"),
        category: "TRAVEL",
        amount: "",
        currency: "INR",
        description: "",
        receiptUrl: ""
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to submit claim");
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: ExpenseClaimStatus }) => claimService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
      toast.success("Claim status updated");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitClaimMutation.mutate({
      ...claimForm,
      amount: parseFloat(claimForm.amount),
      date: new Date(claimForm.date).toISOString()
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED": return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">Approved</Badge>;
      case "REIMBURSED": return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">Reimbursed</Badge>;
      case "REJECTED": return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">Rejected</Badge>;
      case "PENDING": return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">Pending</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Expense Claims</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Submit and track employee expense reimbursements.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>

            <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Submit Claim
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Submit Expense Claim</DialogTitle>
                    <DialogDescription>
                      Submit a new receipt for reimbursement.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date of Expense</Label>
                      <Input
                        id="date"
                        type="date"
                        required
                        value={claimForm.date}
                        onChange={(e) => setClaimForm({ ...claimForm, date: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <select
                            id="category"
                            className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300"
                            value={claimForm.category}
                            onChange={(e) => setClaimForm({ ...claimForm, category: e.target.value })}
                        >
                            <option value="TRAVEL">Travel</option>
                            <option value="MEALS">Meals</option>
                            <option value="SUPPLIES">Supplies</option>
                            <option value="SOFTWARE">Software</option>
                            <option value="OTHER">Other</option>
                        </select>
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="amount">Amount (INR)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            placeholder="0.00"
                            value={claimForm.amount}
                            onChange={(e) => setClaimForm({ ...claimForm, amount: e.target.value })}
                        />
                        </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="What was this expense for?"
                        required
                        value={claimForm.description}
                        onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="receiptUrl">Receipt URL (Optional)</Label>
                      <Input
                        id="receiptUrl"
                        type="url"
                        placeholder="https://..."
                        value={claimForm.receiptUrl}
                        onChange={(e) => setClaimForm({ ...claimForm, receiptUrl: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsSubmitModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitClaimMutation.isPending}>
                      {submitClaimMutation.isPending ? "Submitting..." : "Submit Claim"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

          </div>
        </div>

        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          {["ALL", "PENDING", "APPROVED", "REIMBURSED", "REJECTED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === status 
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              {status === "ALL" ? "All Claims" : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Date & Category</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                      <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-8 ml-auto" /></td>
                    </tr>
                  ))
                ) : claims?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      <Receipt className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
                      <p>No expense claims found.</p>
                    </td>
                  </tr>
                ) : (
                  claims?.map((claim) => (
                    <tr key={claim.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {claim.employee?.firstName} {claim.employee?.lastName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {claim.employee?.employeeCode}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{claim.category}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{format(new Date(claim.date), "MMM d, yyyy")}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={claim.description}>
                        {claim.description}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                        {claim.amount} {claim.currency}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(claim.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                            {claim.receiptUrl && (
                                <a href={claim.receiptUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-500 transition-colors" title="View Receipt">
                                    <FileText className="h-4 w-4" />
                                </a>
                            )}
                            {claim.status === "PENDING" && (
                                <>
                                <button onClick={() => updateStatusMutation.mutate({ id: claim.id, status: "APPROVED" })} className="text-emerald-600 hover:underline text-sm font-medium">Approve</button>
                                <button onClick={() => updateStatusMutation.mutate({ id: claim.id, status: "REJECTED" })} className="text-red-600 hover:underline text-sm font-medium">Reject</button>
                                </>
                            )}
                            {claim.status === "APPROVED" && (
                                <button onClick={() => updateStatusMutation.mutate({ id: claim.id, status: "REIMBURSED" })} className="text-blue-600 hover:underline text-sm font-medium">Mark Paid</button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
