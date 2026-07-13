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

## Dette suivie — INFRA-CDN-FIX-01 (incohérence CDN quartiers prod/preprod)

**Statut :** ouverte — hors scope actuel · **Priorité :** P2

**Corrigé (PR #105)** : la branche **recette** de `neighborhood_seed_cover_url`
sert désormais via `media.recette.yunicity.city` (convention INFRA-01), au lieu
du domaine erroné `cdn.yunicity.fr` codé en dur.

**Reste à unifier** : en **prod / preprod**, les heros quartiers sont encore
servis via `web_frontend_url` (fichiers statiques Next.js), **pas** via
`media.{env}.yunicity.city` comme le sont les **lieux culturels**, les **vidéos**
et les **médias profil**. Incohérence architecturale : deux voies de service
d'assets coexistent.

**À faire quand on standardise tous les assets sur le CDN média :**

1. Uploader les heros quartiers sur R2 (`neighborhoods/reims/{slug}/hero.jpg`).
2. Faire pointer `neighborhood_seed_cover_url` (prod/preprod) vers
   `neighborhood_media_cdn_base_url(app_env)` au lieu de `web_frontend_url`.
3. Aligner la même logique côté lieux culturels (`cultural_place_assets.py`) et
   le manifest SEED-PROD-01B (`media_manifest_reims.json` référence encore
   `cdn.yunicity.fr`).
4. Décider bucket : réutilisation `yunicity-media-{env}` (recommandé) vs dédié.

Référence code : `backend/app/core/neighborhood_hero_assets.py`
(`neighborhood_media_cdn_base_url`).
