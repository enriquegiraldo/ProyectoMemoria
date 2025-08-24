import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useAuth } from '../../hooks/useAuth';
import authReducer from '../../store/slices/authSlice';

// Mock de los servicios
vi.mock('../../services/authService', () => ({
  AuthService: {
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    logoutUser: vi.fn(),
    getCurrentUser: vi.fn(),
    updateUserProfile: vi.fn(),
  },
}));

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        ...initialState,
      },
    },
  });
};

const wrapper = ({ children, store }: { children: React.ReactNode; store: any }) => (
  <Provider store={store}>{children}</Provider>
);

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('user state', () => {
    it('should return user when authenticated', () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      };

      const store = createTestStore({
        user: mockUser,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should return null when not authenticated', () => {
      const store = createTestStore({
        user: null,
        isAuthenticated: false,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('permission checks', () => {
    it('should return correct permissions for admin user', () => {
      const mockUser = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
      };

      const store = createTestStore({
        user: mockUser,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(result.current.canEdit).toBe(true);
      expect(result.current.canComment).toBe(true);
      expect(result.current.canDelete).toBe(true);
      expect(result.current.canManageUsers).toBe(true);
    });

    it('should return correct permissions for regular user', () => {
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user',
      };

      const store = createTestStore({
        user: mockUser,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(result.current.canEdit).toBe(true);
      expect(result.current.canComment).toBe(true);
      expect(result.current.canDelete).toBe(false);
      expect(result.current.canManageUsers).toBe(false);
    });

    it('should return false permissions when not authenticated', () => {
      const store = createTestStore({
        user: null,
        isAuthenticated: false,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(result.current.canEdit).toBe(false);
      expect(result.current.canComment).toBe(false);
      expect(result.current.canDelete).toBe(false);
      expect(result.current.canManageUsers).toBe(false);
    });
  });

  describe('login function', () => {
    it('should dispatch login action', async () => {
      const store = createTestStore();
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      // Verificar que se disparó la acción de login
      const state = store.getState();
      expect(state.auth.isLoading).toBe(true);
    });
  });

  describe('register function', () => {
    it('should dispatch register action', async () => {
      const store = createTestStore();
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      await act(async () => {
        await result.current.register({
          email: 'test@example.com',
          password: 'password',
          name: 'Test User',
        });
      });

      // Verificar que se disparó la acción de registro
      const state = store.getState();
      expect(state.auth.isLoading).toBe(true);
    });
  });

  describe('logout function', () => {
    it('should dispatch logout action', async () => {
      const store = createTestStore({
        user: { id: '1', email: 'test@example.com' },
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      await act(async () => {
        await result.current.logout();
      });

      // Verificar que se disparó la acción de logout
      const state = store.getState();
      expect(state.auth.user).toBeNull();
      expect(state.auth.isAuthenticated).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should return error state', () => {
      const store = createTestStore({
        error: 'Authentication failed',
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(result.current.error).toBe('Authentication failed');
    });
  });

  describe('loading state', () => {
    it('should return loading state', () => {
      const store = createTestStore({
        isLoading: true,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(result.current.isLoading).toBe(true);
    });
  });
});
