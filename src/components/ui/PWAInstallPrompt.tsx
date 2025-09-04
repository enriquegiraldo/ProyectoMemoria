"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Monitor } from 'lucide-react';

interface PWAInstallPromptProps {
  className?: string;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Verificar si la app ya está instalada
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Mostrar el prompt después de un delay
      setTimeout(() => {
        if (!checkIfInstalled()) {
          setShowInstallPrompt(true);
        }
      }, 3000);
    };

    // Escuchar el evento appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      
      // Mostrar mensaje de éxito
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification('¡App instalada!', {
            body: 'Memoria Eterna ha sido instalada exitosamente',
            icon: '/pwa-192x192.svg',
            badge: '/pwa-192x192.svg'
          });
        });
      }
    };

    // Verificar si ya está instalada al cargar
    checkIfInstalled();

    // Agregar event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setIsLoading(true);
    
    try {
      // Mostrar el prompt de instalación
      await deferredPrompt.prompt();
      
      // Esperar la respuesta del usuario
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('Usuario aceptó instalar la app');
        setIsInstalled(true);
        setShowInstallPrompt(false);
      } else {
        console.log('Usuario rechazó instalar la app');
        // Ocultar el prompt por un tiempo
        setShowInstallPrompt(false);
        setTimeout(() => {
          if (deferredPrompt) {
            setShowInstallPrompt(true);
          }
        }, 60000); // Mostrar de nuevo en 1 minuto
      }
    } catch (error) {
      console.error('Error durante la instalación:', error);
    } finally {
      setIsLoading(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Ocultar por más tiempo si el usuario lo descarta
    setTimeout(() => {
      if (deferredPrompt) {
        setShowInstallPrompt(true);
      }
    }, 300000); // 5 minutos
  };

  // No mostrar si ya está instalada o no hay prompt disponible
  if (isInstalled || !showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto ${className}`}
      >
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="flex items-start space-x-3">
            {/* Icono */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Instalar Memoria Eterna
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Instala nuestra app para acceder más rápido y disfrutar de una mejor experiencia
              </p>

              {/* Botones */}
              <div className="flex space-x-2">
                <button
                  onClick={handleInstallClick}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium py-2 px-3 rounded-md transition-colors duration-200 flex items-center justify-center space-x-1"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      <span>Instalando...</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-3 h-3" />
                      <span>Instalar</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDismiss}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Indicadores de plataforma */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Smartphone className="w-3 h-3" />
                <span>Móvil</span>
              </div>
              <div className="flex items-center space-x-1">
                <Monitor className="w-3 h-3" />
                <span>Desktop</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
