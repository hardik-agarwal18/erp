"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useWorkspace } from "@/hooks/use-workspace";
import { Button } from "@/components/ui/button";

export function SettingsOrganizationView() {
  const { workspace } = useWorkspace();

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Organization Details"
        description="Manage your business profile and workspace settings."
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Profile Info</CardTitle>
          <CardDescription>Update your company name and basic information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Company Name</label>
            <div className="h-10 px-3 py-2 border rounded-md bg-slate-50 text-sm text-slate-900 border-slate-200">
              {workspace.companyName || workspace.name}
            </div>
            <p className="text-xs text-slate-500">Contact support to change your legal entity name.</p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-slate-700">Base Currency</label>
            <div className="h-10 px-3 py-2 border rounded-md bg-slate-50 text-sm text-slate-900 border-slate-200">
              {workspace.currency}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-rose-200 bg-rose-50/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-rose-800">Delete Organization</p>
            <p className="text-xs text-rose-600/80">Permanently remove this workspace and all its data.</p>
          </div>
          <Button variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-100">
            Delete Workspace
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
