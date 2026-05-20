# Tribes — Backend Foundation (TICKET-A.2)

**Références :** PRD-A0, `docs/technical/tribes-technical-spec.md`  
**Statut :** BUILD livré (MVP)

## Architecture sociale

Les tribus sont une **couche de coordination** optionnelle — le **feed ville** (`GET /api/v1/feed`) reste le cœur produit.

| Surface | Scope | Query invariant |
|---------|-------|-----------------|
| Feed global | Posts ville, offres, événements | `posts.tribe_id IS NULL` |
| Mur tribu | Posts membres uniquement | `posts.tribe_id = :tribe_id` |

## Invariant feed (critique)

```sql
-- FeedService / PostRepository.list_feed
SELECT * FROM posts
WHERE is_active = true
  AND tribe_id IS NULL
ORDER BY ...
```

**Garanties :**

- CHECK DB `ck_posts_tribe_scope` : post tribu ⇒ pas d’offer/event sync, `type = post`
- `PostService.get_post` masque les posts tribu sur l’API globale
- Tests `tests/test_tribe_feed_isolation.py`

**Interdit MVP :** repost tribu → feed, colonne `share_to_city_feed`, WebSocket.

## Modèle

- `tribes` — catalogue (public / private_invite)
- `tribe_members` — rôles `member` | `moderator` | `owner`
- `tribe_invitations` — tokens hashés, TTL 7j
- `tribe_moderation_logs` — audit exclusions / suppressions
- `posts.tribe_id` — nullable FK

## Limites MVP

| Limite | Valeur |
|--------|--------|
| Membres / tribu | 150 |
| Tribus actives / user | 5 |
| Cooldown rejoin | 7 jours |
| Cooldown publication tribu | 60 s |

## API (`/api/v1`)

- Citoyen : `tribes`, `tribe-invitations/{token}/accept`
- Staff : `admin/tribes` (création, archive)

## Modération

- Signalements : réutilisation `reports` sur posts tribu (accès membre)
- Exclusion / suppression : rôles mod+owner + logs

## Seed QA

`python -m app.db.seeds --demo` → `seed_reims_tribes` (5 tribus pilotes Reims + posts mur).

## Rationale anti-chaos

- Pas de mode secret, pas de trending, pas de realtime
- Notifications sociales feed inchangées pour posts tribu (likes/comments)
- Mur non visible hors membership même si tribu `public`
