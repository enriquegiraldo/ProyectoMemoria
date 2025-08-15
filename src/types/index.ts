import { User, Memory, Category, Comment, Like, Tag } from '@prisma/client'

// Tipos extendidos para incluir relaciones
export type UserWithMemories = User & {
  memories: Memory[]
  comments: Comment[]
  likes: Like[]
}

export type MemoryWithRelations = Memory & {
  author: User
  category: Category | null
  comments: Comment[]
  likes: Like[]
  tags: Tag[]
}

export type CommentWithAuthor = Comment & {
  author: User
}

export type CategoryWithMemories = Category & {
  memories: Memory[]
}

// Tipos para formularios
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface MemoryFormData {
  title: string
  content: string
  imageUrl?: string
  isPublic: boolean
  categoryId?: string
  tags: string[]
}

export interface CommentFormData {
  content: string
  memoryId: string
}

// Tipos para respuestas de API
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Tipos para filtros y búsqueda
export interface MemoryFilters {
  category?: string
  tags?: string[]
  author?: string
  isPublic?: boolean
  search?: string
}

export interface SearchParams {
  page?: string
  limit?: string
  search?: string
  category?: string
  tags?: string
  author?: string
}

// Tipos para sesión extendida
export interface ExtendedSession {
  user: {
    id: string
    email: string
    name: string | null
    role: string
  }
  expires: string
}

// Tipos para componentes
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

// Tipos para estadísticas
export interface UserStats {
  totalMemories: number
  publicMemories: number
  privateMemories: number
  totalLikes: number
  totalComments: number
}

export interface AppStats {
  totalUsers: number
  totalMemories: number
  totalCategories: number
  totalTags: number
}
