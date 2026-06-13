# Assets hero — Quartiers V2 (Reims)

| Champ | Valeur |
|-------|--------|
| Ticket | Q2-S1-04 |
| Statut | BUILD — placeholders contrôlés DEV |
| ADR | `docs/architecture/ADR-QUARTIERS-V2.md` (ADR-05 médias) |

---

## Objectif

Chaque quartier Reims possède une **identité visuelle stable**, hébergée par Yunicity, sans hotlink externe, prête pour R2/CDN.

---

## Convention de nommage

| Usage | Clé / chemin |
|-------|----------------|
| Clé R2 hero | `neighborhoods/reims/{slug}/hero.jpg` |
| Clé R2 cover (futur) | `neighborhoods/reims/{slug}/cover.jpg` |
| Champ ORM hero | `neighborhoods.hero_image_storage_key` |
| Champ ORM cover (URL publique) | `neighborhoods.cover_image_url` |

Helpers backend : `backend/app/core/neighborhood_hero_assets.py`

```python
neighborhood_hero_storage_key("boulingrin")
# → "neighborhoods/reims/boulingrin/hero.jpg"

neighborhood_dev_public_hero_url("boulingrin")
# → "/neighborhoods/reims/boulingrin/hero.jpg"

neighborhood_cdn_hero_url("boulingrin")
# → "https://cdn.yunicity.fr/neighborhoods/reims/boulingrin/hero.jpg"
```

---

## Dossier DEV (placeholders)

Fichiers statiques Next.js web :

```txt
frontend/apps/web/public/neighborhoods/reims/{slug}/hero.jpg
```

Génération (idempotent) :

```bash
cd backend
uv run python scripts/generate_neighborhood_hero_placeholders.py
```

Les placeholders actuels sont des **JPEG minimaux contrôlés** (1×1 px). Ils seront remplacés par des visuels éditoriaux sans changer les clés ni les URLs.

---

## PROD / R2-ready

| Environnement | `cover_image_url` seed | CDN |
|---------------|------------------------|-----|
| DEV | `/neighborhoods/reims/{slug}/hero.jpg` | Next `public/` |
| RECETTE+ | `https://cdn.yunicity.fr/neighborhoods/reims/{slug}/hero.jpg` | R2 + CDN Yunicity |

Upload R2 : **hors scope Q2-S1-04** — clés et chemins sont déjà alignés Local Video (`neighborhoods/…`).

---

## Format recommandé

| Paramètre | Valeur |
|-----------|--------|
| Format | JPG ou WebP |
| Ratio | 16:9 (hero) ou 4:3 (cover carte) |
| Largeur max | 1600 px |
| Poids cible | < 250 Ko |
| Crédits | Yunicity / partenaire autorisé uniquement |

---

## Checklist — ajouter un quartier

1. Ajouter le slug dans `REIMS_NEIGHBORHOOD_SEED` + éditorial V2.
2. Déposer `public/neighborhoods/reims/{slug}/hero.jpg` (ou régénérer via script).
3. Vérifier seed `seed_reims_neighborhoods_v2_hero_assets` (clé + URL).
4. Tester `GET /api/v1/neighborhoods/{slug}?city=Reims` → `hero.hero_image_storage_key` et `cover_image_url` non nuls.
5. Vérifier absence de hotlink dans `cover_image_url`.

---

## Interdictions

- Bing, iStock, Unsplash, Shutterstock, Rossel, L'Hebdo, Wikipedia/Wikimedia
- URLs presse ou blogs tiers comme source de vérité
- Hotlinks comme fallback runtime (voir `editorial-fallback-images.ts` — à retirer progressivement côté front quand tous les `cover_image_url` sont seedés)

Contrôle seed/tests : `FORBIDDEN_COVER_URL_FRAGMENTS` dans `neighborhood_hero_assets.py`.

---

## API consommée

`GET /api/v1/neighborhoods/{slug}` expose :

```json
{
  "cover_image_url": "/neighborhoods/reims/boulingrin/hero.jpg",
  "hero": {
    "cover_image_url": "/neighborhoods/reims/boulingrin/hero.jpg",
    "hero_image_storage_key": "neighborhoods/reims/boulingrin/hero.jpg"
  }
}
```

Le frontend actuel (`resolveNeighborhoodHeroImage`) priorise `cover_image_url` — pas de refonte UI requise.
