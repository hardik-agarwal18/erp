# Pilot Table Migration

## 1. Selected Table
`src/features/organizations/components/settings-members-view.tsx`

## 2. Current Implementation
- Hand-written `<Table>` primitives (`Table`, `TableHead`, `TableRow`, `TableCell`).
- Static `.map()` iteration over the `members` array.
- Uses `isLoading` to render an entire full-page `<PageLoader>` instead of a skeleton or inline table loader.
- Contains interactive elements like Role Badges and Remove Member buttons inside table cells.

## 3. Current Limitations
- **No sorting**: Users cannot sort by role, join date, or name.
- **No visibility toggles**: Cannot hide the email column on smaller screens.
- **Page shifting**: The full-page `PageLoader` causes jarring layout shifts when data refetches.
- **Verbose**: Over 30 lines of boilerplate JSX just to render 5 columns.

## 4. Mapping Strategy
1. **Remove Boilerplate**: Delete manual `Table`, `TableBody`, `TableRow`, etc. imports.
2. **Column Definition**: Extract the JSX into a `useMemo` hook returning `ColumnDef<any>[]`. Use `accessorKey` for simple strings (Name, Email, Joined) and `cell` render functions for complex JSX (Badge, Actions).
3. **Data Fetching States**: Map `useMembers()` `isLoading` and `isError` directly into the `DataTable` props, rather than blocking the whole page render.
4. **Instantiate DataTable**: `<DataTable columns={columns} data={members || []} density="comfortable" />`

## 5. Risks
- Moving the `removeMember.mutate` call into the `ColumnDef` requires it to be defined inside the component or passed via meta context. Using `useMemo` mitigates this safely.
- TypeScript `any` typing on the generic `ColumnDef` if the `Member` type isn't globally exposed. We will bypass this by letting TypeScript infer the original object structure.

## 6. Rollback Plan
Since all changes are localized to `settings-members-view.tsx`, the rollback plan is a simple `git checkout -- src/features/organizations/components/settings-members-view.tsx`. No shared APIs are being mutated.
