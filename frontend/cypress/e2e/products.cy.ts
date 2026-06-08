describe("Products Module", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/v1/products*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            { id: "prod-1", name: "Software License", type: "SERVICE", sellingPrice: 299.99, updatedAt: new Date().toISOString() },
            { id: "prod-2", name: "Office Chair", type: "PHYSICAL", sellingPrice: 150.00, updatedAt: new Date().toISOString() }
          ],
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
        }
      }
    }).as("getProducts");

    cy.intercept("GET", "**/api/v1/products/categories*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            { id: "cat-1", name: "Software", description: "Digital goods" }
          ],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
        }
      }
    });

    cy.intercept("GET", "**/api/v1/inventory/items*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 1 }
        }
      }
    });

    cy.intercept("POST", "**/api/v1/products", {
      statusCode: 201,
      body: {
        success: true,
        data: { id: "prod-3", name: "New Product", sellingPrice: 50 }
      }
    }).as("createProduct");

    cy.mockSession();
    cy.visit("/products");
  });

  it("shows products in a list or table", () => {
    cy.wait("@getProducts");
    cy.contains("Software License").should("be.visible");
    cy.contains("Office Chair").should("be.visible");
    cy.contains("299.99").should("be.visible");
  });

  it("allows creating a new product", () => {
    cy.visit("/products/create");
    
    cy.get("input[name='name']").type("New Product");
    cy.get("input[name='salePrice']").type("50");
    
    cy.contains("button", /save|submit|create/i).should("be.visible");
  });
});
