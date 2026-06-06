describe("Authentication Flows", () => {
  beforeEach(() => {
    // Clear cookies/local storage to start fresh
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe("Login", () => {
    it("shows validation errors for empty fields", () => {
      cy.visit("/login");
      cy.get("button[type='submit']").click();
      
      // Depending on the UI library, form validation messages will appear
      cy.contains(/invalid email|required/i).should("be.visible");
      cy.contains(/password.*required/i).should("be.visible");
    });

    it("logs in successfully with valid credentials", () => {
      // For this to pass, we need an actual user. Cypress can intercept or try to create one.
      // We will mock the API response for deterministic UI testing.
      cy.intercept("POST", "**/api/v1/auth/login", {
        statusCode: 200,
        body: {
          success: true,
          data: {
            accessToken: "mock-token",
            user: { id: "123", email: "test@example.com", name: "Test User" },
            organizations: [{ id: "org-1", name: "Test Org" }],
            activeOrganization: { id: "org-1", name: "Test Org" }
          }
        }
      }).as("loginRequest");

      cy.intercept("GET", "**/api/v1/auth/me", {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: "123", email: "test@example.com", name: "Test User", isVerified: true,
            organizations: [{ id: "org-1", name: "Test Org", slug: "test-org", role: "admin", membershipId: "m1", roleId: "r1", logo: null }],
            activeOrganization: { id: "org-1", name: "Test Org", slug: "test-org", role: "admin", membershipId: "m1", roleId: "r1", logo: null }
          }
        }
      }).as("meRequest");

      cy.intercept("GET", "**/api/v1/permissions", {
        statusCode: 200,
        body: {
          success: true,
          data: [{ id: "p1", name: "test.permission", description: "Test" }]
        }
      }).as("permissionsRequest");

      cy.visit("/login");
      cy.get("input[type='email']").type("test@example.com");
      cy.get("input[type='password']").type("Password123!");
      cy.get("button[type='submit']").click();

      cy.wait("@loginRequest");
      cy.wait("@meRequest");
      
      // Should redirect to dashboard (can take longer in dev mode to compile)
      cy.url({ timeout: 45000 }).should("include", "/dashboard");
    });

    it("displays error message for invalid credentials", () => {
      cy.intercept("POST", "**/api/v1/auth/login", {
        statusCode: 401,
        body: { success: false, message: "Invalid email or password" }
      }).as("loginRequestFailed");

      cy.visit("/login");
      cy.get("input[type='email']").type("wrong@example.com");
      cy.get("input[type='password']").type("WrongPass!");
      cy.get("button[type='submit']").click();

      cy.wait("@loginRequestFailed");
      cy.contains(/invalid email or password/i).should("be.visible");
    });
  });

  describe("Signup", () => {
    it("successfully submits signup form", () => {
      cy.intercept("POST", "**/api/v1/auth/signup", {
        statusCode: 201,
        body: { success: true, message: "Verification email sent" }
      }).as("signupRequest");

      cy.visit("/signup");
      cy.get("input[name='name']").type("New User");
      cy.get("input[name='email']").type("newuser@example.com");
      cy.get("input[name='password']").type("StrongPass123!");
      cy.get("button[type='submit']").click();

      cy.wait("@signupRequest");
      // UI might redirect to a 'verify email' screen or show a success toast
      cy.contains(/verification|check your email/i).should("be.visible");
    });
  });
});
