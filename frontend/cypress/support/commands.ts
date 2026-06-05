/// <reference types="cypress" />
import "./index.d.ts";

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
