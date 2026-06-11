import { jest } from "@jest/globals";

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const mockInvoiceFindById = jest.fn();
const mockUploadFile = jest.fn();
const mockGetSignedUrl = jest.fn();
const mockMailQueueAdd = jest.fn();
const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();

// Mock PDFKit – returns a fake EventEmitter that immediately streams & ends
jest.mock("pdfkit", () => {
  const { EventEmitter } = require("events");
  return jest.fn().mockImplementation(() => {
    const doc: any = new EventEmitter();
    doc.fontSize = jest.fn().mockReturnThis();
    doc.text = jest.fn().mockReturnThis();
    doc.moveDown = jest.fn().mockReturnThis();
    doc.end = jest.fn().mockImplementation(function (this: any) {
      this.emit("data", Buffer.from("pdf-content"));
      this.emit("end");
    });
    return doc;
  });
});

import { invoiceRepository } from "../../../src/modules/invoices/invoice.repository.js";
import { storageService } from "../../../src/lib/storage/storage.service.js";

import { mailQueue } from "../../../src/queue/queue.service.js";

jest.mock("../../../src/queue/connection.js", () => ({
  queueConnection: { duplicate: jest.fn().mockReturnThis() },
}));

jest.mock("../../../src/queue/types.js", () => ({
  QueueNames: { MAIL: "mail" },
}));

jest.mock("../../../src/config/logger.js", () => ({
  __esModule: true,
  default: { info: mockLoggerInfo, error: mockLoggerError, warn: jest.fn(), debug: jest.fn() },
}));

import { processPdfGenerationJob } from "../../../src/queue/jobs/pdf.job.js";

const baseInvoice = {
  invoiceNumber: "INV-001",
  issueDate: new Date("2026-01-01"),
  totalAmount: 500,
  customer: { name: "Alice Corp", email: "alice@corp.com" },
  items: [
    { product: { name: "Widget" }, quantity: 2, lineTotal: 250 },
    { product: { name: "Gadget" }, quantity: 1, lineTotal: 250 },
  ],
};

const makeJob = (overrides: object = {}) =>
  ({
    id: "pdf-job-1",
    data: {
      documentId: "inv-1",
      documentType: "INVOICE",
      organizationId: "org-1",
      ...overrides,
    },
  } as any);

describe("pdf.job — processPdfGenerationJob()", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(invoiceRepository, "findById").mockImplementation(mockInvoiceFindById as any);
    jest.spyOn(storageService, "uploadFile").mockImplementation(mockUploadFile as any);
    jest.spyOn(storageService, "getSignedUrl").mockImplementation(mockGetSignedUrl as any);
    jest.spyOn(mailQueue, "add").mockImplementation(mockMailQueueAdd as any);
  });

  it("should throw for unsupported document types", async () => {
    await expect(
      processPdfGenerationJob(makeJob({ documentType: "QUOTE" })),
    ).rejects.toThrow("Document type QUOTE not supported yet");
  });

  it("should throw when invoice is not found", async () => {
    mockInvoiceFindById.mockResolvedValue(null);

    await expect(processPdfGenerationJob(makeJob())).rejects.toThrow("Invoice inv-1 not found");
  });

  it("should generate PDF, upload to storage, and return storagePath", async () => {
    mockInvoiceFindById.mockResolvedValue(baseInvoice);
    mockUploadFile.mockResolvedValue("organizations/org-1/invoices/INV-001.pdf");
    mockGetSignedUrl.mockResolvedValue("https://signed.url/INV-001.pdf");
    mockMailQueueAdd.mockResolvedValue({});

    const result = await processPdfGenerationJob(makeJob());

    expect(mockUploadFile).toHaveBeenCalledWith(
      "organizations/org-1/invoices/INV-001.pdf",
      expect.any(Buffer),
      "application/pdf",
    );
    expect(result).toEqual({ storagePath: "organizations/org-1/invoices/INV-001.pdf" });
  });

  it("should enqueue an invoice email when customer has an email", async () => {
    mockInvoiceFindById.mockResolvedValue(baseInvoice);
    mockUploadFile.mockResolvedValue({});
    mockGetSignedUrl.mockResolvedValue("https://signed.url/file.pdf");
    mockMailQueueAdd.mockResolvedValue({});

    await processPdfGenerationJob(makeJob());

    expect(mockGetSignedUrl).toHaveBeenCalled();
    expect(mockMailQueueAdd).toHaveBeenCalledWith(
      "invoice-email",
      expect.objectContaining({ type: "invoice" }),
    );
  });

  it("should NOT enqueue email when customer has no email", async () => {
    mockInvoiceFindById.mockResolvedValue({
      ...baseInvoice,
      customer: { name: "No Email Corp" }, // no email
    });
    mockUploadFile.mockResolvedValue({});

    await processPdfGenerationJob(makeJob());

    expect(mockMailQueueAdd).not.toHaveBeenCalled();
  });

  it("should handle invoice with no customer", async () => {
    mockInvoiceFindById.mockResolvedValue({
      ...baseInvoice,
      customer: null,
    });
    mockUploadFile.mockResolvedValue({});

    const result = await processPdfGenerationJob(makeJob());

    expect(result).toBeDefined();
    expect(mockMailQueueAdd).not.toHaveBeenCalled();
  });
});
