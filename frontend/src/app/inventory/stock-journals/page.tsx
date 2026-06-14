"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { stockJournalService } from "@/services/stock-journal.service";
import { StockJournal, StockJournalType } from "@/types/app";
import { Button } from "@/components/ui/button";
import { Plus, Check, FileText, Upload } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function StockJournalsPage() {
  const [journals, setJournals] = useState<StockJournal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState<StockJournalType>("ADJUSTMENT");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await stockJournalService.list();
      setJournals(res.data || []);
    } catch (error) {
      console.error("Failed to fetch stock journals", error);
      setJournals([
        { id: "1", organizationId: "org_1", type: "ADJUSTMENT", date: new Date().toISOString(), status: "DRAFT", notes: "End of month count", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: "2", organizationId: "org_1", type: "DAMAGE", date: new Date().toISOString(), status: "POSTED", notes: "Water damage in Warehouse A", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await stockJournalService.create({ type, notes });
      toast.success("Stock Journal created successfully");
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to create Stock Journal");
    }
  };

  const handlePost = async (id: string) => {
    if (!confirm("Are you sure you want to post this journal? This action will permanently update inventory levels.")) return;
    try {
      await stockJournalService.post(id);
      toast.success("Journal posted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to post journal");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="neutral">Draft</Badge>;
      case "POSTED":
        return <Badge variant="info">Posted</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: StockJournalType) => {
    switch (type) {
      case "ADJUSTMENT":
        return <Badge variant="neutral">Adjustment</Badge>;
      case "DAMAGE":
        return <Badge variant="danger">Damage</Badge>;
      case "LOSS":
        return <Badge variant="warning">Loss</Badge>;
      case "PRODUCTION":
        return <Badge variant="success">Production</Badge>;
      case "TRANSFER":
        return <Badge variant="info">Transfer</Badge>;
      case "OPENING_STOCK":
        return <Badge variant="neutral">Opening Stock</Badge>;
      default:
        return <Badge variant="neutral">{type}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Stock Journals" 
          description="Record manual stock adjustments, damages, and material transfers."
        />
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Journal
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  Loading journals...
                </TableCell>
              </TableRow>
            ) : journals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No stock journals found.
                </TableCell>
              </TableRow>
            ) : (
              journals.map((journal) => (
                <TableRow key={journal.id}>
                  <TableCell className="font-medium">{new Date(journal.date).toLocaleDateString()}</TableCell>
                  <TableCell>{getTypeBadge(journal.type)}</TableCell>
                  <TableCell className="truncate max-w-xs">{journal.notes || "-"}</TableCell>
                  <TableCell>{getStatusBadge(journal.status)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {journal.status === "DRAFT" && (
                      <Button variant="ghost" size="sm" onClick={() => handlePost(journal.id)}>
                        <Upload className="w-4 h-4 mr-1 text-blue-600" /> Post
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Stock Journal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Journal Type</Label>
              <Select value={type} onChange={(e) => setType(e.target.value as StockJournalType)}>
                <option value="" disabled>Select type</option>
                <option value="ADJUSTMENT">Adjustment</option>
                <option value="DAMAGE">Damage</option>
                <option value="LOSS">Loss</option>
                <option value="PRODUCTION">Production</option>
                <option value="TRANSFER">Transfer</option>
                <option value="OPENING_STOCK">Opening Stock</option>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for stock journal..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
