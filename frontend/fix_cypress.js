const fs = require('fs');
const path = require('path');

const e2eDir = path.join(__dirname, 'cypress', 'e2e');

function updateFile(filename, replacer) {
  const filePath = path.join(e2eDir, filename);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const newContent = replacer(content);
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filename}`);
  }
}

// Fix dashboard.cy.ts
updateFile('dashboard.cy.ts', (content) => {
  return content.replace(/cy\.intercept\("GET", "\*\*\/api\/v1\/reports\/\*", \{[\s\S]*?\}\)\.as\("getOverview"\);/, 
    `cy.intercept("GET", "**/api/v1/reports/dashboard*", {
      statusCode: 200,
      body: { success: true, data: { monthlyRevenue: 150000, monthlyExpenses: 50000, profitEstimate: 100000, unpaidInvoices: 12, inventoryValue: 20000, topCustomers: [] } }
    }).as("getOverview");
    cy.intercept("GET", "**/api/v1/reports/inventory*", {
      statusCode: 200,
      body: { success: true, data: { stockValue: 20000, lowStockItems: [], movements: [] } }
    });
    cy.intercept("GET", "**/api/v1/reports/sales*", {
      statusCode: 200,
      body: { success: true, data: { totalSales: 150000, invoiceCount: 12, averageInvoiceValue: 12500, topCustomers: [] } }
    });`);
});

// Fix customers.cy.ts
updateFile('customers.cy.ts', (content) => {
  let c = content.replace(/"\*\*\/api\/v1\/customers\*\*"/, '"**/api/v1/customers*"');
  c = c.replace(/\{ id: "cust-1", name: "Acme Corp"[^\}]+\}/, '{ id: "cust-1", name: "Acme Corp", email: "contact@acme.com", createdAt: new Date().toISOString() }');
  c = c.replace(/\{ id: "cust-2", name: "Global Industries"[^\}]+\}/, '{ id: "cust-2", name: "Global Industries", email: "info@global.com", createdAt: new Date().toISOString() }');
  if (!c.includes('/ledger')) {
    c = c.replace(/\}\)\.as\("getCustomers"\);/, `}).as("getCustomers");
    cy.intercept("GET", "**/api/v1/customers/*/ledger*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          customer: { id: "cust-1", name: "Acme Corp", email: "contact@acme.com", createdAt: new Date().toISOString() },
          invoices: [], payments: [], outstandingBalance: 0, creditBalance: 0
        }
      }
    });`);
  }
  return c;
});

// Fix vendors.cy.ts
updateFile('vendors.cy.ts', (content) => {
  let c = content.replace(/"\*\*\/api\/v1\/vendors\*\*"/, '"**/api/v1/vendors*"');
  c = c.replace(/\{ id: "vnd-1"[^\}]+\}/, '{ id: "vnd-1", name: "Tech Supplies Co", email: "sales@techsupplies.com", createdAt: new Date().toISOString() }');
  c = c.replace(/\{ id: "vnd-2"[^\}]+\}/, '{ id: "vnd-2", name: "Office Basics", email: "contact@officebasics.com", createdAt: new Date().toISOString() }');
  if (!c.includes('/ledger')) {
    c = c.replace(/\}\)\.as\("getVendors"\);/, `}).as("getVendors");
    cy.intercept("GET", "**/api/v1/vendors/*/ledger*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          vendor: { id: "vnd-1", name: "Tech Supplies Co", email: "sales@techsupplies.com", createdAt: new Date().toISOString() },
          purchases: [], payments: [], outstandingBalance: 0, creditBalance: 0
        }
      }
    });`);
  }
  return c;
});

// Fix expenses.cy.ts
updateFile('expenses.cy.ts', (content) => {
  let c = content.replace(/"\*\*\/api\/v1\/expenses\*\*"/, '"**/api/v1/expenses*"');
  c = c.replace(/"\*\*\/api\/v1\/vendors\*\*"/, '"**/api/v1/vendors*"');
  c = c.replace(/\{ id: "exp-1"[^\}]+\}/, '{ id: "exp-1", amount: 150.50, category: "SOFTWARE", vendorId: "v-1", expenseDate: new Date().toISOString(), createdAt: new Date().toISOString(), organizationId: "org-1", description: "GitHub" }');
  c = c.replace(/\{ id: "exp-2"[^\}]+\}/, '{ id: "exp-2", amount: 2500, category: "HARDWARE", vendorId: "v-2", expenseDate: new Date().toISOString(), createdAt: new Date().toISOString(), organizationId: "org-1", description: "Apple" }');
  return c;
});

// Fix invoices.cy.ts
updateFile('invoices.cy.ts', (content) => {
  let c = content.replace(/"\*\*\/api\/v1\/invoices\*\*"/, '"**/api/v1/invoices*"');
  c = c.replace(/"\*\*\/api\/v1\/customers\*\*"/, '"**/api/v1/customers*"');
  c = c.replace(/"\*\*\/api\/v1\/products\*\*"/, '"**/api/v1/products*"');
  c = c.replace(/\{ id: "inv-1"[^\}]+\}/, '{ id: "inv-1", invoiceNumber: "INV-0001", customerId: "cust-1", customer: { name: "Acme Corp" }, totalAmount: 5000, paidAmount: 0, status: "PAID", issueDate: new Date().toISOString() }');
  c = c.replace(/\{ id: "inv-2"[^\}]+\}/, '{ id: "inv-2", invoiceNumber: "INV-0002", customerId: "cust-2", customer: { name: "Global Industries" }, totalAmount: 3500, paidAmount: 0, status: "ISSUED", issueDate: new Date().toISOString(), dueDate: new Date(Date.now() + 86400000 * 30).toISOString() }');
  return c;
});

// Fix products.cy.ts
updateFile('products.cy.ts', (content) => {
  let c = content.replace(/"\*\*\/api\/v1\/products\*\*"/g, '"**/api/v1/products*"');
  return c;
});

// Fix reports.cy.ts
updateFile('reports.cy.ts', (content) => {
  let c = content.replace(/window\.localStorage\.setItem\("activeOrganizationId", "org-1"\);/, 'cy.mockSession();');
  c = c.replace(/cy\.intercept\("GET", "\*\*\/api\/v1\/reports\/overview\*", \{[\s\S]*?\}\)\.as\("getOverview"\);/, 
    `cy.intercept("GET", "**/api/v1/reports/dashboard*", {
      statusCode: 200,
      body: { success: true, data: { monthlyRevenue: 50000, monthlyExpenses: 12000, profitEstimate: 38000, unpaidInvoices: 5, inventoryValue: 10000, topCustomers: [] } }
    }).as("getOverview");`);
  return c;
});

console.log('Done!');
