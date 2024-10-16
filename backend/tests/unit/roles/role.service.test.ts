import { jest } from "@jest/globals";

// Mocking dependencies
import { roleRepository } from "../../../src/modules/roles/role.repository.js";
import { clearMembersPermissionCache } from "../../../src/shared/utils/permissions.js";
import { slugify } from "../../../src/shared/utils/slug.js";
import { auditService } from "../../../src/services/audit/index.js";

jest.mock("../../../src/modules/roles/role.repository.js");
jest.mock("../../../src/shared/utils/permissions.js");
jest.mock("../../../src/shared/utils/slug.js");
jest.mock("../../../src/services/audit/index.js", () => {
  return {
    auditService: { record: jest.fn() },
    AUDIT_ACTIONS: {},
    AUDIT_ENTITY_TYPES: {},
  };
});

// Mock Prisma
jest.mock("../../../src/config/database.js", () => {
  const mockTx = {
    rolePermission: { deleteMany: jest.fn(), createMany: jest.fn() },
    role: { update: jest.fn() },
  };
  return {
    __esModule: true,
    default: {
      $transaction: jest.fn(async (cb: any) => cb(mockTx)),
      permission: { findMany: jest.fn() },
      role: { create: jest.fn(), delete: jest.fn(), count: jest.fn() },
      organizationMember: { findMany: jest.fn(), count: jest.fn() },
    },
  };
});

import { roleService } from "../../../src/modules/roles/role.service.js";
import ApiError from "../../../src/utils/ApiError.js";
import prisma from "../../../src/config/database.js";

describe("roleService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listRoles", () => {
    it("should list and serialize roles", async () => {
      (roleRepository.listRoles as jest.Mock).mockResolvedValue([{
        id: "r1", name: "owner", description: "", isSystem: true,
        rolePermissions: [{ permission: { id: "p1", name: "admin.full" } }]
      }]);

      const result = await roleService.listRoles("o1");

      expect(roleRepository.listRoles).toHaveBeenCalledWith("o1", { includeArchived: false });
      expect(result).toHaveLength(1);
      expect(result[0].permissions[0].name).toBe("admin.full");
    });
  });

  describe("createRole", () => {
    it("should throw 400 if role name is invalid", async () => {
      (slugify as jest.Mock).mockReturnValue("");
      await expect(roleService.createRole("o1", "u1", { name: "!", permissionNames: [] })).rejects.toThrow(ApiError);
    });

    it("should throw 400 if trying to create a system role", async () => {
      (slugify as jest.Mock).mockReturnValue("admin");
      await expect(roleService.createRole("o1", "u1", { name: "Admin", permissionNames: [] })).rejects.toThrow(ApiError);
    });

    it("should throw 400 if permission not found", async () => {
      (slugify as jest.Mock).mockReturnValue("custom");
      (prisma.role.count as jest.Mock).mockResolvedValue(0);
      (prisma.permission.findMany as jest.Mock).mockResolvedValue([]);
      await expect(roleService.createRole("o1", "u1", { name: "custom", permissionNames: ["p"] })).rejects.toThrow(ApiError);
    });

    it("should create role and map permissions", async () => {
      (slugify as jest.Mock).mockReturnValue("custom");
      (prisma.role.count as jest.Mock).mockResolvedValue(0);
      (prisma.permission.findMany as jest.Mock).mockResolvedValue([{ id: "p1" }]);
      (prisma.role.create as jest.Mock).mockResolvedValue({ id: "r1", name: "custom", rolePermissions: [] });

      await roleService.createRole("o1", "u1", { name: "Custom", permissionNames: ["p"] });

      expect(prisma.role.create).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalled();
    });
  });

  describe("updateRole", () => {
    it("should throw 404 if role not found", async () => {
      (roleRepository.findRoleById as jest.Mock).mockResolvedValue(null);
      await expect(roleService.updateRole("o1", "r1", "u1", {})).rejects.toThrow(ApiError);
    });

    it("should throw 400 if modifying system role", async () => {
      (roleRepository.findRoleById as jest.Mock).mockResolvedValue({ isSystem: true });
      await expect(roleService.updateRole("o1", "r1", "u1", {})).rejects.toThrow(ApiError);
    });

    it("should update role using transaction", async () => {
      (roleRepository.findRoleById as jest.Mock).mockResolvedValue({ isSystem: false, name: "custom" });
      (prisma.permission.findMany as jest.Mock).mockResolvedValue([{ id: "p1" }]);
      (prisma.organizationMember.findMany as jest.Mock).mockResolvedValue([{ id: "m1" }]);

      let capturedTx: any;
      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (cb: any) => {
        capturedTx = {
          rolePermission: { deleteMany: jest.fn(), createMany: jest.fn() },
          role: { update: jest.fn().mockResolvedValue({ id: "r1", rolePermissions: [] }) },
        };
        return cb(capturedTx);
      });

      await roleService.updateRole("o1", "r1", "u1", { permissionNames: ["p"] });

      expect(capturedTx.rolePermission.deleteMany).toHaveBeenCalled();
      expect(capturedTx.rolePermission.createMany).toHaveBeenCalled();
      expect(capturedTx.role.update).toHaveBeenCalled();
      expect(clearMembersPermissionCache).toHaveBeenCalledWith(["m1"]);
      expect(auditService.record).toHaveBeenCalled();
    });
  });

  describe("deleteRole", () => {
    it("should throw 404 if role not found", async () => {
      (roleRepository.findRoleById as jest.Mock).mockResolvedValue(null);
      await expect(roleService.deleteRole("o1", "r1", "u1")).rejects.toThrow(ApiError);
    });

    it("should throw 400 if deleting system role", async () => {
      (roleRepository.findRoleById as jest.Mock).mockResolvedValue({ isSystem: true });
      await expect(roleService.deleteRole("o1", "r1", "u1")).rejects.toThrow(ApiError);
    });

    it("should throw 400 if role is assigned to members", async () => {
      (roleRepository.findRoleById as jest.Mock).mockResolvedValue({ isSystem: false });
      (prisma.organizationMember.count as jest.Mock).mockResolvedValue(1);
      await expect(roleService.deleteRole("o1", "r1", "u1")).rejects.toThrow(ApiError);
    });

    it("should delete role", async () => {
      (roleRepository.findRoleById as jest.Mock).mockResolvedValue({ isSystem: false, name: "custom" });
      (prisma.organizationMember.count as jest.Mock).mockResolvedValue(0);

      await roleService.deleteRole("o1", "r1", "u1");

      expect(prisma.role.delete).toHaveBeenCalledWith({ where: { id: "r1" } });
      expect(auditService.record).toHaveBeenCalled();
    });
  });
});
