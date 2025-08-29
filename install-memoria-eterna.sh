#!/bin/bash
# Script de instalación para Memoria Eterna
# Ejecutar en WSL Ubuntu desde la raíz del proyecto

echo "🚀 INSTALANDO MEMORIA ETERNA"
echo "============================"

# # Verificar si estamos en WSL
# if [[ ! -f /proc/version ]] || ! grep -q Microsoft /proc/version; then
#     echo "❌ Error: Este script debe ejecutarse en WSL"
#     exit 1
# fi

# Actualizar sistema
echo "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar Node.js (versión 18)
if ! command -v node &> /dev/null; then
    echo "📦 Instalando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js ya instalado: $(node -v)"
fi

# Instalar Git
if ! command -v git &> /dev/null; then
    echo "📦 Instalando Git..."
    sudo apt install git -y
else
    echo "✅ Git ya instalado: $(git --version)"
fi

# Instalar Docker
if ! command -v docker &> /dev/null; then
    echo "📦 Instalando Docker..."
    sudo apt-get remove docker docker-engine docker.io containerd runc -y
    sudo apt-get install ca-certificates curl gnupg lsb-release -y
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
    sudo usermod -aG docker $USER
    echo "✅ Docker instalado. Es posible que necesites reiniciar la terminal."
else
    echo "✅ Docker ya instalado: $(docker --version)"
fi

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Instalando Docker Compose..."
    sudo apt install docker-compose -y
else
    echo "✅ Docker Compose ya instalado: $(docker-compose --version)"
fi

# Variables de carpetas
PROJECT_ROOT="$(pwd)"
MICROSERVICES_DIR="$PROJECT_ROOT/src/microservices"
API_GATEWAY_DIR="$PROJECT_ROOT/src/api-gateway"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Instalar dependencias en microservicios
echo "📦 Instalando dependencias en microservicios..."
for service in auth-service memories-service media-service notifications-service analytics-service; do
    SERVICE_PATH="$MICROSERVICES_DIR/$service"
    if [ -d "$SERVICE_PATH" ]; then
        echo "➡️ $service"
        cd "$SERVICE_PATH" && npm install && cd "$PROJECT_ROOT"
    else
        echo "⚠️ Carpeta no encontrada: $service"
    fi
done

# Instalar dependencias en api-gateway
if [ -d "$API_GATEWAY_DIR" ]; then
    echo "📦 Instalando dependencias en api-gateway..."
    cd "$API_GATEWAY_DIR" && npm install && cd "$PROJECT_ROOT"
fi

# Instalar dependencias en frontend
if [ -d "$FRONTEND_DIR" ]; then
    echo "📦 Instalando dependencias en frontend..."
    cd "$FRONTEND_DIR" && npm install && cd "$PROJECT_ROOT"
fi

# Configurar variables de entorno
echo "⚙️ Configurando variables de entorno..."
for service in auth-service memories-service media-service notifications-service analytics-service; do
    SERVICE_PATH="$MICROSERVICES_DIR/$service"
    if [ -f "$SERVICE_PATH/.env.example" ]; then
        cp "$SERVICE_PATH/.env.example" "$SERVICE_PATH/.env"
        echo "✅ Configurado $service"
    fi
done

if [ -f "$API_GATEWAY_DIR/.env.example" ]; then
    cp "$API_GATEWAY_DIR/.env.example" "$API_GATEWAY_DIR/.env"
    echo "✅ Configurado api-gateway"
fi

if [ -f "$FRONTEND_DIR/.env.example" ]; then
    cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env"
    echo "✅ Configurado frontend"
fi

echo ""
echo "🎉 INSTALACIÓN COMPLETADA"
echo "========================="
echo "Próximos pasos:"
echo "1. Verifica que Docker Desktop esté instalado y configurado con WSL2"
echo "2. Inicia los servicios con:"
echo "   docker-compose -f docker-compose.test.yml up -d"
echo "3. Accede a: http://localhost:3000"
echo ""
echo "🚀 Despliegue en la nube:"
echo "- AWS:    docker tag <imagen> <aws_account_id>.dkr.ecr.<region>.amazonaws.com/<repo>:latest && docker push ..."
echo "- Oracle: docker tag <imagen> <region-key>.ocir.io/<tenancy>/<repo>:latest && docker push ..."
echo "- GCP:    docker tag <imagen> gcr.io/<project-id>/<repo>:latest && docker push ..."
echo "- Heroku: heroku container:push web -a <app-name> && heroku container:release web -a <app-name>"
