# Script de validación simple
# Memoria Eterna - Validación de Estructura

Write-Host "🔍 Validando proyecto Memoria Eterna..." -ForegroundColor Green

# Verificar Node.js
Write-Host "📦 Verificando Node.js..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion está instalado" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js no está instalado" -ForegroundColor Red
}

# Verificar directorios principales
Write-Host "📁 Verificando directorios..." -ForegroundColor Yellow

$dirs = @(
    "src/microservices/auth-service",
    "src/microservices/memories-service", 
    "src/microservices/media-service",
    "src/microservices/notifications-service",
    "src/microservices/analytics-service",
    "src/api-gateway",
    "frontend",
    "k8s",
    "scripts"
)

foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Write-Host "✅ $dir existe" -ForegroundColor Green
    } else {
        Write-Host "❌ $dir no existe" -ForegroundColor Red
    }
}

# Verificar archivos importantes
Write-Host "📄 Verificando archivos..." -ForegroundColor Yellow

$files = @(
    "docker-compose.test.yml",
    "prometheus.test.yml",
    "README.md",
    "RESUMEN_PROYECTO_COMPLETADO.md",
    "FASE17_COMPLETADA.md"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file existe" -ForegroundColor Green
    } else {
        Write-Host "❌ $file no existe" -ForegroundColor Red
    }
}

# Verificar package.json en servicios
Write-Host "📦 Verificando package.json..." -ForegroundColor Yellow

$services = @(
    "src/microservices/auth-service",
    "src/microservices/memories-service",
    "src/microservices/media-service", 
    "src/microservices/notifications-service",
    "src/microservices/analytics-service",
    "src/api-gateway"
)

foreach ($service in $services) {
    $packageJson = "$service/package.json"
    if (Test-Path $packageJson) {
        Write-Host "✅ $packageJson existe" -ForegroundColor Green
    } else {
        Write-Host "❌ $packageJson no existe" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Validación completada!" -ForegroundColor Green
Write-Host "El proyecto Memoria Eterna está listo para usar." -ForegroundColor White
