import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageProvider, UploadOptions } from "../storage.types.js";
import { env } from "../../../config/env.js";
import { Readable } from "stream";

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.client = new S3Client({
      region: env.S3_REGION || "us-east-1",
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY || "",
        secretAccessKey: env.S3_SECRET_KEY || "",
      },
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: true, // Needed for minio/r2
    });
    this.bucket = env.S3_BUCKET || "erp-storage";
  }

  async upload(filePath: string, content: Buffer, options?: UploadOptions): Promise<string> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
      Body: content,
      ContentType: options?.contentType,
      ACL: options?.isPublic ? "public-read" : "private",
    }));
    return filePath;
  }

  async download(filePath: string): Promise<Buffer> {
    const result = await this.client.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
    }));
    const stream = result.Body as Readable;
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }

  async delete(filePath: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
    }));
  }

  async list(prefix = ""): Promise<{ path: string; lastModified: Date }[]> {
    const results: { path: string; lastModified: Date }[] = [];
    
    let isTruncated = true;
    let continuationToken: string | undefined = undefined;

    while (isTruncated) {
      const command: any = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const response: any = await this.client.send(command);
      
      if (response.Contents) {
        for (const item of response.Contents) {
          if (item.Key && item.LastModified) {
            results.push({
              path: item.Key,
              lastModified: item.LastModified,
            });
          }
        }
      }

      isTruncated = response.IsTruncated ?? false;
      continuationToken = response.NextContinuationToken;
    }

    return results;
  }

  async getSignedUrl(filePath: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: filePath });
    return getSignedUrl(this.client, command, { expiresIn });
  }
}
