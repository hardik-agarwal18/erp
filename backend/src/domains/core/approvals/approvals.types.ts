// @ts-nocheck
import { ApprovalStatus, ApproverType } from "@prisma/client";

export interface CreateApprovalTemplateInput {
  entityType: string;
  name: string;
  steps: CreateApprovalStepInput[];
}

export interface CreateApprovalStepInput {
  order: number;
  approverType: ApproverType;
  roleId?: string;
  userId?: string;
  escalationAfterHours?: number;
  autoApprove?: boolean;
}

export interface ActionApprovalInput {
  comments?: string;
}
