
import fs from "fs/promises";
import path from "path";
import { StorageProvider, UploadOptions } from "../storage.types.js";
import { env } from "../../../config/env.js";

export class LocalStorageProvider implements StorageProvider {
  private basePath: string;

  constructor(basePath = env.STORAGE_LOCAL_PATH || "./uploads") {
    this.basePath = path.resolve(process.cwd(), basePath);
  }

  async upload(filePath: string, content: Buffer, options?: UploadOptions): Promise<string> {
    const fullPath = path.join(this.basePath, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content);
    return filePath;
  }

  async download(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, filePath);
    return fs.readFile(fullPath);
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, filePath);
    await fs.unlink(fullPath).catch(() => {});
  }

  async list(prefix = ""): Promise<{ path: string; lastModified: Date }[]> {
    const results: { path: string; lastModified: Date }[] = [];
    const searchPath = path.join(this.basePath, prefix);
    
    try {
      async function walk(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const res = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await walk(res);
          } else {
            const stat = await fs.stat(res);
            results.push({
              path: path.relative(path.resolve(process.cwd(), env.STORAGE_LOCAL_PATH || "./uploads"), res).replace(/\\/g, "/"),
              lastModified: stat.mtime
            });
          }
        }
      }
      
      const stat = await fs.stat(searchPath).catch(() => null);
      if (stat && stat.isDirectory()) {
        await walk(searchPath);
      } else if (stat) {
        results.push({
          path: path.relative(path.resolve(process.cwd(), env.STORAGE_LOCAL_PATH || "./uploads"), searchPath).replace(/\\/g, "/"),
          lastModified: stat.mtime
        });
      }
    } catch (error) {
      // Ignore if directory doesn't exist
    }
    return results;
  }

  async getSignedUrl(filePath: string, expiresIn?: number): Promise<string> {
    // In local mode, return a mocked API route that serves files
    return `${env.APP_URL}/api/v1/storage/${filePath}`;
  }
}
