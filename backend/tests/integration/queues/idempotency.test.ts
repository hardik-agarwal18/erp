import { jest } from "@jest/globals";
import { Queue, Worker, QueueEvents } from "bullmq";
import { queueConnection } from "../../../src/queue/connection.js";

describe("Queue Idempotency", () => {
  let queue: Queue;
  let worker: Worker;
  let queueEvents: QueueEvents;
  let processedCount = 0;

  beforeAll(async () => {
    queue = new Queue("test-idempotency-queue", { connection: queueConnection as any });
    queueEvents = new QueueEvents("test-idempotency-queue", { connection: queueConnection as any });
    
    worker = new Worker("test-idempotency-queue", async (job) => {
      processedCount++;
      return "Processed";
    }, { connection: queueConnection as any });
    await worker.waitUntilReady();
  });

  afterAll(async () => {
    if (worker) await worker.close();
    if (queueEvents) await queueEvents.close();
    if (queue) await queue.close();
  });

  it("does not process duplicate job IDs twice", async () => {
    const jobId = "idempotent-123";
    
    const job1 = await queue.add("test-idempotency", { foo: "bar" }, { jobId });
    const job2 = await queue.add("test-idempotency", { foo: "bar" }, { jobId });
    
    expect(job1.id).toBe(jobId);
    expect(job2.id).toBe(jobId);
    
    await job1.waitUntilFinished(queueEvents);
    
    // Processed count should be exactly 1 despite two adds
    expect(processedCount).toBe(1);
  });
});
