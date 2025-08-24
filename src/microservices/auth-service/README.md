# Auth Service - Memoria Eterna

Microservicio de autenticación y autorización para la plataforma Memoria Eterna.

## 🎯 Descripción

El Auth Service es un microservicio dedicado a manejar toda la lógica de autenticación y autorización de la plataforma Memoria Eterna. Proporciona funcionalidades de registro, login, gestión de tokens JWT, verificación de email, reset de contraseñas, y más.

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    Auth Service                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Routes    │ │ Controllers │ │  Services   │          │
│  │             │ │             │ │             │          │
│  │ - Auth      │ │ - Auth      │ │ - Auth      │          │
│  │ - Users     │ │ - User      │ │ - User      │          │
│  │ - SSO       │ │ - SSO       │ │ - Token     │          │
│  │ - 2FA       │ │ - 2FA       │ │ - Email     │          │
│  │ - Health    │ │ - Audit     │ │ - Audit     │          │
│  │ - Metrics   │ │             │ │             │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ Middleware  │ │   Utils     │ │   Config    │          │
│  │             │ │             │ │             │          │
│  │ - Auth      │ │ - Logger    │ │ - Env Vars  │          │
│  │ - Error     │ │ - Errors    │ │ - Validation│          │
│  │ - Rate Limit│ │ - Metrics   │ │ - Security  │          │
│  │ - CORS      │ │             │ │             │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Características

### ✅ Autenticación
- Registro de usuarios con validación
- Login con email y contraseña
- Logout y invalidación de tokens
- Verificación de email
- Reset de contraseñas
- Gestión de sesiones

### ✅ Autorización
- Tokens JWT (Access + Refresh)
- Control de acceso basado en roles (RBAC)
- Permisos granulares
- Middleware de autenticación
- Validación de tokens

### ✅ Seguridad
- Rate limiting
- CORS configurado
- Headers de seguridad (Helmet)
- Validación de entrada
- Logging de auditoría
- Encriptación de contraseñas

### ✅ Monitoreo
- Health checks (liveness, readiness, startup)
- Métricas Prometheus
- Logging estructurado
- Endpoints de estado

### ✅ Integración
- Supabase como backend
- Email templates personalizados
- Configuración flexible
- Docker support

## 📋 Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login de usuario
- `POST /api/auth/logout` - Logout de usuario
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/change-password` - Cambiar contraseña
- `POST /api/auth/forgot-password` - Solicitar reset
- `POST /api/auth/reset-password` - Reset de contraseña
- `GET /api/auth/me` - Obtener perfil actual

### Usuarios
- `GET /api/users` - Listar usuarios (admin)
- `GET /api/users/:id` - Obtener usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

### Salud y Métricas
- `GET /health` - Health check básico
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe
- `GET /health/startup` - Startup probe
- `GET /health/detailed` - Health check detallado
- `GET /metrics` - Métricas Prometheus
- `GET /metrics/json` - Métricas en JSON
- `GET /metrics/summary` - Resumen de métricas

## 🛠️ Instalación

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Docker (opcional)
- Supabase project

### Desarrollo Local

1. **Clonar el repositorio**
```bash
cd src/microservices/auth-service
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus valores
```

4. **Ejecutar en desarrollo**
```bash
npm run dev
```

### Docker

1. **Construir imagen**
```bash
npm run docker:build
```

2. **Ejecutar contenedor**
```bash
npm run docker:run
```

## ⚙️ Configuración

### Variables de Entorno

```env
# Servidor
NODE_ENV=development
PORT=3001

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# JWT
JWT_SECRET=your_jwt_secret_key_32_chars_min
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Seguridad
ENCRYPTION_KEY=your_32_char_encryption_key
SESSION_SECRET=your_session_secret_32_chars_min

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGINS=http://localhost:3000,https://memoriaeterna.com

# 2FA
TOTP_SECRET=your_totp_secret_32_chars_min

# Email
SENDGRID_API_KEY=your_sendgrid_key
MAILGUN_API_KEY=your_mailgun_key
MAILGUN_DOMAIN=your_mailgun_domain

# SSO
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Base de Datos
DATABASE_URL=your_database_url
REDIS_URL=your_redis_url

# Monitoreo
LOG_LEVEL=info
METRICS_PORT=9090
```

## 📊 Monitoreo

### Health Checks

```bash
# Health check básico
curl http://localhost:3001/health

# Readiness probe
curl http://localhost:3001/health/ready

# Liveness probe
curl http://localhost:3001/health/live

# Health check detallado
curl http://localhost:3001/health/detailed
```

### Métricas

```bash
# Métricas Prometheus
curl http://localhost:3001/metrics

# Métricas JSON
curl http://localhost:3001/metrics/json

# Resumen de métricas
curl http://localhost:3001/metrics/summary
```

### Logs

```bash
# Ver logs en tiempo real
npm run logs

# Ver logs de errores
npm run logs:error
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests en modo watch
npm run test:watch

# Cobertura de tests
npm run test:coverage
```

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Ejecutar en modo desarrollo
npm run build        # Compilar TypeScript
npm start            # Ejecutar en producción

# Testing
npm test             # Ejecutar tests
npm run test:watch   # Tests en modo watch
npm run test:coverage # Cobertura de tests

# Linting y Formato
npm run lint         # Verificar linting
npm run lint:fix     # Corregir problemas de linting
npm run format       # Formatear código

# Docker
npm run docker:build # Construir imagen Docker
npm run docker:run   # Ejecutar contenedor

# Utilidades
npm run health       # Verificar salud del servicio
npm run metrics      # Ver métricas
npm run logs         # Ver logs
npm run logs:error   # Ver logs de errores
```

## 🔧 Desarrollo

### Estructura del Proyecto

```
src/
├── config/              # Configuración
│   └── index.ts
├── controllers/         # Controladores
│   └── auth.controller.ts
├── middleware/          # Middleware
│   ├── auth.middleware.ts
│   └── error.middleware.ts
├── routes/             # Rutas
│   ├── auth.routes.ts
│   ├── health.routes.ts
│   └── metrics.routes.ts
├── services/           # Servicios
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── token.service.ts
│   └── email.service.ts
├── utils/              # Utilidades
│   ├── logger.ts
│   └── errors.ts
└── index.ts           # Punto de entrada
```

### Agregar Nuevas Rutas

1. Crear archivo de rutas en `src/routes/`
2. Crear controlador en `src/controllers/`
3. Registrar rutas en `src/index.ts`

### Agregar Nuevos Servicios

1. Crear servicio en `src/services/`
2. Implementar interfaz y lógica de negocio
3. Inyectar en controladores según sea necesario

## 🔒 Seguridad

### Autenticación
- Tokens JWT con expiración configurable
- Refresh tokens para renovación automática
- Invalidación de tokens en logout
- Rate limiting en endpoints de auth

### Autorización
- Control de acceso basado en roles (RBAC)
- Permisos granulares por recurso
- Middleware de verificación de permisos
- Auditoría de accesos

### Validación
- Validación de entrada con express-validator
- Sanitización de datos
- Validación de esquemas con Zod
- Manejo de errores centralizado

## 📈 Métricas y Monitoreo

### Métricas Disponibles
- Requests totales y por método
- Tiempo de respuesta
- Tasa de errores
- Métricas de autenticación
- Estadísticas de usuarios
- Uso de recursos del sistema

### Alertas
- Alto uso de CPU/Memoria
- Tasa de errores elevada
- Tiempo de respuesta lento
- Servicios caídos

## 🚀 Despliegue

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: auth-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3001
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3001
```

### Docker Compose
```yaml
version: '3.8'
services:
  auth-service:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Para soporte y preguntas:
- 📧 Email: support@memoriaeterna.com
- 📖 Documentación: [docs.memoriaeterna.com](https://docs.memoriaeterna.com)
- 🐛 Issues: [GitHub Issues](https://github.com/memoria-eterna/auth-service/issues)

---

**Desarrollado con ❤️ por el equipo de Memoria Eterna**

