// @ts-nocheck
import { NextFunction, Request, Response } from "express";

import prisma from "../config/database.js";
import { getCachedMemberPermissions, hasAllPermissions, hasAnyPermission } from "../shared/utils/permissions.js";
import ApiError from "../utils/ApiError.js";
import { loggerContext } from "../config/logger.js";

type TenantMiddlewareOptions = {
  allowRouteParam?: boolean;
  enforceTokenOrganization?: boolean;
};

const resolveRequestedOrganizationId = (
  req: Request,
  options: TenantMiddlewareOptions,
) => {
  const headerOrganizationId = req.header("x-organization-id");
  const routeOrganizationId =
    options.allowRouteParam === true
      ? (req.params.id as string | undefined)
      : undefined;

  return headerOrganizationId ?? routeOrganizationId ?? req.user?.organizationId;
};

export const tenantContextMiddleware =
  (options: TenantMiddlewareOptions = {}) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized"));
    }

    const organizationId = resolveRequestedOrganizationId(req, options);

    if (!organizationId) {
      return next(new ApiError(400, "Organization context is required"));
    }

    if (
      options.enforceTokenOrganization !== false &&
      req.user.organizationId &&
      req.user.organizationId !== organizationId
    ) {
      return next(
        new ApiError(403, "Switch workspaces before accessing this organization"),
      );
    }

    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: req.user.id,
        },
      },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        roleId: true,
        role: {
          select: {
            name: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            ownerId: true,
            logo: true,
            settings: true,
          },
        },
      },
    });

    if (!membership) {
      return next(new ApiError(403, "You are not a member of this organization"));
    }

    const permissions = await getCachedMemberPermissions(membership.id);

    req.organization = membership.organization;
    req.member = {
      id: membership.id,
      userId: membership.userId,
      organizationId: membership.organizationId,
      roleId: membership.roleId,
      roleName: membership.role.name,
    };
    req.permissions = permissions;

    const store = loggerContext.getStore();
    if (store) {
      store.set("workspaceId", membership.organizationId);
    }

    return next();
  };

export const requireRole = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.member) {
      return next(new ApiError(403, "Organization membership required"));
    }

    if (!roles.includes(req.member.roleName)) {
      return next(new ApiError(403, "Insufficient role"));
    }

    return next();
  };
};

export const requirePermission = (...permissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.permissions) {
      return next(new ApiError(403, "Organization permissions not loaded"));
    }

    if (!hasAllPermissions(req.permissions, permissions)) {
      return next(new ApiError(403, "Insufficient permissions"));
    }

    return next();
  };
};

export const requireAnyPermission = (...permissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.permissions) {
      return next(new ApiError(403, "Organization permissions not loaded"));
    }

    if (!hasAnyPermission(req.permissions, permissions)) {
      return next(new ApiError(403, "Insufficient permissions"));
    }

    return next();
  };
};
