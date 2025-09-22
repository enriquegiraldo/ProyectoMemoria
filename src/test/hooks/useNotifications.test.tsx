import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useNotifications } from '../../hooks/useNotifications';
import notificationReducer from '../../store/slices/notificationSlice';
import authReducer from '../../store/slices/authSlice';

// Mock de los servicios
vi.mock('../../services/notificationService', () => ({
  NotificationService: {
    getUserNotifications: vi.fn(),
    markNotificationAsRead: vi.fn(),
    markAllNotificationsAsRead: vi.fn(),
    deleteNotification: vi.fn(),
    getUnreadCount: vi.fn(),
    subscribeToNotifications: vi.fn(() => ({
      unsubscribe: vi.fn(),
    })),
  },
}));

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      notifications: notificationReducer,
      auth: authReducer,
    },
    preloadedState: {
      notifications: {
        notifications: [],
        unreadCount: 0,
        isLoading: false,
        error: null,
        ...initialState.notifications,
      },
      auth: {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        ...initialState.auth,
      },
    },
  });
};

const wrapper = ({ children, store }: { children: React.ReactNode; store: any }) => (
  <Provider store={store}>{children}</Provider>
);

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return initial notification state', () => {
      const store = createTestStore();

      const { result } = renderHook(() => useNotifications(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should return notifications when available', () => {
      const mockNotifications = [
        {
          id: '1',
          userId: 'user1',
          type: 'memory_added',
          title: 'New Memory',
          message: 'A new memory was added',
          is_read: false,
          createdAt: new Date().toISOString(),
        },
      ];

      const store = createTestStore({
        notifications: {
          notifications: mockNotifications,
          unreadCount: 1,
        },
      });

      const { result } = renderHook(() => useNotifications(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(result.current.notifications).toEqual(mockNotifications);
      expect(result.current.unreadCount).toBe(1);
    });
  });

  describe('markAsRead function', () => {
    it('should dispatch markAsRead action', async () => {
      const store = createTestStore();
      const { result } = renderHook(() => useNotifications(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      await act(async () => {
        await result.current.markAsRead('notification1');
      });

      // Verificar que se disparó la acción
      const state = store.getState();
      expect(state.notifications.isLoading).toBe(true);
    });
  });

  describe('markAllAsRead function', () => {
    it('should dispatch markAllAsRead action', async () => {
      const store = createTestStore();
      const { result } = renderHook(() => useNotifications(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      await act(async () => {
        await result.current.markAllAsRead();
      });

      // Verificar que se disparó la acción
      const state = store.getState();
      expect(state.notifications.isLoading).toBe(true);
    });
  });

  describe('removeNotification function', () => {
    it('should dispatch removeNotification action', async () => {
      const store = createTestStore();
      const { result } = renderHook(() => useNotifications(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      await act(async () => {
        await result.current.removeNotification('notification1');
      });

      // Verificar que se disparó la acción
      const state = store.getState();
      expect(state.notifications.isLoading).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should return error state', () => {
      const store = createTestStore({
        notifications: {
          error: 'Failed to load notifications',
        },
      });

      const { result } = renderHook(() => useNotifications(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(result.current.error).toBe('Failed to load notifications');
    });
  });

  describe('loading state', () => {
    it('should return loading state', () => {
      const store = createTestStore({
        notifications: {
          isLoading: true,
        },
      });

      const { result } = renderHook(() => useNotifications(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('subscription management', () => {
    it('should subscribe to notifications when user is authenticated', () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
      };

      const store = createTestStore({
        auth: {
          user: mockUser,
          isAuthenticated: true,
        },
      });

      const { NotificationService } = require('../../services/notificationService');

      renderHook(() => useNotifications(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(NotificationService.subscribeToNotifications).toHaveBeenCalledWith(
        'user1',
        expect.any(Function)
      );
    });

    it('should not subscribe when user is not authenticated', () => {
      const store = createTestStore({
        auth: {
          user: null,
          isAuthenticated: false,
        },
      });

      const { NotificationService } = require('../../services/notificationService');

      renderHook(() => useNotifications(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(NotificationService.subscribeToNotifications).not.toHaveBeenCalled();
    });
  });

  describe('notification filtering', () => {
    it('should filter unread notifications', () => {
      const mockNotifications = [
        {
          id: '1',
          userId: 'user1',
          type: 'memory_added',
          title: 'New Memory',
          message: 'A new memory was added',
          is_read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user1',
          type: 'comment_added',
          title: 'New Comment',
          message: 'Someone commented on your memory',
          is_read: true,
          createdAt: new Date().toISOString(),
        },
      ];

      const store = createTestStore({
        notifications: {
          notifications: mockNotifications,
          unreadCount: 1,
        },
      });

      const { result } = renderHook(() => useNotifications(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      const unreadNotifications = result.current.notifications.filter(n => !n.is_read);
      expect(unreadNotifications).toHaveLength(1);
      expect(unreadNotifications[0].id).toBe('1');
    });
  });
});
