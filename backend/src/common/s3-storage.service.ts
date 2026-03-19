import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { extname } from 'path';
import {
  StorageService,
  type UploadFileOptions,
  type UploadResult,
  type DeleteFileOptions,
  type GetFileOptions,
  type GetFileResult,
} from './storage.interface';

@Injectable()
export class S3StorageService extends StorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly cloudFrontDomain?: string;

  constructor(private readonly configService: ConfigService) {
    super();

    this.region = this.configService.get<string>('AWS_S3_REGION') || 'us-east-1';
    this.bucketName = this.configService.getOrThrow<string>('AWS_S3_BUCKET_NAME');
    this.cloudFrontDomain = this.configService.get<string>('AWS_CLOUDFRONT_DOMAIN');

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadFile(options: UploadFileOptions): Promise<UploadResult> {
    const { buffer, originalName, mimetype, folder = '' } = options;

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(originalName);
    const filename = `${uniqueSuffix}${ext}`;

    // Build S3 key
    const key = folder ? `${folder}/${filename}` : filename;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      // Optional: Set cache control
      CacheControl: 'max-age=31536000', // 1 year for immutable files
    });

    await this.s3Client.send(command);

    return {
      storedPath: key,
      publicUrl: this.buildPublicUrl(key),
    };
  }

  async deleteFile(options: DeleteFileOptions): Promise<void> {
    const { storedPath } = options;

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: storedPath,
      });

      await this.s3Client.send(command);
    } catch (error) {
      // Silently ignore if file doesn't exist
      if ((error as any)?.name !== 'NoSuchKey') {
        throw error;
      }
    }
  }

  async getFile(options: GetFileOptions): Promise<GetFileResult> {
    const { storedPath } = options;

    // Get object from S3
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: storedPath,
    });

    const response = await this.s3Client.send(command);

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return {
      buffer,
      contentType: response.ContentType,
    };
  }

  async fileExists(storedPath: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: storedPath,
      });

      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  buildPublicUrl(storedPath: string): string {
    // If CloudFront is configured, use it
    if (this.cloudFrontDomain) {
      return `https://${this.cloudFrontDomain}/${storedPath}`;
    }

    // Otherwise, use S3 direct URL
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${storedPath}`;
  }

  /**
   * Generate a pre-signed URL for temporary access (e.g., for protected files)
   */
  async getSignedUrl(storedPath: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: storedPath,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }
}
