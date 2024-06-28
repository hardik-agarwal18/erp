import { prisma } from "../setup/testDb.js";

let counter = 0;
const uid = () => { counter += 1; return counter; };

// ── Customers ──────────────────────────────────────────────────────────────────
export const createCustomer = async (organizationId: string, overrides: {
  name?: string; email?: string; phone?: string;
} = {}) => {
  const n = uid();
  return prisma.customer.create({
    data: {
      organizationId,
      name: overrides.name ?? `Customer ${n}`,
      email: overrides.email ?? `customer${n}@example.com`,
      phone: overrides.phone ?? `+1-555-${String(n).padStart(4, "0")}`,
    },
  });
};

// ── Vendors ───────────────────────────────────────────────────────────────────
export const createVendor = async (organizationId: string, overrides: {
  name?: string; email?: string; phone?: string;
} = {}) => {
  const n = uid();
  return prisma.vendor.create({
    data: {
      organizationId,
      name: overrides.name ?? `Vendor ${n}`,
      email: overrides.email ?? `vendor${n}@example.com`,
      phone: overrides.phone ?? null,
    },
  });
};

// ── Taxes ────────────────────────────────────────────────────────────────────
export const createTax = async (organizationId: string, overrides: {
  name?: string; rate?: number; type?: string;
} = {}) => {
  const n = uid();
  return prisma.tax.create({
    data: {
      organizationId,
      name: overrides.name ?? `GST ${n}%`,
      rate: overrides.rate ?? 18,
      type: overrides.type ?? "GST",
    },
  });
};

// ── Products ─────────────────────────────────────────────────────────────────
export const createProduct = async (organizationId: string, overrides: {
  name?: string; sellingPrice?: number; taxId?: string | null;
  type?: "PHYSICAL" | "SERVICE" | "DIGITAL";
} = {}) => {
  const n = uid();
  return prisma.product.create({
    data: {
      organizationId,
      name: overrides.name ?? `Product ${n}`,
      type: overrides.type ?? "PHYSICAL",
      sellingPrice: overrides.sellingPrice ?? 100,
      taxId: overrides.taxId ?? null,
    },
  });
};

// ── Inventory ────────────────────────────────────────────────────────────────
export const createInventoryItem = async (organizationId: string, productId: string, quantity = 50) => {
  return prisma.inventoryItem.create({
    data: { organizationId, productId, quantity, reorderLevel: 10 },
  });
};

// ── Expenses ─────────────────────────────────────────────────────────────────
export const createExpense = async (organizationId: string, overrides: {
  vendorId?: string; amount?: number; category?: string; expenseDate?: Date;
} = {}) => {
  const n = uid();
  return prisma.expense.create({
    data: {
      organizationId,
      vendorId: overrides.vendorId ?? null,
      amount: overrides.amount ?? 100,
      category: overrides.category ?? "SOFTWARE",
      expenseDate: overrides.expenseDate ?? new Date(),
    },
  });
};

// ── Invoices ─────────────────────────────────────────────────────────────────
export const createInvoice = async (
  organizationId: string,
  customerId: string,
  productId: string,
  overrides: {
    status?: string; totalAmount?: number; invoiceNumber?: string;
    unitPrice?: number;
  } = {},
) => {
  const n = uid();
  const unitPrice = overrides.unitPrice ?? 100;
  return prisma.invoice.create({
    data: {
      organizationId,
      customerId,
      invoiceNumber: overrides.invoiceNumber ?? `INV-${String(n).padStart(4, "0")}`,
      status: overrides.status ?? "DRAFT",
      issueDate: new Date(),
      subtotal: unitPrice,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: overrides.totalAmount ?? unitPrice,
      items: {
        create: [{
          productId,
          quantity: 1,
          unitPrice,
          taxAmount: 0,
          discountAmount: 0,
          lineTotal: unitPrice,
        }],
      },
    },
  });
};

// ── Payments ─────────────────────────────────────────────────────────────────
export const createPayment = async (
  organizationId: string,
  invoiceId: string,
  amount: number,
  overrides: { method?: string } = {},
) => {
  return prisma.payment.create({
    data: {
      organizationId,
      invoiceId,
      amount,
      method: overrides.method ?? "BANK_TRANSFER",
      paidAt: new Date(),
    },
  });
};
