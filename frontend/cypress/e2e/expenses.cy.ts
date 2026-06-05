describe("Expenses Module", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/v1/expenses*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            { id: "exp-1", amount: 150.50, category: "SOFTWARE", vendor: { name: "GitHub" }, expenseDate: new Date().toISOString() },
            { id: "exp-2", amount: 2500, category: "HARDWARE", vendor: { name: "Apple" }, expenseDate: new Date().toISOString() }
          ],
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
        }
      }
    }).as("getExpenses");

    cy.intercept("GET", "**/api/v1/vendors*", {
      statusCode: 200,
      body: {
        success: true,
        data: { items: [{ id: "vendor-1", name: "GitHub" }] }
      }
    }).as("getVendors");

    cy.intercept("POST", "**/api/v1/expenses", {
      statusCode: 201,
      body: {
        success: true,
        data: { id: "exp-3" }
      }
    }).as("createExpense");

    window.localStorage.setItem("activeOrganizationId", "org-1");
    cy.visit("/expenses");
  });

  it("lists expenses with amounts and categories", () => {
    cy.wait("@getExpenses");
    cy.contains("150.50").should("be.visible");
    cy.contains("SOFTWARE").should("be.visible");
    cy.contains("2500").should("be.visible");
    cy.contains("HARDWARE").should("be.visible");
  });

  it("navigates to create expense form and submits", () => {
    cy.contains("button, a", /add|create|new/i).click();
    
    cy.wait("@getVendors");

    // Generic form interaction
    cy.get("input[name='amount'], input[type='number']").first().type("50");
    // Handle category select/dropdown generically or just type if it's input
    cy.get("input").last().type("MEALS{enter}");
    
    cy.contains("button", /save|submit|create/i).click();
    cy.wait("@createExpense");
    
    cy.contains(/success|created/i).should("be.visible");
  });
});
