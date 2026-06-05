describe("Settings Module", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/v1/organizations*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            { id: "org-1", name: "Main Workspace", slug: "main-workspace" }
          ]
        }
      }
    }).as("getOrgs");

    cy.intercept("PUT", "**/api/v1/organizations/*", {
      statusCode: 200,
      body: {
        success: true,
        data: { id: "org-1", name: "Updated Workspace", slug: "updated-workspace" }
      }
    }).as("updateOrg");

    cy.intercept("GET", "**/api/v1/organizations/*/members", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          items: [
            { id: "mem-1", user: { name: "Alice", email: "alice@example.com" }, role: { name: "owner" } },
            { id: "mem-2", user: { name: "Bob", email: "bob@example.com" }, role: { name: "member" } }
          ]
        }
      }
    }).as("getMembers");

    cy.intercept("POST", "**/api/v1/invitations", {
      statusCode: 201,
      body: { success: true }
    }).as("inviteMember");

    window.localStorage.setItem("activeOrganizationId", "org-1");
    cy.visit("/settings");
  });

  it("loads organization details and allows update", () => {
    cy.wait("@getOrgs");
    
    // Assuming there's a general settings tab
    cy.get("input[name='name']").clear().type("Updated Workspace");
    cy.contains("button", /save|update/i).click();
    
    cy.wait("@updateOrg");
    cy.contains(/success|updated/i).should("be.visible");
  });

  it("lists members and allows inviting a new member", () => {
    cy.wait("@getMembers");
    cy.contains("Alice").should("be.visible");
    cy.contains("Bob").should("be.visible");

    // Click invite button
    cy.contains("button", /invite|add member/i).click();
    
    cy.get("input[type='email']").type("newmember@example.com");
    // Handle role select if present
    cy.contains("button", /send invite|invite/i).click();

    cy.wait("@inviteMember");
    cy.contains(/invited|sent/i).should("be.visible");
  });
});
