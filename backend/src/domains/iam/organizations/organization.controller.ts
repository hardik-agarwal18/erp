// @ts-nocheck
import { sendSuccess } from "../../../utils/apiResponse.js";
import { Request, Response } from "express";

import { organizationService } from "./organization.service.js";

export const organizationController = {
  createOrganization: async (req: Request, res: Response) => {
    const organization = await organizationService.createOrganization(
      req.user!.id,
      req.body,
    );

    sendSuccess(res, { statusCode: 201, message: "Organization created",
      data: organization, });
  },

  listOrganizations: async (req: Request, res: Response) => {
    const organizations = await organizationService.listOrganizations(req.user!.id);
    sendSuccess(res, { statusCode: 200, data: organizations });
  },

  getOrganization: async (req: Request, res: Response) => {
    const organization = await organizationService.getOrganization(
      req.params.id as string,
    );
    sendSuccess(res, { statusCode: 200, data: organization });
  },

  updateOrganization: async (req: Request, res: Response) => {
    const organization = await organizationService.updateOrganization(
      req.params.id as string,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, { statusCode: 200, message: "Organization updated",
      data: organization, });
  },

  deleteOrganization: async (req: Request, res: Response) => {
    await organizationService.deleteOrganization(
      req.params.id as string,
      req.user!.id,
    );
    sendSuccess(res, { statusCode: 200, message: "Organization deleted", });
  },

  listMembers: async (req: Request, res: Response) => {
    const members = await organizationService.listMembers(req.params.id as string);
    sendSuccess(res, { statusCode: 200, data: members });
  },

  listAuditLogs: async (req: Request, res: Response) => {
    const { auditRepository } = await import("../../services/audit/audit.repository.js");
    const logs = await auditRepository.listOrganizationLogs(
      req.params.id as string,
      req.query,
    );
    sendSuccess(res, { statusCode: 200, data: logs });
  },

  inviteMember: async (req: Request, res: Response) => {
    const invitation = await organizationService.inviteMember(
      req.params.id as string,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, { statusCode: 201, message: "Invitation sent",
      data: invitation, });
  },

  updateMemberRole: async (req: Request, res: Response) => {
    const member = await organizationService.updateMemberRole(
      req.params.id as string,
      req.params.memberId as string,
      req.user!.id,
      req.member!.roleName,
      req.body.roleId,
    );

    sendSuccess(res, { statusCode: 200, message: "Member role updated",
      data: member, });
  },

  removeMember: async (req: Request, res: Response) => {
    await organizationService.removeMember(
      req.params.id as string,
      req.params.memberId as string,
      req.user!.id,
      req.member!.roleName,
    );
    sendSuccess(res, { statusCode: 200, message: "Member removed" });
  },

  leaveOrganization: async (req: Request, res: Response) => {
    await organizationService.leaveOrganization(
      req.params.id as string,
      req.user!.id,
    );
    sendSuccess(res, { statusCode: 200, message: "Organization left" });
  },

  transferOwnership: async (req: Request, res: Response) => {
    await organizationService.transferOwnership(
      req.params.id as string,
      req.user!.id,
      req.body.memberId,
    );
    sendSuccess(res, { statusCode: 200, message: "Ownership transferred", });
  },

  acceptInvitation: async (req: Request, res: Response) => {
    const result = await organizationService.acceptInvitation(
      req.body.token,
      req.body.password,
      req.body.name,
    );

    sendSuccess(res, { statusCode: 200, message: "Invitation accepted",
      data: result, });
  },
};
