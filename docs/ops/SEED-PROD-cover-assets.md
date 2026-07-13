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

Les assets R2/CDN (`media.{env}.yunicity.city`) n'étaient pas branchés pour ces chemins.
**Mise à jour SEED-PROD-01B** : les covers des **12 lieux culturels** sont désormais servis
sur `media.yunicity.city` (voir section dédiée ci-dessous). Les **quartiers** restent en attente.

## Contournement frontend (PILOT-FIX-05B)

- `resolveMapPlaceImageUrl` / `resolveMapNeighborhoodImageUrl` (`packages/utils/src/map-media-url.ts`) : ignore les URLs seed pending, fallback éditorial quartiers.
- `MapMediaThumbnail` : `onError` → placeholder si une URL externe échoue encore.

## Correctif durable (hors scope 05B)

1. Uploader les covers lieux/quartiers sur R2 prod (`neighborhoods/reims/…`, `places/reims/…`).
2. Ou servir les fichiers depuis `frontend/apps/web/public/…` au build.
3. Mettre à jour les seeds / API pour pointer vers `media.yunicity.city` ou CDN canonique.
4. Retirer le filtre `isPendingYunicityHostedCoverUrl` une fois les assets servis.

Références : `docs/quartiers/NEIGHBORHOOD-HERO-ASSETS.md`, `backend/tests/test_prod_cultural_places_catalog_seed.py`.

## SEED-PROD-01B — covers lieux culturels servis (exécuté en prod)

Les **12 lieux culturels** de Reims ont leurs covers auto-hébergés sur R2 + CDN
`media.yunicity.city`, sourcés depuis **Wikimedia Commons** (licences vérifiées) :

`https://media.yunicity.city/places/reims/{slug}/cover.jpg` — redimensionné
(≤ 1600 px, < 250 Ko, JPEG), `image_source=wikimedia_commons`, `photo_credit` = attribution.

- Tooling : `backend/scripts/seed_prod_01b_upload_media.py` (download → resize → R2 → DB),
  manifest `backend/app/db/seeds/media_manifest_reims.json`, détail `docs/prd/active/SEED-PROD-01B.md`.
- Snapshot de sécurité (état d'avant, 12 lignes) :
  `backend/data/audit-archive/seed-prod-01b-snapshot-20260713T091802Z.json`.
- Vecteur : `railway run` sur le service API prod (secrets jamais exfiltrés).

**Hors scope (phase 2)** : `gallery_images` (placeholders d'origine conservés),
quartiers restants, et les 5 lieux hors des 12 audités.

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
3. Aligner la même logique côté lieux culturels (`cultural_place_assets.py`).
   Le manifest SEED-PROD-01B (`media_manifest_reims.json`) pointe désormais vers
   `media.yunicity.city` (exécuté en prod).
4. Décider bucket : réutilisation `yunicity-media-{env}` (recommandé) vs dédié.

Référence code : `backend/app/core/neighborhood_hero_assets.py`
(`neighborhood_media_cdn_base_url`).
