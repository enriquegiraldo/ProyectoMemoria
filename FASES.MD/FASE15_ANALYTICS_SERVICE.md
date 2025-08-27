# FASE 15: Analytics Service - Memoria Eterna

## 🎯 Resumen de la Fase

Se ha implementado exitosamente el **Analytics Service** como parte de la Fase 15 del proyecto Memoria Eterna. Este microservicio proporciona capacidades avanzadas de análisis de datos, procesamiento de eventos y generación de métricas empresariales para todos los demás servicios del ecosistema.

## 🏗️ Arquitectura del Analytics Service

### Componentes Principales:

```
┌─────────────────────────────────────────────────────────────┐
│                    Analytics Service                        │
├─────────────────────────────────────────────────────────────┤
│  📊 Event Sourcing Service                                  │
│  📈 Analytics Processing Service                            │
│  🎯 REST API Controllers                                    │
│  🗄️  Data Models (Events, Metrics, KPIs)                   │
│  🔧 Configuration & Utilities                               │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos:

```
Microservicios → Event Sourcing → Analytics Processing → Metrics/KPIs
     ↓                ↓                    ↓                ↓
  Eventos        Almacenamiento      Procesamiento      Dashboard
  (JSON)         (PostgreSQL)        (TypeORM)         (REST API)
```

## 📊 Funcionalidades Implementadas

### 1. 🔄 Event Sourcing
- **Recopilación de Eventos**: Captura eventos de todos los microservicios
- **Almacenamiento Estructurado**: Base de datos PostgreSQL optimizada
- **Procesamiento en Tiempo Real**: Análisis inmediato de eventos críticos
- **Validación de Datos**: Verificación de tipos y fuentes de eventos

### 2. 📈 Procesamiento de Analytics
- **Generación de Métricas**: Conversión automática de eventos a métricas
- **Agregación de Datos**: Cálculos de sumas, promedios, conteos
- **Filtrado por Dimensiones**: Análisis por usuario, tipo, fecha, etc.
- **KPIs Automáticos**: Indicadores clave de rendimiento

### 3. 🎯 API REST Completa
- **Tracking de Eventos**: Endpoints para capturar eventos individuales y en lote
- **Consultas de Métricas**: APIs para obtener datos agregados
- **Dashboard en Tiempo Real**: Datos para visualizaciones
- **Estadísticas de Eventos**: Análisis por tipo y período

## 🗄️ Modelos de Datos

### Event Model
```typescript
interface Event {
  id: string;
  type: EventType;           // Tipo de evento
  source: EventSource;       // Fuente del evento
  userId?: string;           // Usuario asociado
  sessionId?: string;        // Sesión del usuario
  metadata?: Record<string, any>;  // Metadatos adicionales
  properties?: Record<string, any>; // Propiedades del evento
  value?: number;            // Valor numérico
  currency?: string;         // Moneda
  eventTime?: Date;          // Timestamp del evento
  isProcessed: boolean;      // Estado de procesamiento
  createdAt: Date;           // Fecha de creación
  updatedAt: Date;           // Fecha de actualización
}
```

### Metric Model
```typescript
interface Metric {
  id: string;
  name: string;              // Nombre de la métrica
  type: MetricType;          // Tipo (counter, gauge, histogram)
  value: number;             // Valor numérico
  labels?: Record<string, string>;  // Etiquetas para dimensiones
  timestamp: Date;           // Timestamp de la métrica
  createdAt: Date;           // Fecha de creación
  updatedAt: Date;           // Fecha de actualización
}
```

### KPI Model
```typescript
interface KPI {
  id: string;
  name: string;              // Nombre del KPI
  value: number;             // Valor actual
  target?: number;           // Objetivo
  breakdown?: Record<string, number>;  // Desglose por dimensiones
  date: Date;                // Fecha del KPI
  createdAt: Date;           // Fecha de creación
  updatedAt: Date;           // Fecha de actualización
}
```

## 🔄 Tipos de Eventos Soportados

### Eventos de Usuario:
- `USER_REGISTERED` - Usuario registrado
- `USER_LOGIN` - Usuario inició sesión

### Eventos de Memoria:
- `MEMORY_CREATED` - Memoria creada

### Eventos de Pago:
- `PAYMENT_SUCCEEDED` - Pago exitoso
- `SUBSCRIPTION_CREATED` - Suscripción creada

### Eventos de Media:
- `MEDIA_UPLOADED` - Media subido

### Eventos del Sistema:
- `SYSTEM_ERROR` - Error del sistema

## 📊 Métricas Generadas Automáticamente

### Contadores (Counters):
- `user_registrations` - Registros de usuarios
- `user_logins` - Inicios de sesión
- `memories_created` - Memorias creadas
- `payments_succeeded` - Pagos exitosos
- `subscriptions_created` - Suscripciones creadas
- `media_uploads` - Subidas de media
- `system_errors` - Errores del sistema

### Gauge (Medidores):
- `payment_amount` - Montos de pago

## 🎯 Endpoints de la API

### Event Tracking:
```
POST /api/analytics/events              # Track single event
POST /api/analytics/events/batch        # Track multiple events
```

### Event Queries:
```
GET /api/analytics/events/type/:type    # Get events by type
GET /api/analytics/events/user/:userId  # Get events by user
GET /api/analytics/events/stats         # Get event statistics
```

### Metrics:
```
GET /api/analytics/metrics/:name        # Get metrics by name
GET /api/analytics/metrics/:name/aggregated  # Get aggregated metrics
```

### Dashboard:
```
GET /api/analytics/dashboard            # Get dashboard data
```

### Admin:
```
POST /api/analytics/process             # Process events
POST /api/analytics/kpis/generate       # Generate KPIs
```

## 🔧 Configuración

### Variables de Entorno:
```bash
# Server Configuration
PORT=3007
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://analytics:password@localhost:5432/analytics_db
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=1

# Analytics Configuration
ANALYTICS_BATCH_SIZE=1000
ANALYTICS_FLUSH_INTERVAL=5000
ANALYTICS_RETENTION_DAYS=365
ANALYTICS_REALTIME_ENABLED=true

# Security Configuration
JWT_SECRET=analytics-jwt-secret
ENCRYPTION_KEY=analytics-encryption-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Service URLs
AUTH_SERVICE_URL=http://auth-service:3001
PAYMENTS_SERVICE_URL=http://payments-service:3006
NOTIFICATIONS_SERVICE_URL=http://notifications-service:3004
USER_SERVICE_URL=http://user-service:3003
MEMORY_SERVICE_URL=http://memory-service:3002
MEDIA_SERVICE_URL=http://media-service:3005
```

## 📈 Ejemplos de Uso

### 1. Tracking de Evento Individual:
```bash
curl -X POST http://localhost:3007/api/analytics/events \
  -H "Content-Type: application/json" \
  -d '{
    "type": "user_login",
    "source": "web",
    "userId": "user123",
    "sessionId": "session456",
    "metadata": {
      "ip": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    }
  }'
```

### 2. Tracking de Eventos en Lote:
```bash
curl -X POST http://localhost:3007/api/analytics/events/batch \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "type": "memory_created",
        "source": "mobile",
        "userId": "user123",
        "metadata": { "memoryType": "photo" }
      },
      {
        "type": "payment_succeeded",
        "source": "web",
        "userId": "user123",
        "value": 29.99,
        "currency": "USD"
      }
    ]
  }'
```

### 3. Consulta de Métricas:
```bash
curl "http://localhost:3007/api/analytics/metrics/user_registrations?startDate=2024-01-01&endDate=2024-01-31"
```

### 4. Dashboard Data:
```bash
curl "http://localhost:3007/api/analytics/dashboard?userId=user123"
```

## 🚀 Despliegue

### Docker:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3007
CMD ["node", "dist/index.js"]
```

### Kubernetes:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: analytics-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: analytics-service
  template:
    metadata:
      labels:
        app: analytics-service
    spec:
      containers:
      - name: analytics-service
        image: memoria-eterna/analytics-service:latest
        ports:
        - containerPort: 3007
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: analytics-secrets
              key: DATABASE_URL
```

## 📊 Monitoreo y Observabilidad

### Health Checks:
- `GET /health` - Estado del servicio
- `GET /metrics` - Métricas del sistema

### Logging:
- Logs estructurados con Winston
- Niveles: error, warn, info, debug
- Formato JSON para agregación

### Métricas:
- Uptime del servicio
- Uso de memoria y CPU
- Latencia de respuesta
- Tasa de errores

## 🔒 Seguridad

### Medidas Implementadas:
- **Helmet**: Headers de seguridad
- **Rate Limiting**: Protección contra abuso
- **CORS**: Control de acceso cross-origin
- **Input Validation**: Validación de datos de entrada
- **Error Handling**: Manejo seguro de errores

### Autenticación:
- Integración con Auth Service
- Validación de JWT tokens
- Control de acceso por roles

## 📈 Beneficios del Analytics Service

### Para el Negocio:
- 📊 **Insights en Tiempo Real**: Datos actualizados constantemente
- 📈 **KPIs Automáticos**: Indicadores clave generados automáticamente
- 🎯 **Toma de Decisiones**: Datos para decisiones informadas
- 📋 **Reportes Automáticos**: Generación automática de reportes

### Para los Desarrolladores:
- 🔄 **Event Sourcing**: Arquitectura escalable para eventos
- 📊 **Métricas Granulares**: Análisis detallado del comportamiento
- 🎯 **APIs Flexibles**: Consultas personalizables
- 📈 **Dashboard Data**: Datos listos para visualizaciones

### Para las Operaciones:
- 📊 **Monitoreo Avanzado**: Métricas detalladas del sistema
- 🔍 **Debugging Facilitado**: Trazabilidad completa de eventos
- 📈 **Performance Analytics**: Análisis de rendimiento
- 🚨 **Alertas Inteligentes**: Notificaciones basadas en datos

## 🚀 Próximos Pasos

### Mejoras Futuras:
1. **Machine Learning**: Predicciones y análisis avanzado
2. **Real-time Streaming**: Apache Kafka para eventos en tiempo real
3. **Data Warehousing**: Almacenamiento optimizado para análisis
4. **Business Intelligence**: Reportes y dashboards avanzados
5. **A/B Testing**: Framework para pruebas A/B
6. **Anomaly Detection**: Detección automática de anomalías

### Integraciones Planificadas:
1. **Grafana**: Visualizaciones avanzadas
2. **Elasticsearch**: Búsqueda y análisis de logs
3. **Apache Spark**: Procesamiento de big data
4. **Tableau**: Business intelligence
5. **Slack**: Notificaciones automáticas

## ✅ Checklist de Implementación

### Core Features:
- [x] Event Sourcing Service
- [x] Analytics Processing Service
- [x] REST API Controllers
- [x] Data Models (Event, Metric, KPI)
- [x] Database Integration (PostgreSQL)
- [x] Configuration Management
- [x] Error Handling
- [x] Logging System

### API Endpoints:
- [x] Event Tracking (single & batch)
- [x] Event Queries (by type, user, stats)
- [x] Metrics Retrieval
- [x] Aggregated Metrics
- [x] Dashboard Data
- [x] Admin Endpoints

### Security & Performance:
- [x] Rate Limiting
- [x] CORS Configuration
- [x] Input Validation
- [x] Error Handling
- [x] Health Checks
- [x] Graceful Shutdown

### Documentation:
- [x] API Documentation
- [x] Configuration Guide
- [x] Deployment Instructions
- [x] Usage Examples

## 🎉 Conclusión

El **Analytics Service** ha sido implementado exitosamente como parte de la Fase 15, proporcionando:

- 🔄 **Event Sourcing robusto** para capturar eventos de todos los microservicios
- 📊 **Procesamiento de analytics** para generar métricas y KPIs automáticamente
- 🎯 **API REST completa** para consultas y visualizaciones
- 📈 **Escalabilidad** para manejar grandes volúmenes de datos
- 🔒 **Seguridad empresarial** con múltiples capas de protección

Este servicio establece las bases para un sistema de analytics empresarial completo, permitiendo a Memoria Eterna obtener insights valiosos sobre el comportamiento de los usuarios, el rendimiento del sistema y las métricas de negocio.

**¡La Fase 15 está COMPLETADA y lista para la siguiente fase del proyecto!** 🚀
