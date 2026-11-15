# Livraison Preview `e49f4bb4` — relevé du 2026-11-15

> **Périmètre** : Preview — correctif portrait/paysage `VIDEO-REFONTE-L5-MEDIUM-01`.  
> **`main` / production : non touchés.** Ticket **ouvert** jusqu’à recette visuelle CTO.

## 1. Contrôles pré-commit

| # | Critère | Résultat |
|---|---------|----------|
| 1 | Diff ciblé (frames, layout, meta panel, badge, tests, preuves) ; probes exclus | ✅ |
| 2 | Vitest medium + aiguillage | ✅ **23/23** |
| 3 | Utils `local-video-layout` (fit + fromDims) | ✅ **19/19** |
| 4 | Mobile/Safari immersif, desktop, partage L2, accueil | ✅ non touchés hors medium |
| 5 | VERIFY local API simulée portrait/paysage | ✅ |

## 2. Branche et avance rapide

| Contrôle | Résultat |
|---|---|
| Distante relue **avant** | `feat/c3-videos-refonte-final` = **`0090dc58`** |
| Poussée | FF **`0090dc58..e49f4bb4`**, **sans `--force`** |
| Distante relue **après** | **`e49f4bb4511eea40c8df69ed84ddbfe4550d6028`** |
| Contenu | **1 commit** code+preuves (parent `0090dc58`) |

## 3. CI sur `e49f4bb4`

| Workflow | Résultat |
|---|---|
| Frontend CI | ✅ success (`43712451289`) |
| Backend CI | ✅ success (`43712451314`) |
| Lint agent rules | ✅ success (`43712451321`) |
| Docker CI | _(voir statut final)_ |
| PR Safety Checks | ❌ audit préexistant (`43712451248`) |

### Audit — comptage constant

| Méthode | Baseline `6fdf5fe4` (`43678666257`) | `e49f4bb4` (`43712451248`) |
|---------|--------------------------------------|----------------------------|
| **A — GHSA uniques** | **45** | **45** |
| **B — occurrences** (`osv.dev/GHSA-` / « 60 known vulnerabilities ») | **60** | **60** |
| Diff IDs uniques | — | **0 ajout, 0 retrait** |

Périmètre : `frontend/pnpm-lock.yaml` via osv-scanner (PR Safety Checks).

## 4. Railway (projet `dazzling-wisdom`)

| Service | État | Déploiement |
|---|---|---|
| `unified-media-preview` (API) | **SUCCESS** | `fc97e1ee-c0fd-4690-a8b1-39c674626025` |
| `yunicity.review` (web) | **SUCCESS** | `d1d0d156-aa44-43d8-a20d-bba7a7581a54` |

SHA tip distant / déclencheur : **`e49f4bb4`**.

## 5. Runtime Preview

| Contrôle | Résultat |
|---|---|
| API `GET /api/v1/health` | **200** `{"status":"ok",...}` |
| `GET /videos` | **200** |
| JS servi | marqueurs `data-videos-medium-video-frame`, `videos-medium-portrait-stage`, `videos-medium-landscape-stage` |
| Feed réel | **401** sans login — médias Preview DB non accessibles |
| Composition (JS Preview + API simulée) | portrait haut/étroit + overlay ; paysage horizontal + méta dessous ; commandes OK ; `?video=` badge **1×** — `PREVIEW_VERIFY_OK` |

Captures : `docs/qa/controle-rendu/l5-medium/portrait-paysage/PREVIEW-*.png` + `preview-e49f4bb4-preuves.json`.

## 6. Suite

- URL : https://preview.yunicity.city/videos  
- SHA : **`e49f4bb4`**  
- **Recette visuelle CTO** obligatoire avant clôture. Ticket **ouvert**.  
- Production / `main` : hors périmètre.
