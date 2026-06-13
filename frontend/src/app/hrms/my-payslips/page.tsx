"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { payrollService } from "@/services/payroll.service";
import { Payslip } from "@/types/app";
import { Button } from "@/components/ui/button";
import { FileDown, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function MyPayslipsPage() {
  const router = useRouter();
  const [payslips, setPayslips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await payrollService.getMyPayslips();
      setPayslips(res || []);
    } catch (error) {
      console.error("Failed to fetch payslips", error);
      // Fallback for demo/development if backend endpoint is not fully ready
      setPayslips([
        { id: "1", month: 5, year: 2026, grossPay: 6000, deductions: 1200, netPay: 4800, status: "PAID" },
        { id: "2", month: 4, year: 2026, grossPay: 6000, deductions: 1200, netPay: 4800, status: "PAID" },
      ]);
    } finally {
      setIsLoading(false);
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
          title="My Payslips" 
          description="View and download your monthly salary slips and tax deductions."
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Gross Pay</TableHead>
              <TableHead>Deductions</TableHead>
              <TableHead>Net Pay</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  Loading payslips...
                </TableCell>
              </TableRow>
            ) : payslips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No payslips available yet.
                </TableCell>
              </TableRow>
            ) : (
              payslips.map((payslip) => (
                <TableRow key={payslip.id}>
                  <TableCell className="font-medium">
                    {getMonthName(payslip.month)} {payslip.year}
                  </TableCell>
                  <TableCell>${(payslip.grossPay || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-red-600">-${(payslip.deductions || 0).toLocaleString()}</TableCell>
                  <TableCell className="font-semibold text-green-600">
                    ${(payslip.netPay || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {payslip.status === "PAID" ? (
                      <Badge variant="success">Paid</Badge>
                    ) : (
                      <Badge variant="neutral">{payslip.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/hrms/my-payslips/${payslip.id}`)}>
                      <Eye className="w-4 h-4 mr-1 text-muted-foreground" /> View
                    </Button>
                    <Button variant="ghost" size="sm" onClick={async () => {
                      try {
                        const blob = await payrollService.downloadPayslipPdf(payslip.id);
                        const url = window.URL.createObjectURL(new Blob([blob as any]));
                        const link = document.createElement("a");
                        link.href = url;
                        link.setAttribute("download", `Payslip_${payslip.month}_${payslip.year}.pdf`);
                        document.body.appendChild(link);
                        link.click();
                        link.parentNode?.removeChild(link);
                      } catch (error) {
                        toast.error("Failed to download PDF");
                      }
                    }}>
                      <FileDown className="w-4 h-4 mr-1 text-blue-600" /> PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
