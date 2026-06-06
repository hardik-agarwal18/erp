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

// 1. Fix expenses.cy.ts syntax errors
updateFile('expenses.cy.ts', (content) => {
  return content.replace(/\{ id: "exp-2"[^\}]+\}/g, '{ id: "exp-2", amount: 2500, category: "HARDWARE", vendorId: "v-2", expenseDate: new Date().toISOString(), createdAt: new Date().toISOString(), organizationId: "org-1", description: "Apple" }')
                .replace(/\{ id: "exp-1"[^\}]+\}/g, '{ id: "exp-1", amount: 150.50, category: "SOFTWARE", vendorId: "v-1", expenseDate: new Date().toISOString(), createdAt: new Date().toISOString(), organizationId: "org-1", description: "GitHub" }');
});

// 2. Fix invoices.cy.ts syntax errors
updateFile('invoices.cy.ts', (content) => {
  return content.replace(/\{ id: "inv-1"[^\}]+\}/g, '{ id: "inv-1", invoiceNumber: "INV-0001", customerId: "cust-1", customer: { name: "Acme Corp" }, totalAmount: 5000, paidAmount: 0, status: "PAID", issueDate: new Date().toISOString() }')
                .replace(/\{ id: "inv-2"[^\}]+\}/g, '{ id: "inv-2", invoiceNumber: "INV-0002", customerId: "cust-2", customer: { name: "Global Industries" }, totalAmount: 3500, paidAmount: 0, status: "ISSUED", issueDate: new Date().toISOString(), dueDate: new Date(Date.now() + 86400000 * 30).toISOString() }');
});

// 3. Fix customers.cy.ts ledger intercept
updateFile('customers.cy.ts', (content) => {
  return content.replace(/cy\.intercept\("GET", "\*\*\/api\/v1\/customers\/\*\/ledger\*", \{[\s\S]*?\}\);/, `cy.intercept("GET", "**/api/v1/customers/*/ledger*", (req) => {
      const isGlobex = req.url.includes("cust-2");
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: {
            customer: isGlobex 
              ? { id: "cust-2", name: "Globex", email: "info@globex.com", phone: "098-765-4321", createdAt: new Date().toISOString() }
              : { id: "cust-1", name: "Acme Corp", email: "contact@acme.com", createdAt: new Date().toISOString() },
            invoices: [], payments: [], outstandingBalance: 0, creditBalance: 0
          }
        }
      });
    });`);
});

// 4. Fix vendors.cy.ts ledger intercept
updateFile('vendors.cy.ts', (content) => {
  return content.replace(/cy\.intercept\("GET", "\*\*\/api\/v1\/vendors\/\*\/ledger\*", \{[\s\S]*?\}\);/, `cy.intercept("GET", "**/api/v1/vendors/*/ledger*", (req) => {
      const isOfficeDepot = req.url.includes("vendor-2");
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: {
            vendor: isOfficeDepot
              ? { id: "vendor-2", name: "Office Depot", email: "contact@officedepot.com", createdAt: new Date().toISOString() }
              : { id: "vendor-1", name: "Tech Supplies Co", email: "sales@techsupplies.com", createdAt: new Date().toISOString() },
            purchases: [], payments: [], outstandingBalance: 0, creditBalance: 0
          }
        }
      });
    });`);
});

// 5. Fix dashboard.cy.ts UI issue with select
updateFile('dashboard.cy.ts', (content) => {
  return content.replace(/cy\.get\("select"\)\.select\("org-2"\);/, 'cy.get("select").select("org-2", { force: true });');
});

// 6. Fix settings.cy.ts 404 issue
updateFile('settings.cy.ts', (content) => {
  return content.replace(/cy\.visit\("\/settings"\);/, 'cy.visit("/settings/organization");');
});

console.log("Done");
