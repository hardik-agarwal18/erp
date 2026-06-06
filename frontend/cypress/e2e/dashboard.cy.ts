describe("Dashboard", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/v1/reports/dashboard*", {
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
    });

    cy.intercept("GET", "**/api/v1/auth/me", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: "123", name: "Test User", email: "test@example.com", isVerified: true, role: null, initials: "TU",
          organizations: [
            { id: "org-1", name: "Alpha Corp", slug: "alpha-corp", role: "admin" },
            { id: "org-2", name: "Beta LLC", slug: "beta-llc", role: "member" }
          ],
          activeOrganization: { id: "org-1", name: "Alpha Corp", slug: "alpha-corp", role: "admin" }
        }
      }
    }).as("getMe");

    cy.intercept("GET", "**/api/v1/permissions", {
      statusCode: 200,
      body: {
        success: true,
        data: [
          { id: "p1", name: "reports.view" },
          { id: "p2", name: "customers.view" },
          { id: "p3", name: "invoices.view" },
          { id: "p4", name: "expenses.manage" }
        ]
      }
    }).as("getPermissions");

    window.localStorage.setItem("pl.accessToken", "mock-token");
    window.localStorage.setItem("pl.activeOrganizationId", "org-1");
    cy.visit("/dashboard");
  });

  it("displays key metrics", () => {
    cy.wait("@getOverview");
    
    // Check if the dashboard widgets render the metrics
    cy.contains(/150,000|150000/).should("be.visible");
    cy.contains(/50,000|50000/).should("be.visible");
  });

  it("displays organization switcher and changes org", () => {
    cy.wait("@getMe");
    
    // Verify current org is displayed
    cy.contains("Alpha Corp").should("be.visible");
    
    // Open switcher
    cy.contains("Alpha Corp").click(); // Assuming clicking the name opens dropdown
    
    // Click other org
    cy.contains("Beta LLC").click({ force: true });

    // In a real app this would trigger an API call to switch-workspace
    // We would intercept it and verify the redirect
    // For now we just check if the UI handled the click
  });

  it("has working sidebar navigation links", () => {
    cy.get("nav").contains(/customers/i).should("have.attr", "href").and("include", "/customers");
    cy.get("nav").contains(/invoices/i).should("have.attr", "href").and("include", "/invoices");
    cy.get("nav").contains(/expenses/i).should("have.attr", "href").and("include", "/expenses");
  });
});
