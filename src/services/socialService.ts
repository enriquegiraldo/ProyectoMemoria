export interface SocialShareData {
  title: string;
  description: string;
  url: string;
  image?: string;
  hashtags?: string[];
}

export interface SocialPlatform {
  name: string;
  icon: string;
  color: string;
  shareUrl: string;
  mobileShareUrl?: string;
}

export class SocialService {
  // Plataformas sociales soportadas
  private static platforms: Record<string, SocialPlatform> = {
    facebook: {
      name: 'Facebook',
      icon: '📘',
      color: '#1877F2',
      shareUrl: 'https://www.facebook.com/sharer/sharer.php?u={url}&quote={title}',
    },
    twitter: {
      name: 'Twitter',
      icon: '🐦',
      color: '#1DA1F2',
      shareUrl: 'https://twitter.com/intent/tweet?text={title}&url={url}&hashtags={hashtags}',
    },
    whatsapp: {
      name: 'WhatsApp',
      icon: '💬',
      color: '#25D366',
      shareUrl: 'https://wa.me/?text={title}%20{url}',
      mobileShareUrl: 'whatsapp://send?text={title}%20{url}',
    },
    telegram: {
      name: 'Telegram',
      icon: '📱',
      color: '#0088CC',
      shareUrl: 'https://t.me/share/url?url={url}&text={title}',
    },
    linkedin: {
      name: 'LinkedIn',
      icon: '💼',
      color: '#0077B5',
      shareUrl: 'https://www.linkedin.com/sharing/share-offsite/?url={url}',
    },
    pinterest: {
      name: 'Pinterest',
      icon: '📌',
      color: '#E60023',
      shareUrl: 'https://pinterest.com/pin/create/button/?url={url}&description={title}&media={image}',
    },
    email: {
      name: 'Email',
      icon: '📧',
      color: '#EA4335',
      shareUrl: 'mailto:?subject={title}&body={description}%20{url}',
    },
    copy: {
      name: 'Copiar Enlace',
      icon: '📋',
      color: '#6B7280',
      shareUrl: 'copy',
    },
  };

  // Generar URL de compartir para una plataforma
  static generateShareUrl(platform: string, data: SocialShareData): string {
    const platformConfig = this.platforms[platform];
    if (!platformConfig) {
      throw new Error(`Platform ${platform} not supported`);
    }

    if (platform === 'copy') {
      return 'copy';
    }

    let url = platformConfig.shareUrl;
    
    // Reemplazar placeholders
    url = url.replace('{url}', encodeURIComponent(data.url));
    url = url.replace('{title}', encodeURIComponent(data.title));
    url = url.replace('{description}', encodeURIComponent(data.description));
    
    if (data.image) {
      url = url.replace('{image}', encodeURIComponent(data.image));
    }
    
    if (data.hashtags && data.hashtags.length > 0) {
      const hashtagsString = data.hashtags.join(',');
      url = url.replace('{hashtags}', encodeURIComponent(hashtagsString));
    }

    return url;
  }

  // Compartir en plataforma específica
  static async shareOnPlatform(platform: string, data: SocialShareData): Promise<boolean> {
    try {
      if (platform === 'copy') {
        return await this.copyToClipboard(data.url);
      }

      const shareUrl = this.generateShareUrl(platform, data);
      
      // Detectar si es móvil para usar URLs específicas
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const platformConfig = this.platforms[platform];
      
      if (isMobile && platformConfig.mobileShareUrl) {
        window.location.href = platformConfig.mobileShareUrl
          .replace('{url}', encodeURIComponent(data.url))
          .replace('{title}', encodeURIComponent(data.title));
      } else {
        // Abrir en nueva ventana
        const windowFeatures = 'width=600,height=400,scrollbars=yes,resizable=yes';
        window.open(shareUrl, '_blank', windowFeatures);
      }

      return true;
    } catch (error) {
      console.error(`Error sharing on ${platform}:`, error);
      return false;
    }
  }

  // Compartir usando Web Share API (nativo)
  static async shareNatively(data: SocialShareData): Promise<boolean> {
    try {
      if (!navigator.share) {
        return false;
      }

      await navigator.share({
        title: data.title,
        text: data.description,
        url: data.url,
      });

      return true;
    } catch (error) {
      console.error('Error sharing natively:', error);
      return false;
    }
  }

  // Copiar al portapapeles
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback para navegadores antiguos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  }

  // Obtener todas las plataformas disponibles
  static getAvailablePlatforms(): SocialPlatform[] {
    return Object.values(this.platforms);
  }

  // Obtener plataforma específica
  static getPlatform(platform: string): SocialPlatform | null {
    return this.platforms[platform] || null;
  }

  // Generar datos de compartir para una memoria
  static generateMemoryShareData(memory: any, baseUrl: string): SocialShareData {
    const title = `Memoria: ${memory.title}`;
    const description = memory.description || 'Una memoria especial compartida en Memoria Eterna';
    const url = `${baseUrl}/memories/${memory.id}`;
    const image = memory.media_url || `${baseUrl}/images/default-memory.jpg`;
    const hashtags = ['MemoriaEterna', 'Memorias', 'Recuerdos'];

    return {
      title,
      description,
      url,
      image,
      hashtags,
    };
  }

  // Generar datos de compartir para una página conmemorativa
  static generatePageShareData(page: any, baseUrl: string): SocialShareData {
    const title = `Página Conmemorativa: ${page.title}`;
    const description = page.description || 'Una página conmemorativa en Memoria Eterna';
    const url = `${baseUrl}/pages/${page.slug}`;
    const image = page.cover_image || `${baseUrl}/images/default-page.jpg`;
    const hashtags = ['MemoriaEterna', 'Conmemoracion', 'Recuerdo'];

    return {
      title,
      description,
      url,
      image,
      hashtags,
    };
  }

  // Generar QR code para compartir
  static generateQRCodeUrl(url: string, size: number = 200): string {
    const qrApiUrl = 'https://api.qrserver.com/v1/create-qr-code/';
    return `${qrApiUrl}?size=${size}x${size}&data=${encodeURIComponent(url)}`;
  }

  // Compartir en múltiples plataformas
  static async shareOnMultiplePlatforms(
    platforms: string[], 
    data: SocialShareData
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const platform of platforms) {
      results[platform] = await this.shareOnPlatform(platform, data);
    }
    
    return results;
  }

  // Verificar si la plataforma es compatible
  static isPlatformSupported(platform: string): boolean {
    return platform in this.platforms;
  }

  // Obtener plataformas recomendadas según el contenido
  static getRecommendedPlatforms(contentType: 'memory' | 'page' | 'general'): string[] {
    switch (contentType) {
      case 'memory':
        return ['facebook', 'whatsapp', 'twitter', 'copy'];
      case 'page':
        return ['facebook', 'whatsapp', 'email', 'copy'];
      case 'general':
      default:
        return ['facebook', 'twitter', 'whatsapp', 'copy'];
    }
  }
}
