// @ts-nocheck
export interface UploadOptions {
  contentType?: string;
  isPublic?: boolean;
}

export interface StorageProvider {
  upload(filePath: string, content: Buffer, options?: UploadOptions): Promise<string>;
  download(filePath: string): Promise<Buffer>;
  delete(filePath: string): Promise<void>;
  list(prefix?: string): Promise<{ path: string; lastModified: Date }[]>;
  getSignedUrl(filePath: string, expiresIn?: number): Promise<string>;
}
