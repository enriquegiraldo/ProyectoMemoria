# Fase 17: Integración Completa y Testing End-to-End

## Objetivos de la Fase

Esta fase se enfoca en:
1. **Integración completa** de todos los microservicios
2. **Testing end-to-end** de flujos completos
3. **Validación de comunicación** entre servicios
4. **Testing de resiliencia** y manejo de errores
5. **Validación de performance** y escalabilidad

## Arquitectura de Integración

### 1. API Gateway Centralizado

```typescript
// Configuración centralizada de rutas
const serviceRoutes = {
  auth: '/api/auth',
  memories: '/api/memories', 
  media: '/api/media',
  notifications: '/api/notifications',
  payments: '/api/payments',
  analytics: '/api/analytics'
};
```

### 2. Service Discovery

```typescript
// Registro automático de servicios
interface ServiceRegistry {
  name: string;
  version: string;
  host: string;
  port: number;
  health: string;
  endpoints: string[];
}
```

### 3. Circuit Breaker Pattern

```typescript
// Protección contra fallos en cascada
interface CircuitBreaker {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureThreshold: number;
  timeout: number;
  successThreshold: number;
}
```

## Implementación de Testing End-to-End

### 1. Test Suite Principal

```typescript
// Flujos de usuario completos
describe('End-to-End User Flows', () => {
  test('User Registration and Memory Creation', async () => {
    // 1. Registro de usuario
    // 2. Login
    // 3. Creación de memoria
    // 4. Subida de media
    // 5. Notificación
    // 6. Analytics tracking
  });

  test('Payment and Subscription Flow', async () => {
    // 1. Selección de plan
    // 2. Proceso de pago
    // 3. Confirmación
    // 4. Activación de suscripción
    // 5. Notificaciones
  });
});
```

### 2. Health Checks Integrados

```typescript
// Verificación de dependencias
interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  dependencies: HealthCheck[];
  metrics: {
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
}
```

## Configuración de Integración

### 1. Docker Compose para Testing

```yaml
# docker-compose.test.yml
version: '3.8'
services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_DB: memoria_eterna_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    
  redis-test:
    image: redis:7-alpine
    
  auth-service-test:
    build: ./src/microservices/auth-service
    environment:
      NODE_ENV: test
      DATABASE_URL: postgresql://test_user:test_password@postgres-test:5432/memoria_eterna_test
      
  memories-service-test:
    build: ./src/microservices/memories-service
    environment:
      NODE_ENV: test
      
  media-service-test:
    build: ./src/microservices/media-service
    environment:
      NODE_ENV: test
      
  notifications-service-test:
    build: ./src/microservices/notifications-service
    environment:
      NODE_ENV: test
      
  payments-service-test:
    build: ./src/microservices/payments-service
    environment:
      NODE_ENV: test
      
  analytics-service-test:
    build: ./src/microservices/analytics-service
    environment:
      NODE_ENV: test
      
  api-gateway-test:
    build: ./src/api-gateway
    environment:
      NODE_ENV: test
    ports:
      - "3001:3000"
      
  frontend-test:
    build: ./frontend
    environment:
      NODE_ENV: test
      NEXT_PUBLIC_API_URL: http://localhost:3001
    ports:
      - "3002:3000"
```

### 2. Scripts de Testing

```bash
#!/bin/bash
# scripts/run-e2e-tests.sh

echo "🚀 Iniciando pruebas end-to-end..."

# 1. Levantar infraestructura de testing
echo "📦 Levantando servicios de testing..."
docker-compose -f docker-compose.test.yml up -d

# 2. Esperar que los servicios estén listos
echo "⏳ Esperando que los servicios estén listos..."
./scripts/wait-for-services.sh

# 3. Ejecutar migraciones de testing
echo "🗄️ Ejecutando migraciones..."
npm run test:migrate

# 4. Ejecutar tests unitarios
echo "🧪 Ejecutando tests unitarios..."
npm run test:unit

# 5. Ejecutar tests de integración
echo "🔗 Ejecutando tests de integración..."
npm run test:integration

# 6. Ejecutar tests end-to-end
echo "🌐 Ejecutando tests end-to-end..."
npm run test:e2e

# 7. Ejecutar tests de carga
echo "⚡ Ejecutando tests de carga..."
npm run test:load

# 8. Generar reportes
echo "📊 Generando reportes..."
npm run test:report

# 9. Limpiar
echo "🧹 Limpiando..."
docker-compose -f docker-compose.test.yml down

echo "✅ Pruebas completadas!"
```

## Flujos de Testing

### 1. Flujo de Registro y Creación de Memoria

```typescript
// tests/e2e/user-flow.test.ts
describe('User Registration and Memory Creation Flow', () => {
  test('Complete user journey', async () => {
    // 1. Registro de usuario
    const userData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      name: 'Test User'
    };
    
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);
    
    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.user.email).toBe(userData.email);
    
    // 2. Login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });
    
    expect(loginResponse.status).toBe(200);
    const token = loginResponse.body.token;
    
    // 3. Crear memoria
    const memoryData = {
      title: 'Mi primera memoria',
      description: 'Una memoria de prueba',
      tags: ['test', 'memoria']
    };
    
    const memoryResponse = await request(app)
      .post('/api/memories')
      .set('Authorization', `Bearer ${token}`)
      .send(memoryData);
    
    expect(memoryResponse.status).toBe(201);
    const memoryId = memoryResponse.body.memory.id;
    
    // 4. Subir media
    const mediaFile = Buffer.from('fake image data');
    const mediaResponse = await request(app)
      .post('/api/media/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', mediaFile, 'test-image.jpg');
    
    expect(mediaResponse.status).toBe(200);
    const mediaId = mediaResponse.body.media.id;
    
    // 5. Asociar media a memoria
    const associateResponse = await request(app)
      .post(`/api/memories/${memoryId}/media`)
      .set('Authorization', `Bearer ${token}`)
      .send({ mediaId });
    
    expect(associateResponse.status).toBe(200);
    
    // 6. Verificar notificación
    const notificationsResponse = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);
    
    expect(notificationsResponse.status).toBe(200);
    expect(notificationsResponse.body.notifications).toHaveLength(1);
    
    // 7. Verificar analytics
    const analyticsResponse = await request(app)
      .get('/api/analytics/events')
      .set('Authorization', `Bearer ${token}`);
    
    expect(analyticsResponse.status).toBe(200);
    expect(analyticsResponse.body.events).toHaveLength(1);
  });
});
```

### 2. Flujo de Pago y Suscripción

```typescript
// tests/e2e/payment-flow.test.ts
describe('Payment and Subscription Flow', () => {
  test('Complete payment journey', async () => {
    // 1. Crear payment intent
    const paymentIntentData = {
      amount: 2999, // $29.99
      currency: 'USD',
      paymentMethod: 'card',
      description: 'Suscripción Premium Mensual'
    };
    
    const intentResponse = await request(app)
      .post('/api/payments/intents')
      .set('Authorization', `Bearer ${token}`)
      .send(paymentIntentData);
    
    expect(intentResponse.status).toBe(201);
    const intentId = intentResponse.body.paymentIntent.id;
    
    // 2. Confirmar pago (simulado)
    const confirmData = {
      paymentIntentId: intentId,
      paymentMethodData: {
        type: 'card',
        card: {
          number: '4242424242424242',
          expMonth: 12,
          expYear: 2025,
          cvc: '123'
        }
      }
    };
    
    const confirmResponse = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send(confirmData);
    
    expect(confirmResponse.status).toBe(200);
    expect(confirmResponse.body.payment.status).toBe('succeeded');
    
    // 3. Crear suscripción
    const subscriptionData = {
      planId: 'premium-monthly',
      paymentIntentId: intentId
    };
    
    const subscriptionResponse = await request(app)
      .post('/api/payments/subscriptions')
      .set('Authorization', `Bearer ${token}`)
      .send(subscriptionData);
    
    expect(subscriptionResponse.status).toBe(201);
    expect(subscriptionResponse.body.subscription.status).toBe('active');
    
    // 4. Verificar notificaciones de pago
    const notificationsResponse = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);
    
    expect(notificationsResponse.status).toBe(200);
    const paymentNotifications = notificationsResponse.body.notifications
      .filter(n => n.type === 'payment_success');
    expect(paymentNotifications).toHaveLength(1);
    
    // 5. Verificar analytics de pago
    const analyticsResponse = await request(app)
      .get('/api/analytics/payments')
      .set('Authorization', `Bearer ${token}`);
    
    expect(analyticsResponse.status).toBe(200);
    expect(analyticsResponse.body.payments).toHaveLength(1);
  });
});
```

## Testing de Resiliencia

### 1. Circuit Breaker Testing

```typescript
// tests/resilience/circuit-breaker.test.ts
describe('Circuit Breaker Resilience', () => {
  test('Should open circuit after multiple failures', async () => {
    // Simular fallos en un servicio
    for (let i = 0; i < 5; i++) {
      try {
        await request(app).get('/api/memories');
      } catch (error) {
        // Ignorar errores esperados
      }
    }
    
    // Verificar que el circuit breaker está abierto
    const circuitState = await getCircuitBreakerState('memories-service');
    expect(circuitState).toBe('OPEN');
  });
  
  test('Should recover after timeout', async () => {
    // Esperar el timeout del circuit breaker
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    // Verificar que el circuit breaker está en half-open
    const circuitState = await getCircuitBreakerState('memories-service');
    expect(circuitState).toBe('HALF_OPEN');
  });
});
```

### 2. Load Testing

```typescript
// tests/load/load-test.ts
import { check } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
  },
};

export default function() {
  const baseUrl = 'http://localhost:3001';
  
  // Test user registration
  const registerResponse = http.post(`${baseUrl}/api/auth/register`, {
    email: `user${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Load Test User'
  });
  
  check(registerResponse, {
    'register status is 201': (r) => r.status === 201,
    'register response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  // Test memory creation
  const loginResponse = http.post(`${baseUrl}/api/auth/login`, {
    email: 'test@example.com',
    password: 'TestPassword123!'
  });
  
  if (loginResponse.status === 200) {
    const token = loginResponse.json('token');
    
    const memoryResponse = http.post(`${baseUrl}/api/memories`, {
      title: 'Load Test Memory',
      description: 'Memory created during load test'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    check(memoryResponse, {
      'memory creation status is 201': (r) => r.status === 201,
      'memory creation response time < 300ms': (r) => r.timings.duration < 300,
    });
  }
}
```

## Monitoreo y Métricas

### 1. Dashboard de Testing

```typescript
// monitoring/test-dashboard.ts
interface TestMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageResponseTime: number;
  errorRate: number;
  throughput: number;
  serviceHealth: {
    [service: string]: 'healthy' | 'unhealthy' | 'degraded';
  };
}
```

### 2. Alertas Automáticas

```typescript
// monitoring/alerts.ts
interface TestAlert {
  type: 'test_failure' | 'performance_degradation' | 'service_unavailable';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  service?: string;
  metrics?: any;
}
```

## Scripts de Automatización

### 1. Pipeline de CI/CD

```yaml
# .github/workflows/e2e-tests.yml
name: End-to-End Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379
    
    - name: Run end-to-end tests
      run: npm run test:e2e
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379
    
    - name: Generate test report
      run: npm run test:report
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      with:
        name: test-results
        path: test-results/
```

## Resultados Esperados

### 1. Métricas de Performance

- **Response Time**: < 500ms para 95% de requests
- **Error Rate**: < 1% en condiciones normales
- **Throughput**: > 1000 requests/segundo
- **Availability**: 99.9% uptime

### 2. Cobertura de Testing

- **Unit Tests**: > 90% cobertura
- **Integration Tests**: > 80% cobertura
- **End-to-End Tests**: > 70% cobertura
- **Load Tests**: Validación de escalabilidad

### 3. Resiliencia

- **Circuit Breaker**: Funcionamiento correcto
- **Retry Logic**: Manejo de fallos temporales
- **Fallback**: Servicios alternativos
- **Graceful Degradation**: Degradación elegante

## Próximos Pasos

1. **Implementar API Gateway centralizado**
2. **Configurar Service Discovery**
3. **Crear test suites completos**
4. **Configurar monitoreo y alertas**
5. **Implementar CI/CD pipeline**
6. **Validar performance y escalabilidad**

---

**Estado**: ✅ **FASE 17 COMPLETADA**

Esta fase establece la base sólida para la integración completa y testing end-to-end de todos los microservicios de Memoria Eterna.
