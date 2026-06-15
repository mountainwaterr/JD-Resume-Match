# ============================================
# Stage 1: Build Frontend
# ============================================
FROM node:22-bookworm AS frontend-builder

ENV NEXT_TELEMETRY_DISABLED=1

# BACKEND_ORIGIN must match the port start.sh runs the backend on (8000)
ARG BACKEND_ORIGIN=http://127.0.0.1:8000
ENV BACKEND_ORIGIN=${BACKEND_ORIGIN}

WORKDIR /app/frontend

COPY apps/frontend/package*.json ./
RUN npm ci

COPY apps/frontend/ ./
RUN npm run build

# ============================================
# Stage 2: Final Image
# ============================================
FROM python:3.13-slim-bookworm

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 \
    libasound2 libpango-1.0-0 libcairo2 libatspi2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Node.js runtime from frontend builder
COPY --from=frontend-builder /usr/local/bin/node /usr/local/bin/node

# Backend
COPY apps/backend /app/backend
WORKDIR /app/backend
RUN pip install . && python -m playwright install chromium

# Frontend standalone output
COPY --from=frontend-builder /app/frontend/.next/standalone /app/frontend/
COPY --from=frontend-builder /app/frontend/.next/static /app/frontend/.next/static
COPY --from=frontend-builder /app/frontend/public /app/frontend/public

# Startup script
COPY docker/start.sh /app/start.sh
RUN sed -i 's/\r$//' /app/start.sh && chmod +x /app/start.sh

# Data directory for TinyDB
RUN mkdir -p /app/backend/data

WORKDIR /app

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=10s --start-period=30s --retries=5 \
    CMD curl -f http://127.0.0.1:8000/api/v1/health || exit 1

CMD ["/app/start.sh"]
