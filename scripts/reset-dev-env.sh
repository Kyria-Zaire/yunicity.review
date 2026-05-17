#!/usr/bin/env bash
# DEV ONLY — reset des volumes Docker locaux (Postgres, Redis).
# Ne pas exécuter contre recette, preprod ou prod.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "⚠️  DEV ONLY — suppression des volumes et redémarrage de la stack locale..."
docker compose down -v
docker compose up --build -d

echo ""
echo "État des services :"
docker compose ps

echo ""
echo "Vérification PostGIS (après premier démarrage sur volume vierge) :"
echo "  docker compose exec postgres psql -U yunicity -d yunicity_dev -c \"SELECT PostGIS_Version();\""
