# Domain Audit
**Audit Phase 3 — Domain-by-Domain Technical Review**
*Generated: 2026-06-17 | Auditor: Staff Backend Engineer + Domain Expert Review*

---

## Domain 1: IAM (Identity & Access Management)

### What Exists

**Auth** (`src/domains/iam/auth/`):
- JWT-based authentication with separate access (short-lived) and refresh tokens
- CSRF token protection on refresh operations
- Redis-backed session cache with refresh token hashing
- Access token blacklisting on logout
- Email verification flow
- Password reset flow with token expiry
- Multi-session support with per-device tracking
- Workspace switching with access token regeneration

**Evidence — CSRF Protection:**
```typescript
// auth.service.ts lines 235-241
if (!csrfToken) {
  throw new ApiError(403, "CSRF token missing");
}
if (hashToken(csrfToken) !== cachedSession.csrfTokenHash) {
  throw new ApiError(403, "Invalid CSRF token");
}
```

**Evidence — Token Blacklisting:**
```typescript
// auth.service.ts lines 69-76
const blacklistAccessToken = async (jti: string, exp?: number) => {
  const now = Math.floor(Date.now() / 1000);
  const ttl = exp ? exp - now : ACCESS_TOKEN_EXPIRES_IN;
  if (ttl > 0) {
    await redisClient.set(`blacklist:${jti}`, "1", { EX: ttl });
  }
};
```

**Evidence — Refresh Token Reuse Detection:**
```typescript
// auth.service.ts line 232
if (hashToken(refreshToken) !== cachedSession.refreshTokenHash) {
  throw new ApiError(401, "Refresh token reuse detected");
}
```

**RBAC:**
- Organizations → OrganizationMember → Role → RolePermission → Permission
- `tenantContextMiddleware` loads permissions from cache on every request
- `requirePermission()` and `requireRole()` middleware helpers

### What's Missing
1. **MFA (Multi-Factor Authentication)** — No TOTP/SMS/Email OTP support. MFA is completely absent from the schema and service layer.
2. **Login rate limiting** — `apiRateLimiter` is global but no per-user/per-IP login-specific limiter was observed.
3. **Account lockout after N failed attempts** — No failed-attempt counter in schema or service.
4. **Audit on failed logins** — Successful logins are audited; failed attempts are not.
5. **SSO/SAML/OAuth** — No federated identity support.
6. **Permission granularity** — Permissions are flat strings. No resource-level permissions (e.g., `invoice:read:own` vs `invoice:read:all`).
7. **Session listing API for users** — Users cannot view or revoke individual sessions from the UI.

### Technical Debt
- `signup` is an alias for `register` (trivial but indicative of API design iteration)
- `authService.updateProfile` calls `resendVerification` by email string — if email just changed, the old email won't receive verification

### Enterprise Gaps
- No LDAP/Active Directory integration
- No IP allowlisting per organization
- No session timeout policy per organization

### Domain Score: **7/10**
Strong foundation (CSRF, token rotation, blacklisting) but missing MFA and account lockout — both enterprise requirements.

---

## Domain 2: Core

### What Exists

**Approvals** (`src/domains/core/approvals/`):
- Multi-step approval templates with configurable approver types (USER or ROLE)
- Escalation timer support (`escalationAfterHours`)
- Auto-approve capability
- In-process approval instances with action history

**Evidence:**
```prisma
model ApprovalTemplate {
  entityType String          // tied to specific entity types
  steps      ApprovalStep[]
  @@unique([organizationId, entityType])  // one template per entity type
}
model ApprovalStep {
  order                Int
  approverType         String  // USER or ROLE
  escalationAfterHours Int?
  autoApprove          Boolean?
}
```

**Health** (`src/domains/core/health/`): Health check endpoint at `/api/v1/health` and `/health`.

**Reports** (`src/domains/core/reports/`): General report endpoints.

**Demo** (`src/domains/core/demo/`): Demo seeding capability.

### What's Missing
1. **Approval delegation** — No out-of-office delegation
2. **Conditional routing** — Only sequential approval, no conditional branching (e.g., "if amount > 10000, require CFO")
3. **Amount-based auto-routing** — Amount thresholds for approver selection not in schema
4. **Workflow builder UI** — No visual workflow designer
5. **SLA tracking** — No SLA breach alerting beyond escalation hours

### Technical Debt
- `ApprovalStep.approverType` is a `String` (not enum), allowing arbitrary values to bypass type safety

### Domain Score: **6/10**
Basic multi-step approvals with escalation. Lacks conditional routing and delegation — both expected in enterprise ERP.

---

## Domain 3: Financials

### Accounting (`src/domains/financials/accounting/`)

#### What Exists
- Full Chart of Accounts seeded with 40+ system accounts (ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE)
- Double-entry bookkeeping with service-layer enforcement
- Journal entry reversal with bi-directional reversal chain
- Accrual journal support with auto-reversal date
- Trial Balance, Profit & Loss, Balance Sheet reports
- Fiscal Year and Accounting Period management with period locking
- Financial Statement Snapshots with hash for integrity
- Opening balance migration support
- System account mappings for automated journal posting

**Evidence — Double-entry enforcement:**
```typescript
// accounting.service.ts lines 178-192
if (!totalDebit.equals(totalCredit)) {
  throw new ApiError(400, `Journal entry must balance.`);
}
```

#### What's Missing
1. **Tax account line detail** — `postPaymentJournal` looks up accounts by name string
2. **Bank reconciliation** — `BankTransaction` model exists but reconciliation workflow is **UNVERIFIED**
3. **GRNI (Goods Received Not Invoiced) Account** — Mapped to AP account as fallback, not a proper GRNI clearing account
4. **Fixed asset depreciation** — Account codes exist (1700, 1800) but depreciation journal service is **UNVERIFIED**
5. **Intercompany accounting** — Not present
6. **Currency revaluation** — Only INR hardcoded in outbox event payloads

#### Technical Debt
```typescript
// accounting.service.ts line 308
const cashAccount = bankAccounts.find((a: any) => a.name === "Cash" || a.code === "1000");
```
String-matching for account lookup is fragile and will break if accounts are renamed.

#### Accounting Score: **7/10**

---

### Invoices (`src/domains/financials/invoices/`)

#### What Exists
- Full invoice lifecycle: DRAFT → POSTED → PAID/PARTIALLY_PAID/OVERDUE/CANCELLED
- Automatic invoice number sequencing (atomic via `upsert + increment`)
- Line-item level tax and discount calculation
- Inventory decrement on POSTED (stock deduction)
- COGS calculation and outbox event emission
- PDF generation (async via queue)
- Email delivery with log tracking
- Soft delete (DRAFT only)
- Audit logging

**Evidence — Atomic sequence:**
```typescript
// invoice.service.ts lines 25-32
const sequence = await tx.invoiceSequence.upsert({
  where: { organizationId },
  update: { nextNumber: { increment: 1 } },
  create: { organizationId, nextNumber: 2 },
});
```

#### What's Missing
1. **Recurring invoices** — No scheduler for recurring billing
2. **Credit note linkage** — Credit/debit note models exist but linkage to invoices is UNVERIFIED
3. **Partial payment allocation** — Payment model links to invoice but allocation detail is missing
4. **Invoice aging** — `aging.service.ts` exists (3KB) but coverage is INFERRED
5. **Customer statement generation** — Not observed

#### Invoice Score: **7.5/10**

---

### Purchasing (`src/domains/financials/purchasing/`)

#### What Exists
- Requisitions → RFQ → Purchase Orders → Vendor Invoices → Vendor Payments
- 3-way match status on vendor invoices (MATCHED/PARTIAL_MATCH/MISMATCH)
- Mismatch tracking via `VendorInvoiceMismatch` model
- Payment batch execution with bank file support
- Billed/received quantity tracking on PO items

**Evidence — 3-way match:**
```prisma
model VendorInvoice {
  matchStatus  MatchStatus @default(MATCHED)
  mismatch     VendorInvoiceMismatch?
}
enum MatchStatus {
  MATCHED / PARTIAL_MATCH / MISMATCH
}
```

#### What's Missing
1. **Vendor portal** — No self-service vendor invoice submission
2. **EDI integration** — No electronic data interchange
3. **Blanket purchase orders** — Not modeled
4. **Price variance alerting** — Mismatch detected but no automated alerting workflow
5. **RFQ → PO conversion** — Workflow flow is UNVERIFIED

#### Procurement Score: **7/10**

---

### Treasury (`src/domains/financials/treasury/`)

#### What Exists
- Bank account management with GL account linkage
- Bank transactions with reconciliation status
- Payment runs with approval workflow
- Journal entry linkage for bank transactions

**Evidence:**
```prisma
model BankAccount {
  linkedAccountId String @unique  // Links to GL Account
  isActive        Boolean
}
model BankTransaction {
  status         String @default("CLEARED")  // PENDING/CLEARED/RECONCILED
  journalEntryId String? @unique             // Links to GL
}
```

#### What's Missing
1. **Auto-reconciliation** — No bank statement import/matching
2. **Cash flow forecasting** — Not present
3. **Multi-currency treasury** — Single currency
4. **Inter-bank transfers** — UNVERIFIED

#### Treasury Score: **6/10**

---

## Domain 4: Inventory

### What Exists
- Product catalog with categories, SKUs, tax linkage
- Stock level tracking via `InventoryItem` (quantity + average cost)
- Multi-location inventory via `Godown` (warehouse)
- Inventory movements audit trail
- Batch tracking (`isBatchTracked`) with expiry dates
- Serial number tracking (`isSerialTracked`)
- Goods Receipt Notes (GRN) with PO linkage
- Delivery challans
- Stock journals (inter-godown transfers)
- Stock verification (physical count reconciliation)
- Inventory valuation snapshots

**Evidence — Moving Average Cost:**
```prisma
model InventoryItem {
  quantity    Decimal @default(0)
  averageCost Decimal @default(0)  ← Moving Average Cost (MAC)
}
```

#### What's Missing
1. **FIFO valuation** — Only MAC is implemented; no FIFO layer
2. **Reorder point alerts** — `reorderLevel` field exists but alerting workflow is UNVERIFIED
3. **Bill of Materials (BOM)** — Not present; manufacturing not supported
4. **Kit/assembly** — Not present
5. **Landed cost distribution** — Freight/customs not allocated to GRN cost
6. **Negative inventory prevention** — Stock check before invoice posting exists but no DB constraint
7. **Barcode/QR integration** — Not modeled

#### Inventory Score: **7/10**

---

## Domain 5: Sales

### What Exists
- Quotations with expiry (`quotation-expiry.job.ts`)
- Sales Orders
- Fulfillment module
- Quotation → Sales Order conversion (INFERRED)

**Evidence:**
```
Directories: quotations/, orders/, fulfillment/
```

#### What's Missing
1. **CRM integration** — No lead/opportunity pipeline
2. **Price lists and discounts** — No configurable pricing rules
3. **Commission management** — Not present
4. **Sales territories** — Not modeled
5. **Contract management** — Not present
6. **Revenue recognition** — Not present

#### Sales Score: **5/10**
Core order management exists but the full B2B sales cycle is incomplete.

---

## Domain 6: HRMS

### What Exists
- Full employee master with hierarchy (`managerId` self-reference)
- Employment types, statuses, document management
- Department and designation management
- Shift management with grace time configuration
- Attendance recording with check-in/check-out
- Attendance adjustment and period locking
- Leave management: types, applications, balances
- Holiday calendar
- Payroll runs with attendance-based proration
- Salary components (flat + percentage-based)
- Payslip generation with line items
- Salary structure history
- Expense claims with approval

**Evidence — Payroll processing:**
```prisma
model PayrollRun {
  status          PayrollRunStatus @default(DRAFT)
  totalGrossPay   Decimal
  totalDeductions Decimal
  totalNetPay     Decimal
  employees       PayrollRunEmployee[]
  payslips        Payslip[]
  @@unique([organizationId, month, year])  // prevents duplicate runs
}
model PayrollPolicy {
  prorateByAttendance Boolean @default(true)
  workingDayBasis     WorkingDayBasis @default(FIXED_DAYS)
}
```

#### What's Missing
1. **Statutory compliance** — PF, ESI, TDS accounts in COA but payroll calculation deductions are UNVERIFIED
2. **Form 16 / TDS certificate generation** — Not observed
3. **Payroll journal automation** — Payroll handler exists but completeness is INFERRED
4. **Biometric integration** — Manual attendance only
5. **Performance management** — Not present
6. **Training & development** — Not present
7. **Succession planning** — Not present
8. **Gratuity calculation** — Not present

#### HRMS Score: **6.5/10**
Strong foundation but statutory compliance automation and advanced HR features are absent.

---

## Cross-Domain Summary

| Domain | Score | Top Gap |
|---|---|---|
| IAM | 7/10 | No MFA |
| Core/Approvals | 6/10 | No conditional routing |
| Accounting | 7/10 | String-based account lookup |
| Invoicing | 7.5/10 | No recurring billing |
| Purchasing | 7/10 | No vendor portal |
| Treasury | 6/10 | No auto-reconciliation |
| Inventory | 7/10 | No FIFO, no BOM |
| Sales | 5/10 | No CRM, no pricing rules |
| HRMS | 6.5/10 | Statutory compliance unverified |

**Overall Domain Maturity: 6.5/10**
