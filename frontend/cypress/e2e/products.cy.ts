describe("Products Module", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/v1/products*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            { id: "prod-1", name: "Software License", type: "DIGITAL", sellingPrice: 299.99 },
            { id: "prod-2", name: "Office Chair", type: "PHYSICAL", sellingPrice: 150.00 }
          ],
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
        }
      }
    }).as("getProducts");

    cy.intercept("POST", "**/api/v1/products", {
      statusCode: 201,
      body: {
        success: true,
        data: { id: "prod-3", name: "New Product", sellingPrice: 50 }
      }
    }).as("createProduct");

    window.localStorage.setItem("activeOrganizationId", "org-1");
    cy.visit("/products");
  });

  it("shows products in a list or table", () => {
    cy.wait("@getProducts");
    cy.contains("Software License").should("be.visible");
    cy.contains("Office Chair").should("be.visible");
    cy.contains("299.99").should("be.visible");
  });

  it("allows creating a new product", () => {
    cy.contains("button", /add|create|new/i).click();
    
    cy.get("input[name='name']").type("New Product");
    cy.get("input[name='sellingPrice']").type("50");
    
    cy.contains("button", /save|submit|create/i).click();
    cy.wait("@createProduct");
    
    cy.contains(/success|created/i).should("be.visible");
  });
});
