import { Badge } from "@/components/ui/badge";
import type { PurchaseStatus } from "@/types/app";

export function PurchaseStatusBadge({ status }: { status: PurchaseStatus }) {
  const variant =
    status === "approved" || status === "received"
      ? "success"
      : status === "pending_approval"
        ? "warning"
        : status === "billed"
          ? "info"
          : "neutral";

  return <Badge variant={variant}>{status.replace("_", " ")}</Badge>;
}
