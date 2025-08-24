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
    echo "Instalando dependencias en ..."
    cd src/microservices/ && npm install && cd ../../..
done

echo "Instalando dependencias en api-gateway..."
cd src/api-gateway && npm install && cd ../..

echo "Instalando dependencias en frontend..."
cd frontend && npm install && cd ..

# Configurar variables de entorno
echo "⚙️ Configurando variables de entorno..."
for service in auth-service memories-service media-service notifications-service analytics-service; do
    if [ -f "src/microservices//.env.example" ]; then
        cp "src/microservices//.env.example" "src/microservices//.env"
        echo "✅ Configurado "
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
