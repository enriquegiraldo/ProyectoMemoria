import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePWA, useOnlineStatus, useStandaloneStatus } from '../../hooks/usePWA';

// Mock de las APIs del navegador
const mockBeforeInstallPrompt = {
  prompt: vi.fn(),
  userChoice: Promise.resolve({ outcome: 'accepted' }),
};

const mockServiceWorker = {
  register: vi.fn(),
  ready: Promise.resolve({ update: vi.fn() }),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockNotification = {
  requestPermission: vi.fn(),
  permission: 'granted',
};

describe('usePWA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock de window
    Object.defineProperty(window, 'navigator', {
      value: {
        serviceWorker: mockServiceWorker,
        onLine: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      writable: true,
    });

    Object.defineProperty(window, 'Notification', {
      value: mockNotification,
      writable: true,
    });

    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://example.com',
        protocol: 'https:',
        hostname: 'example.com',
      },
      writable: true,
    });

    // Mock de matchMedia
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
      writable: true,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initial state', () => {
    it('should return initial PWA state', () => {
      const { result } = renderHook(() => usePWA());

      expect(result.current.isInstalled).toBe(false);
      expect(result.current.isOnline).toBe(true);
      expect(result.current.isStandalone).toBe(false);
      expect(result.current.canInstall).toBe(false);
      expect(result.current.deferredPrompt).toBeNull();
    });
  });

  describe('install function', () => {
    it('should install PWA when prompt is available', async () => {
      const { result } = renderHook(() => usePWA());

      // Simular que hay un prompt disponible
      act(() => {
        result.current.deferredPrompt = mockBeforeInstallPrompt;
      });

      await act(async () => {
        const success = await result.current.install();
        expect(success).toBe(true);
      });

      expect(mockBeforeInstallPrompt.prompt).toHaveBeenCalled();
    });

    it('should return false when no prompt is available', async () => {
      const { result } = renderHook(() => usePWA());

      await act(async () => {
        const success = await result.current.install();
        expect(success).toBe(false);
      });

      expect(mockBeforeInstallPrompt.prompt).not.toHaveBeenCalled();
    });
  });

  describe('checkForUpdate function', () => {
    it('should check for updates', async () => {
      const { result } = renderHook(() => usePWA());

      await act(async () => {
        await result.current.checkForUpdate();
      });

      expect(mockServiceWorker.ready).toBeDefined();
    });
  });

  describe('showNotification function', () => {
    it('should show notification when permission is granted', async () => {
      const { result } = renderHook(() => usePWA());

      await act(async () => {
        await result.current.showNotification('Test Title', {
          body: 'Test Body',
        });
      });

      // Verificar que se intentó mostrar la notificación
      expect(mockNotification.permission).toBe('granted');
    });

    it('should request permission when not granted', async () => {
      Object.defineProperty(window, 'Notification', {
        value: {
          ...mockNotification,
          permission: 'default',
        },
        writable: true,
      });

      const { result } = renderHook(() => usePWA());

      await act(async () => {
        await result.current.showNotification('Test Title');
      });

      expect(mockNotification.requestPermission).toHaveBeenCalled();
    });
  });

  describe('online status', () => {
    it('should track online status changes', () => {
      const { result } = renderHook(() => useOnlineStatus());

      expect(result.current).toBe(true);

      // Simular cambio a offline
      act(() => {
        Object.defineProperty(window.navigator, 'onLine', {
          value: false,
          writable: true,
        });
        // Disparar evento online/offline
        window.dispatchEvent(new Event('offline'));
      });

      expect(result.current).toBe(false);
    });
  });

  describe('standalone status', () => {
    it('should detect standalone mode', () => {
      // Mock de matchMedia para standalone
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn((query) => ({
          matches: query === '(display-mode: standalone)',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
        writable: true,
      });

      const { result } = renderHook(() => useStandaloneStatus());

      expect(result.current).toBe(true);
    });

    it('should detect non-standalone mode', () => {
      // Mock de matchMedia para no standalone
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn((query) => ({
          matches: false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
        writable: true,
      });

      const { result } = renderHook(() => useStandaloneStatus());

      expect(result.current).toBe(false);
    });
  });

  describe('event listeners', () => {
    it('should add and remove event listeners', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => usePWA());

      expect(addEventListenerSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });

  describe('beforeinstallprompt event', () => {
    it('should handle beforeinstallprompt event', () => {
      const { result } = renderHook(() => usePWA());

      // Simular el evento beforeinstallprompt
      act(() => {
        const event = new Event('beforeinstallprompt');
        Object.defineProperty(event, 'prompt', {
          value: mockBeforeInstallPrompt.prompt,
          writable: true,
        });
        Object.defineProperty(event, 'userChoice', {
          value: mockBeforeInstallPrompt.userChoice,
          writable: true,
        });
        window.dispatchEvent(event);
      });

      expect(result.current.canInstall).toBe(true);
      expect(result.current.deferredPrompt).toBeDefined();
    });
  });

  describe('appinstalled event', () => {
    it('should handle appinstalled event', () => {
      const { result } = renderHook(() => usePWA());

      // Simular el evento appinstalled
      act(() => {
        window.dispatchEvent(new Event('appinstalled'));
      });

      expect(result.current.isInstalled).toBe(true);
      expect(result.current.canInstall).toBe(false);
      expect(result.current.deferredPrompt).toBeNull();
    });
  });
});
