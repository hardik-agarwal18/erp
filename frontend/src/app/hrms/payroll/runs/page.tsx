"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { payrollService } from "@/services/payroll.service";
import { PayrollRun } from "@/types/app";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle, FileText, Send } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PayrollRunsPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    setIsLoading(true);
    try {
      // The backend may return 404 if the list endpoint is not yet fully implemented.
      // We will handle it gracefully.
      const data = await payrollService.listRuns();
      setRuns(data || []);
    } catch (error) {
      console.error("Failed to fetch payroll runs", error);
      // Fallback for development if endpoint is missing
      setRuns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      await payrollService.generatePayroll({ month, year });
      toast.success("Payroll run generated successfully");
      setIsGenerateModalOpen(false);
      fetchRuns();
    } catch (error) {
      toast.error("Failed to generate payroll run");
    }
  };

  const handleSubmit = async (id: string) => {
    if (!confirm("Submit this payroll run for approval?")) return;
    try {
      await payrollService.submitForApproval(id);
      toast.success("Submitted for approval successfully");
      fetchRuns();
    } catch (error) {
      toast.error("Failed to submit for approval");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">Draft</span>;
      case "PENDING_APPROVAL":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending Approval</span>;
      case "APPROVED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>;
      case "PROCESSED":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Processed</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">{status}</span>;
    }
  };

  const getMonthName = (m: number) => {
    const date = new Date();
    date.setMonth(m - 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Payroll Runs" 
          description="Manage, generate, and submit monthly payroll cycles."
        />
        <Button onClick={() => setIsGenerateModalOpen(true)}>
          <Play className="w-4 h-4 mr-2" /> Generate Payroll
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Gross Pay</TableHead>
              <TableHead>Net Pay</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  Loading payroll runs...
                </TableCell>
              </TableRow>
            ) : runs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground flex flex-col items-center justify-center">
                  <div className="mb-2">No payroll runs found.</div>
                  <Button variant="outline" size="sm" onClick={() => setIsGenerateModalOpen(true)}>
                    Generate First Run
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              runs.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">
                    {getMonthName(run.month)} {run.year}
                  </TableCell>
                  <TableCell>{run.employeeCount || 0}</TableCell>
                  <TableCell>${(run.totalGrossPay || 0).toLocaleString()}</TableCell>
                  <TableCell className="font-semibold text-green-600">${(run.totalNetPay || 0).toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(run.status)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {run.status === "DRAFT" && (
                      <Button variant="ghost" size="sm" onClick={() => handleSubmit(run.id)}>
                        <Send className="w-4 h-4 mr-1 text-blue-600" /> Submit
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <FileText className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Payroll</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Month</Label>
              <Input 
                type="number" 
                min={1} 
                max={12} 
                value={month} 
                onChange={(e) => setMonth(parseInt(e.target.value))} 
              />
            </div>
            <div className="grid gap-2">
              <Label>Year</Label>
              <Input 
                type="number" 
                min={2000} 
                value={year} 
                onChange={(e) => setYear(parseInt(e.target.value))} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerate}>Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
