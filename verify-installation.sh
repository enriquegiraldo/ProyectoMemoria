#!/bin/bash
# Script de verificación para Memoria Eterna

echo "🔍 VERIFICANDO INSTALACIÓN - MEMORIA ETERNA"
echo "=========================================="

# Verificar Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker instalado: "
else
    echo "❌ Docker no está instalado"
fi

# Verificar Docker Compose
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose instalado: "
else
    echo "❌ Docker Compose no está instalado"
fi

# Verificar Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js instalado: v24.6.0"
else
    echo "❌ Node.js no está instalado"
fi

# Verificar npm
if command -v npm &> /dev/null; then
    echo "✅ npm instalado: 11.5.2"
else
    echo "❌ npm no está instalado"
fi

# Verificar estructura del proyecto
echo ""
echo "📁 Verificando estructura del proyecto..."

directories=("src/microservices" "src/api-gateway" "frontend" "k8s" "scripts")
for dir in ""; do
    if [ -d "" ]; then
        echo "✅  existe"
    else
        echo "❌  no existe"
    fi
done

# Verificar archivos importantes
echo ""
echo "📄 Verificando archivos importantes..."

files=("docker-compose.test.yml" "README.md" "package.json")
for file in ""; do
    if [ -f "" ]; then
        echo "✅  existe"
    else
        echo "❌  no existe"
    fi
done

# Verificar servicios
echo ""
echo "🔧 Verificando servicios..."

services=("auth-service" "memories-service" "media-service" "notifications-service" "analytics-service")
for service in ""; do
    if [ -d "src/microservices/" ]; then
        if [ -f "src/microservices//package.json" ]; then
            echo "✅  - implementado"
        else
            echo "⚠️  - directorio existe pero sin package.json"
        fi
    else
        echo "❌  - no implementado"
    fi
done

echo ""
echo "🎉 Verificación completada"
