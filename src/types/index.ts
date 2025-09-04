// src/types/index.ts
// Tipos de usuario
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profile?: UserProfile;
  pageId?: string;
  canEdit?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'ADMIN' | 'FAMILIAR' | 'AMIGO' | 'INVITADO';

export interface UserProfile {
  relationship?: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  location?: string;
}

// Tipos de memoria
export interface Memory {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: MediaType;
  authorId: string;
  authorName: string;
  date: string;
  tags: string[];
  pageId: string;
  createdAt: string;
  updatedAt: string;
}

export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO';

// Tipos de comentarios
export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  memoryId: string;
  parentCommentId?: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos de reacciones
export interface Reaction {
  id: string;
  type: ReactionType;
  userId: string;
  referenceId: string;
  referenceType: 'MEMORY' | 'COMMENT';
  createdAt: string;
}

export type ReactionType = 'LIKE' | 'HEART' | 'SAD';

// Tipos de página
export interface Page {
  id: string;
  title: string;
  subtitle: string;
  personName: string;
  backgroundImage?: string;
  backgroundVideo?: string;
  birthDate?: string;
  passingDate?: string;
  ownerId: string;
  template: PageTemplate;
  qrCodeUrl?: string;
  subscriptionStatus: SubscriptionStatus;
  createdAt: string;
  updatedAt: string;
}

export type PageTemplate = 'CLASSIC' | 'MODERN' | 'MINIMAL' | 'ELEGANT';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

// Tipos de filtros
export interface MemoryFilters {
  search: string;
  tags: string[];
  mediaType: string[];
  dateRange: DateRange | null;
}

export interface DateRange {
  start: string;
  end: string;
}

// Tipos de UI
export interface ModalState {
  isOpen: boolean;
  type: ModalType | null;
  data?: any;
}

export type ModalType = 'login' | 'register' | 'memory' | 'comment' | 'upload' | 'settings';

export interface UIState {
  modal: ModalState;
  sidebar: {
    isOpen: boolean;
  };
  loading: {
    global: boolean;
    upload: boolean;
  };
  notifications: {
    show: boolean;
    type: NotificationType;
    message: string;
    duration: number;
  };
  theme: {
    mode: 'light' | 'dark';
    primaryColor: string;
    secondaryColor: string;
  };
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Tipos de autenticación
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Tipos de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Tipos de formularios
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: UserRole;
}

export interface MemoryForm {
  title: string;
  description: string;
  date: string;
  tags: string[];
  mediaFile?: File;
  mediaUrl?: string;
}

// Tipos de configuración
export interface AppConfig {
  apiUrl: string;
  uploadUrl: string;
  maxFileSize: number;
  allowedFileTypes: string[];
  maxMemoriesPerPage: number;
  maxCommentsPerMemory: number;
}

// Tipos de eventos
export interface AppEvent {
  type: string;
  payload: any;
  timestamp: string;
  userId?: string;
}

// Tipos de estadísticas
export interface PageStats {
  totalMemories: number;
  totalComments: number;
  totalReactions: number;
  uniqueVisitors: number;
  lastActivity: string;
}

// Tipos de notificaciones
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  read: boolean;
  createdAt: string;
}

// Tipos de búsqueda
export interface SearchResult {
  type: 'memory' | 'comment' | 'user';
  id: string;
  title: string;
  description: string;
  relevance: number;
}

// Tipos de exportación
export interface ExportOptions {
  format: 'pdf' | 'json' | 'csv';
  includeMedia: boolean;
  dateRange?: DateRange;
  tags?: string[];
}

// Tipos de importación
export interface ImportOptions {
  format: 'json' | 'csv';
  overwrite: boolean;
  validateOnly: boolean;
}

// Tipos de backup
export interface BackupData {
  version: string;
  timestamp: string;
  page: Page;
  memories: Memory[];
  comments: Comment[];
  reactions: Reaction[];
  users: User[];
}
export interface UpdateMemoryData {
  title?: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: MediaType;
  tags?: string[];
}

export interface CreateCommentData {
  content: string;
  authorId: string;
  memoryId: string;
  parentCommentId?: string;
}
export interface MemoriesState {
  memories: Memory[];
  comments: Comment[];
  reactions: Reaction[];
  currentMemory: Memory | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    search: string;
    tags: string[];
    mediaType: string | undefined;
    dateRange: { start: string; end: string } | null;
    sortBy?: 'string' | 'date' | 'popularity' | 'relevance' | 'author' | 'title';
    sortOrder?: 'asc' | 'desc';
  };
};

// Interfaz para las memorias en el estado del cliente
export interface ClientMemory {
  id: number;
  type: 'photo' | 'message';
  author: string;
  content: string;
  imageUrl?: string;
  date: string;
  relationship: string;
};

// Tipos para creación de memorias
export interface CreateMemoryData {
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: MediaType;
  authorId: string;
  pageId: string;
  tags: string[];
};