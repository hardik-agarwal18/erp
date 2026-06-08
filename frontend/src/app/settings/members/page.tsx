import { AppShell } from "@/components/layout/app-shell";
import { SettingsMembersView } from "@/features/organizations/components/settings-members-view";

export default function SettingsMembersPage() {
  return (
    <AppShell activePath="/settings/members">
      <SettingsMembersView />
    </AppShell>
  );
}
