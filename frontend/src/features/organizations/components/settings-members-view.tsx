"use client";

import { useState } from "react";
import { Plus, Settings, UserMinus, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMembers, useOrganizationMutations } from "../hooks/use-organizations";
import { ModuleError } from "@/components/states/module-error";
import { PageLoader } from "@/components/states/page-loader";

export function SettingsMembersView() {
  const { data: members, isError, isLoading, refetch } = useMembers();
  const { removeMember } = useOrganizationMutations();

  if (isLoading) return <PageLoader label="Loading members..." />;
  if (isError || !members) return <ModuleError title="Could not load members" message="Please try again." retry={() => refetch()} />;

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Team Members"
        description="Manage organization access and assign roles to users."
        actions={
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>User</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Role</TableHeaderCell>
                <TableHeaderCell>Joined</TableHeaderCell>
                <TableHeaderCell className="w-[100px] text-right">Actions</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium text-slate-900">{member.name}</TableCell>
                  <TableCell className="text-slate-500">{member.email}</TableCell>
                  <TableCell>
                    <Badge variant={member.role === "owner" ? "info" : "neutral"} className="capitalize">
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{member.joinedAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" title="Change Role">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Remove Member" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => {
                        if (confirm(`Remove ${member.name}?`)) removeMember.mutate(member.userId);
                      }}>
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-orange-800">
            <ShieldAlert className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold">Transfer Ownership</p>
              <p className="text-xs opacity-80">Make another member the owner of this organization.</p>
            </div>
          </div>
          <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-100">
            Transfer Ownership
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
