import { jest } from "@jest/globals";
import { Queue, Worker, QueueEvents } from "bullmq";
import { queueConnection } from "../../../src/queue/connection.js";

describe("Queue Retry Logic", () => {
  let queue: Queue;
  let worker: Worker;
  let queueEvents: QueueEvents;

  beforeAll(async () => {
    queue = new Queue("test-retry-queue", { connection: queueConnection as any, defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 100 } } });
    queueEvents = new QueueEvents("test-retry-queue", { connection: queueConnection as any });
    
    let attempts = 0;
    worker = new Worker("test-retry-queue", async (job) => {
      attempts++;
      if (attempts < 3) throw new Error("Temporary failure");
      return "Success";
    }, { connection: queueConnection as any });
    await worker.waitUntilReady();
  });

  afterAll(async () => {
    if (worker) await worker.close();
    if (queueEvents) await queueEvents.close();
    if (queue) await queue.close();
  });

  it("retries jobs with exponential backoff", async () => {
    const job = await queue.add("test-job", { foo: "bar" });
    await job.waitUntilFinished(queueEvents);
    const state = await job.getState();
    expect(state).toBe("completed");
    const updatedJob = await queue.getJob(job.id as string);
    expect(updatedJob?.attemptsMade).toBeGreaterThan(1);
  });
});
