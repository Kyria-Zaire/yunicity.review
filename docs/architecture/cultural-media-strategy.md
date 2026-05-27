# Stratégie média culturelle (WEB-SEARCH-02B.1)

## Objectif

Couche média durable pour les lieux culturels Yunicity (Search, Map, pages lieu futures, Passport, quartiers, hero éditorial), sans scraping illégal ni dépendance à des images « trouvées sur Google ».

## Modèle de données

Table `cultural_places` :

| Champ | Rôle |
|-------|------|
| `image_url` | Compatibilité legacy — synchronisé avec le hero normalisé |
| `hero_image_url` | Image principale (cartes, hero) |
| `thumbnail_image_url` | Vignette liste (dérivée du hero si absente) |
| `gallery_images` | JSON : `[{ url, alt, credit, source }]` |
| `photo_credit` | Crédit affiché (UI) |
| `image_source` | Provenance normalisée (`wikimedia_commons`, …) |
| `editorial_excerpt` | Accroche courte éditoriale |
| `image_blurhash` | Réservé pipeline futur (nullable) |
| `featured_priority` | Tri éditorial (entier, desc) |
| `is_featured` | Filtre « à la une » |

Normalisation serveur : `normalize_cultural_media()` dans `app/services/cultural_media.py`.

## Sources autorisées

| Source | Usage MVP | Notes |
|--------|-----------|--------|
| Wikimedia Commons | **Seed Reims** | `Special:FilePath` + crédit + licence |
| Unsplash API | Futur | Clé API, ToS Unsplash |
| Openverse | Futur | Métadonnées licence |
| Images officielles libres | Cas par cas | URL stable + licence documentée |
| Assets Yunicity (R2) | Futur | Upload contrôlé |

## Interdit

- Scraping Google Images ou sites sans licence claire
- Hotlinking vers des hôtes non documentés
- Stockage de copyright inconnu

## Pipeline actuel (MVP)

1. Seed `reims_cultural_media.py` — métadonnées + URLs Commons
2. `normalize_cultural_media()` à l’écriture seed et à la lecture API
3. API `/cultural-places`, `/map/cultural-places` exposent hero, galerie, crédits
4. Frontend : `resolveCulturalPlaceImageUrl()` — pas de redesign massif

## Overrides temporaires (WEB-SEARCH-02B.2)

Suite à la review CTO du ticket `WEB-SEARCH-02B.2`, des overrides frontend
temporaires sont acceptés **uniquement en recette visuelle** pour 4 lieux
culturels Reims (par `slug`) afin de stabiliser le rendu du polish Search/Map :

- `porte-de-mars`
- `basilique-saint-remi`
- `palais-du-tau`
- `cathedrale-notre-dame`

Implémentation :

- `frontend/apps/web/lib/cultural-place-image-overrides.ts`
- consommé dans les surfaces web `Search` et `Map` où `CulturalPlace` est affiché

Contraintes CTO :

- ces URLs tierces (Bing / Linternaute / Actualitix / CDN externe) ne sont **pas**
  une source média long terme ;
- risque de droits/licences, hotlinking, disponibilité non garantie ;
- aucun passage prod avec ces overrides sans migration média.

Plan obligatoire avant prod :

1. valider la licence de chaque image retenue ;
2. migrer les assets vers stockage Yunicity (R2 + CDN) ;
3. remplacer les overrides par URLs R2 officielles dans le seed/API ;
4. retirer le fallback d’override frontend temporaire.

## Évolutions prévues

### Stockage R2 (Cloudflare)

- Copier les médias Commons vers bucket dédié `cultural-media/`
- URLs signées ou publiques CDN
- Réduction dépendance redirect Commons

### Optimisation

- Variantes WebP/AVIF par taille (`thumb`, `card`, `hero`)
- Génération à l’import ou via worker

### Blurhash

- Calcul offline à l’ingestion
- Remplir `image_blurhash` pour placeholders LQIP

### CDN

- Cache edge sur bucket R2
- Headers `Cache-Control` longs pour assets versionnés

### Modération média (hors scope 02B.1)

- Workflow admin upload + validation licence
- File d’attente avant publication

## Frontend

- Types : `@yunicity/types` — `CulturalGalleryImage`, champs média partagés
- Utils : `resolveCulturalPlaceImageUrl`, `resolveCulturalPlaceHeroUrl`
- Galerie plein écran : ticket ultérieur (pas d’autoplay 02B.1)

## Qualité & tests

- Unitaires : `test_cultural_media.py`, `cultural-place-media.test.ts`
- Intégration : `test_cultural_places.py` (sérialisation, galerie, tri featured)

## Références code

- Migration : `alembic/versions/20260604_0021_cultural_place_media.py`
- Seed : `app/db/seeds/reims_cultural_places.py`, `reims_cultural_media.py`
- API : `app/schemas/cultural_place.py`, `app/services/cultural_place_service.py`
