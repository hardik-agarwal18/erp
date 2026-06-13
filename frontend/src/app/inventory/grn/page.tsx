"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { grnService } from "@/services/grn.service";
import { GRN } from "@/types/app";
import { Button } from "@/components/ui/button";
import { Plus, Check, X, FileText, CheckCircle2, Box } from "lucide-react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function GRNPage() {
  const [grns, setGrns] = useState<GRN[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [selectedGrn, setSelectedGrn] = useState<GRN | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await grnService.list();
      setGrns(res.data || []);
    } catch (error) {
      console.error("Failed to fetch GRNs", error);
      // Fallback for development if not seeded
      setGrns([
        { id: "1", organizationId: "org_1", grnNumber: "GRN-2023-001", poNumber: "PO-1042", date: new Date().toISOString(), status: "DRAFT", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "2", organizationId: "org_1", grnNumber: "GRN-2023-002", poNumber: "PO-1043", date: new Date().toISOString(), status: "PARTIAL", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcess = (grn: GRN) => {
    setSelectedGrn(grn);
    setIsProcessModalOpen(true);
  };

  const handleAction = async (action: "FULL" | "PARTIAL" | "REJECT") => {
    if (!selectedGrn) return;
    try {
      await grnService.receive(selectedGrn.id, action);
      toast.success(`GRN processed: ${action}`);
      setIsProcessModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(`Failed to process GRN`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="neutral">Draft</Badge>;
      case "PARTIAL":
        return <Badge variant="warning">Partial</Badge>;
      case "RECEIVED":
        return <Badge variant="success">Received</Badge>;
      case "REJECTED":
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Goods Receipt Notes (GRN)" 
          description="Manage inbound inventory, receive goods against Purchase Orders."
        />
        <Button>
          <Plus className="w-4 h-4 mr-2" /> New GRN
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <div className="border p-4 rounded-xl flex items-center gap-4 bg-muted/10">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-full">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">PO Pending Receipt</p>
            <h3 className="text-2xl font-bold">12</h3>
          </div>
        </div>
        <div className="border p-4 rounded-xl flex items-center gap-4 bg-muted/10">
          <div className="p-3 bg-yellow-100 text-yellow-700 rounded-full">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Draft GRNs</p>
            <h3 className="text-2xl font-bold">{grns.filter(g => g.status === "DRAFT").length}</h3>
          </div>
        </div>
        <div className="border p-4 rounded-xl flex items-center gap-4 bg-muted/10">
          <div className="p-3 bg-green-100 text-green-700 rounded-full">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Received Today</p>
            <h3 className="text-2xl font-bold">5</h3>
          </div>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>GRN Number</TableHead>
              <TableHead>Reference PO</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : grns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No GRNs found.
                </TableCell>
              </TableRow>
            ) : (
              grns.map((grn) => (
                <TableRow key={grn.id}>
                  <TableCell className="font-medium">{grn.grnNumber}</TableCell>
                  <TableCell>{grn.poNumber || "-"}</TableCell>
                  <TableCell>{new Date(grn.date).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(grn.status)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {["DRAFT", "PARTIAL"].includes(grn.status) && (
                      <Button variant="outline" size="sm" onClick={() => handleProcess(grn)}>
                        Process Workflow
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isProcessModalOpen} onOpenChange={setIsProcessModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Process GRN: {selectedGrn?.grnNumber}</DialogTitle>
            <DialogDescription>
              Select an action to update inventory based on the received goods.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="p-4 border rounded-lg bg-green-50 flex items-start gap-4 cursor-pointer hover:border-green-400" onClick={() => handleAction("FULL")}>
              <CheckCircle2 className="w-6 h-6 text-green-600 mt-1" />
              <div>
                <h4 className="font-semibold text-green-900">Receive Full</h4>
                <p className="text-sm text-green-700">All items are in good condition. Accept entire shipment and update inventory.</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-yellow-50 flex items-start gap-4 cursor-pointer hover:border-yellow-400" onClick={() => handleAction("PARTIAL")}>
              <Box className="w-6 h-6 text-yellow-600 mt-1" />
              <div>
                <h4 className="font-semibold text-yellow-900">Receive Partial</h4>
                <p className="text-sm text-yellow-700">Some items are missing or damaged. Proceed to enter quantities line by line.</p>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-red-50 flex items-start gap-4 cursor-pointer hover:border-red-400" onClick={() => handleAction("REJECT")}>
              <X className="w-6 h-6 text-red-600 mt-1" />
              <div>
                <h4 className="font-semibold text-red-900">Reject Entire Shipment</h4>
                <p className="text-sm text-red-700">Shipment is completely incorrect or damaged. Do not update inventory.</p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProcessModalOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
