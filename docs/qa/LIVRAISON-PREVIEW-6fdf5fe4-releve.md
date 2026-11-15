# Livraison Preview `6fdf5fe4` — relevé du 2026-11-15

> **Périmètre** : Preview uniquement — correctif recette visuelle `VIDEO-REFONTE-L5-MEDIUM-01`.  
> **`main` / production : non touchés.** Ticket **ouvert** jusqu’à nouvelle recette visuelle CTO.  
> **Mention** : preuves locales avec API simulée ; captures CTO indisponibles localement.

## 1. Contrôles pré-commit (GO)

| # | Critère | Résultat |
|---|---------|----------|
| 1 | Scroll réel souris / trackpad / tactile (2 sens) + 844×390 | ✅ VERIFY_OK — scrollbar masquée ≠ preuve |
| 2 | Réserve 14.5rem vs chrome rendu | ✅ 232 px ≥ stageTop 230 px |
| 3 | clipBasPx défini ; 3 grandes hauteurs sans débordement | ✅ `stage.bottom−innerHeight` ; ≤0 à 640/820/1023 |
| 4 | 844×390 : scroll → lecteur + actions | ✅ mute/share/comments + nav haut |
| 5 | Vitest medium concernés | ✅ **22/22** |
| 6 | Scripts temporaires exclus | ✅ `_probe*` / `_diag*` / `_verify*` non commités |

Rapport : [`controle-rendu/l5-medium/recette-visuelle/RAPPORT-RECETTE-VISUELLE-CORRECTIF.md`](controle-rendu/l5-medium/recette-visuelle/RAPPORT-RECETTE-VISUELLE-CORRECTIF.md)

## 2. Branche et avance rapide

| Contrôle | Résultat |
|---|---|
| Distante relue **avant** | `feat/c3-videos-refonte-final` = **`95674af137ccd27d010c3ec5ca22ba8d1aab8066`** |
| Poussée | FF **`95674af1..6fdf5fe4`**, **sans `--force`** |
| Distante relue **après** | **`6fdf5fe4c2830e2741d03d7aa084cf483e92447f`** |
| Contenu | **1 commit** : `6fdf5fe4` (parent direct `95674af1`) |
| Branche locale | `feat/video-refonte-l3l4-mobile-v23` (worktree `yunicity-wt-video-lot1`) |

## 3. CI sur `6fdf5fe4`

| Workflow | Résultat |
|---|---|
| Frontend CI | ✅ success (`43678666196`) |
| Backend CI | ✅ success (`43678666200`) |
| Lint agent rules | ✅ success (`43678666182`) |
| Docker CI | ✅ success (`43678666221`) |
| PR Safety Checks | ❌ **audit préexistant** (`43678666257`) — job `Dependency audit` / `osv-scanner` |

Comparaison GHSA vs `95674af1` (`43672537008`) : **60 / 60** lignes `osv.dev/GHSA-` → **identique**. **Aucune nouvelle anomalie** hors cet audit connu.

## 4. Railway (projet `dazzling-wisdom`)

Statuts GitHub commit (lecture seule) :

| Service | État | Description | Déploiement |
|---|---|---|---|
| `unified-media-preview` (API) | **SUCCESS** | Success - api-preview.yunicity.city | `594bd7e8-9d3a-41aa-8157-bb98bff4d6d1` |
| `yunicity.review` (web) | **SUCCESS** | Success - preview.yunicity.city | `de12e2e6-9af1-4164-a5bc-69038cb35e85` |

SHA déclencheur / tip distant : **`6fdf5fe4`**.

## 5. Contrôles runtime Preview

| Contrôle | Résultat |
|---|---|
| API `GET /api/v1/health` | **200** `{"status":"ok","service":"yunicity-api","environment":"prod"}` (libellé Preview) |
| Tip distant | `6fdf5fe4` |
| CSS servi | `--videos-medium-chrome-offset:14.5rem` + `height:max(240px,min(720px,calc(100dvh - var(--videos-medium-chrome-offset))))` |
| JS servi | marqueurs `data-videos-medium-vertical-feed` + `videos-medium-vertical-stage` présents |
| Session réelle Preview | mur login — recette visuelle humaine CTO requise |
| Preuves layout | locales, API simulée ; captures CTO indisponibles localement |

## 6. Suite

- URL : https://preview.yunicity.city/videos  
- SHA distant / attendu : **`6fdf5fe4`**  
- **Nouvelle recette visuelle CTO (medium)** : obligatoire avant clôture. Ticket **ouvert**.  
- Production / `main` : hors périmètre.
