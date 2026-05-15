# DataTable API Documentation

The `DataTable` component is the Enterprise standard for rendering dense, interactive data arrays across the application. It leverages `@tanstack/react-table` internally, drastically reducing the boilerplate needed for pagination, sorting, and state management.

## 1. Supported Props

```tsx
import { DataTable } from "@/components/ui/data-table";

<DataTable
  data={myArrayData}
  columns={myColumns}
  density="comfortable" // "comfortable" (48px) | "compact" (40px)
  isLoading={false}
  isError={false}
  emptyMessage="No results found."
  errorMessage="Failed to load data."
/>
```

## 2. Defining Columns (`ColumnDef`)

Columns are defined using TanStack Table's `ColumnDef` type.

```tsx
import { ColumnDef } from "@tanstack/react-table";
import { Transaction } from "@/types/app";

export const transactionColumns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "reference",
    header: "Reference",
    enableSorting: true,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
 
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
]
```

## 3. Implementing Row Selection

Row selection state is handled internally by the `DataTable`. To expose it to the user, add a selection column to your column definition array:

```tsx
import { Checkbox } from "@/components/ui/checkbox";

export const columns: ColumnDef<Payment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  // ... other columns
];
```

## 4. Migration Guidelines (From Static Tables to DataTable)

**Step 1:** Do not modify the existing static table files directly. Create a new `*Columns` definition array in the same feature folder (e.g., `transaction-columns.ts`).
**Step 2:** Define the accessors to map exactly to what was rendered in the static `.map()`.
**Step 3:** Import `<DataTable>` into the view component and pass the columns and data.
**Step 4:** Set `density="compact"` for heavy inventory/accounting screens, and `density="comfortable"` for standard CRM/settings lists.
**Step 5:** Delete the old static `<Table>` boilerplate.
