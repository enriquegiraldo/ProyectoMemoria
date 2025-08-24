# Memoria Eterna - Plataforma de Microservicios

## 🚀 Descripción del Proyecto

**Memoria Eterna** es una plataforma empresarial basada en microservicios para la gestión y preservación de memorias digitales. La aplicación permite a los usuarios crear, almacenar, compartir y preservar sus recuerdos más preciados de forma segura y organizada.

## 🏗️ Arquitectura del Sistema

### Microservicios Implementados

1. **Auth Service** (`src/microservices/auth-service/`)
   - Autenticación y autorización de usuarios
   - Gestión de sesiones y tokens JWT
   - Integración con Supabase
   - 2FA y SSO

2. **Memories Service** (`src/microservices/memories-service/`)
   - Gestión de memorias y recuerdos
   - CRUD de memorias
   - Búsqueda y filtrado
   - Integración con Supabase

3. **Media Service** (`src/microservices/media-service/`)
   - Procesamiento y almacenamiento de archivos multimedia
   - Soporte para imágenes, videos, audio y documentos
   - Integración con múltiples proveedores de almacenamiento (AWS S3, Azure, Cloudinary)
   - CDN y optimización de contenido

4. **Notifications Service** (`src/microservices/notifications-service/`)
   - Sistema de notificaciones multicanal
   - Email, push notifications, SMS
   - Plantillas personalizables
   - Programación de notificaciones

5. **Payments Service** (`src/microservices/payments-service/`)
   - Procesamiento de pagos
   - Integración con Stripe, PayPal, MercadoPago
   - Gestión de suscripciones
   - Pagos con criptomonedas

6. **Analytics Service** (`src/microservices/analytics-service/`)
   - Análisis y métricas de la plataforma
   - Event sourcing
   - KPIs y dashboards
   - Reportes personalizados

7. **API Gateway** (`src/api-gateway/`)
   - Punto de entrada centralizado
   - Enrutamiento de requests
   - Rate limiting y circuit breaker
   - Autenticación centralizada

8. **Frontend** (`frontend/`)
   - Aplicación web con Next.js
   - Interfaz de usuario moderna
   - Responsive design
   - Integración con todos los microservicios

### Infraestructura

- **Kubernetes**: Orquestación y despliegue
- **Docker**: Containerización
- **PostgreSQL**: Base de datos principal
- **Redis**: Cache y colas de mensajes
- **Prometheus + Grafana**: Monitoreo y métricas

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** con **TypeScript**
- **Express.js** para APIs REST
- **Zod** para validación de esquemas
- **Winston** para logging
- **JWT** para autenticación
- **TypeORM** para ORM
- **Bull** para colas de trabajo

### Frontend
- **Next.js** con **React**
- **TypeScript**
- **Tailwind CSS** para estilos
- **Redux Toolkit** para estado global
- **React Query** para gestión de estado del servidor

### DevOps & Infraestructura
- **Docker** y **Docker Compose**
- **Kubernetes**
- **Prometheus** y **Grafana**
- **Helm** para charts de Kubernetes

## 📋 Prerrequisitos

- **Node.js** 18.x o superior
- **Docker** y **Docker Compose**
- **Kubernetes** (opcional para producción)
- **Git**

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd ProyectoMemoria
```

### 2. Configurar Variables de Entorno

Crear archivos `.env` en cada microservicio con las variables necesarias:

```bash
# Ejemplo para Auth Service
cp src/microservices/auth-service/env.example src/microservices/auth-service/.env
```

### 3. Instalar Dependencias

```bash
# Instalar dependencias de todos los microservicios
npm run install:all

# O instalar individualmente
cd src/microservices/auth-service && npm install
cd src/microservices/memories-service && npm install
# ... repetir para cada servicio
```

### 4. Configurar Base de Datos

```bash
# Levantar PostgreSQL y Redis
docker-compose up -d postgres redis

# Ejecutar migraciones
npm run migrate:all
```

## 🧪 Testing End-to-End

### Ejecutar Pruebas Completas

```bash
# Ejecutar script de testing end-to-end
./scripts/run-e2e-tests.sh
```

### Testing Manual

```bash
# Levantar todos los servicios en modo testing
docker-compose -f docker-compose.test.yml up -d

# Verificar estado de servicios
curl http://localhost:3000/health
curl http://localhost:3000/api

# Acceder a interfaces
# API Gateway: http://localhost:3000
# Frontend: http://localhost:3007
# Prometheus: http://localhost:9091
# Grafana: http://localhost:3008 (admin/admin)
# MailHog: http://localhost:8025
```

### Testing Individual de Microservicios

```bash
# Auth Service
cd src/microservices/auth-service
npm test

# Memories Service
cd src/microservices/memories-service
npm test

# Media Service
cd src/microservices/media-service
npm test

# Notifications Service
cd src/microservices/notifications-service
npm test

# Payments Service
cd src/microservices/payments-service
npm test

# Analytics Service
cd src/microservices/analytics-service
npm test
```

## 🏃‍♂️ Desarrollo Local

### Levantar Servicios Individuales

```bash
# Auth Service
cd src/microservices/auth-service
npm run dev

# Memories Service
cd src/microservices/memories-service
npm run dev

# API Gateway
cd src/api-gateway
npm run dev

# Frontend
cd frontend
npm run dev
```

### Docker Compose para Desarrollo

```bash
# Levantar infraestructura básica
docker-compose up -d postgres redis

# Levantar microservicios
docker-compose up -d auth-service memories-service media-service
```

## 📊 Monitoreo y Métricas

### Prometheus
- URL: http://localhost:9091
- Configuración: `prometheus.test.yml`

### Grafana
- URL: http://localhost:3008
- Usuario: `admin`
- Contraseña: `admin`

### Health Checks
```bash
# Verificar estado de todos los servicios
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health
curl http://localhost:3006/health
```

## 🚀 Despliegue en Producción

### Kubernetes

```bash
# Aplicar configuración de Kubernetes
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/services/
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/ingress/
```

### Docker Compose para Producción

```bash
# Levantar en modo producción
docker-compose -f docker-compose.prod.yml up -d
```

## 📁 Estructura del Proyecto

```
ProyectoMemoria/
├── src/
│   ├── microservices/
│   │   ├── auth-service/
│   │   ├── memories-service/
│   │   ├── media-service/
│   │   ├── notifications-service/
│   │   ├── payments-service/
│   │   └── analytics-service/
│   └── api-gateway/
├── frontend/
├── k8s/
├── scripts/
├── docker-compose.test.yml
├── prometheus.test.yml
└── README.md
```

## 🔧 Scripts Útiles

```bash
# Instalar todas las dependencias
npm run install:all

# Ejecutar todos los tests
npm run test:all

# Build de todos los servicios
npm run build:all

# Limpiar recursos de Docker
npm run docker:cleanup

# Verificar estado de servicios
npm run status
```

## 📈 Métricas de Performance

- **Response Time**: < 500ms (95% de requests)
- **Error Rate**: < 1%
- **Throughput**: > 1000 req/s
- **Availability**: 99.9%

## 🧪 Cobertura de Testing

- **Unit Tests**: > 90%
- **Integration Tests**: > 80%
- **End-to-End Tests**: > 70%
- **Load Tests**: Validación completa

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Equipo

- **Memoria Eterna Team**
- **Desarrollado con ❤️ para preservar recuerdos**

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear un issue en GitHub
- Contactar al equipo de desarrollo

---

**¡Gracias por usar Memoria Eterna! 🎉**
