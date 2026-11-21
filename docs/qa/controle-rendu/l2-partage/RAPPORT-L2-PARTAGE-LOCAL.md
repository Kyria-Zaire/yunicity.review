# VIDEO-REFONTE-L2-PARTAGE-01 — Rapport implémentation locale

**Base** : `4be440af`  
**Statut** : GO livraison — commit / Preview (ticket **ouvert** jusqu’à recette Safari iPhone partage natif)  
**Safari** : fichiers SCROLL-01 / immersive viewport **inchangés** vs base  
**Notes canevas nH*** : toujours absentes du dépôt (non inventées)

---

## Contrôle fil accueil (hors `/videos`) — 15/11

### Constat (régression)

Le Provider H1/H2/H3 est monté **uniquement** dans `videos-screen`. Le fil accueil (`FeedVideoStreamItem`) réutilise `useLocalVideoInteractions` **sans** Provider.

Une première version L2 a retiré le chemin `shareHint` local : après copie réussie depuis l’accueil, **aucun feedback** (action silencieuse).  
`FeedVideoStreamItem` conserve `shareHint={interactions.shareHint}` (identique à `4be440af`) — le trou venait du hook, pas d’un hardcode `null` final.

### Correctif ciblé (sans étendre H1/H2/H3 à l’accueil)

Dans `use-local-video-interactions.ts` :

| Contexte | Comportement |
|----------|----------------|
| **Avec** Provider (`/videos`) | H1/H2/H3 centralisés ; `shareHint` exposé = **toujours `null`** (pas de doublon) |
| **Sans** Provider (accueil) | Repli antérieur : hint « Lien copié » 2,5 s si `copied` ; `failed` / `unavailable` restent **silencieux** (pas de H2/H3 hors lot) |

Test ciblé : `local-video-share-feed-fallback.test.tsx` (3 cas).

---

## Diff ciblé

| Fichier | Rôle |
|---------|------|
| `packages/utils/src/local-video-state.ts` | 5 résultats + `copyLocalVideoLink` ; AbortError ≠ échec |
| `packages/utils/src/local-video-labels.ts` | libellés H2 / H3 (texte v2.3) |
| `packages/utils/src/index.ts` | exports |
| `packages/utils/src/local-video-state.test.ts` | branches share/copy |
| `apps/web/lib/videos/local-video-share-feedback-context.tsx` | **nouveau** — état central + timer H1 |
| `apps/web/components/videos/local-video-share-feedback.tsx` | **nouveau** — H1 / H2 / H3 |
| `apps/web/hooks/use-local-video-interactions.ts` | dual-path Provider vs repli accueil |
| `apps/web/components/videos/videos-screen.tsx` | Provider + montage unique |
| `video-detail-screen.tsx`, desktop cards | retrait `shareHint` inline (sous Provider) |
| `feed-video-stream-item.tsx` | **inchangé** vs HEAD — `shareHint={interactions.shareHint}` |
| tests feedback + interactions + **feed-fallback** | H1/H2/H3 + transitions + repli accueil |

Scripts probe locaux **non destinés au commit**.

---

## Comportements `/videos`

| Résultat | UI |
|----------|-----|
| `shared` | rien (pas de « Lien copié ») |
| `cancelled` (AbortError) | silencieux, **aucune** copie |
| `failed` | H2 ; copie seulement via bouton |
| `copied` | H1 `role="status"` 2,5 s **seulement** |
| `unavailable` | H3 URL complète + texte v2.3 exact |
| H2 → copie OK | H1 |
| H2 → copie refus | H3 (jamais H1) |

Focus : H2 Fermer → déclencheur ; H3 Drawer `returnFocusRef` + champ sélectionné à l’ouverture.

---

## Contrôles (après correctif accueil)

| Suite | Résultat |
|-------|----------|
| `local-video-state.test.ts` | **12/12** |
| `local-video-share-feedback.test.tsx` | **4/4** (H1 2,5 s ; H2 copie ; H3 texte+sélection ; H2 focus) |
| `local-video-share-interactions.test.tsx` | **6/6** |
| `local-video-share-feed-fallback.test.tsx` | **3/3** (hint accueil ; silence failed ; pas de doublon sous Provider) |
| Safari / immersive / feed viewport | **0 fichier modifié** vs HEAD |

### Preuves visuelles (simulation)

`docs/qa/controle-rendu/l2-partage/` :

- `H1-apres-copie-simulee.png`
- `H2-echec-partage-simule.png`
- `H3-indisponible-simule.png`

**Simulation Chromium / fixture** — **≠** essai réel `navigator.share` sur Safari iPhone.

---

## Réserves

1. Partage natif **réel** (Safari iPhone / Android) : non joué ici → recette humaine après Preview.
2. Notes canevas « nH / nH2 / nH3 » absentes du dépôt.
3. Accueil : repli « Lien copié » seulement — **pas** H2/H3 (hors périmètre refonte).
4. Audit sécurité préexistant : inchangé (non lié).

## Prochaine action

Recette humaine Safari iPhone du partage natif (V2-9) sur Preview. Ticket **non clos**.
