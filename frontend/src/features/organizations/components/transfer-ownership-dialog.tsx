"use client";

import { useState } from "react";
import { isAxiosError } from "axios";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useMembers, useOrganizationMutations } from "../hooks/use-organizations";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/use-workspace";

interface TransferOwnershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferOwnershipDialog({ open, onOpenChange }: TransferOwnershipDialogProps) {
  const { data: members } = useMembers();
  const { transferOwnership } = useOrganizationMutations();
  const { toast } = useToast();
  const { workspace, session } = useWorkspace();
  
  const [targetMemberId, setTargetMemberId] = useState<string>("");
  const [confirmation, setConfirmation] = useState<string>("");
  const [serverError, setServerError] = useState<string | null>(null);

  // Eligible admins: members with "admin" role who are NOT the current user
  const eligibleAdmins = members?.filter((m: { userId: string; role: string; name: string; email: string }) => m.role === "admin" && m.userId !== session?.id) || [];

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!targetMemberId || confirmation !== "TRANSFER") return;

    try {
      setServerError(null);
      await transferOwnership.mutateAsync(targetMemberId);
      toast({
        title: "Ownership transferred",
        description: "You have successfully transferred ownership of this organization.",
        variant: "success",
      });
      onOpenChange(false);
      setConfirmation("");
      setTargetMemberId("");
    } catch (error: unknown) {
      let msg = "Failed to transfer ownership.";
      if (isAxiosError(error) && error.response?.data?.message) {
        msg = error.response.data.message;
      } else if (error instanceof Error) {
        msg = error.message;
      }
      setServerError(msg);
      toast({
        title: "Transfer failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(val) => {
      if (!val) {
        setServerError(null);
        setConfirmation("");
        setTargetMemberId("");
      }
      onOpenChange(val);
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Transfer Ownership</AlertDialogTitle>
          <AlertDialogDescription>
            Transferring ownership is a permanent action. You will be demoted to an Admin role, and the selected user will gain full control over this organization, including billing and deletion rights.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="targetMember">Select New Owner (Admins Only)</Label>
            <Select
              id="targetMember"
              className="w-full"
              value={targetMemberId}
              onChange={(e) => setTargetMemberId(e.target.value)}
              disabled={eligibleAdmins.length === 0}
            >
              <option value="" disabled>Select an admin...</option>
              {eligibleAdmins.map((admin: { userId: string; role: string; name: string; email: string }) => (
                <option key={admin.userId} value={admin.userId}>
                  {admin.name} ({admin.email})
                </option>
              ))}
            </Select>
            {eligibleAdmins.length === 0 && (
              <p className="text-sm text-amber-600 mt-1">
                There are no eligible Admins in this organization. You must promote a member to Admin first.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation">Type TRANSFER to confirm</Label>
            <Input
              id="confirmation"
              placeholder="TRANSFER"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              disabled={!targetMemberId || eligibleAdmins.length === 0}
            />
          </div>

          {serverError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-800">
              {serverError}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={transferOwnership.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={transferOwnership.isPending || confirmation !== "TRANSFER" || !targetMemberId}
            className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-600 text-white"
          >
            {transferOwnership.isPending ? "Transferring..." : "Confirm Transfer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
