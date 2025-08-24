import ffmpeg from 'fluent-ffmpeg';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  ProcessingOptions, 
  ProcessingResult, 
  AudioMetadata,
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

export interface AudioProcessingOptions {
  compress?: {
    quality?: number;
    format?: 'mp3' | 'aac' | 'wav' | 'flac' | 'ogg' | 'opus';
    bitrate?: string;
  };
  convert?: {
    format: 'mp3' | 'aac' | 'wav' | 'flac' | 'ogg' | 'opus' | 'm4a' | 'wma';
    quality?: number;
    bitrate?: string;
  };
  filter?: {
    volume?: number;
    normalize?: boolean;
    fadeIn?: number; // seconds
    fadeOut?: number; // seconds
    equalizer?: {
      low?: number; // -20 to 20 dB
      mid?: number; // -20 to 20 dB
      high?: number; // -20 to 20 dB
    };
    reverb?: {
      roomSize?: number; // 0 to 1
      damping?: number; // 0 to 1
      wetLevel?: number; // 0 to 1
    };
    echo?: {
      delay?: number; // milliseconds
      decay?: number; // 0 to 1
    };
  };
  trim?: {
    start: number; // seconds
    duration: number; // seconds
  };
  speed?: {
    factor: number; // 0.5 = half speed, 2.0 = double speed
    pitch?: boolean; // maintain pitch when changing speed
  };
  effects?: {
    chorus?: boolean;
    flanger?: boolean;
    phaser?: boolean;
    distortion?: number; // 0 to 1
  };
  metadata?: {
    title?: string;
    artist?: string;
    album?: string;
    year?: number;
    genre?: string;
    comment?: string;
  };
}

export interface AudioProcessingResult extends ProcessingResult {
  metadata: AudioMetadata;
  waveform?: {
    data: number[];
    sampleRate: number;
  };
}

export class AudioProcessor {
  private supportedFormats = ['mp3', 'aac', 'wav', 'flac', 'ogg', 'opus', 'm4a', 'wma', 'wav'];
  private outputFormats = ['mp3', 'aac', 'wav', 'flac', 'ogg', 'opus', 'm4a', 'wma'];

  constructor() {
    // Set FFmpeg path if needed
    if (process.env.FFMPEG_PATH) {
      ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
    }
  }

  /**
   * Process audio with given options
   */
  async processAudio(
    inputPath: string,
    outputPath: string,
    options: AudioProcessingOptions,
    userId: string,
    fileId: string
  ): Promise<AudioProcessingResult> {
    const startTime = Date.now();
    const jobId = uuidv4();

    try {
      processing.jobStarted(userId, fileId, jobId, 'audio_processing');

      // Validate input file
      if (!existsSync(inputPath)) {
        throw new FileCorruptedError(`Input file not found: ${inputPath}`);
      }

      // Get original metadata
      const originalMetadata = await this.getMetadata(inputPath);
      
      // Validate format
      if (!this.supportedFormats.includes(originalMetadata.format || '')) {
        throw new UnsupportedFormatError(`Unsupported audio format: ${originalMetadata.format}`);
      }

      // Ensure output directory exists
      const outputDir = dirname(outputPath);
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      // Process audio
      await this.applyProcessingOptions(inputPath, outputPath, options, originalMetadata);

      // Get processed metadata
      const processedMetadata = await this.getMetadata(outputPath);

      // Generate waveform if requested
      let waveform;
      if (options.filter?.normalize || config.processing.enableThumbnails) {
        waveform = await this.generateWaveform(inputPath);
      }

      const duration = Date.now() - startTime;

      // Log success
      processing.jobCompleted(userId, fileId, jobId, 'audio_processing', duration);

      // Record metrics
      metrics.recordFileProcessing(userId, 'audio', 'process', 'completed', duration / 1000);

      return {
        success: true,
        jobId,
        status: ProcessingStatus.COMPLETED,
        outputPath,
        duration,
        metadata: processedMetadata,
        waveform,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      processing.jobFailed(userId, fileId, jobId, 'audio_processing', error instanceof Error ? error.message : 'Unknown error');
      metrics.recordFileProcessing(userId, 'audio', 'process', 'failed', duration / 1000);

      throw new ProcessingError(`Audio processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply processing options to audio
   */
  private async applyProcessingOptions(
    inputPath: string,
    outputPath: string,
    options: AudioProcessingOptions,
    originalMetadata: AudioMetadata
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg(inputPath);

      // Apply audio filters
      const filters: string[] = [];

      // Volume
      if (options.filter?.volume !== undefined) {
        filters.push(`volume=${options.filter.volume}`);
      }

      // Normalize
      if (options.filter?.normalize) {
        filters.push('loudnorm');
      }

      // Fade effects
      if (options.filter?.fadeIn) {
        filters.push(`afade=t=in:st=0:d=${options.filter.fadeIn}`);
      }

      if (options.filter?.fadeOut) {
        const fadeStart = originalMetadata.duration - options.filter.fadeOut;
        filters.push(`afade=t=out:st=${fadeStart}:d=${options.filter.fadeOut}`);
      }

      // Equalizer
      if (options.filter?.equalizer) {
        const { low = 0, mid = 0, high = 0 } = options.filter.equalizer;
        filters.push(`equalizer=f=60:width_type=o:width=2:g=${low},equalizer=f=1000:width_type=o:width=2:g=${mid},equalizer=f=8000:width_type=o:width=2:g=${high}`);
      }

      // Reverb
      if (options.filter?.reverb) {
        const { roomSize = 0.5, damping = 0.5, wetLevel = 0.3 } = options.filter.reverb;
        filters.push(`aecho=0.8:${roomSize}:${damping}:${wetLevel}`);
      }

      // Echo
      if (options.filter?.echo) {
        const { delay = 1000, decay = 0.5 } = options.filter.echo;
        filters.push(`aecho=0.8:${delay}:${decay}`);
      }

      // Speed with pitch preservation
      if (options.speed) {
        if (options.speed.pitch) {
          filters.push(`rubberband=tempo=${options.speed.factor}`);
        } else {
          filters.push(`atempo=${options.speed.factor}`);
        }
      }

      // Effects
      if (options.effects) {
        if (options.effects.chorus) {
          filters.push('chorus=0.5:0.9:50:0.4:0.25:2');
        }
        if (options.effects.flanger) {
          filters.push('flanger=delay=10:depth=10:regen=10:width=71:interp=linear');
        }
        if (options.effects.phaser) {
          filters.push('aphaser=type=t:speed=2:decay=0.6');
        }
        if (options.effects.distortion) {
          filters.push(`distortion=amount=${options.effects.distortion}`);
        }
      }

      // Apply filters if any
      if (filters.length > 0) {
        command = command.audioFilters(filters);
      }

      // Trim
      if (options.trim) {
        command = command.setStartTime(options.trim.start);
        if (options.trim.duration) {
          command = command.setDuration(options.trim.duration);
        }
      }

      // Output format and codec
      if (options.convert) {
        command = this.setOutputFormat(command, options.convert);
      } else if (options.compress) {
        command = this.setCompression(command, options.compress);
      }

      // Metadata
      if (options.metadata) {
        command = this.setMetadata(command, options.metadata);
      }

      // Set output
      command
        .output(outputPath)
        .on('start', (commandLine) => {
          logger.debug('FFmpeg audio command started', { commandLine });
        })
        .on('progress', (progress) => {
          logger.debug('FFmpeg audio progress', { progress });
        })
        .on('end', () => {
          logger.debug('FFmpeg audio processing completed');
          resolve();
        })
        .on('error', (err) => {
          logger.error('FFmpeg audio processing error', { error: err.message });
          reject(new ProcessingError(`FFmpeg audio processing failed: ${err.message}`));
        })
        .run();
    });
  }

  /**
   * Set output format
   */
  private setOutputFormat(command: ffmpeg.FfmpegCommand, convert: AudioProcessingOptions['convert']): ffmpeg.FfmpegCommand {
    const { format, quality = 80, bitrate } = convert;

    switch (format) {
      case 'mp3':
        return command
          .audioCodec('libmp3lame')
          .audioBitrate(bitrate || '128k')
          .format('mp3');
      
      case 'aac':
        return command
          .audioCodec('aac')
          .audioBitrate(bitrate || '128k')
          .format('aac');
      
      case 'wav':
        return command
          .audioCodec('pcm_s16le')
          .format('wav');
      
      case 'flac':
        return command
          .audioCodec('flac')
          .format('flac');
      
      case 'ogg':
        return command
          .audioCodec('libvorbis')
          .audioBitrate(bitrate || '128k')
          .format('ogg');
      
      case 'opus':
        return command
          .audioCodec('libopus')
          .audioBitrate(bitrate || '64k')
          .format('opus');
      
      case 'm4a':
        return command
          .audioCodec('aac')
          .audioBitrate(bitrate || '128k')
          .format('ipod');
      
      case 'wma':
        return command
          .audioCodec('wmav2')
          .audioBitrate(bitrate || '128k')
          .format('asf');
      
      default:
        return command;
    }
  }

  /**
   * Set compression
   */
  private setCompression(command: ffmpeg.FfmpegCommand, compress: AudioProcessingOptions['compress']): ffmpeg.FfmpegCommand {
    const { quality = 80, format, bitrate } = compress;

    if (format) {
      return this.setOutputFormat(command, { format, quality, bitrate });
    }

    // Default compression
    return command
      .audioCodec('libmp3lame')
      .audioBitrate(bitrate || '128k');
  }

  /**
   * Set metadata
   */
  private setMetadata(command: ffmpeg.FfmpegCommand, metadata: AudioProcessingOptions['metadata']): ffmpeg.FfmpegCommand {
    if (metadata.title) {
      command = command.outputOptions('-metadata', `title=${metadata.title}`);
    }
    if (metadata.artist) {
      command = command.outputOptions('-metadata', `artist=${metadata.artist}`);
    }
    if (metadata.album) {
      command = command.outputOptions('-metadata', `album=${metadata.album}`);
    }
    if (metadata.year) {
      command = command.outputOptions('-metadata', `year=${metadata.year}`);
    }
    if (metadata.genre) {
      command = command.outputOptions('-metadata', `genre=${metadata.genre}`);
    }
    if (metadata.comment) {
      command = command.outputOptions('-metadata', `comment=${metadata.comment}`);
    }

    return command;
  }

  /**
   * Generate waveform data
   */
  private async generateWaveform(audioPath: string): Promise<{ data: number[]; sampleRate: number }> {
    return new Promise((resolve, reject) => {
      const waveformData: number[] = [];
      let sampleRate = 44100;

      ffmpeg(audioPath)
        .outputOptions('-f', 'data')
        .outputOptions('-ar', '44100')
        .outputOptions('-ac', '1')
        .outputOptions('-acodec', 'pcm_s16le')
        .output('pipe:1')
        .on('end', () => {
          resolve({ data: waveformData, sampleRate });
        })
        .on('error', (err) => {
          reject(new ProcessingError(`Waveform generation failed: ${err.message}`));
        })
        .pipe()
        .on('data', (chunk: Buffer) => {
          // Convert 16-bit PCM to waveform data
          for (let i = 0; i < chunk.length; i += 2) {
            const sample = chunk.readInt16LE(i);
            waveformData.push(sample / 32768); // Normalize to -1 to 1
          }
        });
    });
  }

  /**
   * Get audio metadata
   */
  async getMetadata(audioPath: string): Promise<AudioMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) {
          reject(new FileCorruptedError(`Failed to read audio metadata: ${err.message}`));
          return;
        }

        const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');

        resolve({
          duration: metadata.format?.duration ? parseFloat(metadata.format.duration) : 0,
          format: metadata.format?.format_name || '',
          size: metadata.format?.size ? parseInt(metadata.format.size) : 0,
          bitrate: metadata.format?.bit_rate ? parseInt(metadata.format.bit_rate) : 0,
          codec: audioStream?.codec_name || '',
          channels: audioStream?.channels || 0,
          sampleRate: audioStream?.sample_rate ? parseInt(audioStream.sample_rate) : 0,
          bitsPerSample: audioStream?.bits_per_sample || 0,
        });
      });
    });
  }

  /**
   * Extract audio from video
   */
  async extractFromVideo(
    videoPath: string,
    outputPath: string,
    format: 'mp3' | 'aac' | 'wav' | 'flac' = 'mp3'
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .noVideo()
        .audioCodec(format === 'mp3' ? 'libmp3lame' : format === 'aac' ? 'aac' : format === 'wav' ? 'pcm_s16le' : 'flac')
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(new ProcessingError(`Audio extraction failed: ${err.message}`)))
        .run();
    });
  }

  /**
   * Create audio from text (TTS)
   */
  async createFromText(
    text: string,
    outputPath: string,
    options: {
      voice?: string;
      speed?: number;
      pitch?: number;
      format?: 'mp3' | 'wav';
    } = {}
  ): Promise<void> {
    // This would typically use a TTS service like Google TTS, Amazon Polly, etc.
    // For now, we'll create a simple implementation
    return new Promise((resolve, reject) => {
      // Generate a simple tone as placeholder
      ffmpeg()
        .input('anullsrc')
        .inputOptions('-f', 'lavfi')
        .inputOptions('-t', '3')
        .outputOptions('-c:a', 'libmp3lame')
        .outputOptions('-b:a', '128k')
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(new ProcessingError(`TTS generation failed: ${err.message}`)))
        .run();
    });
  }

  /**
   * Mix multiple audio files
   */
  async mixAudio(
    inputPaths: string[],
    outputPath: string,
    options: {
      volumes?: number[];
      format?: 'mp3' | 'wav';
    } = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg();

      // Add inputs
      inputPaths.forEach((path, index) => {
        command = command.input(path);
        if (options.volumes && options.volumes[index] !== undefined) {
          command = command.inputOptions(`-filter:a`, `volume=${options.volumes[index]}`);
        }
      });

      // Mix audio
      const filterComplex = inputPaths.map((_, index) => `[${index}:a]`).join('') + `amix=inputs=${inputPaths.length}:duration=longest[out]`;

      command
        .complexFilter(filterComplex)
        .outputOptions('-map', '[out]')
        .audioCodec(options.format === 'wav' ? 'pcm_s16le' : 'libmp3lame')
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(new ProcessingError(`Audio mixing failed: ${err.message}`)))
        .run();
    });
  }

  /**
   * Detect silence in audio
   */
  async detectSilence(
    audioPath: string,
    options: {
      noise?: number; // dB
      duration?: number; // seconds
    } = {}
  ): Promise<{ start: number; end: number }[]> {
    const noise = options.noise || -30;
    const duration = options.duration || 1;

    return new Promise((resolve, reject) => {
      const silencePeriods: { start: number; end: number }[] = [];
      let currentStart: number | null = null;

      ffmpeg(audioPath)
        .outputOptions('-af', `silencedetect=noise=${noise}dB:d=${duration}`)
        .outputOptions('-f', 'null')
        .output('-')
        .on('stderr', (stderrLine: string) => {
          // Parse silence detection output
          const silenceStart = stderrLine.match(/silence_start: ([\d.]+)/);
          const silenceEnd = stderrLine.match(/silence_end: ([\d.]+)/);

          if (silenceStart) {
            currentStart = parseFloat(silenceStart[1]);
          }
          if (silenceEnd && currentStart !== null) {
            silencePeriods.push({
              start: currentStart,
              end: parseFloat(silenceEnd[1]),
            });
            currentStart = null;
          }
        })
        .on('end', () => resolve(silencePeriods))
        .on('error', (err) => reject(new ProcessingError(`Silence detection failed: ${err.message}`)))
        .run();
    });
  }

  /**
   * Validate audio file
   */
  async validateAudio(audioPath: string): Promise<boolean> {
    try {
      const metadata = await this.getMetadata(audioPath);
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
