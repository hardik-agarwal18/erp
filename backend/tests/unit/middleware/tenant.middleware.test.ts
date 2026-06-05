import { jest } from "@jest/globals";
import { Request, Response, NextFunction } from "express";

jest.mock("../../../src/config/database.js", () => ({
  __esModule: true,
  default: {
    organizationMember: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../../../src/shared/utils/permissions.js", () => ({
  getCachedMemberPermissions: jest.fn(),
}));

import prisma from "../../../src/config/database.js";
import { getCachedMemberPermissions } from "../../../src/shared/utils/permissions.js";
import {
  tenantContextMiddleware,
  requireRole,
  requirePermission,
} from "../../../src/middleware/tenant.middleware.js";
import ApiError from "../../../src/utils/ApiError.js";

function makeRes(): Partial<Response> {
  return {} as Partial<Response>;
}

function makeNext(): jest.Mock {
  return jest.fn();
}

const fullMembership = {
  id: "mem-1",
  userId: "user-1",
  organizationId: "org-1",
  roleId: "role-1",
  role: { name: "admin" },
  organization: {
    id: "org-1",
    name: "Acme Corp",
    slug: "acme-corp",
    ownerId: "user-1",
    logo: null,
    settings: null,
  },
};

// ── tenantContextMiddleware ──────────────────────────────────────────────────
describe("tenantContextMiddleware", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("Missing req.user", () => {
    it("should call next(ApiError 401) when req.user is absent", async () => {
      const req = { headers: {}, user: undefined, header: () => undefined } as unknown as Request;
      const next = makeNext();

      await tenantContextMiddleware()(req, makeRes() as Response, next as unknown as NextFunction);

      const err = next.mock.calls[0][0] as ApiError;
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(401);
    });
  });

  describe("Organization ID resolution", () => {
    it("should call next(ApiError 400) when organization ID cannot be resolved", async () => {
      const req = {
        user: { id: "user-1", organizationId: null },
        header: () => undefined,
        params: {},
        headers: {},
      } as unknown as Request;
      const next = makeNext();

      await tenantContextMiddleware()(req, makeRes() as Response, next as unknown as NextFunction);

      const err = next.mock.calls[0][0] as ApiError;
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe("Organization context is required");
    });

    it("should resolve org ID from x-organization-id header", async () => {
      (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(fullMembership);
      (getCachedMemberPermissions as jest.Mock).mockResolvedValue(["read:invoices"]);

      const req = {
        user: { id: "user-1", organizationId: "org-1" },
        header: (name: string) => name === "x-organization-id" ? "org-1" : undefined,
        params: {},
        headers: {},
      } as unknown as Request;
      const next = makeNext();

      await tenantContextMiddleware()(req, makeRes() as Response, next as unknown as NextFunction);

      expect(next).toHaveBeenCalledWith();
    });

    it("should resolve org ID from req.params.id when allowRouteParam is true", async () => {
      (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(fullMembership);
      (getCachedMemberPermissions as jest.Mock).mockResolvedValue([]);

      const req = {
        user: { id: "user-1", organizationId: "org-1" },
        header: () => undefined,
        params: { id: "org-1" },
        headers: {},
      } as unknown as Request;
      const next = makeNext();

      await tenantContextMiddleware({ allowRouteParam: true })(
        req,
        makeRes() as Response,
        next as unknown as NextFunction,
      );

      expect(next).toHaveBeenCalledWith();
    });

    it("should use req.user.organizationId as fallback", async () => {
      (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(fullMembership);
      (getCachedMemberPermissions as jest.Mock).mockResolvedValue([]);

      const req = {
        user: { id: "user-1", organizationId: "org-1" },
        header: () => undefined,
        params: {},
        headers: {},
      } as unknown as Request;
      const next = makeNext();

      await tenantContextMiddleware()(req, makeRes() as Response, next as unknown as NextFunction);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("Cross-org access enforcement", () => {
    it("should call next(ApiError 403) when token org differs from requested org", async () => {
      const req = {
        user: { id: "user-1", organizationId: "org-A" },
        header: (name: string) => name === "x-organization-id" ? "org-B" : undefined,
        params: {},
        headers: {},
      } as unknown as Request;
      const next = makeNext();

      await tenantContextMiddleware()(req, makeRes() as Response, next as unknown as NextFunction);

      const err = next.mock.calls[0][0] as ApiError;
      expect(err.statusCode).toBe(403);
      expect(err.message).toContain("Switch workspaces");
    });
  });

  describe("Membership check", () => {
    it("should call next(ApiError 403) when user is not a member of the organization", async () => {
      (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(null);

      const req = {
        user: { id: "user-1", organizationId: "org-1" },
        header: () => undefined,
        params: {},
        headers: {},
      } as unknown as Request;
      const next = makeNext();

      await tenantContextMiddleware()(req, makeRes() as Response, next as unknown as NextFunction);

      const err = next.mock.calls[0][0] as ApiError;
      expect(err.statusCode).toBe(403);
      expect(err.message).toContain("not a member");
    });
  });

  describe("Happy path", () => {
    it("should set req.organization, req.member, req.permissions and call next()", async () => {
      (prisma.organizationMember.findUnique as jest.Mock).mockResolvedValue(fullMembership);
      (getCachedMemberPermissions as jest.Mock).mockResolvedValue(["read:invoices"]);

      const req = {
        user: { id: "user-1", organizationId: "org-1" },
        header: () => undefined,
        params: {},
        headers: {},
      } as unknown as Request & { organization?: any; member?: any; permissions?: any };
      const next = makeNext();

      await tenantContextMiddleware()(req, makeRes() as Response, next as unknown as NextFunction);

      expect(next).toHaveBeenCalledWith();
      expect(req.organization).toEqual(fullMembership.organization);
      expect(req.member).toMatchObject({ id: "mem-1", roleName: "admin" });
      expect(req.permissions).toEqual(["read:invoices"]);
    });
  });
});

// ── requireRole ──────────────────────────────────────────────────────────────
describe("requireRole", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call next(ApiError 403) when req.member is not set", () => {
    const req = { member: undefined } as unknown as Request;
    const next = makeNext();

    requireRole("admin")(req, makeRes() as Response, next as unknown as NextFunction);

    const err = next.mock.calls[0][0] as ApiError;
    expect(err.statusCode).toBe(403);
    expect(err.message).toContain("membership required");
  });

  it("should call next(ApiError 403) when member's role is not in allowed list", () => {
    const req = { member: { roleName: "viewer" } } as unknown as Request;
    const next = makeNext();

    requireRole("admin", "manager")(req, makeRes() as Response, next as unknown as NextFunction);

    const err = next.mock.calls[0][0] as ApiError;
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe("Insufficient role");
  });

  it("should call next() without error when member has an allowed role", () => {
    const req = { member: { roleName: "admin" } } as unknown as Request;
    const next = makeNext();

    requireRole("admin", "manager")(req, makeRes() as Response, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledWith();
  });
});

// ── requirePermission ────────────────────────────────────────────────────────
describe("requirePermission", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should call next(ApiError 403) when req.permissions is not set", () => {
    const req = { permissions: undefined } as unknown as Request;
    const next = makeNext();

    requirePermission("read:invoices")(req, makeRes() as Response, next as unknown as NextFunction);

    const err = next.mock.calls[0][0] as ApiError;
    expect(err.statusCode).toBe(403);
    expect(err.message).toContain("not loaded");
  });

  it("should call next(ApiError 403) when member lacks a required permission", () => {
    const req = { permissions: ["read:products"] } as unknown as Request;
    const next = makeNext();

    requirePermission("read:invoices", "write:invoices")(
      req,
      makeRes() as Response,
      next as unknown as NextFunction,
    );

    const err = next.mock.calls[0][0] as ApiError;
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe("Insufficient permissions");
  });

  it("should call next() when member has all required permissions", () => {
    const req = {
      permissions: ["read:invoices", "write:invoices", "read:products"],
    } as unknown as Request;
    const next = makeNext();

    requirePermission("read:invoices", "write:invoices")(
      req,
      makeRes() as Response,
      next as unknown as NextFunction,
    );

    expect(next).toHaveBeenCalledWith();
  });
});
