# Memories Service

## Descripción

El **Memories Service** es un microservicio especializado en la gestión completa de recuerdos y memorias para la plataforma Memoria Eterna. Este servicio maneja todas las operaciones CRUD relacionadas con las memorias, incluyendo búsqueda avanzada, gestión de permisos, y procesamiento de metadatos.

## Arquitectura

### Tecnologías Principales
- **Node.js 18** - Runtime de JavaScript
- **Express.js** - Framework web
- **TypeScript** - Lenguaje de programación tipado
- **Supabase** - Base de datos PostgreSQL y autenticación
- **Winston** - Sistema de logging estructurado
- **Zod** - Validación de esquemas
- **JWT** - Autenticación y autorización

### Características Principales
- ✅ **CRUD Completo** - Crear, leer, actualizar y eliminar memorias
- ✅ **Búsqueda Avanzada** - Filtros múltiples y paginación
- ✅ **Gestión de Permisos** - Control granular de acceso
- ✅ **Auditoría Completa** - Logging de todas las operaciones
- ✅ **Validación Robusta** - Validación de entrada con Zod
- ✅ **Manejo de Errores** - Sistema de errores personalizado
- ✅ **Monitoreo** - Health checks y métricas
- ✅ **Rate Limiting** - Protección contra abuso
- ✅ **Seguridad** - Helmet, CORS, y validación JWT

## Endpoints de la API

### Memorias

#### `POST /api/v1/memories`
Crea una nueva memoria.

**Body:**
```json
{
  "title": "Mi primer recuerdo",
  "description": "Una descripción opcional",
  "content": "Contenido detallado del recuerdo...",
  "type": "story",
  "visibility": "private",
  "tags": ["familia", "vacaciones"],
  "location": {
    "latitude": 40.4168,
    "longitude": -3.7038,
    "address": "Madrid, España"
  },
  "date": "2024-01-15T10:30:00Z"
}
```

#### `GET /api/v1/memories/:id`
Obtiene una memoria específica por ID.

#### `PUT /api/v1/memories/:id`
Actualiza una memoria existente.

#### `DELETE /api/v1/memories/:id`
Elimina una memoria (soft delete).

#### `GET /api/v1/memories/search`
Búsqueda avanzada de memorias.

**Query Parameters:**
- `query` - Búsqueda de texto
- `type` - Tipo de memoria (comma-separated)
- `status` - Estado de la memoria
- `visibility` - Visibilidad
- `tags` - Etiquetas (comma-separated)
- `page` - Número de página
- `limit` - Elementos por página
- `sortBy` - Campo de ordenación
- `sortOrder` - Orden (asc/desc)

#### `GET /api/v1/memories/user/memories`
Obtiene las memorias del usuario autenticado.

### Health Checks

#### `GET /health`
Health check básico.

#### `GET /health/detailed`
Health check detallado con dependencias.

#### `GET /health/ready`
Readiness probe para Kubernetes.

#### `GET /health/live`
Liveness probe para Kubernetes.

### Métricas

#### `GET /metrics`
Métricas del servicio en formato JSON.

#### `GET /metrics/prometheus`
Métricas en formato Prometheus.

## Instalación

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Supabase project configurado

### Configuración

1. **Clonar el repositorio:**
```bash
git clone <repository-url>
cd src/microservices/memories-service
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
# Server
NODE_ENV=development
PORT=3002
HOST=0.0.0.0

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Security
ENCRYPTION_KEY=your_32_char_encryption_key
SESSION_SECRET=your_session_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Upload
MAX_FILE_SIZE=10485760
ALLOWED_MIME_TYPES=image/*,video/*,audio/*,application/pdf
STORAGE_PROVIDER=local

# Redis (opcional)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Monitoring
LOG_LEVEL=info
METRICS_PORT=9090
ENABLE_METRICS=true
```

4. **Compilar TypeScript:**
```bash
npm run build
```

5. **Ejecutar el servicio:**
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## Desarrollo

### Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Ejecuta con nodemon
npm run build        # Compila TypeScript
npm run clean        # Limpia archivos compilados

# Testing
npm test             # Ejecuta tests unitarios
npm run test:watch   # Tests en modo watch
npm run test:coverage # Tests con cobertura

# Linting
npm run lint         # Ejecuta ESLint
npm run lint:fix     # Corrige errores de linting
npm run format       # Formatea código con Prettier

# Type checking
npm run type-check   # Verifica tipos TypeScript
```

### Estructura del Proyecto

```
src/
├── config.ts                    # Configuración centralizada
├── index.ts                     # Punto de entrada
├── controllers/                 # Controladores de la API
│   └── memories.controller.ts
├── middleware/                  # Middleware personalizado
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   ├── rate-limit.middleware.ts
│   └── validation.middleware.ts
├── routes/                      # Definición de rutas
│   ├── memories.routes.ts
│   ├── health.routes.ts
│   └── metrics.routes.ts
├── services/                    # Lógica de negocio
│   └── memories.service.ts
├── types/                       # Definiciones de tipos
│   └── index.ts
└── utils/                       # Utilidades
    ├── errors.ts
    └── logger.ts
```

## Monitoreo y Observabilidad

### Logging
El servicio utiliza Winston para logging estructurado con:
- **Niveles**: error, warn, info, debug
- **Rotación**: Archivos diarios con compresión
- **Auditoría**: Logs separados para eventos de seguridad
- **Performance**: Logs de rendimiento de API

### Métricas
- **Prometheus**: Métricas en formato estándar
- **Health Checks**: Endpoints para Kubernetes
- **Performance**: Tiempos de respuesta y uso de memoria

### Health Checks
- **Liveness**: Verifica que el proceso esté vivo
- **Readiness**: Verifica que esté listo para recibir tráfico
- **Dependencies**: Verifica conexiones a base de datos y Redis

## Seguridad

### Autenticación
- **JWT**: Tokens de acceso y refresh
- **Middleware**: Validación automática de tokens
- **Roles**: Sistema de roles y permisos

### Autorización
- **Permisos**: Control granular por recurso
- **Visibilidad**: Niveles de visibilidad de memorias
- **Auditoría**: Logging de todas las operaciones

### Protección
- **Rate Limiting**: Protección contra abuso
- **CORS**: Configuración de orígenes permitidos
- **Helmet**: Headers de seguridad
- **Validación**: Validación estricta de entrada

## Despliegue

### Docker

```bash
# Construir imagen
docker build -t memories-service .

# Ejecutar contenedor
docker run -p 3002:3002 --env-file .env memories-service
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: memories-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: memories-service
  template:
    metadata:
      labels:
        app: memories-service
    spec:
      containers:
      - name: memories-service
        image: memories-service:latest
        ports:
        - containerPort: 3002
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3002"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3002
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3002
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Testing

### Tests Unitarios
```bash
npm test
```

### Tests de Integración
```bash
npm run test:integration
```

### Tests de Carga
```bash
npm run test:load
```

## Contribución

### Guías de Desarrollo
1. **Código**: Seguir estándares de TypeScript y ESLint
2. **Tests**: Mantener cobertura > 80%
3. **Documentación**: Actualizar README y comentarios
4. **Commits**: Usar convenciones de Conventional Commits

### Flujo de Trabajo
1. Crear feature branch desde `main`
2. Implementar cambios con tests
3. Ejecutar linting y tests
4. Crear Pull Request
5. Code review y merge

## Troubleshooting

### Problemas Comunes

**Error de conexión a Supabase:**
```bash
# Verificar variables de entorno
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Verificar conectividad
curl -X GET "https://your-project.supabase.co/rest/v1/"
```

**Error de JWT:**
```bash
# Verificar secreto JWT
echo $JWT_SECRET

# Verificar formato del token
jwt.io
```

**Rate limiting excesivo:**
```bash
# Ajustar configuración
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX_REQUESTS=1000 # Más requests
```

### Logs
Los logs se encuentran en:
- `logs/combined-YYYY-MM-DD.log` - Logs generales
- `logs/error-YYYY-MM-DD.log` - Solo errores
- `logs/audit-YYYY-MM-DD.log` - Eventos de auditoría

## Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](../LICENSE) para más detalles.

## Soporte

Para soporte técnico o preguntas:
- **Issues**: Crear issue en GitHub
- **Documentación**: Ver `/api/v1/docs`
- **Email**: soporte@memoriaeterna.com
