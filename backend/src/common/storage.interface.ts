export interface UploadFileOptions {
  buffer: Buffer;
  originalName: string;
  mimetype: string;
  folder?: string;
}

export interface UploadResult {
  /**
   * The stored path or key for the uploaded file.
   * For local storage: 'uploads/slips/12345.jpg'
   * For S3: 'slips/12345.jpg'
   */
  storedPath: string;

  /**
   * The public URL to access the file.
   */
  publicUrl: string;
}

export interface DeleteFileOptions {
  storedPath: string;
}

export interface GetFileOptions {
  storedPath: string;
}

export interface GetFileResult {
  /**
   * For local storage: absolute file path
   * For S3: pre-signed URL or absolute path if downloaded
   */
  localPath?: string;

  /**
   * For S3: the file buffer
   */
  buffer?: Buffer;

  /**
   * Content type of the file
   */
  contentType?: string;
}

export abstract class StorageService {
  /**
   * Upload a file to storage
   */
  abstract uploadFile(options: UploadFileOptions): Promise<UploadResult>;

  /**
   * Delete a file from storage
   */
  abstract deleteFile(options: DeleteFileOptions): Promise<void>;

  /**
   * Get file content or path for serving
   */
  abstract getFile(options: GetFileOptions): Promise<GetFileResult>;

  /**
   * Check if file exists
   */
  abstract fileExists(storedPath: string): Promise<boolean>;

  /**
   * Build public URL from stored path
   */
  abstract buildPublicUrl(storedPath: string): string;
}
