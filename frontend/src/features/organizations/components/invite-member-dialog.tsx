"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { isAxiosError } from "axios";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useOrganizationMutations } from "../hooks/use-organizations";
import { useToast } from "@/hooks/use-toast";
import { inviteMemberSchema } from "../schema";

type InviteMemberForm = z.infer<typeof inviteMemberSchema>;

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({ open, onOpenChange }: InviteMemberDialogProps) {
  const { inviteMember } = useOrganizationMutations();
  const { toast } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteMemberForm>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: "",
      roleName: "member",
    },
  });

  const onSubmit = async (data: InviteMemberForm) => {
    try {
      setServerError(null);
      await inviteMember.mutateAsync(data);
      toast({
        title: "Invitation sent",
        description: `Successfully sent invitation to ${data.email}.`,
        variant: "success",
      });
      reset();
      onOpenChange(false);
    } catch (error: unknown) {
      let msg = "Failed to invite member.";
      if (isAxiosError(error) && error.response?.data?.message) {
        msg = error.response.data.message;
      } else if (error instanceof Error) {
        msg = error.message;
      }
      setServerError(msg);
      toast({
        title: "Invitation failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) reset();
      onOpenChange(val);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Invite a new member to your organization and assign their role.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-rose-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="roleName">Role</Label>
            <Select
              id="roleName"
              className="w-full"
              {...register("roleName")}
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </Select>
            {errors.roleName && (
              <p className="text-sm text-rose-600">{errors.roleName.message}</p>
            )}
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Inviting..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
