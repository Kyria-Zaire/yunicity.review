# Notifications sociales (TICKET-503)

## Objectif

Boucles sociales **humaines et locales** : likes et commentaires sur le fil citoyen, évolution Passport — avec push Expo (TICKET-307) et historique in-app.

Intention UX : [`docs/ux/social-notifications-intent.md`](../ux/social-notifications-intent.md).

## Modèle

Table `user_notifications` :

| Colonne | Rôle |
|---------|------|
| `type` | `POST_LIKED`, `POST_COMMENTED`, `PASSPORT_LEVEL_UNLOCKED` |
| `actor_id` | Utilisateur à l’origine (nullable pour système) |
| `target_user_id` | Destinataire |
| `target_post_id` | Post concerné (nullable) |
| `deeplink` | Ex. `/feed?post={id}` |
| `payload` | JSONB (`actor_name`, `post_excerpt`, …) |
| `is_read` | État inbox |

## Préférences

`user_profiles.notification_preferences` (existant), défauts :

```json
{ "social": true, "passport": true, "offers": true }
```

`PATCH /api/v1/users/me/preferences` — mise à jour partielle.

## API inbox

| Méthode | Route |
|---------|--------|
| GET | `/api/v1/notifications` |
| PATCH | `/api/v1/notifications/{id}/read` |
| POST | `/api/v1/notifications/read-all` |

Push : payload `{ type: "social", post_id, actor_name }` via service existant.

## Règles MVP

- Posts **citoyens** uniquement pour like/comment (pas org en MVP)
- `skip_notification_if_self(actor, target)`
- Cooldown anti-doublon (même type + acteur + post)
- Pas de regroupement, pas de websocket

## Exclusions

Realtime websocket, typing, browser push web, trending, AI ranking, comment likes, threads complexes.

## Fichiers

- `app/services/social_notification_service.py`
- `app/core/notification_preferences.py`
- `frontend/packages/utils/src/social-notification-labels.ts`
