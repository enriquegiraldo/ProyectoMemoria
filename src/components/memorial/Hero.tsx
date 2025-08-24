import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, ChevronDown, Share2, QrCode, Heart } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface HeroProps {
  pageData?: {
    title: string;
    subtitle: string;
    backgroundImage?: string;
    backgroundVideo?: string;
    personName: string;
    birthDate?: string;
    passingDate?: string;
  };
  onShare?: () => void;
  onGenerateQR?: () => void;
}

const Hero: React.FC<HeroProps> = ({
  pageData = {
    title: 'Memoria Eterna',
    subtitle: 'Preservando recuerdos, conectando generaciones',
    personName: 'Ser Querido',
  },
  onShare,
  onGenerateQR,
}) => {
  const { isAuthenticated } = useAuth();
  const [candleLit, setCandleLit] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState('');

  // Simular generación de QR
  useEffect(() => {
    if (showQR) {
      // En una implementación real, aquí se generaría el QR
      setQrCode('https://memoria-eterna.com/page/example');
    }
  }, [showQR]);

  const handleCandleClick = () => {
    setCandleLit(!candleLit);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: pageData.title,
        text: pageData.subtitle,
        url: window.location.href,
      });
    } else {
      onShare?.();
    }
  };

  const handleGenerateQR = () => {
    setShowQR(true);
    onGenerateQR?.();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {pageData.backgroundVideo ? (
          <video
            autoPlay
            muted
            loop
            className="w-full h-full object-cover"
          >
            <source src={pageData.backgroundVideo} type="video/mp4" />
          </video>
        ) : pageData.backgroundImage ? (
          <img
            src={pageData.backgroundImage}
            alt="Background"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Vela Virtual */}
      <motion.div
        className="absolute top-8 right-8 z-20"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <button
          onClick={handleCandleClick}
          className="relative group"
        >
          <div className="relative">
            {/* Vela */}
            <div className="w-4 h-16 bg-gradient-to-b from-yellow-100 to-yellow-300 rounded-full mx-auto shadow-lg" />
            
            {/* Llama */}
            <AnimatePresence>
              {candleLit && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -top-2 left-1/2 transform -translate-x-1/2"
                >
                  <Flame className="w-6 h-6 text-orange-500 drop-shadow-lg" />
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                    className="absolute inset-0"
                  >
                    <Flame className="w-6 h-6 text-yellow-400" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Tooltip */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {candleLit ? 'Apagar vela' : 'Encender vela'}
          </div>
        </button>
      </motion.div>

      {/* Contenido Principal */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 font-serif">
            {pageData.personName}
          </h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-xl md:text-2xl mb-8 text-gray-200 font-light"
          >
            {pageData.subtitle}
          </motion.p>

          {/* Fechas */}
          {(pageData.birthDate || pageData.passingDate) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mb-8"
            >
              <div className="flex justify-center items-center space-x-8 text-lg">
                {pageData.birthDate && (
                  <div>
                    <span className="text-gray-300">Nacimiento:</span>
                    <span className="ml-2 font-medium">
                      {new Date(pageData.birthDate).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                )}
                {pageData.passingDate && (
                  <div>
                    <span className="text-gray-300">Partida:</span>
                    <span className="ml-2 font-medium">
                      {new Date(pageData.passingDate).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Botones de Acción */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors px-6 py-3 rounded-full border border-white/30"
            >
              <Share2 className="w-5 h-5" />
              <span>Compartir</span>
            </button>
            
            <button
              onClick={handleGenerateQR}
              className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors px-6 py-3 rounded-full border border-white/30"
            >
              <QrCode className="w-5 h-5" />
              <span>Código QR</span>
            </button>
            
            {!isAuthenticated && (
              <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 transition-colors px-6 py-3 rounded-full">
                <Heart className="w-5 h-5" />
                <span>Agregar Recuerdo</span>
              </button>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-white/80"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </motion.div>

      {/* Modal QR */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowQR(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 text-center">Código QR</h3>
              <div className="bg-gray-100 p-4 rounded-lg mb-4 flex justify-center">
                {/* Aquí iría el QR generado */}
                <div className="w-32 h-32 bg-gray-300 rounded flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-gray-500" />
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center mb-4">
                Escanea este código para acceder a esta página desde cualquier dispositivo
              </p>
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => setShowQR(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    // Descargar QR
                    console.log('Descargar QR');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  Descargar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Hero;
