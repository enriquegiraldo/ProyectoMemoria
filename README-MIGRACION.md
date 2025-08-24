# 🚀 MIGRACIÓN - MEMORIA ETERNA

## 📦 CONTENIDO DEL PAQUETE

Este paquete contiene todo lo necesario para migrar el proyecto **Memoria Eterna** a otra PC.

### Archivos incluidos:
- migration-config.json - Configuración del proyecto
- install-memoria-eterna.sh - Script de instalación automática
- MIGRACION_PASOS.md - Guía detallada de migración
- GUIA_MIGRACION.md - Guía completa (si existe)

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
`powershell
# En PowerShell como administrador
wsl --install
`

### Paso 2: Instalar Docker Desktop
- Descargar desde: https://www.docker.com/products/docker-desktop/
- Instalar y configurar para WSL2

### Paso 3: Transferir proyecto
`ash
# En WSL Ubuntu
cd ~
# Copiar proyecto aquí
`

### Paso 4: Instalar automáticamente
`ash
# En WSL Ubuntu
chmod +x install-memoria-eterna.sh
./install-memoria-eterna.sh
`

### Paso 5: Iniciar proyecto
`ash
docker-compose -f docker-compose.test.yml up -d
`

## 🌐 ACCESO A SERVICIOS

Una vez iniciado:
- **API Gateway:** http://localhost:3000
- **Frontend:** http://localhost:3007
- **Prometheus:** http://localhost:9091
- **Grafana:** http://localhost:3008 (admin/admin)
- **MailHog:** http://localhost:8025

## 📞 SOPORTE

Si encuentras problemas:
1. Revisar MIGRACION_PASOS.md para solución de problemas
2. Verificar que Docker Desktop esté configurado para WSL2
3. Asegurar que los puertos no estén ocupados

---

**¡Memoria Eterna está listo para preservar recuerdos digitales! 🌟**
