# Configuración con Podman

Este proyecto ha sido configurado para funcionar con Podman como alternativa a Docker.

## ¿Qué es Podman?

Podman es una herramienta de contenedores que es compatible con Docker pero no requiere un daemon que se ejecute como root. Es más seguro y ligero que Docker.

## Instalación de Podman

### Windows
1. Descarga Podman Desktop desde: https://podman.io/getting-started/installation#windows
2. Instala siguiendo las instrucciones del instalador
3. Instala podman-compose:
   ```bash
   pip install podman-compose
   ```

### macOS
```bash
brew install podman
pip install podman-compose
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y podman podman-compose
```

## Configuración inicial

### Opción 1: Script automático (Recomendado)
```bash
npm run setup:podman
```

### Opción 2: Configuración manual
1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Copiar variables de entorno:
   ```bash
   cp env.example .env
   ```

3. Generar cliente de Prisma:
   ```bash
   npx prisma generate
   ```

4. Crear red de Podman:
   ```bash
   podman network create memoria_eterna_network
   ```

5. Iniciar servicios:
   ```bash
   podman-compose up -d
   ```

6. Ejecutar migraciones:
   ```bash
   npx prisma db push
   ```

## Comandos útiles

### Gestión de servicios
```bash
# Iniciar servicios
npm run podman:up

# Detener servicios
npm run podman:down

# Ver logs
npm run podman:logs

# Reiniciar servicios
npm run podman:restart

# Limpiar todo (elimina volúmenes y contenedores)
npm run podman:clean
```

### Comandos directos de Podman
```bash
# Ver contenedores activos
podman ps

# Ver todos los contenedores
podman ps -a

# Ver logs de un contenedor específico
podman logs memoria_eterna_db

# Entrar al contenedor de PostgreSQL
podman exec -it memoria_eterna_db psql -U postgres -d memoria_eterna

# Ver redes
podman network ls

# Ver volúmenes
podman volume ls
```

### Comandos de podman-compose
```bash
# Iniciar todos los servicios
podman-compose up -d

# Iniciar solo PostgreSQL y Redis
podman-compose up -d postgres redis

# Ver logs de todos los servicios
podman-compose logs

# Ver logs de un servicio específico
podman-compose logs postgres

# Reconstruir y reiniciar servicios
podman-compose up -d --build

# Detener y eliminar contenedores
podman-compose down

# Detener y eliminar contenedores y volúmenes
podman-compose down -v
```

## Solución de problemas

### Error: "permission denied"
En algunos sistemas Linux, puede ser necesario configurar Podman para ejecutarse sin root:
```bash
# Crear configuración de usuario
podman system connection add --identity ~/.ssh/id_rsa podman-machine-default ssh://core@localhost:22/run/user/1000/podman/podman.sock
```

### Error: "network not found"
Si la red no existe, créala manualmente:
```bash
podman network create memoria_eterna_network
```

### Error: "port already in use"
Si los puertos están ocupados, puedes cambiar los puertos en `docker-compose.yml`:
```yaml
ports:
  - "5556:5432"  # Cambiar 5555 por 5556
```

### Error: "volume mount failed"
En Windows/macOS, puede ser necesario ajustar los permisos de SELinux:
```yaml
volumes:
  - ./init.sql:/docker-entrypoint-initdb.d/init.sql:Z
```

## Diferencias con Docker

1. **Seguridad**: Podman no requiere un daemon que se ejecute como root
2. **Compatibilidad**: Los comandos son similares a Docker
3. **Volúmenes**: Puede requerir configuraciones adicionales de SELinux
4. **Redes**: Las redes se crean de manera similar pero pueden requerir configuración manual

## Migración desde Docker

Si ya tienes el proyecto configurado con Docker:

1. Detén los servicios de Docker:
   ```bash
   docker-compose down
   ```

2. Ejecuta el script de configuración de Podman:
   ```bash
   npm run setup:podman
   ```

3. Los datos de la base de datos se mantendrán si usas volúmenes persistentes.

## Desarrollo

Una vez configurado, puedes desarrollar normalmente:

```bash
# Iniciar servidor de desarrollo
npm run dev

# Abrir Prisma Studio
npm run db:studio

# Ejecutar migraciones
npm run db:migrate
```

## Recursos adicionales

- [Documentación oficial de Podman](https://podman.io/getting-started/)
- [Podman Compose](https://github.com/containers/podman-compose)
- [Migración de Docker a Podman](https://podman.io/getting-started/migration)
