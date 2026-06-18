FROM python:3.13-slim
WORKDIR /app

# System deps for Playwright/PDF rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

# Python dependencies
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Playwright browsers
RUN uv run playwright install --with-deps chromium

# Source code
COPY . .

EXPOSE 8000
CMD uv run uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
