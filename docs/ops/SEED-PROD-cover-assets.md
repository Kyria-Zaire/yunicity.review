# SEED-PROD / CONTENT-ASSETS — Covers lieux & quartiers

**Ticket lié :** PILOT-FIX-05B · FEATURE-BETA-FIXES-V1  
**Statut :** Dette contenu (contournement frontend appliqué)

## Symptôme

Console prod `/map` : requêtes **404** vers :

- `https://yunicity.city/places/reims/{slug}/cover.jpg`
- `https://yunicity.city/neighborhoods/reims/{slug}/hero.jpg`

## Cause

Les seeds backend écrivent des URLs absolues vers des fichiers statiques non déployés sur le service web Next.js :

- `backend/app/core/cultural_place_assets.py` → `cover.jpg`
- `backend/app/core/neighborhood_hero_assets.py` → `hero.jpg`

Les assets R2/CDN (`cdn.yunicity.fr`, `media.yunicity.city`) ne sont pas encore branchés pour ces chemins en prod.

## Contournement frontend (PILOT-FIX-05B)

- `resolveMapPlaceImageUrl` / `resolveMapNeighborhoodImageUrl` (`packages/utils/src/map-media-url.ts`) : ignore les URLs seed pending, fallback éditorial quartiers.
- `MapMediaThumbnail` : `onError` → placeholder si une URL externe échoue encore.

## Correctif durable (hors scope 05B)

1. Uploader les covers lieux/quartiers sur R2 prod (`neighborhoods/reims/…`, `places/reims/…`).
2. Ou servir les fichiers depuis `frontend/apps/web/public/…` au build.
3. Mettre à jour les seeds / API pour pointer vers `media.yunicity.city` ou CDN canonique.
4. Retirer le filtre `isPendingYunicityHostedCoverUrl` une fois les assets servis.

Références : `docs/quartiers/NEIGHBORHOOD-HERO-ASSETS.md`, `backend/tests/test_prod_cultural_places_catalog_seed.py`.
