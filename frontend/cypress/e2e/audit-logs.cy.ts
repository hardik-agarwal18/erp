const testUser = { id: "123", name: "Test User", email: "test@example.com", organizations: [{ id: "org-1", name: "Test Org", slug: "test-org", role: "admin" }], activeOrganization: { id: "org-1", name: "Test Org", slug: "test-org", role: "admin" } };

describe("Audit Logs Module", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/v1/auth/me", {
      statusCode: 200,
      body: {
        success: true,
        data: testUser,
      },
    }).as("getMe");

    // Test user belongs to an org, assuming org id "test-org-123" is active workspace
    cy.intercept("GET", "**/api/v1/organizations/*/audit-logs*", {
      statusCode: 200,
      body: {
        success: true,
        data: [
            {
              id: "log-1",
              action: "USER_LOGIN",
              entityType: "Authentication",
              entityId: "auth-001",
              actor: { name: "Test User", email: "test@example.com" },
              ipAddress: "192.168.1.1",
              userAgent: "Mozilla/5.0",
              createdAt: "2026-06-06T08:00:00Z",
            },
            {
              id: "log-2",
              action: "CREATE_INVOICE",
              entityType: "Invoice",
              entityId: "inv-001",
              actor: { name: "Test User", email: "test@example.com" },
              ipAddress: "192.168.1.1",
              userAgent: "Mozilla/5.0",
              createdAt: "2026-06-06T09:30:00Z",
            },
        ],
      },
    }).as("getAuditLogs");

    cy.intercept("GET", "**/api/v1/permissions", {
      statusCode: 200,
      body: { success: true, data: [] }
    }).as("getPermissions");
    window.localStorage.setItem("pl.accessToken", "mock-token");
    window.localStorage.setItem("pl.activeOrganizationId", "org-1");
    cy.visit("/audit-logs");
  });

  it("loads and displays the audit logs for the organization", () => {
    cy.wait("@getAuditLogs");

    cy.contains(/audit logs/i).should("be.visible");

    // Check table contents
    cy.contains("USER LOGIN").should("be.visible");
    cy.contains("192.168.1.1").should("be.visible");

    cy.contains("CREATE INVOICE").should("be.visible");
    cy.contains("192.168.1.1").should("be.visible");
  });
});
