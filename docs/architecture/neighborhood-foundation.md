# Architecture — Neighborhood Foundation (TICKET-602)

> **PRD :** `docs/prd/PRD-601-neighborhoods-territorial-identity.md`  
> **Phase :** BUILD — fondation backend uniquement  
> **Principe :** le quartier **contextualise** la ville ; il ne **fragmente** pas la ville.

---

## 1. Philosophie backend territoriale

- **Lecture > écriture citoyenne** : les quartiers sont un **catalogue éditorial** (staff/admin), pas un objet social créé par les utilisateurs.
- **Nullable partout** : `neighborhood_id` optionnel sur `posts`, `local_events`, `partner_offers`, `organizations`.
- **Ville-first inchangé** : le feed reste ordonné par ville ; `neighborhood_summary` est une **méta** légère sur les cartes.
- **Pas de feed par quartier** : aucun endpoint `GET /neighborhoods/{slug}/feed` autonome au MVP.

## 2. Anti-tribalisation (architecture)

| Interdit produit | Garde-fou technique |
|----------------|---------------------|
| Leaderboard / trending quartiers | Aucune requête `ORDER BY score` ; stats = comptages bruts admin-only |
| Groupes / chat quartier | Pas de tables membership quartier |
| Création libre | `POST` quartier réservé `moderation.manage` \| `system.admin` |
| Feed autonome | Context service en lecture pour fiche quartier ; pas de curseur feed dédié |
| Heatmaps addictives | `latitude`/`longitude`/`radius_meters` stockés pour **futur** carte statique ; pas d’exposition agrégée temps réel |

## 3. Contextualisation légère

```text
City (Reims)
 └── Neighborhood (slug stable, catalogue)
        ├── optional → Organization
        ├── optional → LocalEvent
        ├── optional → PartnerOffer
        └── optional → Post
```

Résolution feed (`neighborhood_summary`) :

1. `post.neighborhood_id` si présent  
2. sinon `local_event.neighborhood_id` (posts type event)  
3. sinon `partner_offer.neighborhood_id` (posts type offer)  

Pas de géoloc citoyen automatique au MVP.

## 4. Relation ville ↔ quartier

- Contrainte DB : `UNIQUE (city, slug)`.
- API publique : `city` **obligatoire** en query (`?city=Reims`) pour list/detail par slug.
- Slug stable pour URLs et cache ; modifications via admin `PATCH` sans changer le slug (identifiant URL).

## 5. Stratégie future cartes

- Champs `latitude`, `longitude`, `radius_meters` : ancrage géographique **approximatif** pour cartes éditoriales V2.
- Pas de PostGIS queries quartier en MVP ; pas de géofence citoyen.
- Carte = couche DESIGN future (PRD-601 §12), hors TICKET-602.

## 6. Cohérence Passport / events / feed

| Module | Intégration 602 |
|--------|-----------------|
| **Feed** | `FeedPostItem.neighborhood_summary` nullable `{ slug, display_name }` |
| **Events** | `local_events.neighborhood_id` nullable ; pas de changement workflow modération |
| **Offers** | `partner_offers.neighborhood_id` nullable |
| **Passport** | Aucune progression quartier ; future agrégation « quartiers croisés » via redemptions/org (TICKET-605+) |
| **Notifications** | Inchangé ; pas de notif « trending quartier » |

## 7. Exclusions strictes (backend)

- Pas de table `neighborhood_members`.
- Pas de `neighborhood_reputation` / scores.
- Pas d’endpoint ranking ou « popular neighborhoods ».
- Pas de création quartier par organizations ou citoyens.

## 8. Rollout Reims

- Seed idempotent : `app/db/seeds/reims_neighborhoods.py` (6 quartiers pilotes).
- Exécuté avec `python -m app.db.seeds` (catalogue éditorial, pas flag `--demo`).
- Feature flag futur : `neighborhoods_enabled` (hors 602).

## 9. Modération territoriale

- CRUD admin sous `/api/v1/admin/neighborhoods`.
- Permissions : `moderation.manage` ou `system.admin`.
- `DELETE` → **désactivation** (`is_active=false`), pas suppression physique si contenus liés.
- Contenus orphelins : FK `ON DELETE SET NULL` sur les `neighborhood_id`.

## 10. Risques produit & mitigations

| Risque | Mitigation |
|--------|------------|
| Sur-segmentation feed | Summary optionnel ; fil ville par défaut |
| Slug collision inter-villes | Unique (city, slug) |
| Fuite données cross-city | Filtrage `city` obligatoire en API publique |
| Stats utilisées comme ranking | Exposées uniquement dans context admin/fiche détail, sans ordre compétitif public |

---

## Références code

| Composant | Chemin |
|-----------|--------|
| Modèle | `app/models/neighborhood.py` |
| Migration | `alembic/versions/20260528_0014_neighborhoods.py` |
| Service | `app/services/neighborhood_service.py` |
| Context | `app/services/neighborhood_context_service.py` |
| API publique | `app/api/v1/neighborhoods.py` |
| API admin | `app/api/v1/admin_neighborhoods.py` |
| Seed | `app/db/seeds/reims_neighborhoods.py` |
