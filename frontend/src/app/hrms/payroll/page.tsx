"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { WalletCards, Plus, Play, CheckCircle2, Download } from "lucide-react";
import { format } from "date-fns";

import { payrollService } from "@/services/payroll.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PayrollPage() {
  const { data: components, isLoading: isComponentsLoading } = useQuery({
    queryKey: ["salary-components"],
    queryFn: () => payrollService.listComponents(),
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Payroll Processing</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage salary structures, deductions, and monthly payroll runs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button>
              <Play className="mr-2 h-4 w-4" />
              Run Payroll
            </Button>
          </div>
        </div>

        <Tabs defaultValue="runs" className="w-full">
            <TabsList className="mb-4">
                <TabsTrigger value="runs">Payroll Runs</TabsTrigger>
                <TabsTrigger value="components">Salary Components</TabsTrigger>
                <TabsTrigger value="structures">Employee Structures</TabsTrigger>
            </TabsList>

            <TabsContent value="runs">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-12 text-center shadow-sm">
                    <WalletCards className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No Payroll Runs Yet</h3>
                    <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        Generate your first payroll run to calculate employee salaries, taxes, and deductions for the current month.
                    </p>
                    <Button className="mt-6">
                        <Play className="mr-2 h-4 w-4" />
                        Generate Payroll Run
                    </Button>
                </div>
            </TabsContent>

            <TabsContent value="components">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Configured Components</h3>
                        <Button variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Component
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                            <tr>
                            <th className="px-6 py-4">Component Name</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Calculation</th>
                            <th className="px-6 py-4 text-center">Taxable</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {isComponentsLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <tr key={i}>
                                <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                                <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                                <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                                <td className="px-6 py-4 text-center"><Skeleton className="h-4 w-6 mx-auto" /></td>
                                </tr>
                            ))
                            ) : components?.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                No salary components configured.
                                </td>
                            </tr>
                            ) : (
                            components?.map((comp) => (
                                <tr key={comp.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                                    {comp.name}
                                </td>
                                <td className="px-6 py-4">
                                    {comp.type === "EARNING" ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">Earning</Badge>
                                    ) : (
                                        <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20">Deduction</Badge>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                    {comp.isPercentage ? `${comp.basePercentage}% of Basic Pay` : "Fixed Amount"}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {comp.isTaxable ? <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" /> : <span className="text-slate-400">-</span>}
                                </td>
                                </tr>
                            ))
                            )}
                        </tbody>
                        </table>
                    </div>
                </div>
            </TabsContent>
            
            <TabsContent value="structures">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-12 text-center shadow-sm">
                    <p className="text-slate-500 dark:text-slate-400">
                        Select an employee from the Directory to view and edit their specific salary structure.
                    </p>
                </div>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
