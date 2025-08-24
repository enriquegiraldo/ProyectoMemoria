import ffmpeg from 'fluent-ffmpeg';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  ProcessingOptions, 
  ProcessingResult, 
  VideoMetadata,
  ProcessingStatus 
} from '../types';
import { logger, processing } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { 
  ProcessingError, 
  UnsupportedFormatError, 
  FileCorruptedError 
} from '../utils/errors';
import { config } from '../config';

export interface VideoProcessingOptions {
  resize?: {
    width?: number;
    height?: number;
    maintainAspectRatio?: boolean;
  };
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  compress?: {
    quality?: number;
    format?: 'mp4' | 'avi' | 'mov' | 'webm' | 'mkv';
    codec?: 'h264' | 'h265' | 'vp9' | 'av1';
    bitrate?: string;
  };
  convert?: {
    format: 'mp4' | 'avi' | 'mov' | 'webm' | 'mkv' | 'flv' | 'wmv';
    codec?: 'h264' | 'h265' | 'vp9' | 'av1';
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
  trim?: {
    start: number; // seconds
    duration: number; // seconds
  };
  speed?: {
    factor: number; // 0.5 = half speed, 2.0 = double speed
  };
  audio?: {
    volume?: number;
    mute?: boolean;
    extract?: boolean;
  };
  thumbnail?: {
    time: number; // seconds
    width?: number;
    height?: number;
  };
}

export interface VideoProcessingResult extends ProcessingResult {
  metadata: VideoMetadata;
  thumbnails?: {
    preview: string;
    poster: string;
  };
}

export class VideoProcessor {
  private supportedFormats = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp', 'ogv'];
  private outputFormats = ['mp4', 'avi', 'mov', 'webm', 'mkv', 'flv', 'wmv'];

  constructor() {
    // Set FFmpeg path if needed
    if (process.env.FFMPEG_PATH) {
      ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
    }
  }

  /**
   * Process video with given options
   */
  async processVideo(
    inputPath: string,
    outputPath: string,
    options: VideoProcessingOptions,
    userId: string,
    fileId: string
  ): Promise<VideoProcessingResult> {
    const startTime = Date.now();
    const jobId = uuidv4();

    try {
      processing.jobStarted(userId, fileId, jobId, 'video_processing');

      // Validate input file
      if (!existsSync(inputPath)) {
        throw new FileCorruptedError(`Input file not found: ${inputPath}`);
      }

      // Get original metadata
      const originalMetadata = await this.getMetadata(inputPath);
      
      // Validate format
      if (!this.supportedFormats.includes(originalMetadata.format || '')) {
        throw new UnsupportedFormatError(`Unsupported video format: ${originalMetadata.format}`);
      }

      // Ensure output directory exists
      const outputDir = dirname(outputPath);
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      // Process video
      await this.applyProcessingOptions(inputPath, outputPath, options, originalMetadata);

      // Get processed metadata
      const processedMetadata = await this.getMetadata(outputPath);

      // Generate thumbnails
      let thumbnails;
      if (options.thumbnail || config.processing.enableThumbnails) {
        thumbnails = await this.generateThumbnails(
          inputPath, 
          outputDir, 
          fileId, 
          options.thumbnail
        );
      }

      const duration = Date.now() - startTime;

      // Log success
      processing.jobCompleted(userId, fileId, jobId, 'video_processing', duration);

      // Record metrics
      metrics.recordFileProcessing(userId, 'video', 'process', 'completed', duration / 1000);

      return {
        success: true,
        jobId,
        status: ProcessingStatus.COMPLETED,
        outputPath,
        duration,
        metadata: processedMetadata,
        thumbnails,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      processing.jobFailed(userId, fileId, jobId, 'video_processing', error instanceof Error ? error.message : 'Unknown error');
      metrics.recordFileProcessing(userId, 'video', 'process', 'failed', duration / 1000);

      throw new ProcessingError(`Video processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply processing options to video
   */
  private async applyProcessingOptions(
    inputPath: string,
    outputPath: string,
    options: VideoProcessingOptions,
    originalMetadata: VideoMetadata
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath);

      // Apply filters
      const filters: string[] = [];

      // Resize
      if (options.resize) {
        filters.push(this.buildResizeFilter(options.resize, originalMetadata));
      }

      // Crop
      if (options.crop) {
        filters.push(this.buildCropFilter(options.crop));
      }

      // Video filters
      if (options.filter) {
        filters.push(this.buildVideoFilters(options.filter));
      }

      // Apply filters if any
      if (filters.length > 0) {
        command = command.videoFilters(filters);
      }

      // Trim
      if (options.trim) {
        command = command.setStartTime(options.trim.start);
        if (options.trim.duration) {
          command = command.setDuration(options.trim.duration);
        }
      }

      // Speed
      if (options.speed) {
        command = command.videoFilters(`setpts=${1 / options.speed.factor}*PTS`);
        if (options.audio?.volume !== undefined) {
          command = command.audioFilters(`atempo=${options.speed.factor}`);
        }
      }

      // Audio options
      if (options.audio) {
        if (options.audio.mute) {
          command = command.noAudio();
        } else if (options.audio.volume !== undefined) {
          command = command.audioFilters(`volume=${options.audio.volume}`);
        }
      }

      // Output format and codec
      if (options.convert) {
        command = this.setOutputFormat(command, options.convert);
      } else if (options.compress) {
        command = this.setCompression(command, options.compress);
      }

      // Watermark
      if (options.watermark) {
        command = this.applyWatermark(command, options.watermark);
      }

      // Set output
      command
        .output(outputPath)
        .on('start', (commandLine) => {
          logger.debug('FFmpeg command started', { commandLine });
        })
        .on('progress', (progress) => {
          logger.debug('FFmpeg progress', { progress });
        })
        .on('end', () => {
          logger.debug('FFmpeg processing completed');
          resolve();
        })
        .on('error', (err) => {
          logger.error('FFmpeg processing error', { error: err.message });
          reject(new ProcessingError(`FFmpeg processing failed: ${err.message}`));
        })
        .run();
    });
  }

  /**
   * Build resize filter
   */
  private buildResizeFilter(resize: VideoProcessingOptions['resize'], metadata: VideoMetadata): string {
    const { width, height, maintainAspectRatio = true } = resize;
    
    if (!width && !height) {
      return '';
    }

    if (maintainAspectRatio) {
      if (width && height) {
        return `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`;
      } else if (width) {
        return `scale=${width}:-1`;
      } else if (height) {
        return `scale=-1:${height}`;
      }
    } else {
      return `scale=${width || metadata.width}:${height || metadata.height}`;
    }

    return '';
  }

  /**
   * Build crop filter
   */
  private buildCropFilter(crop: VideoProcessingOptions['crop']): string {
    return `crop=${crop.width}:${crop.height}:${crop.x}:${crop.y}`;
  }

  /**
   * Build video filters
   */
  private buildVideoFilters(filter: VideoProcessingOptions['filter']): string {
    const filters: string[] = [];

    if (filter.brightness !== undefined) {
      filters.push(`eq=brightness=${filter.brightness / 100}`);
    }

    if (filter.contrast !== undefined) {
      filters.push(`eq=contrast=${1 + filter.contrast / 100}`);
    }

    if (filter.saturation !== undefined) {
      filters.push(`eq=saturation=${1 + filter.saturation / 100}`);
    }

    if (filter.blur !== undefined) {
      filters.push(`boxblur=${filter.blur}:${filter.blur}`);
    }

    if (filter.sharpen !== undefined) {
      filters.push(`unsharp=${filter.sharpen}:${filter.sharpen}:1:3:3:0.5`);
    }

    if (filter.gamma !== undefined) {
      filters.push(`eq=gamma=${filter.gamma}`);
    }

    return filters.join(',');
  }

  /**
   * Set output format
   */
  private setOutputFormat(command: ffmpeg.FfmpegCommand, convert: VideoProcessingOptions['convert']): ffmpeg.FfmpegCommand {
    const { format, codec = 'h264', quality = 80 } = convert;

    switch (format) {
      case 'mp4':
        return command
          .outputOptions('-c:v', codec === 'h264' ? 'libx264' : 'libx265')
          .outputOptions('-c:a', 'aac')
          .outputOptions('-crf', quality.toString())
          .format('mp4');
      
      case 'webm':
        return command
          .outputOptions('-c:v', codec === 'vp9' ? 'libvpx-vp9' : 'libvpx')
          .outputOptions('-c:a', 'libvorbis')
          .outputOptions('-crf', quality.toString())
          .format('webm');
      
      case 'avi':
        return command
          .outputOptions('-c:v', 'libx264')
          .outputOptions('-c:a', 'mp3')
          .outputOptions('-crf', quality.toString())
          .format('avi');
      
      case 'mov':
        return command
          .outputOptions('-c:v', 'libx264')
          .outputOptions('-c:a', 'aac')
          .outputOptions('-crf', quality.toString())
          .format('mov');
      
      case 'mkv':
        return command
          .outputOptions('-c:v', 'libx264')
          .outputOptions('-c:a', 'aac')
          .outputOptions('-crf', quality.toString())
          .format('matroska');
      
      default:
        return command;
    }
  }

  /**
   * Set compression
   */
  private setCompression(command: ffmpeg.FfmpegCommand, compress: VideoProcessingOptions['compress']): ffmpeg.FfmpegCommand {
    const { quality = 80, format, codec = 'h264', bitrate } = compress;

    if (bitrate) {
      command = command.outputOptions('-b:v', bitrate);
    } else {
      command = command.outputOptions('-crf', quality.toString());
    }

    if (format) {
      return this.setOutputFormat(command, { format, codec, quality });
    }

    return command
      .outputOptions('-c:v', codec === 'h264' ? 'libx264' : 'libx265')
      .outputOptions('-c:a', 'aac');
  }

  /**
   * Apply watermark
   */
  private applyWatermark(command: ffmpeg.FfmpegCommand, watermark: VideoProcessingOptions['watermark']): ffmpeg.FfmpegCommand {
    const { text, imagePath, position = 'bottom-right', opacity = 0.5 } = watermark;

    if (text) {
      // Text watermark
      const filter = `drawtext=text='${text}':fontsize=48:fontcolor=white@${opacity}:x=w-tw-10:y=h-th-10`;
      return command.videoFilters(filter);
    }

    if (imagePath && existsSync(imagePath)) {
      // Image watermark
      const filter = `movie=${imagePath},scale=200:-1[watermark];[0][watermark]overlay=W-w-10:H-h-10`;
      return command.videoFilters(filter);
    }

    return command;
  }

  /**
   * Generate thumbnails
   */
  private async generateThumbnails(
    inputPath: string,
    outputDir: string,
    fileId: string,
    thumbnailOptions?: VideoProcessingOptions['thumbnail']
  ): Promise<{ preview: string; poster: string }> {
    const time = thumbnailOptions?.time || 5; // Default to 5 seconds
    const width = thumbnailOptions?.width || 320;
    const height = thumbnailOptions?.height || 240;

    const previewPath = join(outputDir, `${fileId}_preview.jpg`);
    const posterPath = join(outputDir, `${fileId}_poster.jpg`);

    // Generate preview thumbnail
    await this.generateThumbnail(inputPath, previewPath, time, width, height);
    
    // Generate poster thumbnail (larger)
    await this.generateThumbnail(inputPath, posterPath, time, width * 2, height * 2);

    return {
      preview: previewPath,
      poster: posterPath,
    };
  }

  /**
   * Generate single thumbnail
   */
  private async generateThumbnail(
    inputPath: string,
    outputPath: string,
    time: number,
    width: number,
    height: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .seekInput(time)
        .frames(1)
        .size(`${width}x${height}`)
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(new ProcessingError(`Thumbnail generation failed: ${err.message}`)))
        .run();
    });
  }

  /**
   * Get video metadata
   */
  async getMetadata(videoPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(new FileCorruptedError(`Failed to read video metadata: ${err.message}`));
          return;
        }

        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');

        resolve({
          width: videoStream?.width || 0,
          height: videoStream?.height || 0,
          duration: metadata.format?.duration ? parseFloat(metadata.format.duration) : 0,
          format: metadata.format?.format_name || '',
          size: metadata.format?.size ? parseInt(metadata.format.size) : 0,
          bitrate: metadata.format?.bit_rate ? parseInt(metadata.format.bit_rate) : 0,
          fps: videoStream?.r_frame_rate ? this.parseFrameRate(videoStream.r_frame_rate) : 0,
          codec: videoStream?.codec_name || '',
          audioCodec: audioStream?.codec_name || '',
          audioChannels: audioStream?.channels || 0,
          audioSampleRate: audioStream?.sample_rate ? parseInt(audioStream.sample_rate) : 0,
        });
      });
    });
  }

  /**
   * Parse frame rate string
   */
  private parseFrameRate(frameRate: string): number {
    const parts = frameRate.split('/');
    if (parts.length === 2) {
      return parseInt(parts[0]) / parseInt(parts[1]);
    }
    return parseFloat(frameRate) || 0;
  }

  /**
   * Extract audio from video
   */
  async extractAudio(
    inputPath: string,
    outputPath: string,
    format: 'mp3' | 'aac' | 'wav' | 'flac' = 'mp3'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioCodec(format === 'mp3' ? 'libmp3lame' : format === 'aac' ? 'aac' : format === 'wav' ? 'pcm_s16le' : 'flac')
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(new ProcessingError(`Audio extraction failed: ${err.message}`)))
        .run();
    });
  }

  /**
   * Create video from images
   */
  async createVideoFromImages(
    imagePattern: string,
    outputPath: string,
    fps: number = 24,
    duration: number = 5
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(imagePattern)
        .inputFPS(fps)
        .outputOptions('-c:v', 'libx264')
        .outputOptions('-pix_fmt', 'yuv420p')
        .outputOptions('-t', duration.toString())
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(new ProcessingError(`Video creation failed: ${err.message}`)))
        .run();
    });
  }

  /**
   * Validate video file
   */
  async validateVideo(videoPath: string): Promise<boolean> {
    try {
      const metadata = await this.getMetadata(videoPath);
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
