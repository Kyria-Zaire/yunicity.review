# Tampons locaux — mémoire territoriale (TICKET-504)

## Vision

Transformer les interactions physiques (scan, redemption) en **souvenirs** dans le Passport — pas en achievements.

Intention UX : [`docs/ux/local-stamps-intent.md`](../ux/local-stamps-intent.md).

## Modèle

| Table | Rôle |
|-------|------|
| `stamp_definitions` | Catalogue extensible (slug, titre, trigger, icône) |
| `citizen_local_stamps` | Souvenir utilisateur (user, définition, org/offer optionnels, metadata) |

**Note** : `passport_stamps` (TICKET-302) = visites organisation historiques ; l’API `/passport/stamps` fusionne visites + souvenirs locaux, triés par date.

## Déduplication

- Unique `(user_id, stamp_definition_id, organization_id)` si org présente
- Unique `(user_id, stamp_definition_id)` pour tampons globaux (org NULL)
- Vérification service avant insert

## Définitions MVP (seed)

| Slug | Déclencheur |
|------|-------------|
| `first_local_place` | Première redemption chez un partenaire (par org) |
| `first_scan_validated` | Première redemption via scan (global) |
| `first_flash_memory` | Première redemption d’offre flash active |

## Génération

`LocalStampService` — hooks après `scan_redemption` (et redemption citoyenne).

## Backfill

`python -m app.scripts.backfill_local_stamps` — early users avec redemptions historiques.

## Notifications

`LOCAL_STAMP_EARNED` via `SocialNotificationService` — ton sobre.

## Feed

`PASSPORT_STAMP_FEED_EVENTS=false` par défaut.

## Exclusions

NFT, streaks, leaderboard, farming, 100 badges, rareté gaming.
