"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { getStockGroups, createStockGroup, updateStockGroup, deleteStockGroup, StockGroup } from "@/features/inventory/service";

export default function StockGroupsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StockGroup | null>(null);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string | "">("");

  const { data: stockGroups = [], isLoading } = useQuery({
    queryKey: ["stock-groups"],
    queryFn: getStockGroups,
  });

  const createMutation = useMutation({
    mutationFn: createStockGroup,
    onSuccess: () => {
      toast.success("Stock group created successfully");
      queryClient.invalidateQueries({ queryKey: ["stock-groups"] });
      setIsModalOpen(false);
    },
    onError: () => toast.error("Failed to create stock group")
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateStockGroup(editingGroup!.id, data),
    onSuccess: () => {
      toast.success("Stock group updated successfully");
      queryClient.invalidateQueries({ queryKey: ["stock-groups"] });
      setIsModalOpen(false);
    },
    onError: () => toast.error("Failed to update stock group")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStockGroup,
    onSuccess: () => {
      toast.success("Stock group deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["stock-groups"] });
    },
    onError: () => toast.error("Failed to delete stock group")
  });

  const openCreateModal = () => {
    setEditingGroup(null);
    setName("");
    setDescription("");
    setParentId("");
    setIsModalOpen(true);
  };

  const openEditModal = (group: StockGroup) => {
    setEditingGroup(group);
    setName(group.name);
    setDescription(group.description || "");
    setParentId(group.parentId || "");
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name) {
      toast.error("Please provide a name for the stock group");
      return;
    }

    const payload = { 
      name, 
      description, 
      parentId: parentId ? parentId : null 
    };

    if (editingGroup) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this stock group?")) {
      deleteMutation.mutate(id);
    }
  };

  // Helper to find parent name
  const getParentName = (parentId: string | null) => {
    if (!parentId) return "-";
    const parent = stockGroups.find(g => g.id === parentId);
    return parent ? parent.name : "-";
  };

  return (
    <AppShell activePath="/inventory/stock-groups">
      <div className="space-y-6">
        <PageHeader
          title="Stock Groups"
          description="Organize your inventory items into logical hierarchies."
          actions={
            <Button onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              New Stock Group
            </Button>
          }
        />

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-medium border-b">
                  <tr>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Parent Group</th>
                    <th className="px-6 py-4 font-medium">Description</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-40" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                        <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                      </tr>
                    ))
                  ) : stockGroups.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        No stock groups found. Create one to organize your inventory.
                      </td>
                    </tr>
                  ) : (
                    stockGroups.map((group) => (
                      <tr key={group.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                          {group.name}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {getParentName(group.parentId)}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {group.description || "-"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="mr-2"
                            onClick={() => openEditModal(group)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => handleDelete(group.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGroup ? "Edit Stock Group" : "Create Stock Group"}</DialogTitle>
              <DialogDescription>
                {editingGroup 
                  ? "Update the details for this stock group."
                  : "Add a new stock group to organize your inventory."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name <span className="text-red-500">*</span></Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent">Parent Group</Label>
                <Select 
                  id="parent"
                  value={parentId} 
                  onChange={(e) => setParentId(e.target.value)}
                >
                  <option value="">None (Top Level)</option>
                  {stockGroups
                    .filter((g) => g.id !== editingGroup?.id) // Prevent self-referencing
                    .map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Group"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
