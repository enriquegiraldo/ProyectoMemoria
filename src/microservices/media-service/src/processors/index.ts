import { existsSync, mkdirSync } from 'fs';
import { join, dirname, extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  ProcessingOptions, 
  ProcessingResult, 
  ProcessingStatus,
  MediaFile,
  MediaType
} from '../types';
import  logger, {processing } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { 
  ProcessingError, 
  UnsupportedFormatError, 
  FileCorruptedError 
} from '../utils/errors';
import { config } from '../config';

// Import all processors
import { ImageProcessor, ImageProcessingOptions, ImageProcessingResult } from './image.processor';
import { VideoProcessor, VideoProcessingOptions, VideoProcessingResult } from './video.processor';
import { AudioProcessor, AudioProcessingOptions, AudioProcessingResult } from './audio.processor';
import { DocumentProcessor, DocumentProcessingOptions, DocumentProcessingResult } from './document.processor';

export interface MediaProcessingOptions {
  image?: ImageProcessingOptions;
  video?: VideoProcessingOptions;
  audio?: AudioProcessingOptions;
  document?: DocumentProcessingOptions;
  output?: {
    format?: string;
    quality?: number;
    path?: string;
  };
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    category?: string;
  };
}

export interface MediaProcessingResult extends ProcessingResult {
  mediaType: MediaType;
  originalPath: string;
  processedPath: string;
  metadata: any;
  thumbnails?: Record<string, string>;
  extractedContent?: any;
}

export class MediaProcessor {
  private imageProcessor: ImageProcessor;
  private videoProcessor: VideoProcessor;
  private audioProcessor: AudioProcessor;
  private documentProcessor: DocumentProcessor;

  constructor() {
    this.imageProcessor = new ImageProcessor();
    this.videoProcessor = new VideoProcessor();
    this.audioProcessor = new AudioProcessor();
    this.documentProcessor = new DocumentProcessor();
  }

  /**
   * Process media file with given options
   */
  async processMedia(
    inputPath: string,
    options: MediaProcessingOptions,
    userId: string,
    fileId: string
  ): Promise<MediaProcessingResult> {
    const startTime = Date.now();
    const jobId = uuidv4();

    try {
      processing.jobStarted(userId, fileId, jobId, 'media_processing');

      // Validate input file
      if (!existsSync(inputPath)) {
        throw new FileCorruptedError(`Input file not found: ${inputPath}`);
      }

      // Determine media type
      const mediaType = this.detectMediaType(inputPath);
      
      // Generate output path
      const outputPath = this.generateOutputPath(inputPath, options, mediaType);

      // Ensure output directory exists
      const outputDir = dirname(outputPath);
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      // Process based on media type
      let result: MediaProcessingResult;

      switch (mediaType) {
        case MediaType.IMAGE:
          result = await this.processImage(inputPath, outputPath, options, userId, fileId);
          break;
        case MediaType.VIDEO:
          result = await this.processVideo(inputPath, outputPath, options, userId, fileId);
          break;
        case MediaType.AUDIO:
          result = await this.processAudio(inputPath, outputPath, options, userId, fileId);
          break;
        case MediaType.DOCUMENT:
          result = await this.processDocument(inputPath, outputPath, options, userId, fileId);
          break;
        default:
          throw new UnsupportedFormatError(`Unsupported media type: ${mediaType}`);
      }

      const duration = Date.now() - startTime;

      // Log success
      processing.jobCompleted(userId, fileId, jobId, 'media_processing', duration);

      // Record metrics
      metrics.recordFileProcessing(userId, mediaType, 'process', 'completed', duration / 1000);

      return {
        ...result,
        mediaType,
        originalPath: inputPath,
        processedPath: outputPath,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      processing.jobFailed(userId, fileId, jobId, 'media_processing', error instanceof Error ? error.message : 'Unknown error');
      metrics.recordFileProcessing(userId, 'unknown', 'process', 'failed', duration / 1000);

      throw new ProcessingError(`Media processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process image file
   */
  private async processImage(
    inputPath: string,
    outputPath: string,
    options: MediaProcessingOptions,
    userId: string,
    fileId: string
  ): Promise<MediaProcessingResult> {
    const imageOptions = options.image || {};
    
    const result = await this.imageProcessor.processImage(
      inputPath,
      outputPath,
      imageOptions,
      userId,
      fileId
    );

    return {
      success: result.success,
      jobId: result.jobId,
      status: result.status,
      outputPath: result.outputPath,
      duration: result.duration,
      mediaType: MediaType.IMAGE,
      originalPath: inputPath,
      processedPath: outputPath,
      metadata: result.metadata,
      thumbnails: result.thumbnails,
    };
  }

  /**
   * Process video file
   */
  private async processVideo(
    inputPath: string,
    outputPath: string,
    options: MediaProcessingOptions,
    userId: string,
    fileId: string
  ): Promise<MediaProcessingResult> {
    const videoOptions = options.video || {};
    
    const result = await this.videoProcessor.processVideo(
      inputPath,
      outputPath,
      videoOptions,
      userId,
      fileId
    );

    return {
      success: result.success,
      jobId: result.jobId,
      status: result.status,
      outputPath: result.outputPath,
      duration: result.duration,
      mediaType: MediaType.VIDEO,
      originalPath: inputPath,
      processedPath: outputPath,
      metadata: result.metadata,
      thumbnails: result.thumbnails,
    };
  }

  /**
   * Process audio file
   */
  private async processAudio(
    inputPath: string,
    outputPath: string,
    options: MediaProcessingOptions,
    userId: string,
    fileId: string
  ): Promise<MediaProcessingResult> {
    const audioOptions = options.audio || {};
    
    const result = await this.audioProcessor.processAudio(
      inputPath,
      outputPath,
      audioOptions,
      userId,
      fileId
    );

    return {
      success: result.success,
      jobId: result.jobId,
      status: result.status,
      outputPath: result.outputPath,
      duration: result.duration,
      mediaType: MediaType.AUDIO,
      originalPath: inputPath,
      processedPath: outputPath,
      metadata: result.metadata,
      extractedContent: result.waveform,
    };
  }

  /**
   * Process document file
   */
  private async processDocument(
    inputPath: string,
    outputPath: string,
    options: MediaProcessingOptions,
    userId: string,
    fileId: string
  ): Promise<MediaProcessingResult> {
    const documentOptions = options.document || {};
    
    const result = await this.documentProcessor.processDocument(
      inputPath,
      outputPath,
      documentOptions,
      userId,
      fileId
    );

    return {
      success: result.success,
      jobId: result.jobId,
      status: result.status,
      outputPath: result.outputPath,
      duration: result.duration,
      mediaType: MediaType.DOCUMENT,
      originalPath: inputPath,
      processedPath: outputPath,
      metadata: result.metadata,
      extractedContent: result.extractedContent,
    };
  }

  /**
   * Detect media type from file extension
   */
  private detectMediaType(filePath: string): MediaType {
    const extension = extname(filePath).toLowerCase().slice(1);
    
    // Image formats
    const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff', 'tif', 'ico', 'avif'];
    if (imageFormats.includes(extension)) {
      return MediaType.IMAGE;
    }

    // Video formats
    const videoFormats = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp', 'ogv'];
    if (videoFormats.includes(extension)) {
      return MediaType.VIDEO;
    }

    // Audio formats
    const audioFormats = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'opus', 'm4a', 'wma'];
    if (audioFormats.includes(extension)) {
      return MediaType.AUDIO;
    }

    // Document formats
    const documentFormats = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'html', 'htm', 'epub'];
    if (documentFormats.includes(extension)) {
      return MediaType.DOCUMENT;
    }

    return MediaType.UNKNOWN;
  }

  /**
   * Generate output path for processed file
   */
  private generateOutputPath(
    inputPath: string,
    options: MediaProcessingOptions,
    mediaType: MediaType
  ): string {
    const inputDir = dirname(inputPath);
    const inputName = inputPath.split('/').pop()?.split('.')[0] || 'processed';
    const timestamp = Date.now();
    
    // Determine output format
    let outputFormat = extname(inputPath).slice(1);
    
    if (options.output?.format) {
      outputFormat = options.output.format;
    } else if (options.image?.convert?.format) {
      outputFormat = options.image.convert.format;
    } else if (options.video?.convert?.format) {
      outputFormat = options.video.convert.format;
    } else if (options.audio?.convert?.format) {
      outputFormat = options.audio.convert.format;
    } else if (options.document?.convert?.format) {
      outputFormat = options.document.convert.format;
    }

    // Use custom output path if provided
    if (options.output?.path) {
      return options.output.path;
    }

    // Generate default output path
    return join(inputDir, `${inputName}_processed_${timestamp}.${outputFormat}`);
  }

  /**
   * Get metadata for media file
   */
  async getMetadata(filePath: string): Promise<any> {
    const mediaType = this.detectMediaType(filePath);

    switch (mediaType) {
      case MediaType.IMAGE:
        return await this.imageProcessor.getMetadata(filePath);
      case MediaType.VIDEO:
        return await this.videoProcessor.getMetadata(filePath);
      case MediaType.AUDIO:
        return await this.audioProcessor.getMetadata(filePath);
      case MediaType.DOCUMENT:
        return await this.documentProcessor.getMetadata(filePath);
      default:
        throw new UnsupportedFormatError(`Unsupported media type: ${mediaType}`);
    }
  }

  /**
   * Validate media file
   */
  async validateMedia(filePath: string): Promise<boolean> {
    const mediaType = this.detectMediaType(filePath);

    switch (mediaType) {
      case MediaType.IMAGE:
        return await this.imageProcessor.validateImage(filePath);
      case MediaType.VIDEO:
        return await this.videoProcessor.validateVideo(filePath);
      case MediaType.AUDIO:
        return await this.audioProcessor.validateAudio(filePath);
      case MediaType.DOCUMENT:
        return await this.documentProcessor.validateDocument(filePath);
      default:
        return false;
    }
  }

  /**
   * Get supported formats for media type
   */
  getSupportedFormats(mediaType: MediaType): string[] {
    switch (mediaType) {
      case MediaType.IMAGE:
        return this.imageProcessor.getSupportedFormats();
      case MediaType.VIDEO:
        return this.videoProcessor.getSupportedFormats();
      case MediaType.AUDIO:
        return this.audioProcessor.getSupportedFormats();
      case MediaType.DOCUMENT:
        return this.documentProcessor.getSupportedFormats();
      default:
        return [];
    }
  }

  /**
   * Get output formats for media type
   */
  getOutputFormats(mediaType: MediaType): string[] {
    switch (mediaType) {
      case MediaType.IMAGE:
        return this.imageProcessor.getOutputFormats();
      case MediaType.VIDEO:
        return this.videoProcessor.getOutputFormats();
      case MediaType.AUDIO:
        return this.audioProcessor.getOutputFormats();
      case MediaType.DOCUMENT:
        return this.documentProcessor.getOutputFormats();
      default:
        return [];
    }
  }

  /**
   * Batch process multiple files
   */
  async batchProcess(
    files: Array<{ path: string; options: MediaProcessingOptions }>,
    userId: string
  ): Promise<MediaProcessingResult[]> {
    const results: MediaProcessingResult[] = [];

    for (const file of files) {
      try {
        const fileId = uuidv4();
        const result = await this.processMedia(file.path, file.options, userId, fileId);
        results.push(result);
      } catch (error) {
        logger.error('Batch processing failed for file', { 
          file: file.path, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        // Continue with other files
      }
    }

    return results;
  }

  /**
   * Get processing status
   */
  getProcessingStatus(): { [key: string]: any } {
    return {
      imageProcessor: {
        supportedFormats: this.imageProcessor.getSupportedFormats(),
        outputFormats: this.imageProcessor.getOutputFormats(),
      },
      videoProcessor: {
        supportedFormats: this.videoProcessor.getSupportedFormats(),
        outputFormats: this.videoProcessor.getOutputFormats(),
      },
      audioProcessor: {
        supportedFormats: this.audioProcessor.getSupportedFormats(),
        outputFormats: this.audioProcessor.getOutputFormats(),
      },
      documentProcessor: {
        supportedFormats: this.documentProcessor.getSupportedFormats(),
        outputFormats: this.documentProcessor.getOutputFormats(),
      },
    };
  }
}

// Export individual processors for direct access
export { ImageProcessor, VideoProcessor, AudioProcessor, DocumentProcessor };
export type { 
  ImageProcessingOptions, 
  ImageProcessingResult,
  VideoProcessingOptions, 
  VideoProcessingResult,
  AudioProcessingOptions, 
  AudioProcessingResult,
  DocumentProcessingOptions, 
  DocumentProcessingResult
};
