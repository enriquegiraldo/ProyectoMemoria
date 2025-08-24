import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from './Button';

// Tipos para el tema
type Theme = 'light' | 'dark' | 'system';

// Hook para manejar el tema
function useTheme() {
  const [theme, setTheme] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Obtener tema del localStorage o usar 'system' por defecto
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  // Escuchar cambios en las preferencias del sistema
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return { theme, setTheme, mounted };
}

// Componente principal
export function DarkModeToggle() {
  const { theme, setTheme, mounted } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  // No renderizar hasta que el componente esté montado para evitar hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-10 h-10 p-0"
        disabled
      >
        <div className="w-5 h-5 bg-gray-300 rounded animate-pulse" />
      </Button>
    );
  }

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (theme === 'light') {
      return <Sun className="w-5 h-5" />;
    } else if (theme === 'dark') {
      return <Moon className="w-5 h-5" />;
    } else {
      // Tema del sistema
      return isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />;
    }
  };

  const getTooltip = () => {
    if (theme === 'light') {
      return 'Cambiar a modo oscuro';
    } else if (theme === 'dark') {
      return 'Cambiar a tema del sistema';
    } else {
      return 'Cambiar a modo claro';
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`w-10 h-10 p-0 transition-all duration-200 ${
        isHovered ? 'scale-110' : 'scale-100'
      }`}
      onClick={toggleTheme}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={getTooltip()}
      aria-label={getTooltip()}
    >
      <div className="relative">
        {getIcon()}
        {theme === 'system' && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
        )}
      </div>
    </Button>
  );
}

// Componente de selector de tema más avanzado
export function ThemeSelector() {
  const { theme, setTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  const themes: Array<{ value: Theme; label: string; icon: React.ReactNode }> = [
    {
      value: 'light',
      label: 'Claro',
      icon: <Sun className="w-4 h-4" />,
    },
    {
      value: 'dark',
      label: 'Oscuro',
      icon: <Moon className="w-4 h-4" />,
    },
    {
      value: 'system',
      label: 'Sistema',
      icon: <div className="w-4 h-4 flex items-center justify-center">⚙️</div>,
    },
  ];

  return (
    <div className="flex items-center space-x-2">
      {themes.map(({ value, label, icon }) => (
        <Button
          key={value}
          variant={theme === value ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTheme(value)}
          className="flex items-center space-x-2"
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
}

// Hook para usar el tema en otros componentes
export function useDarkMode() {
  const { theme, setTheme, mounted } = useTheme();
  
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  return {
    theme,
    setTheme,
    isDark,
    mounted,
  };
}
