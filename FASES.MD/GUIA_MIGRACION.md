# 🚀 GUÍA DE MIGRACIÓN - MEMORIA ETERNA

## 📋 PASOS PARA TRASLADAR EL PROYECTO A OTRA PC

### 🔧 PREREQUISITOS EN LA PC DESTINO

#### 1. Instalar WSL2 (Windows Subsystem for Linux)
```powershell
# Habilitar WSL
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# Habilitar Virtual Machine Platform
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Reiniciar PC
Restart-Computer

# Instalar WSL2
wsl --install

# Instalar Ubuntu (recomendado)
wsl --install -d Ubuntu
```

#### 2. Instalar Docker Desktop
```powershell
# Descargar Docker Desktop desde:
# https://www.docker.com/products/docker-desktop/

# Instalar y configurar para usar WSL2
# En Docker Desktop Settings > General > Use WSL2 based engine
```

#### 3. Instalar Node.js
```bash
# En WSL Ubuntu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación
node --version
npm --version
```

#### 4. Instalar Git
```bash
# En WSL Ubuntu
sudo apt update
sudo apt install git

# Configurar Git
git config --global user.name "Tu Nombre"
git config --global user.email "tu.email@ejemplo.com"
```

---

## 📦 PASOS DE MIGRACIÓN

### PASO 1: Preparar el proyecto actual

#### 1.1 Crear un repositorio Git (si no existe)
```bash
# En la PC actual
cd C:\ProyectoMemoria
git init
git add .
git commit -m "Initial commit - Memoria Eterna project"
```

#### 1.2 Crear un archivo .gitignore
```bash
# Crear .gitignore si no existe
echo "node_modules/" > .gitignore
echo "*.log" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
echo "dist/" >> .gitignore
echo "build/" >> .gitignore
echo ".DS_Store" >> .gitignore
echo "Thumbs.db" >> .gitignore
```

#### 1.3 Subir a GitHub/GitLab (recomendado)
```bash
# Crear repositorio en GitHub/GitLab
# Luego ejecutar:
git remote add origin https://github.com/tu-usuario/memoria-eterna.git
git branch -M main
git push -u origin main
```

### PASO 2: Alternativas de transferencia

#### Opción A: Usando Git (Recomendado)
```bash
# En la PC destino (WSL)
cd ~
git clone https://github.com/tu-usuario/memoria-eterna.git
cd memoria-eterna
```

#### Opción B: Usando USB/Disco externo
```bash
# Copiar toda la carpeta C:\ProyectoMemoria
# a un dispositivo de almacenamiento
# Luego copiar a la PC destino
```

#### Opción C: Usando servicios en la nube
```bash
# Subir a Google Drive, OneDrive, Dropbox
# Descargar en la PC destino
```

---

## 🛠️ CONFIGURACIÓN EN LA PC DESTINO

### PASO 3: Configurar el entorno

#### 3.1 Verificar instalaciones
```bash
# En WSL Ubuntu
docker --version
docker-compose --version
node --version
npm --version
git --version
```

#### 3.2 Configurar variables de entorno
```bash
# Crear archivos .env para cada servicio
cd memoria-eterna

# Auth Service
cp src/microservices/auth-service/.env.example src/microservices/auth-service/.env

# Memories Service  
cp src/microservices/memories-service/.env.example src/microservices/memories-service/.env

# Media Service
cp src/microservices/media-service/.env.example src/microservices/media-service/.env

# Notifications Service
cp src/microservices/notifications-service/.env.example src/microservices/notifications-service/.env

# Analytics Service
cp src/microservices/analytics-service/.env.example src/microservices/analytics-service/.env

# API Gateway
cp src/api-gateway/.env.example src/api-gateway/.env
```

#### 3.3 Instalar dependencias
```bash
# Instalar dependencias de todos los servicios
cd src/microservices/auth-service && npm install && cd ../../..
cd src/microservices/memories-service && npm install && cd ../../..
cd src/microservices/media-service && npm install && cd ../../..
cd src/microservices/notifications-service && npm install && cd ../../..
cd src/microservices/analytics-service && npm install && cd ../../..
cd src/api-gateway && npm install && cd ../..
cd frontend && npm install && cd ..
```

---

## 🧪 VERIFICACIÓN Y TESTING

### PASO 4: Validar la instalación

#### 4.1 Ejecutar script de validación
```bash
# En WSL Ubuntu
cd memoria-eterna
chmod +x scripts/run-e2e-tests.sh
./scripts/run-e2e-tests.sh
```

#### 4.2 Verificar estructura del proyecto
```bash
# Verificar que todos los directorios existen
ls -la
ls -la src/microservices/
ls -la k8s/
ls -la scripts/
```

#### 4.3 Probar Docker Compose
```bash
# Iniciar servicios de testing
docker-compose -f docker-compose.test.yml up -d

# Verificar que todos los servicios estén corriendo
docker-compose -f docker-compose.test.yml ps

# Probar endpoints
curl http://localhost:3000/health
curl http://localhost:3000/api/info
```

---

## 🚀 INICIAR EL PROYECTO

### PASO 5: Ejecutar el proyecto completo

#### 5.1 Iniciar todos los servicios
```bash
# Opción 1: Testing completo
docker-compose -f docker-compose.test.yml up -d

# Opción 2: Solo servicios principales
docker-compose up -d
```

#### 5.2 Verificar servicios
```bash
# Listar contenedores
docker ps

# Ver logs de servicios
docker-compose logs -f api-gateway
docker-compose logs -f auth-service
```

#### 5.3 Acceder a las aplicaciones
- **API Gateway:** http://localhost:3000
- **Frontend:** http://localhost:3007
- **Prometheus:** http://localhost:9091
- **Grafana:** http://localhost:3008 (admin/admin)
- **MailHog:** http://localhost:8025

---

## 🔧 CONFIGURACIÓN AVANZADA

### Configurar bases de datos
```bash
# PostgreSQL
docker run -d --name postgres-memoria \
  -e POSTGRES_DB=memoria_eterna \
  -e POSTGRES_USER=memoria_user \
  -e POSTGRES_PASSWORD=memoria_pass \
  -p 5432:5432 \
  postgres:13

# Redis
docker run -d --name redis-memoria \
  -p 6379:6379 \
  redis:6-alpine
```

### Configurar variables de entorno específicas
```bash
# Editar archivos .env según tu entorno
nano src/microservices/auth-service/.env
nano src/microservices/memories-service/.env
# ... etc
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problemas comunes y soluciones

#### 1. Docker no inicia
```bash
# Verificar que WSL2 esté habilitado
wsl --list --verbose

# Reiniciar Docker Desktop
# Verificar en Docker Desktop Settings > General
```

#### 2. Puertos ocupados
```bash
# Verificar puertos en uso
netstat -tulpn | grep :3000

# Cambiar puertos en docker-compose.yml si es necesario
```

#### 3. Permisos de archivos
```bash
# Dar permisos de ejecución a scripts
chmod +x scripts/*.sh
chmod +x scripts/*.ps1
```

#### 4. Problemas de red
```bash
# Verificar conectividad
ping google.com

# Verificar DNS
nslookup google.com
```

---

## 📚 RECURSOS ADICIONALES

### Documentación útil
- [README.md](./README.md) - Documentación principal del proyecto
- [FASE17_COMPLETADA.md](./FASE17_COMPLETADA.md) - Detalles de implementación
- [RESUMEN_PROYECTO_COMPLETADO.md](./RESUMEN_PROYECTO_COMPLETADO.md) - Resumen del proyecto

### Enlaces externos
- [Docker Desktop Documentation](https://docs.docker.com/desktop/)
- [WSL Documentation](https://docs.microsoft.com/en-us/windows/wsl/)
- [Node.js Documentation](https://nodejs.org/docs/)

---

## ✅ CHECKLIST DE MIGRACIÓN

- [ ] Instalar WSL2 en PC destino
- [ ] Instalar Docker Desktop
- [ ] Instalar Node.js
- [ ] Instalar Git
- [ ] Transferir proyecto (Git/USB/Cloud)
- [ ] Configurar variables de entorno
- [ ] Instalar dependencias
- [ ] Validar estructura del proyecto
- [ ] Probar Docker Compose
- [ ] Verificar todos los servicios
- [ ] Probar endpoints
- [ ] Configurar bases de datos (opcional)
- [ ] Documentar configuración específica

---

## 🎉 ¡LISTO!

Una vez completados todos los pasos, tendrás **Memoria Eterna** funcionando completamente en tu nueva PC con Docker y WSL2.

**¡El proyecto está listo para preservar recuerdos digitales! 🌟**

---

*Guía creada para Memoria Eterna - Sistema de Preservación Digital*
