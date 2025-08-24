# Configuración de Stripe - Memoria Eterna

## 🎯 Descripción

Esta guía te ayudará a configurar Stripe para el sistema de pagos de Memoria Eterna, incluyendo la creación de productos, precios, webhooks y configuración del portal de facturación.

## 📋 Prerrequisitos

1. **Cuenta de Stripe**: Crear una cuenta en [stripe.com](https://stripe.com)
2. **Dominio configurado**: Tener un dominio para los webhooks
3. **SSL habilitado**: Requerido para webhooks en producción

## 🔧 Configuración Paso a Paso

### 1. Obtener Claves de API

1. Ve al [Dashboard de Stripe](https://dashboard.stripe.com)
2. En el menú lateral, ve a **Developers > API keys**
3. Copia las siguientes claves:
   - **Publishable key** (empieza con `pk_test_` o `pk_live_`)
   - **Secret key** (empieza con `sk_test_` o `sk_live_`)

### 2. Crear Productos y Precios

#### Plan Básico ($9.99/mes)
1. Ve a **Products** en el dashboard
2. Clic en **Add product**
3. Configuración:
   - **Name**: Plan Básico
   - **Description**: Hasta 500 memorias, 5GB de almacenamiento
   - **Pricing model**: Standard pricing
   - **Price**: $9.99 USD
   - **Billing period**: Monthly
4. Guarda el **Price ID** (empieza con `price_`)

#### Plan Pro ($19.99/mes)
1. Clic en **Add product**
2. Configuración:
   - **Name**: Plan Pro
   - **Description**: Memorias ilimitadas, 20GB de almacenamiento
   - **Pricing model**: Standard pricing
   - **Price**: $19.99 USD
   - **Billing period**: Monthly
4. Guarda el **Price ID**

#### Plan Empresarial ($49.99/mes)
1. Clic en **Add product**
2. Configuración:
   - **Name**: Plan Empresarial
   - **Description**: Todo ilimitado, soporte dedicado
   - **Pricing model**: Standard pricing
   - **Price**: $49.99 USD
   - **Billing period**: Monthly
4. Guarda el **Price ID**

### 3. Configurar Webhooks

1. Ve a **Developers > Webhooks**
2. Clic en **Add endpoint**
3. Configuración:
   - **Endpoint URL**: `https://tu-dominio.com/api/webhooks/stripe`
   - **Events to send**: Selecciona los siguientes eventos:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
4. Guarda y copia el **Webhook signing secret** (empieza con `whsec_`)

### 4. Configurar Portal de Facturación

1. Ve a **Settings > Billing > Customer portal**
2. Habilita el **Customer portal**
3. Configura las siguientes opciones:
   - ✅ **Cancel subscription**
   - ✅ **Update payment method**
   - ✅ **Update billing address**
   - ✅ **Download invoices**
4. Guarda la configuración

### 5. Configurar Variables de Entorno

Actualiza tu archivo `.env` con las siguientes variables:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_tu-publishable-key"
STRIPE_SECRET_KEY="sk_test_tu-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_tu-webhook-secret"

# Stripe Product Price IDs
STRIPE_BASIC_PRICE_ID="price_tu-basic-plan-id"
STRIPE_PRO_PRICE_ID="price_tu-pro-plan-id"
STRIPE_ENTERPRISE_PRICE_ID="price_tu-enterprise-plan-id"

# Base URL for Stripe redirects
NEXT_PUBLIC_BASE_URL="https://tu-dominio.com"
```

### 6. Configurar Dominios Permitidos

1. Ve a **Settings > Checkout settings**
2. En **Allowed domains**, agrega tu dominio
3. En **Branding**, personaliza el logo y colores

## 🧪 Testing

### Usar Tarjetas de Prueba

Stripe proporciona tarjetas de prueba para testing:

#### Tarjetas Exitosas
- **Visa**: `4242424242424242`
- **Mastercard**: `5555555555554444`
- **American Express**: `378282246310005`

#### Tarjetas con Errores
- **Tarjeta rechazada**: `4000000000000002`
- **Tarjeta insuficiente**: `4000000000009995`
- **Tarjeta expirada**: `4000000000000069`

### Probar Webhooks Localmente

1. Instala [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Ejecuta: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Copia el webhook secret proporcionado

## 🚀 Producción

### Cambiar a Modo Live

1. En el dashboard de Stripe, cambia a **Live mode**
2. Actualiza las claves de API en tu `.env`:
   - Cambia `pk_test_` por `pk_live_`
   - Cambia `sk_test_` por `sk_live_`
   - Actualiza el webhook secret

### Configurar Webhooks de Producción

1. Crea un nuevo webhook endpoint con tu dominio de producción
2. Usa el mismo webhook secret en tu aplicación
3. Verifica que los eventos se reciban correctamente

## 📊 Monitoreo

### Dashboard de Stripe

Monitorea los siguientes aspectos:
- **Payments**: Pagos exitosos y fallidos
- **Subscriptions**: Suscripciones activas y canceladas
- **Customers**: Nuevos clientes y actividad
- **Webhooks**: Eventos enviados y fallidos

### Logs de la Aplicación

Revisa los logs de tu aplicación para:
- Errores en webhooks
- Fallos en creación de clientes
- Problemas con sesiones de checkout

## 🔒 Seguridad

### Mejores Prácticas

1. **Nunca expongas la secret key** en el frontend
2. **Verifica webhooks** usando el signing secret
3. **Usa HTTPS** en producción
4. **Valida datos** antes de procesar pagos
5. **Mantén actualizadas** las dependencias de Stripe

### Rate Limiting

Stripe tiene límites de rate:
- **API calls**: 100 requests per second
- **Webhook events**: 1000 events per second
- **Checkout sessions**: 1000 sessions per minute

## 🆘 Troubleshooting

### Problemas Comunes

#### Webhook no recibe eventos
- Verifica la URL del webhook
- Confirma que el endpoint responde con 200
- Revisa los logs de Stripe

#### Error en checkout
- Verifica las claves de API
- Confirma que el price ID existe
- Revisa la configuración del customer

#### Suscripción no se actualiza
- Verifica el webhook secret
- Confirma que el evento se procesa correctamente
- Revisa los logs de la aplicación

### Contacto

- **Stripe Support**: [support.stripe.com](https://support.stripe.com)
- **Documentación**: [stripe.com/docs](https://stripe.com/docs)
- **Status Page**: [status.stripe.com](https://status.stripe.com)

## 📚 Recursos Adicionales

- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Checkout](https://stripe.com/docs/checkout)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

---

**Nota**: Esta configuración es específica para Memoria Eterna. Ajusta los precios y características según tus necesidades.
