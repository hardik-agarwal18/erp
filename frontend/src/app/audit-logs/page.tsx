import { AppShell } from "@/components/layout/app-shell";
import { AuditLogsView } from "@/features/audit-logs/components/audit-logs-view";

export default function AuditLogsPage() {
  return (
    <AppShell activePath="/audit-logs">
      <AuditLogsView />
    </AppShell>
  );
}
