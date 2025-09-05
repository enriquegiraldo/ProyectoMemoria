import { supabase } from '../lib/supabase';
import { MediaType, UploadResponse, ValidationResult } from '../types';

// Configuración de Cloudinary
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Configuración de límites
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const ALLOWED_AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];

export interface MediaUploadOptions {
  folder?: string;
  transformation?: string;
  public_id?: string;
  tags?: string[];
}

export class MediaService {
  // Validar tipo de archivo
  static validateFileType(file: File): ValidationResult {
    const fileType = file.type.toLowerCase();

    if (ALLOWED_IMAGE_TYPES.includes(fileType)) {
      return { isValid: true, errors: [], mediaType: 'IMAGE' as MediaType };
    }

    if (ALLOWED_VIDEO_TYPES.includes(fileType)) {
      return { isValid: true, errors: [], mediaType: 'VIDEO' as MediaType };
    }

    if (ALLOWED_AUDIO_TYPES.includes(fileType)) {
      return { isValid: true, errors: [], mediaType: 'AUDIO' as MediaType };
    }

    return {
      isValid: false,
      errors: [`Tipo de archivo no soportado. Tipos permitidos: ${[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_AUDIO_TYPES].join(', ')}`]
    };
  }

  // Validar tamaño de archivo
  static validateFileSize(file: File): ValidationResult {
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        errors: [`El archivo es demasiado grande. Tamaño máximo: ${MAX_FILE_SIZE / (1024 * 1024)}MB`]
      };
    }

    return { isValid: true, errors: [] };
  }

  // Validar archivo completo
  static validateFile(file: File): ValidationResult {
    // Validar tamaño
    const sizeValidation = this.validateFileSize(file);
    if (!sizeValidation.isValid) {
      return sizeValidation;
    }

    // Validar tipo
    const typeValidation = this.validateFileType(file);
    if (!typeValidation.isValid) {
      return typeValidation;
    }

    return typeValidation;
  }

  // Subir archivo a Cloudinary
  static async uploadToCloudinary(
    file: File,
    options: MediaUploadOptions = {}
  ): Promise<UploadResponse> {
    try {
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors?.[0] || 'Error de validación'
        };
      }

      if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        return {
          success: false,
          error: 'Configuración de Cloudinary no encontrada'
        };
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

      if (options.folder) {
        formData.append('folder', options.folder);
      }

      if (options.transformation) {
        formData.append('transformation', options.transformation);
      }

      if (options.public_id) {
        formData.append('public_id', options.public_id);
      }

      if (options.tags) {
        formData.append('tags', options.tags.join(','));
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Error en la subida: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        url: data.secure_url,
        publicId: data.public_id,
        mediaType: validation.mediaType || 'IMAGE',
        metadata: {
          width: data.width,
          height: data.height,
          duration: data.duration,
          format: data.format,
          size: data.bytes,
        }
      };
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error inesperado en la subida'
      };
    }
  }

  // Subir archivo a Supabase Storage
  static async uploadToSupabase(
    file: File,
    bucket: string = 'memories',
    path?: string
  ): Promise<UploadResponse> {
    try {
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors?.[0] || 'Error de validación'
        };
      }

      const fileName = path || `${Date.now()}-${file.name}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return {
        success: true,
        url: urlData.publicUrl,
        publicId: fileName,
        mediaType: validation.mediaType || 'IMAGE',
        metadata: {
          size: file.size,
          lastModified: file.lastModified,
        }
      };
    } catch (error) {
      console.error('Error uploading to Supabase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error inesperado en la subida'
      };
    }
  }

  // Eliminar archivo de Cloudinary
  static async deleteFromCloudinary(publicId: string): Promise<boolean> {
    try {
      if (!CLOUDINARY_CLOUD_NAME) {
        throw new Error('Configuración de Cloudinary no encontrada');
      }

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/delete_by_token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: publicId, // En producción, necesitarías generar un token de eliminación
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      return false;
    }
  }

  // Eliminar archivo de Supabase Storage
  static async deleteFromSupabase(
    fileName: string,
    bucket: string = 'memories'
  ): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName]);

      return !error;
    } catch (error) {
      console.error('Error deleting from Supabase:', error);
      return false;
    }
  }

  // Optimizar imagen para diferentes tamaños
  static getOptimizedImageUrl(url: string, width: number, height?: number): string {
    if (!url.includes('cloudinary.com')) {
      return url;
    }

    const transformation = `w_${width}${height ? `,h_${height}` : ''},c_fill,q_auto,f_auto`;
    return url.replace('/upload/', `/upload/${transformation}/`);
  }

  // Generar thumbnail para videos
  static getVideoThumbnailUrl(url: string, time: string = '00:00:01'): string {
    if (!url.includes('cloudinary.com')) {
      return url;
    }

    const transformation = `w_300,h_200,c_fill,so_${time.replace(/:/g, '')}`;
    return url.replace('/upload/', `/upload/${transformation}/`);
  }

  // Comprimir imagen antes de subir
  static async compressImage(file: File, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo aspect ratio
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Error al comprimir la imagen'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Obtener información del archivo
  static async getFileInfo(file: File): Promise<{
    width?: number;
    height?: number;
    duration?: number;
    size: number;
    type: string;
  }> {
    return new Promise((resolve) => {
      const info = {
        size: file.size,
        type: file.type,
      };

      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          resolve({
            ...info,
            width: img.width,
            height: img.height,
          });
        };
        img.onerror = () => resolve(info);
        img.src = URL.createObjectURL(file);
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.onloadedmetadata = () => {
          resolve({
            ...info,
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration,
          });
        };
        video.onerror = () => resolve(info);
        video.src = URL.createObjectURL(file);
      } else {
        resolve(info);
      }
    });
  }

  // Validar URL de imagen
  static async validateImageUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      return contentType?.startsWith('image/') || false;
    } catch {
      return false;
    }
  }

  // Generar nombre único para archivo
  static generateUniqueFileName(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${userId}-${timestamp}-${random}.${extension}`;
  }
}
