"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
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
import { accountingService } from "@/services/accounting.service";

export default function FiscalYearsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: fiscalYearsResponse, isLoading } = useQuery({
    queryKey: ["fiscal-years"],
    queryFn: () => accountingService.listFiscalYears(),
  });

  const fiscalYears = fiscalYearsResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: accountingService.createFiscalYear,
    onSuccess: () => {
      toast.success("Fiscal year created successfully");
      queryClient.invalidateQueries({ queryKey: ["fiscal-years"] });
      setIsModalOpen(false);
    },
    onError: () => toast.error("Failed to create fiscal year")
  });

  const openCreateModal = () => {
    setName("");
    setStartDate("");
    setEndDate("");
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    createMutation.mutate({ name, startDate: new Date(startDate).toISOString(), endDate: new Date(endDate).toISOString() });
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageHeader
        title="Fiscal Years"
        description="Manage financial accounting periods for your organization."
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            New Fiscal Year
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-medium border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Start Date</th>
                  <th className="px-6 py-4 font-medium">End Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Closed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                    </tr>
                  ))
                ) : fiscalYears.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <CalendarIcon className="h-8 w-8 mx-auto mb-3 text-slate-300" />
                      No fiscal years found. Create your first fiscal year to start posting journals.
                    </td>
                  </tr>
                ) : (
                  fiscalYears.map((fy) => (
                    <tr key={fy.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                        {fy.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {format(new Date(fy.startDate), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {format(new Date(fy.endDate), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4">
                        {fy.isActive ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Active</Badge>
                        ) : (
                          <Badge variant="neutral">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {fy.isClosed ? (
                          <div className="flex items-center text-slate-500">
                            <CheckCircle2 className="h-4 w-4 mr-1 text-slate-400" /> Yes
                          </div>
                        ) : (
                          <span className="text-slate-500">No</span>
                        )}
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
            <DialogTitle>Create Fiscal Year</DialogTitle>
            <DialogDescription>
              Define a new financial period. Note: Dates cannot overlap with existing fiscal years.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. FY 2026-2027"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date <span className="text-red-500">*</span></Label>
                <Input 
                  id="startDate" 
                  type="date"
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date <span className="text-red-500">*</span></Label>
                <Input 
                  id="endDate" 
                  type="date"
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Saving..." : "Save Fiscal Year"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
