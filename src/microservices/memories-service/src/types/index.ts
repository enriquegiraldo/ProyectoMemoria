// Memory-related types
export interface Memory {
  id: string;
  userId: string;
  title: string;
  description: string;
  content: string;
  type: MemoryType;
  status: MemoryStatus;
  visibility: MemoryVisibility;
  tags: string[];
  location?: Location;
  date?: Date;
  media: MediaFile[];
  metadata: MemoryMetadata;
  permissions: MemoryPermission[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type MemoryType = 
  | 'story'
  | 'photo'
  | 'video'
  | 'audio'
  | 'document'
  | 'memory'
  | 'milestone'
  | 'anniversary'
  | 'tribute'
  | 'legacy';

export type MemoryStatus = 
  | 'draft'
  | 'published'
  | 'archived'
  | 'deleted'
  | 'pending_review'
  | 'rejected';

export type MemoryVisibility = 
  | 'private'
  | 'family'
  | 'friends'
  | 'public'
  | 'custom';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
  placeName?: string;
}

export interface MemoryMetadata {
  wordCount?: number;
  readingTime?: number;
  mediaCount: number;
  totalSize: number;
  lastAccessed?: Date;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  commentCount: number;
  isFeatured: boolean;
  isPinned: boolean;
  language?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  aiGenerated?: boolean;
  aiAssisted?: boolean;
}

export interface MemoryPermission {
  userId: string;
  permission: PermissionType;
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

export type PermissionType = 
  | 'view'
  | 'edit'
  | 'delete'
  | 'share'
  | 'comment'
  | 'admin';

// Media-related types
export interface MediaFile {
  id: string;
  memoryId: string;
  userId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  type: MediaType;
  metadata: MediaMetadata;
  processingStatus: ProcessingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type MediaType = 
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'archive'
  | 'other';

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
  format?: string;
  codec?: string;
  fps?: number;
  channels?: number;
  sampleRate?: number;
  exif?: ExifData;
  gps?: GpsData;
  faceDetection?: FaceDetectionData;
  objectDetection?: ObjectDetectionData;
  transcription?: string;
  language?: string;
  confidence?: number;
}

export interface ExifData {
  make?: string;
  model?: string;
  dateTime?: string;
  exposureTime?: string;
  fNumber?: number;
  iso?: number;
  focalLength?: number;
  flash?: boolean;
  orientation?: number;
  software?: string;
  artist?: string;
  copyright?: string;
}

export interface GpsData {
  latitude: number;
  longitude: number;
  altitude?: number;
  timestamp?: string;
}

export interface FaceDetectionData {
  faces: FaceData[];
  count: number;
}

export interface FaceData {
  confidence: number;
  boundingBox: BoundingBox;
  landmarks?: Point[];
  attributes?: FaceAttributes;
}

export interface FaceAttributes {
  age?: number;
  gender?: 'male' | 'female' | 'unknown';
  emotion?: string;
  glasses?: boolean;
  smile?: number;
}

export interface ObjectDetectionData {
  objects: DetectedObject[];
  count: number;
}

export interface DetectedObject {
  label: string;
  confidence: number;
  boundingBox: BoundingBox;
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

// User-related types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: string[];
  profile: UserProfile;
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 
  | 'user'
  | 'premium'
  | 'admin'
  | 'moderator'
  | 'family_admin';

export interface UserProfile {
  avatar?: string;
  bio?: string;
  birthDate?: Date;
  location?: string;
  website?: string;
  socialLinks?: SocialLinks;
  preferences: UserPreferences;
}

export interface SocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  theme: 'light' | 'dark' | 'auto';
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  memoryCreated: boolean;
  memoryShared: boolean;
  commentReceived: boolean;
  mentionReceived: boolean;
  weeklyDigest: boolean;
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'friends' | 'family' | 'private';
  memoryDefaultVisibility: MemoryVisibility;
  allowComments: boolean;
  allowSharing: boolean;
  allowSearchIndexing: boolean;
  showOnlineStatus: boolean;
}

export interface UserSettings {
  storage: StorageSettings;
  security: SecuritySettings;
  backup: BackupSettings;
}

export interface StorageSettings {
  maxStorageBytes: number;
  usedStorageBytes: number;
  compressionEnabled: boolean;
  autoBackupEnabled: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  sessionTimeout: number;
  passwordExpiryDays: number;
}

export interface BackupSettings {
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupRetention: number;
  lastBackupDate?: Date;
}

// Search and filtering types
export interface SearchFilters {
  query?: string;
  type?: MemoryType[];
  status?: MemoryStatus[];
  visibility?: MemoryVisibility[];
  tags?: string[];
  dateRange?: DateRange;
  location?: LocationRange;
  userId?: string;
  hasMedia?: boolean;
  isFeatured?: boolean;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  page?: number;
  limit?: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface LocationRange {
  latitude: number;
  longitude: number;
  radius: number; // in kilometers
}

export type SortField = 
  | 'createdAt'
  | 'updatedAt'
  | 'title'
  | 'date'
  | 'viewCount'
  | 'likeCount'
  | 'relevance';

export type SortOrder = 'asc' | 'desc';

export interface SearchResult {
  memories: Memory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets: SearchFacets;
}

export interface SearchFacets {
  types: FacetCount[];
  tags: FacetCount[];
  years: FacetCount[];
  locations: FacetCount[];
}

export interface FacetCount {
  value: string;
  count: number;
}

// API request/response types
export interface CreateMemoryRequest {
  title: string;
  description?: string;
  content: string;
  type: MemoryType;
  visibility: MemoryVisibility;
  tags?: string[];
  location?: Location;
  date?: Date;
  media?: File[];
}

export interface UpdateMemoryRequest {
  title?: string;
  description?: string;
  content?: string;
  type?: MemoryType;
  status?: MemoryStatus;
  visibility?: MemoryVisibility;
  tags?: string[];
  location?: Location;
  date?: Date;
}

export interface MemoryResponse {
  memory: Memory;
  user: User;
  relatedMemories?: Memory[];
  statistics: MemoryStatistics;
}

export interface MemoryStatistics {
  totalMemories: number;
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  averageRating: number;
  completionRate: number;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Cache types
export interface CacheKey {
  prefix: string;
  id: string;
  params?: Record<string, any>;
}

export interface CacheOptions {
  ttl: number;
  tags?: string[];
}

// Event types
export interface MemoryEvent {
  type: MemoryEventType;
  memoryId: string;
  userId: string;
  timestamp: Date;
  data?: any;
}

export type MemoryEventType = 
  | 'memory_created'
  | 'memory_updated'
  | 'memory_deleted'
  | 'memory_viewed'
  | 'memory_liked'
  | 'memory_shared'
  | 'memory_commented'
  | 'media_uploaded'
  | 'media_processed'
  | 'permission_granted'
  | 'permission_revoked';

// Analytics types
export interface MemoryAnalytics {
  memoryId: string;
  views: ViewAnalytics;
  engagement: EngagementAnalytics;
  performance: PerformanceAnalytics;
  period: DateRange;
}

export interface ViewAnalytics {
  totalViews: number;
  uniqueViews: number;
  viewsByDate: Record<string, number>;
  viewsByLocation: Record<string, number>;
  viewsByDevice: Record<string, number>;
}

export interface EngagementAnalytics {
  likes: number;
  shares: number;
  comments: number;
  bookmarks: number;
  averageTimeSpent: number;
  bounceRate: number;
}

export interface PerformanceAnalytics {
  loadTime: number;
  errorRate: number;
  availability: number;
  userSatisfaction: number;
}

// Export types
export interface ExportOptions {
  format: ExportFormat;
  includeMedia: boolean;
  includeMetadata: boolean;
  dateRange?: DateRange;
  compression?: boolean;
}

export type ExportFormat = 
  | 'json'
  | 'xml'
  | 'csv'
  | 'pdf'
  | 'zip'
  | 'html';

// Webhook types
export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  data: any;
  timestamp: Date;
  signature?: string;
}

export type WebhookEventType = 
  | 'memory.created'
  | 'memory.updated'
  | 'memory.deleted'
  | 'media.uploaded'
  | 'media.processed'
  | 'user.registered'
  | 'user.updated';

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Required<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type Nullable<T> = T | null;

export type AsyncResult<T, E = Error> = Promise<{ data?: T; error?: E }>;

// API Response wrapper
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
    requestId: string;
  };
}
