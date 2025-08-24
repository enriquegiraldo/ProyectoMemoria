import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/usePWA';

interface OfflineIndicatorProps {
  className?: string;
  showOnlineStatus?: boolean;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  className = '',
  showOnlineStatus = false 
}) => {
  const isOnline = useOnlineStatus();

  // Solo mostrar cuando está offline o cuando se solicita mostrar el estado online
  if (isOnline && !showOnlineStatus) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto ${className}`}
      >
        <div className={`
          rounded-lg shadow-lg border p-3 flex items-center space-x-3
          ${isOnline 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
          }
        `}>
          {/* Icono */}
          <div className="flex-shrink-0">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-600" />
            )}
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {isOnline ? 'Conexión restaurada' : 'Sin conexión a internet'}
            </p>
            <p className="text-xs opacity-75">
              {isOnline 
                ? 'Ya puedes acceder a todas las funciones' 
                : 'Algunas funciones pueden no estar disponibles'
              }
            </p>
          </div>

          {/* Botón de recarga (solo cuando está offline) */}
          {!isOnline && (
            <button
              onClick={() => window.location.reload()}
              className="flex-shrink-0 p-1 rounded-md hover:bg-red-100 transition-colors duration-200"
              title="Recargar página"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OfflineIndicator;
