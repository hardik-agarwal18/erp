import { SettingsActivityView } from "@/features/organizations/components/settings-activity-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity History | Settings",
  description: "View organization activity history and audit logs.",
};

export default function SettingsActivityPage() {
  return (
    <div className="flex-1 space-y-4">
      <SettingsActivityView />
    </div>
  );
}
