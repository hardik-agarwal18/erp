import { Badge } from "@/components/ui/badge";
import type { InvoiceStatus } from "@/types/app";

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const variant =
    status === "paid" ? "success" : status === "overdue" ? "danger" : status === "partial" ? "warning" : status === "draft" ? "neutral" : "info";

  return <Badge variant={variant}>{status}</Badge>;
}
