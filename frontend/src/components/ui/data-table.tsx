"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, ChevronDown, ChevronUp, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type DataTableDensity = "compact" | "comfortable";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  density?: DataTableDensity;
  isLoading?: boolean;
  isError?: boolean;
  emptyMessage?: string;
  errorMessage?: string;
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  density = "comfortable",
  isLoading = false,
  isError = false,
  emptyMessage = "No results found.",
  errorMessage = "Failed to load data.",
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
    },
  });

  const densityClass = density === "compact" ? "py-2" : "py-3";

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-background shadow-sm", className)}>
      <Table>
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const isSorted = header.column.getIsSorted();

                return (
                  <TableHeaderCell key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "flex items-center gap-2",
                          canSort && "cursor-pointer select-none hover:text-foreground transition-colors"
                        )}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        onKeyDown={(e) => {
                          if (canSort && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            header.column.toggleSorting();
                          }
                        }}
                        tabIndex={canSort ? 0 : undefined}
                        role={canSort ? "button" : undefined}
                        aria-sort={isSorted === "asc" ? "ascending" : isSorted === "desc" ? "descending" : "none"}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {canSort && (
                          <span className="w-4 h-4 inline-flex items-center justify-center">
                            {isSorted === "asc" ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : isSorted === "desc" ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronsUpDown className="h-3 w-3 opacity-30" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHeaderCell>
                );
              })}
            </tr>
          ))}
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mb-2" />
                  <p className="text-sm">Loading data...</p>
                </div>
              </TableCell>
            </TableRow>
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center">
                <div className="flex flex-col items-center justify-center text-destructive">
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  <p className="text-sm">{errorMessage}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={cn(densityClass, "whitespace-nowrap")}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
