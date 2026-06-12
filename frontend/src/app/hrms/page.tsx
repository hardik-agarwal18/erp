"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { getHrmsDashboard } from "@/services/hrms.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, Cake, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function HrmsDashboardPage() {
  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ["hrms", "dashboard"],
    queryFn: getHrmsDashboard,
  });

  return (
    <AppShell activePath="/hrms">
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">HRMS Dashboard</h2>
        </div>

        {error ? (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            Failed to load dashboard data. Please try again later.
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-3 w-1/3" />
                  </CardContent>
                </Card>
              ))
            : dashboard?.kpis?.map((kpi, index) => {
                const Icon = index === 0 ? Users : index === 1 ? Briefcase : UserPlus;
                return (
                  <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{kpi.value}</div>
                      <p className="text-xs text-muted-foreground">{kpi.detail}</p>
                    </CardContent>
                  </Card>
                );
              })}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" /> Recent Hires
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : dashboard?.recentHires && dashboard.recentHires.length > 0 ? (
                <div className="space-y-4">
                  {dashboard.recentHires.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{employee.firstName} {employee.lastName}</span>
                        <span className="text-xs text-muted-foreground">{employee.designation?.name || "Employee"}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(employee.joiningDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent hires found.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cake className="h-5 w-5" /> Upcoming Birthdays
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : dashboard?.upcomingBirthdays && dashboard.upcomingBirthdays.length > 0 ? (
                <div className="space-y-4">
                  {dashboard.upcomingBirthdays.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{employee.firstName} {employee.lastName}</span>
                        <span className="text-xs text-muted-foreground">{employee.department?.name || "Department"}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString(undefined, { month: 'long', day: 'numeric' }) : "N/A"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming birthdays.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
