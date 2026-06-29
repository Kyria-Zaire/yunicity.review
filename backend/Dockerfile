FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        ffmpeg \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --system app \
    && useradd --system --gid app --home-dir /app app

COPY pyproject.toml README.md ./
COPY app ./app
COPY workers ./workers
COPY alembic ./alembic
COPY alembic.ini ./
COPY tests ./tests
COPY scripts ./scripts
COPY data ./data

RUN pip install --upgrade pip \
    && pip install -e ".[dev]"

RUN chown -R app:app /app
USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD sh -c 'curl -fsS http://127.0.0.1:${PORT:-8000}/api/v1/health || exit 1'

CMD ["sh", "-c", "uvicorn app.main:create_app --factory --host 0.0.0.0 --port ${PORT:-8000}"]
