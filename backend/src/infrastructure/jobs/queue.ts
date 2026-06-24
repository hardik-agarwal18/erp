import { Queue } from "bullmq";
import Redis from "ioredis";

// Assuming Redis runs on localhost:6379 natively.
// Ideally, this should come from env.
const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export const workflowEscalationQueue = new Queue("workflow-escalations", {
  connection: connection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});
