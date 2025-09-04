# Script de validación para producción - Memoria Eterna
# Ejecutar antes del deploy a producción

param(
    [switch]$Fix,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

Write-Host "🔍 VALIDACIÓN DE PRODUCCIÓN - MEMORIA ETERNA" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$issues = @()
$warnings = @()
$success = @()

# Función para agregar problemas
function Add-Issue {
    param($Type, $Message, $Severity = "Warning")
    if ($Severity -eq "Error") {
        $issues += "❌ $Message"
    } elseif ($Severity -eq "Warning") {
        $warnings += "⚠️ $Message"
    } else {
        $success += "✅ $Message"
    }
}

# 1. Verificar estructura del proyecto
Write-Host "📁 Verificando estructura del proyecto..." -ForegroundColor Yellow

$requiredFiles = @(
    "package.json",
    "docker-compose.yml",
    "docker-compose.test.yml",
    ".env.example",
    "README.md"
)

$requiredDirs = @(
    "src/microservices",
    "src/api-gateway",
    "frontend",
    "scripts",
    "k8s"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Add-Issue -Type "File" -Message "Archivo $file encontrado" -Severity "Success"
    } else {
        Add-Issue -Type "File" -Message "Archivo $file faltante" -Severity "Error"
    }
}

foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        Add-Issue -Type "Directory" -Message "Directorio $dir encontrado" -Severity "Success"
    } else {
        Add-Issue -Type "Directory" -Message "Directorio $dir faltante" -Severity "Error"
    }
}

# 2. Verificar microservicios
Write-Host "🔧 Verificando microservicios..." -ForegroundColor Yellow

$microservices = @(
    "auth-service",
    "memories-service", 
    "media-service",
    "notifications-service",
    "payments-service",
    "analytics-service"
)

foreach ($service in $microservices) {
    $servicePath = "src/microservices/$service"
    if (Test-Path $servicePath) {
        $packageJson = "$servicePath/package.json"
        $dockerfile = "$servicePath/Dockerfile"
        $envExample = "$servicePath/.env.example"
        
        if (Test-Path $packageJson) {
            Add-Issue -Type "Service" -Message "$service: package.json encontrado" -Severity "Success"
        } else {
            Add-Issue -Type "Service" -Message "$service: package.json faltante" -Severity "Error"
        }
        
        if (Test-Path $dockerfile) {
            Add-Issue -Type "Service" -Message "$service: Dockerfile encontrado" -Severity "Success"
        } else {
            Add-Issue -Type "Service" -Message "$service: Dockerfile faltante" -Severity "Warning"
        }
        
        if (Test-Path $envExample) {
            Add-Issue -Type "Service" -Message "$service: .env.example encontrado" -Severity "Success"
        } else {
            Add-Issue -Type "Service" -Message "$service: .env.example faltante" -Severity "Warning"
        }
    } else {
        Add-Issue -Type "Service" -Message "Microservicio $service no encontrado" -Severity "Error"
    }
}

# 3. Verificar dependencias
Write-Host "📦 Verificando dependencias..." -ForegroundColor Yellow

if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    
    # Verificar dependencias críticas
    $criticalDeps = @{
        "next" = "14.2.15"
        "react" = "18.3.1"
        "@prisma/client" = "6.14.0"
        "typescript" = "5.9.2"
    }
    
    foreach ($dep in $criticalDeps.GetEnumerator()) {
        $currentVersion = $packageJson.dependencies.($dep.Key)
        if ($currentVersion) {
            Add-Issue -Type "Dependency" -Message "$($dep.Key): $currentVersion" -Severity "Success"
            
            # Verificar si necesita actualización
            if ($currentVersion -lt $dep.Value) {
                Add-Issue -Type "Dependency" -Message "$($dep.Key) puede actualizarse a $($dep.Value)" -Severity "Warning"
            }
        } else {
            Add-Issue -Type "Dependency" -Message "Dependencia $($dep.Key) faltante" -Severity "Error"
        }
    }
}

# 4. Verificar configuración de seguridad
Write-Host "🔐 Verificando configuración de seguridad..." -ForegroundColor Yellow

if (Test-Path ".env.example") {
    $envContent = Get-Content ".env.example" -Raw
    
    # Verificar credenciales por defecto
    $defaultCredentials = @(
        "postgres",
        "default-secret",
        "your-",
        "test-"
    )
    
    foreach ($cred in $defaultCredentials) {
        if ($envContent -match $cred) {
            Add-Issue -Type "Security" -Message "Credencial por defecto encontrada: $cred" -Severity "Error"
        }
    }
    
    # Verificar variables críticas
    $criticalVars = @(
        "DATABASE_URL",
        "JWT_SECRET",
        "NEXTAUTH_SECRET",
        "STRIPE_SECRET_KEY"
    )
    
    foreach ($var in $criticalVars) {
        if ($envContent -match $var) {
            Add-Issue -Type "Security" -Message "Variable $var configurada" -Severity "Success"
        } else {
            Add-Issue -Type "Security" -Message "Variable $var faltante" -Severity "Warning"
        }
    }
}

# 5. Verificar Docker
Write-Host "🐳 Verificando configuración Docker..." -ForegroundColor Yellow

if (Test-Path "docker-compose.yml") {
    Add-Issue -Type "Docker" -Message "docker-compose.yml encontrado" -Severity "Success"
    
    # Verificar servicios en docker-compose
    $composeContent = Get-Content "docker-compose.yml" -Raw
    if ($composeContent -match "postgres") {
        Add-Issue -Type "Docker" -Message "Servicio PostgreSQL configurado" -Severity "Success"
    }
    if ($composeContent -match "redis") {
        Add-Issue -Type "Docker" -Message "Servicio Redis configurado" -Severity "Success"
    }
}

if (Test-Path "docker-compose.test.yml") {
    Add-Issue -Type "Docker" -Message "docker-compose.test.yml encontrado" -Severity "Success"
}

# 6. Verificar Kubernetes
Write-Host "☸️ Verificando configuración Kubernetes..." -ForegroundColor Yellow

if (Test-Path "k8s") {
    $k8sFiles = Get-ChildItem "k8s" -Recurse -File
    if ($k8sFiles.Count -gt 0) {
        Add-Issue -Type "Kubernetes" -Message "Configuraciones Kubernetes encontradas ($($k8sFiles.Count) archivos)" -Severity "Success"
    } else {
        Add-Issue -Type "Kubernetes" -Message "Directorio k8s vacío" -Severity "Warning"
    }
} else {
    Add-Issue -Type "Kubernetes" -Message "Directorio k8s faltante" -Severity "Warning"
}

# 7. Verificar scripts
Write-Host "📜 Verificando scripts..." -ForegroundColor Yellow

$requiredScripts = @(
    "install-memoria-eterna.sh",
    "scripts/validate-project.ps1",
    "scripts/setup-windows.ps1"
)

foreach ($script in $requiredScripts) {
    if (Test-Path $script) {
        Add-Issue -Type "Script" -Message "Script $script encontrado" -Severity "Success"
    } else {
        Add-Issue -Type "Script" -Message "Script $script faltante" -Severity "Warning"
    }
}

# 8. Verificar documentación
Write-Host "📚 Verificando documentación..." -ForegroundColor Yellow

$docs = @(
    "README.md",
    "RESUMEN_PROYECTO_COMPLETADO.md",
    "ANALISIS_PRODUCCION.md"
)

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Add-Issue -Type "Documentation" -Message "Documento $doc encontrado" -Severity "Success"
    } else {
        Add-Issue -Type "Documentation" -Message "Documento $doc faltante" -Severity "Warning"
    }
}

# Mostrar resultados
Write-Host ""
Write-Host "📊 RESULTADOS DE LA VALIDACIÓN" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

if ($success.Count -gt 0) {
    Write-Host "✅ ÉXITOS ($($success.Count)):" -ForegroundColor Green
    foreach ($item in $success) {
        Write-Host "  $item" -ForegroundColor Green
    }
    Write-Host ""
}

if ($warnings.Count -gt 0) {
    Write-Host "⚠️ ADVERTENCIAS ($($warnings.Count)):" -ForegroundColor Yellow
    foreach ($item in $warnings) {
        Write-Host "  $item" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($issues.Count -gt 0) {
    Write-Host "❌ ERRORES ($($issues.Count)):" -ForegroundColor Red
    foreach ($item in $issues) {
        Write-Host "  $item" -ForegroundColor Red
    }
    Write-Host ""
}

# Resumen final
$totalChecks = $success.Count + $warnings.Count + $issues.Count
$successRate = [math]::Round(($success.Count / $totalChecks) * 100, 1)

Write-Host "📈 RESUMEN FINAL:" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host "Total de verificaciones: $totalChecks" -ForegroundColor White
Write-Host "Éxitos: $($success.Count)" -ForegroundColor Green
Write-Host "Advertencias: $($warnings.Count)" -ForegroundColor Yellow
Write-Host "Errores: $($issues.Count)" -ForegroundColor Red
Write-Host "Tasa de éxito: $successRate%" -ForegroundColor White
Write-Host ""

if ($issues.Count -eq 0) {
    Write-Host "🎉 ¡PROYECTO LISTO PARA PRODUCCIÓN!" -ForegroundColor Green
    Write-Host "Solo hay advertencias menores que pueden resolverse antes del deploy." -ForegroundColor Green
} elseif ($issues.Count -lt 5) {
    Write-Host "⚠️ PROYECTO CASI LISTO PARA PRODUCCIÓN" -ForegroundColor Yellow
    Write-Host "Resuelve los errores críticos antes del deploy." -ForegroundColor Yellow
} else {
    Write-Host "❌ PROYECTO NO LISTO PARA PRODUCCIÓN" -ForegroundColor Red
    Write-Host "Resuelve todos los errores críticos antes del deploy." -ForegroundColor Red
}

Write-Host ""
Write-Host "🔧 PRÓXIMOS PASOS:" -ForegroundColor Cyan
Write-Host "1. Resuelve todos los errores críticos" -ForegroundColor White
Write-Host "2. Revisa las advertencias" -ForegroundColor White
Write-Host "3. Ejecuta tests completos" -ForegroundColor White
Write-Host "4. Configura entorno de producción" -ForegroundColor White
Write-Host "5. Deploy en staging primero" -ForegroundColor White

if ($Verbose) {
    Write-Host ""
    Write-Host "📋 DETALLES ADICIONALES:" -ForegroundColor Cyan
    Write-Host "=======================" -ForegroundColor Cyan
    
    # Verificar tamaño del proyecto
    $projectSize = (Get-ChildItem -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "Tamaño del proyecto: $([math]::Round($projectSize, 2)) MB" -ForegroundColor White
    
    # Verificar archivos más grandes
    $largeFiles = Get-ChildItem -Recurse -File | Sort-Object Length -Descending | Select-Object -First 5
    Write-Host "Archivos más grandes:" -ForegroundColor White
    foreach ($file in $largeFiles) {
        $sizeMB = [math]::Round($file.Length / 1MB, 2)
        Write-Host "  $($file.Name): $sizeMB MB" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✅ Validación completada" -ForegroundColor Green
