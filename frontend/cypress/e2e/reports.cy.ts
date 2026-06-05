describe("Reports Module", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/v1/reports/overview*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          totalRevenue: 50000,
          totalExpenses: 12000,
          netProfit: 38000,
          unpaidInvoices: 5
        }
      }
    }).as("getOverview");

    cy.intercept("GET", "**/api/v1/reports/sales*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          trends: [
            { date: "2026-01-01", revenue: 1000 },
            { date: "2026-02-01", revenue: 2000 }
          ]
        }
      }
    }).as("getSales");

    cy.intercept("POST", "**/api/v1/reports/export", {
      statusCode: 202,
      body: { success: true, message: "Export queued" }
    }).as("exportReport");

    window.localStorage.setItem("activeOrganizationId", "org-1");
    cy.visit("/reports");
  });

  it("loads report overview metrics", () => {
    cy.wait("@getOverview");
    cy.contains(/50,000|50000/).should("be.visible");
    cy.contains(/12,000|12000/).should("be.visible");
  });

  it("triggers report export", () => {
    cy.contains("button", /export|download/i).click();
    
    // Might have a dropdown to select report type
    // We assume the first export button just exports default overview/sales
    cy.wait("@exportReport");
    
    cy.contains(/queued|started|downloading/i).should("be.visible");
  });
});
