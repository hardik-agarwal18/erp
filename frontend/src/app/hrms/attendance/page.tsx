"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Download, Plus, Search } from "lucide-react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";

import { attendanceService } from "@/services/attendance.service";
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

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd")
  });
  
  const [search, setSearch] = useState("");
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [manualEntryForm, setManualEntryForm] = useState({
    employeeId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    newStatus: "PRESENT" as any,
    reason: ""
  });

  const { data: summary, isLoading } = useQuery({
    queryKey: ["attendance-summary", dateRange],
    queryFn: () => attendanceService.getSummary(dateRange.start, dateRange.end),
  });

  const manualEntryMutation = useMutation({
    mutationFn: (data: any) => attendanceService.requestAdjustment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-summary"] });
      setIsManualEntryOpen(false);
      toast.success("Attendance entry added manually.");
      setManualEntryForm({
        employeeId: "",
        date: format(new Date(), "yyyy-MM-dd"),
        newStatus: "PRESENT",
        reason: ""
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to add manual entry");
    }
  });

  const handleManualEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    manualEntryMutation.mutate({
      employeeId: manualEntryForm.employeeId,
      date: new Date(manualEntryForm.date).toISOString(),
      newStatus: manualEntryForm.newStatus,
      reason: manualEntryForm.reason || "Manual adjustment"
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Attendance</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Track check-ins, check-outs, and overtime across the organization.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search employee..."
                className="w-[200px] pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Dialog open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Clock className="mr-2 h-4 w-4" />
                  Manual Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleManualEntrySubmit}>
                  <DialogHeader>
                    <DialogTitle>Manual Attendance Entry</DialogTitle>
                    <DialogDescription>
                      Record an attendance entry manually for an employee.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Employee ID</Label>
                      <Input
                        id="employeeId"
                        required
                        placeholder="e.g. EMP-001"
                        value={manualEntryForm.employeeId}
                        onChange={(e) => setManualEntryForm({ ...manualEntryForm, employeeId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        required
                        value={manualEntryForm.date}
                        onChange={(e) => setManualEntryForm({ ...manualEntryForm, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newStatus">Status</Label>
                      <select
                        id="newStatus"
                        className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300"
                        value={manualEntryForm.newStatus}
                        onChange={(e) => setManualEntryForm({ ...manualEntryForm, newStatus: e.target.value as any })}
                      >
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                        <option value="LATE">Late</option>
                        <option value="HALF_DAY">Half Day</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reason">Reason / Notes</Label>
                      <Textarea
                        id="reason"
                        placeholder="Why is this being added manually?"
                        value={manualEntryForm.reason}
                        onChange={(e) => setManualEntryForm({ ...manualEntryForm, reason: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsManualEntryOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={manualEntryMutation.isPending}>
                      {manualEntryMutation.isPending ? "Saving..." : "Save Entry"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Work Hours</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {summary?.reduce((acc, curr) => acc + curr.totalWorkHours, 0) || 0}h
                        </h3>
                    </div>
                </div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-600">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Absences</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {summary?.reduce((acc, curr) => acc + curr.totalAbsent, 0) || 0}
                        </h3>
                    </div>
                </div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Late Arrivals</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {summary?.reduce((acc, curr) => acc + curr.totalLate, 0) || 0}
                        </h3>
                    </div>
                </div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Overtime</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {summary?.reduce((acc, curr) => acc + curr.totalOvertimeHours, 0) || 0}h
                        </h3>
                    </div>
                </div>
            </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Employee ID</th>
                  <th className="px-6 py-4">Present</th>
                  <th className="px-6 py-4">Absent</th>
                  <th className="px-6 py-4">Late</th>
                  <th className="px-6 py-4">Half Day</th>
                  <th className="px-6 py-4 text-right">Work Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    </tr>
                  ))
                ) : summary?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      <Clock className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
                      <p>No attendance records found for this period.</p>
                    </td>
                  </tr>
                ) : (
                  summary?.filter(s => s.employeeId.includes(search)).map((s) => (
                    <tr key={s.employeeId} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                        {s.employeeId}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">{s.totalPresent}</Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">{s.totalAbsent}</Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {s.totalLate > 0 ? <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">{s.totalLate}</Badge> : "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {s.totalHalfDay > 0 ? <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">{s.totalHalfDay}</Badge> : "-"}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-900 dark:text-slate-100 font-medium">
                        {s.totalWorkHours}h
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
