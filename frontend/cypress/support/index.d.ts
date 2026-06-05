/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to seed a user via backend API and login.
     * Yields the seeded user details.
     */
    seedUserAndLogin(options?: { name?: string; email?: string; password?: string; isVerified?: boolean }): Chainable<any>;

    /**
     * Login programmatically via the backend API.
     */
    login(email: string, password?: string): Chainable<void>;

    /**
     * Seeds an organization for the currently logged in user.
     */
    seedOrganization(name: string): Chainable<any>;
  }
}
