"use client";

import { useMemo, useState } from "react";
import { Plus, Settings, UserMinus, ShieldAlert, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { useMembers } from "../hooks/use-organizations";
import { ColumnDef } from "@tanstack/react-table";
import { useWorkspace } from "@/hooks/use-workspace";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { usePermissions } from "@/hooks/use-permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { InviteMemberDialog } from "./invite-member-dialog";
import { ChangeRoleDialog } from "./change-role-dialog";
import { RemoveMemberDialog } from "./remove-member-dialog";
import { TransferOwnershipDialog } from "./transfer-ownership-dialog";
import { JoinRequestsView } from "./join-requests-view";

export type Member = {
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
};

export function SettingsMembersView() {
  const { data: members, isError, isLoading } = useMembers();
  const { hasRole, session } = useWorkspace();
  const { hasPermission } = usePermissions();
  
  const [inviteOpen, setInviteOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedRoleMember, setSelectedRoleMember] = useState<Member | null>(null);
  const [selectedRemoveMember, setSelectedRemoveMember] = useState<Member | null>(null);

  const columns = useMemo<ColumnDef<Member>[]>(
    () => [
      {
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => <div className="font-medium text-foreground">{row.getValue("name")}</div>,
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("email")}</div>,
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const role = row.getValue("role") as string;
          return (
            <Badge variant={role === "owner" ? "info" : "neutral"} className="capitalize">
              {role}
            </Badge>
          );
        },
      },
      {
        accessorKey: "joinedAt",
        header: "Joined",
        cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("joinedAt")}</div>,
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const member = row.original;
          const isSelf = member.userId === session?.id;
          const isOwner = member.role === "owner";

          if (isOwner || isSelf) return null;

          return (
            <div className="flex justify-end gap-2">
              <PermissionGuard permission="member.update">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  title="Change Role"
                  onClick={() => setSelectedRoleMember(member)}
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PermissionGuard>
              <PermissionGuard permission="member.remove">
                <Button
                  size="icon"
                  variant="ghost"
                  title="Remove Member"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setSelectedRemoveMember(member)}
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              </PermissionGuard>
            </div>
          );
        },
      },
    ],
    [session?.id]
  );

  const fallbackUI = (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg bg-slate-50 dark:bg-slate-900/50">
      <AlertCircle className="h-8 w-8 text-muted-foreground mb-4" />
      <h3 className="font-semibold text-lg text-foreground">Access Denied</h3>
      <p className="text-muted-foreground">You do not have permission to view members.</p>
    </div>
  );

  return (
    <PermissionGuard permission="member.view" fallback={fallbackUI}>
      <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Team Members"
        description="Manage organization access and assign roles to users."
        actions={
          <PermissionGuard permission="member.invite">
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </PermissionGuard>
        }
      />

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="members">Active Members</TabsTrigger>
          {(hasRole("owner") || hasRole("admin")) && (
            <TabsTrigger value="requests">Join Requests</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          <DataTable
            columns={columns}
        data={members || []}
        density="comfortable"
        isLoading={isLoading}
        isError={isError}
        emptyMessage="No members found in this organization."
      />

      {hasRole("owner") && (
        <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-900/50 dark:bg-orange-950/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-orange-800 dark:text-orange-300">
              <ShieldAlert className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">Transfer Ownership</p>
                <p className="text-xs opacity-80">Make another member the owner of this organization.</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="border-orange-200 text-orange-700 hover:bg-orange-100 dark:border-orange-900/50 dark:text-orange-300 dark:hover:bg-orange-900/50"
              onClick={() => setTransferOpen(true)}
            >
              Transfer Ownership
            </Button>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        {(hasRole("owner") || hasRole("admin")) && (
          <TabsContent value="requests">
            <JoinRequestsView />
          </TabsContent>
        )}
      </Tabs>

      {/* Dialogs */}
      <PermissionGuard permission="member.invite">
        <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      </PermissionGuard>
      <PermissionGuard permission="member.update">
        <ChangeRoleDialog 
          open={!!selectedRoleMember} 
          onOpenChange={(val) => !val && setSelectedRoleMember(null)}
          member={selectedRoleMember}
        />
      </PermissionGuard>
      <PermissionGuard permission="member.remove">
        <RemoveMemberDialog 
          open={!!selectedRemoveMember} 
          onOpenChange={(val) => !val && setSelectedRemoveMember(null)}
          member={selectedRemoveMember}
        />
      </PermissionGuard>

      {hasRole("owner") && (
        <TransferOwnershipDialog open={transferOpen} onOpenChange={setTransferOpen} />
      )}
    </div>
    </PermissionGuard>
  );
}
