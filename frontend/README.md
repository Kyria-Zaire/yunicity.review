# Frontend — Yunicity

Monorepo **pnpm** + **Turborepo** : Next.js (web + admin), Expo (mobile), packages partagés.

## Stack

- TypeScript strict
- Next.js 15 (App Router) + Tailwind CSS
- Expo 52 + Expo Router (mobile)
- `@yunicity/types` · `@yunicity/utils` · `@yunicity/ui` (tokens)

Pas d’auth, pas de feed, pas de secrets côté client.

## Structure

```
frontend/
├── apps/web/          # App citoyenne — GET /api/v1/health
├── apps/admin/        # Back-office shell — GET /api/v1/ready
├── apps/mobile/       # Expo — bouton health check
├── packages/types/
├── packages/utils/
└── packages/ui/
```

## Prérequis

- Node.js ≥ 20
- pnpm 9 (`corepack enable && corepack prepare pnpm@9.15.9 --activate`)
- Backend sur http://localhost:8000 (`docker compose up` à la racine du repo)
- Environ **5 Go libres** sur le disque pour `pnpm install` + `next build`

## Installation

```bash
cd frontend
pnpm install
```

Copier les exemples d’environnement (variables **publiques** uniquement) :

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

## Commandes (racine `frontend/`)

```bash
pnpm dev          # web :3000 + admin :3001 + mobile (Expo)
pnpm typecheck
pnpm lint
pnpm build        # web + admin (mobile : tsc only)
pnpm validate     # typecheck + lint + build (--force)
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

## shadcn/ui (admin)

Structure prête : `components.json`, `lib/utils.ts`, `components/ui/`. Ajouter des composants :

```bash
cd apps/admin
npx shadcn@latest add button
```

## Mobile / émulateur

- Simulateur : `EXPO_PUBLIC_API_URL` peut nécessiter l’IP locale ou `10.0.2.2:8000` (Android).
- Pas de credentials stockés.

## Packages

| Package | Usage |
|---------|--------|
| `@yunicity/types` | `HealthResponse`, `ReadinessResponse`, … |
| `@yunicity/utils` | `safeFetch`, `getWebApiBaseUrl`, `getExpoApiBaseUrl` |
| `@yunicity/ui` | Tokens couleurs / espacements |

## Prochaines étapes

- Auth (session / JWT)
- Client API métier + écrans PRD
- CI frontend (lint, typecheck, build)
