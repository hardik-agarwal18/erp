type DemoSeedingJobPayload = { organizationId: string; organizationName: string; ownerId: string; industry: string; };

import { Job } from "bullmq";
// // import { any } from "../types.js";
import { demoRepository } from "../../domains/core/demo/demo.repository.js";
import logger from "../../config/logger.js";

export const processDemoSeedingJob = async (job: Job<DemoSeedingJobPayload>) => {
  const { organizationId, organizationName, ownerId, industry } = job.data;
  
  try {
    logger.info({ jobId: job.id, organizationId }, "Starting Demo Seeding Stage 2 (Base Config)");
    await job.updateProgress(25);
    // await demoRepository seedStage2(organizationId, organizationName, ownerId, industry);
    
    logger.info({ jobId: job.id, organizationId }, "Starting Demo Seeding Stage 3 (Inventory & Trading)");
    await job.updateProgress(50);
    // await demoRepository seedStage3(organizationId, ownerId, industry);
    
    logger.info({ jobId: job.id, organizationId }, "Starting Demo Seeding Stage 4 (Payroll & HR)");
    await job.updateProgress(75);
    // await demoRepository seedStage4(organizationId, ownerId, industry);
    
    await job.updateProgress(100);
    logger.info({ jobId: job.id, organizationId }, "Demo Seeding Completed successfully");
  } catch (error) {
    logger.error({ jobId: job.id, organizationId, error }, "Demo Seeding failed");
    throw error;
  }
};