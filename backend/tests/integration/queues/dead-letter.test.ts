import { jest } from "@jest/globals";
import { Queue, Worker, QueueEvents } from "bullmq";
import { queueConnection } from "../../../src/queue/connection.js";

describe("Queue Dead-Letter Handling", () => {
  let queue: Queue;
  let worker: Worker;
  let queueEvents: QueueEvents;

  beforeAll(async () => {
    queue = new Queue("test-dead-letter-queue", { connection: queueConnection as any, defaultJobOptions: { attempts: 1 } });
    queueEvents = new QueueEvents("test-dead-letter-queue", { connection: queueConnection as any });
    
    worker = new Worker("test-dead-letter-queue", async (job) => {
      throw new Error("Permanent failure");
    }, { connection: queueConnection as any });
    await worker.waitUntilReady();
  });

  afterAll(async () => {
    if (worker) await worker.close();
    if (queueEvents) await queueEvents.close();
    if (queue) await queue.close();
  });

  it("moves permanently failed jobs to failed state (dead letter)", async () => {
    const job = await queue.add("test-fail", { foo: "bar" });
    try {
      await job.waitUntilFinished(queueEvents);
    } catch (err) {
      // expected to throw on failure
    }
    const state = await job.getState();
    expect(state).toBe("failed");
    const updatedJob = await queue.getJob(job.id as string);
    expect(updatedJob?.failedReason).toBe("Permanent failure");
  });
});
