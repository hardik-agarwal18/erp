describe("Customers Module", () => {
  beforeEach(() => {
    // Intercept API calls to mock backend behavior
    cy.intercept("GET", "**/api/v1/customers*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            { id: "cust-1", name: "Acme Corp", email: "contact@acme.com", phone: "123-456-7890" },
            { id: "cust-2", name: "Globex", email: "info@globex.com", phone: "098-765-4321" }
          ],
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
        }
      }
    }).as("getCustomers");

    cy.intercept("POST", "**/api/v1/customers", {
      statusCode: 201,
      body: {
        success: true,
        data: { id: "cust-3", name: "New Customer", email: "new@customer.com", phone: "555-1234" }
      }
    }).as("createCustomer");

    cy.intercept("DELETE", "**/api/v1/customers/*", {
      statusCode: 200,
      body: { success: true }
    }).as("deleteCustomer");

    // Mock active login state
    window.localStorage.setItem("activeOrganizationId", "org-1");
    
    // Visit customers page
    cy.visit("/customers");
  });

  it("loads and displays a list of customers", () => {
    cy.wait("@getCustomers");
    cy.contains("Acme Corp").should("be.visible");
    cy.contains("Globex").should("be.visible");
    cy.get("table").find("tr").should("have.length.at.least", 2);
  });

  it("can open the create customer modal and submit", () => {
    cy.contains("button", /add|create|new/i).click();
    
    // Assuming a modal or dialog pops up
    cy.get("input[name='name']").type("New Customer");
    cy.get("input[name='email']").type("new@customer.com");
    cy.get("input[name='phone']").type("555-1234");
    
    cy.contains("button", /save|submit|create/i).click();
    cy.wait("@createCustomer");
    
    // Validate success message or modal closure
    cy.contains(/success|created/i).should("be.visible");
  });

  it("can delete a customer", () => {
    cy.wait("@getCustomers");
    
    // Find the first delete button (assuming row actions)
    cy.get("table tr").eq(1).find("button").contains(/delete|remove|trash/i).click();
    
    // Assume there is a confirmation modal
    cy.contains("button", /confirm|yes|delete/i).click();
    cy.wait("@deleteCustomer");
    
    cy.contains(/deleted|removed/i).should("be.visible");
  });
});
