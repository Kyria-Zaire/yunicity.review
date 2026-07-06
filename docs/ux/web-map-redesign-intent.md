# WEB-MAP-01 — Carte web Yunicity (intent)

## Objectif

Surface d’exploration territoriale calme : moments réels, quartiers, lieux — **sans** présence live, heatmap, ou métriques de surveillance.

## Layout

`WebAppShell` (WEB-HOME-01) : sidebar | centre (carte + sections) | rail droit (lg+).

## Sources de données

| Zone | API | Fallback |
|------|-----|----------|
| Markers / proximité | `GET /api/v1/map/events` (bbox + city) | États vides calmes |
| Quartiers rail | `GET /api/v1/neighborhoods` | Message éditorial |
| Lieux culturels | `GET /api/v1/search` type=organization | « Bientôt plus de lieux… » |
| Offres | `GET` passport offers (existant) | Message calme |
| Parcours urbains | **Statique éditorial** | CTA « Bientôt disponible » — pas de backend |

## Hors scope / interdit

- Compteurs de citoyens en direct
- Géolocalisation utilisateur
- Heatmap, clustering agressif
- dB / bruit sans API réelle
- Nouvelle feature backend carte

## Recherche carte

Barre → lien `/search` (pas de moteur carte dédié dans ce ticket).
