import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import NotificationBell from '../../components/ui/NotificationBell';
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

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render notification bell icon', () => {
      const store = createTestStore();
      
      render(
        <NotificationBell />,
        { wrapper: ({ children }) => wrapper({ children, store }) }
      );

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
    });

    it('should show unread count badge', () => {
      const store = createTestStore({
        notifications: {
          unreadCount: 5,
        },
      });

      render(
        <NotificationBell />,
        { wrapper: ({ children }) => wrapper({ children, store }) }
      );

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should not show badge when no unread notifications', () => {
      const store = createTestStore({
        notifications: {
          unreadCount: 0,
        },
      });

      render(
        <NotificationBell />,
        { wrapper: ({ children }) => wrapper({ children, store }) }
      );

      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  describe('dropdown functionality', () => {
    it('should open dropdown when clicked', () => {
      const store = createTestStore();
      
      render(
        <NotificationBell />,
        { wrapper: ({ children }) => wrapper({ children, store }) }
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('Notificaciones')).toBeInTheDocument();
    });

    it('should close dropdown when clicked again', () => {
      const store = createTestStore();
      
      render(
        <NotificationBell />,
        { wrapper: ({ children }) => wrapper({ children, store }) }
      );

      const button = screen.getByRole('button');
      
      // Abrir dropdown
      fireEvent.click(button);
      expect(screen.getByText('Notificaciones')).toBeInTheDocument();
      
      // Cerrar dropdown
      fireEvent.click(button);
      expect(screen.queryByText('Notificaciones')).not.toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', () => {
      const store = createTestStore();
      
      render(
        <div>
          <NotificationBell />
          <div data-testid="outside">Outside</div>
        </div>,
        { wrapper: ({ children }) => wrapper({ children, store }) }
      );

      const button = screen.getByRole('button');
      const outside = screen.getByTestId('outside');
      
      // Abrir dropdown
      fireEvent.click(button);
      expect(screen.getByText('Notificaciones')).toBeInTheDocument();
      
      // Cerrar dropdown haciendo clic fuera
      fireEvent.click(outside);
      expect(screen.queryByText('Notificaciones')).not.toBeInTheDocument();
    });
  });

  describe('notifications list', () => {
    it('should display notifications when available', () => {
      const mockNotifications = [
        {
          id: '1',
          userId: 'user1',
          type: 'memory_added',
          title: 'Nueva Memoria',
          message: 'Se agregó una nueva memoria',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          userId: 'user1',
          type: 'comment_added',
          title: 'Nuevo Comentario',
          message: 'Alguien comentó en tu memoria',
          isRead: true,
          createdAt: new Date().toISOString(),
        },
      ];

      const store = createTestStore({
        notifications: {
          notifications: mockNotifications,
          unreadCount: 1,
        },
      });

      render(
        <NotificationBell />,
        { wrapper: ({ children }) => wrapper({ children, store }) }
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('Nueva Memoria')).toBeInTheDocument();
      expect(screen.getByText('Nuevo Comentario')).toBeInTheDocument();
    });

    it('should show empty state when no notifications', () => {
      const store = createTestStore({
        notifications: {
          notifications: [],
          unreadCount: 0,
        },
      });

      render(
        <NotificationBell />,
        { wrapper: ({ children }) => wrapper({ children, store }) }
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('No hay notificaciones')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      const store = createTestStore({
        notifications: {
          notifications: [],
          isLoading: true,
        },
      });

      render(
        <NotificationBell />,
        { wrapper: ({ children }) => wrapper({ children, store }) }
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('Cargando...')).toBeInTheDocument();
    });
  });

  describe('notification actions', () => {
    it('should mark notification as read when clicked', async () => {
      const mockNotifications = [
        {
          id: '1',
          userId: 'user1',
          type: 'memory_added',
          title: 'Nueva Memoria',
          message: 'Se agregó una nueva memoria',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ];

      const store = createTestStore({
        notifications: {
          notifications: mockNotifications,
          unreadCount: 1,
        },
      });

      render(
        <NotificationBell />,
        { wrapper: ({ children }) => wrapper({ children, store }) }
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const notification = screen.getByText('Nueva Memoria');
      fireEvent.click(notification);

      // Verificar que se disparó la acción de marcar como leída
      const state = store.getState();
      expect(state.notifications.isLoading).toBe(true);
    });

    it('should delete notification when delete button is clicked', async () => {
      const mockNotifications = [
        {
          id: '1',
          userId: 'user1',
          type: 'memory_added',
          title: 'Nueva Memoria',
          message: 'Se agregó una nueva memoria',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ];

      const store = createTestStore({
        notifications: {
          notifications: mockNotifications,
          unreadCount: 1,
        },
      });

      render(
        <NotificationBell />,
        { wrapper: ({ children }) => wrapper({ children, store }) }
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const deleteButton = screen.getByTestId('delete-notification-1');
      fireEvent.click(deleteButton);

      // Verificar que se disparó la acción de eliminar
      const state = store.getState();
      expect(state.notifications.isLoading).toBe(true);
    });

    it('should mark all notifications as read', async () => {
      const mockNotifications = [
        {
          id: '1',
          userId: 'user1',
          type: 'memory_added',
          title: 'Nueva Memoria',
          message: 'Se agregó una nueva memoria',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ];

      const store = createTestStore({
        notifications: {
          notifications: mockNotifications,
          unreadCount: 1,
        },
      });

      render(
        <NotificationBell />,
        { wrapper: ({ children }) => wrapper({ children, store }) }
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const markAllReadButton = screen.getByText('Marcar todas como leídas');
      fireEvent.click(markAllReadButton);

      // Verificar que se disparó la acción
      const state = store.getState();
      expect(state.notifications.isLoading).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should display error message', () => {
      const store = createTestStore({
        notifications: {
          notifications: [],
          error: 'Error al cargar notificaciones',
        },
      });

      render(
        <NotificationBell />,
        { wrapper: ({ children }) => wrapper({ children, store }) }
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('Error al cargar notificaciones')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const store = createTestStore();
      
      render(
        <NotificationBell />,
        { wrapper: ({ children }) => wrapper({ children, store }) }
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Notificaciones');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update aria-expanded when dropdown is open', () => {
      const store = createTestStore();
      
      render(
        <NotificationBell />,
        { wrapper: ({ children }) => wrapper({ children, store }) }
      );

      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });
});
