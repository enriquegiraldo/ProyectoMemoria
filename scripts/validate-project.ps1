# Script de validación del proyecto
# Memoria Eterna - Validación de Estructura

Write-Host "🔍 Validando estructura del proyecto Memoria Eterna..." -ForegroundColor Green

$errors = @()
$warnings = @()
$success = @()

# Verificar Node.js
Write-Host "📦 Verificando Node.js..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion está instalado" -ForegroundColor Green
    $success += "Node.js instalado"
} else {
    Write-Host "❌ Node.js no está instalado" -ForegroundColor Red
    $errors += "Node.js no instalado"
}

# Verificar estructura de directorios
Write-Host "📁 Verificando estructura de directorios..." -ForegroundColor Yellow

$requiredDirs = @(
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

foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        Write-Host "✅ $dir existe" -ForegroundColor Green
        $success += "Directorio $dir existe"
    } else {
        Write-Host "❌ $dir no existe" -ForegroundColor Red
        $errors += "Directorio $dir faltante"
    }
}

# Verificar archivos de configuración
Write-Host "📄 Verificando archivos de configuración..." -ForegroundColor Yellow

$requiredFiles = @(
    "docker-compose.test.yml",
    "prometheus.test.yml",
    "README.md",
    "RESUMEN_PROYECTO_COMPLETADO.md",
    "FASE17_COMPLETADA.md"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file existe" -ForegroundColor Green
        $success += "Archivo $file existe"
    } else {
        Write-Host "❌ $file no existe" -ForegroundColor Red
        $errors += "Archivo $file faltante"
    }
}

# Verificar package.json en microservicios
Write-Host "📦 Verificando package.json en microservicios..." -ForegroundColor Yellow

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
        $success += "Package.json en $service"
    } else {
        Write-Host "❌ $packageJson no existe" -ForegroundColor Red
        $errors += "Package.json faltante en $service"
    }
}

# Verificar Dockerfiles
Write-Host "🐳 Verificando Dockerfiles..." -ForegroundColor Yellow

foreach ($service in $services) {
    $dockerfile = "$service/Dockerfile"
    if (Test-Path $dockerfile) {
        Write-Host "✅ $dockerfile existe" -ForegroundColor Green
        $success += "Dockerfile en $service"
    } else {
        Write-Host "⚠️ $dockerfile no existe" -ForegroundColor Yellow
        $warnings += "Dockerfile faltante en $service"
    }
}

# Verificar archivos de configuración de Kubernetes
Write-Host "☸️ Verificando configuración de Kubernetes..." -ForegroundColor Yellow

$k8sFiles = @(
    "k8s/namespace.yaml",
    "k8s/configmaps/",
    "k8s/secrets/",
    "k8s/services/",
    "k8s/deployments/"
)

foreach ($file in $k8sFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file existe" -ForegroundColor Green
        $success += "K8s config $file"
    } else {
        Write-Host "⚠️ $file no existe" -ForegroundColor Yellow
        $warnings += "K8s config faltante $file"
    }
}

# Verificar scripts
Write-Host "📜 Verificando scripts..." -ForegroundColor Yellow

$scripts = @(
    "scripts/run-e2e-tests.sh",
    "scripts/test-simple.ps1",
    "scripts/validate-project.ps1"
)

foreach ($script in $scripts) {
    if (Test-Path $script) {
        Write-Host "✅ $script existe" -ForegroundColor Green
        $success += "Script $script"
    } else {
        Write-Host "⚠️ $script no existe" -ForegroundColor Yellow
        $warnings += "Script faltante $script"
    }
}

# Resumen
Write-Host ""
Write-Host "📊 RESUMEN DE VALIDACIÓN" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "✅ Éxitos: $($success.Count)" -ForegroundColor Green
Write-Host "⚠️ Advertencias: $($warnings.Count)" -ForegroundColor Yellow
Write-Host "❌ Errores: $($errors.Count)" -ForegroundColor Red

if ($errors.Count -eq 0) {
    Write-Host ""
    Write-Host "🎉 ¡PROYECTO VALIDADO EXITOSAMENTE!" -ForegroundColor Green
    Write-Host "Todos los componentes principales están presentes." -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "⚠️ Se encontraron errores que deben corregirse:" -ForegroundColor Yellow
    foreach ($err in $errors) {
        Write-Host "  - $err" -ForegroundColor Red
    }
}

if ($warnings.Count -gt 0) {
    Write-Host ""
    Write-Host "📝 Advertencias (opcionales):" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  - $warning" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🚀 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Instalar Docker Desktop para testing completo" -ForegroundColor White
Write-Host "2. Ejecutar: .\scripts\test-simple.ps1" -ForegroundColor White
Write-Host "3. Revisar documentación en README.md" -ForegroundColor White
