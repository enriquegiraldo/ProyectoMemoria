import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { MediaProcessor, MediaProcessingOptions } from '../processors';
import { CloudStorageService } from '../storage/cloud.storage';
import { CDNService } from '../cdn/cdn.service';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { 
  ProcessingError, 
  ValidationError, 
  StorageError,
  CDNError 
} from '../utils/errors';
import { config } from '../config';
import { 
  uploadRequestSchema, 
  processingRequestSchema,
  fileQuerySchema 
} from '../utils/validation';

export class MediaController {
  private mediaProcessor: MediaProcessor;
  private storageService: CloudStorageService;
  private cdnService: CDNService;

  constructor() {
    this.mediaProcessor = new MediaProcessor();
    this.storageService = new CloudStorageService();
    this.cdnService = new CDNService();
  }

  /**
   * Upload and process media file
   */
  async uploadAndProcess(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const validatedData = uploadRequestSchema.parse(req.body);
      const userId = req.user?.id || 'anonymous';
      const fileId = uuidv4();

      logger.info('Media upload request received', { userId, fileId, fileType: req.file?.mimetype });

      // Process media file
      const processingOptions: MediaProcessingOptions = {
        image: validatedData.image,
        video: validatedData.video,
        audio: validatedData.audio,
        document: validatedData.document,
        output: validatedData.output,
        metadata: validatedData.metadata,
      };

      const result = await this.mediaProcessor.processMedia(
        req.file!.path,
        processingOptions,
        userId,
        fileId
      );

      // Upload to cloud storage if requested
      let storageResult = null;
      if (validatedData.storage) {
        storageResult = await this.storageService.uploadFile(
          result.processedPath,
          {
            provider: validatedData.storage.provider,
            bucket: validatedData.storage.bucket,
            folder: validatedData.storage.folder,
            public: validatedData.storage.public,
            metadata: validatedData.storage.metadata,
          },
          userId
        );
      }

      // Optimize for CDN if requested
      let cdnResult = null;
      if (validatedData.cdn && storageResult) {
        cdnResult = await this.cdnService.optimizeURL(
          storageResult.url,
          {
            provider: validatedData.cdn.provider,
            transformations: validatedData.cdn.transformations,
            optimization: validatedData.cdn.optimization,
            delivery: validatedData.cdn.delivery,
          },
          userId
        );
      }

      // Record metrics
      metrics.recordFileUpload(userId, result.mediaType, 'completed', req.file!.size / 1024 / 1024);

      res.status(200).json({
        success: true,
        data: {
          fileId,
          originalFile: {
            name: req.file!.originalname,
            size: req.file!.size,
            mimetype: req.file!.mimetype,
          },
          processedFile: {
            path: result.processedPath,
            size: result.metadata.size,
            duration: result.duration,
            mediaType: result.mediaType,
          },
          storage: storageResult ? {
            url: storageResult.url,
            key: storageResult.key,
            provider: storageResult.provider,
          } : null,
          cdn: cdnResult ? {
            optimizedUrl: cdnResult.optimizedUrl,
            provider: cdnResult.metadata.provider,
          } : null,
          thumbnails: result.thumbnails,
          extractedContent: result.extractedContent,
        },
        message: 'Media file processed successfully',
      });

    } catch (error) {
      logger.error('Media upload failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        file: req.file?.originalname 
      });

      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.message,
        });
      } else if (error instanceof ProcessingError) {
        res.status(422).json({
          success: false,
          error: 'Processing failed',
          details: error.message,
        });
      } else if (error instanceof StorageError) {
        res.status(500).json({
          success: false,
          error: 'Storage failed',
          details: error.message,
        });
      } else if (error instanceof CDNError) {
        res.status(500).json({
          success: false,
          error: 'CDN optimization failed',
          details: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          details: 'An unexpected error occurred',
        });
      }
    }
  }

  /**
   * Process existing media file
   */
  async processMedia(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = processingRequestSchema.parse(req.body);
      const userId = req.user?.id || 'anonymous';
      const fileId = uuidv4();

      logger.info('Media processing request received', { userId, fileId, filePath: validatedData.filePath });

      const result = await this.mediaProcessor.processMedia(
        validatedData.filePath,
        validatedData.options,
        userId,
        fileId
      );

      res.status(200).json({
        success: true,
        data: {
          fileId,
          processedFile: {
            path: result.processedPath,
            size: result.metadata.size,
            duration: result.duration,
            mediaType: result.mediaType,
          },
          thumbnails: result.thumbnails,
          extractedContent: result.extractedContent,
        },
        message: 'Media file processed successfully',
      });

    } catch (error) {
      logger.error('Media processing failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id 
      });

      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.message,
        });
      } else if (error instanceof ProcessingError) {
        res.status(422).json({
          success: false,
          error: 'Processing failed',
          details: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          details: 'An unexpected error occurred',
        });
      }
    }
  }

  /**
   * Get media metadata
   */
  async getMetadata(req: Request, res: Response): Promise<void> {
    try {
      const { filePath } = req.params;
      const userId = req.user?.id || 'anonymous';

      logger.info('Metadata request received', { userId, filePath });

      const metadata = await this.mediaProcessor.getMetadata(filePath);

      res.status(200).json({
        success: true,
        data: {
          filePath,
          metadata,
        },
        message: 'Metadata retrieved successfully',
      });

    } catch (error) {
      logger.error('Metadata retrieval failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        filePath: req.params.filePath 
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve metadata',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Validate media file
   */
  async validateMedia(req: Request, res: Response): Promise<void> {
    try {
      const { filePath } = req.params;
      const userId = req.user?.id || 'anonymous';

      logger.info('Media validation request received', { userId, filePath });

      const isValid = await this.mediaProcessor.validateMedia(filePath);

      res.status(200).json({
        success: true,
        data: {
          filePath,
          isValid,
        },
        message: isValid ? 'Media file is valid' : 'Media file is invalid',
      });

    } catch (error) {
      logger.error('Media validation failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        filePath: req.params.filePath 
      });

      res.status(500).json({
        success: false,
        error: 'Failed to validate media file',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get supported formats
   */
  async getSupportedFormats(req: Request, res: Response): Promise<void> {
    try {
      const { mediaType } = req.params;
      const userId = req.user?.id || 'anonymous';

      logger.info('Supported formats request received', { userId, mediaType });

      const supportedFormats = this.mediaProcessor.getSupportedFormats(mediaType as any);
      const outputFormats = this.mediaProcessor.getOutputFormats(mediaType as any);

      res.status(200).json({
        success: true,
        data: {
          mediaType,
          supportedFormats,
          outputFormats,
        },
        message: 'Supported formats retrieved successfully',
      });

    } catch (error) {
      logger.error('Supported formats retrieval failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        mediaType: req.params.mediaType 
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve supported formats',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Batch process multiple files
   */
  async batchProcess(req: Request, res: Response): Promise<void> {
    try {
      const { files } = req.body;
      const userId = req.user?.id || 'anonymous';

      if (!Array.isArray(files) || files.length === 0) {
        throw new ValidationError('Files array is required and must not be empty');
      }

      logger.info('Batch processing request received', { userId, fileCount: files.length });

      const results = await this.mediaProcessor.batchProcess(files, userId);

      res.status(200).json({
        success: true,
        data: {
          processedFiles: results.length,
          totalFiles: files.length,
          results,
        },
        message: `Batch processing completed. ${results.length}/${files.length} files processed successfully`,
      });

    } catch (error) {
      logger.error('Batch processing failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id 
      });

      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Batch processing failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Get processing status
   */
  async getProcessingStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'anonymous';

      logger.info('Processing status request received', { userId });

      const status = this.mediaProcessor.getProcessingStatus();

      res.status(200).json({
        success: true,
        data: {
          status,
          timestamp: new Date().toISOString(),
        },
        message: 'Processing status retrieved successfully',
      });

    } catch (error) {
      logger.error('Processing status retrieval failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id 
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve processing status',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const status = {
        service: 'media-service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: config.app.version,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        processors: this.mediaProcessor.getProcessingStatus(),
      };

      res.status(200).json({
        success: true,
        data: status,
        message: 'Media service is healthy',
      });

    } catch (error) {
      logger.error('Health check failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      res.status(503).json({
        success: false,
        error: 'Service unhealthy',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
