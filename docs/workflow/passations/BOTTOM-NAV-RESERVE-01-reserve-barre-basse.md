# Passation — BOTTOM-NAV-RESERVE-01 · Réserve sous la barre basse mobile

> **Ouvert le 2026-11-04 par Kyria**, seul ticket actif. Preview uniquement.
> ⛔ Aucune action sur `yunicity.city`, son admin, son infrastructure ou `main`.
> ⛔ Desktop et medium non modifiés. Pas de double marge sur `/feed/new`.

## 1. Objectif

Le contenu des écrans citoyens ne doit plus passer sous la barre basse mobile
(palier < 640 px), zone de sécurité iPhone comprise.

**Défaut de départ** (né de `FEED-NEW-UX-01`) : `CITIZEN_MOBILE_BOTTOM_NAV_PADDING`
(`lib/layout/feed-mobile-refonte.ts`) assemblait sa classe Tailwind par
interpolation → **jamais générée** → réserve inopérante sur 16 shells + les
commentaires vidéo mobiles.

## 2. État Git

- Worktree `C:/Users/kyria/yunicity-wt-deps-next-preview`, branche
  **`fix/bottom-nav-reserve`**, base **`983a592c`** (Preview servie).
- 2026-11-05 : commité sur `fix/bottom-nav-reserve` sur décision de Kyria, puis
  intégré à `feat/c3-videos-refonte-final` en **avance rapide** (sans
  `--force`). ⛔ `main` non touché.

## 3. Mesure AVANT — QA locale, build `Mzt-R2xtk_KKSrkxy6i_O` (`983a592c`)

**Environnement** : poste Windows de Kyria, serveur production-like
`scripts/qa-web-server.sh` (`next start` + façade `:3002`, API QA `:8010`),
Chrome réel via Playwright, **390 × 844**, compte `qa.citizen.a`. Zone de
sécurité émulée par CDP `Emulation.setSafeAreaInsetsOverride` (`env()` relu :
0 px puis **34 px**). Script : `scratchpad/bnr-mesure.cjs` (lecture seule).
Mesure : en fin de défilement, bas du dernier élément visible (hors éléments
fixes) contre le haut de la barre basse — ou de la barre d'action fixe quand
la barre basse est absente.

**CSS de production** : **aucune** règle `max-[639px]:pb-[calc(3.25rem+env(…))]`.
Marge calculée du shell : **0 px** partout, sauf `/feed` et `/discussions`
(**64 px**, `pb-16` du shell) et `/feed/new` (sa propre réserve mesurée : 53 px,
87 px avec 34 px de zone de sécurité).

| Écran | Masqué, zone 0 | Masqué, zone 34 | Élément masqué |
|---|---|---|---|
| `/profile/me` | **12 px** | **46 px** | dernière carte (« Confidentialité et sécurité ») |
| `/sortir` | 1 px | **35 px** | dernier lien (« Autour de moi… ») |
| `/places` | 0 | **22 px** | « Proposer un lieu » |
| `/notifications` | 0 | **14 px** | mention de bas de liste |
| `/passport` | 0 | **5 px** | « Consulter les règles » |
| `/neighborhoods`, `/neighborhoods/centre-ville`, `/tribes` | 29 px | 63 px | **pied de page e-mail** (`WebMobileFooter`) |
| `/videos` | 1 px | 1 px | vidéo immersive (bord à bord voulu, à confirmer) |
| `/feed`, `/discussions`, `/settings`, détail d'événement, détail de tribu | 0 | 0 | — (écart 9 à 76 px) |
| `/sortir/create`, `/tribes/create`, `/organizations/request`, `/profile/me/edit` | — | — | **pas de barre basse** : barre d'action fixe, écart 49 à 92 px |

**Constats** :

1. Le défaut est **réel** surtout avec la zone de sécurité : 5 écrans de
   contenu masqué, jusqu'à 46 px.
2. **Pied de page mobile** : il suit le conteneur qui porte la constante, puis
   vient la barre. Il est **masqué par CSS** sur la plupart des écrans refondus
   (`globals.css` : sortir, discussions, lieux, notifications, réglages,
   profil, passport, détail de tribu, détail d'événement, vidéos…), **mais pas**
   sur quartiers (liste + détail) ni liste des tribus : là, l'**e-mail du
   compte n'est jamais visible**, toujours sous la barre.
3. Aucune page ne déclare `viewport-fit=cover`. Ce que vaut réellement
   `env(safe-area-inset-bottom)` sur Safari iPhone est **non vérifié** ; la
   réserve et la barre utilisent la même expression, donc restent cohérentes
   quelle que soit sa valeur.
4. Non mesurés : détail de lieu (aucun lien trouvé depuis `/places`), panneau
   de commentaires vidéo mobile.

## 4. Correctif central

`CITIZEN_MOBILE_BOTTOM_NAV_PADDING` écrit en toutes lettres :
`"max-[639px]:pb-[calc(3.25rem+env(safe-area-inset-bottom))]"`.
Test `lib/layout/feed-mobile-refonte.test.ts` (2 tests) : classe littérale
dans le source + cohérence avec `CITIZEN_MOBILE_DOCKED_NAV_HEIGHT`.
**Mutation vérifiée** : l'ancienne interpolation fait échouer le premier test.

## 5. Mesure APRÈS — même protocole, build `0yAHqVm2V-5dxEOUPUJWo` (non commité)

**CSS de production** : règle **générée** —
`@media (max-width:639px){.max-\[639px\]\:pb-\[calc\(3\.25rem\+env\(safe-area-inset-bottom\)\)\]{padding-bottom:calc(3.25rem + env(safe-area-inset-bottom))}}`.
Palier ≥ 640 px non concerné par construction.

| Écran | Masqué zone 34, avant → après | Écart fin de contenu → barre, zone 34 |
|---|---|---|
| `/profile/me` | 46 → **0** | 41 px |
| `/sortir` | 35 → **0** | 51 px |
| `/places` | 22 → **0** | 64 px |
| `/notifications` | 14 → **0** | 72 px |
| `/passport` | 5 → **0** | 81 px |
| `/feed`, `/discussions` | 0 → 0 | 26 → 48 px, 9 → 31 px (`pb-16` remplacé par la réserve) |
| `/feed/new` | 0 → 0 | **inchangé** (réserve propre 53 / 87 px — pas de double marge) |
| `/videos` | 1 → 1 | inchangé (marge 0) |
| quartiers (liste, détail), liste des tribus | **63 → 63** | **pied de page e-mail toujours masqué** ; +86 px de vide au-dessus |

⚠️ **Effet de bord — DOUBLE RÉSERVE mesurée** (marge propre de l'écran + réserve) :

- **barre basse visible** : réglages 42 → **128 px**, détail d'événement 68 →
  **154 px**, détail de tribu 39 → **125 px** ;
- **barre basse MASQUÉE** (parcours de formulaire, barre d'action fixe) :
  `/sortir/create` 70 → **156 px**, `/tribes/create` 68 → **154 px**,
  `/organizations/request` 65 → **151 px**, `/profile/me/edit` 49 → **135 px** —
  **réserve pour une barre absente**. Une dizaine de contextes masquent la
  barre par CSS propre à chaque shell (`globals.css` : formulaires, fil de
  discussion, détail de lieu, vidéo immersive, édition du profil…).

Captures : `scratchpad/bnr/avant/` et `scratchpad/bnr/apres/`.

**Contrôles** : `vitest` `lib/layout` + `components/layout` **25 fichiers,
242 tests verts** ; `tsc --noEmit` vert ; `eslint` des fichiers modifiés vert.

## 6. ✅ Décision de Kyria (2026-11-04) — option C

Réserve = **hauteur réelle mesurée** de la barre ; doubles marges de réglages,
détail d'événement et détail de tribu traitées dans ce ticket ; pied de page
e-mail masqué sur mobile sur quartiers (liste + détail) et liste des tribus.
`/feed/new` et `/videos` préservés ; desktop et medium inchangés.

## 7. Correctif livré (non commité)

| Fichier | Changement |
|---|---|
| `hooks/use-citizen-bottom-nav-height.ts` *(nouveau)* | publie `--citizen-bottom-nav-h` sur `<html>` : hauteur rendue de la barre (`ResizeObserver` sur la barre + `<html>`), **0** si masquée, **retirée** au démontage ; **jeton de propriétaire** : une barre démontée après le montage de la suivante n'efface pas sa valeur |
| `components/layout/web-mobile-strategic-bottom-nav.tsx` | `ref` + appel du hook |
| `lib/layout/feed-mobile-refonte.ts` | `CITIZEN_BOTTOM_NAV_HEIGHT_VAR` ; réserve **littérale** `max-[639px]:pb-[var(--citizen-bottom-nav-h,0px)]` |
| `settings-mobile-view.tsx` (×2), `event-mobile-detail-view.tsx`, `tribe-detail-mobile-view.tsx`, `tribes-mobile-view.tsx` | compensation locale de la barre (`pb-24`, `pb-[calc(5.5rem+env)]`, `pb-12`, `pb-24`) → `pb-4` : vues **mobiles seulement** (`web-mobile-*-only`) |
| `app/globals.css` | pied de page masqué < 640 px (`.tribes-mobile-shell > footer…`, `.neighborhoods-mobile-shell > footer…`, en-tête conservé) ; commentaire `/feed/new` corrigé (TODO(debt) levé) |
| tests | `feed-mobile-refonte.test.ts` (2) ; `citizen-bottom-nav-height.test.tsx` (3, jsdom) |

⚠️ **Liste des tribus** : compensation `pb-24` **non listée par Kyria**,
révélée par le masquage du pied de page — traitée selon la même règle,
**signalée**. `passport-mobile-view.tsx` touché puis **annulé** : composant
**mort** (aucun appelant), `/passport` mobile rend un autre gabarit.

## 8. Preuves finales — QA locale, build `LrXI50Bug_ncnlpei5uil`

*(Build fait avant l'annulation de la modification sans effet de
`passport-mobile-view.tsx`, composant non rendu.)*

**CSS de production** : `@media (max-width:639px){.max-\[639px\]\:pb-\[var\(--citizen-bottom-nav-h\2c 0px\)\]{padding-bottom:var(--citizen-bottom-nav-h,0)}}` ;
ancienne classe `calc(3.25rem…)` absente ; masquage du pied de page sous
`@media (max-width:639.98px)`.

**Masqué sous la barre, 390 × 844** — zone de sécurité 0 / **34 px** :
**0 px partout** (avant : profil 12/46, sortir 1/35, lieux 0/22, notifications
0/14, passport 0/5, quartiers et tribus 29/63) — sauf `/videos` 1 px,
**inchangé** (vidéo bord à bord). Réserve : **53 px** (zone 0) / **87 px**
(zone 34) = hauteur réelle de la barre ; **0** sur les formulaires sans barre.

| Écart contenu → barre, zone 34 | avant | final |
|---|---|---|
| réglages | 42 | **49** (128 au correctif littéral seul) |
| détail d'événement | 68 | **71** (154) |
| détail de tribu | 39 | **94** (marges internes des cartes ; vue à 48 px de la barre) |
| liste des tribus | masqué 63 | **85** |
| formulaires (sortie, tribu, organisation, édition profil) | 49–70 | **inchangés** |
| `/feed/new` | 290 | **290** — réserve propre unique (53 / 87 px) |

**Transitions** (navigation client, zone 0 et 34) : `/feed` → `/sortir`
(barre) → retour → medium 800 px (**var 0**) → mobile (**var 53/87**) →
`/tribes` → création de tribu (**var 0, réserve 0**) → retour (**53/87**) →
`/discussions/new` (barre démontée : **variable retirée**) → `/feed/new`
(composeur 53/87, une seule réserve) → `/videos` (réserve 0) →
`/profile/me/edit` (**0**). **Aucune valeur périmée.**

**Desktop / medium** (800 et 1280 px) : variable **0**, vues mobiles
`display:none`, pied de page masqué, réserves d'origine (`/feed` 64 / 80 px,
détail d'événement `lg:pb-20` 80 px).

**Tests** : `tsc` vert ; `eslint` des fichiers modifiés : 0 erreur
(1 avertissement **préexistant** `_hubGroups`, ligne non modifiée) ;
`vitest` complet **113 fichiers / 1 172 tests verts** (2 exécutions).
⚠️ **2 exécutions sur 4** ont eu **un** échec isolé — `ios-form-zoom`, puis
`xcode-uuid-contract`, tests **sans lien** — avec un décompte réduit (98–99
fichiers) ; toutes deux lancées **en parallèle d'un `tsc`** ; **non
reproduits** seuls ni en suite complète. Cause **non établie**.
**Mutations** vérifiées : interpolation → test rouge ; jeton de propriétaire
retiré → test rouge.

**Incident d'instrument** : la limite de connexion de l'API QA (5 / e-mail,
10 / IP par 15 min) a bloqué deux fois les scripts (429) — attendue,
**non contournée** (Redis QA non touché) ; second compte QA utilisé.

## 9. Inconnues et suites

- **Safari iPhone réel non vérifié** : aucune page ne déclare
  `viewport-fit=cover` ; la valeur réelle de `env(safe-area-inset-bottom)` y
  reste à observer. La réserve suit la hauteur **rendue** de la barre : elle
  reste exacte quelle que soit cette valeur.
- Avant hydratation, la variable est absente → réserve 0 le temps du premier
  rendu (bas de page, sans décalage visible en haut).
- Non mesurés : détail de lieu (aucun lien), fil de discussion ouvert (lien
  non trouvé : `/discussions/new` mesuré à la place), commentaires vidéo
  mobiles.
- `PassportMobileView`, composant mort — dette signalée, hors ticket.

## 10. Prochaine action

Présentation à Kyria **avant tout commit, poussée ou déploiement**.
Ensuite, sur décision : commit sur `fix/bottom-nav-reserve`, intégration à la
Preview, recette sur Safari iPhone.
