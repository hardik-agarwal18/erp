
import prisma from "../../../config/database.js";
import { CreateApprovalTemplateInput } from "./approvals.types.js";
import { ApprovalStatus } from "@prisma/client";

export const approvalsRepository = {
  createTemplate: async (organizationId: string, payload: CreateApprovalTemplateInput) => {
    return prisma.approvalTemplate.create({
      data: {
        organizationId,
        entityType: payload.entityType,
        name: payload.name,
        steps: {
          create: payload.steps.map(step => ({
            order: step.order,
            approverType: step.approverType,
            roleId: step.roleId,
            userId: step.userId,
            escalationAfterHours: step.escalationAfterHours,
            autoApprove: step.autoApprove,
          })),
        },
      },
      include: {
        steps: {
          orderBy: { order: "asc" },
        },
      },
    });
  },

  getTemplateByEntityType: async (organizationId: string, entityType: string) => {
    return prisma.approvalTemplate.findUnique({
      where: {
        organizationId_entityType: {
          organizationId,
          entityType,
        },
      },
      include: {
        steps: {
          orderBy: { order: "asc" },
        },
      },
    });
  },

  createInstance: async (
    organizationId: string,
    templateId: string,
    entityType: string,
    entityId: string,
    submittedById: string,
  ) => {
    return prisma.approvalInstance.create({
      data: {
        organizationId,
        templateId,
        entityType,
        entityId,
        status: ApprovalStatus.PENDING,
        submittedById,
        currentStepOrder: 1,
      },
      include: {
        template: {
          include: {
            steps: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });
  },

  getInstanceById: async (organizationId: string, instanceId: string) => {
    return prisma.approvalInstance.findFirst({
      where: {
        id: instanceId,
        organizationId,
      },
      include: {
        template: {
          include: {
            steps: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });
  },

  getInstanceForEntity: async (organizationId: string, entityType: string, entityId: string) => {
    return prisma.approvalInstance.findFirst({
      where: {
        organizationId,
        entityType,
        entityId,
      },
      orderBy: { submittedAt: "desc" },
      include: {
        template: {
          include: {
            steps: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });
  },

  recordAction: async (
    instanceId: string,
    stepId: string,
    actorId: string,
    action: string,
    comments?: string,
  ) => {
    return prisma.approvalAction.create({
      data: {
        instanceId,
        stepId,
        actorId,
        action,
        comments,
      },
    });
  },

  updateInstanceStatus: async (
    instanceId: string,
    status: ApprovalStatus,
    currentStepOrder: number,
  ) => {
    return prisma.approvalInstance.update({
      where: { id: instanceId },
      data: {
        status,
        currentStepOrder,
        completedAt: status === ApprovalStatus.APPROVED || status === ApprovalStatus.REJECTED ? new Date() : null,
      },
    });
  },

  getApprovalHistory: async (organizationId: string, entityType: string, entityId: string) => {
    const instance = await prisma.approvalInstance.findFirst({
      where: {
        organizationId,
        entityType,
        entityId,
      },
      orderBy: { submittedAt: "desc" },
      include: {
        actions: {
          orderBy: { createdAt: "asc" },
          include: {
            step: true,
          },
        },
        template: {
          include: {
            steps: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    return instance;
  },
};
