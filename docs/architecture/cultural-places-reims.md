# Lieux culturels Reims (WEB-MAP-03)

Couche « lieux emblématiques » pour la carte web Yunicity : données backend, rail droit, marqueurs carte, itinéraire piéton Mapbox Directions côté client.

## Sources et droits images

| Élément | Statut MVP |
|--------|------------|
| Coordonnées | Références publiques (DATAtourisme / géolocalisation institutionnelle) — seed éditorial Yunicity |
| Textes courts | Rédaction Yunicity à partir de faits publics, sans prétendre être une fiche officielle OT |
| Images | **`image_url` = null** tant que les droits ne sont pas validés — placeholder premium côté web |
| Crédits | `source_name`, `source_url`, `image_credit`, `image_license` sur le modèle ; renseignés quand une image est ajoutée |

Seed : `backend/app/db/seeds/reims_cultural_places.py` — 11 lieux (cathédrale, Palais du Tau, Saint-Remi, musée Saint-Remi, Porte de Mars, Halles du Boulingrin, Place Royale, Place d’Erlon, Carnegie, Villa Demoiselle, Pommery).

**Interdit** : hotlink non autorisé, crédits inventés, scraping d’images.

## Modèle et migration

Table `cultural_places` — migration `20260603_0020_cultural_places`.

Index : `city`, `is_active`, `is_featured`, contrainte unique `(city, slug)`.

## API

| Endpoint | Usage |
|----------|--------|
| `GET /api/v1/cultural-places?city=Reims&featured=true&limit=8` | Rail « Lieux culturels » (4 en prod rail) |
| `GET /api/v1/cultural-places/{slug}?city=Reims` | Détail lieu |
| `GET /api/v1/map/cultural-places` | Bbox carte (`lat_min`, `lon_min`, `lat_max`, `lon_max`, `city`, `limit`) |

Lieux `is_active=false` exclus des listes publiques.

## Frontend

- Types : `packages/types/src/cultural-place.ts`
- Client : `packages/utils/src/cultural-places-api.ts`, labels `cultural-place-labels.ts`
- Rail : `map-cultural-places-rail.tsx` — CTA itinéraire, « Depuis ma position », détails
- Carte : marqueurs violet `#5C4D7D`, polyline itinéraire bleue Yunicity
- Directions : `fetchMapboxWalkingRoute` (Mapbox Directions API v5, mode `walking`, appel navigateur)

## Routing et privacy

1. **Pas de géoloc au chargement** — aucun `watchPosition`, aucun stockage de position.
2. **« Voir l’itinéraire »** — origine = centre de la bbox visible, sinon centre ville (Reims par défaut).
3. **« Depuis ma position »** — seul déclencheur de `navigator.geolocation.getCurrentPosition` (one-shot, pas de suivi). En cas de refus/erreur : repli sur le centre carte.
4. **Calcul** — 100 % client via token `NEXT_PUBLIC_MAPBOX_TOKEN` ; pas de proxy routing backend.
5. Panneau : titre, durée, distance, mode à pied, bouton fermer.

## Limites MVP

- Pas de multimodal / CITURA dans l’itinéraire culturel
- Pas de modes driving/cycling (report post-MVP)
- Images institutionnelles à valider avant `image_url`
- Pas de page détail dédiée lieu (toggle description dans le rail uniquement)

## Tests

Backend : `tests/test_cultural_places.py` (nécessite `DATABASE_URL` + seed).

```bash
cd backend
uv run alembic upgrade head
uv run python -m app.db.seeds
uv run pytest tests/test_cultural_places.py -q
```

Frontend :

```bash
cd frontend
pnpm lint && pnpm typecheck && pnpm --filter web build
```
