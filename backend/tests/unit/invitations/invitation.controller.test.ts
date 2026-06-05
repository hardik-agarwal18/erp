import { jest } from "@jest/globals";
import { Request, Response } from "express";

import { invitationController } from "../../../src/modules/invitations/invitation.controller.js";
import { invitationService } from "../../../src/modules/invitations/invitation.service.js";

jest.mock("../../../src/modules/invitations/invitation.service.js");

describe("invitationController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Partial<Response>;
  });

  it("should accept invitation", async () => {
    req.body = { token: "token123", name: "Test User", password: "password123" };
    (invitationService.acceptInvitation as jest.Mock).mockResolvedValue({ user: { id: "u1" } });

    await invitationController.acceptInvitation(req as Request, res as Response);

    expect(invitationService.acceptInvitation).toHaveBeenCalledWith("token123", "Test User", "password123");
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: "Invitation accepted", data: { user: { id: "u1" } } }));
  });
});
