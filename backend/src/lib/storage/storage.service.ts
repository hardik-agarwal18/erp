import { env } from "../../config/env.js";
import { LocalStorageProvider } from "./providers/local.provider.js";
import { S3StorageProvider } from "./providers/s3.provider.js";
import { StorageProvider } from "./storage.types.js";

class StorageService {
  private provider: StorageProvider;

  constructor() {
    if (env.STORAGE_PROVIDER === "s3") {
      this.provider = new S3StorageProvider();
    } else {
      this.provider = new LocalStorageProvider();
    }
  }

  async uploadFile(path: string, content: Buffer, contentType?: string) {
    return this.provider.upload(path, content, { contentType });
  }

  async getSignedUrl(path: string, expiresIn?: number) {
    return this.provider.getSignedUrl(path, expiresIn);
  }

  async getFile(path: string) {
    return this.provider.download(path);
  }
  
  async deleteFile(path: string) {
    return this.provider.delete(path);
  }

  async listFiles(prefix?: string) {
    return this.provider.list(prefix);
  }
}

export const storageService = new StorageService();
