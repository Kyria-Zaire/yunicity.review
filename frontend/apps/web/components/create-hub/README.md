# Create Hub — CREATORS-UX-02A / 02B

Infrastructure shell + intentions de création citoyen (Provider, Portal, FAB, sheet).

## Règle architecture (CREATORS-ARCH-01)

**Toute nouvelle page de création** (`/…/new`, wizard, modal plein écran) doit **explicitement** déclarer si le Create Hub reste visible :

1. Ajouter le préfixe de route dans `lib/create-hub/create-hub-routes.ts` (`CREATE_HUB_HIDDEN_PATH_PREFIXES` ou helper dédié).
2. Ne jamais ajouter de `pathname === …` dans les composants UI — utiliser `useCreateHubVisibility()` ou `isCreateHubVisiblePath()`.

Exemples déjà masqués : `/videos/new`, `/stories/new`, portail partenaire `/organizations/me/partner`.

## Contenu sheet (02B)

Parcours définis dans `lib/create-hub/create-hub-actions.ts` :

- Filmer mon quartier → bientôt (route `/videos/new` non prod — badge désactivé)
- Story éphémère → `/stories/new`
- Publier sur le fil → `/feed#feed-composer`
- Souvenir de quartier → bientôt (non cliquable)
- Animer un lieu → `/organizations/me/partner` (role-gate partenaire)

Navigation : fermeture du sheet **avant** `router.push` — voir `lib/create-hub/create-hub-navigation.ts`.

## Z-index

Registre central : `lib/layout/z-index.ts` + variables CSS `--z-*` dans `globals.css`.

## Intégration

- `CreateHubProvider` sous `AuthProvider` (`app/layout.tsx`).
- Chrome rendu via `createPortal` → `document.body`.
- FAB : bas-gauche, `z-index` 65 — au-dessus du player vidéo (40), sous le sheet hub (75).
