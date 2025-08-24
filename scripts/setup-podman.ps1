# Script de configuración del entorno de desarrollo para Memoria Eterna con Podman (Windows)
# Este script configura todo lo necesario para comenzar a desarrollar usando Podman

Write-Host "🚀 Configurando entorno de desarrollo para Memoria Eterna con Podman..." -ForegroundColor Blue

# Función para imprimir mensajes con colores
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Verificar si Podman está instalado
try {
    $podmanVersion = podman --version
    Write-Success "Podman detectado: $podmanVersion"
} catch {
    Write-Error "Podman no está instalado. Por favor instala Podman Desktop desde: https://podman.io/getting-started/installation#windows"
    exit 1
}

# Verificar si podman-compose está instalado
try {
    $composeVersion = podman-compose --version
    Write-Success "Podman Compose detectado: $composeVersion"
} catch {
    Write-Warning "podman-compose no está instalado. Instalando..."
    try {
        pip install podman-compose
        Write-Success "Podman Compose instalado correctamente"
    } catch {
        Write-Error "No se pudo instalar podman-compose. Instálalo manualmente: pip install podman-compose"
        exit 1
    }
}

# Verificar si Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Success "Node.js: $nodeVersion"
} catch {
    Write-Error "Node.js no está instalado. Por favor instala Node.js 18+"
    exit 1
}

# Verificar si npm está instalado
try {
    $npmVersion = npm --version
    Write-Success "npm: $npmVersion"
} catch {
    Write-Error "npm no está instalado. Por favor instala npm"
    exit 1
}

# Iniciar Podman machine si es necesario
Write-Status "Verificando estado de Podman machine..."
try {
    $machineStatus = podman machine list | Select-String "Running"
    if (-not $machineStatus) {
        Write-Status "Iniciando Podman machine..."
        podman machine start
        Write-Success "Podman machine iniciada"
    } else {
        Write-Success "Podman machine ya está ejecutándose"
    }
} catch {
    Write-Warning "No se pudo verificar el estado de Podman machine"
}

# Instalar dependencias
Write-Status "Instalando dependencias..."
npm install

# Copiar archivo de variables de entorno
if (-not (Test-Path ".env")) {
    Write-Status "Creando archivo .env desde .env.example..."
    if (Test-Path "env.example") {
        Copy-Item "env.example" ".env"
        Write-Success "Archivo .env creado. Por favor configura las variables de entorno"
    } else {
        Write-Warning "Archivo env.example no encontrado. Crea manualmente el archivo .env"
    }
} else {
    Write-Success "Archivo .env ya existe"
}

# Generar cliente de Prisma
Write-Status "Generando cliente de Prisma..."
npx prisma generate

# Crear red de Podman si no existe
Write-Status "Configurando red para Podman..."
try {
    podman network create memoria_eterna_network
    Write-Success "Red creada"
} catch {
    Write-Status "Red ya existe"
}

# Iniciar servicios con Podman
Write-Status "Iniciando servicios con Podman..."
podman-compose up -d postgres redis

# Esperar a que PostgreSQL esté listo
Write-Status "Esperando a que PostgreSQL esté listo..."
Start-Sleep -Seconds 15

# Verificar que PostgreSQL esté funcionando
Write-Status "Verificando conexión a PostgreSQL..."
$maxAttempts = 30
$attempt = 1
$postgresReady = $false

while ($attempt -le $maxAttempts -and -not $postgresReady) {
    try {
        $result = podman exec memoria_eterna_db pg_isready -U postgres 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "PostgreSQL está listo!"
            $postgresReady = $true
        } else {
            Write-Status "Intento $attempt/$maxAttempts - Esperando PostgreSQL..."
            Start-Sleep -Seconds 2
            $attempt++
        }
    } catch {
        Write-Status "Intento $attempt/$maxAttempts - Esperando PostgreSQL..."
        Start-Sleep -Seconds 2
        $attempt++
    }
}

if (-not $postgresReady) {
    Write-Error "PostgreSQL no se pudo conectar después de $maxAttempts intentos"
    exit 1
}

# Ejecutar migraciones
Write-Status "Ejecutando migraciones de base de datos..."
npx prisma db push

# Ejecutar seed si existe
if (Test-Path "prisma/seed.ts") {
    Write-Status "Ejecutando seed de base de datos..."
    npm run db:seed
}

Write-Success "✅ Configuración del entorno con Podman completada!"

Write-Host ""
Write-Host "🎉 ¡Todo listo para comenzar a desarrollar con Podman!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Configura las variables de entorno en el archivo .env"
Write-Host "2. Ejecuta 'npm run dev' para iniciar el servidor de desarrollo"
Write-Host "3. Abre http://localhost:3000 en tu navegador"
Write-Host ""
Write-Host "🔧 Comandos útiles:" -ForegroundColor Cyan
Write-Host "  npm run dev          - Iniciar servidor de desarrollo"
Write-Host "  npm run build        - Construir para producción"
Write-Host "  npm run db:studio    - Abrir Prisma Studio"
Write-Host "  npm run db:migrate   - Ejecutar migraciones"
Write-Host "  npm run lint         - Ejecutar linter"
Write-Host ""
Write-Host "🐳 Comandos de Podman:" -ForegroundColor Cyan
Write-Host "  npm run podman:up     - Iniciar servicios"
Write-Host "  npm run podman:down   - Detener servicios"
Write-Host "  npm run podman:logs   - Ver logs"
Write-Host "  podman ps            - Ver contenedores activos"
Write-Host ""
