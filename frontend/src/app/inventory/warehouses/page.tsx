import { AppShell } from "@/components/layout/app-shell";
import { WarehouseManagementView } from "@/features/inventory/components/warehouse-management-view";

export default function InventoryWarehousesPage() {
  return (
    <AppShell activePath="/inventory">
      <WarehouseManagementView />
    </AppShell>
  );
}
