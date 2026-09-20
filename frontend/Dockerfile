# Multi-Stage Dockerfile for CoalGuard React 19 Frontend

# ==============================================================================
# Stage 1: Build & Static Asset Generation
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency descriptors
COPY package.json package-lock.json ./

# Clean installation of dependencies
RUN npm ci

# Build Arguments for API & WebSocket base paths (defaulting to relative reverse-proxy routes)
ARG VITE_API_URL=/api/v1
ARG VITE_WS_URL=/api/v1/ws

ENV VITE_API_URL=$VITE_API_URL \
    VITE_WS_URL=$VITE_WS_URL \
    NODE_ENV=production

# Copy source code and build config
COPY . .

# Compile TypeScript and bundle with Vite
RUN npm run build

# ==============================================================================
# Stage 2: Production Nginx Server
# ==============================================================================
FROM nginx:alpine AS runner

# Remove default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy compiled SPA static artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Apply custom reverse proxy and SPA routing configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Healthcheck to verify Nginx web service responsiveness
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
