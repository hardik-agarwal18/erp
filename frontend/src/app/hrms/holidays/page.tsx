"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarHeart, Plus, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { format } from "date-fns";

import { holidayService } from "@/services/holiday.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function HolidaysPage() {
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ["holidays", year],
    queryFn: () => holidayService.listHolidays(year),
  });

  const getHolidayTypeBadge = (type: string) => {
    switch (type) {
      case "PUBLIC": return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20">Public Holiday</Badge>;
      case "COMPANY": return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20">Company Holiday</Badge>;
      case "OPTIONAL": return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 hover:bg-amber-500/20">Optional</Badge>;
      default: return <Badge variant="neutral">{type}</Badge>;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Holiday Calendar</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage public, company, and optional holidays for the organization.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-1">
                <button onClick={() => setYear(year - 1)} className="px-3 py-1 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">-</button>
                <span className="px-4 text-sm font-medium text-slate-900 dark:text-white">{year}</span>
                <button onClick={() => setYear(year + 1)} className="px-3 py-1 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">+</button>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Holiday
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Holiday Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-64" /></td>
                    </tr>
                  ))
                ) : data?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      <CalendarHeart className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-3" />
                      <p>No holidays configured for {year}.</p>
                    </td>
                  </tr>
                ) : (
                  data?.map((holiday) => (
                    <tr key={holiday.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                                {format(new Date(holiday.date), "MMM d, yyyy")}
                            </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-6">
                            {format(new Date(holiday.date), "EEEE")}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                        {holiday.name}
                      </td>
                      <td className="px-6 py-4">
                        {getHolidayTypeBadge(holiday.type)}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-md truncate" title={holiday.description}>
                        {holiday.description || "-"}
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
