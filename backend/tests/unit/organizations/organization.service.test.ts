import { jest } from "@jest/globals";

// Mocking dependencies
import { organizationRepository } from "../../../src/modules/organizations/organization.repository.js";
import { authRepository } from "../../../src/modules/auth/auth.repository.js";
import { sendInvitationEmail } from "../../../src/services/mail/index.js";
import { auditService } from "../../../src/services/audit/index.js";
import { clearMemberPermissionCache, clearMembersPermissionCache } from "../../../src/shared/utils/permissions.js";
import { slugify } from "../../../src/shared/utils/slug.js";

jest.mock("../../../src/modules/organizations/organization.repository.js");
jest.mock("../../../src/modules/auth/auth.repository.js");
jest.mock("../../../src/services/mail/index.js");
jest.mock("../../../src/shared/utils/permissions.js");
jest.mock("../../../src/shared/utils/slug.js");

jest.mock("../../../src/services/audit/index.js", () => ({
  AUDIT_ACTIONS: {
    ORGANIZATION_CREATED: "org.created",
    ORGANIZATION_UPDATED: "org.updated",
    INVITATION_SENT: "invitation.sent",
    ORGANIZATION_MEMBER_ROLE_UPDATED: "org.role_updated",
    ORGANIZATION_MEMBER_REMOVED: "org.member_removed",
    ORGANIZATION_LEFT: "org.left",
    ORGANIZATION_OWNERSHIP_TRANSFERRED: "org.ownership_transferred",
    INVITATION_ACCEPTED: "invitation.accepted",
  },
  AUDIT_ENTITY_TYPES: {
    ORGANIZATION: "organization",
    INVITATION: "invitation",
    ORGANIZATION_MEMBER: "organization_member",
  },
  auditService: {
    record: jest.fn(),
  }
}));

// Mock Prisma
jest.mock("../../../src/config/database.js", () => {
  const mockTx = {
    organization: { create: jest.fn(), update: jest.fn() },
    permission: { createMany: jest.fn(), findMany: jest.fn() },
    role: { create: jest.fn() },
    rolePermission: { createMany: jest.fn() },
    organizationMember: { create: jest.fn(), update: jest.fn() },
    invitation: { update: jest.fn() },
  };
  return {
    __esModule: true,
    default: {
      $transaction: jest.fn(async (cb: any) => cb(mockTx)),
      organization: { update: jest.fn(), delete: jest.fn() },
      organizationMember: { update: jest.fn(), delete: jest.fn() },
      invitation: { create: jest.fn() },
    },
    prisma: {
      $transaction: jest.fn(async (cb: any) => cb(mockTx)),
      organization: { update: jest.fn(), delete: jest.fn() },
      organizationMember: { update: jest.fn(), delete: jest.fn() },
      invitation: { create: jest.fn() },
    }
  };
});

import { organizationService } from "../../../src/modules/organizations/organization.service.js";
import ApiError from "../../../src/utils/ApiError.js";
import prisma from "../../../src/config/database.js";

describe("organizationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createOrganization", () => {
    it("should throw 400 if slug cannot be built", async () => {
      (slugify as jest.Mock).mockReturnValue("");
      await expect(organizationService.createOrganization("u1", { name: "Org" })).rejects.toThrow(ApiError);
    });

    it("should create organization and return it with membership details", async () => {
      (slugify as jest.Mock).mockReturnValue("org-slug");
      (organizationRepository.findBySlug as jest.Mock).mockResolvedValue(null);
      (authRepository.findMembership as jest.Mock).mockResolvedValue({ id: "m1", role: { name: "owner" } });

      let capturedTx: any;
      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (cb: any) => {
        capturedTx = {
          organization: { create: jest.fn().mockResolvedValue({ id: "o1", name: "Org", slug: "org-slug" }) },
          permission: {
            createMany: jest.fn(),
            findMany: jest.fn().mockResolvedValue([{ id: "p1", name: "admin.full" }]),
          },
          role: { create: jest.fn().mockResolvedValue({ id: "r1", name: "owner" }) },
          rolePermission: { createMany: jest.fn() },
          organizationMember: { create: jest.fn() },
        };
        return cb(capturedTx);
      });

      const result = await organizationService.createOrganization("u1", { name: "Org" });

      expect(result.id).toBe("o1");
      expect(result.slug).toBe("org-slug");
      expect(result.role).toBe("owner");
      expect(auditService.record).toHaveBeenCalled();
    });
  });

  describe("listOrganizations", () => {
    it("should map memberships correctly", async () => {
      (organizationRepository.listForUser as jest.Mock).mockResolvedValue([{
        id: "m1", roleId: "r1", role: { name: "member" },
        organization: { id: "o1", name: "Org", slug: "org", ownerId: "u1" }
      }]);

      const result = await organizationService.listOrganizations("u1");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("o1");
      expect(result[0].role).toBe("member");
    });
  });

  describe("updateOrganization", () => {
    it("should throw 404 if org not found", async () => {
      (organizationRepository.findById as jest.Mock).mockResolvedValue(null);
      await expect(organizationService.updateOrganization("o1", "u1", {})).rejects.toThrow(ApiError);
    });

    it("should throw 403 if non-owner updates settings", async () => {
      (organizationRepository.findById as jest.Mock).mockResolvedValue({ id: "o1", ownerId: "u2" });
      await expect(organizationService.updateOrganization("o1", "u1", { settings: {} })).rejects.toThrow(ApiError);
    });

    it("should throw 409 if new slug exists", async () => {
      (organizationRepository.findById as jest.Mock).mockResolvedValue({ id: "o1", ownerId: "u1" });
      (slugify as jest.Mock).mockReturnValue("new-slug");
      (organizationRepository.findBySlug as jest.Mock).mockResolvedValue({ id: "o2" });

      await expect(organizationService.updateOrganization("o1", "u1", { slug: "new-slug" })).rejects.toThrow(ApiError);
    });

    it("should update organization", async () => {
      (organizationRepository.findById as jest.Mock).mockResolvedValue({ id: "o1", ownerId: "u1" });
      (prisma.organization.update as jest.Mock).mockResolvedValue({ id: "o1", name: "New", slug: "new" });

      await organizationService.updateOrganization("o1", "u1", { name: "New" });

      expect(prisma.organization.update).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalled();
    });
  });

  describe("deleteOrganization", () => {
    it("should throw 403 if non-owner deletes", async () => {
      (organizationRepository.findById as jest.Mock).mockResolvedValue({ id: "o1", ownerId: "u2" });
      await expect(organizationService.deleteOrganization("o1", "u1")).rejects.toThrow(ApiError);
    });

    it("should delete organization", async () => {
      (organizationRepository.findById as jest.Mock).mockResolvedValue({ id: "o1", ownerId: "u1" });
      await organizationService.deleteOrganization("o1", "u1");
      expect(prisma.organization.delete).toHaveBeenCalledWith({ where: { id: "o1" } });
    });
  });

  describe("inviteMember", () => {
    it("should throw 409 if user already member", async () => {
      (organizationRepository.findById as jest.Mock).mockResolvedValue({ id: "o1" });
      (authRepository.findUserByEmail as jest.Mock).mockResolvedValue({ id: "u2" });
      (organizationRepository.findMemberByUserId as jest.Mock).mockResolvedValue({ id: "m2" });

      await expect(organizationService.inviteMember("o1", "u1", { email: "test@example.com", roleName: "member" })).rejects.toThrow(ApiError);
    });

    it("should throw 400 if inviting owner", async () => {
      (organizationRepository.findById as jest.Mock).mockResolvedValue({ id: "o1" });
      (authRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);
      (organizationRepository.findRoleByName as jest.Mock).mockResolvedValue({ id: "r1", name: "owner" });

      await expect(organizationService.inviteMember("o1", "u1", { email: "test@example.com", roleName: "owner" })).rejects.toThrow(ApiError);
    });

    it("should create invitation and send email", async () => {
      (organizationRepository.findById as jest.Mock).mockResolvedValue({ id: "o1", name: "Org" });
      (authRepository.findUserByEmail as jest.Mock).mockResolvedValue(null);
      (organizationRepository.findRoleByName as jest.Mock).mockResolvedValue({ id: "r1", name: "member" });
      (organizationRepository.findInvitationByEmail as jest.Mock).mockResolvedValue(null);
      (prisma.invitation.create as jest.Mock).mockResolvedValue({ id: "i1" });

      await organizationService.inviteMember("o1", "u1", { email: "test@example.com", roleName: "member" });

      expect(prisma.invitation.create).toHaveBeenCalled();
      expect(sendInvitationEmail).toHaveBeenCalled();
    });
  });

  describe("transferOwnership", () => {
    it("should transfer ownership", async () => {
      (organizationRepository.findById as jest.Mock).mockResolvedValue({ id: "o1", ownerId: "u1" });
      (organizationRepository.findMemberById as jest.Mock).mockResolvedValue({ id: "m2", userId: "u2", organizationId: "o1" });
      (organizationRepository.findMemberByUserId as jest.Mock).mockResolvedValue({ id: "m1", userId: "u1", organizationId: "o1" });
      (organizationRepository.findRoleByName as jest.Mock).mockResolvedValueOnce({ id: "r_owner" }).mockResolvedValueOnce({ id: "r_admin" });

      let capturedTx: any;
      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (cb: any) => {
        capturedTx = {
          organization: { update: jest.fn() },
          organizationMember: { update: jest.fn() },
        };
        return cb(capturedTx);
      });

      await organizationService.transferOwnership("o1", "u1", "m2");

      expect(capturedTx.organization.update).toHaveBeenCalledWith({ where: { id: "o1" }, data: { ownerId: "u2" } });
      expect(capturedTx.organizationMember.update).toHaveBeenCalledWith({ where: { id: "m2" }, data: { roleId: "r_owner" } });
      expect(capturedTx.organizationMember.update).toHaveBeenCalledWith({ where: { id: "m1" }, data: { roleId: "r_admin" } });
      expect(clearMembersPermissionCache).toHaveBeenCalledWith(["m2", "m1"]);
    });
  });

});
