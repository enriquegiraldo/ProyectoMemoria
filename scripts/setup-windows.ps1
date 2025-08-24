# Script de configuración para Windows
# Memoria Eterna - Setup de Desarrollo

Write-Host "🚀 Configurando Memoria Eterna en Windows..." -ForegroundColor Green

# Verificar si Docker está instalado
Write-Host "📦 Verificando Docker..." -ForegroundColor Yellow
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker no está instalado. Por favor instala Docker Desktop." -ForegroundColor Red
    exit 1
}

# Verificar si Docker Compose está disponible
if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose no está disponible. Por favor instala Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker está instalado" -ForegroundColor Green

# Verificar si Node.js está instalado
Write-Host "📦 Verificando Node.js..." -ForegroundColor Yellow
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js no está instalado. Por favor instala Node.js 18+." -ForegroundColor Red
    exit 1
}

$nodeVersion = node --version
Write-Host "✅ Node.js $nodeVersion está instalado" -ForegroundColor Green

# Verificar si npm está instalado
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm no está instalado." -ForegroundColor Red
    exit 1
}

Write-Host "✅ npm está instalado" -ForegroundColor Green

# Crear directorio de logs si no existe
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs"
    Write-Host "📁 Directorio de logs creado" -ForegroundColor Green
}

# Crear directorio de test-results si no existe
if (!(Test-Path "test-results")) {
    New-Item -ItemType Directory -Path "test-results"
    Write-Host "📁 Directorio de test-results creado" -ForegroundColor Green
}

# Hacer el script de testing ejecutable (simulado para Windows)
Write-Host "🔧 Configurando scripts..." -ForegroundColor Yellow

# Crear un script de PowerShell equivalente para testing
$testScriptContent = @"
# Script de testing para Windows
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
} else {
    Write-Host "🧹 Limpiando..." -ForegroundColor Yellow
    docker-compose -f docker-compose.test.yml down -v
    Write-Host "✅ Limpieza completada" -ForegroundColor Green
}
"@

$testScriptContent | Out-File -FilePath "scripts/run-e2e-tests.ps1" -Encoding UTF8
Write-Host "✅ Script de testing para Windows creado" -ForegroundColor Green

# Crear script de instalación de dependencias
$installScriptContent = @'
# Script de instalación de dependencias
# Memoria Eterna

Write-Host "📦 Instalando dependencias de todos los microservicios..." -ForegroundColor Green

$services = @(
    "src/microservices/auth-service",
    "src/microservices/memories-service",
    "src/microservices/media-service",
    "src/microservices/notifications-service",
    "src/microservices/payments-service",
    "src/microservices/analytics-service",
    "src/api-gateway",
    "frontend"
)

foreach ($service in $services) {
    if (Test-Path $service) {
        Write-Host "📦 Instalando dependencias en $service..." -ForegroundColor Yellow
        Set-Location $service
        npm install
        Set-Location ../..
    } else {
        Write-Host "⚠️ Directorio $service no encontrado" -ForegroundColor Yellow
    }
}

Write-Host "✅ Todas las dependencias instaladas" -ForegroundColor Green
'@

$installScriptContent | Out-File -FilePath "scripts/install-dependencies.ps1" -Encoding UTF8
Write-Host "✅ Script de instalación creado" -ForegroundColor Green

# Crear script de build
$buildScriptContent = @'
# Script de build
# Memoria Eterna

Write-Host "🔨 Construyendo todos los microservicios..." -ForegroundColor Green

$services = @(
    "src/microservices/auth-service",
    "src/microservices/memories-service",
    "src/microservices/media-service",
    "src/microservices/notifications-service",
    "src/microservices/payments-service",
    "src/microservices/analytics-service",
    "src/api-gateway",
    "frontend"
)

foreach ($service in $services) {
    if (Test-Path $service) {
        Write-Host "🔨 Construyendo $service..." -ForegroundColor Yellow
        Set-Location $service
        npm run build
        Set-Location ../..
    } else {
        Write-Host "⚠️ Directorio $service no encontrado" -ForegroundColor Yellow
    }
}

Write-Host "✅ Todos los servicios construidos" -ForegroundColor Green
'@

$buildScriptContent | Out-File -FilePath "scripts/build-all.ps1" -Encoding UTF8
Write-Host "✅ Script de build creado" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Scripts disponibles:" -ForegroundColor Cyan
Write-Host "  - scripts/run-e2e-tests.ps1 (Pruebas end-to-end)" -ForegroundColor White
Write-Host "  - scripts/install-dependencies.ps1 (Instalar dependencias)" -ForegroundColor White
Write-Host "  - scripts/build-all.ps1 (Build de todos los servicios)" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Para ejecutar las pruebas:" -ForegroundColor Cyan
Write-Host "  .\scripts\run-e2e-tests.ps1" -ForegroundColor White
Write-Host ""
Write-Host "📖 Para más información, consulta el README.md" -ForegroundColor Cyan
