"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { getBankAccounts, getCashCounts } from "@/services/treasury.service";
import { Badge } from "@/components/ui/badge";
import { Landmark, User, Banknote, History } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CashWorkspacePage() {
  const { data: accounts, isLoading: loadingAccounts } = useQuery({
    queryKey: ["treasury", "accounts"],
    queryFn: getBankAccounts,
  });

  const { data: cashCounts, isLoading: loadingCounts } = useQuery({
    queryKey: ["treasury", "cash-counts"],
    queryFn: getCashCounts,
  });

  const cashAccounts = accounts?.filter(a => a.type === "CASH" || a.type === "PETTY_CASH") || [];

  const formatCurrency = (amount: string | number | undefined) => {
    if (amount === undefined) return "-";
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(amount));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT": return <Badge variant="neutral" className="bg-slate-100 text-slate-600">Draft</Badge>;
      case "POSTED": return <Badge variant="success">Posted</Badge>;
      case "VOID": return <Badge variant="danger">Void</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <AppShell activePath="/treasury/cash">
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Cash Management</h2>
            <p className="text-muted-foreground mt-1">Manage physical cash, petty cash funds, and custodians.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">New Cash Count</Button>
            <Button>Replenish Petty Cash</Button>
          </div>
        </div>

        <Tabs defaultValue="custodians" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="custodians">Cash Custodians</TabsTrigger>
            <TabsTrigger value="accounts">Cash Accounts</TabsTrigger>
            <TabsTrigger value="counts">Cash Counts</TabsTrigger>
            <TabsTrigger value="variances">Variances</TabsTrigger>
          </TabsList>

          <TabsContent value="custodians" className="mt-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {loadingAccounts ? (
                <div className="col-span-full py-12 text-center text-muted-foreground">Loading custodians...</div>
              ) : cashAccounts.length > 0 ? (
                cashAccounts.map(acc => (
                  <Card key={acc.id} className="bg-white hover:shadow-md transition-all border-slate-200">
                    <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4 text-emerald-600" />
                          <CardTitle className="text-sm font-semibold">{acc.name}</CardTitle>
                        </div>
                        <Badge variant="neutral" className="text-[10px] uppercase tracking-wider">{acc.type.replace('_', ' ')}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="mb-4">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Current Balance</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {/* Note: Balance would ideally come from the dashboard API or a specific endpoint. Assuming we have it or will add it */}
                          {formatCurrency(0)} 
                        </p>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Custodian</p>
                          <p className="text-sm font-medium text-slate-900">
                            {acc.custodian ? `${acc.custodian.firstName} ${acc.custodian.lastName}` : "Unassigned"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-muted-foreground border rounded-xl bg-white">No cash accounts found.</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="accounts" className="mt-0 border rounded-xl bg-white overflow-hidden">
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Custodian</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashAccounts.map((acc) => (
                      <TableRow key={acc.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <Landmark className="h-4 w-4 text-slate-400" />
                          {acc.name}
                        </TableCell>
                        <TableCell>{acc.type}</TableCell>
                        <TableCell>{acc.currency}</TableCell>
                        <TableCell>
                          {acc.custodian ? `${acc.custodian.firstName} ${acc.custodian.lastName}` : "-"}
                        </TableCell>
                        <TableCell>
                          {acc.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="neutral">Inactive</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="counts" className="mt-0 border rounded-xl bg-white overflow-hidden">
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                {loadingCounts ? (
                  <div className="py-12 text-center text-muted-foreground">Loading cash counts...</div>
                ) : cashCounts && cashCounts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Count No.</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Counted By</TableHead>
                        <TableHead className="text-right">Expected</TableHead>
                        <TableHead className="text-right">Counted</TableHead>
                        <TableHead className="text-right">Variance</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cashCounts.map((count) => (
                        <TableRow key={count.id}>
                          <TableCell className="font-medium">{count.countNumber}</TableCell>
                          <TableCell>{format(new Date(count.countDate), "MMM d, yyyy")}</TableCell>
                          <TableCell>{count.bankAccount?.name}</TableCell>
                          <TableCell>{count.countedBy ? `${count.countedBy.firstName} ${count.countedBy.lastName}` : "-"}</TableCell>
                          <TableCell className="text-right">{formatCurrency(count.expectedBalance)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(count.countedBalance)}</TableCell>
                          <TableCell className={`text-right font-medium ${Number(count.varianceAmount) < 0 ? 'text-rose-600' : Number(count.varianceAmount) > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {formatCurrency(count.varianceAmount)}
                          </TableCell>
                          <TableCell>{getStatusBadge(count.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-12 text-center flex flex-col items-center">
                    <History className="h-8 w-8 text-slate-200 mb-3" />
                    <p className="text-sm text-slate-500">No cash counts found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="variances" className="mt-0 border rounded-xl bg-white overflow-hidden">
             {/* Similar to counts, but filtered for non-zero variance */}
             <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                {loadingCounts ? (
                  <div className="py-12 text-center text-muted-foreground">Loading variances...</div>
                ) : cashCounts && cashCounts.filter(c => Number(c.varianceAmount) !== 0).length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Count No.</TableHead>
                        <TableHead className="text-right">Variance</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cashCounts.filter(c => Number(c.varianceAmount) !== 0).map((count) => (
                        <TableRow key={count.id}>
                          <TableCell>{format(new Date(count.countDate), "MMM d, yyyy")}</TableCell>
                          <TableCell>{count.bankAccount?.name}</TableCell>
                          <TableCell className="font-medium text-slate-500">{count.countNumber}</TableCell>
                          <TableCell className={`text-right font-bold ${Number(count.varianceAmount) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {formatCurrency(count.varianceAmount)}
                          </TableCell>
                          <TableCell>{getStatusBadge(count.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-12 text-center flex flex-col items-center">
                    <History className="h-8 w-8 text-slate-200 mb-3" />
                    <p className="text-sm text-slate-500">No cash variances found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
