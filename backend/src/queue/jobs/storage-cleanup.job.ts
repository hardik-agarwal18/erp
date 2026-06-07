import { Job } from "bullmq";
import logger from "../../config/logger.js";
import { storageService } from "../../lib/storage/storage.service.js";
import { env } from "../../config/env.js";

export const processCleanupJob = async (job: Job) => {
  logger.info({ jobId: job.id }, "Starting storage cleanup job");

  const retentionDays = process.env.EXPORT_RETENTION_DAYS 
    ? parseInt(process.env.EXPORT_RETENTION_DAYS, 10) 
    : 7;

  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() - retentionDays);
  
  logger.info(`Scanning for storage objects older than ${retentionDate.toISOString()} to clean up...`);
  
  let deletedCount = 0;

  try {
    // List all files in the organizations folder
    const files = await storageService.listFiles("organizations/");
    
    for (const file of files) {
      // Check if it's an export or temporary PDF artifact
      if (
        file.path.includes("/exports/reports/") || 
        file.path.includes("/exports/audit/") ||
        file.path.includes("/temp/pdfs/")
      ) {
        if (file.lastModified < retentionDate) {
          logger.debug({ path: file.path }, "Deleting expired storage object");
          await storageService.deleteFile(file.path);
          deletedCount++;
        }
      }
    }
  } catch (error) {
    logger.error({ error }, "Error during storage cleanup");
    throw error;
  }
  
  logger.info({ deletedCount }, "Storage cleanup job completed");
  return { status: "OK", deletedCount };
};
