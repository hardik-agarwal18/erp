const testUser = { id: "123", name: "Test User", email: "test@example.com", organizations: [{ id: "org-1", name: "Test Org", slug: "test-org", role: "admin" }], activeOrganization: { id: "org-1", name: "Test Org", slug: "test-org", role: "admin" } };

describe("Transactions Module", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/v1/auth/me", {
      statusCode: 200,
      body: {
        success: true,
        data: testUser,
      },
    }).as("getMe");

    cy.intercept("GET", "**/api/v1/transactions*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            {
              id: "txn-1",
              type: "PAYMENT",
              referenceType: "Invoice",
              referenceId: "inv-1",
              amount: 1500.0,
              description: "Invoice INV-2026-001 Payment",
              createdAt: "2026-06-05T08:00:00Z",
            },
            {
              id: "txn-2",
              type: "EXPENSE",
              referenceType: "Receipt",
              referenceId: "exp-1",
              amount: 250.0,
              description: "Office Supplies Expense",
              createdAt: "2026-06-06T10:00:00Z",
            },
          ],
          total: 2,
          page: 1,
          limit: 100,
          totalPages: 1,
        },
      },
    }).as("getTransactions");

    cy.intercept("GET", "**/api/v1/permissions", {
      statusCode: 200,
      body: { success: true, data: [] }
    }).as("getPermissions");
    window.localStorage.setItem("pl.accessToken", "mock-token");
    window.localStorage.setItem("pl.activeOrganizationId", "org-1");
    cy.visit("/transactions");
  });

  it("loads and displays the general ledger transactions", () => {
    cy.wait("@getTransactions");

    cy.contains(/ledger/i).should("be.visible");

    // Check table contents
    cy.contains("Invoice INV-2026-001 Payment").should("be.visible");
    cy.contains("1,500.00").should("be.visible");

    cy.contains("Office Supplies Expense").should("be.visible");
    cy.contains("250.00").should("be.visible");
  });
});
