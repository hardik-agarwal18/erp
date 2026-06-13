"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Plus, MoreHorizontal } from "lucide-react";

import { shiftService } from "@/services/shift.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShiftsPage() {
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");

  const { data, isLoading } = useQuery({
    queryKey: ["shifts", statusFilter],
    queryFn: () => shiftService.listShifts(statusFilter === "ALL" ? undefined : statusFilter === "ACTIVE"),
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Shifts & Schedules</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Configure shift timings and assign them to employees.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Shift
            </Button>
          </div>
        </div>

        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
          {["ALL", "ACTIVE", "INACTIVE"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === status 
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              {status === "ALL" ? "All Shifts" : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
                        <Skeleton className="h-6 w-3/4 mb-4" />
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    </div>
                ))
            ) : data?.length === 0 ? (
                <div className="col-span-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-12 text-center shadow-sm">
                    <CalendarClock className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">No shifts found.</p>
                </div>
            ) : (
                data?.map((shift) => (
                    <div key={shift.id} className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{shift.name}</h3>
                            <div className="flex items-center gap-2">
                                {shift.isActive ? (
                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20">Active</Badge>
                                ) : (
                                    <Badge variant="neutral" className="text-slate-500">Inactive</Badge>
                                )}
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                </Button>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Timing</span>
                                <span className="font-medium text-slate-900 dark:text-slate-100">{shift.startTime} - {shift.endTime}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Grace Period</span>
                                <span className="font-medium text-slate-900 dark:text-slate-100">{shift.gracePeriodMinutes} mins</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Half Day Threshold</span>
                                <span className="font-medium text-slate-900 dark:text-slate-100">{shift.halfDayThresholdHours} hrs</span>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
}
