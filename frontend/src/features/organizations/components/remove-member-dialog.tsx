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
import { useOrganizationMutations } from "../hooks/use-organizations";
import { useToast } from "@/hooks/use-toast";

interface RemoveMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    userId: string;
    name: string;
    email: string;
  } | null;
}

export function RemoveMemberDialog({ open, onOpenChange, member }: RemoveMemberDialogProps) {
  const { removeMember } = useOrganizationMutations();
  const { toast } = useToast();
  
  const [serverError, setServerError] = useState<string | null>(null);

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!member) return;

    try {
      setServerError(null);
      await removeMember.mutateAsync(member.userId);
      toast({
        title: "Member removed",
        description: `Successfully removed ${member.name} from the organization.`,
        variant: "success",
      });
      onOpenChange(false);
    } catch (error: unknown) {
      let msg = "Failed to remove member.";
      if (isAxiosError(error) && error.response?.data?.message) {
        msg = error.response.data.message;
      } else if (error instanceof Error) {
        msg = error.message;
      }
      setServerError(msg);
      toast({
        title: "Removal failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  if (!member) return null;

  return (
    <AlertDialog open={open} onOpenChange={(val) => {
      if (!val) setServerError(null);
      onOpenChange(val);
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove <strong>{member.name}</strong> ({member.email}) from this organization?
            They will immediately lose access to all workspace data, reports, and settings.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {serverError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-800">
            {serverError}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={removeMember.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={removeMember.isPending}
            className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-600 text-white"
          >
            {removeMember.isPending ? "Removing..." : "Remove Member"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
