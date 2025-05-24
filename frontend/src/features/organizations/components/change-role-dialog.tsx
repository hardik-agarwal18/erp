"use client";

import { useState, useEffect } from "react";
import { isAxiosError } from "axios";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useOrganizationMutations } from "../hooks/use-organizations";
import { useToast } from "@/hooks/use-toast";

interface ChangeRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    userId: string;
    name: string;
    role: string;
  } | null;
}

export function ChangeRoleDialog({ open, onOpenChange, member }: ChangeRoleDialogProps) {
  const { updateMemberRole } = useOrganizationMutations();
  const { toast } = useToast();
  
  const [newRole, setNewRole] = useState<string>(member?.role || "member");
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (open && member) {
      setNewRole(member.role);
    }
  }, [open, member]);

  const isSameRole = member?.role === newRole;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || isSameRole) return;

    try {
      setServerError(null);
      await updateMemberRole.mutateAsync({
        memberId: member.userId,
        roleId: newRole,
      });
      toast({
        title: "Role updated",
        description: `Successfully updated role for ${member.name}.`,
        variant: "success",
      });
      onOpenChange(false);
    } catch (error: unknown) {
      let msg = "Failed to update role.";
      if (isAxiosError(error) && error.response?.data?.message) {
        msg = error.response.data.message;
      } else if (error instanceof Error) {
        msg = error.message;
      }
      setServerError(msg);
      toast({
        title: "Update failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val && member) setNewRole(member.role);
      onOpenChange(val);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Member Role</DialogTitle>
          <DialogDescription>
            Update the organization role and permissions for {member.name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <p className="text-sm font-medium text-slate-500">Current Role</p>
              <p className="font-semibold capitalize text-slate-900 mt-1">{member.role}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">User</p>
              <p className="font-semibold text-slate-900 mt-1">{member.name}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newRole">New Role</Label>
            <Select
              id="newRole"
              className="w-full"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              <option value="owner" disabled>Owner</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </Select>
          </div>

          {serverError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-sm text-rose-800">
              {serverError}
            </div>
          )}

          <div className="flex justify-end pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMemberRole.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateMemberRole.isPending || isSameRole}
            >
              {updateMemberRole.isPending ? "Updating..." : "Update Role"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
