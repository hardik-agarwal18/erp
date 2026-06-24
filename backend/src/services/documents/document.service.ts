import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import prisma from "../../config/database.js";
import { env } from "../../config/env.js";

const s3 = new S3Client({
  region: env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY || "dummy",
    secretAccessKey: env.S3_SECRET_KEY || "dummy",
  },
});

export const documentService = {
  generatePdfStream: async (
    title: string,
    contentLines: string[]
  ): Promise<PassThrough> => {
    const doc = new PDFDocument();
    const stream = new PassThrough();
    doc.pipe(stream);

    doc.fontSize(20).text(title, { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    for (const line of contentLines) {
      doc.text(line);
    }

    doc.end();
    return stream;
  },

  uploadPdfAndRecord: async (
    organizationId: string,
    actorUserId: string,
    documentType: string,
    entityType: string,
    entityId: string,
    fileName: string,
    pdfStream: PassThrough
  ) => {
    const s3Key = `${organizationId}/${entityType}/${entityId}/${Date.now()}-${fileName}`;

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: env.S3_BUCKET || "erp-documents-bucket",
      Key: s3Key,
      Body: pdfStream,
      ContentType: "application/pdf",
    });

    await s3.send(uploadCommand);

    // Record in DB
    const document = await prisma.document.create({
      data: {
        organizationId,
        documentType,
        entityType,
        entityId,
        fileName,
        mimeType: "application/pdf",
        s3Key,
        fileSize: 0, // Ideally we'd calculate this from the stream
        uploadedById: actorUserId,
      },
    });

    return document;
  },

  getSignedUrlForDocument: async (organizationId: string, documentId: string) => {
    const document = await prisma.document.findFirst({
      where: { id: documentId, organizationId },
    });

    if (!document) throw new Error("Document not found");

    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET || "erp-documents-bucket",
      Key: document.s3Key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return url;
  },
};
