# Next / Web build stabilization (TICKET-306E)

## Symptômes observés

| Symptôme | Contexte |
|----------|----------|
| `admin#typecheck` : `bigint` / `ReactNode` dans `.next/types/validator.ts` | `tsc` inclut les types générés Next + 2 résolutions `@types/react` |
| `next lint` réécrit `tsconfig.json` avec `.next/types/**/*.ts` | Comportement Next 15 — **ne pas committer** |
| `web build` : `PageNotFoundError` (`/_document`, `/`) | **Course `next dev` + `next build` sur le même `.next`** et/ou cache stale |
| `useContext` null au prerender 404 | Double instance `react` ou build interrompu |
| `(0 , d.cache) is not a function` | Alias webpack `react` vers 18.3.1 CJS — **ne pas utiliser** |
| `spawn UNKNOWN` (Windows) | Workers Next / antivirus — retenter après `clean:next` |

## Causes racines

1. **`.next/types` dans `include`** — active `validator.ts` et conflits `@types/react`.
2. **Duplication `@types/react`** — résolution locale app vs hoisted pnpm (mitigé par overrides + hoist).
3. **Duplication runtime `react`** — mitigé par `react`/`react-dom` racine + overrides `18.3.1` (web/admin) et `mobile>react` 19.
4. **`next dev` + `next build` sur `.next`** — corruption manifests Pages Router (`/_document`) même en App Router pur.
5. **Cache `.next` / Turbo stale** — `pnpm clean:next` avant build CI.

**Hors scope produit** : plateforme monorepo + Next uniquement.

## Stratégie retenue

### Répertoires de build séparés

| Commande | `distDir` |
|----------|-----------|
| `next dev` | `.next` (défaut) |
| `next build` / `next start` | `.next-build` via `NEXT_BUILD_DIR` |

Permet de lancer `pnpm --filter web build` **pendant** `next dev` en local (Windows inclus).

### Typecheck (CI-safe)

- **`tsconfig.typecheck.json`** (web + admin) : sources seules, `types: ["next", ...]`, sans `next-env.d.ts` ni `.next/types`.
- **`tsconfig.json`** (commité) : sans `.next/types`, `exclude: [".next", ".next-build"]`.
- **`pretypecheck` / `postlint` / `postbuild`** : `scripts/normalize-next-tsconfig.mjs`.

### Build Next

- `eslint.ignoreDuringBuilds: true` — le lint est déjà exécuté par `pnpm lint` en CI.
- `typescript.tsconfigPath: "tsconfig.typecheck.json"` — évite le check sur `.next/types` pendant le build.
- **Pas d’alias webpack React** — casse `react.cache` interne à Next 15.
- **CI** : `pnpm clean:next` puis `pnpm build`.

### React 18 (web/admin) vs 19 (mobile)

| Surface | React | @types/react |
|---------|-------|----------------|
| web, admin | 18.3.1 (override + deps racine) | 18.3.20 (override + hoist) |
| mobile | 19.1.0 (`mobile>react`) | ~19.1.0 (`mobile>@types/react`) |

`frontend/package.json` — overrides + `dependencies` `react`/`react-dom` 18.3.1.

`frontend/.npmrc` :

```
public-hoist-pattern[]=@types/react
public-hoist-pattern[]=@types/react-dom
```

## Commandes

```bash
cd frontend

node scripts/normalize-next-tsconfig.mjs
pnpm clean:next

pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm --filter web build
pnpm --filter admin build
pnpm --filter mobile build

# Build propre
pnpm build:web:clean
pnpm build:admin:clean
```

### Windows (PowerShell)

```powershell
cd frontend
node scripts/clean-next.mjs
pnpm --filter web build
```

Si le build échoue encore :

1. Vérifier qu’aucun autre `next build` ne tourne en parallèle sur la même app.
2. `pnpm clean:next` puis rebuild (utilise `.next-build`, pas le `.next` du dev).
3. `spawn UNKNOWN` : fermer antivirus sur le dossier, `NODE_OPTIONS=--max-old-space-size=4096`, retenter.
4. Si **CI Linux OK** et **Windows KO** après clean → documenter l’environnement (logs complets).

## Fichiers de référence

| Fichier | Rôle |
|---------|------|
| `apps/*/tsconfig.json` | IDE / Next — sans `.next/types` |
| `apps/*/tsconfig.typecheck.json` | `pnpm typecheck` |
| `scripts/normalize-next-tsconfig.mjs` | Post-`next lint` / garde-fou |
| `scripts/clean-next.mjs` | Supprime `.next` et `.next-build` |

## Ne pas committer

- `apps/*/.next/`, `apps/*/.next-build/`
- `tsconfig.json` avec `.next/types/**/*.ts` dans `include`

## Validation TICKET-306E

- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm --filter web build` (`.next-build` + `@types/react` hoisted)
- [x] `pnpm --filter admin build`
- [x] `pnpm --filter mobile build`
