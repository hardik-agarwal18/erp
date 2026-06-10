"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendInvoiceEmail } from "../service";
import { Loader2, Send } from "lucide-react";

export function SendEmailModal({
  isOpen,
  onClose,
  invoiceId,
  customerEmail,
}: {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  customerEmail?: string | null;
}) {
  const [email, setEmail] = useState(customerEmail || "");
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: () => sendInvoiceEmail(invoiceId, email),
    onSuccess: () => {
      toast.success("Email sent successfully");
      queryClient.invalidateQueries({ queryKey: ["invoice-email-history", invoiceId] });
      onClose();
    },
    onError: () => {
      toast.error("Failed to send email");
    },
  });

  const handleSend = () => {
    if (!email) {
      toast.error("Please enter a valid email address");
      return;
    }
    sendMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Invoice via Email</DialogTitle>
          <DialogDescription>
            Enter the recipient's email address. A PDF copy of the invoice will be attached.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="customer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sendMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sendMutation.isPending || !email}>
            {sendMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
