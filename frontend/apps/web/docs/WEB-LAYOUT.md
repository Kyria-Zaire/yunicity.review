# Architecture layout web citoyen

Fondation officielle pour toutes les pages web authentifiées (`frontend/apps/web`).

## Composants

| Composant | Rôle |
|-----------|------|
| `WebAppShell` | Point d'entrée page (header, context, contentWidth) |
| `WebResponsiveContainer` | `max-w-7xl`, padding latéral |
| `WebDesktopLayout` | Grille sidebar + main + contexte |
| `WebSidebar` | Navigation citoyenne (config `WEB_CITIZEN_NAV`) |
| `WebContentColumn` | Limite lisibilité (`form`, `readable`, `feed`, `wide`, `full`) |
| `WebContextPanel` | Carte panneau contextuel |
| `WebContextRail` / `WebContextStack` | Colonne droite xl+ / empilé mobile |

Import : `@/components/layout`

## Exemple page standard

```tsx
<WebAppShell
  header={{ title: "Fil local", subtitle: "Ce qui bouge à Reims" }}
  context={<FeedContextPanels />}
  contentWidth="feed"
>
  <FeedTimeline />
</WebAppShell>
```

## Étendre la navigation

Ajouter une entrée dans `lib/layout/web-layout-config.ts` → `WEB_CITIZEN_NAV`.

## Règles UX

- L'espace desktop sert à **structurer**, pas à étirer le contenu.
- Formulaires : `contentWidth="form"` (~576px).
- Fil / texte : `feed` ou `readable` (~672px).
- Carte hero (Passport) : pas de `contentWidth` ou `full`.
