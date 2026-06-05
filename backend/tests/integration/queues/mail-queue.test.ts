import { jest } from "@jest/globals";
import { QueueEvents, Worker } from "bullmq";
import { mailQueue } from "../../../src/queue/queue.service.js";
import { queueConnection } from "../../../src/queue/connection.js";
import { QueueNames, MailJobPayload } from "../../../src/queue/types.js";
import { env } from "../../../src/config/env.js";

// We mock the dispatcher to prevent real emails
jest.mock("../../../src/mail/mail.service.js", () => {
  return {
    DirectMailDispatcher: jest.fn().mockImplementation(() => ({
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      sendInvitationEmail: jest.fn().mockResolvedValue(undefined),
    })),
    defaultProvider: {},
    defaultProviderName: "mock",
    setMailDispatcher: jest.fn(),
  };
});

import { processMailJob } from "../../../src/queue/jobs/mail.job.js";

describe("Mail Queue", () => {
  let queueEvents: QueueEvents;
  let worker: Worker;

  beforeAll(async () => {

    queueEvents = new QueueEvents(QueueNames.MAIL, { connection: queueConnection as any });
    worker = new Worker<MailJobPayload>(QueueNames.MAIL, processMailJob, { connection: queueConnection as any });
    await worker.waitUntilReady();
  });

  afterAll(async () => {
    if (worker) await worker.close();
    if (queueEvents) await queueEvents.close();
    await mailQueue.drain();
  });

  it("enqueues and processes a verification email job", async () => {
    const job = await mailQueue.add("test-verification", {
      type: "verification",
      payload: {
        to: "test@example.com",
        name: "Test User",
        verificationUrl: "https://example.com/verify",
      },
    });

    await job.waitUntilFinished(queueEvents);

    // The job is removed on complete because of removeOnComplete: true in queue options
    // so its state becomes "unknown".
    const state = await job.getState();
    expect(state).toBe("unknown");
  });
});
