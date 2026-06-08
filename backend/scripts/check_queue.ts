import { Queue } from "bullmq";
import { queueConnection } from "./src/queue/connection.js";
import { env } from "./src/config/env.js";

async function run() {
  const mailQueue = new Queue("mail-queue", {
    connection: queueConnection.duplicate(),
    prefix: env.NODE_ENV === "test" ? "{test-bull}" : "{bull}"
  });

  const waitingCount = await mailQueue.getWaitingCount();
  const activeCount = await mailQueue.getActiveCount();
  const failedCount = await mailQueue.getFailedCount();
  const completedCount = await mailQueue.getCompletedCount();

  console.log({
    waitingCount,
    activeCount,
    failedCount,
    completedCount
  });

  const failedJobs = await mailQueue.getFailed(0, 5);
  for (const job of failedJobs) {
    console.log("Failed Job ID:", job.id, "Reason:", job.failedReason);
  }

  process.exit(0);
}

run().catch(console.error);
