#!/bin/bash

# Script de configuración del entorno de desarrollo para Memoria Eterna
# Este script configura todo lo necesario para comenzar a desarrollar

set -e

echo "🚀 Configurando entorno de desarrollo para Memoria Eterna..."

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

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    print_warning "Docker no está instalado. Algunas funcionalidades pueden no estar disponibles"
fi

print_status "Verificando versiones..."
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_success "Node.js: $NODE_VERSION"
print_success "npm: $NPM_VERSION"

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

# Iniciar servicios de Docker si están disponibles
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    print_status "Iniciando servicios de Docker..."
    docker-compose up -d postgres redis
    
    # Esperar a que PostgreSQL esté listo
    print_status "Esperando a que PostgreSQL esté listo..."
    sleep 10
    
    # Ejecutar migraciones
    print_status "Ejecutando migraciones de base de datos..."
    npx prisma db push
    
    # Ejecutar seed si existe
    if [ -f "prisma/seed.ts" ]; then
        print_status "Ejecutando seed de base de datos..."
        npm run db:seed
    fi
    
    print_success "Servicios de Docker iniciados correctamente"
else
    print_warning "Docker no está disponible. Configura manualmente la base de datos"
fi

# Crear archivos de configuración adicionales
print_status "Creando archivos de configuración adicionales..."

# Crear .gitignore si no existe
if [ ! -f .gitignore ]; then
    cat > .gitignore << EOF
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Next.js
.next/
out/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Database
*.db
*.sqlite

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
EOF
    print_success "Archivo .gitignore creado"
fi

# Crear postcss.config.js si no existe
if [ ! -f postcss.config.js ]; then
    cat > postcss.config.js << EOF
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
    print_success "Archivo postcss.config.js creado"
fi

print_success "✅ Configuración del entorno completada!"

echo ""
echo "🎉 ¡Todo listo para comenzar a desarrollar!"
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
echo "🐳 Para servicios de Docker:"
echo "  docker-compose up -d - Iniciar servicios"
echo "  docker-compose down - Detener servicios"
echo ""
