/// <reference types="cypress" />
Cypress.Commands.add("login", (email, password = "Password123!") => {
  const apiUrl = Cypress.env("apiUrl");

  cy.request({
    method: "POST",
    url: `${apiUrl}/api/v1/auth/login`,
    body: { email, password },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200) {
      // API automatically sets HttpOnly cookies. We might need to manually set 
      // the organizationId in localStorage since frontend depends on it.
      const data = response.body.data;
      if (data && data.activeOrganization) {
        window.localStorage.setItem("activeOrganizationId", data.activeOrganization.id);
      }
    }
  });
});

Cypress.Commands.add("seedUserAndLogin", (options = {}) => {
  const apiUrl = Cypress.env("apiUrl");
  const uniqueId = new Date().getTime();
  const name = options.name || `E2E User ${uniqueId}`;
  const email = options.email || `e2e${uniqueId}@example.com`;
  const password = options.password || "Password123!";

  // Usually this would require a dedicated test seeding endpoint, 
  // but we can try to use standard signup.
  return cy.request({
    method: "POST",
    url: `${apiUrl}/api/v1/auth/signup`,
    body: { name, email, password },
    failOnStatusCode: false,
  }).then((res) => {
    // Note: since the user starts out as unverified, in a real environment
    // we'd need a backend bypass. Assuming the test environment allows login 
    // or auto-verifies. If we need a bypass, the backend should provide a test route.
    return cy.login(email, password).then(() => {
      return { id: res.body?.data?.id, name, email, password };
    });
  });
});

Cypress.Commands.add("seedOrganization", (name) => {
  const apiUrl = Cypress.env("apiUrl");
  return cy.request({
    method: "POST",
    url: `${apiUrl}/api/v1/organizations`,
    body: { name },
    // WithHttpOnly cookies sent automatically by Cypress to matching domains
  }).then((res) => {
    return res.body.data;
  });
});

Cypress.Commands.add("mockSession", () => {
  // Set tokens so apiClient skips refresh
  window.localStorage.setItem("pl.accessToken", "mock-token");
  window.localStorage.setItem("pl.activeOrganizationId", "org-1");

  cy.intercept("GET", "**/api/v1/auth/me", {
    statusCode: 200,
    body: {
      success: true,
      data: {
        id: "user-1", name: "Test User", email: "test@example.com", isVerified: true,
        organizations: [{ id: "org-1", name: "Test Org", slug: "test-org", role: "admin", membershipId: "m1", roleId: "r1", logo: null }],
        activeOrganization: { id: "org-1", name: "Test Org", slug: "test-org", role: "admin", membershipId: "m1", roleId: "r1", logo: null }
      }
    }
  }).as("mockMe");

  cy.intercept("GET", "**/api/v1/permissions", {
    statusCode: 200,
    body: {
      success: true,
      data: [
        { id: "p1", name: "customers.view" },
        { id: "p2", name: "customers.create" },
        { id: "p3", name: "customers.update" },
        { id: "p4", name: "vendors.view" },
        { id: "p5", name: "vendors.create" },
        { id: "p6", name: "vendors.update" },
        { id: "p7", name: "invoices.view" },
        { id: "p8", name: "invoices.create" },
        { id: "p9", name: "invoices.update" },
        { id: "p10", name: "inventory.manage" },
        { id: "p11", name: "expenses.manage" },
        { id: "p12", name: "products.manage" },
        { id: "p13", name: "transactions.view" },
        { id: "p14", name: "reports.view" },
        { id: "p15", name: "organizations.manage" },
        { id: "p16", name: "audit_logs.view" },
        { id: "p17", name: "invoices.manage" },
        { id: "p18", name: "organization.view" },
        { id: "p19", name: "organization.update" },
        { id: "p20", name: "member.view" },
        { id: "p21", name: "member.invite" },
        { id: "p22", name: "member.update" },
        { id: "p23", name: "member.remove" }
      ]
    }
  }).as("mockPermissions");
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password?: string): Chainable<void>;
      seedUserAndLogin(options?: any): Chainable<any>;
      seedOrganization(name: string): Chainable<any>;
      mockSession(): Chainable<void>;
    }
  }
}
