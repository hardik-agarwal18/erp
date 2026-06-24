import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { PrismaClient, WorkflowStatus } from "@prisma/client";
import { auditService } from "../audit/audit.service.js";

const prisma = new PrismaClient();
const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export const workflowEscalationWorker = new Worker(
  "workflow-escalations",
  async (job: Job) => {
    const { instanceId, organizationId, escalationRoleId, stepOrder } = job.data;

    console.log(`[WorkflowEscalationWorker] Processing escalation for instance: ${instanceId}`);

    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId, organizationId },
      include: { rule: true }
    });

    if (!instance) {
      console.log(`[WorkflowEscalationWorker] Instance not found: ${instanceId}`);
      return;
    }

    // Only escalate if the instance is still pending on the same step
    if (instance.status === WorkflowStatus.PENDING && instance.currentStep === stepOrder) {
      // Execute Escalation
      // Escalate means either we change the status to ESCALATED, or we re-assign to the escalationRole.
      // Usually, changing the status is safest, then a manager dashboard can pick it up.
      await prisma.workflowInstance.update({
        where: { id: instanceId },
        data: { status: WorkflowStatus.ESCALATED }
      });

      // Audit Log
      await auditService.log({
        organizationId,
        actorUserId: "SYSTEM",
        action: "WORKFLOW_ESCALATED",
        entityType: "WorkflowInstance",
        entityId: instanceId,
        metadata: {
          reason: "SLA_BREACH",
          escalatedToRole: escalationRoleId,
          stepOrder
        }
      });

      console.log(`[WorkflowEscalationWorker] Instance ${instanceId} escalated.`);
    } else {
      console.log(`[WorkflowEscalationWorker] Instance ${instanceId} no longer pending at step ${stepOrder}. Ignoring.`);
    }
  },
  { connection: connection as any }
);

workflowEscalationWorker.on("completed", (job) => {
  console.log(`Job ${job.id} has completed!`);
});

workflowEscalationWorker.on("failed", (job, err) => {
  console.log(`Job ${job?.id} has failed with ${err.message}`);
});
