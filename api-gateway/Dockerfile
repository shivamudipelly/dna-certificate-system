# ============================================================
# DNA Certificate System — API Gateway
# Base: node:18-alpine  |  Exposes: 5000
# ============================================================

FROM node:18-alpine

# Install wget (needed for HEALTHCHECK) and dumb-init for proper signal handling
RUN apk add --no-cache wget dumb-init

# Production node environment
ENV NODE_ENV=production

WORKDIR /app

# ── Dependencies (cached separately from source) ──────────
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ── Application code ──────────────────────────────────────
COPY . .

# Drop to non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs
USER nodeuser

# Expose API Gateway port
EXPOSE 5000

# Health check — hits the /health endpoint every 30 s
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:5000/health || exit 1

# Use dumb-init to handle signals properly in production
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
