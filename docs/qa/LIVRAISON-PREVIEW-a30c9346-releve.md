# Livraison Preview `a30c9346` — relevé du 2026-11-15

> **Périmètre** : Preview groupée **VIDEO-REFONTE L7 + L8 + L9** (grille, lecteur overlay, C4/C7/D2 + finitions C2).  
> **`main` / production : non touchés.** Tickets L7/L8/L9 **ouverts / NON CLOS** jusqu’à recette CTO Preview.

## 1. Contrôles pré-commit

| # | Critère | Résultat |
|---|---------|----------|
| 1 | Diff ciblé depuis `3b1586bb` (composants, hooks, tests, tickets, bilan/matrice/preuves) ; probes/diags/L2/L5 exclus | ✅ 88 fichiers |
| 2 | Vitest L7/L8/L9 + REC-01 auth-return-path | ✅ **32** web + **6** utils |
| 3 | `pnpm --filter web typecheck` | ✅ |
| 4 | Commit | ✅ `a30c9346` |

## 2. Branche et avance rapide

| Contrôle | Résultat |
|---|---|
| Distante relue **avant** | `feat/c3-videos-refonte-final` = **`3b1586bb67bb977ee6838d0054dc1a1228e3a8b0`** |
| Poussée | FF **`3b1586bb..a30c9346`**, **sans `--force`** |
| Distante relue **après** | **`a30c9346e00bacbc6081246c141d50d4a57fdb59`** |
| Contenu | **1 commit** code + docs QA L7/L8/L9 (parent `3b1586bb`) |

## 3. CI

### Sur `a30c9346` (code)

| Workflow | Résultat |
|---|---|
| Frontend CI | ✅ success (`43740371759`) |
| Backend CI | ✅ success (`43740371728`) |
| Docker CI | ✅ success (`43740371814`) |
| Lint agent rules | ✅ success (`43740371740`) |
| PR Safety Checks | ❌ audit préexistant (`43740371703`) |

### Sur `dd9a3516` (docs relevé)

| Workflow | Résultat |
|---|---|
| Frontend CI | ✅ success (`43741834003`) |
| Backend CI | ✅ success (`43741833913`) |
| Docker CI | ✅ success (`43741833890`) |
| Lint agent rules | ✅ success (`43741833961`) |
| PR Safety Checks | ❌ audit préexistant (`43741833901`) |

### Audit — comptage constant (périmètre égal)

| Méthode | Baseline attendue | `a30c9346` | `dd9a3516` (`43741833901`) |
|---------|-------------------|------------|----------------------------|
| **A — GHSA uniques** | **45** | **45** | **45** |
| **B — occurrences** (« 60 known vulnerabilities ») | **60** | **60** | **60** |
| Diff IDs uniques | — | 0 | **0 ajout, 0 retrait** |

Périmètre : `frontend/pnpm-lock.yaml` via osv-scanner (PR Safety Checks).

## 4. Railway (projet `dazzling-wisdom`)

| Service | État | Déploiement | Commit |
|---|---|---|---|
| `unified-media-preview` (API) | **SUCCESS** | `21bdf034-45e9-42cf-817e-a36a19100b4f` | `dd9a3516` (docs ; image API = même digest que `a30c9346`) |
| `yunicity.review` (web) | **SUCCESS** | `aec6da58-f841-4cc7-b8ca-8c07daf5e0fa` | `dd9a3516` |
| *(précédent code)* | SUCCESS puis REMOVED | API `8fa9197e…` / web `8e42bde8…` | `a30c9346` |

## 5. Runtime Preview

| Contrôle | Résultat | Nature |
|---|---|---|
| API `GET https://api-preview.yunicity.city/api/v1/health` | **200** `{"status":"ok","service":"yunicity-api","environment":"prod"}` (libellé Preview) | **API réelle Preview** |
| `GET https://preview.yunicity.city/videos` | **200** | **Web réelle Preview** |
| JS servi | marqueurs `data-videos-desktop-grid`, `data-videos-desktop-overlay`, `videos-desktop-grid`, `desktop-overlay-direct` présents dans les chunks | **Web réelle** |
| Feed `GET /api/v1/local-videos/feed` sans login | **401** | **Auth réelle** (pas de session) — attendu |
| BUILD local antérieur | sondes C4/C7/D2/R-FOCUS | **API/auth simulées** uniquement |

Preuve runtime : `docs/qa/controle-rendu/l9-desktop/preview-a30c9346-runtime.json`.

## 6. Réserves (tickets NON CLOS)

- Recette visuelle CTO Preview (L7/L8/L9) obligatoire avant clôture.
- **Credentials réels** (parcours D2 login réel) non joués sur Preview.
- **Safari** desktop / iOS non vérifiés ici.
- F1 `left: 811` vs flex (~797) — revue visuelle.
- Production / `main` : hors périmètre.

## 7. Suite

- URL : https://preview.yunicity.city/videos  
- SHA : **`a30c9346`**  
- Tickets **ouverts** jusqu’à recette CTO.
