# Multi-stage build for production
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install pnpm and dependencies
RUN npm install -g pnpm@latest
RUN pnpm install --frozen-lockfile --prod=false

# Temporarily rename package.json files to prevent Render from detecting as Node.js project
RUN mv server/package.json server/package.json.temp
RUN mv client/package.json client/package.json.temp

# Install dependencies with the renamed files
RUN mv server/package.json.temp server/package.json
RUN mv client/package.json.temp client/package.json

# Remove all start scripts from package.json files
RUN sed -i '/"start":/d' package.json server/package.json client/package.json

# Create a simple package.json for server without start script
RUN echo '{"name":"server","version":"1.0.0","type":"commonjs","main":"dist/index.js","engines":{"node":">=20.0.0"}}' > server/package.json.simple

# Debug: Show final package.json structure
RUN echo "=== Final package.json files ===" && ls -la */package.json*

# Build the application
FROM base AS builder
WORKDIR /app

# Copy source code
COPY . .

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/server/node_modules ./server/node_modules
COPY --from=deps /app/client/node_modules ./client/node_modules

# Set build environment
ENV NODE_ENV=production
# These will be overridden by Render's environment variables
ENV VITE_BACKEND_URL=https://your-app-name.onrender.com
ENV VITE_WS_URL=wss://your-app-name.onrender.com/ws

# Build shared package first
RUN pnpm run build:shared

# Build frontend
RUN pnpm run build:client

# Verify frontend build
RUN ls -la /app/client/dist/ || echo "Frontend build directory not found"
RUN ls -la /app/client/dist/index.html || echo "Frontend index.html not found"

# Build backend
WORKDIR /app/server
# Ensure server has access to root node_modules for workspace dependencies
RUN ln -sf ../node_modules ./node_modules || true
RUN pnpm run build

# Verify the build was successful
RUN ls -la dist/ || echo "Build directory not found"
RUN ls -la dist/index.js || echo "Main entry point not found"

# Copy frontend build to server/public (this is done by the build script)
WORKDIR /app
RUN pnpm run copy:frontend

# Verify the build
RUN pnpm run verify:deployment

# Copy built files to multiple possible locations for Render
RUN mkdir -p /opt/render/project/src/server/dist
RUN cp -r server/dist/* /opt/render/project/src/server/dist/
RUN mkdir -p /opt/render/project/src/server/public
RUN cp -r server/public/* /opt/render/project/src/server/public/

# Also copy to standard locations
RUN mkdir -p /opt/render/project/src/dist
RUN cp -r server/dist/* /opt/render/project/src/dist/

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built server
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/server/prisma ./server/prisma

# Copy shared package
COPY --from=builder /app/shared ./shared

# Verify server files were copied correctly
RUN ls -la ./server/dist/ || echo "Server dist directory not found"
RUN ls -la ./server/dist/index.js || echo "Server index.js not found"

# Copy built frontend to server's public directory
COPY --from=builder /app/client/dist ./server/public

# Verify frontend files were copied
RUN ls -la ./server/public/ || echo "Server public directory not found"
RUN ls -la ./server/public/index.html || echo "Frontend index.html not found in server/public"

# Install only production dependencies
WORKDIR /app/server
RUN pnpm install --production --ignore-scripts

# Verify the final structure
RUN echo "=== Final directory structure ==="
RUN ls -la /app/
RUN ls -la /app/server/
RUN ls -la /app/server/dist/
RUN echo "=== Checking if index.js exists ==="
RUN test -f /app/server/dist/index.js && echo "✅ index.js found" || echo "❌ index.js missing"

# Final deployment verification
WORKDIR /app
RUN node scripts/verify-deployment.js production

# Set permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-10112}/health || exit 1

# Expose port (Render will set PORT environment variable)
EXPOSE ${PORT:-10112}

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application - ensure we're in the correct directory
WORKDIR /app/server
CMD ["node", "dist/index.js"]

# Alternative start command if needed
# CMD ["pnpm", "start"]