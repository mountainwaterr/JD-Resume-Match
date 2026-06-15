FROM python:3.13-slim
WORKDIR /app

# System deps for Playwright/PDF rendering (Chromium needs these libraries)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 libgbm1 \
    libasound2 libpango-1.0-0 libcairo2 libatspi2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install uv (fast Python package manager)
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

# Copy dependency files from backend subdirectory
COPY apps/backend/pyproject.toml apps/backend/uv.lock ./
RUN uv sync --frozen --no-dev

# Install Playwright Chromium with its system dependencies
RUN uv run playwright install --with-deps chromium

# Copy backend source code
COPY apps/backend/ .

# Create data directory for TinyDB
RUN mkdir -p /app/data

EXPOSE 8000

# Render sets PORT env var automatically, default to 8000
CMD uv run uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
