import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  type?: 'card' | 'text' | 'avatar' | 'button' | 'image' | 'list';
  className?: string;
  count?: number;
  height?: string;
  width?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'card',
  className = '',
  count = 1,
  height,
  width
}) => {
  const baseClasses = 'bg-gray-200 animate-pulse rounded';
  
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={`${baseClasses} p-4 space-y-3 ${className}`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-32 bg-gray-300 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-6 bg-gray-300 rounded-full w-16"></div>
              <div className="h-6 bg-gray-300 rounded-full w-20"></div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className={`${baseClasses} space-y-2 ${className}`}>
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            <div className="h-4 bg-gray-300 rounded w-4/6"></div>
          </div>
        );

      case 'avatar':
        return (
          <div className={`${baseClasses} w-10 h-10 rounded-full ${className}`}></div>
        );

      case 'button':
        return (
          <div className={`${baseClasses} h-10 rounded ${className}`}></div>
        );

      case 'image':
        return (
          <div className={`${baseClasses} ${height || 'h-48'} ${width || 'w-full'} ${className}`}></div>
        );

      case 'list':
        return (
          <div className={`${baseClasses} space-y-3 ${className}`}>
            {Array.from({ length: count }).map((_, index) => (
              <div key={index} className="flex items-center space-x-3 p-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className={`${baseClasses} ${height || 'h-4'} ${width || 'w-full'} ${className}`}></div>
        );
    }
  };

  if (count === 1) {
    return renderSkeleton();
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          {renderSkeleton()}
        </motion.div>
      ))}
    </div>
  );
};

// Componentes específicos para diferentes tipos de contenido
export const MemoryCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
    <div className="h-48 bg-gray-200 animate-pulse"></div>
    <div className="p-4 space-y-3">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-5 bg-gray-300 rounded"></div>
        <div className="h-4 bg-gray-300 rounded w-5/6"></div>
      </div>
      <div className="flex space-x-2">
        <div className="h-6 bg-gray-300 rounded-full w-16"></div>
        <div className="h-6 bg-gray-300 rounded-full w-20"></div>
      </div>
    </div>
  </div>
);

export const CommentSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex space-x-3 ${className}`}>
    <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
    <div className="flex-1 space-y-2">
      <div className="flex items-center space-x-2">
        <div className="h-4 bg-gray-300 rounded w-24"></div>
        <div className="h-3 bg-gray-300 rounded w-16"></div>
      </div>
      <div className="h-4 bg-gray-300 rounded w-full"></div>
    </div>
  </div>
);

export const UserProfileSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    <div className="flex items-center space-x-4">
      <div className="w-16 h-16 bg-gray-300 rounded-full animate-pulse"></div>
      <div className="flex-1 space-y-2">
        <div className="h-6 bg-gray-300 rounded w-32"></div>
        <div className="h-4 bg-gray-300 rounded w-24"></div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-300 rounded"></div>
      <div className="h-4 bg-gray-300 rounded w-5/6"></div>
    </div>
  </div>
);

export const NotificationSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center space-x-3 p-3 ${className}`}>
    <div className="w-10 h-10 bg-gray-300 rounded-full animate-pulse"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
    </div>
    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
  </div>
);

export default SkeletonLoader;
