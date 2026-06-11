// @ts-nocheck
export const PERMISSIONS = {
  // Organization
  ORGANIZATION_VIEW: "organization.view",
  ORGANIZATION_UPDATE: "organization.update",
  ORGANIZATION_DELETE: "organization.delete",
  ORGANIZATION_SETTINGS: "organization.settings",

  // Members
  MEMBER_VIEW: "member.view",
  MEMBER_INVITE: "member.invite",
  MEMBER_UPDATE: "member.update",
  MEMBER_REMOVE: "member.remove",

  // Audit Logs
  AUDIT_READ: "audit.read",

  // Roles
  ROLES_VIEW: "roles.view",
  ROLES_CREATE: "roles.create",
  ROLES_UPDATE: "roles.update",
  ROLES_DELETE: "roles.delete",

  // Ownership
  OWNERSHIP_TRANSFER: "ownership.transfer",

  // Inventory
  INVENTORY_VIEW: "inventory.view",
  INVENTORY_CREATE: "inventory.create",
  INVENTORY_UPDATE: "inventory.update",
  INVENTORY_DELETE: "inventory.delete",

  // Products
  PRODUCTS_VIEW: "products.view",
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_UPDATE: "products.update",
  PRODUCTS_DELETE: "products.delete",

  // Customers
  CUSTOMERS_VIEW: "customers.view",
  CUSTOMERS_CREATE: "customers.create",
  CUSTOMERS_UPDATE: "customers.update",
  CUSTOMERS_DELETE: "customers.delete",

  // Vendors
  VENDORS_VIEW: "vendors.view",
  VENDORS_CREATE: "vendors.create",
  VENDORS_UPDATE: "vendors.update",
  VENDORS_DELETE: "vendors.delete",

  // Sales (Invoices)
  SALES_VIEW: "sales.view",
  SALES_CREATE: "sales.create",
  SALES_UPDATE: "sales.update",
  SALES_DELETE: "sales.delete",
  SALES_SEND: "sales.send",
  SALES_EXPORT: "sales.export",

  // Purchasing (Expenses)
  PURCHASING_VIEW: "purchasing.view",
  PURCHASING_CREATE: "purchasing.create",
  PURCHASING_UPDATE: "purchasing.update",
  PURCHASING_DELETE: "purchasing.delete",

  // Finance (Payments/Transactions/Taxes)
  FINANCE_VIEW: "finance.view",
  FINANCE_CREATE: "finance.create",
  FINANCE_UPDATE: "finance.update",
  FINANCE_DELETE: "finance.delete",

  // Reports
  REPORTS_VIEW: "reports.view",
  REPORTS_EXPORT: "reports.export",
} as const;

export type PermissionType = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
