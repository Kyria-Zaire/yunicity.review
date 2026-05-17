# Frontend — Yunicity

Monorepo **Next.js** (web + admin) et **Expo** (mobile), avec packages partagés.

## État (SPRINT-0)

Structure de dossiers posée. **TICKET-003** initialisera les apps et le tooling (npm/pnpm workspace).

## Applications

| App | Dossier | Rôle |
|-----|---------|------|
| Web | `apps/web/` | Application citoyenne Next.js |
| Admin | `apps/admin/` | Back-office / CRM léger |
| Mobile | `apps/mobile/` | Expo React Native |

## Packages partagés

| Package | Rôle |
|---------|------|
| `packages/ui/` | Composants design system |
| `packages/types/` | DTO alignés API |
| `packages/utils/` | Helpers, formatters |

## Règles

- TypeScript strict
- États UI : loading, empty, error, success
- Pas de secrets dans `NEXT_PUBLIC_*` / `EXPO_PUBLIC_*`
- Client API typé vers `/api/v1`

Voir `.cursor/rules/frontend-next-expo.mdc` et `07-constructeur-ui`.
