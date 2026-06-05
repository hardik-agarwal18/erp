import { AppShell } from "@/components/layout/app-shell";
import { InventoryAuditView } from "@/features/inventory/components/inventory-audit-view";

export default function InventoryAuditPage() {
  return (
    <AppShell activePath="/inventory">
      <InventoryAuditView />
    </AppShell>
  );
}
