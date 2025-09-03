import React from 'react';
import { usePayments } from '../../hooks/usePayments';
import { Card } from '../ui/Card';
import  Button  from '../ui/Button';
import { 
  Crown, 
  CreditCard, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight
} from 'lucide-react';

export function SubscriptionStatus() {
  const { 
    subscription, 
    isLoading, 
    error, 
    openBillingPortal,
    currentPlan,
    isPlanActive,
    getPlanInfo 
  } = usePayments();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">Error al cargar suscripción</span>
        </div>
      </Card>
    );
  }

  const plan = getPlanInfo(currentPlan);
  const isFreePlan = currentPlan === 'FREE';

  const getStatusIcon = () => {
    if (isPlanActive) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (subscription?.cancelAtPeriodEnd) {
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusText = () => {
    if (isPlanActive) {
      return 'Activa';
    }
    if (subscription?.cancelAtPeriodEnd) {
      return 'Cancelada (activa hasta el final del período)';
    }
    return 'Inactiva';
  };

  const getStatusColor = () => {
    if (isPlanActive) {
      return 'text-green-600';
    }
    if (subscription?.cancelAtPeriodEnd) {
      return 'text-orange-600';
    }
    return 'text-red-600';
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <Crown className="h-6 w-6 text-yellow-500 mr-2" />
          <h3 className="text-lg font-semibold">Tu Suscripción</h3>
        </div>
        {getStatusIcon()}
      </div>

      <div className="space-y-4">
        {/* Plan Actual */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Plan Actual</p>
            <p className="text-lg font-semibold">{plan.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Precio</p>
            <p className="text-lg font-semibold">
              {isFreePlan ? 'Gratis' : `$${plan.price}/mes`}
            </p>
          </div>
        </div>

        {/* Estado */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Estado</p>
            <p className={`font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </p>
          </div>
          {subscription?.currentPeriodEnd && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Próxima facturación</p>
              <p className="font-medium">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Límites */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Límites del Plan</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Memorias</p>
              <p className="font-medium">
                {plan.limits.memories === -1 ? 'Ilimitadas' : plan.limits.memories}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Almacenamiento</p>
              <p className="font-medium">
                {plan.limits.storage === -1 
                  ? 'Ilimitado' 
                  : `${(plan.limits.storage / (1024 * 1024 * 1024)).toFixed(0)}GB`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {!isFreePlan && subscription?.stripeCustomerId && (
            <Button
              onClick={openBillingPortal}
              variant="outline"
              className="flex-1"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Gestionar Facturación
            </Button>
          )}
          
          {isFreePlan && (
            <Button
              onClick={() => window.location.href = '/pricing'}
              className="flex-1"
            >
              Ver Planes
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          {!isFreePlan && !isPlanActive && (
            <Button
              onClick={() => window.location.href = '/pricing'}
              className="flex-1"
            >
              Renovar Suscripción
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Mensaje de cancelación */}
        {subscription?.cancelAtPeriodEnd && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-orange-800">
                  Suscripción cancelada
                </p>
               {  subscription.currentPeriodEnd &&  ( 
                <p className="text-sm text-orange-700">
                  Tu suscripción estará activa hasta el {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
