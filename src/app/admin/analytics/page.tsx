'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { AnalyticsDashboard } from '../../../components/analytics/AnalyticsDashboard';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { 
  BarChart3, 
  Users, 
  HardDrive, 
  Activity, 
  TrendingUp, 
  FileText,
  Calendar,
  Shield,
  ArrowLeft
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/admin/analytics');
        return;
      }

      // Check if user is admin
      if (user?.role !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }

      trackPageView('/admin/analytics');
    }
  }, [isAuthenticated, authLoading, user, router, trackPageView]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/admin')}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Admin
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics del Sistema</h1>
                <p className="text-gray-600">Métricas y estadísticas de la plataforma</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-600">Panel de Administrador</span>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <AnalyticsDashboard type="system" />

        {/* Additional Admin Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Exportar Datos</h3>
                <p className="text-sm text-gray-600">Descargar reportes en CSV</p>
              </div>
              <Button variant="outline" size="sm">
                Exportar
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Configurar Webhooks</h3>
                <p className="text-sm text-gray-600">Gestionar integraciones</p>
              </div>
              <Button variant="outline" size="sm">
                Configurar
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Alertas del Sistema</h3>
                <p className="text-sm text-gray-600">Configurar notificaciones</p>
              </div>
              <Button variant="outline" size="sm">
                Gestionar
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
