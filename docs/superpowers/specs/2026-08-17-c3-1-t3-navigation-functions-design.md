# C3.1-T3 — Explorer Reims, Menu Yunicity et Hub Créer

**Date :** 2026-08-17
**Phase :** DESIGN validé CTO → BUILD en attente de GO CTO
**Statut :** spécification technique finale
**Base :** C3.0 primitives accessibles + Navbar V3 C3.1-T2
**Périmètre :** frontend uniquement, sans backend, migration, dépendance ou lockfile

---

## 1. Objectif

Livrer trois fonctions du chrome citoyen réellement utilisables :

1. Explorer Reims, hors des quatre destinations principales ;
2. Menu Yunicity, groupé et responsive ;
3. Hub Créer, sans action morte.

Le résultat doit conserver les invariants C3.1-T2 :

- exactement quatre destinations principales ;
- un unique `<main>` ;
- un unique landmark `Navigation principale` visible ;
- aucun double bottom-nav ;
- labels Menu : `Menu` à 390/900 et `Menu Yunicity` à 1366 ;
- nom accessible constant `Menu Yunicity`.

---

## 2. Contraintes globales

- Aucun changement backend.
- Aucun bouton décoratif, lien mort, faux badge ou rôle fabriqué.
- Aucune route approximative pour remplacer une route absente.
- Aucun résultat complet, filtre ou historique persistant de recherche : C3.5.
- Aucun changement interne Map.
- Aucun changement auth/permission côté backend.
- Aucun commit, push ou PR pendant la première passe BUILD.
- Texte utilisateur en français ; identifiants et logs techniques en anglais.
- Cibles interactives d’au moins 44 px.
- Pas de `sleep`, retry Playwright ou token fabriqué.
- QA exclusivement sur `yunicity_qa`, réseau fail-closed.

---

## 3. État Git autoritaire avant BUILD

Le 2026-08-17, la vérification donne :

- worktree : `C:\Users\kyria\yunicity-wt-c3-1` ;
- branche : `feat/c3-1-navigation-entry` ;
- HEAD : `6543d526e3acb4ae06e94564d4633ab8447333f5` ;
- parent : `98aced059ba9f7ddcc1e39bb87a50d6a21e47ca2` ;
- `origin/main` : `98aced059ba9f7ddcc1e39bb87a50d6a21e47ca2` ;
- aucun upstream ;
- worktree T3 propre avant l’ajout des présents documents ;
- worktree principal à `ee1ef10038c60975368647a55fa2f9b934b26a01`, non modifié.

Toute divergence future sur la branche, la base ou le worktree T3 impose un STOP avant BUILD.

---

## 4. Audit fonctionnel autoritaire

### 4.1 Explorer

- La page `/search` est enveloppée par `ProtectedRoute`.
- Un visiteur est redirigé vers `/login?next=...`.
- L’API `GET /api/v1/search` accepte une session optionnelle, mais cela ne rend pas la page produit publique.
- La recherche publique complète reste explicitement reportée à C3.5.
- Le helper frontend `isSearchQueryReady(query)` impose actuellement `query.trim().length >= 2`.
- Le backend accepte `q` à partir d’un caractère ; cette limite transport est plus permissive que le contrat produit de la page.
- Le contrat T3 réutilise donc `isSearchQueryReady` sans créer de règle concurrente.

### 4.2 Routes du groupe Découvrir sans session

Les trois routes ont été vérifiées sans `ProtectedRoute` au niveau page et utilisent des données publiques ou une authentification backend optionnelle :

- `Quartiers` → `/neighborhoods` : **PUBLIC** ;
- `Tribus` → `/tribes` : **PUBLIC** ;
- `Lieux` → `/places` : **PUBLIC**.

Aucune de ces trois routes n’est classée `UNSAFE-PUBLIC` dans l’audit : les listes exposées sont les catalogues publics existants, sans données privées de compte.

Le BUILD doit confirmer cette classification avec un scénario Playwright visiteur réel. Si une route redirige finalement vers l’authentification ou expose une donnée privée, elle doit être reclassée avant rendu visiteur :

- `AUTH-GATED` → lien construit avec `/login?next=<route>` ;
- `UNSAFE-PUBLIC` → entrée non rendue et verdict documenté.

### 4.3 Routes Menu absentes ou non canoniques

Ne pas rendre :

- `Offres et partenaires` : aucune route citoyenne canonique `/offers` ou `/partners` ;
- `Enregistrés` : aucune route canonique ;
- `Mes publications` : contenu dans `/profile/me`, mais aucun deep-link fiable ;
- `Aide et support` : aucune route publique ; seulement `/settings#settings-help`, auth-gated et intra-page.

### 4.4 Autorité partenaire

L’autorité métier existante est :

- `isPartnerPortalManager(org)` ;
- `filterPartnerPortalOrganizations(items)` ;
- `useCreateHubPartnerAccess()`.

Le prédicat existant vérifie déjà :

- `member_role` dans `owner | admin` ;
- `member_status === "active"` ;
- `verification_status === "verified"`.

`create-hub-actions.ts` ne doit pas reproduire ce prédicat. Il reçoit uniquement un état d’accès déjà résolu.

---

## 5. Architecture partagée

### 5.1 Primitive `Dialog`

`Dialog` est une façade publique mince sur `OverlayPanel` avec `side="center"`.

Elle réutilise sans duplication :

- portail ;
- pile modale ordonnée ;
- topmost unique ;
- `inert` et `aria-hidden` ;
- scroll lock à compteur ;
- focus trap ;
- Escape ;
- backdrop configurable ;
- restauration du focus ;
- nettoyage au démontage ;
- reduced motion.

API publique stable attendue — **sans** importer ni réexporterer `OverlayPanelProps` :

```ts
export type DialogProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: (props: OverlayTriggerProps) => ReactNode;
  title: string;
  description?: string;
  closeLabel?: string;
  dismissible?: boolean;
  /** Défaut `true`. Passer `false` lors d’un remplacement de surface (`superseded`). */
  restoreFocus?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  zIndex?: number;
  className?: string;
  children: ReactNode;
};

export function Dialog(props: DialogProps): ReactNode;
```

`OverlayPanel` (interne) reçoit les mêmes capacités, y compris `initialFocusRef` et `restoreFocus`.
`OverlayPanel`, `OverlayPanelProps`, la pile et les helpers purs restent **non exportés** par `@yunicity/ui/primitives`.

Un test d’exports publics doit échouer si un symbole interne fuit (`OverlayPanel`, `registerOverlay`, `acquireScrollLock`, `resolveTabTrap`, etc.).

Priorité du focus initial :

1. `initialFocusRef.current`, si connecté et focalisable ;
2. premier élément focalisable du panel ;
3. panel lui-même.

Restauration du focus à la fermeture :

- `restoreFocus !== false` (défaut) : comportement actuel Escape / Close / backdrop ;
- `restoreFocus === false` : aucun retour au déclencheur (cas `superseded`).

La géométrie centrée est portée par le conteneur, pas par un mélange de translation de centrage et d’animation. L’animation fermée utilise une légère échelle/translation et disparaît avec `prefers-reduced-motion`.

### 5.2 Primitive `Popover`

`Popover` est une primitive publique non modale distincte de `OverlayPanel`.

Elle possède :

- état contrôlé ou non contrôlé ;
- render-prop du déclencheur ;
- ancrage et collision viewport ;
- Escape ;
- clic extérieur ;
- fermeture par sortie de focus ;
- repositionnement scroll/resize ;
- nettoyage des listeners et du portail ;
- stratégie de focus dépendante de la raison de fermeture.

Elle ne possède jamais :

- `aria-modal="true"` ;
- backdrop ;
- `inert` ;
- `aria-hidden` sur l’application ;
- scroll lock ;
- focus trap modal.

API attendue :

```ts
export type PopoverPlacement =
  | "bottom-start"
  | "bottom-end"
  | "top-start"
  | "top-end"
  | "right-start";

export type PopoverCloseReason =
  | "escape"
  | "outside-pointer"
  | "focus-exit"
  | "navigation"
  | "programmatic"
  | "superseded";

export type PopoverTriggerProps = {
  ref: RefCallback<HTMLElement>;
  onClick: () => void;
  "aria-expanded": boolean;
  "aria-haspopup": "dialog";
  "aria-controls": string;
  id?: string;
};

export type PopoverContentControls = {
  close: (reason: PopoverCloseReason) => void;
};

export type PopoverProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, reason?: PopoverCloseReason) => void;
  trigger: (props: PopoverTriggerProps) => ReactNode;
  placement: PopoverPlacement;
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
  children: ReactNode | ((controls: PopoverContentControls) => ReactNode);
};
```

Le panneau reçoit un `id` stable exposé via `aria-controls`. Le render-prop du déclencheur compose refs et handlers du consommateur sans écraser silencieusement un `onClick` ou un `ref` existant.

Politique de focus obligatoire :

- `escape` : restaurer le focus au déclencheur ;
- `outside-pointer` : ne pas restaurer ; laisser le navigateur focaliser la cible cliquée ;
- `focus-exit` par Tab/Shift+Tab : fermer sans annuler la navigation clavier ;
- `navigation` : fermer sans restaurer ;
- `superseded` : ne pas restaurer ;
- `programmatic` ou démontage : restaurer seulement si le focus était encore dans le Popover et si le déclencheur est toujours connecté.

Le code mémorise la raison avant cleanup. Aucun cleanup générique ne doit appeler inconditionnellement `trigger.focus()`.

### 5.3 Exclusivité atomique des surfaces du chrome

Le coordinateur est l’**unique autorité** de l’état actif. Explorer, Menu et Créer ne possèdent pas trois booléens `open` indépendants capables d’être vrais simultanément.

Contrat :

```ts
export type NavigationSurfaceId = "explorer" | "menu" | "create";

export type NavigationSurfaceCloseReason =
  | "escape"
  | "outside-pointer"
  | "focus-exit"
  | "navigation"
  | "programmatic"
  | "superseded";

export type NavigationOverlayState = {
  activeSurface: NavigationSurfaceId | null;
};

openSurface(id: NavigationSurfaceId): void;
closeSurface(id: NavigationSurfaceId, reason: NavigationSurfaceCloseReason): void;
```

Chaque provider dérive :

```ts
const open = activeSurface === "explorer"; // idem menu / create
```

Remplacement atomique (`openSurface` alors qu’une autre surface est active) :

1. raison de fermeture de l’ancienne : `superseded` ;
2. aucune restauration du focus vers l’ancien déclencheur (`restoreFocus={false}` pour les modaux ; Popover `superseded → false`) ;
3. aucun état DOM committé avec deux portails de surfaces stratégiques ;
4. nettoyage complet de l’ancien scroll lock, `inert` et portail ;
5. ouverture de la nouvelle surface et focus initial ensuite.

Ce coordinateur ne remplace pas la pile modale du package UI ; il orchestre seulement les trois entrées stratégiques du chrome.

Preuves obligatoires :

- Menu ouvert puis `Ctrl/Meta+K` → seul Explorer ;
- Explorer ouvert puis Créer → seul Créer ;
- Popover Menu remplacé par Dialog Explorer ;
- Drawer/Sheet Menu remplacé par Dialog Explorer ;
- jamais plus d’un portail de surface stratégique ;
- aucun focus intermédiaire final sur l’ancien déclencheur ;
- aucun lock ou `inert` résiduel.

### 5.4 Autorité responsive unique

Le même provider coordinateur possède :

- une seule résolution responsive ;
- un seul ensemble de listeners `matchMedia` alignés sur le shell T2 ;
- un seul état de surface responsive exposé par contexte ;
- nettoyage au démontage.

Explorer, Menu et Créer consomment cet état ; **aucun** `resize` / `matchMedia` indépendant par consommateur.

Hydratation SSR sûre : aucun overlay monté tant que la résolution cliente n’est pas connue ; aucun mismatch d’hydratation.

Insertion dans `app/layout.tsx` : **préserver** exactement `AuthProvider` et `CreateHubProvider` et leur ordre métier ; n’insérer que les nouveaux providers nécessaires autour/entre eux.

---

## 6. Contrat responsive

### 6.0 Autorité T2 (audit)

Les largeurs **390 / 900 / 1366** restent des **viewports d’acceptation** (maquettes + Playwright). Elles ne sont **pas** les seuils techniques du produit.

Breakpoints réellement utilisés par le chrome Navbar V3 (T2) :

| Seuil | Preuve | Effet chrome |
|-------|--------|--------------|
| `max-width: 639.98px` | `web-mobile-strategic-bottom-nav` `max-[639.98px]`, shells `globals.css` | Bottom-nav mobile ; sidebar masquée sur shells mobiles |
| `min-width: 480px` | `.web-three-col` / `.web-sidebar-aside` | Rail compact apparaît |
| `min-width: 640px` | shells feed/map/…, `use-is-desktop` | Contenu « desktop shell » ; fin du layout mobile strict |
| `min-width: 1280px` (`xl`) | `globals.css` top-nav, `xl:` Tailwind, `matchMedia("(min-width: 1280px)")` dans Menu | Top nav desktop ; sidebar masquée ; libellé `Menu Yunicity` |

Source unique T3 (alignée sur ces media queries) :

```ts
/** Aligné sur bottom-nav / shells mobiles T2. */
export const NAVIGATION_MOBILE_MAX_QUERY = "(max-width: 639.98px)";
/** Aligné sur Tailwind `xl` / top-nav desktop T2. */
export const NAVIGATION_DESKTOP_MIN_QUERY = "(min-width: 1280px)";

export const NAVIGATION_MOBILE_MAX_PX = 639.98;
export const NAVIGATION_DESKTOP_MIN_PX = 1280;
```

Aucune constante `900` ou `1366` ne pilote le choix de primitive.
Aucun couple CSS/JS divergent.

### 6.1 Explorer

- `max-width: 639.98px` : `Drawer` bas ;
- `min-width: 640px` : `Dialog` centré ;
- viewport 390 : déclencheur header + Drawer ;
- viewport 900 : déclencheur rail + Dialog ;
- viewport 1366 : déclencheur header libellé + Dialog + aide `Ctrl K` / `⌘ K`.

Changement de primitive : fermer avant de changer ; aucune transformation à chaud.

### 6.2 Menu

```ts
export type YunicityMenuSurface = "drawer" | "sheet" | "popover";

export function resolveYunicityMenuSurface(width: number): YunicityMenuSurface {
  if (width <= NAVIGATION_MOBILE_MAX_PX) return "drawer";
  if (width < NAVIGATION_DESKTOP_MIN_PX) return "sheet";
  return "popover";
}
```

Équivalent `matchMedia` :

- `NAVIGATION_MOBILE_MAX_QUERY` → Drawer ;
- hors mobile et hors `NAVIGATION_DESKTOP_MIN_QUERY` → Sheet ;
- `NAVIGATION_DESKTOP_MIN_QUERY` → Popover.

Conséquences :

- ≤ 639.98 : Drawer (preuve visuelle à 390) ;
- 640–1279.98 : Sheet (preuve visuelle à 900) ;
- ≥ 1280 : Popover (preuve visuelle à 1366 ; libellé `Menu Yunicity`).

Franchissement avec Menu ouvert :

1. fermer l’ancienne surface ;
2. cleanup complet ;
3. mettre à jour le mode ;
4. rester fermé ;
5. attendre une nouvelle action utilisateur.

Transitions techniques obligatoires :

- 639 → 640 ;
- 1279 → 1280 ;
- 1280 → 1279.

Preuves visuelles d’acceptation conservées à **390 / 900 / 1366**.

Il ne doit jamais exister plus d’une surface Menu montée.

### 6.3 Créer

`Dialog` centré à tous les paliers techniques et aux trois viewports d’acceptation. La géométrie est responsive ; la primitive ne change pas pendant un resize.

---

## 7. Explorer Reims

### 7.1 Déclencheurs

Tous utilisent un composant partagé et le nom accessible `Explorer Reims`.

- 390 : bouton compact dans le header ;
- 900 : bouton compact dans le rail ;
- 1366 : bouton texte dans le header.

Le raccourci global :

- Windows/Linux : `Ctrl+K` ;
- macOS : `Meta+K` ;
- ignore `input`, `textarea`, `select` et tout élément `contenteditable` ;
- n’est enregistré qu’une fois dans le provider global.

### 7.2 Validation de requête

Le texte est trimé.

- chaîne vide : aucune soumission ;
- chaîne non vide mais non prête selon `isSearchQueryReady` : soumission désactivée avec aide accessible alignée sur le contrat existant ;
- chaîne prête : navigation autorisée.

T3 n’ajoute aucune constante de longueur. Il importe directement `isSearchQueryReady`.

### 7.3 Construction de destination

Un seul helper T3 construit la destination de recherche avec `URLSearchParams` :

```ts
export function buildExplorerSearchPath(input: {
  query?: string;
  city?: string | null;
}): string;
```

Règles :

- base toujours `/search` ;
- `q` ajouté si le trim est non vide, même pour préserver un brouillon visiteur ;
- `city` ajouté seulement si le trim est non vide et provient d’une valeur réelle existante ;
- aucun autre schéma, host ou chemin n’est accepté.

Pour un visiteur :

```ts
const safeReturnPath = resolveAuthReturnPath(
  buildExplorerSearchPath(input),
  "/search",
);
const loginHref = buildLoginUrlWithNext(safeReturnPath);
```

Résultats attendus :

- aucune saisie : `/login?next=%2Fsearch` ;
- saisie `marché local` : `next` décode vers `/search?q=march%C3%A9+local` ;
- ville réelle `Reims` : `next` décode vers `/search?q=...&city=Reims`.

`resolveAuthReturnPath` et `buildLoginUrlWithNext` restent les autorités anti-open-redirect. Aucun second validateur de sécurité n’est créé.

### 7.4 Ville : résolution et états

Sources réelles acceptées, dans l’ordre :

1. paramètre `city` déjà présent dans l’URL ;
2. `user.city` non vide ;
3. `profile.city` retournée par l’API profil existante.

La chaîne littérale de fallback `"Reims"` doit être retirée du parcours `/search` concerné par T3.

État explicite :

```ts
type SearchCityState =
  | { status: "loading" }
  | { status: "ready"; city: string }
  | { status: "missing" }
  | { status: "error"; retry: () => void };
```

Règles :

- `missing` uniquement après une réponse **réussie** confirmant l’absence de ville ;
- `error` pour panne, timeout ou réponse API invalide ;
- `missing` : message `Renseignez votre ville pour explorer les contenus locaux.` + CTA `Compléter mon profil` → `/profile/me/edit` ;
- `error` : message honnête + bouton `Réessayer` ; **jamais** affirmer que le profil est incomplet ;
- aucune recherche API dans `loading`, `missing` ou `error` ;
- requêtes obsolètes / annulées ne mettent pas à jour l’état ;
- pas de sélecteur de ville inventé.

La route `/profile/me/edit` existe, est auth-gated et son formulaire possède un champ `Ville`.

### 7.5 Connecté et visiteur

Connecté :

- champ `Explorer Reims` ;
- focus initial dans le champ ;
- état initial réel `Aucune recherche récente` ;
- navigation vers la destination canonique ;
- aucune suggestion ou recherche récente inventée.

Visiteur :

- même déclencheur visible ;
- peut saisir une intention ;
- CTA `Se connecter` utilisant la destination sécurisée ci-dessus ;
- CTA `Créer un compte` vers `/register`, sans promettre un retour que le flux register actuel ne garantit pas ;
- aucune exécution de recherche ni exposition de résultats avant authentification.

---

## 8. Menu Yunicity

### 8.1 Contrat de données

Chaque entrée définit :

```ts
type YunicityMenuItem = {
  id: string;
  label: string;
  icon: WebNavIconId;
  kind: "link" | "logout";
  href?: string;
  access: "public" | "authenticated";
  match?: "exact" | "prefix";
};
```

Les groupes sont :

```ts
type YunicityMenuGroupId = "discover" | "my-space" | "exchange" | "account";
```

### 8.2 Entrées connectées

`Découvrir` :

- Quartiers → `/neighborhoods` ;
- Tribus → `/tribes` ;
- Lieux → `/places`.

`Mon espace` :

- Passport → `/passport` ;
- Notifications → `/notifications`.

`Échanger` :

- Discussions → `/discussions`.

`Compte` :

- Profil → `/profile/me` ;
- Paramètres → `/settings` ;
- Se déconnecter → action `logout()`, puis navigation `/login`.

### 8.3 Entrées visiteur

`Découvrir` :

- Quartiers → `/neighborhoods` ;
- Tribus → `/tribes` ;
- Lieux → `/places`.

`Compte` :

- Se connecter → `/login` ;
- Créer un compte → `/register`.

Les routes Découvrir sont rendues directement tant que les preuves Playwright confirment `PUBLIC`. Si une preuve contredit l’audit, appliquer la classification du §4.2 avant rendu.

### 8.4 Rendu et navigation

- groupes vides absents ;
- titre de groupe visible ;
- `aria-current="page"` sur le lien actif ;
- fermeture avant `router.push` ou logout ;
- aucun badge sans donnée réelle ;
- cible de 44 px minimum ;
- navigation par Tab logique ;
- nom accessible de surface `Menu Yunicity`.

Le rôle `menu`/`menuitem` n’est utilisé que si la navigation fléchée complète du pattern ARIA Menu est implémentée. Le contrat minimal retenu est une navigation sémantique `<nav aria-label="Menu Yunicity">` contenant des liens et boutons natifs.

---

## 9. Hub Créer

### 9.1 Visibilité

Le CTA reste visible pour connecté et visiteur aux trois largeurs, hors préfixes déjà explicitement masqués :

- `/login` ;
- `/register` ;
- routes de création actives ;
- portail partenaire.

Le FAB mobile redondant du Feed n’est plus monté : le CTA stratégique central du bottom-nav reste l’entrée unique à 390.

### 9.2 Actions connectées

Toujours rendues :

- Publier sur le Fil → `/feed/new` ;
- Créer une Story → `/stories/new` ;
- Publier une vidéo → `/videos/new` ;
- Créer une tribu → `/tribes/create` ;
- Proposer un lieu → `/organizations/request`.

Conditionnelle :

- Animer un lieu → `PARTNER_PORTAL_BASE`.

Cette action apparaît uniquement quand `useCreateHubPartnerAccess` a résolu l’état `allowed` à partir de `filterPartnerPortalOrganizations`.

Pendant `idle` ou `loading` :

- action partenaire absente ;
- aucune valeur optimiste ;
- aucun flash autorisé ;
- aucun rôle lu ou reconstruit dans la configuration d’actions.

En erreur :

- état `denied` fail-closed ;
- action absente.

### 9.3 Visiteur

Le Dialog affiche :

- une explication qu’une connexion est nécessaire ;
- `Se connecter` avec `next` égal à la page interne courante validée par les helpers existants ;
- `Créer un compte` vers `/register`.

Le flux n’invente pas d’intention Create Hub persistante. Après login, l’utilisateur revient sur la page et peut rouvrir le Hub.

### 9.4 Suppressions

Supprimer du contrat et du rendu :

- `Souvenir de quartier` ;
- `kind: "soon"` ;
- état désactivé `soon` ;
- badge `Bientôt disponible`.

---

## 10. Accessibilité et comportement des overlays

### Modal (`Dialog`, `Drawer`, `Sheet`)

- un seul overlay topmost accessible ;
- focus initial explicite ;
- Tab/Shift+Tab piégés ;
- Escape ferme ;
- clic backdrop ferme si `dismissible` ;
- focus restauré sauf si `restoreFocus={false}` (`superseded`) ;
- body verrouillé jusqu’au dernier overlay ;
- application et overlays sous-jacents `inert` + `aria-hidden` ;
- aucun attribut ou portail résiduel.

### Popover non modal

- pas de backdrop ;
- pas de scroll lock ;
- pas d’`inert` ;
- pas de focus trap modal ;
- `aria-haspopup` + `aria-controls` + id panneau stable ;
- focus et fermeture conformes à chaque `PopoverCloseReason` y compris `superseded` ;
- aucune restauration après clic extérieur, Tab sortant, navigation ou remplacement ;
- restauration conditionnelle au démontage programmatique.

### Breakpoints

- fermeture avant changement de primitive ;
- aucun chevauchement Drawer/Sheet/Popover ;
- transitions techniques sur 639↔640 et 1279↔1280 ;
- preuves visuelles d’acceptation à 390/900/1366 ;
- aucun listener ou portail orphelin ;
- aucune tentative de conversion à chaud modal ↔ non modal.

---

## 11. Fichiers attendus

### Package UI

Modifier :

- `frontend/packages/ui/src/primitives/overlay/overlay-behavior.ts`
- `frontend/packages/ui/src/primitives/overlay/overlay-panel.tsx`
- `frontend/packages/ui/src/primitives/overlay/overlay-behavior.test.ts`
- `frontend/packages/ui/src/primitives/overlay/overlay.test.tsx`
- `frontend/packages/ui/src/primitives/overlay/overlay-nested.test.tsx`
- `frontend/packages/ui/src/primitives/index.ts`
- `frontend/packages/ui/README.md`

Créer :

- `frontend/packages/ui/src/primitives/overlay/dialog.tsx`
- `frontend/packages/ui/src/primitives/popover/popover.tsx`
- `frontend/packages/ui/src/primitives/popover/popover-behavior.ts`
- `frontend/packages/ui/src/primitives/popover/popover.test.tsx`
- `frontend/packages/ui/src/primitives/popover/popover-behavior.test.ts`

### Web — orchestration

Créer :

- `frontend/apps/web/components/navigation/navigation-overlay-coordinator.tsx`
- `frontend/apps/web/lib/layout/navigation-surfaces.ts`
- `frontend/apps/web/lib/layout/navigation-surfaces.test.ts`
- `frontend/apps/web/hooks/use-navigation-surfaces.ts`

### Web — Explorer

Créer :

- `frontend/apps/web/lib/explorer/explorer-contract.ts`
- `frontend/apps/web/lib/explorer/explorer-contract.test.ts`
- `frontend/apps/web/components/explorer/explorer-provider.tsx`
- `frontend/apps/web/components/explorer/explorer-trigger-button.tsx`
- `frontend/apps/web/components/explorer/explorer-panel.tsx`
- `frontend/apps/web/components/search/search-city-required.tsx`
- `frontend/apps/web/components/search/search-city-error.tsx`

Modifier :

- `frontend/apps/web/app/layout.tsx`
- `frontend/apps/web/components/layout/web-sidebar.tsx`
- `frontend/apps/web/components/layout/citizen-top-nav.tsx`
- `frontend/apps/web/components/layout/citizen-mobile-header-actions.tsx`
- `frontend/apps/web/components/layout/web-mobile-chrome.tsx`
- `frontend/apps/web/components/search/search-screen.tsx`
- `frontend/apps/web/lib/layout/web-layout-config.ts`
- `frontend/apps/web/lib/layout/web-layout-config.test.ts`

### Web — Menu

Créer :

- `frontend/apps/web/lib/layout/yunicity-menu-contract.ts`
- `frontend/apps/web/lib/layout/yunicity-menu-contract.test.ts`
- `frontend/apps/web/components/layout/citizen-yunicity-menu-content.tsx`

Modifier :

- `frontend/apps/web/components/layout/citizen-yunicity-menu.tsx`
- `frontend/apps/web/components/layout/index.ts`

Supprimer si plus référencé :

- `frontend/apps/web/lib/layout/citizen-flyout-position.ts`

### Web — Créer

Modifier :

- `frontend/apps/web/components/create-hub/create-hub-provider.tsx`
- `frontend/apps/web/components/create-hub/create-hub-trigger-button.tsx`
- `frontend/apps/web/components/create-hub/create-hub-sheet.tsx` (remplacé par Dialog ou renommé)
- `frontend/apps/web/components/create-hub/create-hub-action-row.tsx`
- `frontend/apps/web/components/create-hub/create-hub-portal.tsx`
- `frontend/apps/web/hooks/use-create-hub-partner-access.ts`
- `frontend/apps/web/lib/create-hub/create-hub-actions.ts`
- `frontend/apps/web/components/create-hub/README.md`

Supprimer si plus référencés :

- `frontend/apps/web/components/create-hub/create-hub-fab.tsx`
- `frontend/apps/web/components/create-hub/create-hub-overlay-portal.tsx`

### E2E

Créer :

- `frontend/apps/web/e2e/functional/10-navigation-functions.spec.ts`

Modifier uniquement si les assertions partagées sont nécessaires :

- `frontend/apps/web/e2e/functional/08-navbar-v3.spec.ts`
- `frontend/apps/web/e2e/functional/09-page-landmarks.spec.ts`

---

## 12. Critères d’acceptation

### Explorer

- déclencheur visible aux viewports 390/900/1366 ;
- Drawer ≤639.98, Dialog ≥640 (preuves à 390 vs 900/1366) ;
- focus champ ;
- règle `isSearchQueryReady` réutilisée ;
- destination encodée et interne ;
- intention visiteur préservée dans `next` ;
- `missing` → profil ; `error` → réessayer (jamais confondus) ;
- shortcut desktop et exclusion des champs éditables ;
- Escape et focus restauré (fermeture simple).

### Menu

- Drawer / Sheet / Popover selon seuils T2 640 et 1280 ;
- preuves d’acceptation Drawer@390, Sheet@900, Popover@1366 ;
- Quartiers, Tribus et Lieux rendus pour visiteur si preuves `PUBLIC` ;
- groupes connectés conformes au §8.2 ;
- aucune entrée différée ;
- aucune 404 ;
- labels responsive exacts (`Menu` / `Menu Yunicity` via `xl=1280`) ;
- raisons de fermeture Popover testées séparément y compris `superseded` ;
- transitions 639→640, 1279→1280, 1280→1279 sans double surface.

### Créer

- CTA visible pour visiteur et connecté ;
- Dialog centré ;
- cinq actions citoyennes réelles ;
- action partenaire uniquement après autorité `allowed` ;
- aucune action `soon` ;
- visiteur guidé vers login/register ;
- navigation réelle de chaque action.

### Exclusivité

- un seul `activeSurface` ;
- remplacements sans focus sur l’ancien déclencheur ;
- aucun double portail stratégique ;
- aucun lock/`inert` résiduel.

### Non-régression

- Navbar T2 verte ;
- landmarks T2 verts ;
- Drawer vidéo C3.0 vert ;
- aucun changement Map interne ;
- backend byte-identique ;
- lockfile inchangé.

### Preuve visuelle hors Git

Neuf captures authentifiées (Explorer/Menu/Créer × 390/900/1366) plus au minimum Explorer/Menu/Créer visiteur, hors dépôt — voir plan Task visuelle.

---

## 13. Gates

Sur l’état final exact :

1. tests ciblés `@yunicity/ui` ;
2. tests web ciblés ;
3. `pnpm test` complet ;
4. typecheck 6/6 ;
5. lint 6/6 ;
6. build 6/6 ;
7. Playwright T3 ciblé ;
8. Navbar et landmarks ciblés ;
9. Playwright complet ;
10. `git diff --check` ;
11. backend absent du diff ;
12. empreinte logique dev identique avant/après ;
13. QA `down -v`.

Le verdict `READY`, `PARTIAL` ou `BLOCKED` dépend exclusivement de ces preuves. Le report explicite de la recherche publique complète à C3.5 n’impose pas à lui seul `PARTIAL`.

---

## 14. Risques

- Popover non modal : vol de focus au cleanup.
- Portail Popover : ordre Tab hors du panneau.
- Resize : double montage modal/non modal si seuils CSS/JS divergent (mitigé par source unique `matchMedia` T2).
- Ville : confusion `missing` / `error` si mal branchée.
- Auth visiteur : mauvais encodage de `next` ou open redirect.
- Autorité partenaire : flash optimiste ou duplication du prédicat.
- Coordinateur : restauration de focus lors d’un `superseded`.
- Provider global : plusieurs listeners `Ctrl/Meta+K` ou `matchMedia`.
- Responsive : coexistence de déclencheurs cachés mais accessibles.
- Primitive partagée : régression Sheet/Drawer ou overlays imbriqués.
- Suite Playwright : serveur Next cold-start instable ; aucune hausse de timeout au-delà des limites T2 sans justification.

---

## 15. Décision BUILD

Le design intègre les corrections CTO documentaires (breakpoints T2, coordinateur atomique, ville missing/error, DialogProps public, responsive unique, preuve visuelle, Popover). Le BUILD reste interdit jusqu’au GO CTO explicite après revue du plan corrigé.
