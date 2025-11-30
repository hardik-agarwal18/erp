const testUser = { id: "123", name: "Test User", email: "test@example.com" };

describe("Onboarding Flow", () => {
  beforeEach(() => {
    // For onboarding, the user is authenticated but might not have a workspace yet.
    cy.intercept("GET", "**/api/v1/auth/me", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          ...testUser,
          organizations: [],
          activeOrganization: null
        },
      },
    }).as("getMeNoWorkspaces");

    cy.intercept("POST", "**/api/v1/organizations", {
      statusCode: 201,
      body: {
        success: true,
        data: {
          organization: {
            id: "new-org-1",
            name: "My New Startup",
            slug: "my-new-startup",
            createdAt: new Date().toISOString(),
          }
        }
      }
    }).as("createOrganization");

    // Once org is created, it might fetch me again or organizations
    cy.intercept("GET", "**/api/v1/organizations*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          organizations: [
            {
              id: "new-org-1",
              name: "My New Startup",
              role: "OWNER"
            }
          ]
        }
      }
    }).as("getOrganizations");
    
    // We mock the user switching to the new workspace
    cy.intercept("POST", "**/api/v1/auth/switch-workspace", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          accessToken: "mocked-jwt",
          workspaceId: "new-org-1"
        }
      }
    }).as("switchWorkspace");

    cy.intercept("GET", "**/api/v1/permissions", {
      statusCode: 200,
      body: { success: true, data: [] }
    }).as("getPermissions");

    window.localStorage.setItem("pl.accessToken", "mock-token");
    cy.visit("/onboarding");
  });

  it("allows a new user to create their first organization", () => {
    cy.wait("@getMeNoWorkspaces");

    cy.contains(/welcome/i).should("be.visible");
    cy.contains(/create workspace/i).should("be.visible").click();

    // The form should have an input for the organization name
    cy.get("input[name='name']").type("My New Startup");
    
    // Override getMe to return the newly created workspace when restoreSession is called
    cy.intercept("GET", "**/api/v1/auth/me", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          ...testUser,
          organizations: [{ id: "new-org-1", name: "My New Startup", slug: "my-new-startup", role: "OWNER" }],
          activeOrganization: { id: "new-org-1", name: "My New Startup", slug: "my-new-startup", role: "OWNER" }
        },
      },
    }).as("getMeWithWorkspaces");

    // Some onboarding flows have a slug or industry, we'll try to find submit
    cy.contains("button", /create|continue|submit/i).click();

    // Verify it called the API
    cy.wait("@createOrganization").its("request.body").should("deep.include", {
      name: "My New Startup",
    });

    // The app should redirect to dashboard after onboarding
    cy.url().should("include", "/dashboard", { timeout: 15000 });
  });
});
