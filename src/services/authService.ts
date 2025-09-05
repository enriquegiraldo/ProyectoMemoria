// src/services/authService.ts
import { supabase } from '../lib/supabase';
import { PrismaClient } from '@prisma/client';
import { User, AuthResponse, LoginCredentials, RegisterData } from '../types';

const prisma = new PrismaClient();

export interface AuthError {
  message: string;
  code?: string;
}

export class AuthService {
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return null;
      }

      return {
        id: user.id,
        email: user.email || '',
        name: userData?.name || '',
        role: userData?.role || 'INVITADO',
        profile: userData?.profile || {},
        pageId: userData?.page_id || null,
        isActive: true,
        createdAt: userData?.created_at || user.created_at,
        updatedAt: userData?.updated_at || user.updated_at,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return {
          success: false,
          error: { message: error.message, code: error.name },
        };
      }

      if (data.user) {
        const user = await this.getCurrentUser();
        return { success: true, user };
      }

      return {
        success: false,
        error: { message: 'No se pudo obtener información del usuario' },
      };
    } catch (error) {
      return {
        success: false,
        error: { message: 'Error inesperado durante el inicio de sesión' },
      };
    }
  }

  static async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      // Crear usuario en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: { data: { name: userData.name } },
      });

      if (error) {
        return {
          success: false,
          error: { message: error.message, code: error.name },
        };
      }

      if (data.user) {
        // Crear usuario en Supabase (tabla users)
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role || 'FAMILIAR',
            profile: userData.profile || {},
            page_id: userData.pageId || null,
          });

        if (profileError) {
          console.error('Error creating user profile in Supabase:', profileError);
        }

        // Crear usuario en Prisma (tabla User)
        try {
          await prisma.user.create({
            data: {
              id: data.user.id,
              email: userData.email,
              name: userData.name,
              password: userData.password, // Debería estar hasheado
              role: userData.role === 'ADMIN' ? 'ADMIN' : 'USER', // Mapear roles
            },
          });
        } catch (prismaError) {
          console.error('Error creating user in Prisma:', prismaError);
        }

        const user = await this.getCurrentUser();
        return { success: true, user };
      }

      return {
        success: false,
        error: { message: 'No se pudo crear el usuario' },
      };
    } catch (error) {
      return {
        success: false,
        error: { message: 'Error inesperado durante el registro' },
      };
    }
  }

  static async logout(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return {
          success: false,
          error: { message: error.message, code: error.name },
        };
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: { message: 'Error inesperado durante el cierre de sesión' },
      };
    }
  }

  static async loginWithGoogle(): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });

      if (error) {
        return {
          success: false,
          error: { message: error.message, code: error.name },
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: { message: 'Error inesperado durante el inicio de sesión con Google' },
      };
    }
  }

  static async updateProfile(userId: string, updates: Partial<User>): Promise<AuthResponse> {
    try {
      // Actualizar en Supabase
      const { data, error } = await supabase
        .from('users')
        .update({
          name: updates.name,
          profile: updates.profile,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: { message: error.message, code: error.code },
        };
      }

      // Actualizar en Prisma
      try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            name: updates.name,
            bio: updates.profile?.bio,
            avatarUrl: updates.profile?.avatar,
            relationship: updates.profile?.relationship,
          },
        });
      } catch (prismaError) {
        console.error('Error updating user in Prisma:', prismaError);
      }

      const user = await this.getCurrentUser();
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: { message: 'Error inesperado al actualizar el perfil' },
      };
    }
  }

  static async changePassword(newPassword: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return {
          success: false,
          error: { message: error.message, code: error.name },
        };
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: { message: 'Error inesperado al cambiar la contraseña' },
      };
    }
  }

  static async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return {
          success: false,
          error: { message: error.message, code: error.name },
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: { message: 'Error inesperado al enviar el email de restablecimiento' },
      };
    }
  }

  static async checkPageAccess(userId: string, pageId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, page_id')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return false;
      }

      if (data.role === 'ADMIN') {
        return true;
      }

      return data.page_id === pageId;
    } catch (error) {
      console.error('Error checking page access:', error);
      return false;
    }
  }

  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = await this.getCurrentUser();
        callback(user);
      } else if (event === 'SIGNED_OUT') {
        callback(null);
      }
    });
  }
}
