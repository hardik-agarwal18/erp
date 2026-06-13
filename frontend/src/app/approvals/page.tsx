"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { approvalService } from "@/services/approval.service";
import { ApprovalInstance } from "@/types/app";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Check, X, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalInstance | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    setIsLoading(true);
    try {
      const { data } = await approvalService.getPendingApprovals();
      setApprovals(data || []);
    } catch (error) {
      console.error("Failed to fetch approvals", error);
      toast.error("Failed to fetch pending approvals");
    } finally {
      setIsLoading(false);
    }
  };

  const openActionModal = (approval: ApprovalInstance, action: "approve" | "reject") => {
    setSelectedApproval(approval);
    setActionType(action);
    setActionNotes("");
    setIsActionModalOpen(true);
  };

  const openDetailsModal = (approval: ApprovalInstance) => {
    setSelectedApproval(approval);
    setIsDetailsModalOpen(true);
  };

  const handleAction = async () => {
    if (!selectedApproval || !actionType) return;
    try {
      if (actionType === "approve") {
        await approvalService.approve(selectedApproval.id, actionNotes);
        toast.success("Approved successfully");
      } else {
        await approvalService.reject(selectedApproval.id, actionNotes);
        toast.success("Rejected successfully");
      }
      setIsActionModalOpen(false);
      fetchApprovals();
    } catch (error) {
      toast.error(`Failed to ${actionType} request`);
    }
  };

  const formatEntityType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader 
        title="Approval Inbox" 
        description="Review and action pending requests assigned to you."
      />

      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center">
          <p className="text-muted-foreground">Loading approvals...</p>
        </div>
      ) : approvals.length === 0 ? (
        <div className="flex flex-col h-[400px] items-center justify-center border rounded-lg border-dashed bg-muted/20">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium">All caught up!</h3>
          <p className="text-muted-foreground mt-1 text-center max-w-sm">
            You have no pending approval requests at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {approvals.map((approval) => (
            <Card key={approval.id} className="flex flex-col">
              <CardHeader className="pb-3 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{formatEntityType(approval.entityType)} Request</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      ID: {approval.entityId.substring(0, 8)}...
                    </p>
                  </div>
                  <Badge variant="neutral" className="flex items-center gap-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                    <Clock className="w-3 h-3" />
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-1">
                <div className="space-y-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Requested By</span>
                    <span className="text-sm font-medium">{(approval as any).requester?.name || "System"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Date Submitted</span>
                    <span className="text-sm font-medium">{format(new Date(approval.createdAt), "MMM d, yyyy h:mm a")}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Current Step</span>
                    <span className="text-sm font-medium">Step {approval.currentStepIndex + 1}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col pt-0 gap-3 border-t mt-4 pt-4">
                <div className="flex items-center w-full gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                    onClick={() => openActionModal(approval, "reject")}
                  >
                    <X className="w-4 h-4 mr-1" /> Reject
                  </Button>
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => openActionModal(approval, "approve")}
                  >
                    <Check className="w-4 h-4 mr-1" /> Approve
                  </Button>
                </div>
                <Button variant="ghost" className="w-full text-xs" size="sm" onClick={() => openDetailsModal(approval)}>
                  <FileText className="w-3 h-3 mr-1" /> View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Request" : "Reject Request"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" 
                ? "You are about to approve this request. This action cannot be undone."
                : "You are about to reject this request. This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea 
                id="notes" 
                placeholder="Add any comments or reasoning here..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={handleAction}
              className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {actionType === "approve" ? "Confirm Approval" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              Information about this {selectedApproval ? formatEntityType(selectedApproval.entityType) : ""} request.
            </DialogDescription>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Entity Type</span>
                  <span className="font-medium">{formatEntityType(selectedApproval.entityType)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Entity ID</span>
                  <span className="font-medium font-mono text-xs mt-1 bg-muted p-1 rounded">{selectedApproval.entityId}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="font-medium">{selectedApproval.status}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Submitted At</span>
                  <span className="font-medium">{format(new Date(selectedApproval.createdAt), "PPp")}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
