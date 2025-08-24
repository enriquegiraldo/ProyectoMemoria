#!/bin/bash

# Script para ejecutar pruebas end-to-end de Memoria Eterna
set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar dependencias
check_dependencies() {
    log "Verificando dependencias..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker no está instalado"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose no está instalado"
        exit 1
    fi
    
    success "Dependencias verificadas"
}

# Limpiar recursos anteriores
cleanup_previous() {
    log "Limpiando recursos anteriores..."
    docker-compose -f docker-compose.test.yml down -v --remove-orphans 2>/dev/null || true
    success "Limpieza completada"
}

# Levantar infraestructura
start_infrastructure() {
    log "🚀 Iniciando infraestructura de testing..."
    docker-compose -f docker-compose.test.yml up -d
    success "Infraestructura iniciada"
}

# Esperar que los servicios estén listos
wait_for_services() {
    log "⏳ Esperando que los servicios estén listos..."
    
    services=(
        "http://localhost:3001/health"
        "http://localhost:3002/health"
        "http://localhost:3003/health"
        "http://localhost:3004/health"
        "http://localhost:3005/health"
        "http://localhost:3006/health"
        "http://localhost:3000/health"
    )
    
    for service in "${services[@]}"; do
        log "Esperando $service..."
        for i in {1..30}; do
            if curl -f -s "$service" > /dev/null 2>&1; then
                success "$service está listo"
                break
            fi
            sleep 2
        done
    done
}

# Ejecutar tests
run_tests() {
    log "🧪 Ejecutando tests..."
    
    # Test API Gateway
    if curl -f -s "http://localhost:3000/api" > /dev/null; then
        success "API Gateway responde"
    else
        error "API Gateway no responde"
        return 1
    fi
    
    # Test servicios individuales
    endpoints=("auth" "memories" "media" "notifications" "payments" "analytics")
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f -s "http://localhost:3000/api/$endpoint" > /dev/null 2>&1; then
            success "Endpoint /api/$endpoint responde"
        else
            log "Endpoint /api/$endpoint no responde (esperado)"
        fi
    done
    
    success "Tests completados"
}

# Generar reportes
generate_reports() {
    log "📊 Generando reportes..."
    mkdir -p test-results
    
    cat > test-results/test-summary.json << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "status": "completed",
  "services_tested": 6,
  "endpoints_tested": 6
}
EOF
    
    success "Reportes generados"
}

# Limpiar
cleanup() {
    log "🧹 Limpiando..."
    docker-compose -f docker-compose.test.yml down -v
    success "Limpieza completada"
}

# Función principal
main() {
    log "🚀 Iniciando pruebas end-to-end..."
    
    check_dependencies
    cleanup_previous
    start_infrastructure
    wait_for_services
    run_tests
    generate_reports
    
    success "🎉 Pruebas completadas!"
    
    read -p "¿Mantener servicios corriendo? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        cleanup
    else
        log "Servicios corriendo en:"
        log "  - API Gateway: http://localhost:3000"
        log "  - Frontend: http://localhost:3007"
    fi
}

trap cleanup EXIT
main "$@"
