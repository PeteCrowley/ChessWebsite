# Use a slim Python image
FROM python:3.13-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    PATH="/root/.local/bin:$PATH"

WORKDIR /app

# Install system deps required for many Python packages (adjust if you know you don't need some)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc libpq-dev curl && \
    rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first (cacheable layer)
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy project code
COPY . /app

# Create a non-root user for runtime
RUN useradd --create-home appuser && chown -R appuser:appuser /app
USER appuser

# Ensure the deploy directory exists and contains the entrypoint
WORKDIR /app

# Use the entrypoint to run migrations then start the server
ENTRYPOINT ["./start.sh"]
