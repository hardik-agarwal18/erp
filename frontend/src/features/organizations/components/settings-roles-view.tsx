"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function SettingsRolesView() {
  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Roles & Permissions"
        description="Manage custom RBAC roles and control fine-grained access."
        actions={
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        }
      />
      
      <Card>
        <CardContent className="p-4">
          <EmptyState
            title="Custom Roles Not Enabled"
            description="Upgrade to the Enterprise plan to create custom roles and assign granular permissions."
            actionLabel="View Upgrade Options"
          />
        </CardContent>
      </Card>
    </div>
  );
}
