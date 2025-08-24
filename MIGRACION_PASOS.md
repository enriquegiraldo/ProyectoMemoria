# 🚀 GUÍA DE MIGRACIÓN - MEMORIA ETERNA

## 📋 PASOS PARA TRASLADAR A OTRA PC

### 🔧 PREREQUISITOS EN PC DESTINO

#### 1. Instalar WSL2
```powershell
# Habilitar WSL
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
Restart-Computer

# Instalar WSL2
wsl --install
wsl --install -d Ubuntu
```

#### 2. Instalar Docker Desktop
- Descargar desde: https://www.docker.com/products/docker-desktop/
- Configurar para usar WSL2 en Settings > General

#### 3. Instalar Node.js en WSL
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 4. Instalar Git
```bash
sudo apt update
sudo apt install git
```

---

## 📦 TRANSFERENCIA DEL PROYECTO

### Opción A: Git (Recomendado)
```bash
# En PC actual
cd C:\ProyectoMemoria
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/memoria-eterna.git
git push -u origin main

# En PC destino (WSL)
cd ~
git clone https://github.com/tu-usuario/memoria-eterna.git
cd memoria-eterna
```

### Opción B: USB/Disco externo
- Copiar toda la carpeta `C:\ProyectoMemoria`
- Transferir a PC destino
- Copiar a ubicación deseada

---

## 🛠️ CONFIGURACIÓN EN PC DESTINO

### 1. Verificar instalaciones
```bash
docker --version
docker-compose --version
node --version
npm --version
```

### 2. Instalar dependencias
```bash
cd memoria-eterna

# Instalar en cada servicio
cd src/microservices/auth-service && npm install && cd ../../..
cd src/microservices/memories-service && npm install && cd ../../..
cd src/microservices/media-service && npm install && cd ../../..
cd src/microservices/notifications-service && npm install && cd ../../..
cd src/microservices/analytics-service && npm install && cd ../../..
cd src/api-gateway && npm install && cd ../..
cd frontend && npm install && cd ..
```

### 3. Configurar variables de entorno
```bash
# Copiar archivos .env.example a .env en cada servicio
cp src/microservices/auth-service/.env.example src/microservices/auth-service/.env
cp src/microservices/memories-service/.env.example src/microservices/memories-service/.env
cp src/microservices/media-service/.env.example src/microservices/media-service/.env
cp src/microservices/notifications-service/.env.example src/microservices/notifications-service/.env
cp src/microservices/analytics-service/.env.example src/microservices/analytics-service/.env
cp src/api-gateway/.env.example src/api-gateway/.env
```

---

## 🧪 VERIFICACIÓN

### 1. Validar estructura
```bash
# Verificar directorios
ls -la
ls -la src/microservices/
ls -la k8s/
ls -la scripts/
```

### 2. Probar Docker Compose
```bash
# Iniciar servicios
docker-compose -f docker-compose.test.yml up -d

# Verificar servicios
docker-compose -f docker-compose.test.yml ps

# Probar endpoints
curl http://localhost:3000/health
```

---

## 🚀 INICIAR PROYECTO

### Opción 1: Testing completo
```bash
docker-compose -f docker-compose.test.yml up -d
```

### Opción 2: Solo servicios principales
```bash
docker-compose up -d
```

### Acceder a servicios:
- **API Gateway:** http://localhost:3000
- **Frontend:** http://localhost:3007
- **Prometheus:** http://localhost:9091
- **Grafana:** http://localhost:3008 (admin/admin)
- **MailHog:** http://localhost:8025

---

## ✅ CHECKLIST

- [ ] WSL2 instalado
- [ ] Docker Desktop instalado
- [ ] Node.js instalado
- [ ] Git instalado
- [ ] Proyecto transferido
- [ ] Dependencias instaladas
- [ ] Variables de entorno configuradas
- [ ] Docker Compose probado
- [ ] Servicios funcionando

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Docker no inicia
```bash
wsl --list --verbose
# Reiniciar Docker Desktop
```

### Puertos ocupados
```bash
netstat -tulpn | grep :3000
# Cambiar puertos en docker-compose.yml
```

### Permisos de archivos
```bash
chmod +x scripts/*.sh
chmod +x scripts/*.ps1
```

---

**¡Memoria Eterna está listo para usar en tu nueva PC! 🌟**
