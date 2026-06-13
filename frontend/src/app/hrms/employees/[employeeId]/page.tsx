"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { getEmployee } from "@/services/hrms.service";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Mail, Phone, Calendar, Briefcase, Building } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function EmployeeDetailPage() {
  const params = useParams();
  const employeeId = params.employeeId as string;

  const { data: employee, isLoading, error } = useQuery({
    queryKey: ["hrms", "employee", employeeId],
    queryFn: () => getEmployee(employeeId),
    enabled: !!employeeId,
  });

  if (isLoading) {
    return (
      <AppShell activePath="/hrms/employees">
        <div className="flex-1 p-8 pt-6">
          <Skeleton className="h-10 w-1/3 mb-6" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </AppShell>
    );
  }

  if (error || !employee) {
    return (
      <AppShell activePath="/hrms/employees">
        <div className="flex-1 p-8 pt-6">
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            Failed to load employee details. Please try again later.
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activePath="/hrms/employees">
      <div className="flex-1 space-y-6 p-8 pt-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/hrms/employees">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                {employee.firstName} {employee.lastName}
              </h2>
              <p className="text-muted-foreground">
                {employee.employeeCode || "No Employee Code"}
              </p>
            </div>
            <Badge variant={employee.status === "ACTIVE" ? "success" : "neutral"} className="ml-4">
              {employee.status}
            </Badge>
          </div>
          <div className="flex space-x-2">
            <Link href={`/hrms/employees/${employee.id}/edit`}>
              <Button variant="outline">Edit Profile</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Official Email</span>
                  <span className="text-sm text-muted-foreground">{employee.officialEmail || "N/A"}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Personal Email</span>
                  <span className="text-sm text-muted-foreground">{employee.personalEmail || "N/A"}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Phone</span>
                  <span className="text-sm text-muted-foreground">{employee.phone || "N/A"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Department</span>
                  <span className="text-sm text-muted-foreground">{employee.department?.name || "N/A"}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Designation</span>
                  <span className="text-sm text-muted-foreground">{employee.designation?.name || "N/A"}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Joining Date</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(employee.joiningDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Employment Type</span>
                  <span className="text-sm text-muted-foreground">{employee.employmentType}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
