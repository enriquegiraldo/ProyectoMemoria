import { readFileSync } from 'fs';
import { extname, basename } from 'path';
import mime from 'mime-types';
import { fileTypeFromBuffer } from 'file-type';
import { MediaType, InvalidFileTypeError, FileCorruptedError } from '../types';

// Supported file types and their MIME types
export const SUPPORTED_FILE_TYPES = {
  // Images
  image: {
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/tiff'],
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  // Videos
  video: {
    extensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp', '.ogv'],
    mimeTypes: ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/webm', 'video/x-matroska', 'video/x-m4v', 'video/3gpp', 'video/ogg'],
    maxSize: 500 * 1024 * 1024, // 500MB
  },
  // Audio
  audio: {
    extensions: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus'],
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg', 'audio/x-ms-wma', 'audio/mp4', 'audio/opus'],
    maxSize: 100 * 1024 * 1024, // 100MB
  },
  // Documents
  document: {
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.odt', '.ods', '.odp'],
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain', 'application/rtf', 'application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.spreadsheet', 'application/vnd.oasis.opendocument.presentation'],
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  // Archives
  archive: {
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz'],
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar', 'application/gzip', 'application/x-bzip2', 'application/x-xz'],
    maxSize: 200 * 1024 * 1024, // 200MB
  },
} as const;

// Dangerous file types that should be blocked
export const DANGEROUS_FILE_TYPES = {
  extensions: ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', '.msi', '.dmg', '.app'],
  mimeTypes: ['application/x-executable', 'application/x-msdownload', 'application/x-msi', 'application/x-apple-diskimage'],
};

/**
 * Detect file type from buffer
 */
export async function detectFileType(buffer: Buffer): Promise<{ ext: string; mime: string } | null> {
  try {
    const fileType = await fileTypeFromBuffer(buffer);
    if (fileType) {
      return {
        ext: fileType.ext,
        mime: fileType.mime,
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get file type from extension
 */
export function getFileTypeFromExtension(extension: string): MediaType {
  const ext = extension.toLowerCase();
  
  for (const [type, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
    if (config.extensions.includes(ext)) {
      return type as MediaType;
    }
  }
  
  return 'other';
}

/**
 * Get file type from MIME type
 */
export function getFileTypeFromMimeType(mimeType: string): MediaType {
  const mime = mimeType.toLowerCase();
  
  for (const [type, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
    if (config.mimeTypes.includes(mime)) {
      return type as MediaType;
    }
  }
  
  return 'other';
}

/**
 * Validate file type
 */
export function validateFileType(extension: string, mimeType: string): boolean {
  const ext = extension.toLowerCase();
  const mime = mimeType.toLowerCase();
  
  // Check if file type is supported
  for (const config of Object.values(SUPPORTED_FILE_TYPES)) {
    if (config.extensions.includes(ext) && config.mimeTypes.includes(mime)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if file type is dangerous
 */
export function isDangerousFileType(extension: string, mimeType: string): boolean {
  const ext = extension.toLowerCase();
  const mime = mimeType.toLowerCase();
  
  return DANGEROUS_FILE_TYPES.extensions.includes(ext) || 
         DANGEROUS_FILE_TYPES.mimeTypes.includes(mime);
}

/**
 * Get maximum file size for file type
 */
export function getMaxFileSize(fileType: MediaType): number {
  return SUPPORTED_FILE_TYPES[fileType]?.maxSize || 10 * 1024 * 1024; // Default 10MB
}

/**
 * Validate file size
 */
export function validateFileSize(fileSize: number, fileType: MediaType): boolean {
  const maxSize = getMaxFileSize(fileType);
  return fileSize <= maxSize;
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = extname(originalName);
  const baseName = basename(originalName, extension);
  const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
  
  return `${userId}_${timestamp}_${random}_${sanitizedName}${extension}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return extname(filename).toLowerCase();
}

/**
 * Get MIME type from filename
 */
export function getMimeType(filename: string): string {
  const mimeType = mime.lookup(filename);
  return mimeType || 'application/octet-stream';
}

/**
 * Validate file buffer
 */
export async function validateFileBuffer(buffer: Buffer, filename: string): Promise<{
  isValid: boolean;
  fileType: MediaType;
  extension: string;
  mimeType: string;
  error?: string;
}> {
  try {
    // Get extension and MIME type from filename
    const extension = getFileExtension(filename);
    const mimeType = getMimeType(filename);
    
    // Detect actual file type from buffer
    const detectedType = await detectFileType(buffer);
    
    if (detectedType) {
      // Check if detected type matches filename
      if (detectedType.ext !== extension.replace('.', '') && 
          detectedType.mime !== mimeType) {
        return {
          isValid: false,
          fileType: 'other',
          extension,
          mimeType,
          error: 'File type mismatch between filename and content',
        };
      }
    }
    
    // Check if file type is dangerous
    if (isDangerousFileType(extension, mimeType)) {
      return {
        isValid: false,
        fileType: 'other',
        extension,
        mimeType,
        error: 'Dangerous file type detected',
      };
    }
    
    // Check if file type is supported
    if (!validateFileType(extension, mimeType)) {
      return {
        isValid: false,
        fileType: 'other',
        extension,
        mimeType,
        error: 'Unsupported file type',
      };
    }
    
    const fileType = getFileTypeFromExtension(extension);
    
    return {
      isValid: true,
      fileType,
      extension,
      mimeType,
    };
  } catch (error) {
    return {
      isValid: false,
      fileType: 'other',
      extension: getFileExtension(filename),
      mimeType: getMimeType(filename),
      error: 'File validation failed',
    };
  }
}

/**
 * Calculate file hash (MD5)
 */
export function calculateFileHash(buffer: Buffer): string {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(buffer).digest('hex');
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Parse file size string to bytes
 */
export function parseFileSize(sizeString: string): number {
  const units: { [key: string]: number } = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };
  
  const match = sizeString.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?B)$/i);
  if (!match) {
    throw new Error('Invalid file size format');
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  
  return value * units[unit];
}

/**
 * Check if file is an image
 */
export function isImage(fileType: MediaType): boolean {
  return fileType === 'image';
}

/**
 * Check if file is a video
 */
export function isVideo(fileType: MediaType): boolean {
  return fileType === 'video';
}

/**
 * Check if file is audio
 */
export function isAudio(fileType: MediaType): boolean {
  return fileType === 'audio';
}

/**
 * Check if file is a document
 */
export function isDocument(fileType: MediaType): boolean {
  return fileType === 'document';
}

/**
 * Check if file is an archive
 */
export function isArchive(fileType: MediaType): boolean {
  return fileType === 'archive';
}

/**
 * Get file type icon
 */
export function getFileTypeIcon(fileType: MediaType): string {
  const icons = {
    image: '🖼️',
    video: '🎥',
    audio: '🎵',
    document: '📄',
    archive: '📦',
    other: '📎',
  };
  
  return icons[fileType] || icons.other;
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Get file metadata
 */
export async function getFileMetadata(buffer: Buffer, filename: string): Promise<{
  size: number;
  hash: string;
  fileType: MediaType;
  extension: string;
  mimeType: string;
  originalName: string;
}> {
  const validation = await validateFileBuffer(buffer, filename);
  
  if (!validation.isValid) {
    throw new InvalidFileTypeError(validation.error || 'Invalid file type');
  }
  
  return {
    size: buffer.length,
    hash: calculateFileHash(buffer),
    fileType: validation.fileType,
    extension: validation.extension,
    mimeType: validation.mimeType,
    originalName: filename,
  };
}

/**
 * Read file as buffer
 */
export function readFileAsBuffer(filePath: string): Buffer {
  try {
    return readFileSync(filePath);
  } catch (error) {
    throw new FileCorruptedError(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate file path
 */
export function validateFilePath(filePath: string): boolean {
  // Check for path traversal attempts
  if (filePath.includes('..') || filePath.includes('//')) {
    return false;
  }
  
  // Check for absolute paths
  if (filePath.startsWith('/') || filePath.startsWith('\\')) {
    return false;
  }
  
  return true;
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const extension = mime.extension(mimeType);
  return extension ? `.${extension}` : '';
}

/**
 * Check if file can be processed
 */
export function canProcessFile(fileType: MediaType): boolean {
  return ['image', 'video', 'audio'].includes(fileType);
}

/**
 * Get processing options for file type
 */
export function getProcessingOptions(fileType: MediaType): string[] {
  const options = {
    image: ['resize', 'crop', 'compress', 'convert', 'watermark', 'filter', 'enhance', 'thumbnail'],
    video: ['resize', 'compress', 'convert', 'watermark', 'thumbnail'],
    audio: ['compress', 'convert'],
    document: ['convert'],
    archive: [],
    other: [],
  };
  
  return options[fileType] || [];
}
