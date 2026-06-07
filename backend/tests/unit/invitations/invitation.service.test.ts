import { jest } from "@jest/globals";

// Mocking dependencies
import { organizationService } from "../../../src/modules/organizations/organization.service.js";

jest.mock("../../../src/modules/organizations/organization.service.js");

import { invitationService } from "../../../src/modules/invitations/invitation.service.js";

describe("invitationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("acceptInvitation", () => {
    it("should accept invitation using organizationService", async () => {
      (organizationService.acceptInvitation as jest.Mock).mockResolvedValue({ user: { id: "u1" } });

      const result = await invitationService.acceptInvitation("token123", "Test User", "password123");

      expect(organizationService.acceptInvitation).toHaveBeenCalledWith("token123", "password123", "Test User");
      expect(result.user.id).toBe("u1");
    });
  });
});
