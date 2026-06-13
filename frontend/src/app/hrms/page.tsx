"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { getHrmsDashboard } from "@/services/hrms.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, UserPlus, Cake, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend
} from "recharts";

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6"];
const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function HrmsDashboardPage() {
  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ["hrms", "dashboard"],
    queryFn: getHrmsDashboard,
  });

  return (
    <AppShell activePath="/hrms">
      <div className="flex-1 space-y-8 p-8 pt-6 bg-slate-50/50 dark:bg-transparent min-h-screen">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">HRMS Dashboard</h2>
            <p className="text-muted-foreground mt-1">Overview of your workforce and demographics</p>
          </div>
        </div>

        {error ? (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            Failed to load dashboard data. Please try again later.
          </div>
        ) : null}

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden shadow-sm">
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
                const gradientClass = index === 0 ? "bg-gradient-to-br from-blue-500/10 to-transparent" :
                                      index === 1 ? "bg-gradient-to-br from-emerald-500/10 to-transparent" :
                                      "bg-gradient-to-br from-indigo-500/10 to-transparent";
                return (
                  <Card key={index} className={`overflow-hidden shadow-sm border-slate-200/60 dark:border-slate-800 transition-all hover:shadow-md ${gradientClass}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{kpi.label}</CardTitle>
                      <div className="p-2 bg-background rounded-full shadow-sm border border-slate-100 dark:border-slate-800">
                        <Icon className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">{kpi.value}</div>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">{kpi.detail}</p>
                    </CardContent>
                  </Card>
                );
              })}
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 md:grid-cols-7">
          <Card className="md:col-span-4 shadow-sm border-slate-200/60 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Headcount by Department</CardTitle>
              <CardDescription>Distribution of active employees across departments</CardDescription>
            </CardHeader>
            <CardContent className="pl-0">
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Skeleton className="h-[250px] w-[90%]" />
                </div>
              ) : dashboard?.headcountByDepartment && dashboard.headcountByDepartment.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboard.headcountByDepartment} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <RechartsTooltip 
                        cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={50}>
                        {dashboard.headcountByDepartment.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No department data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-3 shadow-sm border-slate-200/60 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Employment Type</CardTitle>
              <CardDescription>Breakdown of full-time vs contractors</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Skeleton className="h-[200px] w-[200px] rounded-full" />
                </div>
              ) : dashboard?.headcountByEmploymentType && dashboard.headcountByEmploymentType.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboard.headcountByEmploymentType}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="type"
                        label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {dashboard.headcountByEmploymentType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No employment type data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-sm border-slate-200/60 dark:border-slate-800">
            <CardHeader>
              <CardTitle>Gender Diversity</CardTitle>
              <CardDescription>Current workforce demographics</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <Skeleton className="h-[180px] w-[180px] rounded-full" />
                </div>
              ) : dashboard?.genderDiversity && dashboard.genderDiversity.length > 0 ? (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboard.genderDiversity}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        nameKey="gender"
                      >
                        {dashboard.genderDiversity.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No diversity data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200/60 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-500" /> Recent Hires
              </CardTitle>
              <CardDescription>Employees joined in the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : dashboard?.recentHires && dashboard.recentHires.length > 0 ? (
                <div className="space-y-4">
                  {dashboard.recentHires.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                      <div className="flex items-center gap-3">
                        {employee.profileImageUrl ? (
                          <img src={employee.profileImageUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-xs">
                            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{employee.firstName} {employee.lastName}</span>
                          <span className="text-xs text-slate-500">{employee.designation?.name || "Employee"}</span>
                        </div>
                      </div>
                      <div className="text-xs font-medium px-2 py-1 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
                        {new Date(employee.joiningDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center border border-dashed rounded-lg border-slate-200 dark:border-slate-800">
                  <p className="text-sm text-muted-foreground">No recent hires found.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200/60 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cake className="h-5 w-5 text-pink-500" /> Upcoming Birthdays
              </CardTitle>
              <CardDescription>Celebrations in the next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : dashboard?.upcomingBirthdays && dashboard.upcomingBirthdays.length > 0 ? (
                <div className="space-y-4">
                  {dashboard.upcomingBirthdays.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                      <div className="flex items-center gap-3">
                        {employee.profileImageUrl ? (
                          <img src={employee.profileImageUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center text-pink-600 dark:text-pink-400 font-semibold text-xs">
                            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{employee.firstName} {employee.lastName}</span>
                          <span className="text-xs text-slate-500">{employee.department?.name || "Department"}</span>
                        </div>
                      </div>
                      <div className="text-xs font-medium px-2 py-1 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm text-pink-600 dark:text-pink-400">
                        {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString(undefined, { month: 'long', day: 'numeric' }) : "N/A"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center border border-dashed rounded-lg border-slate-200 dark:border-slate-800">
                  <p className="text-sm text-muted-foreground">No upcoming birthdays.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
