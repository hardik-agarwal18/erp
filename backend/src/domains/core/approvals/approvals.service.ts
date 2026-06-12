
import { ApprovalStatus } from "@prisma/client";
import { emitApprovalCompleted, emitApprovalRejected } from "../../../shared/events/event-bus.js";
import ApiError from "../../../utils/ApiError.js";
import { approvalsRepository } from "./approvals.repository.js";
import { ActionApprovalInput, CreateApprovalTemplateInput } from "./approvals.types.js";
import prisma from "../../../config/database.js";

export const approvalsService = {
  createTemplate: async (organizationId: string, payload: CreateApprovalTemplateInput) => {
    // Validate that steps are ordered
    if (!payload.steps || payload.steps.length === 0) {
      throw new ApiError(400, "Approval template must have at least one step.");
    }
    
    // Sort just in case
    payload.steps.sort((a, b) => a.order - b.order);
    
    // Ensure sequential 1,2,3...
    payload.steps.forEach((step, index) => {
      step.order = index + 1;
    });

    return approvalsRepository.createTemplate(organizationId, payload);
  },

  getTemplate: async (organizationId: string, entityType: string) => {
    return approvalsRepository.getTemplateByEntityType(organizationId, entityType);
  },

  submitForApproval: async (
    organizationId: string,
    entityType: string,
    entityId: string,
    submittedById: string,
  ) => {
    const template = await approvalsRepository.getTemplateByEntityType(organizationId, entityType);
    
    if (!template) {
      throw new ApiError(404, `No active approval template found for ${entityType}`);
    }

    if (!template.isActive || template.steps.length === 0) {
      throw new ApiError(400, "Approval template is inactive or has no steps.");
    }

    // Check if one is already pending
    const existing = await approvalsRepository.getInstanceForEntity(organizationId, entityType, entityId);
    if (existing && existing.status === ApprovalStatus.PENDING) {
      throw new ApiError(400, "An approval instance is already pending for this entity.");
    }

    return approvalsRepository.createInstance(
      organizationId,
      template.id,
      entityType,
      entityId,
      submittedById,
    );
  },

  approve: async (
    organizationId: string,
    instanceId: string,
    actorId: string,
    payload?: ActionApprovalInput,
  ) => {
    const instance = await approvalsRepository.getInstanceById(organizationId, instanceId);
    if (!instance) {
      throw new ApiError(404, "Approval instance not found");
    }

    if (instance.status !== ApprovalStatus.PENDING) {
      throw new ApiError(400, `Cannot approve instance in ${instance.status} status.`);
    }

    const currentStep = instance.template.steps.find(s => s.order === instance.currentStepOrder);
    if (!currentStep) {
      throw new ApiError(500, "Approval step configuration error");
    }

    // Record the action
    await approvalsRepository.recordAction(
      instance.id,
      currentStep.id,
      actorId,
      "APPROVE",
      payload?.comments,
    );

    const isLastStep = instance.currentStepOrder === instance.template.steps.length;

    let updatedInstance;
    if (isLastStep) {
      updatedInstance = await approvalsRepository.updateInstanceStatus(
        instance.id,
        ApprovalStatus.APPROVED,
        instance.currentStepOrder,
      );

      // Emit Domain Event
      emitApprovalCompleted({
        organizationId,
        entityType: instance.entityType,
        entityId: instance.entityId,
        approvalInstanceId: instance.id,
        approvedBy: actorId,
        approvedAt: updatedInstance.completedAt!,
      });
    } else {
      // Move to next step
      updatedInstance = await approvalsRepository.updateInstanceStatus(
        instance.id,
        ApprovalStatus.PENDING,
        instance.currentStepOrder + 1,
      );
    }

    return updatedInstance;
  },

  reject: async (
    organizationId: string,
    instanceId: string,
    actorId: string,
    payload?: ActionApprovalInput,
  ) => {
    const instance = await approvalsRepository.getInstanceById(organizationId, instanceId);
    if (!instance) {
      throw new ApiError(404, "Approval instance not found");
    }

    if (instance.status !== ApprovalStatus.PENDING) {
      throw new ApiError(400, `Cannot reject instance in ${instance.status} status.`);
    }

    const currentStep = instance.template.steps.find(s => s.order === instance.currentStepOrder);
    if (!currentStep) {
      throw new ApiError(500, "Approval step configuration error");
    }

    // Record the action
    await approvalsRepository.recordAction(
      instance.id,
      currentStep.id,
      actorId,
      "REJECT",
      payload?.comments,
    );

    const updatedInstance = await approvalsRepository.updateInstanceStatus(
      instance.id,
      ApprovalStatus.REJECTED,
      instance.currentStepOrder,
    );

    // Emit Domain Event
    emitApprovalRejected({
      organizationId,
      entityType: instance.entityType,
      entityId: instance.entityId,
      approvalInstanceId: instance.id,
      rejectedBy: actorId,
      rejectedAt: updatedInstance.completedAt!,
    });

    return updatedInstance;
  },

  cancel: async (
    organizationId: string,
    instanceId: string,
    actorId: string,
  ) => {
    const instance = await approvalsRepository.getInstanceById(organizationId, instanceId);
    if (!instance) {
      throw new ApiError(404, "Approval instance not found");
    }

    if (instance.status !== ApprovalStatus.PENDING) {
      throw new ApiError(400, `Cannot cancel instance in ${instance.status} status.`);
    }

    if (instance.submittedById !== actorId) {
      // In a real ERP, admins could also cancel, but for simplicity:
      throw new ApiError(403, "Only the submitter can cancel this approval.");
    }

    return approvalsRepository.updateInstanceStatus(
      instance.id,
      ApprovalStatus.CANCELLED,
      instance.currentStepOrder,
    );
  },

  getPendingApprovals: async (organizationId: string, userId: string) => {
    // Note: In a real system, we'd look up the user's roles first
    // For this modular monolith, we'll fetch the roles from organizationMembers
    const memberships = await prisma.organizationMember.findMany({
      where: { organizationId, userId },
      select: { roleId: true }
    });
    
    const roleIds = memberships.map(m => m.roleId);

    // We want to find instances where status = PENDING
    // AND the currentStepOrder's approverType/roleId matches the user.
    // Since Prisma nested relations filtering on related models in a single query can be tricky,
    // we'll find all PENDING instances and filter.
    const pendingInstances = await prisma.approvalInstance.findMany({
      where: {
        organizationId,
        status: ApprovalStatus.PENDING,
      },
      include: {
        template: {
          include: {
            steps: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    const actionable = pendingInstances.filter(instance => {
      const step = instance.template.steps.find(s => s.order === instance.currentStepOrder);
      if (!step) return false;

      if (step.approverType === "USER" && step.userId === userId) return true;
      if (step.approverType === "ROLE" && step.roleId && roleIds.includes(step.roleId)) return true;

      return false;
    });

    return actionable;
  },

  getApprovalHistory: async (organizationId: string, entityType: string, entityId: string) => {
    return approvalsRepository.getApprovalHistory(organizationId, entityType, entityId);
  },
};
