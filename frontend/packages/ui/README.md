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

## Primitives partagées (C3.0-T3)

```ts
import { Button, ButtonLink, Card, CardHeader, CardContent, CardFooter,
         Sheet, Drawer, Skeleton, LoadingState, EmptyState, ErrorState,
         OfflineState } from "@yunicity/ui/primitives";
```

> **La surface publique se limite à ces composants et à leurs types.** Les helpers internes
> (piège de focus, verrou de scroll, politique de fermeture, mise en inertie de l'arrière-plan,
> validation de CTA, fusion de classes) ne sont pas exportés : ce sont des détails de mise en
> œuvre, pas un contrat. Si un consommateur en a besoin, c'est le signe qu'il manque un
> composant — à discuter, pas à contourner.

> **Sous-chemin `/primitives`, jamais la racine.** `apps/mobile` importe `@yunicity/ui`
> pour les tokens : les primitives sont **web uniquement** (DOM) et ne doivent pas entrer
> dans le bundle Expo. Les apps web/admin scannent déjà `packages/ui/src` dans leur
> `tailwind.config.ts` — sans ce glob, les classes seraient purgées.

### Button / ButtonLink — pas de CTA mort

Un CTA ne se rend que s'il a une action réelle : **le type l'impose**.

```tsx
<Button onClick={submit} loading={isPending}>Publier</Button>   // action
<Button type="submit" variant="secondary">Enregistrer</Button>  // soumission
<ButtonLink href="/tribes/new" variant="outline">Créer une tribu</ButtonLink> // destination
<Button iconOnly aria-label="Fermer" variant="ghost" onClick={close}><XIcon /></Button>
```

- `variant` : `primary | secondary | outline | ghost | destructive` · `size` : `sm | md | lg`
  (toutes ≥ 44 px) · `shape` : `default | pill`.
- `loading` → `aria-busy`, spinner, bouton non interactif et **garde anti double-déclenchement**.
- `iconOnly` **exige** `aria-label` (erreur de compilation sinon).
- `<Button>` sans `onClick` ni `type="submit" | "reset"` **ne compile pas**.
- Pas de `asChild` : il faudrait un `Slot` (Radix ou clonage) absent du monorepo — deux
  composants explicites couvrent action vs destination.

### Card — sémantique interactive garantie

```tsx
<Card>…</Card>                                   {/* div */}
<Card variant="elevated">…</Card>
<Card variant="interactive" href="/events/42">…</Card>   {/* <a> */}
<Card variant="interactive" onClick={open}>…</Card>      {/* <button> */}
<Card variant="premium">…</Card>                  {/* navy plein #0B1533, sans gradient */}
```

`variant="interactive"` **exige** `href` ou `onClick` : une `<div>` cliquable inaccessible
est impossible à écrire. `CardHeader` / `CardContent` / `CardFooter` composent le contenu.

### Sheet vs Drawer

| | `Sheet` | `Drawer` |
|---|---|---|
| Position | latérale (`left` / `right`, défaut `right`) | bas (`bottom`) |
| Usage | filtres, navigation secondaire, détail medium/desktop | mobile-first : actions, commentaires, « Créer » |
| Safe-area | — | `env(safe-area-inset-bottom)` |
| z-index | `z.modal` (50) | `z.drawer` (40) |

Même socle interne : **une seule famille d'overlay**, deux points d'entrée nommés par l'usage.

```tsx
// Contrôlé
<Sheet open={open} onOpenChange={setOpen} title="Filtres">…</Sheet>

// Non contrôlé (déclencheur en render-prop, sans cloneElement)
<Drawer
  title="Créer"
  description="Choisissez ce que vous voulez publier."
  trigger={(props) => <Button {...props} shape="pill">+ Créer</Button>}
>
  …
</Drawer>
```

Fourni par la primitive : portail dédié sous `document.body`, overlay, `role="dialog"` +
`aria-modal`, titre et description liés (`aria-labelledby` / `aria-describedby`), bouton Close,
fermeture Escape, fermeture au clic overlay si `dismissible` (défaut `true`), **piège de
focus**, focus initial, **retour du focus au déclencheur**, verrou de scroll à compteur
(overlays imbriqués), **arrière-plan rendu `inert` + `aria-hidden`** avec restauration de
l'état antérieur, `prefers-reduced-motion`, et une seule émission de `onOpenChange` par
transition.

> Un overlay plein écran et un piège de focus ne suffisent pas : un lecteur d'écran parcourt
> l'arbre d'accessibilité, pas la pile de z-index. Les frères du portail sont donc mis en
> inertie pendant l'ouverture.

**Overlays imbriqués — règle autoritaire.** Une pile interne ordonne les overlays ouverts :

- **seul le sommet est actif** : il est le seul à recevoir Escape, à piéger le focus et à
  rester exposé aux technologies d'assistance ;
- les overlays sous-jacents **restent montés** (état, saisie, scroll préservés) mais passent
  `inert` + `aria-hidden`, comme le contenu applicatif ;
- à la fermeture du sommet, la couche précédente **redevient active** et reçoit le focus
  restitué ;
- une fermeture **dans le désordre** est supportée : fermer un overlay sous-jacent ne vole
  pas le focus au dialogue actif ;
- l'application reste inerte tant que la pile n'est pas vide ; pile vide ⇒ **état DOM initial
  exact restauré** (un `aria-hidden` posé par l'app est rendu tel quel).

`dismissible={false}` neutralise Escape et le clic overlay — **le bouton Close reste actif**
(un overlay sans sortie explicite est un piège).

### États système

```tsx
<LoadingState label="Chargement du fil local…" lines={3} />
<EmptyState title="Aucune tribu ici" description="…" action={{ label: "Créer une tribu", href: "/tribes/new" }} />
<ErrorState title="Chargement impossible" onRetry={refetch} />
<OfflineState title="Vous êtes hors ligne" onRetry={refetch} />
<Skeleton lines={2} />
```

- **Aucune donnée inventée** : tout le texte vient de l'appelant.
- CTA **optionnel** ; sans `onClick`/`href` (ou sans `onRetry`), **aucun bouton n'est rendu**.
- `ErrorState` : `role="alert"` + `aria-live="assertive"` · `EmptyState` / `OfflineState` /
  `LoadingState` : `role="status"` + `aria-live="polite"`.
- `Skeleton` est `aria-hidden` (l'annonce est portée par `LoadingState`) et son animation
  s'arrête sous `prefers-reduced-motion`.

### Règles d'accessibilité

- Focus visible partout via le token `focus-ring` (`focus-visible:ring-yunicity-focus`).
- Cible tactile ≥ 44 px (`min-h-yunicity-touch`) sur toutes les tailles de bouton.
- Icône seule ⇒ `aria-label` obligatoire (contrainte de type).
- Overlays : nom accessible obligatoire (`title`), focus piégé puis restitué au déclencheur.
- Aucune couleur, ombre, rayon ou durée arbitraire : uniquement des tokens T2.

### Limites connues

- `ButtonLink` et `Card` rendent un `<a>` natif (pas `next/link`) : le package reste
  découplé de Next. Navigation client à trancher au ticket de migration.
- La fusion de classes interne ne résout pas les conflits Tailwind (pas de `tailwind-merge`) :
  `className` sert à **ajouter** (espacement, largeur), pas à remplacer un token.
- Tests : `vitest` + `jsdom` + Testing Library, dans `packages/ui` uniquement
  (`pnpm --filter @yunicity/ui test`). `react`/`react-dom` y sont déclarés en devDependencies
  pour que la copie de React des tests soit **celle de web et admin** (18.3.1).
- Contrat runtime : `react` et `react-dom` sont des **peerDependencies** `^18.3.1 || ^19.0.0`
  (`react-dom` optionnel, pour que `apps/mobile` — qui ne consomme que les tokens — reste
  valide sous React Native 19).
- L'échelle `z` sémantique (10→70) et le registre `Z_INDEX` de `apps/web` (40→75)
  **divergent** : à réconcilier lors de la migration du chrome, pas avant.
