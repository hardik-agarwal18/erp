import { jest } from "@jest/globals";
import { Request, Response } from "express";

import { organizationController } from "../../../src/domains/iam/organizations/organization.controller.js";
import { organizationService } from "../../../src/domains/iam/organizations/organization.service.js";

jest.mock("../../../src/domains/iam/organizations/organization.service.js");

// We must mock auditRepository locally inside the test because it's dynamically imported in the controller
jest.mock("../../../src/services/audit/audit.repository.js", () => ({
  auditRepository: {
    listOrganizationLogs: jest.fn(),
  }
}));

describe("organizationController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      user: { id: "u1" } as any,
      member: { roleName: "admin" } as any,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Partial<Response>;
  });

  it("should create organization", async () => {
    req.body = { name: "Test Org" };
    (organizationService.createOrganization as jest.Mock).mockResolvedValue({ id: "o1", name: "Test Org" });

    await organizationController.createOrganization(req as Request, res as Response);

    expect(organizationService.createOrganization).toHaveBeenCalledWith("u1", req.body);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { id: "o1", name: "Test Org" } }));
  });

  it("should list organizations", async () => {
    (organizationService.listOrganizations as jest.Mock).mockResolvedValue([{ id: "o1" }]);

    await organizationController.listOrganizations(req as Request, res as Response);

    expect(organizationService.listOrganizations).toHaveBeenCalledWith("u1");
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [{ id: "o1" }] }));
  });

  it("should get organization", async () => {
    req.params = { id: "o1" };
    (organizationService.getOrganization as jest.Mock).mockResolvedValue({ id: "o1" });

    await organizationController.getOrganization(req as Request, res as Response);

    expect(organizationService.getOrganization).toHaveBeenCalledWith("o1");
  });

  it("should update organization", async () => {
    req.params = { id: "o1" };
    req.body = { name: "Updated" };
    (organizationService.updateOrganization as jest.Mock).mockResolvedValue({ id: "o1", name: "Updated" });

    await organizationController.updateOrganization(req as Request, res as Response);

    expect(organizationService.updateOrganization).toHaveBeenCalledWith("o1", "u1", req.body);
  });

  it("should delete organization", async () => {
    req.params = { id: "o1" };
    await organizationController.deleteOrganization(req as Request, res as Response);
    expect(organizationService.deleteOrganization).toHaveBeenCalledWith("o1", "u1");
  });

  it("should list members", async () => {
    req.params = { id: "o1" };
    (organizationService.listMembers as jest.Mock).mockResolvedValue([{ id: "m1" }]);
    await organizationController.listMembers(req as Request, res as Response);
    expect(organizationService.listMembers).toHaveBeenCalledWith("o1");
  });

  it("should list audit logs", async () => {
    req.params = { id: "o1" };
    const { auditRepository } = await import("../../../src/services/audit/audit.repository.js");
    (auditRepository.listOrganizationLogs as jest.Mock).mockResolvedValue([{ id: "log1" }]);

    await organizationController.listAuditLogs(req as Request, res as Response);

    expect(auditRepository.listOrganizationLogs).toHaveBeenCalledWith("o1", req.query);
  });

  it("should invite member", async () => {
    req.params = { id: "o1" };
    req.body = { email: "test@example.com" };
    (organizationService.inviteMember as jest.Mock).mockResolvedValue({ id: "inv1" });

    await organizationController.inviteMember(req as Request, res as Response);

    expect(organizationService.inviteMember).toHaveBeenCalledWith("o1", "u1", req.body);
  });

  it("should update member role", async () => {
    req.params = { id: "o1", memberId: "m1" };
    req.body = { roleId: "r1" };

    await organizationController.updateMemberRole(req as Request, res as Response);

    expect(organizationService.updateMemberRole).toHaveBeenCalledWith("o1", "m1", "u1", "admin", "r1");
  });

  it("should remove member", async () => {
    req.params = { id: "o1", memberId: "m1" };

    await organizationController.removeMember(req as Request, res as Response);

    expect(organizationService.removeMember).toHaveBeenCalledWith("o1", "m1", "u1", "admin");
  });

  it("should leave organization", async () => {
    req.params = { id: "o1" };
    await organizationController.leaveOrganization(req as Request, res as Response);
    expect(organizationService.leaveOrganization).toHaveBeenCalledWith("o1", "u1");
  });

  it("should transfer ownership", async () => {
    req.params = { id: "o1" };
    req.body = { memberId: "m2" };
    await organizationController.transferOwnership(req as Request, res as Response);
    expect(organizationService.transferOwnership).toHaveBeenCalledWith("o1", "u1", "m2");
  });

  it("should accept invitation", async () => {
    req.body = { token: "token123", password: "pwd", name: "User" };
    (organizationService.acceptInvitation as jest.Mock).mockResolvedValue({ membershipId: "m1" });

    await organizationController.acceptInvitation(req as Request, res as Response);

    expect(organizationService.acceptInvitation).toHaveBeenCalledWith("token123", "pwd", "User");
  });
});
