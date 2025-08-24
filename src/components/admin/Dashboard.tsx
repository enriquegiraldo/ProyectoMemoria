import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { AnimatedCard } from '../ui/AnimatedCard';
import { useCacheStats } from '../../hooks/useRedis';
import { Users, FileText, Trophy, Database } from 'lucide-react';

interface DashboardStats {
  users: { total: number; active: number; growth: number };
  memories: { total: number; public: number; growth: number };
  gamification: { totalPoints: number; activeUsers: number; growth: number };
  system: { cacheHitRate: number; avgResponseTime: number; errors: number };
}

function StatCard({ title, value, change, icon, color }: {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <AnimatedCard className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
          {change !== undefined && (
            <p className={`text-sm mt-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}%
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </AnimatedCard>
  );
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { stats: cacheStats } = useCacheStats();

  useEffect(() => {
    // Datos de ejemplo
    setStats({
      users: { total: 1247, active: 892, growth: 12.5 },
      memories: { total: 5678, public: 4321, growth: 8.3 },
      gamification: { totalPoints: 125000, activeUsers: 567, growth: 15.7 },
      system: { cacheHitRate: 87.5, avgResponseTime: 245, errors: 3 },
    });
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Dashboard de Administración
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Usuarios Totales"
          value={stats.users.total.toLocaleString()}
          change={stats.users.growth}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Memorias Creadas"
          value={stats.memories.total.toLocaleString()}
          change={stats.memories.growth}
          icon={<FileText className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />
        <StatCard
          title="Puntos Totales"
          value={stats.gamification.totalPoints.toLocaleString()}
          change={stats.gamification.growth}
          icon={<Trophy className="w-6 h-6 text-white" />}
          color="bg-yellow-500"
        />
        <StatCard
          title="Tasa de Caché"
          value={`${stats.system.cacheHitRate}%`}
          icon={<Database className="w-6 h-6 text-white" />}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Usuarios Activos</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.users.active}</p>
          <p className="text-sm text-gray-600 mt-2">
            {((stats.users.active / stats.users.total) * 100).toFixed(1)}% del total
          </p>
        </AnimatedCard>

        <AnimatedCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Memorias Públicas</h3>
          <p className="text-3xl font-bold text-green-600">{stats.memories.public}</p>
          <p className="text-sm text-gray-600 mt-2">
            {((stats.memories.public / stats.memories.total) * 100).toFixed(1)}% del total
          </p>
        </AnimatedCard>
      </div>
    </div>
  );
}
