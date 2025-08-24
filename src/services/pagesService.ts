import { supabase } from '../lib/supabase';
import { Page, CreatePageData, UpdatePageData } from '../types';

export interface PagesFilter {
  ownerId?: string;
  template?: string;
  subscriptionStatus?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
}

export interface PagesResponse {
  success: boolean;
  data?: Page[] | Page;
  error?: string;
  total?: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  previewImage: string;
  features: string[];
  price: number;
  duration: number; // días
}

export class PagesService {
  // Templates disponibles
  static readonly TEMPLATES: Template[] = [
    {
      id: 'classic',
      name: 'Clásico',
      description: 'Diseño elegante y tradicional para honrar a tus seres queridos',
      previewImage: '/templates/classic.jpg',
      features: [
        'Galería de fotos ilimitada',
        'Comentarios y reacciones',
        'Vela virtual',
        'Código QR personalizado',
        'Acceso por 1 año'
      ],
      price: 29.99,
      duration: 365
    },
    {
      id: 'modern',
      name: 'Moderno',
      description: 'Diseño contemporáneo con animaciones y efectos visuales',
      previewImage: '/templates/modern.jpg',
      features: [
        'Todo del plan Clásico',
        'Animaciones personalizadas',
        'Música de fondo',
        'Video de fondo',
        'Acceso por 2 años'
      ],
      price: 49.99,
      duration: 730
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'La experiencia más completa con funcionalidades avanzadas',
      previewImage: '/templates/premium.jpg',
      features: [
        'Todo del plan Moderno',
        'Videos HD ilimitados',
        'Audio personalizado',
        'Estadísticas detalladas',
        'Acceso permanente'
      ],
      price: 99.99,
      duration: 3650 // 10 años
    }
  ];

  // Obtener páginas con filtros
  static async getPages(filter: PagesFilter = {}): Promise<PagesResponse> {
    try {
      let query = supabase
        .from('pages')
        .select(`
          *,
          owner:users!pages_owner_id_fkey(
            id,
            name,
            email,
            profile
          )
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filter.ownerId) {
        query = query.eq('owner_id', filter.ownerId);
      }

      if (filter.template) {
        query = query.eq('template', filter.template);
      }

      if (filter.subscriptionStatus) {
        query = query.eq('subscription_status', filter.subscriptionStatus);
      }

      const { data, error, count } = await query;

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error fetching pages:', error);
      return {
        success: false,
        error: 'Error inesperado al obtener las páginas'
      };
    }
  }

  // Obtener página por ID
  static async getPageById(id: string): Promise<PagesResponse> {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select(`
          *,
          owner:users!pages_owner_id_fkey(
            id,
            name,
            email,
            profile
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'Página no encontrada'
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error fetching page:', error);
      return {
        success: false,
        error: 'Error inesperado al obtener la página'
      };
    }
  }

  // Crear nueva página
  static async createPage(pageData: CreatePageData): Promise<PagesResponse> {
    try {
      const { data, error } = await supabase
        .from('pages')
        .insert({
          owner_id: pageData.ownerId,
          template: pageData.template,
          subscription_status: 'ACTIVE',
        })
        .select(`
          *,
          owner:users!pages_owner_id_fkey(
            id,
            name,
            email,
            profile
          )
        `)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error creating page:', error);
      return {
        success: false,
        error: 'Error inesperado al crear la página'
      };
    }
  }

  // Actualizar página
  static async updatePage(id: string, updates: UpdatePageData): Promise<PagesResponse> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.template !== undefined) updateData.template = updates.template;
      if (updates.qrCodeUrl !== undefined) updateData.qr_code_url = updates.qrCodeUrl;
      if (updates.subscriptionStatus !== undefined) updateData.subscription_status = updates.subscriptionStatus;

      const { data, error } = await supabase
        .from('pages')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          owner:users!pages_owner_id_fkey(
            id,
            name,
            email,
            profile
          )
        `)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error updating page:', error);
      return {
        success: false,
        error: 'Error inesperado al actualizar la página'
      };
    }
  }

  // Eliminar página
  static async deletePage(id: string): Promise<PagesResponse> {
    try {
      // Eliminar memorias relacionadas
      await supabase.from('memories').delete().eq('page_id', id);

      // Eliminar usuarios relacionados
      await supabase.from('users').delete().eq('page_id', id);

      // Eliminar la página
      const { error } = await supabase
        .from('pages')
        .delete()
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting page:', error);
      return {
        success: false,
        error: 'Error inesperado al eliminar la página'
      };
    }
  }

  // Obtener template por ID
  static getTemplateById(templateId: string): Template | null {
    return this.TEMPLATES.find(template => template.id === templateId) || null;
  }

  // Obtener todos los templates
  static getAllTemplates(): Template[] {
    return this.TEMPLATES;
  }

  // Verificar si una página está activa
  static async isPageActive(pageId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('subscription_status, created_at')
        .eq('id', pageId)
        .single();

      if (error || !data) {
        return false;
      }

      // Si el estado es INACTIVE o EXPIRED, la página no está activa
      if (data.subscription_status !== 'ACTIVE') {
        return false;
      }

      // Verificar si la suscripción ha expirado basándose en la duración del template
      const template = this.getTemplateById(data.template);
      if (!template) {
        return false;
      }

      const createdAt = new Date(data.created_at);
      const expirationDate = new Date(createdAt.getTime() + (template.duration * 24 * 60 * 60 * 1000));
      
      return new Date() < expirationDate;
    } catch (error) {
      console.error('Error checking page status:', error);
      return false;
    }
  }

  // Generar código QR para una página
  static async generateQRCode(pageId: string): Promise<string | null> {
    try {
      // En una implementación real, aquí usarías una librería como qrcode
      // Por ahora, retornamos una URL de ejemplo
      const pageUrl = `${window.location.origin}/page/${pageId}`;
      
      // Actualizar la página con la URL del QR
      await this.updatePage(pageId, {
        qrCodeUrl: pageUrl
      });

      return pageUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  }

  // Obtener estadísticas de una página
  static async getPageStats(pageId: string): Promise<{
    memoriesCount: number;
    commentsCount: number;
    reactionsCount: number;
    uniqueVisitors: number;
  }> {
    try {
      const [memoriesResult, commentsResult, reactionsResult] = await Promise.all([
        supabase.from('memories').select('id').eq('page_id', pageId),
        supabase.from('comments').select('id').eq('memory_id', pageId),
        supabase.from('reactions').select('id').eq('reference_id', pageId)
      ]);

      return {
        memoriesCount: memoriesResult.data?.length || 0,
        commentsCount: commentsResult.data?.length || 0,
        reactionsCount: reactionsResult.data?.length || 0,
        uniqueVisitors: 0, // TODO: Implementar tracking de visitantes únicos
      };
    } catch (error) {
      console.error('Error getting page stats:', error);
      return {
        memoriesCount: 0,
        commentsCount: 0,
        reactionsCount: 0,
        uniqueVisitors: 0,
      };
    }
  }

  // Verificar permisos de usuario en una página
  static async checkUserPermissions(userId: string, pageId: string): Promise<{
    canEdit: boolean;
    canDelete: boolean;
    canManageUsers: boolean;
    role: string;
  }> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('role, page_id')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return {
          canEdit: false,
          canDelete: false,
          canManageUsers: false,
          role: 'INVITADO'
        };
      }

      // Los administradores tienen todos los permisos
      if (user.role === 'ADMIN') {
        return {
          canEdit: true,
          canDelete: true,
          canManageUsers: true,
          role: user.role
        };
      }

      // Los familiares pueden editar y gestionar usuarios de su página
      if (user.role === 'FAMILIAR' && user.page_id === pageId) {
        return {
          canEdit: true,
          canDelete: false,
          canManageUsers: true,
          role: user.role
        };
      }

      // Los amigos solo pueden comentar
      if (user.role === 'AMIGO' && user.page_id === pageId) {
        return {
          canEdit: false,
          canDelete: false,
          canManageUsers: false,
          role: user.role
        };
      }

      return {
        canEdit: false,
        canDelete: false,
        canManageUsers: false,
        role: user.role
      };
    } catch (error) {
      console.error('Error checking user permissions:', error);
      return {
        canEdit: false,
        canDelete: false,
        canManageUsers: false,
        role: 'INVITADO'
      };
    }
  }

  // Renovar suscripción de una página
  static async renewSubscription(pageId: string, templateId: string): Promise<PagesResponse> {
    try {
      const template = this.getTemplateById(templateId);
      if (!template) {
        return {
          success: false,
          error: 'Template no válido'
        };
      }

      const { data, error } = await supabase
        .from('pages')
        .update({
          template: templateId,
          subscription_status: 'ACTIVE',
          updated_at: new Date().toISOString(),
        })
        .eq('id', pageId)
        .select(`
          *,
          owner:users!pages_owner_id_fkey(
            id,
            name,
            email,
            profile
          )
        `)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error renewing subscription:', error);
      return {
        success: false,
        error: 'Error inesperado al renovar la suscripción'
      };
    }
  }
}
