"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { getEmployees } from "@/services/hrms.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["hrms", "employees", search, page],
    queryFn: () => getEmployees({ search, page, limit: 10 }),
  });

  return (
    <AppShell activePath="/hrms/employees">
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Employee Directory</h2>
          <div className="flex items-center space-x-2">
            <Link href="/hrms/employees/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Employee
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search employees..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            Failed to load employees. Please try again later.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Name</TableHeaderCell>
                  <TableHeaderCell>Email</TableHeaderCell>
                  <TableHeaderCell>Role</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Joined</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : data?.items?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No employees found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items?.map((employee: import("@/types/app").Employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        <Link href={`/hrms/employees/${employee.id}`} className="hover:underline">
                          {employee.firstName} {employee.lastName}
                        </Link>
                      </TableCell>
                      <TableCell>{employee.officialEmail || employee.personalEmail}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{employee.designation?.name || "N/A"}</span>
                          <span className="text-xs text-muted-foreground">{employee.department?.name || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={employee.status === "ACTIVE" ? "success" : "neutral"}>
                          {employee.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(employee.joiningDate).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!data || data.page * data.limit >= data.total || isLoading}
          >
            Next
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
