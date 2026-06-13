"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { departmentService } from "@/services/department.service";
import { getEmployees } from "@/services/hrms.service";
import { Department, Employee } from "@/types/app";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Department>>({
    name: "",
    code: "",
    description: "",
    isActive: true,
    headEmployeeId: "",
    budgetLimit: undefined,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [deptRes, empRes] = await Promise.all([
        departmentService.list(),
        getEmployees({ limit: 100 }),
      ]);
      setDepartments(deptRes.data || []);
      // Assuming paginated response for employees
      setEmployees(empRes.items || []);
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("Failed to fetch departments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (department?: Department) => {
    if (department) {
      setEditingId(department.id);
      setFormData({
        name: department.name,
        code: department.code || "",
        description: department.description || "",
        isActive: department.isActive,
        headEmployeeId: department.headEmployeeId || "",
        budgetLimit: department.budgetLimit,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        code: "",
        description: "",
        isActive: true,
        headEmployeeId: "",
        budgetLimit: undefined,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await departmentService.update(editingId, formData);
        toast.success("Department updated successfully");
      } else {
        await departmentService.create(formData);
        toast.success("Department created successfully");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(editingId ? "Failed to update department" : "Failed to create department");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      await departmentService.delete(id);
      toast.success("Department deleted successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete department");
    }
  };

  const getHeadName = (id?: string) => {
    if (!id) return "None";
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : "Unknown";
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Departments" 
          description="Manage organizational departments, budgets, and department heads."
        />
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" /> Add Department
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department Head</TableHead>
              <TableHead>Budget Limit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  Loading departments...
                </TableCell>
              </TableRow>
            ) : departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No departments found.
                </TableCell>
              </TableRow>
            ) : (
              departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.code || "-"}</TableCell>
                  <TableCell>{dept.name}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    {getHeadName(dept.headEmployeeId)}
                  </TableCell>
                  <TableCell>
                    {dept.budgetLimit ? `$${Number(dept.budgetLimit).toLocaleString()}` : "-"}
                  </TableCell>
                  <TableCell>
                    {dept.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenModal(dept)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(dept.id)} className="text-destructive hover:text-destructive">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Department" : "New Department"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Department Name</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                placeholder="e.g. Engineering"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">Code (Optional)</Label>
              <Input 
                id="code" 
                value={formData.code} 
                onChange={e => setFormData({ ...formData, code: e.target.value })} 
                placeholder="e.g. ENG"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="head">Department Head</Label>
              <Select 
                value={formData.headEmployeeId || "none"} 
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ ...formData, headEmployeeId: val === "none" ? "" : val });
                }}
              >
                <option value="none">Select Department Head...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget">Budget Limit</Label>
              <Input 
                id="budget" 
                type="number"
                value={formData.budgetLimit || ""} 
                onChange={e => setFormData({ ...formData, budgetLimit: parseFloat(e.target.value) || undefined })} 
                placeholder="e.g. 50000"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea 
                id="desc" 
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })} 
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="active" 
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked === true })}
              />
              <Label htmlFor="active">Active Department</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
