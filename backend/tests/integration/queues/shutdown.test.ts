import { jest } from "@jest/globals";
import { Queue, Worker } from "bullmq";
import { queueConnection } from "../../../src/queue/connection.js";

describe("Worker Graceful Shutdown", () => {
  let queue: Queue;
  let worker: Worker;

  beforeAll(async () => {
    queue = new Queue("test-shutdown-queue", { connection: queueConnection as any });
  });

  afterAll(async () => {
    if (queue) await queue.close();
  });

  it("completes active jobs before shutting down", async () => {
    let jobStarted = false;
    let jobCompleted = false;

    worker = new Worker("test-shutdown-queue", async (job) => {
      jobStarted = true;
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate work
      jobCompleted = true;
      return "Done";
    }, { connection: queueConnection as any });

    await worker.waitUntilReady();

    await queue.add("test-shutdown", {});
    
    // Wait for job to start
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (jobStarted) {
          clearInterval(interval);
          resolve(true);
        }
      }, 50);
    });

    // Initiate graceful shutdown
    const closePromise = worker.close();

    // Verify it doesn't close immediately while job is active
    expect(jobCompleted).toBe(false);

    // Wait for shutdown to complete
    await closePromise;

    // Verify job was allowed to complete
    expect(jobCompleted).toBe(true);
  });
});
