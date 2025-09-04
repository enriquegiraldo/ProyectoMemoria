#!/bin/bash
# Script de instalación para Memoria Eterna
# Ejecutar en WSL Ubuntu en la PC destino

set -e  # Salir si hay algún error

echo "🚀 INSTALANDO MEMORIA ETERNA"
echo "============================"

# Verificar si estamos en WSL
if [[ ! -f /proc/version ]] || ! grep -q Microsoft /proc/version; then
    echo "❌ Error: Este script debe ejecutarse en WSL"
    exit 1
fi

# Verificar que estamos en el directorio correcto
if [[ ! -f "package.json" ]] || [[ ! -f "docker-compose.yml" ]]; then
    echo "❌ Error: Este script debe ejecutarse desde la raíz del proyecto Memoria Eterna"
    echo "Asegúrate de estar en el directorio que contiene package.json y docker-compose.yml"
    exit 1
fi

# Actualizar sistema
echo "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependencias del sistema
echo "📦 Instalando dependencias del sistema..."
sudo apt install -y curl wget git unzip build-essential

# Instalar Node.js
echo "📦 Instalando Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js ya está instalado: $(node --version)"
fi

# Instalar Docker si no está instalado
echo "📦 Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "📦 Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker instalado. Por favor, reinicia tu sesión de WSL para que los cambios surtan efecto."
else
    echo "✅ Docker ya está instalado: $(docker --version)"
fi

# Instalar Docker Compose si no está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Instalando Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "✅ Docker Compose ya está instalado: $(docker-compose --version)"
fi

# Verificar instalaciones
echo "✅ Verificando instalaciones..."
node --version
npm --version
git --version
docker --version
docker-compose --version

# Instalar dependencias del proyecto principal
echo "📦 Instalando dependencias del proyecto principal..."
npm install

# Instalar dependencias en cada microservicio
echo "📦 Instalando dependencias en microservicios..."
for service in auth-service memories-service media-service notifications-service payments-service analytics-service; do
    if [[ -d "src/microservices/$service" ]]; then
        echo "Instalando dependencias en $service..."
        cd "src/microservices/$service"
        if [[ -f "package.json" ]]; then
            npm install
        else
            echo "⚠️  No se encontró package.json en $service"
        fi
        cd ../../..
    else
        echo "⚠️  No se encontró el directorio $service"
    fi
done

# Instalar dependencias en API Gateway
echo "📦 Instalando dependencias en API Gateway..."
if [[ -d "src/api-gateway" ]]; then
    cd src/api-gateway
    if [[ -f "package.json" ]]; then
        npm install
    else
        echo "⚠️  No se encontró package.json en api-gateway"
    fi
    cd ../..
else
    echo "⚠️  No se encontró el directorio api-gateway"
fi

# Instalar dependencias en frontend
echo "📦 Instalando dependencias en frontend..."
if [[ -d "frontend" ]]; then
    cd frontend
    if [[ -f "package.json" ]]; then
        npm install
    else
        echo "⚠️  No se encontró package.json en frontend"
    fi
    cd ..
else
    echo "⚠️  No se encontró el directorio frontend"
fi

# Configurar variables de entorno
echo "⚙️ Configurando variables de entorno..."
if [[ -f ".env.example" ]]; then
    if [[ ! -f ".env" ]]; then
        cp .env.example .env
        echo "✅ Archivo .env creado desde .env.example"
        echo "⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales reales"
    else
        echo "✅ Archivo .env ya existe"
    fi
else
    echo "⚠️  No se encontró .env.example"
fi

# Configurar variables de entorno para microservicios
for service in auth-service memories-service media-service notifications-service payments-service analytics-service; do
    if [[ -d "src/microservices/$service" ]]; then
        if [[ -f "src/microservices/$service/.env.example" ]]; then
            if [[ ! -f "src/microservices/$service/.env" ]]; then
                cp "src/microservices/$service/.env.example" "src/microservices/$service/.env"
                echo "✅ Configurado $service"
            else
                echo "✅ $service ya tiene archivo .env"
            fi
        else
            echo "⚠️  No se encontró .env.example en $service"
        fi
    fi
done

# Configurar variables de entorno para API Gateway
if [[ -d "src/api-gateway" ]] && [[ -f "src/api-gateway/.env.example" ]]; then
    if [[ ! -f "src/api-gateway/.env" ]]; then
        cp "src/api-gateway/.env.example" "src/api-gateway/.env"
        echo "✅ Configurado api-gateway"
    else
        echo "✅ api-gateway ya tiene archivo .env"
    fi
fi

# Generar Prisma client
echo "📦 Generando Prisma client..."
if [[ -d "prisma" ]]; then
    npx prisma generate
    echo "✅ Prisma client generado"
fi

# Crear directorios necesarios
echo "📁 Creando directorios necesarios..."
mkdir -p logs
mkdir -p uploads
mkdir -p temp

# Dar permisos necesarios
echo "🔐 Configurando permisos..."
chmod +x scripts/*.sh
chmod +x scripts/*.ps1

echo ""
echo "🎉 INSTALACIÓN COMPLETADA"
echo "========================="
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo "1. Edita el archivo .env con tus credenciales reales"
echo "2. Reinicia tu sesión de WSL si instalaste Docker"
echo "3. Ejecuta: docker-compose up -d"
echo "4. Para testing: docker-compose -f docker-compose.test.yml up -d"
echo "5. Accede a la aplicación: http://localhost:3000"
echo "6. Accede a Adminer (DB): http://localhost:8080"
echo ""
echo "🔧 COMANDOS ÚTILES:"
echo "- Iniciar servicios: docker-compose up -d"
echo "- Ver logs: docker-compose logs -f"
echo "- Detener servicios: docker-compose down"
echo "- Ejecutar tests: npm run test:all"
echo "- Desarrollo: npm run dev"
echo ""
echo "⚠️  IMPORTANTE:"
echo "- Configura todas las variables de entorno en .env"
echo "- Asegúrate de tener Docker Desktop configurado para WSL2"
echo "- Para producción, cambia las credenciales por defecto"
