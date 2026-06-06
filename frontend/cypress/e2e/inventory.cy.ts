const testUser = { id: "123", name: "Test User", email: "test@example.com", organizations: [{ id: "org-1", name: "Test Org", slug: "test-org", role: "admin" }], activeOrganization: { id: "org-1", name: "Test Org", slug: "test-org", role: "admin" } };

describe("Inventory Module", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/v1/auth/me", {
      statusCode: 200,
      body: {
        success: true,
        data: testUser,
      },
    }).as("getMe");

    cy.intercept("GET", "**/api/v1/inventory/items*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            {
              id: "inv-1",
              productId: "prod-1",
              quantity: 150,
              reorderLevel: 50,
              updatedAt: new Date().toISOString(),
              product: {
                id: "prod-1",
                name: "Ergonomic Office Chair",
                sku: "FURN-CHAIR-001",
                category: { name: "Furniture" },
                sellingPrice: 299.99,
              },
            },
            {
              id: "inv-2",
              productId: "prod-2",
              quantity: 10,
              reorderLevel: 20,
              updatedAt: new Date().toISOString(),
              product: {
                id: "prod-2",
                name: "Wireless Mouse",
                sku: "ELEC-MOUSE-002",
                category: { name: "Electronics" },
                sellingPrice: 49.99,
              },
            },
          ],
          total: 2,
          page: 1,
          limit: 100,
          totalPages: 1,
        },
      },
    }).as("getInventoryItems");

    cy.intercept("GET", "**/api/v1/inventory/movements*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            {
              id: "mov-1",
              productId: "prod-1",
              type: "ADJUSTMENT",
              quantity: 5,
              referenceId: "Lost in transit",
              createdAt: new Date().toISOString(),
              product: {
                id: "prod-1",
                name: "Ergonomic Office Chair",
                sku: "FURN-CHAIR-001",
              },
            },
            {
              id: "mov-2",
              productId: "prod-2",
              type: "TRANSFER",
              quantity: -10,
              referenceId: "WH1-WH2",
              createdAt: new Date().toISOString(),
              product: {
                id: "prod-2",
                name: "Wireless Mouse",
                sku: "ELEC-MOUSE-002",
              },
            },
          ],
          total: 2,
          page: 1,
          limit: 100,
          totalPages: 1,
        },
      },
    }).as("getInventoryMovements");

    cy.intercept("GET", "**/api/v1/permissions", {
      statusCode: 200,
      body: { success: true, data: [] }
    }).as("getPermissions");
    window.localStorage.setItem("pl.accessToken", "mock-token");
    window.localStorage.setItem("pl.activeOrganizationId", "org-1");
    cy.visit("/inventory");
  });

  it("displays the inventory overview and list of tracked items", () => {
    cy.wait(["@getInventoryItems", "@getInventoryMovements"]);

    cy.contains(/inventory dashboard/i).should("be.visible");
    
    // Check metric cards
    cy.contains("Tracked Items").parent().contains("2").should("be.visible");
    cy.contains("Low Stock").parent().contains("1").should("be.visible"); // Wireless Mouse has 10, reorder level 20

    // Check table
    cy.contains("Ergonomic Office Chair").should("be.visible");
    cy.contains("FURN-CHAIR-001").should("be.visible");
    cy.contains("150").should("exist");
    
    cy.contains("Wireless Mouse").should("be.visible");
    cy.contains("ELEC-MOUSE-002").should("be.visible");
  });
});
