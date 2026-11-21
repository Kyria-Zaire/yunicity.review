# Livraison Preview `95674af1` — relevé du 2026-11-15

> **Périmètre** : Preview uniquement — `VIDEO-REFONTE-L5-MEDIUM-01`.  
> **`main` / production : non touchés.** Ticket **ouvert** jusqu’à recette visuelle CTO.

## 1. Contrôles pré-commit (GO)

| # | Critère | Résultat |
|---|---------|----------|
| 1 | Diff L5 (composants, styles, tests, preuves) ; probes exclus | ✅ 44 fichiers ; scripts `_probe*` / `_diag*` / `_verify*` **non commités** |
| 2 | Viewport : défaut `presentation="immersive"` / `mediumNav=null` | ✅ feed mobile immersif **ne passe pas** ces props |
| 3 | Hors Lot 6 (R-PAN) | ✅ commentaires restent en feuille existante |
| 4 | Vitest L5 + stage + aiguillage | ✅ **22/22** |
| 5 | ESLint fichiers touchés + `tsc --noEmit` | ✅ |

## 2. Branche et avance rapide

| Contrôle | Résultat |
|---|---|
| Distante relue **avant** | `feat/c3-videos-refonte-final` = **`815c6bdfaf11c745df8384916f068acf180973bf`** |
| Poussée | FF **`815c6bdf..95674af1`**, **sans `--force`** |
| Distante relue **après** | **`95674af137ccd27d010c3ec5ca22ba8d1aab8066`** |
| Contenu | **1 commit** : `95674af1` (parent direct `815c6bdf`) |
| Branche locale | `feat/video-refonte-l3l4-mobile-v23` (worktree `yunicity-wt-video-lot1`) |

## 3. CI sur `95674af1`

| Workflow | Résultat |
|---|---|
| Frontend CI | ✅ success (`43672536954`) |
| Backend CI | ✅ success (`43672537009`) |
| Lint agent rules | ✅ success (`43672536998`) |
| Docker CI | ✅ success (`43672536990`) |
| PR Safety Checks | ❌ **audit préexistant** (`43672537008`) — job `Dependency audit` / `osv-scanner` |

Comparaison GHSA vs `815c6bdf` (`43665850436`) : **45 / 45**, deltas **0** → `AUDIT_GHSA_IDENTICAL`. **Aucune nouvelle anomalie** hors cet audit connu.

## 4. Railway (projet `dazzling-wisdom`)

Statuts GitHub commit (lecture seule) :

| Service | État | Description |
|---|---|---|
| `unified-media-preview` (API) | **SUCCESS** | Success - api-preview.yunicity.city |
| `yunicity.review` (web) | **SUCCESS** | Success - preview.yunicity.city |

Déploiements déclenchés sur le push `95674af1` (ids GitHub status) :
- API : `59052bdf-2657-4e10-9de6-37f7cfa5a7c9`
- Web : `1d4f764a-dfff-4a7a-bb03-40cd2a109d9b`

## 5. Contrôles runtime Preview

| Contrôle | Résultat |
|---|---|
| API `GET /api/v1/health` | **200** `{"status":"ok","service":"yunicity-api","environment":"prod"}` (libellé Preview) |
| `GET https://preview.yunicity.city/videos` | **200** |
| Tip distant | `95674af1` |
| JS servi | marqueurs `data-videos-medium-vertical-feed` + `data-videos-medium-side-column` présents dans les chunks |
| Rendu medium (API **simulée** sur Preview) | 639 immersif ; 640/820/1023 medium+side ; 1024 desktop ; `?video=` badge **1×** ; Partager + commentaires OK |
| Session réelle Preview | **mur login** sans credentials CTO — recette visuelle humaine requise |

Captures : `docs/qa/controle-rendu/l5-medium/PREVIEW-SIM-*.png` + `preview-simule-preuves.json` (locales ; probes non commités).

## 6. Suite

- URL : https://preview.yunicity.city/videos  
- SHA distant / attendu : **`95674af1`**  
- **Recette visuelle CTO (medium)** : obligatoire avant clôture. Ticket **ouvert**.  
- RC-M1 appareil : après validation visuelle.
