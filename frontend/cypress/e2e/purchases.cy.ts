const testUser = { id: "123", name: "Test User", email: "test@example.com", organizations: [{ id: "org-1", name: "Test Org", slug: "test-org", role: "admin" }], activeOrganization: { id: "org-1", name: "Test Org", slug: "test-org", role: "admin" } };

describe("Purchases Module", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/v1/auth/me", {
      statusCode: 200,
      body: {
        success: true,
        data: testUser,
      },
    }).as("getMe");

    cy.intercept("GET", "**/api/v1/permissions", {
      statusCode: 200,
      body: { success: true, data: [] }
    }).as("getPermissions");
    window.localStorage.setItem("pl.accessToken", "mock-token");
    window.localStorage.setItem("pl.activeOrganizationId", "org-1");
    cy.visit("/purchases");
  });

  it("shows an unavailable state because the backend is not implemented", () => {
    cy.contains(/coming soon/i).should("be.visible");
  });
});
