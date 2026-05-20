# Événements locaux — city moments (TICKET-505)

## Vision

Fondation pour publier des **moments réels de ville** — invitations humaines, pas marketplace événementielle.

Intention UX : [`docs/ux/local-events-intent.md`](../ux/local-events-intent.md).

## Modèle

| Table | Rôle |
|-------|------|
| `local_events` | Moment local (org, dates, lieu, modération) |
| `event_interests` | Intérêt citoyen (« je suis intéressé ») — pas RSVP |

## Modération MVP

| Statut | Signification |
|--------|----------------|
| `pending_review` | En attente (org non vérifiée ou soumission) |
| `approved` | Visible citoyens + feed |
| `rejected` | Refusé par staff |

**Auto-approval** : organisation `verified` → `approved` à la création/soumission.  
Sinon → `pending_review` jusqu’à action staff (`moderation.manage`).

## Types MVP (champ libre `event_type`)

`cafe_meetup`, `local_market`, `association_evening`, `student_event`, `local_concert`, `exhibition`, `creator_meetup`, `partner_event`.

## API citoyen

| Méthode | Route | Rôle |
|---------|-------|------|
| GET | `/events` | Liste approuvés (ville, pagination) |
| GET | `/events/{id}` | Détail |
| POST | `/events/{id}/interest` | Toggle intérêt |
| GET | `/events/me/saved` | Moments sauvegardés |

## API partenaire

Sous `/organizations/me/events` — CRUD brouillon, submit.

## API admin

`/admin/local-events` — approve / reject.

## Feed

`PostType.EVENT` + `FeedEventSyncService` à l’approbation — carte `EventFeedCard` (éditoriale).

## Notifications

`LOCAL_EVENT_PUBLISHED` (sobre, préférence `offers` ou `events` via payload category).

## Exclusions

Billetterie, paiement, trending, présence temps réel, stories, live, growth loops.
