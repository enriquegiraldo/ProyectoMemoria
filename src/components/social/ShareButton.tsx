import React, { useState } from 'react';
import Button  from '../ui/Button';
import { SocialService, type SocialShareData } from '../../services/socialService';
import { 
  Share2, 
  Facebook, 
  Twitter, 
  MessageCircle, 
  Mail, 
  Copy,
  Check,
  X
} from 'lucide-react';

interface ShareButtonProps {
  data: SocialShareData;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ShareButton({ 
  data, 
  className = '', 
  variant = 'outline',
  size = 'sm',
  showLabel = false 
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async (platform: string) => {
    try {
      setIsSharing(true);
      const success = await SocialService.shareOnPlatform(platform, data);
      
      if (success && platform === 'copy') {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      
      if (success) {
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleNativeShare = async () => {
    try {
      setIsSharing(true);
      const success = await SocialService.shareNatively(data);
      if (success) {
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error sharing natively:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <Facebook className="h-4 w-4" />;
      case 'twitter':
        return <Twitter className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'copy':
        return copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />;
      default:
        return <Share2 className="h-4 w-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    const platformConfig = SocialService.getPlatform(platform);
    return platformConfig?.color || '#6B7280';
  };

  const getPlatformName = (platform: string) => {
    const platformConfig = SocialService.getPlatform(platform);
    return platformConfig?.name || platform;
  };

  const recommendedPlatforms = SocialService.getRecommendedPlatforms('general');

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant={variant}
        size={size}
        className={className}
        disabled={isSharing}
      >
        <Share2 className="h-4 w-4 mr-2" />
        {showLabel && 'Compartir'}
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Compartir</h3>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Native Share (si está disponible) */}
          {navigator.share && (
            <div className="p-2">
              <Button
                onClick={handleNativeShare}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                disabled={isSharing}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartir nativo
              </Button>
            </div>
          )}

          {/* Platforms */}
          <div className="p-3">
            <div className="grid grid-cols-2 gap-2">
              {recommendedPlatforms.map((platform) => (
                <Button
                  key={platform}
                  onClick={() => handleShare(platform)}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  disabled={isSharing}
                  style={{
                    borderColor: getPlatformColor(platform),
                    color: getPlatformColor(platform),
                  }}
                >
                  {getPlatformIcon(platform)}
                  <span className="ml-2 text-xs">
                    {copied && platform === 'copy' ? '¡Copiado!' : getPlatformName(platform)}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* All Platforms */}
          <div className="p-3 border-t border-gray-200">
            <details className="group">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                Ver todas las opciones
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {SocialService.getAvailablePlatforms()
                  .filter(platform => !recommendedPlatforms.includes(platform.name.toLowerCase()))
                  .map((platform) => (
                    <Button
                      key={platform.name}
                      onClick={() => handleShare(platform.name.toLowerCase())}
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs"
                      disabled={isSharing}
                      style={{ color: platform.color }}
                    >
                      <span className="mr-2">{platform.icon}</span>
                      {platform.name}
                    </Button>
                  ))}
              </div>
            </details>
          </div>
        </div>
      )}

      {/* Overlay para cerrar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
