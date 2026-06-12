# Purchasing Module (Purchase Orders & Vendor Invoices)

**Location:** `src/domains/financials/purchasing/`

Manages the **procure-to-pay** workflow: Purchase Orders (PO) from vendor selection through approval, and Vendor Invoices with 3-way matching validation before accounting integration.

---

## Sub-Modules

```
purchasing/
├── purchase-orders/    # PO creation, approval workflow, and GRN status tracking
└── vendor-invoices/    # Vendor invoice creation, 3-way match, posting, override approval
```

---

## Purchase Orders

**Location:** `src/domains/financials/purchasing/purchase-orders/`

### Routes (`/api/v1/purchase-orders`)

| Method | Path | Permission | Description |
|---|---|---|---|
| `POST` | `/purchase-orders` | `PURCHASES_CREATE` | Create a new PO (DRAFT status) |
| `GET` | `/purchase-orders` | `PURCHASES_READ` | List all POs |
| `GET` | `/purchase-orders/:id` | `PURCHASES_READ` | Get a single PO with items |
| `POST` | `/purchase-orders/:id/submit-approval` | `PURCHASES_CREATE` | Submit PO for approval |

All routes require `authMiddleware` + `tenantContextMiddleware`.

### PO Status Lifecycle

```
DRAFT → ISSUED (submit-approval)
ISSUED → APPROVED (Approval Engine: approval.completed)
ISSUED → CANCELLED (Approval Engine: approval.rejected)
APPROVED → PARTIALLY_RECEIVED (first GRN received via grn.completed event)
PARTIALLY_RECEIVED → RECEIVED (all GRN items fully received)
```

### Service Functions

#### `purchaseOrdersService.create(organizationId, payload)`
- Generates `poNumber` using `PO-{timestamp}`.
- Creates PO with items.
- Emits `purchase-order.created` event.

#### `purchaseOrdersService.submitForApproval(organizationId, id, userId)`
1. Validates PO is in `DRAFT` status.
2. Submits to Approval Engine with `entityType: "PURCHASE_ORDER"`.
3. Sets status to `ISSUED`.

### Event Integration

| Event | Trigger | Action |
|---|---|---|
| `approval.completed` (`PURCHASE_ORDER`) | Approvals Engine | Sets status `APPROVED`, emits `purchase-order.approved` |
| `approval.rejected` (`PURCHASE_ORDER`) | Approvals Engine | Sets status `CANCELLED`, emits `purchase-order.cancelled` |
| `grn.completed` (listens) | GRN Module | Updates PO status to `PARTIALLY_RECEIVED` or `RECEIVED` based on received quantities |

---

## Vendor Invoices

**Location:** `src/domains/financials/purchasing/vendor-invoices/`

### Routes (`/api/v1/vendor-invoices`)

| Method | Path | Permission | Description |
|---|---|---|---|
| `POST` | `/vendor-invoices` | `PURCHASES_CREATE` | Create a vendor invoice (DRAFT) |
| `GET` | `/vendor-invoices` | `PURCHASES_READ` | List vendor invoices |
| `GET` | `/vendor-invoices/:id` | `PURCHASES_READ` | Get a single vendor invoice |
| `POST` | `/vendor-invoices/:id/post` | `PURCHASES_CREATE` | Post invoice (validate + journal) |
| `POST` | `/vendor-invoices/:id/request-override` | `PURCHASES_CREATE` | Request override for 3-way match failure |

All routes require `authMiddleware` + `tenantContextMiddleware`.

### Vendor Invoice Lifecycle

```
DRAFT → POSTED (post, if 3-way match passes)
DRAFT → DISPUTED (if override approval rejected)
DRAFT → POSTED (via override approval: approval.completed for PROCUREMENT_OVERRIDE)
```

### Three-Way Matching

When posting a vendor invoice linked to a PO (`purchaseOrderId` is set), the service performs **3-way matching**:

```
PO (ordered qty) + GRN (received qty) + Invoice (billed qty)
```

**Rule:** For each line item: `billedQty ≤ min(orderedQty, receivedQty)`.

If mismatch found:
- Throws `409 "Three-Way Match Failed"` with reasons.
- Client must call `POST /vendor-invoices/:id/request-override` to seek approval.

If no PO linked (direct invoice): posting proceeds without 3-way matching.

### Service Functions

#### `vendorInvoicesService.create(organizationId, payload)`
Creates a `DRAFT` vendor invoice with line items.

#### `vendorInvoicesService.postInvoice(organizationId, id, forceOverride = false)`
1. Validates invoice is `DRAFT`.
2. If `purchaseOrderId` is set and `forceOverride = false`: runs **3-way match**. Throws `409` on mismatch.
3. If `purchaseOrderId` is set: updates `PurchaseOrderItem.billedQuantity` for matched items.
4. Sets status to `POSTED`.
5. Calls `accountingService.postVendorInvoice()` to create the GL journal entry:
   - **Debit** Inventory (1300) or Expense account
   - **Credit** Accounts Payable (2000)
   - **Debit** Tax (2100) if `taxAmount > 0`
6. Emits `vendor-invoice.posted` event.

#### `vendorInvoicesService.requestOverrideApproval(organizationId, id, userId)`
When 3-way match fails, submits to Approval Engine with `entityType: "PROCUREMENT_OVERRIDE"`.
- On approval: `postInvoice(id, forceOverride=true)` is called automatically.
- On rejection: invoice is set to `DISPUTED` status.

### Types

#### `CreateVendorInvoiceInput`
```typescript
{
  vendorId: string;
  invoiceNumber: string;
  invoiceDate: string;
  purchaseOrderId?: string;
  subtotal: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  notes?: string;
  items: Array<{
    productId: string;
    poItemId?: string;
    quantity: number;
    unitPrice: number;
  }>;
}
```
