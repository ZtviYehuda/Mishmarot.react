# ── Stage 1: Build base ───────────────────────────────────────────────────────
FROM python:3.11-slim AS base

WORKDIR /app

# Install system deps needed by psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# ── Stage 2: Production image ─────────────────────────────────────────────────
FROM python:3.11-slim AS production

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from build stage
COPY --from=base /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=base /usr/local/bin /usr/local/bin

# Copy application code (excludes items in .dockerignore)
COPY . .

# Create uploads directory
RUN mkdir -p /app/app/uploads

EXPOSE 5000

# Run with Gunicorn: 4 workers, bind to all interfaces
CMD ["gunicorn", "--workers=4", "--bind=0.0.0.0:5000", "--timeout=120", "--log-level=info", "run:app"]
