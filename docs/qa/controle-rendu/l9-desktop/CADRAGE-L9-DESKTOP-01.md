# Cadrage — VIDEO-REFONTE-L9-DESKTOP-01

**Statut** : **BUILD local livré** (15/11) — revue CTO ; **aucun commit/push**.  
**Base** : L7 + L8 BUILD local **ACCEPTÉS / SUSPENDUS** (diffs non commités, worktree `yunicity-wt-video-lot1`) ; tip Preview `3b1586bb` / code `e49f4bb4`.  
**Hors ticket** : Preview L9 seul · prod / `main` · Lot 10.  
**Livraison Preview** : groupée **7+8+9** (PRD Q3).

---

## 1. Références exactes

| Source | Contenu Lot 9 |
|--------|----------------|
| PRD Story 6 | Lien partagé : sans session (D2), 404, autre erreur |
| PRD §5.3 D1 | Fermeture ouverture **directe** = **replace** `/videos` (pas `history.back()` hors app) |
| PRD §6.3 lot 9 | C4, C7, D2 ; dépend **8** ; e2e 404, 500, non connecté |
| PRD §7 | D2 zone rouge auth ; `resolveAuthReturnPath` / REC-01 ; checklist sécurité au lot 9 |
| PRD §9.2 | Lien direct 404 → C4 ; 500 → C7 ; sans session → `/login?next=…` |
| Cadrage Desktop C §1.5 | Tableau réponses API → C4 / C6 / C7 / 401 |
| Cadrage Desktop C §2 lot 9 | « 404 → C4 ; autre erreur → C7 avec Réessayer ; comportement 401 *(§3-2)* » |
| Planche / captures | `maquette-desktop/captures-pistes/C4-Indisponible.jpg`, `C7-Erreur-reseau.jpg` |
| Sources canevas | `C4-Indisponible.dc.html`, `C7-Erreur-reseau.dc.html` |
| Canevas | https://claude.ai/artifact/EqED6AWSR3gtwgwiLvDeoW |
| Contrôle présence | `docs/ux/video-refonte/controle-rendu/presence-desktop-C.txt` (C4, C7 OK côté maquette) |
| Finitions C2 | liste §4 ci-dessous (hors conformité pixel L8) |
| L7 / L8 | diffs + `docs/qa/controle-rendu/l7-desktop/` + `l8-desktop/` — **à conserver** |

---

## 2. Comportements attendus vs écarts actuels

### 2.1 C4 — Vidéo indisponible (404 `LOCAL_VIDEO_NOT_FOUND`)

| | Attendu (réfs) | Écart actuel (L8 local) |
|--|----------------|-------------------------|
| Déclencheur | `GET /api/v1/local-videos/{id}` → 404 `LOCAL_VIDEO_NOT_FOUND` (absente, masquée, supprimée, non publiée — sauf auteur) | `videos-screen.tsx` : `getLocalVideo` `.catch` → `setPinnedVideo(null)` ; commentaire explicite « → Lot 9 » |
| UI | Cartouche blanc centré sur voile + grille C1 : titre « Cette vidéo n'est plus disponible », texte « Le lien que vous avez suivi ne mène plus à une vidéo. », CTA « Voir les autres vidéos » ; ✕ | **Absent** — overlay reste en C6 / vide, **aucune** distinction 404 |
| Invariants | **Aucune autre vidéo lue** à la place ; ✕ / CTA → `/videos` (replace si ouverture directe) | Non implémenté |
| a11y | `role="dialog"`, `aria-modal`, labelledby / describedby (maquette C4) | — |

### 2.2 C7 — Erreur de chargement (réseau / 5xx)

| | Attendu | Écart actuel |
|--|---------|--------------|
| Déclencheur | autre erreur que 404 (réseau, 5xx) | même `.catch` indifférencié |
| UI | `role="alertdialog"` : « Impossible de charger la vidéo », « Vérifiez votre connexion, puis réessayez. », **Réessayer** + « Voir les autres vidéos » ; ✕ | **Absent** — pas de Réessayer, risque de confusion avec C4 |
| Invariants | erreur passagère **≠** vidéo retirée ; Réessayer relance `getLocalVideo` ; aucune autre vidéo jouée | Non implémenté |

### 2.3 D2 — Sans session (zone rouge auth)

| | Attendu (PRD) | Écart / ambiguïté |
|--|---------------|-------------------|
| Comportement | **Aucun aperçu public** ; passage par `/login?next=<chemin interne /videos?video=…>` ; retour après connexion sur le **lecteur** de `<id>` via `resolveAuthReturnPath` (REC-01) | À **vérifier** sur le chemin desktop overlay (ProtectedRoute / page videos) — non prouvé en L8 |
| e2e | PRD §7 / §9.2 | Non joué |
| Ambiguïté | Cadrage Desktop C §2.1 dit encore « décision §3-2 **avant** le lot 9 ». **PRD** : D2 déjà tranché (aperçu public **refusé**). L9 **implémente** D2 PRD, **ne rouvre pas** le débat aperçu public. | Signaler ; ne pas inventer un aperçu |

### 2.4 C6 (hors BUILD L9 mais frontière)

C6 (chargement) ∈ **L8** — déjà présent. L9 doit **enchaîner** C6 → C4/C7/C2 sans laisser C6 indéfiniment après échec.

---

## 3. Finitions C2 restantes (L9 — liste précise)

**Statut L8** : structure panneau latéral **acceptée** (380×828 mesurés, `presentation="panel"`, 0 Drawer).  
**Ne pas déclarer C2 entièrement conforme.** À traiter en L9 et **revérifier avant acceptation Preview groupée 7+8+9**.

Réf. : `C2-Lecteur-portrait.dc.html` + capture `C2-Lecteur-portrait.jpg`.

| # | Écart | Maquette C2 | État L8 (mesures / code) |
|---|--------|-------------|---------------------------|
| F1 | Position panneau | `left: 811px ; top: 32px` | `panelLeft ≈ 797.5` (1440×900) — décalage layout vidéo+rail |
| F2 | Hauteur panneau | `height: 836px` | mesuré **828** |
| F3 | Avatars commentaires | pastilles 32 px + initiales | **absents** en `presentation="panel"` |
| F4 | Typo ligne auteur | `13px` + horodatage relatif « · 1 h » | `text-sm` + `toLocaleString` (date absolue) |
| F5 | Typo corps commentaire | `14px` / `line-height: 20px` | `text-sm leading-5` — à confronter pixel |
| F6 | Composer | `input` h 44, pill `#F7F8FA`, bouton **icône** 44×44 | `textarea` + libellé « Publier » texte |
| F7 | Padding liste / header / form | `4px 20px` ; header `8/8/8/20` ; form `10/12/12/20` | classes Tailwind proches mais non auditées pixel |
| F8 | Rail « … » | pastille **blanche** 48×48 | style overlay sombre / dimensions rail 58 |
| F9 | État commentaires ouverts | `aria-pressed="true"` sur bouton commentaires (maquette) | à vérifier / aligner |
| F10 | Compteur titre | `font-weight: 600 ; color: #6B7280` | présent — contraste/poids à valider vs capture |

**Hors finitions C2** (déjà L8 OK) : placement latéral vs sheet Lot 4 ; largeur ~380 ; absence de Drawer en portrait.

---

## 4. Fichiers concernés (estimés — avant code)

| Fichier | Rôle L9 |
|---------|---------|
| `components/videos/videos-screen.tsx` | Brancher erreurs `getLocalVideo` → états C4/C7 (aujourd’hui catch vide) |
| `components/videos/desktop/videos-desktop-overlay-player.tsx` | UI C4 / C7 dans le dialogue ; enchaînement C6 → erreur ; CTA |
| *(nouveau composant possible)* `…/desktop-overlay-unavailable.tsx` / `…-load-error.tsx` | Cartouches C4 / C7 isolés, testables |
| `components/videos/video-comments-sheet.tsx` | Finitions F3–F7 panel |
| `components/videos/local-video-action-rail.tsx` | F8 / F9 si retenus |
| `lib/…` parse erreur API (`parseLocalVideoApiError` / équivalent) | Distinguer 404 vs autre |
| Auth / `ProtectedRoute` / `resolveAuthReturnPath` | D2 — **revue**, pas nouvelle API |
| Tests | `vitest` C4/C7/D2 ; e2e §9.2 lot 9 ; non-régression REC-01 `next` malveillant |
| Docs QA | `docs/qa/controle-rendu/l9-desktop/` (preuves après BUILD) |

**Non touchés (prévision)** : fil medium L5/L6 (F4 medium déjà lot 6), immersif mobile, L7 grille (sauf cohabitation visuelle), prod.

---

## 5. Dépendances

| Dépendance | État |
|------------|------|
| Lot 8 lecteur | **BUILD local ACCEPTÉ / SUSPENDU** — requis |
| Lot 7 grille | **BUILD local ACCEPTÉ / SUSPENDU** — grille sous voile C4/C7 |
| Lot 4 panneaux | Code Preview ; ticket SUSPENDU — finitions C2 réemploient panel |
| Lot 2 partage | CLOS |
| API | **Aucune** modification (PRD §6.4) |

```
L7 (grille) ──► L8 (lecteur OK) ──► L9 (C4/C7/D2 + finitions C2)
                      └── Preview groupée 7+8+9
```

---

## 6. Plan BUILD (après revue de ce cadrage — pas avant)

1. Distinguer erreurs `getLocalVideo` (404 `LOCAL_VIDEO_NOT_FOUND` vs autre) sans changer l’API.  
2. UI C4 puis C7 (maquettes) : textes, CTA, ✕, a11y, **0** lecture de substitut.  
3. D2 : prouver / corriger chemin login `next` + retour lecteur (zone rouge — checklist).  
4. Finitions C2 F1–F10 par lots de PR reviewables ; captures avant/après.  
5. Tests unitaires + sonde / e2e 404, 500, non connecté.  
6. **Aucun push Preview** tant que L9 non prêt pour le groupage 7+8+9.

---

## 7. Critères de recette — ensemble Preview **7+8+9**

À jouer **après** livraison Preview groupée, avec **SHA et environnement** consignés. Ne pas clore L7/L8/L9 au seul BUILD local.

### 7.1 Déjà exigés L7 / L8 (à rejouer sur Preview)

- Grille C1 portrait + paysage ; pagination sûre.  
- Overlay C2/C3 ; D1 Retour/Avance ; R-FOCUS ±1 px ; D4 voile ; D5 orphan ; 1024 commandes.  
- Medium 820 / mobile 390 : pas d’overlay desktop.  
- Entrée clavier + gestes lien (Ctrl/Cmd, milieu, tactile) — prouvés en local L8 (`preuves-a11y-link-gestures.json`).

### 7.2 Spécifiques L9

| # | Critère | Preuve |
|---|---------|--------|
| R9-1 | Lien direct 404 → C4 (textes maquette) ; **aucune** autre vidéo lue | e2e / sonde Preview |
| R9-2 | Lien direct 500/réseau → C7 ; Réessayer relance ; ≠ C4 | e2e / sonde |
| R9-3 | Sans session → `/login?next=…` vidéo ; après login → lecteur `<id>` | e2e D2 |
| R9-4 | `next` externe rejeté (REC-01) | vitest non-régression |
| R9-5 | ✕ / « Voir les autres vidéos » depuis C4/C7 → `/videos` (replace si direct) | e2e |
| R9-6 | Finitions C2 F1–F10 : revue visuelle vs `C2-Lecteur-portrait.jpg` **avant** acceptation groupée | captures Preview |
| R9-7 | Revue `docs/ai/security-checklist.md` (lot 9) | checklist signée |
| RC-D1 | Safari desktop (PRD) — si toujours requis | manuel, SHA Preview |

### 7.3 Hors périmètre production

Aucune autorisation prod / `main` (PRD Q3 / doctrine).

---

## 8. Ambiguïtés (sans inventer)

1. **Wording « décision §3-2 avant lot 9 »** (cadrage Desktop C) vs **D2 déjà tranché dans le PRD** → suivre le PRD ; ne pas proposer d’aperçu public.  
2. **R-FOCUS vs « amener la vignette à l’écran »** (cadrage §1.4.2) : L8 a tranché *preventScroll* + tolérance ±1 **sans** `scrollIntoView` (Δ11). L9 ne doit pas réintroduire un recentrage qui casse ±1 sauf **nouvelle** décision CTO.  
3. **C4/C7** : maquettes = dialogue sur grille+voile (comme C6). Pas d’indication d’une page pleine séparée — retenir le modèle overlay.  
4. **F1–F10** : priorité / acceptabilité « assez proche » vs pixel-perfect **non tranchée** — à faire valider par Kyria sur captures L9.  
5. **Lot 6 medium F4** : déjà spécifié ; L9 = **desktop** uniquement — ne pas dupliquer medium sauf non-régression.

---

## 9. Prochaine action

Revue CTO de ce cadrage → **GO BUILD** explicite avant tout code L9.  
L7/L8 restent SUSPENDUS, NON clos, diffs conservés. Aucun commit/push/deploy.
