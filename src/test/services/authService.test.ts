import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '../../services/authService';
import { supabase } from '../../lib/supabase';

// Mock de Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('loginUser', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      const mockSession = {
        access_token: 'mock-token',
        user: mockUser,
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await AuthService.login({ email: 'test@example.com', password: 'password' });

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });

    it('should handle login error', async () => {
      const mockError = { message: 'Invalid credentials' };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await AuthService.login({ email: 'test@example.com', password: 'password' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('registerUser', () => {
    it('should register user successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const result = await AuthService.register({
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      });

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        options: {
          data: { name: 'Test User' },
        },
      });
    });

    it('should handle registration error', async () => {
      const mockError = { message: 'Email already exists' };

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await AuthService.register({
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already exists');
    });
  });

  describe('logoutUser', () => {
    it('should logout user successfully', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      const result = await AuthService.logout();

      expect(result.success).toBe(true);
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle logout error', async () => {
      const mockError = { message: 'Logout failed' };

      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: mockError,
      });

      const result = await AuthService.logout();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Logout failed');
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await AuthService.getCurrentUser();

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    it('should handle no current user', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await AuthService.getCurrentUser();

      expect(result.success).toBe(false);
      expect(result.user).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const mockUpdatedUser = {
        id: '1',
        email: 'test@example.com',
        user_metadata: { name: 'Updated Name' },
      };

      const mockFrom = vi.mocked(supabase.from);
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockUpdatedUser,
            error: null,
          }),
        }),
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [mockUpdatedUser],
              error: null,
            }),
          }),
        }),
      });

      const result = await AuthService.updateProfile('1', {
        name: 'Updated Name',
        bio: 'Updated bio',
      });

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUpdatedUser);
    });
  });

  describe('checkPageAccess', () => {
    it('should check page access successfully', async () => {
      const mockPage = {
        id: '1',
        title: 'Test Page',
        is_public: true,
      };

      const mockFrom = vi.mocked(supabase.from);
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockPage,
            error: null,
          }),
        }),
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
      });

      const result = await AuthService.checkPageAccess('1', 'user1');

      expect(result.success).toBe(true);
      expect(result.hasAccess).toBe(true);
      expect(result.page).toEqual(mockPage);
    });

    it('should handle page not found', async () => {
      const mockFrom = vi.mocked(supabase.from);
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Page not found' },
          }),
        }),
      });

      mockFrom.mockReturnValue({
        select: mockSelect,
      });

      const result = await AuthService.checkPageAccess('1', 'user1');

      expect(result.success).toBe(false);
      expect(result.hasAccess).toBe(false);
    });
  });
});
