# Lot 2 — Partage H1 / H2 / H3 — écarts et plan (avant code)

**Ticket** : `VIDEO-REFONTE-L2-PARTAGE-01`  
**Base Preview** : `4be440af`  
**Date** : 2026-11-15  
**Statut** : diagnostic seulement — **aucune modification de code**

---

## 1. Références relues

| Source | Rôle |
|--------|------|
| `CADRAGE-DESKTOP-C-ET-PLAN-IMPLEMENTATION.md` | Roadmap lot **2** |
| `PRD-VIDEO-REFONTE-01-affichage-video.md` | Story 2 + **annexe C** (périmètre exact, 14/11) |
| `DECISION-PRODUIT-REFONTE-VIDEO-2026-11-13.md` §10 / v2.3 | Décisions partage (natif direct, H2/H3) |
| Maquettes figées | `maquette-mobile/v2-Partage-repli.dc.html` (H1), `v2-Partage-echec.dc.html` (H2), `v2-Partage-indisponible.dc.html` (H3) |
| Captures | `captures-v2/H1-Partage-repli.jpg`, `H2-Partage-echec.jpg`, `H3-Partage-indisponible.jpg` |

### Référence manquante (signalée, non inventée)

Le PRD annexe C cite les notes canevas **« nH », « nH2 » et « nH3 »**.  
**Aucun fichier** portant ces identifiants n’a été trouvé dans le dépôt.  
Le contenu retenu pour le plan est celui **écrit dans le PRD + les `.dc.html` / captures H1–H3**.  
`Partage.dc.html` (feuille Yunicity « Partager ») = piste **P6 abandonnée** — **hors périmètre** lot 2.

---

## 2. Définitions H1 / H2 / H3 (exactes)

### Matrice comportementale (PRD annexe C)

| Situation | Résultat | Affichage |
|-----------|----------|-----------|
| Partage natif OK | `shared` | rien |
| Annulation native (`AbortError`) | `cancelled` | **rien** ; **aucune copie** |
| Échec natif (autre erreur, ex. `NotAllowedError`) | `failed` | **H2** |
| Pas de `share`, copie OK | `copied` | **H1** |
| Pas de `share` + pas de clipboard **ou** copie refusée | `unavailable` | **H3** |
| Depuis H2 → « Copier le lien » OK | — | **H1** |
| Depuis H2 → « Copier le lien » refus | — | **H3** |

### H1 — « Lien copié » (maquette `v2-Partage-repli`)

- Pastille centrale `role="status"`, fond `#111827`, texte **« Lien copié »** + coche.
- **Seulement** après copie réussie ; durée **2,5 s** (PRD).
- Jamais après `shared` ni après `cancelled`.

### H2 — échec (maquette `v2-Partage-echec`)

- `role="alert"` ; message **« Le partage n'a pas abouti. »**
- Boutons **« Fermer »** et **« Copier le lien »** (copie **à la demande**).
- Focus initial sur **« Copier le lien »** (PRD).

### H3 — indisponible (maquette `v2-Partage-indisponible`)

- Feuille `role="dialog"` **« Lien de la vidéo »**.
- Texte figé : *« Le partage n'est pas disponible sur cet appareil. Le lien complet est sélectionné : copiez-le avec le menu du téléphone. »*
- `textarea` readonly, URL **complète**, **sélectionnée à l’ouverture** ; « Sélectionner tout le lien » ; Fermer + Échap ; focus retour sur « Partager ».
- Limite assumée (PRD) : même texte H3 si on y arrive après refus de copie depuis H2.

---

## 3. Implémentation actuelle (`4be440af`) vs attendu

### Utils — `packages/utils/src/local-video-state.ts`

```ts
LocalVideoShareResult = "shared" | "copied" | "cancelled"
// catch { return "cancelled" }  → confond AbortError, échec share, échec/absence copie
```

| Attendu | Actuel | Écart |
|---------|--------|-------|
| 5 résultats | 3 (`shared` / `copied` / `cancelled`) | **manque `failed`, `unavailable`** |
| `AbortError` → `cancelled`, silencieux, **sans** `writeText` | tout `catch` → `cancelled` | annulation OK *si* AbortError ; **échec natif aussi silencieux** |
| échec natif → `failed` | `cancelled` | **écart H2** |
| clipboard absent / copie refusée → `unavailable` | `cancelled` | **écart H3** |
| `copyLocalVideoLink` séparé (H2 à la demande) | inexistant | **à ajouter** |

Conforme déjà : « Lien copié » seulement si `result === "copied"` (hook).

### Hook — `apps/web/hooks/use-local-video-interactions.ts`

- État unique `shareHint: string | null` ; n’affiche que `LOCAL_VIDEO_SHARE_COPIED` ("Lien copié").
- Pas d’état H2 / H3 / URL manuelle ; pas d’action « copier depuis H2 ».

### UI

| Surface | Actuel | Écart |
|---------|--------|-------|
| Mobile immersif (`VideosDiscoveryScreen` / fil) | `onShare` branché ; **aucun** rendu de `shareHint` | **H1 invisible sur mobile** même après copie |
| `VideoDetailScreen` (medium détail) | `shareHint` en ligne (2 endroits) | H1 partiel ; **pas H2/H3** |
| Desktop landscape / portrait cards | `shareHint` en ligne | idem |
| Composant unique H1/H2/H3 | **absent** | à créer |

Hors lot (ne pas toucher) : partages quartiers / partenaires / feed posts ; feuille `Partage.dc.html` v1.

### Safari validé

Ne pas modifier les fichiers SCROLL-01 / P0 immersif (`use-videos-mobile-immersive-viewport.ts`, resnap feed, commentaires, filtres) sauf nécessité **prouvée** hors partage.

---

## 4. Fichiers concernés (plan ciblé)

| Fichier | Action |
|---------|--------|
| `packages/utils/src/local-video-state.ts` | élargir `LocalVideoShareResult` ; distinguer branches ; `copyLocalVideoLink` |
| `packages/utils/src/local-video-state.test.ts` | V2-1, V2-2, V2-3 (utils) |
| `packages/utils/src/local-video-labels.ts` (+ `index.ts`) | libellés H2 / H3 (textes maquette) |
| `apps/web/hooks/use-local-video-interactions.ts` | état feedback (`copied` / `failed` / `manual`+URL) ; copier depuis H2 ; fermer |
| **nouveau** `apps/web/components/videos/local-video-share-feedback.tsx` | H1 + H2 + H3, **une fois** par écran |
| `apps/web/components/videos/videos-screen.tsx` | monter le feedback (discovery + detail) |
| `video-detail-screen.tsx`, `desktop/videos-desktop-*-card.tsx` | retirer `shareHint` en ligne (éviter double affichage) |
| tests composants + évent. sonde Preview | V2-4 … V2-7 |

---

## 5. Ordre d’implémentation proposé (après GO)

1. Utils + tests branches (aucune UI).
2. Labels + composant `local-video-share-feedback` + tests H1/H2/H3.
3. Brancher le hook + montage unique dans `videos-screen` ; retirer hints en ligne.
4. Vitest ciblés → lint/tsc → revue → commit/Preview **sur demande**.
5. Recette humaine V2-9 (Safari iPhone + desktop sans `share`) — **après** livraison Preview.

## 6. Hors périmètre (rappel PRD)

- Partages `neighborhoods/*` et autres surfaces non vidéo.
- Feuille de partage Yunicity v1.
- API backend.
- Tablette medium redesign / desktop C (lots 5–8) au-delà du feedback partagé.

---

## 7. Prochaine action

**Revue CTO du plan** — aucun code tant que le GO BUILD n’est pas donné.
