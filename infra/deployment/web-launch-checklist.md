# Web launch checklist — QA-05

Checklist opérationnelle pour le premier déploiement web Reims (`dev → recette → preprod → prod`).

## Architecture actuelle

| Composant | Déploiement | Notes |
|-----------|-------------|-------|
| API FastAPI | `backend/Dockerfile` + `docker-compose.yml` (dev) | Pas de compose prod complet dans le dépôt |
| Web Next.js | `pnpm --filter web build` | Pas de Dockerfile web — hébergement Node/Vercel/Railway |
| Admin Next.js | `pnpm --filter admin build` | Idem |
| PostgreSQL/PostGIS | `postgis/postgis:16-3.4` | Service managé recommandé en prod |
| Redis | `redis:7-alpine` | **Requis en prod** (rate limits auth) |

## Variables obligatoires prod

Voir `backend/.env.example` (section PROD/PREPROD) et :

| App | Variables |
|-----|-----------|
| Backend | `APP_ENV=prod`, `DEBUG=false`, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET_KEY`, `REFRESH_TOKEN_PEPPER`, `REFRESH_COOKIE_SECURE=true`, `CORS_ORIGINS`, `WEB_FRONTEND_URL`, `MEDIA_PUBLIC_BASE_URL` |
| Web | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WEB_APP_URL` |
| Admin | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WEB_APP_URL`, `NEXT_PUBLIC_ADMIN_URL` |

## Séquence de déploiement

1. Backup base cible (voir section Backups).
2. `alembic upgrade head` sur la base cible.
3. Déployer API avec variables prod validées (`Settings` refuse localhost / secrets faibles).
4. `python scripts/bootstrap_admin.py` une fois (credentials ops via secrets).
5. Build + déployer web et admin.
6. Exécuter `scripts/smoke-check.sh` contre l’URL publique.

## Migrations

```bash
cd backend
uv run alembic upgrade head
uv run alembic current
```

En Docker dev :

```bash
docker compose exec backend alembic upgrade head
```

## Healthchecks

| Endpoint | Usage |
|----------|-------|
| `GET /api/v1/health` | Liveness (toujours 200 si process up) |
| `GET /api/v1/ready` | Readiness (`database`, `redis` : `ok` \| `disabled` \| `error`) |

Monitoring : alerter si `/ready` → `degraded` ou 5xx.

## Backups (minimum viable)

| Élément | Recommandation |
|---------|----------------|
| Fréquence | Dump PostgreSQL quotidien |
| Rétention | 7 jours minimum, 30 jours idéal |
| Stockage | Bucket chiffré hors du serveur app |
| Test | Restauration sur preprod 1×/mois |
| Blocage | **Non automatisé dans le dépôt** — à configurer chez l’hébergeur DB |

## HTTPS & domaine

- Terminaison TLS au reverse proxy / CDN (Cloudflare, Railway, etc.).
- Redirection HTTP → HTTPS.
- `WEB_FRONTEND_URL` et `CORS_ORIGINS` en `https://`.
- HSTS : activer côté CDN une fois stable.
- Cookies refresh : `REFRESH_COOKIE_SECURE=true` en prod (validé au boot).

## Smoke tests jour J

Voir `scripts/smoke-check.sh`. Manuellement :

- [ ] `GET /api/v1/health` → `status: ok`
- [ ] `GET /api/v1/ready` → `ready`, DB + Redis `ok`
- [ ] Home web charge
- [ ] `/robots.txt` et `/sitemap.xml`
- [ ] Register + login
- [ ] Forgot password : **pas de `reset_url` dans la réponse** en prod
- [ ] `/sortir`, `/places`, `/creators`
- [ ] Admin login (compte bootstrap ops)
- [ ] `/docs` API **absent** en prod

## Risques connus (MVP)

| Risque | Statut |
|--------|--------|
| Pas d’envoi email forgot-password | **Bloquant fonctionnel** — token créé mais lien non envoyé ; prévoir SMTP/provider ou procédure ops |
| Pas de Dockerfile web/admin | Déploiement frontend via plateforme Node séparée |
| Backups non codés | Documentés — config hébergeur requise |
| Rate limits désactivés sans Redis | **Bloqué au boot** si `REDIS_URL` absent en prod |
