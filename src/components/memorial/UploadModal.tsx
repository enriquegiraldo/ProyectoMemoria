import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image, Video, Music, FileText, Tag, User } from 'lucide-react';
import { MediaService } from '../../services/mediaService';
import { MemoriesService } from '../../services/memoriesService';
import { useAuth } from '../../hooks/useAuth';
import { useMemories } from '../../hooks/useMemories';
import { MediaType, CreateMemoryData } from '../../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
}

interface UploadFormData {
  title: string;
  description: string;
  tags: string[];
  mediaFile: File | null;
  mediaType: MediaType | null;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, pageId }) => {
  const { user } = useAuth();
  const { createNewMemory } = useMemories();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    description: '',
    tags: [],
    mediaFile: null,
    mediaType: null,
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentTag, setCurrentTag] = useState('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar archivo
    const validation = MediaService.validateFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Archivo no válido');
      return;
    }

    setFormData(prev => ({
      ...prev,
      mediaFile: file,
      mediaType: validation.mediaType!,
    }));
    setError(null);
  };

  const handleTagAdd = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !formData.mediaFile || !formData.title.trim()) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Simular progreso de subida
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Subir archivo a Cloudinary
      const uploadResult = await MediaService.uploadToCloudinary(formData.mediaFile, {
        folder: `memories/${pageId}`,
        tags: formData.tags,
      });

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Error al subir el archivo');
      }

      // Crear memoria en la base de datos
      const memoryData: CreateMemoryData = {
        title: formData.title,
        description: formData.description,
        mediaUrl: uploadResult.url,
        mediaType: uploadResult.mediaType,
        authorId: user.id,
        pageId: pageId,
        tags: formData.tags,
      };

      const memoryResult = await MemoriesService.createMemory(memoryData);

      if (!memoryResult.success) {
        throw new Error(memoryResult.error || 'Error al crear la memoria');
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Actualizar el estado global
      await createNewMemory(memoryData);

      // Limpiar formulario y cerrar modal
      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          tags: [],
          mediaFile: null,
          mediaType: null,
        });
        setUploadProgress(0);
        setIsUploading(false);
        onClose();
      }, 500);

    } catch (error) {
      clearInterval(progressInterval);
      setError(error instanceof Error ? error.message : 'Error inesperado');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getMediaIcon = () => {
    switch (formData.mediaType) {
      case 'IMAGE':
        return <Image className="w-6 h-6" />;
      case 'VIDEO':
        return <Video className="w-6 h-6" />;
      case 'AUDIO':
        return <Music className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Compartir un Recuerdo
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isUploading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivo Multimedia *
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    formData.mediaFile
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading}
                  />
                  
                  {formData.mediaFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center">
                        {getMediaIcon()}
                      </div>
                      <p className="text-sm text-gray-600">
                        {formData.mediaFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(formData.mediaFile.size)}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Haz clic para seleccionar un archivo
                      </p>
                      <p className="text-xs text-gray-500">
                        Imágenes, videos y audio soportados
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Título del recuerdo"
                  disabled={isUploading}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Cuenta la historia detrás de este recuerdo..."
                  rows={3}
                  disabled={isUploading}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Etiquetas
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Agregar etiqueta"
                      disabled={isUploading}
                    />
                    <button
                      type="button"
                      onClick={handleTagAdd}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                      disabled={isUploading || !currentTag.trim()}
                    >
                      <Tag className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleTagRemove(tag)}
                            className="text-blue-600 hover:text-blue-800"
                            disabled={isUploading}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subiendo archivo...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                  disabled={isUploading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={isUploading || !formData.mediaFile || !formData.title.trim()}
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Compartir
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadModal;