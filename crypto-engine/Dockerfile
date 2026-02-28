# ============================================================
# DNA Certificate System — Crypto Engine
# Base: python:3.11-slim  |  Exposes: 8000
# ============================================================

FROM python:3.11-slim

# Prevent .pyc files being written; keep stdout/stderr unbuffered
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install curl (needed for HEALTHCHECK)
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Dependencies (cached separately from source) ──────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Application code ──────────────────────────────────────
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Health check — hits the /health endpoint every 30 s
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Production: 2 uvicorn workers, structured logging
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "2", \
     "--log-level", "info", \
     "--no-access-log"]
