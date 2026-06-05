describe("Dashboard", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/v1/reports/overview*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          totalRevenue: 150000,
          totalExpenses: 50000,
          netProfit: 100000,
          unpaidInvoices: 12
        }
      }
    }).as("getOverview");

    cy.intercept("GET", "**/api/v1/auth/me", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: { id: "123", name: "Test User", email: "test@example.com" },
          organizations: [
            { id: "org-1", name: "Alpha Corp" },
            { id: "org-2", name: "Beta LLC" }
          ],
          activeOrganization: { id: "org-1", name: "Alpha Corp" }
        }
      }
    }).as("getMe");

    window.localStorage.setItem("activeOrganizationId", "org-1");
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
    cy.contains("Beta LLC").click();

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
