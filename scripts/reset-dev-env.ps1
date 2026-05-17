# DEV ONLY — reset des volumes Docker locaux (Postgres, Redis).
# Ne pas exécuter contre recette, preprod ou prod.
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "DEV ONLY — suppression des volumes et redemarrage de la stack locale..."
docker compose down -v
docker compose up --build -d

Write-Host ""
Write-Host "Etat des services :"
docker compose ps

Write-Host ""
Write-Host "Verification PostGIS (apres premier demarrage sur volume vierge) :"
Write-Host '  docker compose exec postgres psql -U yunicity -d yunicity_dev -c "SELECT PostGIS_Version();"'
