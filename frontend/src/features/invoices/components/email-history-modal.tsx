"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { getInvoiceEmailHistory } from "../service";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export function EmailHistoryModal({
  isOpen,
  onClose,
  invoiceId,
}: {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["invoice-email-history", invoiceId],
    queryFn: () => getInvoiceEmailHistory(invoiceId),
    enabled: isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Email History</DialogTitle>
          <DialogDescription>
            History of emails sent for this invoice.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No emails sent yet.</p>
          ) : (
            <div className="space-y-3">
              {data?.map((log) => (
                <div key={log.id} className="rounded-lg border p-3">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium">{log.recipient}</p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                        ${log.status === "SENT" ? "bg-green-100 text-green-800" :
                          log.status === "FAILED" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"}
                      `}
                    >
                      {log.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sent: {log.sentAt ? format(new Date(log.sentAt), "PPP p") : "Pending"}
                  </p>
                  {log.error && (
                    <p className="text-xs text-red-500 mt-1">{log.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
