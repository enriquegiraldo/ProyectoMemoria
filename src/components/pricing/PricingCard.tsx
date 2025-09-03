import React from 'react';
import { Check, X } from 'lucide-react';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanId } from '../../lib/stripe';
import  Button  from '../ui/Button';

interface PricingCardProps {
  planId: SubscriptionPlanId;
  currentPlan: SubscriptionPlanId;
  isPlanActive: boolean;
  onSelectPlan: (planId: SubscriptionPlanId) => void;
  isLoading?: boolean;
  isPopular?: boolean;
}

export function PricingCard({
  planId,
  currentPlan,
  isPlanActive,
  onSelectPlan,
  isLoading = false,
  isPopular = false,
}: PricingCardProps) {
  const plan = SUBSCRIPTION_PLANS[planId];
  const isCurrentPlan = currentPlan === planId;
  const isUpgrade = plan.price > SUBSCRIPTION_PLANS[currentPlan].price;
  const isDowngrade = plan.price < SUBSCRIPTION_PLANS[currentPlan].price;

  const getButtonText = () => {
    if (isCurrentPlan && isPlanActive) {
      return 'Plan Actual';
    }
    if (isCurrentPlan && !isPlanActive) {
      return 'Renovar Plan';
    }
    if (isUpgrade) {
      return 'Actualizar';
    }
    if (isDowngrade) {
      return 'Cambiar a este Plan';
    }
    return 'Seleccionar Plan';
  };

  const getButtonVariant = () => {
    if (isCurrentPlan && isPlanActive) {
      return 'secondary';
    }
    if (isPopular) {
      return 'default';
    }
    return 'outline';
  };

  const isButtonDisabled = isLoading || (isCurrentPlan && isPlanActive);

  return (
    <div className={`relative rounded-lg border p-6 shadow-sm transition-all hover:shadow-md ${
      isPopular 
        ? 'border-primary bg-primary/5' 
        : 'border-border bg-card'
    }`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            Más Popular
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-semibold">{plan.name}</h3>
        <div className="mt-2">
          <span className="text-3xl font-bold">
            ${plan.price}
          </span>
          {plan.price > 0 && (
            <span className="text-muted-foreground">/mes</span>
          )}
        </div>
        {plan.price === 0 && (
          <p className="text-sm text-muted-foreground">Para siempre</p>
        )}
      </div>

      <ul className="mb-6 space-y-3">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <Check className="mr-2 h-4 w-4 text-green-500" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => onSelectPlan(planId)}
        disabled={isButtonDisabled}
        variant={getButtonVariant()}
        className="w-full"
      >
        {isLoading ? 'Cargando...' : getButtonText()}
      </Button>

      {isCurrentPlan && isPlanActive && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Tu plan actual
        </p>
      )}

      {isCurrentPlan && !isPlanActive && (
        <p className="mt-2 text-center text-xs text-orange-600">
          Suscripción inactiva
        </p>
      )}
    </div>
  );
}
