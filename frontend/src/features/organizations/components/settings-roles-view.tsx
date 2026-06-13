"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Shield, ShieldCheck, Settings, Trash2, Edit2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { roleService, Role, Permission } from "@/services/role.service";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function SettingsRolesView() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const { data: rolesResponse, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => roleService.listRoles(),
  });

  const { data: permissionsResponse, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => roleService.listPermissions(),
  });

  const roles = rolesResponse?.data || [];
  const allPermissions = permissionsResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: roleService.createRole,
    onSuccess: () => {
      toast.success("Role created successfully");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setIsModalOpen(false);
    },
    onError: () => toast.error("Failed to create role")
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string, name: string, description: string, permissionIds: string[] }) => 
      roleService.updateRole(data.id, { name: data.name, description: data.description, permissionIds: data.permissionIds }),
    onSuccess: () => {
      toast.success("Role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setIsModalOpen(false);
    },
    onError: () => toast.error("Failed to update role")
  });

  const deleteMutation = useMutation({
    mutationFn: roleService.deleteRole,
    onSuccess: () => {
      toast.success("Role deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: () => toast.error("Failed to delete role")
  });

  const openCreateModal = () => {
    setEditingRole(null);
    setName("");
    setDescription("");
    setSelectedPermissions([]);
    setIsModalOpen(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description || "");
    setSelectedPermissions(role.permissions?.map(p => p.permission.id) || []);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Role name is required");
      return;
    }

    if (editingRole) {
      updateMutation.mutate({ 
        id: editingRole.id, 
        name, 
        description, 
        permissionIds: selectedPermissions 
      });
    } else {
      createMutation.mutate({ 
        name, 
        description, 
        permissionIds: selectedPermissions 
      });
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId) 
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  // Group permissions by prefix (e.g. "users:read" -> "users")
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    const prefix = perm.name.split(':')[0] || 'other';
    if (!acc[prefix]) acc[prefix] = [];
    acc[prefix].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Roles & Permissions"
        description="Manage custom RBAC roles and control fine-grained access."
        actions={
          <Button size="sm" onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoadingRoles ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))
        ) : (
          roles.map((role) => (
            <Card key={role.id} className="flex flex-col relative overflow-hidden">
              {role.isSystem && (
                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                  <div className="absolute top-3 -right-6 bg-slate-200 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-500 transform rotate-45 px-8 py-1">
                    System
                  </div>
                </div>
              )}
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${role.isSystem ? 'bg-slate-100 text-slate-600 dark:bg-slate-800' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'}`}>
                    {role.isSystem ? <ShieldCheck className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                  </div>
                  <CardTitle className="text-xl">{role.name}</CardTitle>
                </div>
                <CardDescription className="line-clamp-2 h-10">
                  {role.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="mb-6">
                  <Badge variant="neutral" className="mb-2 font-normal">
                    {role.permissions?.length || 0} permissions
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    size="sm"
                    onClick={() => openEditModal(role)}
                    disabled={role.isSystem}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  {!role.isSystem && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this role?")) {
                          deleteMutation.mutate(role.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Create Custom Role"}</DialogTitle>
            <DialogDescription>
              {editingRole ? "Update this role's details and permissions." : "Define a new role and select its permissions."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4 custom-scrollbar">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name <span className="text-red-500">*</span></Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Inventory Manager"
                  disabled={editingRole?.isSystem}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what this role is for..."
                  disabled={editingRole?.isSystem}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Permissions</Label>
                <Badge variant="neutral">{selectedPermissions.length} selected</Badge>
              </div>
              
              {isLoadingPermissions ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([prefix, perms]) => (
                    <div key={prefix} className="border rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/20">
                      <h4 className="font-medium capitalize text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-slate-500" />
                        {prefix} module
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {perms.map(perm => (
                          <label 
                            key={perm.id} 
                            className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                              selectedPermissions.includes(perm.id) 
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                                : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
                            }`}
                          >
                            <div className="flex items-center h-5">
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                checked={selectedPermissions.includes(perm.id)}
                                onChange={() => togglePermission(perm.id)}
                                disabled={editingRole?.isSystem}
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {perm.name.split(':').slice(1).join(' ').replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                {perm.description || perm.name}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="pt-4 border-t mt-auto">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            {!editingRole?.isSystem && (
              <Button 
                onClick={handleSave} 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Role"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
