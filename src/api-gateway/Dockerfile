# Multi-stage build para API Gateway
FROM node:18-alpine AS builder

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Stage de producción
FROM node:18-alpine AS production

# Instalar curl para health checks
RUN apk add --no-cache curl

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Copiar dependencias y código compilado
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Comando de inicio
CMD ["node", "dist/index.js"]
