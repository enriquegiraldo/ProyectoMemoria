# ========= STAGE 1: Build the application ========
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Install system dependencies for native module compilation
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    && rm -rf /var/cache/apk/*

# Copy package definition files
COPY package*.json ./

# Install all dependencies (including devDependencies, e.g., typescript)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the TypeScript code into JavaScript
RUN npm run build

# ========= STAGE 2: Create the final production image ========
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Install system dependencies for runtime (if needed)
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Copy package definition files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy the compiled code from the builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Create logs directory and set ownership
RUN mkdir -p /app/logs && chown nodejs:nodejs /app/logs

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the port the app runs on
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Command to run the application
CMD ["node", "dist/main.js"]