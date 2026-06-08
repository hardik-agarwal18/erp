export type Role = "owner" | "admin" | "manager" | "member" | string;

export type Permission = {
  id: string;
  name: string;
  description: string | null;
};

export type OrganizationMembership = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  ownerId: string;
  membershipId: string | null;
  roleId: string | null;
  role: Role;
  createdAt: string;
  updatedAt?: string;
};

export type Workspace = {
  id: string;
  name: string;
  companyName: string;
  role: Role;
  currency: string;
  slug?: string;
  membershipId?: string | null;
  roleId?: string | null;
  logo?: string | null;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
};

export type UserSession = SessionUser & {
  role: Role | null;
  initials: string;
};

export type NavigationItem = {
  label: string;
  href: string;
  feature: FeatureKey;
};

export type FeatureKey = "dashboard" | "customers" | "vendors" | "invoices" | "inventory" | "purchases" | "products" | "transactions" | "expenses" | "payments" | "reports" | "organizations" | "audit_logs";

export type KpiMetric = {
  label: string;
  value: number;
  trend?: number;
  detail: string;
};

export type DashboardSnapshot = {
  kpis: KpiMetric[];
  revenueTrend: Array<{ month: string; revenue: number; forecast: number }>;
  expenseTrend: Array<{ month: string; expenses: number; payroll: number }>;
  cashFlowTrend: Array<{ month: string; inflow: number; outflow: number; net: number }>;
  bankBalances: Array<{ label: string; amount: number }>;
  receivablesVsPayables: Array<{ label: string; amount: number }>;
  activity: Array<{ id: string; title: string; detail: string; time: string; kind: "invoice" | "inventory" | "purchase" }>;
  lowStockAlerts: Array<{ id: string; item: string; sku: string; warehouse: string; remaining: number; severity: "critical" | "warning" }>;
  outstandingInvoices: Array<{ id: string; customer: string; dueDate: string; amount: number; status: "overdue" | "due_soon" }>;
  expensesByCategory: Array<{ category: string; total: number }>;
  topCustomers: Array<{ customer: string; revenue: number }>;
};

export type InvoiceStatus = "draft" | "sent" | "partial" | "paid" | "overdue";

export type InvoiceLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  customer: string;
  issueDate?: string;
  dueDate: string;
  status: InvoiceStatus;
  amount: number;
  balance: number;
  salesRep: string;
  currency?: string;
  paymentTerms?: string;
  notes?: string;
  billingAddress?: string;
  lineItems?: InvoiceLineItem[];
  workspaceId: string;
  activity: string[];
};

export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock";

export type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  warehouse: string;
  onHand: number;
  reserved: number;
  reorderPoint: number;
  valuation: number;
  status: InventoryStatus;
  workspaceId: string;
};

export type PurchaseStatus = "draft" | "pending_approval" | "approved" | "received" | "billed";

export type PurchaseOrder = {
  id: string;
  vendor: string;
  number: string;
  orderDate?: string;
  expectedDate: string;
  warehouse: string;
  status: PurchaseStatus;
  amount: number;
  approvalStage: string;
  workspaceId: string;
  paymentTerms: string;
  outstandingBalance: number;
  buyer?: string;
  notes?: string;
};

export type CustomerStatus = "active" | "at_risk" | "inactive";

export type CustomerSegment = "enterprise" | "mid_market" | "smb";

export type CustomerDocument = {
  id: string;
  title: string;
  type: "contract" | "tax_certificate" | "statement" | "credit_form";
  uploadedAt: string;
  uploadedBy: string;
};

export type CustomerTimelineEntry = {
  id: string;
  title: string;
  detail: string;
  occurredAt: string;
  kind: "invoice" | "payment" | "note" | "document" | "credit";
};

export type CustomerTransaction = {
  id: string;
  date: string;
  type: "invoice" | "payment" | "credit_note" | "adjustment";
  reference: string;
  amount: number;
  balance: number;
};

export type Customer = {
  id: string;
  code: string;
  name: string;
  legalName: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  segment: CustomerSegment;
  gstin: string;
  currency: string;
  paymentTerms: string;
  creditLimit: number;
  outstandingBalance: number;
  totalRevenue: number;
  lastInvoiceDate: string;
  owner: string;
  billingAddress: string;
  shippingAddress: string;
  workspaceId: string;
  documents: CustomerDocument[];
  timeline: CustomerTimelineEntry[];
  invoices: Invoice[];
  transactions: CustomerTransaction[];
};

export type VendorStatus = "active" | "review" | "inactive";

export type VendorCategory = "raw_materials" | "services" | "logistics" | "electronics";

export type VendorDocument = {
  id: string;
  title: string;
  type: "msa" | "tax_certificate" | "bank_form" | "compliance";
  uploadedAt: string;
  uploadedBy: string;
};

export type VendorTimelineEntry = {
  id: string;
  title: string;
  detail: string;
  occurredAt: string;
  kind: "purchase" | "bill" | "payment" | "document" | "review";
};

export type VendorTransaction = {
  id: string;
  date: string;
  type: "bill" | "payment" | "debit_note" | "adjustment";
  reference: string;
  amount: number;
  balance: number;
};

export type Vendor = {
  id: string;
  code: string;
  name: string;
  legalName: string;
  email: string;
  phone: string;
  status: VendorStatus;
  category: VendorCategory;
  gstin: string;
  currency: string;
  paymentTerms: string;
  leadTimeDays: number;
  outstandingBalance: number;
  totalSpend: number;
  lastBillDate: string;
  accountManager: string;
  billingAddress: string;
  shippingAddress: string;
  workspaceId: string;
  documents: VendorDocument[];
  timeline: VendorTimelineEntry[];
  purchaseOrders: PurchaseOrder[];
  transactions: VendorTransaction[];
};

export type ProductStatus = "active" | "draft" | "discontinued";

export type ProductType = "raw_material" | "finished_good" | "consumable" | "service";

export type ProductSupplier = {
  vendorId: string;
  vendorName: string;
  leadTimeDays: number;
  minimumOrderQuantity: number;
  paymentTerms: string;
  lastPurchaseDate: string;
};

export type ProductPricing = {
  costPrice: number;
  salePrice: number;
  wholesalePrice: number;
  taxRate: number;
  marginPercent: number;
  currency: string;
  lastUpdated: string;
};

export type ProductInventory = {
  onHand: number;
  reserved: number;
  available: number;
  incoming: number;
  reorderPoint: number;
  safetyStock: number;
  status: "healthy" | "reorder" | "critical";
};

export type ProductWarehouseStock = {
  id: string;
  warehouse: string;
  bin: string;
  onHand: number;
  reserved: number;
  incoming: number;
  updatedAt: string;
};

export type Product = {
  id: string;
  code: string;
  sku: string;
  name: string;
  description: string;
  status: ProductStatus;
  type: ProductType;
  category: string;
  unitOfMeasure: string;
  barcode: string;
  taxCode: string;
  supplier: ProductSupplier;
  pricing: ProductPricing;
  inventory: ProductInventory;
  warehouses: ProductWarehouseStock[];
  tags: string[];
  workspaceId: string;
  updatedAt: string;
};

export type TransactionStatus = "posted" | "pending" | "matched" | "exception";

export type TransactionKind = "receipt" | "payment" | "transfer" | "adjustment" | "charge";

export type Transaction = {
  id: string;
  reference: string;
  date: string;
  kind: TransactionKind;
  counterparty: string;
  account: string;
  amount: number;
  direction: "inflow" | "outflow";
  status: TransactionStatus;
  channel: "bank" | "cash" | "journal";
  memo: string;
  workspaceId: string;
};
