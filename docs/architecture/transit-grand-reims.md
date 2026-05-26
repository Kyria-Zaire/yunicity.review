# Transit Grand Reims Mobilités / CITURA (WEB-MAP-02)

## Objectif produit

Afficher sur la carte web les **prochains passages** à proximité d’un point (centre carte, moment sélectionné ou centre ville), sans application transport complète.

## Source de données

| Source | Usage MVP |
|--------|-----------|
| GTFS statique Grand Reims Mobilités | Horaires théoriques (`mode: scheduled`) |
| GTFS-RT (optionnel) | Non branché en MVP — variable `GRAND_REIMS_GTFS_RT_URL` réservée |

Import : `backend/scripts/import_grand_reims_gtfs.py`  
Variables : `GRAND_REIMS_GTFS_URL` ou `GRAND_REIMS_GTFS_LOCAL_PATH` (voir `backend/.env.example`).

## Architecture backend

1. **Import** : parse ZIP GTFS (stdlib), génère départs sur ~48 h.
2. **Tables** : `transit_stops`, `transit_departures`, `transit_feed_meta`.
3. **API** : `GET /api/v1/transit/nearby?lat=&lon=&city=Reims&radius_meters=600&limit=5`
4. **Requête** : haversine sur arrêts → 2 prochains départs par arrêt, max 5 arrêts.
5. **Cache** : mémoire process, clé lat/lon arrondis, TTL 60 s.

Pas de routing, pas de persistance de la position utilisateur.

## Scheduled vs realtime

| `mode` | Affichage UI |
|--------|----------------|
| `scheduled` | Disclaimer : « Horaires indicatifs Grand Reims Mobilités » |
| `realtime` | Uniquement si `transit_feed_meta.mode = realtime` et départs `realtime: true` |

**Interdit** : libellé « En direct » / badge LIVE sans GTFS-RT validé.

## Limites GTFS

- Horaires **théoriques** (retards, suppressions non reflétés sans RT).
- Fenêtre d’import : ~2 jours — relancer l’import régulièrement (cron recommandé).
- Calendrier `calendar.txt` + `calendar_dates.txt` pris en compte à l’import.

## Confidentialité

- Pas de géolocalisation navigateur.
- `lat` / `lon` = centre bbox carte ou coordonnées événement sélectionné.
- Aucune écriture en base de la position reçue.

## Refresh / cache

- Client : refetch quand le point de requête change (arrondi ~100 m via clé API).
- Serveur : cache 60 s par tuile lat/lon.

## Fallback

- Feed non importé → `stops: []`, disclaimer indicatif conservé.
- Erreur réseau frontend → « Horaires indisponibles pour le moment. »

## Évolutions possibles

- Cron import GTFS + alertes si `transit_feed_meta` trop ancien.
- GTFS-RT pour `mode: realtime` avec merge sur `scheduled_at`.
- Lien profond vers fiche arrêt Grand Reims Mobilités.
