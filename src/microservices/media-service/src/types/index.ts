// Media Service Types
//src/microservices/media-service/src/types/index.ts
export interface MediaFile {
  id: string;
  userId: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  type: MediaType;
  status: ProcessingStatus;
  metadata: MediaMetadata;
  exifData?: ExifData;
  processingOptions?: ProcessingOptions;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';

export type ProcessingStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  bitrate?: number;
  fps?: number;
  codec?: string;
  format?: string;
  orientation?: number;
  colorSpace?: string;
  hasAlpha?: boolean;
  isAnimated?: boolean;
  frameCount?: number;
  sampleRate?: number;
  channels?: number;
  pages?: number;
  compression?: string;
  encryption?: string;
  checksum: string;
  virusScan?: VirusScanResult;
  contentModeration?: ContentModerationResult;
  autoTags?: string[];
  faceDetection?: FaceDetectionResult;
  objectDetection?: ObjectDetectionResult;
}

export interface ExifData {
  make?: string;
  model?: string;
  software?: string;
  dateTime?: Date;
  dateTimeOriginal?: Date;
  dateTimeDigitized?: Date;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAltitude?: number;
  gpsLocation?: string;
  exposureTime?: string;
  fNumber?: number;
  iso?: number;
  focalLength?: number;
  flash?: boolean;
  whiteBalance?: string;
  meteringMode?: string;
  exposureMode?: string;
  orientation?: number;
  copyright?: string;
  artist?: string;
  description?: string;
  keywords?: string[];
}

export interface ProcessingOptions {
  resize?: ResizeOptions;
  crop?: CropOptions;
  compress?: CompressOptions;
  convert?: ConvertOptions;
  watermark?: WatermarkOptions;
  filter?: FilterOptions;
  enhance?: EnhanceOptions;
}

export interface ResizeOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top' | 'center';
  background?: string;
  withoutEnlargement?: boolean;
  withoutReduction?: boolean;
}

export interface CropOptions {
  width: number;
  height: number;
  x: number;
  y: number;
  gravity?: 'north' | 'northeast' | 'east' | 'southeast' | 'south' | 'southwest' | 'west' | 'northwest' | 'center';
}

export interface CompressOptions {
  quality: number;
  progressive?: boolean;
  optimizeCoding?: boolean;
  mozjpeg?: boolean;
  webp?: boolean;
  avif?: boolean;
}

export interface ConvertOptions {
  format: string;
  quality?: number;
  options?: Record<string, any>;
}

export interface WatermarkOptions {
  text?: string;
  image?: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  size: number;
  color?: string;
  font?: string;
}

export interface FilterOptions {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  blur?: number;
  sharpen?: number;
  gamma?: number;
  sepia?: number;
  grayscale?: boolean;
  invert?: boolean;
}

export interface EnhanceOptions {
  autoLevel?: boolean;
  autoContrast?: boolean;
  autoColor?: boolean;
  denoise?: boolean;
  sharpen?: boolean;
  enhance?: boolean;
}

export interface VirusScanResult {
  scanned: boolean;
  clean: boolean;
  threats?: string[];
  scanDate: Date;
  scanner?: string;
}

export interface ContentModerationResult {
  moderated: boolean;
  safe: boolean;
  categories?: ModerationCategory[];
  confidence: number;
  moderationDate: Date;
  service?: string;
}

export interface ModerationCategory {
  name: string;
  confidence: number;
  threshold: number;
  passed: boolean;
}

export interface FaceDetectionResult {
  detected: boolean;
  count: number;
  faces: Face[];
  confidence: number;
}

export interface Face {
  boundingBox: BoundingBox;
  confidence: number;
  landmarks?: Point[];
  attributes?: FaceAttributes;
}

export interface FaceAttributes {
  age?: number;
  gender?: 'male' | 'female';
  emotion?: string;
  smile?: number;
  glasses?: boolean;
  beard?: boolean;
  mustache?: boolean;
}

export interface ObjectDetectionResult {
  detected: boolean;
  objects: DetectedObject[];
  confidence: number;
}

export interface DetectedObject {
  name: string;
  confidence: number;
  boundingBox: BoundingBox;
  category?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

// Upload Types
export interface UploadRequest {
  files: Express.Multer.File[];
  userId: string;
  options?: UploadOptions;
  metadata?: Record<string, any>;
}

export interface UploadOptions {
  process?: boolean;
  generateThumbnail?: boolean;
  resize?: ResizeOptions;
  compress?: CompressOptions;
  convert?: ConvertOptions;
  watermark?: WatermarkOptions;
  scanVirus?: boolean;
  moderateContent?: boolean;
  detectFaces?: boolean;
  detectObjects?: boolean;
  autoTag?: boolean;
}

export interface UploadResponse {
  success: boolean;
  files: MediaFile[];
  errors?: UploadError[];
  processingJobs?: string[];
}

export interface UploadError {
  fileName: string;
  error: string;
  code: string;
}

// Processing Types
export interface ProcessingJob {
  id: string;
  fileId: string;
  userId: string;
  type: ProcessingJobType;
  status: ProcessingJobStatus;
  options: ProcessingOptions;
  progress: number;
  result?: ProcessingResult;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export type ProcessingJobType = 
  | 'resize'
  | 'crop'
  | 'compress'
  | 'convert'
  | 'watermark'
  | 'filter'
  | 'enhance'
  | 'thumbnail'
  | 'optimize'
  | 'batch';

export type ProcessingJobStatus = 
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ProcessingResult {
  outputFile: MediaFile;
  processingTime: number;
  originalSize: number;
  processedSize: number;
  compressionRatio: number;
  metadata: Record<string, any>;
}

// Storage Types
export interface StorageProvider {
  name: string;
  upload(file: Buffer, key: string, options?: StorageOptions): Promise<StorageResult>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getUrl(key: string, options?: StorageUrlOptions): Promise<string>;
  list(prefix?: string): Promise<StorageItem[]>;
}

export interface StorageOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  public?: boolean;
  encryption?: string;
  cacheControl?: string;
  expires?: Date;
}

export interface StorageResult {
  key: string;
  url: string;
  size: number;
  etag?: string;
  versionId?: string;
  metadata?: Record<string, string>;
}

export interface StorageUrlOptions {
  expires?: number;
  public?: boolean;
  download?: boolean;
  responseContentType?: string;
  responseContentDisposition?: string;
}

export interface StorageItem {
  key: string;
  size: number;
  lastModified: Date;
  etag?: string;
  metadata?: Record<string, string>;
}

// CDN Types
export interface CDNProvider {
  name: string;
  getUrl(key: string, options?: CDNOptions): string;
  invalidate(paths: string[]): Promise<void>;
  purge(paths: string[]): Promise<void>;
  getStatus(): Promise<CDNStatus>;
}

export interface CDNOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
  crop?: string;
  gravity?: string;
  effect?: string;
  expires?: number;
}

export interface CDNStatus {
  healthy: boolean;
  latency: number;
  errors: number;
  lastCheck: Date;
}

// API Types
export interface CreateMediaRequest {
  file: Express.Multer.File;
  metadata?: Record<string, any>;
  options?: UploadOptions;
}

export interface UpdateMediaRequest {
  metadata?: Record<string, any>;
  processingOptions?: ProcessingOptions;
}

export interface SearchMediaRequest {
  query?: string;
  type?: MediaType[];
  status?: ProcessingStatus[];
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sizeMin?: number;
  sizeMax?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchMediaResponse {
  files: MediaFile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets: SearchFacets;
}

export interface SearchFacets {
  types: FacetCount[];
  statuses: FacetCount[];
  sizes: FacetRange[];
  dates: FacetRange[];
}

export interface FacetCount {
  value: string;
  count: number;
}

export interface FacetRange {
  from: number;
  to: number;
  count: number;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type Nullable<T> = T | null;

export type AsyncResult<T, E = Error> = Promise<{ success: true; data: T } | { success: false; error: E }>;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    version: string;
    requestId?: string;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Event Types
export interface MediaEvent {
  id: string;
  type: MediaEventType;
  fileId: string;
  userId: string;
  data: any;
  timestamp: Date;
}

export type MediaEventType = 
  | 'file.uploaded'
  | 'file.processed'
  | 'file.deleted'
  | 'processing.started'
  | 'processing.completed'
  | 'processing.failed'
  | 'virus.scanned'
  | 'content.moderated'
  | 'faces.detected'
  | 'objects.detected';

// Analytics Types
export interface MediaAnalytics {
  totalFiles: number;
  totalSize: number;
  averageFileSize: number;
  filesByType: Record<MediaType, number>;
  filesByStatus: Record<ProcessingStatus, number>;
  uploadsByDay: DailyStats[];
  processingStats: ProcessingStats;
  storageStats: StorageStats;
  errorStats: ErrorStats;
}

export interface DailyStats {
  date: string;
  uploads: number;
  size: number;
  errors: number;
}

export interface ProcessingStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
  jobsByType: Record<ProcessingJobType, number>;
}

export interface StorageStats {
  totalUsed: number;
  filesByProvider: Record<string, number>;
  averageFileSize: number;
  compressionRatio: number;
}

export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByFile: Record<string, number>;
  recentErrors: ErrorDetail[];
}

export interface ErrorDetail {
  timestamp: Date;
  error: string;
  fileId?: string;
  userId?: string;
  stack?: string;
}
