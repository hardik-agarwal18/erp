describe("Invoices Module", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/v1/invoices*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            { id: "inv-1", invoiceNumber: "INV-0001", customer: { name: "Acme Corp" }, status: "DRAFT", totalAmount: 500 },
            { id: "inv-2", invoiceNumber: "INV-0002", customer: { name: "Globex" }, status: "ISSUED", totalAmount: 1200 }
          ],
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
        }
      }
    }).as("getInvoices");

    cy.intercept("GET", "**/api/v1/customers*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            { id: "cust-1", name: "Acme Corp" }
          ]
        }
      }
    }).as("getCustomers");

    cy.intercept("GET", "**/api/v1/products*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            { id: "prod-1", name: "Widget A", sellingPrice: 100 }
          ]
        }
      }
    }).as("getProducts");

    cy.intercept("POST", "**/api/v1/invoices", {
      statusCode: 201,
      body: {
        success: true,
        data: { id: "inv-3", invoiceNumber: "INV-0003", status: "DRAFT" }
      }
    }).as("createInvoice");

    window.localStorage.setItem("activeOrganizationId", "org-1");
    cy.visit("/invoices");
  });

  it("lists invoices with correct status badges", () => {
    cy.wait("@getInvoices");
    cy.contains("INV-0001").should("be.visible");
    cy.contains("DRAFT").should("be.visible");
    cy.contains("ISSUED").should("be.visible");
  });

  it("navigates to create invoice form and submits", () => {
    cy.wait("@getInvoices");
    cy.contains("a, button", /create|new invoice/i).click();

    cy.wait(["@getCustomers", "@getProducts"]);

    // The form should have customer selection, product selection, etc.
    // For mocked purposes, we interact with the form generically
    cy.get("form").within(() => {
      // Assuming there's a select or custom dropdown for customers
      // cy.get("select[name='customerId']").select("Acme Corp");
      
      // If it's a combobox, just click and select
      cy.get("input").first().type("Acme Corp{enter}");
      
      // Submit the invoice
      cy.contains("button", /save|create/i).click();
    });

    cy.wait("@createInvoice");
    cy.contains(/success|created/i).should("be.visible");
  });
});
