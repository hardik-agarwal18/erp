import { PrismaClient, WorkflowEntityType, WorkflowAction, WorkflowStatus, Prisma } from "@prisma/client";
import { workflowEscalationQueue } from "../jobs/queue.js";

const prisma = new PrismaClient();

export interface StartWorkflowInput {
  organizationId: string;
  entityType: WorkflowEntityType;
  entityId: string;
  payload: Record<string, any>; // Used to evaluate conditions and snapshot
}

export interface PerformActionInput {
  organizationId: string;
  instanceId: string;
  actorUserId: string;
  action: WorkflowAction;
  comments?: string;
  actingForUserId?: string; // If delegated
}

export const workflowService = {
  startWorkflow: async ({ organizationId, entityType, entityId, payload }: StartWorkflowInput, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    // Find active rules for this entity type, ordered by priority
    const rules = await client.workflowRule.findMany({
      where: { 
        organizationId, 
        entityType, 
        isActive: true,
        OR: [
          { effectiveFrom: null, effectiveTo: null },
          { effectiveFrom: { lte: new Date() }, effectiveTo: null },
          { effectiveFrom: { lte: new Date() }, effectiveTo: { gte: new Date() } }
        ]
      },
      orderBy: { priority: "desc" },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });

    for (const rule of rules) {
      const condition = rule.conditionLogic as any;
      let isMatch = false;

      if (!condition || Object.keys(condition).length === 0) {
        isMatch = true;
      } else if (condition.field && condition.operator && condition.value !== undefined) {
        const payloadValue = payload[condition.field];
        if (payloadValue !== undefined) {
          switch (condition.operator) {
            case ">": isMatch = payloadValue > condition.value; break;
            case ">=": isMatch = payloadValue >= condition.value; break;
            case "<": isMatch = payloadValue < condition.value; break;
            case "<=": isMatch = payloadValue <= condition.value; break;
            case "==": isMatch = payloadValue == condition.value; break;
            case "!=": isMatch = payloadValue != condition.value; break;
          }
        }
      }

      if (isMatch) {
        if (rule.steps.length === 0) {
          return null; // Auto-approve if no steps
        }

        const firstStep = rule.steps[0];
        let dueAt: Date | undefined;
        let escalateAt: Date | undefined;

        if (firstStep.expectedDurationHours) {
          dueAt = new Date();
          dueAt.setHours(dueAt.getHours() + firstStep.expectedDurationHours);
          escalateAt = new Date(dueAt);
        }

        const instance = await client.workflowInstance.create({
          data: {
            organizationId,
            ruleId: rule.id,
            entityType,
            entityId,
            status: WorkflowStatus.PENDING,
            currentStep: 1,
            snapshot: payload as Prisma.InputJsonValue,
            dueAt,
            escalateAt
          },
        });

        // Queue SLA Escalation Job
        if (escalateAt && firstStep.escalationRoleId) {
          const delay = escalateAt.getTime() - Date.now();
          if (delay > 0) {
            await workflowEscalationQueue.add(
              "escalate",
              { 
                instanceId: instance.id, 
                organizationId, 
                escalationRoleId: firstStep.escalationRoleId,
                stepOrder: 1
              },
              { delay }
            );
          }
        }

        // Lock the entity if applicable
        if (entityType === "ADVANCE") {
          await client.advance.update({
            where: { id: entityId },
            data: { isLocked: true }
          });
        }
        
        // Emit OutboxEvent
        await client.outboxEvent.create({
          data: {
            organizationId,
            aggregateType: entityType,
            aggregateId: entityId,
            eventType: "WORKFLOW_STARTED",
            payload: { instanceId: instance.id }
          }
        });

        return instance;
      }
    }

    return null;
  },

  /**
   * Processes a workflow action (Approve/Reject) by an actor.
   */
  performAction: async ({ organizationId, instanceId, actorUserId, actingForUserId, action, comments }: PerformActionInput, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    const instance = await client.workflowInstance.findUnique({
      where: { id: instanceId, organizationId },
      include: { 
        rule: { include: { steps: { orderBy: { stepOrder: "asc" } } } },
        history: true
      },
    });

    if (!instance) {
      throw new Error("Workflow instance not found.");
    }

    if (instance.status !== WorkflowStatus.PENDING && instance.status !== WorkflowStatus.CHANGES_REQUESTED) {
      throw new Error(`Cannot perform action. Instance is already ${instance.status}`);
    }

    const currentStepDef = instance.rule.steps.find(s => s.stepOrder === instance.currentStep);
    if (!currentStepDef) {
      throw new Error("Current step definition not found.");
    }

    // Verify Delegation if actingForUserId is provided
    if (actingForUserId) {
      const delegation = await client.workflowDelegation.findFirst({
        where: {
          organizationId,
          fromUserId: actingForUserId,
          toUserId: actorUserId,
          startDate: { lte: new Date() },
          endDate: { gte: new Date() }
        }
      });
      if (!delegation) {
        throw new Error("Invalid or expired delegation.");
      }
    }

    // Record the history
    await client.workflowHistory.create({
      data: {
        instanceId: instance.id,
        stepOrder: instance.currentStep,
        approverUserId: actorUserId,
        actingForUserId,
        action,
        comments,
      },
    });

    let newStatus: WorkflowStatus = instance.status;
    let newStep = instance.currentStep;

    if (action === WorkflowAction.APPROVE) {
      // Evaluate Parallel Approvals
      let stepApproved = false;
      
      const currentStepHistories = instance.history.filter(h => h.stepOrder === instance.currentStep && h.action === WorkflowAction.APPROVE);
      const approvalCount = currentStepHistories.length + 1; // +1 for the current action

      if (currentStepDef.approvalMode === "ANY") {
        stepApproved = true;
      } else if (currentStepDef.approvalMode === "MIN_COUNT") {
        const requiredCount = currentStepDef.minApprovalsCount || 1;
        if (approvalCount >= requiredCount) {
          stepApproved = true;
        }
      } else if (currentStepDef.approvalMode === "ALL") {
        // Find all users in the role (simplified logic)
        // A real system would query the number of active users in the approverRoleId
        // For now, if ALL, we simulate by checking if approvalCount >= required users count
        // Let's assume minApprovalsCount represents the total in this mockup if "ALL" is used without a known total
        const requiredCount = currentStepDef.minApprovalsCount || 1; 
        if (approvalCount >= requiredCount) {
          stepApproved = true;
        }
      }

      if (stepApproved) {
        const isLastStep = instance.currentStep >= instance.rule.steps.length;
        if (isLastStep) {
          newStatus = WorkflowStatus.APPROVED;
        } else {
          newStep = instance.currentStep + 1;
          
          // Setup SLA for next step
          const nextStepDef = instance.rule.steps.find(s => s.stepOrder === newStep);
          if (nextStepDef && nextStepDef.expectedDurationHours) {
            const dueAt = new Date();
            dueAt.setHours(dueAt.getHours() + nextStepDef.expectedDurationHours);
            
            await client.workflowInstance.update({
              where: { id: instance.id },
              data: { dueAt, escalateAt: dueAt }
            });

            if (nextStepDef.escalationRoleId) {
              const delay = dueAt.getTime() - Date.now();
              if (delay > 0) {
                await workflowEscalationQueue.add(
                  "escalate",
                  { 
                    instanceId: instance.id, 
                    organizationId, 
                    escalationRoleId: nextStepDef.escalationRoleId,
                    stepOrder: newStep
                  },
                  { delay }
                );
              }
            }
          }
        }
      }
    } else if (action === WorkflowAction.REJECT) {
      newStatus = WorkflowStatus.REJECTED;
    } else if (action === WorkflowAction.REQUEST_CHANGES) {
      newStatus = WorkflowStatus.CHANGES_REQUESTED;
    } else if (action === WorkflowAction.ESCALATE) {
      newStatus = WorkflowStatus.ESCALATED;
    }

    // Unlock entity if rejected or approved
    if (newStatus === WorkflowStatus.APPROVED || newStatus === WorkflowStatus.REJECTED) {
      if (instance.entityType === "ADVANCE") {
        await client.advance.update({
          where: { id: instance.entityId },
          data: { isLocked: false }
        });
      }

      await client.outboxEvent.create({
        data: {
          organizationId,
          aggregateType: instance.entityType,
          aggregateId: instance.entityId,
          eventType: `WORKFLOW_${newStatus}`,
          payload: { instanceId: instance.id }
        }
      });
    }

    const updatedInstance = await client.workflowInstance.update({
      where: { id: instance.id },
      data: {
        status: newStatus,
        currentStep: newStep,
      },
    });

    return updatedInstance;
  },

  getPendingWorkflows: async (organizationId: string, actorUserId: string) => {
    // Basic implementation: fetch all pending workflows.
    // In production, factor in delegation:
    return prisma.workflowInstance.findMany({
      where: {
        organizationId,
        status: { in: [WorkflowStatus.PENDING, WorkflowStatus.CHANGES_REQUESTED] },
      },
      include: {
        rule: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
};
