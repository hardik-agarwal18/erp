"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarOff, Plus, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

import { leaveService, LeaveStatus } from "@/services/leave.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeavesPage() {
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | "ALL">("ALL");

  const { data: leavesData, isLoading: isLoadingLeaves } = useQuery({
    queryKey: ["leaves", statusFilter],
    queryFn: () => leaveService.listLeaves({ 
      status: statusFilter === "ALL" ? undefined : statusFilter 
    }),
  });

  const { data: balancesData, isLoading: isLoadingBalances } = useQuery({
    queryKey: ["leave-balances", "me"],
    queryFn: () => leaveService.getMyBalances(),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED": return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Approved</Badge>;
      case "REJECTED": return <Badge className="bg-red-500/10 text-red-600 border-red-200">Rejected</Badge>;
      case "PENDING": return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Pending</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Leave Management</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage your time-off requests and view leave balances.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Apply for Leave
            </Button>
          </div>
        </div>

        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="applications">My Applications</TabsTrigger>
            <TabsTrigger value="balances">My Balances</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-6">
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
              {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as any)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === status 
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                  }`}
                >
                  {status === "ALL" ? "All Requests" : status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Employee</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4">Applied On</th>
                      <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {isLoadingLeaves ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                          <td className="px-6 py-4 text-right"><Skeleton className="h-6 w-20 ml-auto" /></td>
                        </tr>
                      ))
                    ) : leavesData?.data?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                          <CalendarOff className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
                          <p>No leave applications found.</p>
                        </td>
                      </tr>
                    ) : (
                      leavesData?.data?.map((leave) => (
                        <tr key={leave.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {leave.employee?.firstName} {leave.employee?.lastName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {leave.employee?.designation?.name || "Employee"}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                            {leave.type}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-slate-900 dark:text-slate-200">
                              {format(new Date(leave.startDate), "MMM d")} - {format(new Date(leave.endDate), "MMM d, yyyy")}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400 truncate max-w-xs" title={leave.reason}>
                            {leave.reason || "-"}
                          </td>
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                            {format(new Date(leave.appliedAt), "MMM d, yyyy")}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {getStatusBadge(leave.status)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="balances">
            {isLoadingBalances ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
              </div>
            ) : balancesData?.data?.length === 0 ? (
              <div className="flex flex-col h-[300px] items-center justify-center border rounded-lg border-dashed bg-white dark:bg-slate-950">
                <CalendarOff className="h-8 w-8 text-slate-300 mb-3" />
                <h3 className="text-lg font-medium">No Balances Found</h3>
                <p className="text-muted-foreground mt-1 text-center max-w-sm">
                  Your leave balances have not been configured yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {balancesData?.data?.map((balance) => {
                  const percentage = Math.min(100, Math.max(0, (balance.used / balance.total) * 100));
                  
                  return (
                    <Card key={balance.id} className="overflow-hidden shadow-sm">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {balance.leaveType.name}
                            {balance.leaveType.isPaid && (
                              <Badge variant="neutral" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">Paid</Badge>
                            )}
                          </CardTitle>
                          <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                            <CheckCircle2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between mb-2 text-sm">
                          <span className="text-muted-foreground">Available</span>
                          <span className="font-semibold">{balance.remaining} days</span>
                        </div>
                        
                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4 relative">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Total</p>
                            <p className="font-medium">{balance.total} days</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Used</p>
                            <p className="font-medium">{balance.used} days</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
