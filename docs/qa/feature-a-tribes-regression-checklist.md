# Feature A — Tribus — Checklist régression

**Ticket clôture :** A.5 · **Environnement :** dev / recette

## Backend

- [ ] `uv run alembic upgrade head` (incl. `20260530_0016`)
- [ ] `GET /api/v1/tribes?city=Reims`
- [ ] `POST /api/v1/tribes/{slug}/join` (public)
- [ ] `POST /api/v1/tribes/{slug}/leave` (204)
- [ ] `GET /api/v1/tribes/{slug}/posts` (membre only)
- [ ] `GET /api/v1/feed` sans posts tribu
- [ ] `GET /api/v1/posts/{tribe_post_id}` → 404
- [ ] `GET /api/v1/tribe-invitations/me`
- [ ] `POST /api/v1/tribe-invitations/me/{id}/accept|decline`
- [ ] `uv run pytest tests/test_tribes.py tests/test_tribe_feed_isolation.py tests/test_tribe_invitations_inbox.py -q`

## Web

- [ ] `/tribes` liste + section invitations
- [ ] `/tribes/{slug}` join / leave / mur / membres
- [ ] `/tribes/invitation?token=`
- [ ] Modération owner/mod (panel)
- [ ] Lien retour fil local
- [ ] `pnpm --filter web build`

## Mobile

- [ ] Onglet Tribus
- [ ] Liste + pagination
- [ ] Détail join/leave
- [ ] Mur texte + composer
- [ ] Appui long modération post / membre
- [ ] Invitations reçues + lien token
- [ ] `pnpm --filter mobile build`

## Feed isolation (critique)

- [ ] Post tribu absent fil web
- [ ] Post tribu absent fil mobile
- [ ] Pas de repost API
- [ ] Mur inaccessible hors membership

## Seed démo

- [ ] `python -m app.db.seeds --demo` → 5 tribus Reims
- [ ] `benevoles-associatifs` en `private_invite`
- [ ] Posts mur présents

## Upload image tribu

- [ ] **Reporté** — pas de pipeline upload stable dédié ; mur texte + URL web optionnelle uniquement

## Qualité monorepo

- [ ] `pnpm lint` · `pnpm typecheck`
- [ ] `pnpm --filter @yunicity/utils test`

## Exclusions confirmées

Realtime · WebSocket · channels · DMs tribu · leaderboard · trending · gamification
