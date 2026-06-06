"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrganizationMutations } from "../hooks/use-organizations";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/use-workspace";

interface DeleteOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteOrganizationDialog({ open, onOpenChange }: DeleteOrganizationDialogProps) {
  const { deleteOrganization } = useOrganizationMutations();
  const { workspace } = useWorkspace();
  const { toast } = useToast();
  const router = useRouter();
  
  const [confirmation, setConfirmation] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const isMatch = confirmation === workspace.name;

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isMatch) return;

    try {
      setServerError(null);
      await deleteOrganization.mutateAsync();
      
      toast({
        title: "Organization deleted",
        description: `Successfully deleted ${workspace.name}.`,
        variant: "success",
      });
      
      onOpenChange(false);
      setConfirmation("");
      
      router.push("/dashboard");
    } catch (error: unknown) {
      let msg = "Failed to delete organization.";
      if (isAxiosError(error) && error.response?.data?.message) {
        msg = error.response.data.message;
      } else if (error instanceof Error) {
        msg = error.message;
      }
      setServerError(msg);
      toast({
        title: "Deletion failed",
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
      }
      onOpenChange(val);
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Organization</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to permanently delete <strong className="text-foreground">{workspace.name}</strong>.
            All data will be unrecoverable, and member access will be immediately revoked.
            This action is irreversible.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="deleteConfirmation">
              Please type <strong>{workspace.name}</strong> to confirm
            </Label>
            <Input
              id="deleteConfirmation"
              placeholder={workspace.name}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              disabled={deleteOrganization.isPending}
            />
          </div>

          {serverError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-800">
              {serverError}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteOrganization.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={deleteOrganization.isPending || !isMatch}
            className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-600 text-white"
          >
            {deleteOrganization.isPending ? "Deleting..." : "Delete Organization"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
