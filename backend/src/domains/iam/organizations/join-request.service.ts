// @ts-nocheck
import { JoinRequestStatus } from "@prisma/client";
import prisma from "../../../config/database.js";
import ApiError from "../../../utils/ApiError.js";
import { authRepository } from "../auth/auth.repository.js";
import { organizationRepository } from "./organization.repository.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES, auditService } from "../../../services/audit/index.js";
import { clearMemberPermissionCache } from "../../../shared/utils/permissions.js";

export const joinRequestService = {
  createJoinRequest: async (userId: string, joinCode: string, message?: string) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(joinCode);

    const organization = await prisma.organization.findFirst({
      where: {
        OR: [
          { joinCode },
          ...(isUuid ? [{ id: joinCode }] : [])
        ]
      },
    });

    if (!organization) {
      throw new ApiError(404, "Organization not found for the provided join code");
    }

    const organizationId = organization.id;

    // Check if user is already a member
    const existingMembership = await organizationRepository.findMemberByUserId(organizationId, userId);
    if (existingMembership) {
      throw new ApiError(409, "User is already a member of this organization");
    }

    // Check if pending request exists
    const existingRequest = await prisma.joinRequest.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (existingRequest && existingRequest.status === "PENDING") {
      throw new ApiError(409, "You already have a pending join request for this organization");
    }

    // Check if there is an active invite
    const user = await authRepository.findUserById(userId);
    if (user) {
      const pendingInvite = await organizationRepository.findInvitationByEmail(organizationId, user.email);
      if (pendingInvite && pendingInvite.expiresAt > new Date()) {
        throw new ApiError(409, "You already have an active invitation to this organization. Please check your email.");
      }
    }

    // Upsert the request (in case they had a REJECTED one and are requesting again)
    const joinRequest = await prisma.joinRequest.upsert({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      update: {
        status: "PENDING",
        message,
        createdAt: new Date(),
      },
      create: {
        organizationId,
        userId,
        message,
        status: "PENDING",
      },
      include: {
        organization: {
          select: { name: true }
        }
      }
    });

    await auditService.record({
      organizationId,
      userId,
      action: AUDIT_ACTIONS.JOIN_REQUEST_CREATED,
      entityType: AUDIT_ENTITY_TYPES.JOIN_REQUEST,
      entityId: joinRequest.id,
      metadata: {
        message,
      },
    });

    return joinRequest;
  },

  listJoinRequests: async (organizationId: string) => {
    return prisma.joinRequest.findMany({
      where: { organizationId, status: "PENDING" },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  approveJoinRequest: async (organizationId: string, requestId: string, actorUserId: string) => {
    const request = await prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!request || request.organizationId !== organizationId) {
      throw new ApiError(404, "Join request not found");
    }

    if (request.status !== "PENDING") {
      throw new ApiError(400, "Join request is not pending");
    }

    const role = await organizationRepository.findRoleByName(organizationId, "member");
    if (!role) {
      throw new ApiError(500, "Member role not found in the organization");
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.joinRequest.update({
        where: { id: requestId },
        data: {
          status: "ACCEPTED",
          approvedById: actorUserId,
          approvedAt: new Date(),
        },
      });

      // Create membership
      const membership = await tx.organizationMember.create({
        data: {
          organizationId,
          userId: request.userId,
          roleId: role.id,
        },
      });

      await auditService.record(
        {
          organizationId,
          userId: actorUserId,
          action: AUDIT_ACTIONS.JOIN_REQUEST_APPROVED,
          entityType: AUDIT_ENTITY_TYPES.JOIN_REQUEST,
          entityId: requestId,
          metadata: {
            targetUserId: request.userId,
            roleId: role.id,
          },
        },
        tx
      );

      return { updatedRequest, membership };
    });

    return result.updatedRequest;
  },

  rejectJoinRequest: async (organizationId: string, requestId: string, actorUserId: string) => {
    const request = await prisma.joinRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.organizationId !== organizationId) {
      throw new ApiError(404, "Join request not found");
    }

    if (request.status !== "PENDING") {
      throw new ApiError(400, "Join request is not pending");
    }

    const updatedRequest = await prisma.$transaction(async (tx) => {
      const req = await tx.joinRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          approvedById: actorUserId,
          approvedAt: new Date(),
        },
      });

      await auditService.record(
        {
          organizationId,
          userId: actorUserId,
          action: AUDIT_ACTIONS.JOIN_REQUEST_REJECTED,
          entityType: AUDIT_ENTITY_TYPES.JOIN_REQUEST,
          entityId: requestId,
          metadata: {
            targetUserId: request.userId,
          },
        },
        tx
      );

      return req;
    });

    return updatedRequest;
  },
};
