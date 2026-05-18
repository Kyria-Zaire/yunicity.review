# Frontend — Yunicity

Monorepo **pnpm** + **Turborepo** : Next.js (web + admin), Expo (mobile), packages partagés.

## Stack

- TypeScript strict
- Next.js 15 (App Router) + Tailwind CSS
- Expo 52 + Expo Router (mobile)
- `@yunicity/types` · `@yunicity/utils` · `@yunicity/ui` (tokens)

## Auth (TICKET-105)

### Architecture

| Couche | Rôle |
|--------|------|
| `@yunicity/types` | `AuthUser`, `LoginRequest`, `RegisterRequest`, … |
| `@yunicity/utils` | `AuthClient`, `RefreshManager`, `MemoryTokenStorage` |
| Apps | `AuthProvider`, pages login/register, `ProtectedRoute` |

### Web / Admin (cookie refresh)

1. `POST /auth/login` avec `credentials: "include"`
2. Le backend pose le cookie httpOnly `refresh_token` (path `/api/v1/auth`)
3. L’**access token** reste en **mémoire** (`MemoryTokenStorage`) — jamais de refresh en `localStorage`
4. Au chargement : `POST /auth/refresh` (cookie) puis `GET /auth/me`
5. Sur **401** : refresh automatique (max 1 tentative) puis retry ou déconnexion

### Mobile (body refresh + SecureStore)

1. `POST /auth/login` avec header `X-Client-Platform: mobile`
2. Réponse JSON : `access_token` + `refresh_token`
3. Stockage **expo-secure-store** uniquement (pas AsyncStorage)
4. `POST /auth/refresh` envoie `{ refresh_token }` et met à jour les deux tokens (rotation)

### Erreurs

| HTTP | Comportement frontend |
|------|------------------------|
| 401 | Session expirée / non connecté → redirect login |
| 403 | Permission insuffisante (message API) |

### Pages

| App | Routes |
|-----|--------|
| Web | `/login`, `/register`, `/protected` |
| Admin | `/login`, `/protected-admin` |
| Mobile | `/login`, `/register`, `/(protected)/home` |

## Structure

```
frontend/
├── apps/web/
├── apps/admin/
├── apps/mobile/
├── packages/types/     # auth.ts + health types
├── packages/utils/     # auth-client, refresh-manager
└── packages/ui/
```

## Prérequis

- Node.js ≥ 20
- pnpm 9
- Backend http://localhost:8000 (`docker compose up` à la racine)
- CORS backend : origines `3000`, `3001`, `19006` avec `credentials`

## Installation

```bash
cd frontend
pnpm install
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

Variables publiques :

- `NEXT_PUBLIC_API_URL` (web + admin)
- `EXPO_PUBLIC_API_URL` (mobile)

## Commandes

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm test          # vitest — refresh-manager (@yunicity/utils)
pnpm build
pnpm validate
```

Par app :

```bash
pnpm --filter web dev
pnpm --filter admin dev
pnpm --filter mobile start
```

## URLs dev

| App | URL |
|-----|-----|
| Web | http://localhost:3000 |
| Admin | http://localhost:3001 |
| API | http://localhost:8000 |

## Tests

- **Unitaires** : `packages/utils` — `RefreshManager` (pas de boucle infinie, déduplication)
- **E2E** : TODO — Playwright web + Detox mobile (hors scope TICKET-105)

## Mobile / émulateur

`EXPO_PUBLIC_API_URL` : souvent `http://10.0.2.2:8000` (Android) ou IP LAN pour appareil physique.

## Prochaines étapes

- TICKET métier (feed, orgs, …)
- E2E auth
- CI frontend
