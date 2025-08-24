import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Image, ImageOff } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  fallback?: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = '/placeholder-image.jpg',
  fallback = '/fallback-image.jpg',
  width,
  height,
  quality = 80,
  priority = false,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(priority ? src : placeholder);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection observer para lazy loading
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    rootMargin: '50px 0px',
  });

  // Combinar refs
  const combinedRef = (node: HTMLImageElement | null) => {
    imgRef.current = node;
    inViewRef(node);
  };

  // Cargar imagen cuando esté en vista
  useEffect(() => {
    if (inView && !priority) {
      setCurrentSrc(src);
    }
  }, [inView, src, priority]);

  // Manejar carga exitosa
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Manejar error de carga
  const handleError = () => {
    if (currentSrc === src && fallback) {
      setCurrentSrc(fallback);
      setHasError(false);
    } else {
      setHasError(true);
      onError?.();
    }
  };

  // Optimizar URL de imagen si es de Cloudinary
  const getOptimizedSrc = (imageSrc: string) => {
    if (imageSrc.includes('cloudinary.com')) {
      const baseUrl = imageSrc.split('/upload/')[0];
      const imagePath = imageSrc.split('/upload/')[1];
      
      let transformations = 'f_auto,q_auto';
      if (width) transformations += `,w_${width}`;
      if (height) transformations += `,h_${height}`;
      if (quality) transformations += `,q_${quality}`;
      
      return `${baseUrl}/upload/${transformations}/${imagePath}`;
    }
    return imageSrc;
  };

  const optimizedSrc = getOptimizedSrc(currentSrc);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        {/* Placeholder mientras carga */}
        {!isLoaded && !hasError && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gray-200 flex items-center justify-center"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-xs text-gray-500">Cargando...</span>
            </div>
          </motion.div>
        )}

        {/* Error state */}
        {hasError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gray-100 flex items-center justify-center"
          >
            <div className="flex flex-col items-center space-y-2 text-gray-400">
              <ImageOff className="w-8 h-8" />
              <span className="text-xs">Error al cargar imagen</span>
            </div>
          </motion.div>
        )}

        {/* Imagen real */}
        {!hasError && (
          <motion.img
            ref={combinedRef}
            src={optimizedSrc}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ 
              opacity: isLoaded ? 1 : 0,
              scale: isLoaded ? 1 : 1.05
            }}
            transition={{ 
              duration: 0.5,
              ease: 'easeOut'
            }}
            className="w-full h-full object-cover"
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
          />
        )}
      </AnimatePresence>

      {/* Overlay para información adicional */}
      {isLoaded && !hasError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-300"
        />
      )}
    </div>
  );
};

// Componente específico para imágenes de memorias
export const MemoryImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}> = ({ src, alt, className = '', priority = false }) => (
  <LazyImage
    src={src}
    alt={alt}
    className={`aspect-video ${className}`}
    width={800}
    height={450}
    quality={85}
    priority={priority}
  />
);

// Componente para avatares
export const AvatarImage: React.FC<{
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ src, alt, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const dimensions = {
    sm: 32,
    md: 48,
    lg: 64
  };

  return (
    <LazyImage
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} rounded-full ${className}`}
      width={dimensions[size]}
      height={dimensions[size]}
      quality={90}
      priority={true}
    />
  );
};

// Componente para imágenes de galería
export const GalleryImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}> = ({ src, alt, className = '', onClick }) => (
  <div 
    className={`cursor-pointer group ${className}`}
    onClick={onClick}
  >
    <LazyImage
      src={src}
      alt={alt}
      className="aspect-square group-hover:scale-105 transition-transform duration-300"
      width={400}
      height={400}
      quality={80}
    />
  </div>
);

export default LazyImage;
