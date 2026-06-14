"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { getEmployee, updateEmployee } from "@/services/hrms.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { EmployeeStatus, EmploymentType } from "@/types/app";

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.employeeId as string;

  const { data: employee, isLoading, error } = useQuery({
    queryKey: ["hrms", "employee", employeeId],
    queryFn: () => getEmployee(employeeId),
    enabled: !!employeeId,
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    officialEmail: "",
    personalEmail: "",
    phone: "",
    joiningDate: "",
    employmentType: "FULL_TIME" as EmploymentType,
    status: "ACTIVE" as EmployeeStatus,
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        officialEmail: employee.officialEmail || "",
        personalEmail: employee.personalEmail || "",
        phone: employee.phone || "",
        joiningDate: employee.joiningDate ? new Date(employee.joiningDate).toISOString().split("T")[0] : "",
        employmentType: employee.employmentType || "FULL_TIME",
        status: employee.status || "ACTIVE",
      });
    }
  }, [employee]);

  const mutation = useMutation({
    mutationFn: (data: typeof formData) => updateEmployee(employeeId, data),
    onSuccess: () => {
      toast.success("Employee updated successfully");
      router.push(`/hrms/employees/${employeeId}`);
    },
    onError: (error) => {
      toast.error("Failed to update employee");
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return (
      <AppShell activePath="/hrms/employees">
        <div className="flex-1 p-8 pt-6">Loading...</div>
      </AppShell>
    );
  }

  if (error || !employee) {
    return (
      <AppShell activePath="/hrms/employees">
        <div className="flex-1 p-8 pt-6">Failed to load employee</div>
      </AppShell>
    );
  }

  return (
    <AppShell activePath="/hrms/employees">
      <div className="flex-1 space-y-6 p-8 pt-6 max-w-4xl mx-auto">
        <div className="flex items-center space-x-4">
          <Link href={`/hrms/employees/${employeeId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Edit Employee</h2>
            <p className="text-muted-foreground">Update employee profile.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic details about the employee.</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="edit-employee-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="officialEmail">Official Email</Label>
                  <Input
                    id="officialEmail"
                    name="officialEmail"
                    type="email"
                    value={formData.officialEmail}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="personalEmail">Personal Email</Label>
                  <Input
                    id="personalEmail"
                    name="personalEmail"
                    type="email"
                    value={formData.personalEmail}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joiningDate">Joining Date *</Label>
                  <Input
                    id="joiningDate"
                    name="joiningDate"
                    type="date"
                    required
                    value={formData.joiningDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employmentType">Employment Type *</Label>
                  <Select
                    value={formData.employmentType}
                    onChange={(e) => handleSelectChange("employmentType", e.target.value)}
                  >
                    <option value="" disabled>Select type</option>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERN">Intern</option>
                    <option value="FREELANCE">Freelance</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleSelectChange("status", e.target.value)}
                  >
                    <option value="" disabled>Select status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="PROBATION">Probation</option>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Link href={`/hrms/employees/${employeeId}`}>
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
