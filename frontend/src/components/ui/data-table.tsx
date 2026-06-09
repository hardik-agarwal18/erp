"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  SortingState,
  VisibilityState,
  RowSelectionState,
  ColumnFiltersState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, ChevronDown, ChevronUp, ChevronsUpDown, Loader2, Search, SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
  pageSize?: number;
  enableToolbar?: boolean;
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
  pageSize = 10,
  enableToolbar = true,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [showColumnsMenu, setShowColumnsMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize,
  });

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowColumnsMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
      pagination,
      globalFilter,
      columnFilters,
    },
  });

  const densityClass = density === "compact" ? "py-2" : "py-3";

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-background shadow-sm", className)}>
      {enableToolbar && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-border bg-card">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search across all columns..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent pl-9 pr-4 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          
          <div className="relative w-full sm:w-auto" ref={menuRef}>
            <button
              onClick={() => setShowColumnsMenu(!showColumnsMenu)}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              type="button"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Columns
            </button>
            
            {showColumnsMenu && (
              <div className="absolute right-0 top-full z-10 mt-2 w-48 rounded-md border border-border bg-popover p-1 shadow-md text-popover-foreground">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Toggle Columns</div>
                <div className="h-px bg-border my-1" />
                <div className="max-h-[240px] overflow-y-auto">
                  {table.getAllColumns().filter(col => col.getCanHide()).map(column => {
                    return (
                      <label key={column.id} className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer transition-colors">
                        <input 
                          type="checkbox" 
                          className="rounded border-primary h-4 w-4 accent-primary"
                          checked={column.getIsVisible()} 
                          onChange={column.getToggleVisibilityHandler()} 
                        />
                        <span className="truncate capitalize">{typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
            Array.from({ length: 5 }).map((_, rowIndex) => (
              <TableRow key={`loading-row-${rowIndex}`}>
                {columns.map((_, colIndex) => (
                  <TableCell key={`loading-cell-${rowIndex}-${colIndex}`} className={densityClass}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
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

      {/* Pagination Controls */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronDown className="h-3.5 w-3.5 rotate-90" />
              Prev
            </button>
            <button
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
