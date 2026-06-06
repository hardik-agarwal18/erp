describe("Expenses Module", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/v1/expenses*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            { id: "exp-1", amount: 150.50, category: "SOFTWARE", vendorId: "v-1", expenseDate: new Date().toISOString(), createdAt: new Date().toISOString(), organizationId: "org-1", description: "GitHub" },
            { id: "exp-2", amount: 2500, category: "HARDWARE", vendorId: "v-2", expenseDate: new Date().toISOString(), createdAt: new Date().toISOString(), organizationId: "org-1", description: "Apple" }
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
        data: { id: "exp-3", amount: 50, category: "MEALS", expenseDate: "2023-10-10", createdAt: "2023-10-10T00:00:00.000Z", organizationId: "org-1" }
      }
    }).as("createExpense");

    cy.mockSession();
    cy.visit("/expenses");
  });

  it("lists expenses with amounts and categories", () => {
    cy.wait("@getExpenses");
    cy.contains("150.50").should("be.visible");
    cy.contains("SOFTWARE").should("be.visible");
    cy.contains(/2,500|2500/).should("be.visible");
    cy.contains("HARDWARE").should("be.visible");
  });

  it("navigates to create expense form", () => {
    cy.visit("/expenses/create");
    
    // Generic form interaction
    cy.get("input[name='amount'], input[type='number']").first().type("50");
    cy.get("input").last().type("MEALS{enter}");
    
    // Just verify the save button is there
    cy.contains("button", /save|submit|create/i).should("be.visible");
  });
});
