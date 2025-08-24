# Payments Service

Microservicio de pagos para Memoria Eterna que maneja procesamiento de pagos, suscripciones y múltiples proveedores de pago.

## Características

- **Múltiples Proveedores de Pago**: Stripe, PayPal, MercadoPago, Criptomonedas
- **Gestión de Suscripciones**: Creación, actualización y cancelación de suscripciones
- **Procesamiento de Pagos**: Intents, confirmación, reembolsos
- **Seguridad Empresarial**: JWT, API Keys, Rate Limiting, Validación
- **Observabilidad**: Logging estructurado, métricas Prometheus, Health Checks
- **Escalabilidad**: Arquitectura modular, contenedores Docker, Kubernetes ready

## Tecnologías

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Base de Datos**: PostgreSQL con TypeORM
- **Cache**: Redis
- **Logging**: Winston
- **Métricas**: Prometheus
- **Validación**: Zod
- **Seguridad**: Helmet, JWT, bcrypt
- **Contenedores**: Docker & Docker Compose

## Instalación

### Prerrequisitos

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (opcional)

### Desarrollo Local

1. **Clonar y configurar**:
```bash
cd src/microservices/payments-service
cp env.example .env
# Editar .env con tus configuraciones
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Configurar base de datos**:
```bash
# Crear base de datos PostgreSQL
createdb payments_db

# Ejecutar migraciones
npm run db:migrate
```

4. **Ejecutar en desarrollo**:
```bash
npm run dev
```

### Docker

```bash
# Construir y ejecutar con Docker Compose
docker-compose up --build

# Solo el servicio
docker-compose up payments-service
```

## Configuración

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3004` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `DATABASE_URL` | URL de conexión PostgreSQL | - |
| `REDIS_URL` | URL de conexión Redis | `redis://localhost:6379` |
| `JWT_SECRET` | Clave secreta para JWT | - |
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe | - |
| `PAYPAL_CLIENT_ID` | Client ID de PayPal | - |
| `MERCADOPAGO_ACCESS_TOKEN` | Token de acceso MercadoPago | - |

### Proveedores de Pago

#### Stripe
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### PayPal
```env
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox
```

#### MercadoPago
```env
MERCADOPAGO_ACCESS_TOKEN=your_access_token
MERCADOPAGO_PUBLIC_KEY=your_public_key
```

## API Endpoints

### Pagos

#### Crear Payment Intent
```http
POST /api/v1/payments/intents
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 1000,
  "currency": "USD",
  "paymentMethod": "card",
  "provider": "stripe",
  "description": "Pago por suscripción premium"
}
```

#### Confirmar Pago
```http
POST /api/v1/payments/{paymentId}/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider": "stripe",
  "paymentMethodData": {
    "paymentMethodId": "pm_..."
  }
}
```

#### Obtener Pagos
```http
GET /api/v1/payments?limit=20&offset=0
Authorization: Bearer <token>
```

#### Reembolsar Pago
```http
POST /api/v1/payments/{paymentId}/refund
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 1000,
  "reason": "Solicitud del cliente"
}
```

### Suscripciones

#### Crear Suscripción
```http
POST /api/v1/subscriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "planId": "plan_123",
  "amount": 2999,
  "currency": "USD",
  "interval": "month",
  "intervalCount": 1,
  "provider": "stripe"
}
```

#### Obtener Suscripción
```http
GET /api/v1/subscriptions/{subscriptionId}
Authorization: Bearer <token>
```

#### Cancelar Suscripción
```http
POST /api/v1/subscriptions/{subscriptionId}/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "cancelAtPeriodEnd": true,
  "reason": "Usuario canceló"
}
```

### Health Check
```http
GET /health
```

### Métricas
```http
GET /metrics
```

## Estructura del Proyecto

```
src/
├── config.ts                 # Configuración centralizada
├── index.ts                  # Punto de entrada
├── app.ts                    # Configuración de Express
├── types/                    # Definiciones de tipos TypeScript
├── utils/                    # Utilidades (logger, metrics, etc.)
├── models/                   # Entidades de base de datos
├── services/                 # Lógica de negocio
├── controllers/              # Controladores HTTP
├── routes/                   # Definición de rutas
├── middleware/               # Middleware personalizado
├── providers/                # Proveedores de pago
└── database/                 # Configuración de base de datos
```

## Desarrollo

### Scripts Disponibles

```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Compilar TypeScript
npm run start        # Ejecutar en producción
npm run test         # Ejecutar tests
npm run lint         # Linting
npm run format       # Formatear código
```

### Testing

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Cobertura de tests
npm run test:coverage
```

### Linting y Formateo

```bash
# Verificar linting
npm run lint

# Corregir problemas de linting
npm run lint:fix

# Formatear código
npm run format
```

## Monitoreo y Observabilidad

### Logs

Los logs se escriben en formato JSON estructurado con los siguientes niveles:
- `error`: Errores críticos
- `warn`: Advertencias
- `info`: Información general
- `debug`: Información de depuración

### Métricas

El servicio expone métricas Prometheus en `/metrics`:

- **HTTP Requests**: Contadores y histogramas de requests
- **Payments**: Métricas de pagos procesados
- **Subscriptions**: Métricas de suscripciones
- **Errors**: Contadores de errores por tipo
- **Database**: Métricas de conexiones y queries

### Health Checks

```http
GET /health
```

Respuesta:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "payments-service",
  "version": "1.0.0"
}
```

## Seguridad

### Autenticación

- **JWT Tokens**: Para usuarios autenticados
- **API Keys**: Para integraciones de servicio

### Autorización

- **RBAC**: Control de acceso basado en roles
- **Permissions**: Permisos granulares por operación

### Rate Limiting

- **Global**: 100 requests/15min por IP
- **Payments**: 50 requests/5min por IP
- **Subscriptions**: 30 requests/10min por IP

### Validación

- **Input Validation**: Validación con Zod
- **SQL Injection**: Prevención con TypeORM
- **XSS Protection**: Headers de seguridad con Helmet

## Despliegue

### Docker

```bash
# Construir imagen
docker build -t payments-service .

# Ejecutar contenedor
docker run -p 3004:3004 payments-service
```

### Kubernetes

Ver archivos de configuración en `k8s/`:
- `deployment.yaml`
- `service.yaml`
- `ingress.yaml`
- `configmap.yaml`
- `secret.yaml`

### CI/CD

El servicio incluye:
- GitHub Actions para CI/CD
- Tests automatizados
- Escaneo de seguridad
- Despliegue automático

## Troubleshooting

### Problemas Comunes

1. **Error de conexión a base de datos**:
   - Verificar `DATABASE_URL`
   - Asegurar que PostgreSQL esté ejecutándose

2. **Error de autenticación con proveedores**:
   - Verificar claves de API
   - Confirmar configuración de webhooks

3. **Rate limiting**:
   - Revisar logs para identificar IPs problemáticas
   - Ajustar límites en configuración

### Logs de Debug

```bash
# Habilitar logs de debug
NODE_ENV=development DEBUG=* npm run dev
```

## Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](../LICENSE) para detalles.
