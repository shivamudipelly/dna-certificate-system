# ============================================================
# DNA Certificate System — Frontend (Multi-Stage Build)
# Stage 1 (builder): node:18-alpine  — Vite production build
# Stage 2 (serve):   nginx:alpine    — Serve static assets
# Exposes: 80
# ============================================================

# ── Stage 1: Build ──────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies (cached layer)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .

# Build arguments (passed at build time from docker-compose or CI)
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────────────
FROM nginx:alpine AS serve

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy Vite build output from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check via nginx-health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/nginx-health || exit 1

CMD ["nginx", "-g", "daemon off;"]
