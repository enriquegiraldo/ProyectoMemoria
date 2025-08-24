import { supabase } from '../lib/supabase';
import { User, AuthResponse, LoginCredentials, RegisterData } from '../types';

export interface AuthError {
  message: string;
  code?: string;
}

export class AuthService {
  // Obtener usuario actual
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return null;
      }

      // Obtener datos adicionales del usuario desde nuestra tabla personalizada
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
        createdAt: userData?.created_at || user.created_at,
        updatedAt: userData?.updated_at || user.updated_at,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Iniciar sesión con email y contraseña
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.name,
          },
        };
      }

      if (data.user) {
        const user = await this.getCurrentUser();
        return {
          success: true,
          user,
        };
      }

      return {
        success: false,
        error: {
          message: 'No se pudo obtener información del usuario',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Error inesperado durante el inicio de sesión',
        },
      };
    }
  }

  // Registro de usuario
  static async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      // Crear usuario en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.name,
          },
        };
      }

      if (data.user) {
        // Crear registro en nuestra tabla personalizada de usuarios
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
          console.error('Error creating user profile:', profileError);
          // No fallamos aquí, el usuario ya se creó en auth
        }

        const user = await this.getCurrentUser();
        return {
          success: true,
          user,
        };
      }

      return {
        success: false,
        error: {
          message: 'No se pudo crear el usuario',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Error inesperado durante el registro',
        },
      };
    }
  }

  // Cerrar sesión
  static async logout(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.name,
          },
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Error inesperado durante el cierre de sesión',
        },
      };
    }
  }

  // Iniciar sesión con Google
  static async loginWithGoogle(): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.name,
          },
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Error inesperado durante el inicio de sesión con Google',
        },
      };
    }
  }

  // Actualizar perfil de usuario
  static async updateProfile(userId: string, updates: Partial<User>): Promise<AuthResponse> {
    try {
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
          error: {
            message: error.message,
            code: error.code,
          },
        };
      }

      const user = await this.getCurrentUser();
      return {
        success: true,
        user,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Error inesperado al actualizar el perfil',
        },
      };
    }
  }

  // Cambiar contraseña
  static async changePassword(newPassword: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.name,
          },
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Error inesperado al cambiar la contraseña',
        },
      };
    }
  }

  // Restablecer contraseña
  static async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            code: error.name,
          },
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Error inesperado al enviar el email de restablecimiento',
        },
      };
    }
  }

  // Verificar si el usuario tiene permisos para una página específica
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

      // Los administradores tienen acceso a todas las páginas
      if (data.role === 'ADMIN') {
        return true;
      }

      // Los familiares y amigos solo tienen acceso a su página asignada
      return data.page_id === pageId;
    } catch (error) {
      console.error('Error checking page access:', error);
      return false;
    }
  }

  // Suscribirse a cambios de autenticación
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
