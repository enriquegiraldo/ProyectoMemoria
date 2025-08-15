# Memoria Eterna 🌟

Una aplicación web moderna para preservar y compartir recuerdos familiares y momentos especiales.

## 📋 Descripción

Memoria Eterna es una plataforma que permite a los usuarios crear, organizar y compartir sus recuerdos más preciados. Con un enfoque en la privacidad y la facilidad de uso, la aplicación ayuda a crear un legado digital que perdurará para las futuras generaciones.

## ✨ Características Principales

- **📝 Creación de Memorias**: Escribe y organiza tus recuerdos con texto rico e imágenes
- **🏷️ Categorización**: Organiza tus memorias por categorías y tags
- **👥 Compartir**: Comparte memorias con familiares y amigos de forma segura
- **🔒 Privacidad**: Control total sobre qué memorias son públicas o privadas
- **💬 Interacción**: Sistema de comentarios y likes para interactuar con las memorias
- **📱 Responsive**: Diseño adaptativo para todos los dispositivos

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: NextAuth.js
- **Deployment**: Docker, Docker Compose

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Docker y Docker Compose (opcional)

### Configuración Rápida

1. **Clonar el repositorio**

   ```bash
   git clone <repository-url>
   cd memoria-eterna
   ```

2. **Ejecutar el script de configuración**

   ```bash
   # En Windows (PowerShell)
   .\scripts\setup-dev.sh

   # En Linux/Mac
   chmod +x scripts/setup-dev.sh
   ./scripts/setup-dev.sh
   ```

3. **Configurar variables de entorno**

   ```bash
   cp env.example .env
   # Editar .env con tus configuraciones
   ```

4. **Iniciar servicios de Docker**

   ```bash
   docker-compose up -d
   ```

5. **Ejecutar migraciones y seed**

   ```bash
   npm run db:push
   npm run db:seed
   ```

6. **Iniciar el servidor de desarrollo**

   ```bash
   npm run dev
   ```

7. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

### Configuración Manual

Si prefieres configurar manualmente:

1. **Instalar dependencias**

   ```bash
   npm install
   ```

2. **Configurar base de datos**

   ```bash
   # Generar cliente de Prisma
   npx prisma generate

   # Ejecutar migraciones
   npx prisma db push

   # Poblar con datos de prueba
   npm run db:seed
   ```

3. **Configurar variables de entorno**
   - Copia `env.example` a `.env`
   - Configura `DATABASE_URL` con tu conexión a PostgreSQL
   - Configura `NEXTAUTH_SECRET` con una clave secreta

## 📁 Estructura del Proyecto

```
memoria-eterna/
├── prisma/                 # Esquema de base de datos y migraciones
│   ├── schema.prisma      # Modelo de datos
│   └── seed.ts           # Datos de prueba
├── public/                # Archivos estáticos
├── scripts/               # Scripts de automatización
│   └── setup-dev.sh      # Configuración del entorno
├── src/
│   ├── app/              # App Router de Next.js
│   │   ├── globals.css   # Estilos globales
│   │   ├── layout.tsx    # Layout principal
│   │   └── page.tsx      # Página de inicio
│   ├── components/       # Componentes React
│   │   └── ui/          # Componentes de UI base
│   ├── lib/             # Utilidades y configuraciones
│   │   ├── auth.ts      # Configuración de autenticación
│   │   ├── prisma.ts    # Cliente de Prisma
│   │   └── utils.ts     # Utilidades generales
│   └── types/           # Tipos de TypeScript
├── .env.example         # Variables de entorno de ejemplo
├── .gitignore          # Archivos ignorados por Git
├── docker-compose.yml  # Configuración de Docker
├── middleware.ts       # Middleware de Next.js
├── next.config.js      # Configuración de Next.js
├── package.json        # Dependencias y scripts
├── postcss.config.js   # Configuración de PostCSS
├── tailwind.config.js  # Configuración de Tailwind CSS
└── tsconfig.json       # Configuración de TypeScript
```

## 🗄️ Modelo de Datos

### Entidades Principales

- **User**: Usuarios del sistema
- **Memory**: Memorias/recuerdos creados por los usuarios
- **Category**: Categorías para organizar memorias
- **Tag**: Etiquetas para clasificar memorias
- **Comment**: Comentarios en las memorias
- **Like**: Me gusta en las memorias

### Relaciones

- Un usuario puede tener múltiples memorias
- Una memoria pertenece a un usuario y opcionalmente a una categoría
- Una memoria puede tener múltiples tags
- Una memoria puede tener múltiples comentarios y likes
- Los comentarios y likes están asociados a usuarios y memorias

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Construir para producción
npm run start            # Iniciar servidor de producción
npm run lint             # Ejecutar linter

# Base de datos
npm run db:generate      # Generar cliente de Prisma
npm run db:push          # Sincronizar esquema con la base de datos
npm run db:migrate       # Ejecutar migraciones
npm run db:studio        # Abrir Prisma Studio
npm run db:seed          # Poblar con datos de prueba

# Configuración
npm run setup            # Configuración completa del proyecto
```

## 🔑 Credenciales de Prueba

Después de ejecutar el seed, puedes usar estas credenciales:

- **Administrador**: `admin@memoriaeterna.com` / `password123`
- **Usuario 1**: `maria@example.com` / `password123`
- **Usuario 2**: `juan@example.com` / `password123`

## 🐳 Docker

### Iniciar servicios

```bash
docker-compose up -d
```

### Ver logs

```bash
docker-compose logs -f
```

### Detener servicios

```bash
docker-compose down
```

### Servicios disponibles

- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **Adminer**: `localhost:8080` (gestión de base de datos)

## 🔒 Variables de Entorno

Crea un archivo `.env` basado en `env.example`:

```env
# Base de datos
DATABASE_URL="postgresql://username:password@localhost:5432/memoria_eterna"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# JWT
JWT_SECRET="your-jwt-secret-here"

# Email (opcional)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"

# Environment
NODE_ENV="development"
```

## 🧪 Pruebas

```bash
# Ejecutar pruebas unitarias
npm test

# Ejecutar pruebas de integración
npm run test:integration

# Ejecutar pruebas E2E
npm run test:e2e
```

## 📦 Despliegue

### Producción con Docker

```bash
# Construir imagen
docker build -t memoria-eterna .

# Ejecutar contenedor
docker run -p 3000:3000 memoria-eterna
```

### Vercel

1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Desplegar automáticamente

### Otros proveedores

El proyecto es compatible con cualquier proveedor que soporte Next.js:

- Netlify
- Railway
- Heroku
- DigitalOcean App Platform

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

- **Email**: soporte@memoriaeterna.com
- **Documentación**: [docs.memoriaeterna.com](https://docs.memoriaeterna.com)
- **Issues**: [GitHub Issues](https://github.com/username/memoria-eterna/issues)

## 🙏 Agradecimientos

- Next.js por el framework increíble
- Prisma por el ORM intuitivo
- Tailwind CSS por los estilos hermosos
- La comunidad de desarrolladores por el apoyo

---

**Memoria Eterna** - Preservando recuerdos, conectando generaciones 🌟
