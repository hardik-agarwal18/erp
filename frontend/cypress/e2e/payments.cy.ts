const testUser = { id: "123", name: "Test User", email: "test@example.com", organizations: [{ id: "org-1", name: "Test Org", slug: "test-org", role: "admin" }], activeOrganization: { id: "org-1", name: "Test Org", slug: "test-org", role: "admin" } };

describe("Payments Module", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/v1/auth/me", {
      statusCode: 200,
      body: {
        success: true,
        data: testUser,
      },
    }).as("getMe");

    cy.intercept("GET", "**/api/v1/payments*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            {
              id: "pay-1",
              organizationId: "org-1",
              invoiceId: "inv-1",
              amount: 1500.0,
              paymentMethod: "CREDIT_CARD",
              paymentDate: "2026-06-05T10:00:00Z",
              reference: "TXN-7890123",
              createdAt: "2026-06-05T10:00:00Z",
              invoice: {
                invoiceNumber: "INV-2026-001",
                customerId: "cust-1",
                customer: {
                  name: "Acme Corp",
                },
              },
            },
            {
              id: "pay-2",
              organizationId: "org-1",
              invoiceId: "inv-2",
              amount: 350.5,
              paymentMethod: "BANK_TRANSFER",
              paymentDate: "2026-06-06T14:30:00Z",
              reference: "WIRE-456",
              createdAt: "2026-06-06T14:30:00Z",
              invoice: {
                invoiceNumber: "INV-2026-002",
                customerId: "cust-2",
                customer: {
                  name: "Globex Corporation",
                },
              },
            },
          ],
          total: 2,
          page: 1,
          limit: 100,
          totalPages: 1,
        },
      },
    }).as("getPayments");

    cy.intercept("GET", "**/api/v1/permissions", {
      statusCode: 200,
      body: { success: true, data: [] }
    }).as("getPermissions");
    window.localStorage.setItem("pl.accessToken", "mock-token");
    window.localStorage.setItem("pl.activeOrganizationId", "org-1");
    cy.visit("/payments");
  });

  it("loads and displays a list of payments", () => {
    cy.wait("@getPayments");

    cy.contains(/payment management/i).should("be.visible");
    cy.contains("Total Payments").parent().contains("2").should("be.visible");

    // Check table contents
    cy.contains("Acme Corp").should("be.visible");
    cy.contains("INV-2026-001").should("be.visible");

    cy.contains("Globex Corporation").should("be.visible");
    cy.contains("INV-2026-002").should("be.visible");
  });

  it("filters the payments list using the search bar", () => {
    cy.wait("@getPayments");

    cy.get("input[placeholder*='Search']").type("Acme");
    cy.contains("INV-2026-001").should("be.visible");
    cy.contains("INV-2026-002").should("not.exist");
  });
});
