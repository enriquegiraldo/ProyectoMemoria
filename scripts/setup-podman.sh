#!/bin/bash

# Script de configuración del entorno de desarrollo para Memoria Eterna con Podman
# Este script configura todo lo necesario para comenzar a desarrollar usando Podman

set -e

echo "🚀 Configurando entorno de desarrollo para Memoria Eterna con Podman..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si Podman está instalado
if ! command -v podman &> /dev/null; then
    print_error "Podman no está instalado. Por favor instala Podman primero:"
    echo "  - Windows: https://podman.io/getting-started/installation#windows"
    echo "  - macOS: brew install podman"
    echo "  - Linux: https://podman.io/getting-started/installation"
    exit 1
fi

# Verificar si podman-compose está instalado
if ! command -v podman-compose &> /dev/null; then
    print_warning "podman-compose no está instalado. Instalando..."
    if command -v pip3 &> /dev/null; then
        pip3 install podman-compose
    elif command -v pip &> /dev/null; then
        pip install podman-compose
    else
        print_error "pip no está disponible. Instala podman-compose manualmente:"
        echo "  pip install podman-compose"
        exit 1
    fi
fi

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Por favor instala Node.js 18+"
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado. Por favor instala npm"
    exit 1
fi

print_status "Verificando versiones..."
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
PODMAN_VERSION=$(podman --version)
print_success "Node.js: $NODE_VERSION"
print_success "npm: $NPM_VERSION"
print_success "Podman: $PODMAN_VERSION"

# Iniciar Podman machine si es necesario (solo en macOS/Windows)
if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    print_status "Verificando estado de Podman machine..."
    if ! podman machine list | grep -q "Running"; then
        print_status "Iniciando Podman machine..."
        podman machine start
    fi
fi

# Instalar dependencias
print_status "Instalando dependencias..."
npm install

# Copiar archivo de variables de entorno
if [ ! -f .env ]; then
    print_status "Creando archivo .env desde .env.example..."
    if [ -f env.example ]; then
        cp env.example .env
        print_success "Archivo .env creado. Por favor configura las variables de entorno"
    else
        print_warning "Archivo env.example no encontrado. Crea manualmente el archivo .env"
    fi
else
    print_success "Archivo .env ya existe"
fi

# Generar cliente de Prisma
print_status "Generando cliente de Prisma..."
npx prisma generate

# Crear red de Podman si no existe
print_status "Configurando red para Podman..."
podman network create memoria_eterna_network 2>/dev/null || print_status "Red ya existe"

# Iniciar servicios con Podman
print_status "Iniciando servicios con Podman..."
podman-compose up -d postgres redis

# Esperar a que PostgreSQL esté listo
print_status "Esperando a que PostgreSQL esté listo..."
sleep 15

# Verificar que PostgreSQL esté funcionando
print_status "Verificando conexión a PostgreSQL..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if podman exec memoria_eterna_db pg_isready -U postgres > /dev/null 2>&1; then
        print_success "PostgreSQL está listo!"
        break
    fi
    print_status "Intento $attempt/$max_attempts - Esperando PostgreSQL..."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    print_error "PostgreSQL no se pudo conectar después de $max_attempts intentos"
    exit 1
fi

# Ejecutar migraciones
print_status "Ejecutando migraciones de base de datos..."
npx prisma db push

# Ejecutar seed si existe
if [ -f "prisma/seed.ts" ]; then
    print_status "Ejecutando seed de base de datos..."
    npm run db:seed
fi

print_success "✅ Configuración del entorno con Podman completada!"

echo ""
echo "🎉 ¡Todo listo para comenzar a desarrollar con Podman!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configura las variables de entorno en el archivo .env"
echo "2. Ejecuta 'npm run dev' para iniciar el servidor de desarrollo"
echo "3. Abre http://localhost:3000 en tu navegador"
echo ""
echo "🔧 Comandos útiles:"
echo "  npm run dev          - Iniciar servidor de desarrollo"
echo "  npm run build        - Construir para producción"
echo "  npm run db:studio    - Abrir Prisma Studio"
echo "  npm run db:migrate   - Ejecutar migraciones"
echo "  npm run lint         - Ejecutar linter"
echo ""
echo "🐳 Comandos de Podman:"
echo "  podman-compose up -d - Iniciar servicios"
echo "  podman-compose down - Detener servicios"
echo "  podman-compose logs - Ver logs"
echo "  podman ps           - Ver contenedores activos"
echo ""
