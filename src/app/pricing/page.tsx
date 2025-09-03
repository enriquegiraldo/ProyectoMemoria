'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { usePayments } from '../../hooks/usePayments';
import { PricingCard } from '../../components/pricing/PricingCard';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanId } from '../../lib/stripe';
import  Button  from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { 
  CreditCard, 
  Shield, 
  Zap, 
  Users, 
  CheckCircle, 
  AlertCircle,
  ArrowRight 
} from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { 
    subscription, 
    isLoading, 
    error, 
    createCheckoutSession, 
    openBillingPortal,
    currentPlan,
    isPlanActive 
  } = usePayments();

  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectPlan = async (planId: SubscriptionPlanId) => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/pricing');
      return;
    }

    if (planId === 'FREE') {
      // Si selecciona el plan gratuito, redirigir al dashboard
      router.push('/dashboard');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await createCheckoutSession(planId);
      if (!result.success) {
        console.error('Error creating checkout session:', result.error);
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManageBilling = async () => {
    setIsProcessing(true);
    try {
      await openBillingPortal();
    } catch (error) {
      console.error('Error opening billing portal:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const features = [
    {
      icon: Shield,
      title: 'Seguridad Garantizada',
      description: 'Tus memorias están protegidas con encriptación de nivel bancario',
    },
    {
      icon: Zap,
      title: 'Acceso Instantáneo',
      description: 'Accede a tus memorias desde cualquier dispositivo, en cualquier momento',
    },
    {
      icon: Users,
      title: 'Compartir Fácilmente',
      description: 'Comparte tus memorias con familiares y amigos de forma segura',
    },
    {
      icon: CheckCircle,
      title: 'Soporte 24/7',
      description: 'Nuestro equipo está disponible para ayudarte cuando lo necesites',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Elige el Plan Perfecto para Ti
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Desde el plan gratuito hasta opciones empresariales, tenemos lo que necesitas 
            para preservar tus memorias más preciadas.
          </p>
        </div>

        {/* Current Plan Status */}
        {isAuthenticated && (
          <div className="mb-8">
            <Card className="p-6 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Tu Plan Actual</h3>
                  <p className="text-gray-600">
                    {SUBSCRIPTION_PLANS[currentPlan].name} - 
                    {isPlanActive ? (
                      <span className="text-green-600 ml-2">Activo</span>
                    ) : (
                      <span className="text-orange-600 ml-2">Inactivo</span>
                    )}
                  </p>
                </div>
                {subscription?.stripeCustomerId && (
                  <Button
                    onClick={handleManageBilling}
                    disabled={isProcessing}
                    variant="outline"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Gestionar Facturación
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <PricingCard
            planId="FREE"
            currentPlan={currentPlan}
            isPlanActive={isPlanActive}
            onSelectPlan={handleSelectPlan}
            isLoading={isProcessing}
          />
          
          <PricingCard
            planId="BASIC"
            currentPlan={currentPlan}
            isPlanActive={isPlanActive}
            onSelectPlan={handleSelectPlan}
            isLoading={isProcessing}
          />
          
          <PricingCard
            planId="PRO"
            currentPlan={currentPlan}
            isPlanActive={isPlanActive}
            onSelectPlan={handleSelectPlan}
            isLoading={isProcessing}
            isPopular={true}
          />
          
          <PricingCard
            planId="ENTERPRISE"
            currentPlan={currentPlan}
            isPlanActive={isPlanActive}
            onSelectPlan={handleSelectPlan}
            isLoading={isProcessing}
          />
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Características Incluidas en Todos los Planes
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Preguntas Frecuentes
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">
                ¿Puedo cambiar de plan en cualquier momento?
              </h3>
              <p className="text-gray-600">
                Sí, puedes actualizar o cambiar tu plan en cualquier momento. Los cambios se aplicarán 
                inmediatamente y se prorratearán en tu próxima factura.
              </p>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">
                ¿Qué pasa si cancelo mi suscripción?
              </h3>
              <p className="text-gray-600">
                Si cancelas tu suscripción, mantendrás acceso a todas las funciones hasta el final del 
                período facturado. Después, volverás al plan gratuito.
              </p>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">
                ¿Mis datos están seguros?
              </h3>
              <p className="text-gray-600">
                Absolutamente. Utilizamos encriptación de nivel bancario y cumplimos con los más altos 
                estándares de seguridad para proteger tus memorias.
              </p>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="p-8 bg-primary text-primary-foreground">
            <h2 className="text-2xl font-bold mb-4">
              ¿Listo para Preservar tus Memorias?
            </h2>
            <p className="text-lg mb-6 opacity-90">
              Únete a miles de usuarios que ya confían en Memoria Eterna para guardar 
              sus momentos más preciados.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated ? (
                <>
                  <Button
                    onClick={() => router.push('/register')}
                    variant="secondary"
                    size="lg"
                  >
                    Crear Cuenta Gratuita
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => router.push('/login')}
                    variant="outline"
                    size="lg"
                  >
                    Iniciar Sesión
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="secondary"
                  size="lg"
                >
                  Ir al Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
