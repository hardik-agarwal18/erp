# Frontend Routing

## Table of Contents
- [Overview](#overview)
- [Route Tree](#route-tree)
- [Routing Notes](#routing-notes)

## Overview
The active frontend uses Next.js App Router routes under `frontend/src/app`.

## Route Tree
```text
/
├─ /dashboard
├─ /customers
│  ├─ /create
│  └─ /[customerId]
│     └─ /edit
├─ /vendors
│  ├─ /create
│  └─ /[vendorId]
│     └─ /edit
├─ /products
│  ├─ /create
│  └─ /[productId]
│     └─ /edit
├─ /inventory
│  ├─ /adjustments
│  ├─ /transfers
│  ├─ /audit
│  └─ /warehouses
├─ /invoices
│  ├─ /create
│  └─ /[invoiceId]
│     └─ /edit
├─ /purchases
│  ├─ /create
│  ├─ /goods-received-notes
│  └─ /[purchaseId]
└─ /transactions
   ├─ /list
   ├─ /reconciliation
   └─ /[transactionId]
```

## Routing Notes
- `/` redirects to `/dashboard`
- Each implemented route segment includes page-level loading and error boundaries
- All current routes are shell-wrapped ERP workspace pages
- No frontend route-level authentication guard is implemented in `frontend/src/app`
