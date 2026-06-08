describe("Invoices Module", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/v1/invoices*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            { id: "inv-1", invoiceNumber: "INV-0001", customerId: "cust-1", customer: { name: "Acme Corp" }, totalAmount: 5000, paidAmount: 0, status: "paid", issueDate: new Date().toISOString() },
            { id: "inv-2", invoiceNumber: "INV-0002", customerId: "cust-2", customer: { name: "Global Industries" }, totalAmount: 3500, paidAmount: 0, status: "issued", issueDate: new Date().toISOString(), dueDate: new Date(Date.now() + 86400000 * 30).toISOString() }
          ],
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
        }
      }
    }).as("getInvoices");

    cy.intercept("GET", "**/api/v1/customers*", {
      statusCode: 200,
      body: {
        success: true,
        data: { items: [{ id: "cust-1", name: "Acme Corp" }] }
      }
    }).as("getCustomers");

    cy.intercept("GET", "**/api/v1/customers/cust-1/ledger", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          customer: { id: "cust-1", name: "Acme Corp", createdAt: new Date().toISOString() },
          invoices: [],
          payments: [],
          outstandingBalance: 0,
          creditBalance: 0
        }
      }
    }).as("getCustomerLedger");

    cy.intercept("GET", "**/api/v1/products*", {
      statusCode: 200,
      body: {
        success: true,
        data: { items: [{ id: "prod-1", name: "Widget A", sellingPrice: 100, type: "PHYSICAL", updatedAt: new Date().toISOString() }] }
      }
    }).as("getProducts");

    cy.intercept("GET", "**/api/v1/products/categories*", {
      statusCode: 200,
      body: { success: true, data: { items: [] } }
    }).as("getCategories");

    cy.intercept("GET", "**/api/v1/inventory/items*", {
      statusCode: 200,
      body: { success: true, data: { items: [] } }
    }).as("getInventory");

    cy.intercept("POST", "**/api/v1/invoices", {
      statusCode: 201,
      body: {
        success: true,
        data: { id: "inv-3", invoiceNumber: "INV-0003", status: "DRAFT" }
      }
    }).as("createInvoice");

    cy.mockSession();
    cy.visit("/invoices");
  });

  it("lists invoices with correct status badges", () => {
    cy.wait("@getInvoices");
    cy.contains("INV-0001").should("be.visible");
    cy.contains("paid").should("be.visible");
    cy.contains("sent").should("be.visible");
  });

  it("navigates to create invoice form", () => {
    cy.wait("@getInvoices");
    cy.visit("/invoices/create");
    cy.wait(["@getCustomers", "@getProducts"]);
    cy.contains(/Create Invoice|New Invoice/i).should("be.visible");

    // Basic interaction
    cy.get("select#invoice-customer").select("cust-1");
    cy.get("select#invoice-product").select("prod-1");
    cy.contains("button", /save|create/i).should("be.visible");
  });
});
