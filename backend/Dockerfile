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

# UID/GID FIXES et non privilegies. `useradd --system` choisit un identifiant
# dynamique (999 ici) : un rebuild pourrait le deplacer et rendre illisible un volume
# deja peuple, dont les fichiers porteraient l'ancien proprietaire. L'API et le worker
# partageant ce conteneur, ils partagent aussi cette identite.
ARG APP_UID=10001
ARG APP_GID=10001
RUN groupadd --system --gid ${APP_GID} app \
    && useradd --system --uid ${APP_UID} --gid ${APP_GID} --home-dir /app app

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

# Point de montage du volume média du service unifié, créé DANS L'IMAGE et possédé par
# `app`. Docker et Railway initialisent un volume vierge avec les droits du répertoire
# qu'il recouvre : sans cette ligne, le volume arrive en root:root et le conteneur non
# privilégié ne peut rien y écrire (mesuré : « Permission denied », uid=999).
RUN mkdir -p /data/media/local-video /data/media/profiles /data/media/stories \n    && chown -R app:app /data

USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD sh -c 'curl -fsS http://127.0.0.1:${PORT:-8000}/api/v1/health || exit 1'

CMD ["sh", "-c", "uvicorn app.main:create_app --factory --host 0.0.0.0 --port ${PORT:-8000}"]
