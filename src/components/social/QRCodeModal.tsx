import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { SocialService } from '../../services/socialService';
import { 
  QrCode, 
  Download, 
  X, 
  Share2,
  Smartphone,
  Monitor
} from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  description?: string;
}

export function QRCodeModal({ 
  isOpen, 
  onClose, 
  url, 
  title = 'Compartir',
  description = 'Escanea el código QR para acceder'
}: QRCodeModalProps) {
  const [qrUrl, setQrUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState('');

  useEffect(() => {
    if (isOpen && url) {
      setIsLoading(true);
      const qrCodeUrl = SocialService.generateQRCodeUrl(url, 300);
      setQrUrl(qrCodeUrl);
      
      // Crear URL para descarga
      fetch(qrCodeUrl)
        .then(response => response.blob())
        .then(blob => {
          const downloadUrl = URL.createObjectURL(blob);
          setDownloadUrl(downloadUrl);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error loading QR code:', error);
          setIsLoading(false);
        });
    }
  }, [isOpen, url]);

  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `qr-code-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } else {
        // Fallback: copiar URL
        await navigator.clipboard.writeText(url);
        alert('URL copiada al portapapeles');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <QrCode className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <img 
                    src={qrUrl} 
                    alt="QR Code" 
                    className="w-48 h-48"
                  />
                </div>
              </div>

              {/* URL */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">URL:</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-700 break-all">{url}</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">
                      Cómo usar el código QR
                    </h4>
                    <ul className="text-xs text-blue-800 mt-1 space-y-1">
                      <li>• Abre la cámara de tu teléfono</li>
                      <li>• Apunta al código QR</li>
                      <li>• Toca la notificación que aparece</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="flex-1"
                  disabled={!downloadUrl}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
                <Button
                  onClick={handleShare}
                  className="flex-1"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartir
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <Monitor className="h-3 w-3" />
            <span>Compatible con todos los dispositivos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
