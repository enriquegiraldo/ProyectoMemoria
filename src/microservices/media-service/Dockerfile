# Multi-stage build for Media Service
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    pkgconfig \
    pixman-dev \
    cairo-dev \
    pango-dev \
    musl-dev \
    jpeg-dev \
    libpng-dev \
    giflib-dev \
    librsvg-dev \
    libwebp-dev \
    orc-dev \
    fftw-dev \
    libexif-dev \
    libheif-dev \
    vips-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies including FFmpeg
RUN apk add --no-cache \
    ffmpeg \
    vips-dev\
    #libvips \
    cairo \
    pango \
    jpeg \
    libpng-dev \
    giflib \
    librsvg \
    libwebp \
    libexif \
    libheif \
    ttf-dejavu \
    ttf-liberation \
    #ttf-ubuntu-font-family \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Create directories for file uploads and processing
RUN mkdir -p /app/uploads /app/temp /app/processed /app/logs && \
    chown -R nodejs:nodejs /app/uploads /app/temp /app/processed /app/logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3003/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/index.js"]
