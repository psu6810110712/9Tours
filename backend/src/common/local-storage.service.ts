import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { writeFile, unlink, access, readFile } from 'fs/promises';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import {
  StorageService,
  type UploadFileOptions,
  type UploadResult,
  type DeleteFileOptions,
  type GetFileOptions,
  type GetFileResult,
} from './storage.interface';
import {
  getUploadsRoot,
  buildStoredUploadPath,
  buildPublicUploadUrl,
  resolveStoredUploadPath,
} from './upload-paths';

@Injectable()
export class LocalStorageService extends StorageService {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async uploadFile(options: UploadFileOptions): Promise<UploadResult> {
    const { buffer, originalName, folder = '' } = options;

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(originalName);
    const filename = `${uniqueSuffix}${ext}`;

    // Ensure directory exists
    const uploadDir = join(getUploadsRoot(), folder);
    mkdirSync(uploadDir, { recursive: true });

    // Write file to disk
    const absolutePath = join(uploadDir, filename);
    await writeFile(absolutePath, buffer);

    // Build stored path
    const storedPath = buildStoredUploadPath(folder, filename);

    return {
      storedPath,
      publicUrl: buildPublicUploadUrl(storedPath),
    };
  }

  async deleteFile(options: DeleteFileOptions): Promise<void> {
    const { storedPath } = options;
    const absolutePath = resolveStoredUploadPath(storedPath);

    try {
      await unlink(absolutePath);
    } catch (error) {
      // Silently ignore if file doesn't exist
      if ((error as any)?.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async getFile(options: GetFileOptions): Promise<GetFileResult> {
    const { storedPath } = options;
    const absolutePath = resolveStoredUploadPath(storedPath);

    // Verify file exists
    await access(absolutePath);

    return {
      localPath: absolutePath,
    };
  }

  async fileExists(storedPath: string): Promise<boolean> {
    const absolutePath = resolveStoredUploadPath(storedPath);
    try {
      await access(absolutePath);
      return true;
    } catch {
      return false;
    }
  }

  buildPublicUrl(storedPath: string): string {
    return buildPublicUploadUrl(storedPath);
  }
}
