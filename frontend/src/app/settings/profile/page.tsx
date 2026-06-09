import { UserCircle2 } from "lucide-react";

export const metadata = {
  title: "My Profile | ERP",
  description: "Manage your personal profile and preferences.",
};

export default function ProfileSettingsPage() {
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-6">
        <UserCircle2 className="h-10 w-10" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">My Profile</h1>
      <p className="text-slate-500 max-w-md text-center">
        This page is currently under construction. Soon, you'll be able to manage your personal details, avatar, and communication preferences here.
      </p>
    </div>
  );
}
