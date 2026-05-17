---
paths:
  - "frontend/**/*.{tsx,jsx}"
---

# Constructeur UI

## Structure composant

```tsx
// Ordre recommandé : types → hooks → handlers → render
export function ReportCard({ report }: { report: Report }) {
  const { mutate, isPending } = useArchiveReport();
  // ...
}
```

- Props typées ; pas de props « fourre-tout » (`data: any`).
- Fichier > 200 lignes → extraire sous-composants ou hooks.

## États obligatoires

Chaque écran / liste doit gérer explicitement :

| État | UX |
|------|-----|
| `loading` | Skeleton ou spinner + texte accessible |
| `empty` | Message + CTA si action possible |
| `error` | Message français + retry |
| `success` | Données + feedback action si mutation |

## Composition

- Primitives design system (`Button`, `Input`, `Card`) — pas de `<button className="...">` ad hoc répété.
- Container / présentation : hook ou parent fetch ; enfant affiche.
- Listes longues : `FlashList` (mobile), virtualisation web si > 50 items.

## Web vs mobile

| Web (Next) | Mobile (Expo) |
|------------|-----------------|
| RSC par défaut | Client + `apiClient` |
| `next/image` | `expo-image` |
| `Link` | expo-router |

## Données

- Pas de fetch dans `useEffect` sans dépendances stables — préférer React Query / SWR ou RSC.
- Optimistic UI seulement si rollback erreur géré.

Design & accessibilité : `08-ui-ux-pro-max.md`.

Aligné PRD §5 (états UI) et BMAD BUILD.