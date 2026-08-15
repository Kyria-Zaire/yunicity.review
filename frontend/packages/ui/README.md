# @yunicity/ui

Placeholder design system partagé (tokens, futurs composants cross-app).

- **Web / Admin** : composants shadcn/ui vivent dans chaque app (`components/ui/`) ; ce package expose les tokens communs.
- **Mobile** : styles natifs / StyleSheet — pas de shadcn ici.

## Prochaine étape

Après TICKET-003 : `npx shadcn@latest init` dans `apps/web` et `apps/admin` si besoin d’aligner les tokens.

## Tokens sémantiques (C3.0-T2)

Vocabulaire partagé de la refonte C3.0. Spécification : `docs/ux/c3-0-design-contract.md`.
Couche sémantique (`semantic-tokens.ts`) au-dessus des primitives de marque
(`brand-tokens.ts`) — réutilise les valeurs existantes, consolide les couleurs
ad hoc du web en tokens nommés. **Consommable depuis les trois canaux :**

**1. CSS variables** (`@yunicity/ui/brand.css`, importé dans `globals.css`) :

```css
.card { background: var(--yunicity-surface-elevated); border: 1px solid var(--yunicity-divider); border-radius: var(--yunicity-radius-xl); box-shadow: var(--yunicity-shadow-sm); }
```

**2. Tailwind** (via `@yunicity/ui/tailwind-preset`, déjà branché dans les `tailwind.config.ts`) :

```tsx
<div className="bg-yunicity-canvas text-yunicity-text-muted rounded-yunicity-xl shadow-yunicity-md z-modal max-w-yunicity-shell" />
```

**3. React / TypeScript** :

```ts
import { yunicitySemantic } from "@yunicity/ui";
const brand = yunicitySemantic.color.brand;        // #2A2FFF
const rail = yunicitySemantic.rail.context;        // 18rem
const zModal = yunicitySemantic.z.modal;           // 50
```

Les classes `yunicity-*` historiques (`bg-yunicity-primary`…) restent inchangées ;
la couche sémantique est **additive**.
