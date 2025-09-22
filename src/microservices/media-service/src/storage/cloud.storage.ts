import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v2 as cloudinary } from 'cloudinary';
import { BlobServiceClient } from '@azure/storage-blob';
import { readFileSync, createReadStream, existsSync } from 'fs';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { StorageProvider, StorageMetadata } from '../types';
import logger from '../utils/logger'; 
import {storage } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { StorageError, FileNotFoundError, UploadError } from '../utils/errors';
import { config } from '../config';

export interface CloudStorageOptions {
  provider: StorageProvider;
  bucket?: string;
  folder?: string;
  public?: boolean;
  metadata?: Record<string, string>;
  contentType?: string;
}

export interface CloudStorageResult {
  success: boolean;
  url: string;
  key: string;
  size: number;
  metadata: StorageMetadata;
  provider: StorageProvider;
}

export class CloudStorageService {
  private s3Client: S3Client;
  private azureClient: BlobServiceClient;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    if (config.storage.s3.enabled) {
      this.s3Client = new S3Client({
        region: config.storage.s3.region,
        credentials: {
          accessKeyId: config.storage.s3.accessKeyId,
          secretAccessKey: config.storage.s3.secretAccessKey,
        },
      });
    }

    if (config.storage.azure.enabled) {
      this.azureClient = BlobServiceClient.fromConnectionString(
        config.storage.azure.connectionString
      );
    }

    if (config.storage.cloudinary.enabled) {
      cloudinary.config({
        cloud_name: config.storage.cloudinary.cloudName,
        api_key: config.storage.cloudinary.apiKey,
        api_secret: config.storage.cloudinary.apiSecret,
      });
    }
  }

  async uploadFile(
    filePath: string,
    options: CloudStorageOptions,
    userId: string
  ): Promise<CloudStorageResult> {
    const startTime = Date.now();
    const uploadId = uuidv4();

    try {
      storage.uploadStarted(userId, filePath, uploadId, options.provider);

      if (!existsSync(filePath)) {
        throw new FileNotFoundError(`File not found: ${filePath}`);
      }

      let result: CloudStorageResult;

      switch (options.provider) {
        case StorageProvider.AWS_S3:
          result = await this.uploadToS3(filePath, options, userId);
          break;
        case StorageProvider.AZURE_BLOB:
          result = await this.uploadToAzure(filePath, options, userId);
          break;
        case StorageProvider.CLOUDINARY:
          result = await this.uploadToCloudinary(filePath, options, userId);
          break;
        default:
          throw new StorageError(`Unsupported provider: ${options.provider}`);
      }

      const duration = Date.now() - startTime;
      storage.uploadCompleted(userId, filePath, uploadId, options.provider, duration);
      metrics.recordStorageOperation(userId, options.provider, 'upload', 'completed', duration / 1000);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      storage.uploadFailed(userId, filePath, uploadId, options.provider, error instanceof Error ? error.message : 'Unknown error');
      metrics.recordStorageOperation(userId, options.provider, 'upload', 'failed', duration / 1000);
      throw new UploadError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async uploadToS3(
    filePath: string,
    options: CloudStorageOptions,
    userId: string
  ): Promise<CloudStorageResult> {
    const bucket = options.bucket || config.storage.s3.bucket;
    const key = this.generateKey(filePath, options.folder);
    const fileBuffer = readFileSync(filePath);
    const contentType = options.contentType || this.getContentType(filePath);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: options.metadata,
      ACL: options.public ? 'public-read' : 'private',
    });

    await this.s3Client.send(command);

    const url = options.public 
      ? `https://${bucket}.s3.${config.storage.s3.region}.amazonaws.com/${key}`
      : await getSignedUrl(this.s3Client, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 3600 });

    return {
      success: true,
      url,
      key,
      size: fileBuffer.length,
      metadata: {
        provider: StorageProvider.AWS_S3,
        bucket,
        region: config.storage.s3.region,
        contentType,
        uploadedAt: new Date().toISOString(),
        userId,
      },
      provider: StorageProvider.AWS_S3,
    };
  }

  private async uploadToAzure(
    filePath: string,
    options: CloudStorageOptions,
    userId: string
  ): Promise<CloudStorageResult> {
    const containerName = options.bucket || config.storage.azure.container;
    const blobName = this.generateKey(filePath, options.folder);
    const fileBuffer = readFileSync(filePath);
    const contentType = options.contentType || this.getContentType(filePath);

    const containerClient = this.azureClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);

    await blobClient.uploadData(fileBuffer, {
      blobHTTPHeaders: { blobContentType: contentType },
      metadata: options.metadata,
    });

    return {
      success: true,
      url: blobClient.url,
      key: blobName,
      size: fileBuffer.length,
      metadata: {
        provider: StorageProvider.AZURE_BLOB,
        container: containerName,
        contentType,
        uploadedAt: new Date().toISOString(),
        userId,
      },
      provider: StorageProvider.AZURE_BLOB,
    };
  }

  private async uploadToCloudinary(
    filePath: string,
    options: CloudStorageOptions,
    userId: string
  ): Promise<CloudStorageResult> {
    const folder = options.folder || config.storage.cloudinary.folder;
    const publicId = this.generateKey(filePath, folder);

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          folder,
          resource_type: 'auto',
          access_mode: options.public ? 'public' : 'authenticated',
        },
        (error: any, result: any) => {
          if (error) {
            reject(new UploadError(`Cloudinary upload failed: ${error.message}`));
            return;
          }

          resolve({
            success: true,
            url: result.secure_url,
            key: result.public_id,
            size: result.bytes,
            metadata: {
              provider: StorageProvider.CLOUDINARY,
              publicId: result.public_id,
              format: result.format,
              uploadedAt: new Date().toISOString(),
              userId,
            },
            provider: StorageProvider.CLOUDINARY,
          });
        }
      );

      createReadStream(filePath).pipe(uploadStream);
    });
  }

  async deleteFile(
    key: string,
    provider: StorageProvider,
    options: { bucket?: string } = {}
  ): Promise<boolean> {
    try {
      switch (provider) {
        case StorageProvider.AWS_S3:
          await this.deleteFromS3(key, options);
          break;
        case StorageProvider.AZURE_BLOB:
          await this.deleteFromAzure(key, options);
          break;
        case StorageProvider.CLOUDINARY:
          await this.deleteFromCloudinary(key);
          break;
        default:
          throw new StorageError(`Unsupported provider: ${provider}`);
      }
      return true;
    } catch (error) {
      logger.error('Delete file failed', { key, provider, error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  private async deleteFromS3(key: string, options: { bucket?: string }): Promise<void> {
    const bucket = options.bucket || config.storage.s3.bucket;
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    await this.s3Client.send(command);
  }

  private async deleteFromAzure(key: string, options: { bucket?: string }): Promise<void> {
    const containerName = options.bucket || config.storage.azure.container;
    const containerClient = this.azureClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(key);
    await blobClient.delete();
  }

  private async deleteFromCloudinary(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(key, (error: any) => {
        if (error) {
          reject(new StorageError(`Cloudinary delete failed: ${error.message}`));
          return;
        }
        resolve();
      });
    });
  }

  private generateKey(filePath: string, folder?: string): string {
    const extension = extname(filePath);
    const fileName = `${uuidv4()}${extension}`;
    return folder ? `${folder}/${fileName}` : fileName;
  }

  private getContentType(filePath: string): string {
    const extension = extname(filePath).toLowerCase();
    const contentTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.gif': 'image/gif', '.webp': 'image/webp', '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo', '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.pdf': 'application/pdf',
      '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return contentTypes[extension] || 'application/octet-stream';
  }
}
