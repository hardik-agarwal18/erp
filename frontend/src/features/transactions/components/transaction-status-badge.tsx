import { Badge } from "@/components/ui/badge";
import type { TransactionStatus } from "@/types/app";

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  const variant = status === "matched" ? "success" : status === "pending" ? "warning" : status === "exception" ? "danger" : "info";

  return <Badge variant={variant}>{status}</Badge>;
}
