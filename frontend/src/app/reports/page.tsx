import { AppShell } from "@/components/layout/app-shell";
import { ReportsView } from "@/features/reports/components/reports-view";

export default function ReportsPage() {
  return (
    <AppShell activePath="/reports">
      <ReportsView />
    </AppShell>
  );
}
