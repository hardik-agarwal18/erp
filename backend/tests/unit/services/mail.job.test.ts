import { jest } from "@jest/globals";

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const mockSendVerification = jest.fn();
const mockSendPasswordReset = jest.fn();
const mockSendInvitation = jest.fn();
const mockSendInvoice = jest.fn();
const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();

const MockDirectMailDispatcher = jest.fn().mockImplementation(() => ({
  sendVerificationEmail: mockSendVerification,
  sendPasswordResetEmail: mockSendPasswordReset,
  sendInvitationEmail: mockSendInvitation,
  sendInvoiceEmail: mockSendInvoice,
}));

jest.mock("../../../src/mail/mail.service.js", () => ({
  DirectMailDispatcher: MockDirectMailDispatcher,
  defaultProvider: {},
  defaultProviderName: "mock",
}));

jest.mock("../../../src/config/logger.js", () => ({
  __esModule: true,
  default: { info: mockLoggerInfo, error: mockLoggerError, warn: jest.fn(), debug: jest.fn() },
}));

import { processMailJob } from "../../../src/queue/jobs/mail.job.js";

const makeJob = (type: string, payload: object = {}) =>
  ({ id: "job-1", data: { type, payload } } as any);

describe("mail.job — processMailJob()", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should dispatch a verification email", async () => {
    mockSendVerification.mockResolvedValue(undefined);

    await processMailJob(makeJob("verification", { to: "a@b.com", name: "Alice", verificationUrl: "https://x" }));

    expect(mockSendVerification).toHaveBeenCalledWith(
      expect.objectContaining({ to: "a@b.com" }),
    );
  });

  it("should dispatch a password-reset email", async () => {
    mockSendPasswordReset.mockResolvedValue(undefined);

    await processMailJob(makeJob("password-reset", { to: "b@b.com", name: "Bob", resetUrl: "https://reset" }));

    expect(mockSendPasswordReset).toHaveBeenCalled();
  });

  it("should dispatch an invitation email", async () => {
    mockSendInvitation.mockResolvedValue(undefined);

    await processMailJob(makeJob("invitation", { to: "c@b.com", name: "Carol", inviteUrl: "https://invite" }));

    expect(mockSendInvitation).toHaveBeenCalled();
  });

  it("should dispatch an invoice email", async () => {
    mockSendInvoice.mockResolvedValue(undefined);

    await processMailJob(makeJob("invoice", { to: "d@b.com" }));

    expect(mockSendInvoice).toHaveBeenCalled();
  });

  it("should throw an error for an unknown job type", async () => {
    await expect(processMailJob(makeJob("unknown-type"))).rejects.toThrow(
      "Unknown mail job type",
    );
  });

  it("should log info on start and completion", async () => {
    mockSendVerification.mockResolvedValue(undefined);

    await processMailJob(makeJob("verification", {}));

    expect(mockLoggerInfo).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: "job-1", type: "verification" }),
      "Processing mail job",
    );
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: "job-1" }),
      "Mail job processed successfully",
    );
  });

  it("should propagate errors thrown by the dispatcher", async () => {
    mockSendVerification.mockRejectedValue(new Error("SMTP error"));

    await expect(processMailJob(makeJob("verification", {}))).rejects.toThrow("SMTP error");
  });
});
