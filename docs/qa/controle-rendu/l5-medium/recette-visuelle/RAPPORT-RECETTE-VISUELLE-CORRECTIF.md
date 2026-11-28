# L5 — Recette visuelle CTO (non validée) — correctif local

**Base Preview** : `95674af1`  
**Statut** : correctif vérifié localement — livraison Preview sur GO  
**Environnement mesures** : `localhost:3002` + **API simulée** (≠ session Preview réelle)  
**Mention** : preuves locales avec API simulée ; captures CTO indisponibles localement.

## Constats CTO → causes mesurées

| Constat | Origine |
|---------|---------|
| Grande zone blanche tri → lecteur | 1) toolbar son isolée (`ml-auto`) au-dessus du stage + `gap` 0,75 rem ; 2) `.videos-portal-toolbar { margin-bottom: 1rem }` **en plus** du `row-gap` 20 px du main column |
| Bas lecteur/actions hors écran | `.videos-medium-vertical-stage { height: min(70dvh, 720px) }` trop haut vs chrome (~230 px) → débordement ~14–150 px |
| Deux barres de défilement | page (`document`) + `.videos-feed-viewport { overflow-y: auto }` (snap fil) |
| Bouton son isolé | hors cadre, toolbar dédiée — **contraire** à `Lecteur-medium.dc.html` (`right:6; top:6` **dans** la vidéo) |

## Référence maquette

`Lecteur-medium.dc.html` : son dans le cadre ; colonne actions `ax = vx + vw + 12` ; flèches en tête de colonne.

## Correctifs

1. Son déplacé **dans** le cadre vidéo (medium) ; toolbar son retirée.  
2. `margin-bottom: 0` sur `.videos-portal-toolbar` (medium) — seul le `row-gap` 20 px.  
3. Stage : `height: max(240px, min(720px, calc(100dvh - 14.5rem)))` (+ compact 11,5 rem ≤520 px).  
4. Scrollbar du fil masquée (scroll/snap/flèches conservés) ; **scroll de page conservé** (RC-M1).  
   Une scrollbar masquée **n’est pas** une preuve fonctionnelle — gestes souris / trackpad / tactile vérifiés ci-dessous.

## Définition « clip bas »

```
clipBasPx = stage.getBoundingClientRect().bottom - window.innerHeight
```

| Signe | Signification |
|-------|----------------|
| `clipBasPx > 0` | débordement bas (bas du stage hors viewport) — **KO** aux grandes hauteurs |
| `clipBasPx <= 0` | pas de débordement — **OK** |

À **844×390**, `clipBasPx > 0` est **attendu** (stage min 240 + chrome) : le **scroll de page** doit donner accès au lecteur entier et aux actions (RC-M1).

## Réserve chrome 14.5 rem

| Mesure | Valeur |
|--------|--------|
| `14.5rem` | **232 px** (rem = 16) |
| `stageTopPx` (chrome rendu) | **230 px** |
| Couverture | **232 ≥ 230** → réserve OK aux dimensions testées |
| Adaptation | non requise (toolbar inchangée : hero 65 + portal 89 + gap 20) |

## Mesures après (API simulée)

| Viewport | gap tri→stage | stage H | clipBasPx | overflowBas | réserve OK |
|----------|---------------|---------|-----------|-------------|------------|
| 640×900 | **20 px** | 668 | **−2** | **non** | oui |
| 820×1180 | 20 | 720 | **−230** | **non** | oui |
| 1023×768 | 20 | 536 | **−2** | **non** | oui |
| 844×390 | 20 | 240 (min) | **+80** | oui (page) | oui |

**Confirmation explicite** : aux trois grandes hauteurs (640×900, 820×1180, 1023×768), **aucun débordement** (`clipBasPx ≤ 0`).

JSON : `recette-visuelle/mesures-apres.json`, `verify-scroll-geometry.json`  
Captures : `AVANT-*-simule.png` / `APRES-*-simule.png` / `VERIFY-*.png`.

## Défilement réel (VERIFY_OK)

| Mode | Passage suivant | Retour précédent |
|------|-----------------|------------------|
| Molette souris | OK | OK |
| Trackpad (rafale pixels) | OK | OK |
| Tactile (`scrollBy`) | OK | OK |
| Flèches + commandes (partage / commentaires / son) | OK | OK |

**844×390** : `pageScrollRoom` = 112 ; après scroll bas → mute / share / comments visibles, stage plein ; après scroll haut → « Vidéo précédente » accessible. Lecteur entier + actions accessibles via le scroll de page.

Scrollbar fil masquée ≠ preuve ; preuve = gestes ci-dessus (`verify-scroll-geometry.json`, `"ok": true`).

## Tests

- `video-medium-l5.test.tsx` + `video-medium-portrait-stage.test.tsx` + `video-mobile-v23.test.tsx` : **22/22** ✅

## Réserves

- Captures CTO jointes : non reçues en fichiers ; analyse sur PREVIEW-SIM + constats.  
- Session Preview **réelle** non rejouée (login).  
- Ticket **reste ouvert** jusqu’à nouvelle recette visuelle CTO.

## Hors lot

Mobile/Safari immersif, desktop ≥1024, partage/commentaires, Lot 6 R-PAN : non étendus.
Production / `main` : hors périmètre.
