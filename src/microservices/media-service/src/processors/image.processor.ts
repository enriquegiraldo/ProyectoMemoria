// src/microservices/media-service/src/processors/image.processor.ts
import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  ProcessingOptions, 
  ProcessingResult, 
  ImageMetadata,
  ProcessingStatus 
} from '../types';
import logger, {processing } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { 
  ProcessingError, 
  UnsupportedFormatError, 
  FileCorruptedError 
} from '../utils/errors';
import { config } from '../config';

export interface ImageProcessingOptions {
  resize?: {
    width?: number;
    height?: number;
    maintainAspectRatio?: boolean;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  };
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  compress?: {
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp' | 'avif';
  };
  convert?: {
    format: 'jpeg' | 'png' | 'webp' | 'avif' | 'gif' | 'tiff';
    quality?: number;
  };
  watermark?: {
    text?: string;
    imagePath?: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity?: number;
  };
  filter?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    blur?: number;
    sharpen?: number;
    gamma?: number;
  };
  enhance?: {
    autoEnhance?: boolean;
    removeNoise?: boolean;
    faceEnhancement?: boolean;
  };
}

export interface ImageProcessingResult extends ProcessingResult {
  metadata: ImageMetadata;
  thumbnails: {
    small: string;
    medium: string;
    large: string;
  };
}

export class ImageProcessor {
  private supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'avif', 'gif', 'tiff', 'bmp'];
  private outputFormats = ['jpeg', 'png', 'webp', 'avif', 'gif', 'tiff'];

  /**
   * Process image with given options
   */
  async processImage(
    inputPath: string,
    outputPath: string,
    options: ImageProcessingOptions,
    userId: string,
    fileId: string
  ): Promise<ImageProcessingResult> {
    const startTime = Date.now();
    const jobId = uuidv4();

    try {
      processing.jobStarted({userId, fileId, jobId, operation: 'image_processing'});

      // Validate input file
      if (!existsSync(inputPath)) {
        throw new FileCorruptedError(`Input file not found: ${inputPath}`);
      }

      // Read input image
      const inputBuffer = readFileSync(inputPath);
      let image = sharp(inputBuffer);

      // Get original metadata
      const originalMetadata = await image.metadata();
      
      // Validate format
      if (!this.supportedFormats.includes(originalMetadata.format || '')) {
        throw new UnsupportedFormatError(`Unsupported image format: ${originalMetadata.format}`);
      }

      // Apply processing options
      image = await this.applyProcessingOptions(image, options, originalMetadata);

      // Ensure output directory exists
      const outputDir = dirname(outputPath);
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      // Save processed image
      await image.toFile(outputPath);

      // Get processed metadata
      const processedMetadata = await sharp(outputPath).metadata();

      // Generate thumbnails if enabled
      let thumbnails;
      if (config.processing.enableThumbnails) {
        thumbnails = await this.generateThumbnails(inputBuffer, outputDir, fileId);
      }

      const duration = Date.now() - startTime;

      // Log success
      processing.jobCompleted({userId, fileId, jobId, operation: 'image_processing', duration});

      // Record metrics
      metrics.recordFileProcessing(userId, 'image', 'process', 'completed', duration / 1000);

      return {
        success: true,
        jobId,
        status: ProcessingStatus.COMPLETED,
        outputPath,
        duration,
        metadata: {
          width: processedMetadata.width || 0,
          height: processedMetadata.height || 0,
          format: processedMetadata.format || '',
          size: processedMetadata.size || 0,
          channels: processedMetadata.channels || 0,
          hasAlpha: processedMetadata.hasAlpha || false,
          hasProfile: processedMetadata.hasProfile || false,
          isOpaque: processedMetadata.isOpaque || false,
          orientation: processedMetadata.orientation || 0,
        },
        thumbnails,
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      processing.jobFailed({userId, fileId, jobId, operation: 'image_processing', error: error instanceof Error ? error.message : 'Unknown error'});
      metrics.recordFileProcessing(userId, 'image', 'process', 'failed', duration / 1000);

      throw new ProcessingError(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply processing options to image
   */
  private async applyProcessingOptions(
    image: sharp.Sharp,
    options: ImageProcessingOptions,
    originalMetadata: sharp.Metadata
  ): Promise<sharp.Sharp> {
    // Resize
    if (options.resize) {
      image = this.applyResize(image, options.resize, originalMetadata);
    }

    // Crop
    if (options.crop) {
      image = this.applyCrop(image, options.crop);
    }

    // Filters
    if (options.filter) {
      image = this.applyFilters(image, options.filter);
    }

    // Enhance
    if (options.enhance) {
      image = this.applyEnhancement(image, options.enhance);
    }

    // Watermark
    if (options.watermark) {
      image = await this.applyWatermark(image, options.watermark);
    }

    // Convert format
    if (options.convert) {
      image = this.applyFormatConversion(image, options.convert);
    } else if (options.compress) {
      image = this.applyCompression(image, options.compress);
    }

    return image;
  }

  /**
   * Apply resize operation
   */
  private applyResize(
    image: sharp.Sharp,
    resize: ImageProcessingOptions['resize'],
    originalMetadata: sharp.Metadata
  ): sharp.Sharp {
    const { width, height, maintainAspectRatio = true, fit = 'inside' } = resize;
    
    if (!width && !height) {
      return image;
    }

    let resizeOptions: sharp.ResizeOptions = { fit };

    if (maintainAspectRatio) {
      if (width && height) {
        resizeOptions = { width, height, fit };
      } else if (width) {
        resizeOptions = { width };
      } else if (height) {
        resizeOptions = { height };
      }
    } else {
      resizeOptions = { width: width || originalMetadata.width, height: height || originalMetadata.height, fit: 'fill' };
    }

    return image.resize(resizeOptions);
  }

  /**
   * Apply crop operation
   */
  private applyCrop(image: sharp.Sharp, crop: ImageProcessingOptions['crop']): sharp.Sharp {
    
    return image.extract({
      left: crop.x,
      top: crop.y,
      width: crop.width,
      height: crop.height,
    });
  }

  /**
   * Apply filters
   */
  private applyFilters(image: sharp.Sharp, filter: ImageProcessingOptions['filter']): sharp.Sharp {
    const { brightness, contrast, saturation, blur, sharpen, gamma } = filter;

    if (brightness !== undefined) {
      image = image.modulate({ brightness: 1 + brightness / 100 });
    }

    if (contrast !== undefined) {
      image = image.modulate({ contrast: 1 + contrast / 100 });
    }

    if (saturation !== undefined) {
      image = image.modulate({ saturation: 1 + saturation / 100 });
    }

    if (blur !== undefined) {
      image = image.blur(blur);
    }

    if (sharpen !== undefined) {
      image = image.sharpen({ sigma: sharpen / 10 });
    }

    if (gamma !== undefined) {
      image = image.gamma(gamma);
    }

    return image;
  }

  /**
   * Apply enhancement
   */
  private applyEnhancement(image: sharp.Sharp, enhance: ImageProcessingOptions['enhance']): sharp.Sharp {
    const { autoEnhance, removeNoise, faceEnhancement } = enhance;

    if (autoEnhance) {
      // Auto-adjust levels
      image = image.normalize();
    }

    if (removeNoise) {
      // Apply noise reduction
      image = image.median(2);
    }

    if (faceEnhancement) {
      // Apply face enhancement (simplified)
      image = image.sharpen({ sigma: 1, flat: 1, jagged: 2 });
    }

    return image;
  }

  /**
   * Apply watermark
   */
  private async applyWatermark(
    image: sharp.Sharp,
    watermark: ImageProcessingOptions['watermark']
  ): Promise<sharp.Sharp> {
    const { text, imagePath, position = 'bottom-right', opacity = 0.5 } = watermark;

    if (text) {
      return this.applyTextWatermark(image, text, position, opacity);
    }

    if (imagePath) {
      return this.applyImageWatermark(image, imagePath, position, opacity);
    }

    return image;
  }

  /**
   * Apply text watermark
   */
  private async applyTextWatermark(
    image: sharp.Sharp,
    text: string,
    position: string,
    opacity: number
  ): Promise<sharp.Sharp> {
    const metadata = await image.metadata();
    const { width = 0, height = 0 } = metadata;

    // Create text overlay
    const textBuffer = await sharp({
      create: {
        width: width,
        height: height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([{
      input: Buffer.from(`
        <svg width="${width}" height="${height}">
          <text x="50%" y="50%" text-anchor="middle" dy=".3em" 
                font-family="Arial" font-size="48" fill="white" opacity="${opacity}">
            ${text}
          </text>
        </svg>
      `),
      gravity: position as any
    }])
    .png()
    .toBuffer();

    return image.composite([{ input: textBuffer, gravity: position as any }]);
  }

  /**
   * Apply image watermark
   */
  private async applyImageWatermark(
    image: sharp.Sharp,
    watermarkPath: string,
    position: string,
    opacity: number
  ): Promise<sharp.Sharp> {
    if (!existsSync(watermarkPath)) {
      logger.warn(`Watermark image not found: ${watermarkPath}`);
      return image;
    }

    const watermarkBuffer = await sharp(watermarkPath)
      .png()
      .toBuffer();

    return image.composite([{ 
      input: watermarkBuffer, 
      gravity: position as any,
      blend: 'over'
    }]);
  }

  /**
   * Apply format conversion
   */
  private applyFormatConversion(
    image: sharp.Sharp,
    convert: ImageProcessingOptions['convert']
  ): sharp.Sharp {
    const { format, quality = 80 } = convert;

    switch (format) {
      case 'jpeg':
        return image.jpeg({ quality });
      case 'png':
        return image.png({ quality });
      case 'webp':
        return image.webp({ quality });
      case 'avif':
        return image.avif({ quality });
      case 'gif':
        return image.gif();
      case 'tiff':
        return image.tiff({ quality });
      default:
        return image;
    }
  }

  /**
   * Apply compression
   */
  private applyCompression(
    image: sharp.Sharp,
    compress: ImageProcessingOptions['compress']
  ): sharp.Sharp {
    const { quality = 80, format } = compress;

    if (format) {
      return this.applyFormatConversion(image, { format, quality });
    }

    // Default to JPEG compression
    return image.jpeg({ quality });
  }

  /**
   * Generate thumbnails
   */
  private async generateThumbnails(
    inputBuffer: Buffer,
    outputDir: string,
    fileId: string
  ): Promise<{ small: string; medium: string; large: string }> {
    const sizes = {
      small: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 600 },
    };

    const thumbnails: any = {};

    for (const [size, dimensions] of Object.entries(sizes)) {
      const thumbnailPath = join(outputDir, `${fileId}_${size}.jpg`);
      
      await sharp(inputBuffer)
        .resize(dimensions.width, dimensions.height, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      thumbnails[size] = thumbnailPath;
    }

    return thumbnails;
  }

  /**
   * Get image metadata
   */
  async getMetadata(imagePath: string): Promise<ImageMetadata> {
    try {
      const metadata = await sharp(imagePath).metadata();
      
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || '',
        size: metadata.size || 0,
        channels: metadata.channels || 0,
        hasAlpha: metadata.hasAlpha || false,
        hasProfile: metadata.hasProfile || false,
        isOpaque: metadata.isOpaque || false,
        orientation: metadata.orientation || 0,
      };
    } catch (error) {
      throw new FileCorruptedError(`Failed to read image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate image file
   */
  async validateImage(imagePath: string): Promise<boolean> {
    try {
      const metadata = await sharp(imagePath).metadata();
      return this.supportedFormats.includes(metadata.format || '');
    } catch {
      return false;
    }
  }

  /**
   * Get supported formats
   */
  getSupportedFormats(): string[] {
    return this.supportedFormats;
  }

  /**
   * Get output formats
   */
  getOutputFormats(): string[] {
    return this.outputFormats;
  }
}
