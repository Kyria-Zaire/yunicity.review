# Passation — TRIBE-CREATE-BLOCKING-STATUS-01 · Statut des erreurs bloquantes à la création de tribu

> ✅ **CLOS le 2026-11-05 au stade Preview sur `5a3e6f22`** (décision de Kyria).
> Recette Safari iPhone : erreurs **en rouge avec alerte**, zéro erreur **en vert
> avec coche**. Non fusionné dans `main`. Dette ouverte :
> `TRIBE-CREATE-CHECKLIST-ACCESS-01`.
>
> **Ouvert le 2026-11-05 par Kyria**, seul ticket actif. Préproduction uniquement.
> ⛔ Aucune action sur `main` ni sur la production. Règles de validation et
> comportement des boutons **inchangés**.

## 1. Défaut

Sur `/tribes/create`, le statut « N erreurs bloquantes » s'affichait en **vert
émeraude avec une coche** (`CheckCircle2`, `text-emerald-600`) **quel que soit**
le nombre d'erreurs — mobile (`tribe-create-mobile-preview.tsx`) et checklist
desktop / medium (`tribe-create-desktop-checklist.tsx`, partagée par
`tribe-create-medium-bottom-rail.tsx` et l'écran desktop).

## 2. État Git

Worktree `C:/Users/kyria/yunicity-wt-deps-next-preview`, branche
**`fix/tribe-create-blocking-status`** depuis **`586dd249`** (Preview servie).
Non commité, non poussé, non déployé. La passation de `MOBILE-PAGE-BG-01`
(clôture, non commitée) est **préservée** dans l'arbre de travail.

## 3. Correctif minimal

- `components/tribes/create/tribe-create-blocking-status.tsx` *(nouveau)* :
  0 erreur → `CheckCircle2` + **`text-emerald-700`** + libellé existant
  (`TRIBE_CREATE_DESKTOP_CHECKLIST_NO_ERRORS`) ; ≥ 1 erreur → `AlertCircle` +
  `text-red-700` (convention d'erreur du parcours tribus) + **même texte**
  qu'avant. Marqueur `data-tribe-create-blocking-status="valid|errors"`.
- Mobile et checklist desktop / medium utilisent ce composant ; leur mise en
  page (`inline-flex` / `mt-4 flex`, taille d'icône) est conservée.
- Comptage **inchangé** : `tribeCreateBlockingErrorCount(draft)`.

## 3 bis. Contraste du vert — décision de Kyria (2026-11-05)

`emerald-600` n'atteignait que **3,77:1** sur blanc (texte `text-xs`, seuil
WCAG AA 4,5:1) → **`emerald-700` : 5,48:1**. Rouge `red-700` : **6,47:1**.
Règles de validation inchangées.

## 4. Preuves — QA locale, build `Gtt8FzsybSPl7wgd3FhId` puis `3Fjzme87wYLGRNmFfnIru` (vert `emerald-700`)

Parcours réel dans Chrome (`/tribes/create`, compte `qa.citizen.b`), **écritures
de tribu bloquées par le script** (aucune publication) :

| Palier | Vide | Identité remplie | Charte acceptée |
|---|---|---|---|
| mobile 390 | « 2 erreurs bloquantes » rouge + alerte | « 1 erreur bloquante » rouge + alerte | « 0 erreur bloquante » vert + coche |
| medium 800 | idem | idem | idem |
| desktop 1280 | idem | idem | idem |

Couleurs calculées (build final) : erreurs `rgb(185, 28, 28)` (`red-700`,
6,47:1) ; valide **`rgb(4, 120, 87)` (`emerald-700`, 5,48:1)** — trois paliers. Captures :
`scratchpad/tcbs/planche-statut.png` et les 9 captures unitaires.

**Tests** : `lib/tribes/tribe-create-blocking-status.test.tsx` (6 — vide /
1 erreur / valide × desktop-medium / mobile) ; **mutation** vérifiée (vert
pour les erreurs → 4 échecs ; test adapté à `emerald-700`). `tsc` vert ; `eslint` des fichiers modifiés vert ;
`vitest lib/tribes` 3 fichiers / 19 tests ; `@yunicity/utils` 152 fichiers /
1 278 tests verts.

## 4 bis. 🚀 PREVIEW — *2026-11-05*

- Commits : `31b2147e` (docs de clôture de `MOBILE-PAGE-BG-01`, séparé) puis
  **`5a3e6f22`** (5 fichiers de ce ticket). Preview avancée
  **`586dd249..5a3e6f22`** en avance rapide, distante vérifiée, **sans
  `--force`** ; branche `fix/tribe-create-blocking-status` poussée. `main` =
  `3e0b27ba`, **inchangé**.
- **CI — PR #202 sur `5a3e6f22`** : Frontend, Backend, Docker, Lint agent rules
  ✅ ; Gitleaks, chemins interdits ✅ ; **audit des dépendances ❌ — 19,
  INCHANGÉ** (réserve préexistante).
- **Railway Preview** : web `128000d0`, API `e743d3fd` — **SUCCESS** sur
  `5a3e6f22`.
- **Servi** : `buildId` `sB1hhz_m0Xp_l-38K7OC4` ; `/tribes/create` 200 ; le
  morceau `app/tribes/create/page-98bf297e726a1cdb.js` contient le marqueur
  `data-tribe-create-blocking-status`, `text-red-700` et `text-emerald-700`.
- Section **non commitée** (un commit relancerait un déploiement).

## 5. Observations hors périmètre — NON traitées

- Brouillon vide : l'item « Accès et adhésion » de la checklist est **coché**
  alors que la charte non acceptée compte comme erreur bloquante — la
  checklist et le comptage d'erreurs ne suivent pas la même règle
  (préexistant).
- ~~Contraste du vert existant~~ → **traité** (§3 bis).
- Incohérence « Accès et adhésion » consignée dans l'index, tableau « Sujets
  ouverts, hors recette » : **`TRIBE-CREATE-CHECKLIST-ACCESS-01`** (non traitée).

## 6. Prochaine action

✅ Recette Safari iPhone validée par Kyria (Preview `5a3e6f22`) — ticket clos.
Suite : `PASSPORT-QR-THIRD-PARTY-01`.
