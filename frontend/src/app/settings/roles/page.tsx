import { AppShell } from "@/components/layout/app-shell";
import { SettingsRolesView } from "@/features/organizations/components/settings-roles-view";

export default function SettingsRolesPage() {
  return (
    <AppShell activePath="/settings/roles">
      <SettingsRolesView />
    </AppShell>
  );
}
