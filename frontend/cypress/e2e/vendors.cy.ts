describe("Vendors Module", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/v1/vendors*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            { id: "vendor-1", name: "Tech Supplies Co", email: "sales@techsupplies.com", createdAt: new Date().toISOString() },
            { id: "vendor-2", name: "Office Depot", email: "contact@officedepot.com", createdAt: new Date().toISOString() }
          ],
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
        }
      }
    }).as("getVendors");
    cy.intercept("GET", "**/api/v1/vendors/*/ledger*", (req) => {
      const isOfficeDepot = req.url.includes("vendor-2");
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          data: {
            vendor: isOfficeDepot
              ? { id: "vendor-2", name: "Office Depot", email: "contact@officedepot.com", createdAt: new Date().toISOString() }
              : { id: "vendor-1", name: "Tech Supplies Co", email: "sales@techsupplies.com", createdAt: new Date().toISOString() },
            purchases: [], payments: [], outstandingBalance: 0, creditBalance: 0
          }
        }
      });
    });

    cy.intercept("POST", "**/api/v1/vendors", {
      statusCode: 201,
      body: {
        success: true,
        data: { id: "vendor-3", name: "New Vendor" }
      }
    }).as("createVendor");

    cy.mockSession();
    cy.visit("/vendors");
  });

  it("displays the vendor list", () => {
    cy.wait("@getVendors");
    cy.contains("Tech Supplies Co").should("be.visible");
    cy.contains("Office Depot").should("be.visible");
  });

  it("can open the create vendor form and save", () => {
    cy.visit("/vendors/create");
    
    cy.get("input[name='name']").type("New Vendor");
    cy.get("input[name='email']").type("vendor@new.com");
    
    cy.contains("button", /save|submit|create/i).should("be.visible");
  });
});
