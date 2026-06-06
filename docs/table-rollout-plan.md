# Table Migration Rollout Plan (Phase 2C.3)

## Wave 1 (Low Risk)
**Status:** ✅ Completed (Pilot Migration)
- `settings-members-view.tsx` (Migrated)

## Wave 2 (Medium Risk - Customers & Vendors)
**Status:** ⏳ Pending Implementation
These tables primarily serve as list views with moderate data density. They do not contain complex financial calculations inside the `.map()` loops.

1. **Customer Table**
   - Path: `src/features/customers/components/customer-table.tsx`
   - Effort: Low
2. **Customer Transactions**
   - Path: `src/features/customers/components/customer-transactions.tsx`
   - Effort: Low
3. **Customer Invoices**
   - Path: `src/features/customers/components/customer-invoices.tsx`
   - Effort: Low
4. **Vendor Table**
   - Path: `src/features/vendors/components/vendor-table.tsx`
   - Effort: Low
5. **Vendor Purchase Orders**
   - Path: `src/features/vendors/components/vendor-purchase-orders.tsx`
   - Effort: Low
6. **Vendor Transactions**
   - Path: `src/features/vendors/components/vendor-transactions.tsx`
   - Effort: Low

## Wave 3 (High Value - Inventory)
**Status:** ⏸️ Deferred
These tables contain real-time stock levels, reorder points, and statuses. They require dense rendering modes (`Compact`).

1. **Product Table**: `src/features/products/components/product-table.tsx`
2. **Inventory Items**: `src/features/inventory/components/inventory-items-table.tsx`
3. **Stock Transfers**: `src/features/inventory/components/stock-transfers-view.tsx`
4. **Stock Adjustments**: `src/features/inventory/components/stock-adjustments-view.tsx`

## Wave 4 (Business Critical - Purchases)
**Status:** ⏸️ Deferred
These tables act as the gateway for goods coming into the ERP and hitting the ledger.

1. **Purchase Table**: `src/features/purchases/components/purchase-table.tsx`
2. **GRN View**: `src/features/purchases/components/goods-received-notes-view.tsx`
3. **Purchase Details**: `src/features/purchases/components/purchase-details-view.tsx`

## Wave 5 (Highest Risk - Accounting & Finance)
**Status:** ⏸️ Deferred
These are the most complex tables in the system, driving revenue, payments, and reconciliations. They require 100% precision.

1. **Transaction Ledger**: `src/features/transactions/components/transaction-table.tsx`
2. **Bank Reconciliation**: `src/features/transactions/components/bank-reconciliation-view.tsx`
3. **Invoice Table**: `src/features/invoices/components/invoice-table.tsx`
4. **Invoice Line Items**: `src/features/invoices/components/invoice-line-items.tsx`
5. **Payment Table**: `src/features/payments/components/payment-table.tsx`
6. **Expense Table**: `src/features/expenses/components/expense-table.tsx`
