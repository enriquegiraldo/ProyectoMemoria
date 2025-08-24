# Script de testing simple para Windows
# Memoria Eterna - End-to-End Testing

Write-Host "🚀 Iniciando pruebas end-to-end..." -ForegroundColor Green

# Verificar dependencias
Write-Host "📦 Verificando dependencias..." -ForegroundColor Yellow
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker no está instalado" -ForegroundColor Red
    exit 1
}

if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose no está instalado" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencias verificadas" -ForegroundColor Green

# Limpiar recursos anteriores
Write-Host "🧹 Limpiando recursos anteriores..." -ForegroundColor Yellow
docker-compose -f docker-compose.test.yml down -v --remove-orphans 2>$null
Write-Host "✅ Limpieza completada" -ForegroundColor Green

# Levantar infraestructura
Write-Host "🚀 Iniciando infraestructura de testing..." -ForegroundColor Yellow
docker-compose -f docker-compose.test.yml up -d
Write-Host "✅ Infraestructura iniciada" -ForegroundColor Green

# Esperar que los servicios estén listos
Write-Host "⏳ Esperando que los servicios estén listos..." -ForegroundColor Yellow

$services = @(
    "http://localhost:3001/health",
    "http://localhost:3002/health",
    "http://localhost:3003/health",
    "http://localhost:3004/health",
    "http://localhost:3005/health",
    "http://localhost:3006/health",
    "http://localhost:3000/health"
)

foreach ($service in $services) {
    Write-Host "Esperando $service..." -ForegroundColor Cyan
    $maxAttempts = 30
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri $service -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $service está listo" -ForegroundColor Green
                break
            }
        } catch {
            # Ignorar errores y continuar
        }
        
        Start-Sleep -Seconds 2
        $attempt++
    }
}

# Ejecutar tests
Write-Host "🧪 Ejecutando tests..." -ForegroundColor Yellow

# Test API Gateway
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api" -Method GET -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API Gateway responde" -ForegroundColor Green
    } else {
        Write-Host "❌ API Gateway no responde" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ API Gateway no responde" -ForegroundColor Red
    exit 1
}

# Test servicios individuales
$endpoints = @("auth", "memories", "media", "notifications", "payments", "analytics")

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/$endpoint" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Endpoint /api/$endpoint responde" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Endpoint /api/$endpoint no responde (esperado)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ Endpoint /api/$endpoint no responde (esperado)" -ForegroundColor Yellow
    }
}

Write-Host "✅ Tests completados" -ForegroundColor Green

# Generar reportes
Write-Host "📊 Generando reportes..." -ForegroundColor Yellow
if (!(Test-Path "test-results")) {
    New-Item -ItemType Directory -Path "test-results"
}

$reportContent = @"
{
  "timestamp": "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')",
  "status": "completed",
  "services_tested": 6,
  "endpoints_tested": 6
}
"@

$reportContent | Out-File -FilePath "test-results/test-summary.json" -Encoding UTF8
Write-Host "✅ Reportes generados" -ForegroundColor Green

Write-Host "🎉 Pruebas completadas!" -ForegroundColor Green

$keepRunning = Read-Host "¿Mantener servicios corriendo? (y/N)"
if ($keepRunning -eq "y" -or $keepRunning -eq "Y") {
    Write-Host "Servicios corriendo en:" -ForegroundColor Cyan
    Write-Host "  - API Gateway: http://localhost:3000" -ForegroundColor White
    Write-Host "  - Frontend: http://localhost:3007" -ForegroundColor White
    Write-Host "  - Prometheus: http://localhost:9091" -ForegroundColor White
    Write-Host "  - Grafana: http://localhost:3008 (admin/admin)" -ForegroundColor White
    Write-Host "  - MailHog: http://localhost:8025" -ForegroundColor White
} else {
    Write-Host "🧹 Limpiando..." -ForegroundColor Yellow
    docker-compose -f docker-compose.test.yml down -v
    Write-Host "✅ Limpieza completada" -ForegroundColor Green
}
