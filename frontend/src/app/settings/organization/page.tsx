import { AppShell } from "@/components/layout/app-shell";
import { SettingsOrganizationView } from "@/features/organizations/components/settings-organization-view";

export default function SettingsOrganizationPage() {
  return (
    <AppShell activePath="/settings/organization">
      <SettingsOrganizationView />
    </AppShell>
  );
}
