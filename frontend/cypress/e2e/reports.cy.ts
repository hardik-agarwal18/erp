describe("Reports Module", () => {
  beforeEach(() => {
    cy.intercept("POST", "**/api/v1/reports/export", {
      statusCode: 202,
      body: { success: true, data: { jobId: "job-1" } }
    }).as("exportReport");

    cy.intercept("GET", "**/api/v1/reports/export/job-1", {
      statusCode: 200,
      body: { success: true, data: { status: "queued", url: null } }
    }).as("checkExport");

    cy.mockSession();
    cy.visit("/reports");
  });

  it("loads report overview metrics", () => {
    // The reports view uses hardcoded data for now in the UI
    cy.contains("$145,500").should("be.visible");
    cy.contains("$64,200").should("be.visible");
  });

  it("triggers report export", () => {
    cy.contains("button", /generate/i).first().click();
    
    cy.wait("@exportReport");
    
    cy.contains(/queued|started|downloading/i).should("be.visible");
  });
});
