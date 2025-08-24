# Script de migración para Memoria Eterna
# Automatiza el proceso de preparación del proyecto para transferencia

Write-Host "🚀 PREPARANDO PROYECTO PARA MIGRACIÓN - MEMORIA ETERNA" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
Write-Host ""

# Verificar si estamos en el directorio correcto
if (-not (Test-Path "src/microservices")) {
    Write-Host "❌ Error: No se encontró la estructura del proyecto" -ForegroundColor Red
    Write-Host "   Ejecuta este script desde el directorio raíz del proyecto" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Directorio del proyecto verificado" -ForegroundColor Green

# Crear .gitignore si no existe
if (-not (Test-Path ".gitignore")) {
    Write-Host "📝 Creando archivo .gitignore..." -ForegroundColor Yellow
    
    $gitignoreContent = @"
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.*.local
.env.development
.env.test
.env.production

# Build outputs
dist/
build/
out/

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Docker
.dockerignore

# Kubernetes
*.kubeconfig

# Test results
test-results/
coverage/
"@

    $gitignoreContent | Out-File -FilePath ".gitignore" -Encoding UTF8
    Write-Host "✅ Archivo .gitignore creado" -ForegroundColor Green
} else {
    Write-Host "✅ Archivo .gitignore ya existe" -ForegroundColor Green
}

# Crear archivo de configuración de migración
Write-Host "📝 Creando archivo de configuración de migración..." -ForegroundColor Yellow

$migrationConfig = @{
    project_name = "Memoria Eterna"
    version = "1.0.0"
    migration_date = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    requirements = @{
        docker = "20.10+"
        docker_compose = "2.0+"
        nodejs = "18.0+"
        npm = "8.0+"
        git = "2.30+"
    }
    services = @(
        "auth-service",
        "memories-service", 
        "media-service",
        "notifications-service",
        "analytics-service",
        "api-gateway"
    )
    ports = @{
        api_gateway = 3000
        frontend = 3007
        prometheus = 9091
        grafana = 3008
        mailhog = 8025
        postgres = 5432
        redis = 6379
    }
    directories = @(
        "src/microservices",
        "src/api-gateway", 
        "frontend",
        "k8s",
        "scripts",
        "test-results"
    )
}

$migrationConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath "migration-config.json" -Encoding UTF8
Write-Host "✅ Archivo de configuración de migración creado" -ForegroundColor Green

# Crear script de instalación para la PC destino
Write-Host "📝 Creando script de instalación para PC destino..." -ForegroundColor Yellow

$installScript = @"
#!/bin/bash
# Script de instalación para Memoria Eterna
# Ejecutar en WSL Ubuntu en la PC destino

echo "🚀 INSTALANDO MEMORIA ETERNA"
echo "============================"

# Verificar si estamos en WSL
if [[ ! -f /proc/version ]] || ! grep -q Microsoft /proc/version; then
    echo "❌ Error: Este script debe ejecutarse en WSL"
    exit 1
fi

# Actualizar sistema
echo "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
echo "📦 Instalando Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar Git
echo "📦 Instalando Git..."
sudo apt install git -y

# Verificar instalaciones
echo "✅ Verificando instalaciones..."
node --version
npm --version
git --version

# Instalar dependencias del proyecto
echo "📦 Instalando dependencias..."
cd memoria-eterna

# Instalar en cada servicio
for service in auth-service memories-service media-service notifications-service analytics-service; do
    echo "Instalando dependencias en $service..."
    cd src/microservices/$service && npm install && cd ../../..
done

echo "Instalando dependencias en api-gateway..."
cd src/api-gateway && npm install && cd ../..

echo "Instalando dependencias en frontend..."
cd frontend && npm install && cd ..

# Configurar variables de entorno
echo "⚙️ Configurando variables de entorno..."
for service in auth-service memories-service media-service notifications-service analytics-service; do
    if [ -f "src/microservices/$service/.env.example" ]; then
        cp "src/microservices/$service/.env.example" "src/microservices/$service/.env"
        echo "✅ Configurado $service"
    fi
done

if [ -f "src/api-gateway/.env.example" ]; then
    cp "src/api-gateway/.env.example" "src/api-gateway/.env"
    echo "✅ Configurado api-gateway"
fi

echo ""
echo "🎉 INSTALACIÓN COMPLETADA"
echo "========================="
echo "Próximos pasos:"
echo "1. Instalar Docker Desktop"
echo "2. Configurar Docker para usar WSL2"
echo "3. Ejecutar: docker-compose -f docker-compose.test.yml up -d"
echo "4. Acceder a: http://localhost:3000"
"@

$installScript | Out-File -FilePath "install-memoria-eterna.sh" -Encoding UTF8
Write-Host "✅ Script de instalación creado" -ForegroundColor Green

# Crear archivo README de migración
Write-Host "📝 Creando README de migración..." -ForegroundColor Yellow

$migrationReadme = @"
# 🚀 MIGRACIÓN - MEMORIA ETERNA

## 📦 CONTENIDO DEL PAQUETE

Este paquete contiene todo lo necesario para migrar el proyecto **Memoria Eterna** a otra PC.

### Archivos incluidos:
- `migration-config.json` - Configuración del proyecto
- `install-memoria-eterna.sh` - Script de instalación automática
- `MIGRACION_PASOS.md` - Guía detallada de migración
- `GUIA_MIGRACION.md` - Guía completa (si existe)

## 🛠️ REQUISITOS EN PC DESTINO

### Software necesario:
- **Windows 10/11** con WSL2 habilitado
- **Docker Desktop** configurado para WSL2
- **Git** (se instala automáticamente)
- **Node.js 18+** (se instala automáticamente)

### Hardware recomendado:
- **RAM:** 8GB mínimo, 16GB recomendado
- **Almacenamiento:** 10GB libres
- **CPU:** 4 cores mínimo

## 🚀 INSTALACIÓN RÁPIDA

### Paso 1: Preparar WSL2
```powershell
# En PowerShell como administrador
wsl --install
```

### Paso 2: Instalar Docker Desktop
- Descargar desde: https://www.docker.com/products/docker-desktop/
- Instalar y configurar para WSL2

### Paso 3: Transferir proyecto
```bash
# En WSL Ubuntu
cd ~
# Copiar proyecto aquí
```

### Paso 4: Instalar automáticamente
```bash
# En WSL Ubuntu
chmod +x install-memoria-eterna.sh
./install-memoria-eterna.sh
```

### Paso 5: Iniciar proyecto
```bash
docker-compose -f docker-compose.test.yml up -d
```

## 🌐 ACCESO A SERVICIOS

Una vez iniciado:
- **API Gateway:** http://localhost:3000
- **Frontend:** http://localhost:3007
- **Prometheus:** http://localhost:9091
- **Grafana:** http://localhost:3008 (admin/admin)
- **MailHog:** http://localhost:8025

## 📞 SOPORTE

Si encuentras problemas:
1. Revisar `MIGRACION_PASOS.md` para solución de problemas
2. Verificar que Docker Desktop esté configurado para WSL2
3. Asegurar que los puertos no estén ocupados

---

**¡Memoria Eterna está listo para preservar recuerdos digitales! 🌟**
"@

$migrationReadme | Out-File -FilePath "README-MIGRACION.md" -Encoding UTF8
Write-Host "✅ README de migración creado" -ForegroundColor Green

# Crear archivo de verificación
Write-Host "📝 Creando script de verificación..." -ForegroundColor Yellow

$verifyScript = @"
#!/bin/bash
# Script de verificación para Memoria Eterna

echo "🔍 VERIFICANDO INSTALACIÓN - MEMORIA ETERNA"
echo "=========================================="

# Verificar Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker instalado: $(docker --version)"
else
    echo "❌ Docker no está instalado"
fi

# Verificar Docker Compose
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose instalado: $(docker-compose --version)"
else
    echo "❌ Docker Compose no está instalado"
fi

# Verificar Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js instalado: $(node --version)"
else
    echo "❌ Node.js no está instalado"
fi

# Verificar npm
if command -v npm &> /dev/null; then
    echo "✅ npm instalado: $(npm --version)"
else
    echo "❌ npm no está instalado"
fi

# Verificar estructura del proyecto
echo ""
echo "📁 Verificando estructura del proyecto..."

directories=("src/microservices" "src/api-gateway" "frontend" "k8s" "scripts")
for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir existe"
    else
        echo "❌ $dir no existe"
    fi
done

# Verificar archivos importantes
echo ""
echo "📄 Verificando archivos importantes..."

files=("docker-compose.test.yml" "README.md" "package.json")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file existe"
    else
        echo "❌ $file no existe"
    fi
done

# Verificar servicios
echo ""
echo "🔧 Verificando servicios..."

services=("auth-service" "memories-service" "media-service" "notifications-service" "analytics-service")
for service in "${services[@]}"; do
    if [ -d "src/microservices/$service" ]; then
        if [ -f "src/microservices/$service/package.json" ]; then
            echo "✅ $service - implementado"
        else
            echo "⚠️ $service - directorio existe pero sin package.json"
        fi
    else
        echo "❌ $service - no implementado"
    fi
done

echo ""
echo "🎉 Verificación completada"
"@

$verifyScript | Out-File -FilePath "verify-installation.sh" -Encoding UTF8
Write-Host "✅ Script de verificación creado" -ForegroundColor Green

# Mostrar resumen
Write-Host ""
Write-Host "🎉 PREPARACIÓN PARA MIGRACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Archivos creados:" -ForegroundColor Cyan
Write-Host "• .gitignore - Configuración de Git" -ForegroundColor White
Write-Host "• migration-config.json - Configuración del proyecto" -ForegroundColor White
Write-Host "• install-memoria-eterna.sh - Script de instalación automática" -ForegroundColor White
Write-Host "• README-MIGRACION.md - Guía de migración" -ForegroundColor White
Write-Host "• verify-installation.sh - Script de verificación" -ForegroundColor White
Write-Host ""
Write-Host "📦 Opciones de transferencia:" -ForegroundColor Cyan
Write-Host "1. Git (recomendado): Crear repositorio y subir" -ForegroundColor White
Write-Host "2. USB/Disco: Copiar toda la carpeta del proyecto" -ForegroundColor White
Write-Host "3. Nube: Subir a Google Drive, OneDrive, etc." -ForegroundColor White
Write-Host ""
Write-Host "🚀 En la PC destino:" -ForegroundColor Cyan
Write-Host "1. Instalar WSL2 y Docker Desktop" -ForegroundColor White
Write-Host "2. Ejecutar: chmod +x install-memoria-eterna.sh" -ForegroundColor White
Write-Host "3. Ejecutar: ./install-memoria-eterna.sh" -ForegroundColor White
Write-Host "4. Ejecutar: docker-compose -f docker-compose.test.yml up -d" -ForegroundColor White
Write-Host ""
Write-Host "✅ ¡El proyecto está listo para migrar!" -ForegroundColor Green
