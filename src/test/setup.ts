import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock de IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock de ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock de matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock de Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: {
    permission: 'default',
    requestPermission: vi.fn().mockResolvedValue('granted'),
  },
});

// Mock de Service Worker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: vi.fn().mockResolvedValue({
      scope: '/',
      updateViaCache: 'all',
      installing: null,
      waiting: null,
      active: null,
    }),
    getRegistration: vi.fn().mockResolvedValue(null),
    ready: Promise.resolve({
      scope: '/',
      updateViaCache: 'all',
      installing: null,
      waiting: null,
      active: null,
      showNotification: vi.fn(),
    }),
  },
});

// Mock de localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock de sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock de fetch
global.fetch = vi.fn();

// Mock de console methods para tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: componentWillReceiveProps has been renamed')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Configuración global para tests
beforeEach(() => {
  // Limpiar todos los mocks antes de cada test
  vi.clearAllMocks();
  
  // Resetear localStorage y sessionStorage
  localStorageMock.getItem.mockReturnValue(null);
  sessionStorageMock.getItem.mockReturnValue(null);
  
  // Resetear fetch
  (global.fetch as any).mockReset();
});

// Configuración para manejar errores no capturados
const originalErrorHandler = window.addEventListener;
beforeAll(() => {
  window.addEventListener = vi.fn((event, handler) => {
    if (event === 'error') {
      // Prevenir que los errores de test se muestren en la consola
      return;
    }
    return originalErrorHandler.call(window, event, handler);
  });
});

// Configuración para manejar warnings de React
const originalWarnHandler = console.warn;
beforeAll(() => {
  console.warn = (...args) => {
    // Filtrar warnings específicos de React que no son relevantes para los tests
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: componentWillReceiveProps') ||
       args[0].includes('Warning: componentWillUpdate'))
    ) {
      return;
    }
    originalWarnHandler.apply(console, args);
  };
});
