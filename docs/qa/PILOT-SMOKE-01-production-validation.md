# PILOT-SMOKE-01 — Production Smoke Validation

| Champ | Valeur |
|-------|--------|
| Feature | FEATURE-BETA-FIXES-V1 |
| Ticket | PILOT-SMOKE-01 |
| Phase BMAD | VERIFY |
| Environnement | `https://yunicity.city` · `https://api.yunicity.city` |
| Référence code | `main @ d5fbe03` (PR #90) |
| Date | 2026-07-03 |
| Exécutant | Agent QA (lecture seule + smoke automatisé) |

---

## Verdict

### 🟡 GO CONDITIONNEL

**Surface publique : PASS**  
**Surface authentifiée : NOT EXECUTED**

La certification production **finale** nécessite **PILOT-SMOKE-02** — smoke manuel avec un **compte utilisateur pilote connecté** (~30 min).

> **Note méthodologique QA** : l'absence de session authentifiée n'est **pas** un FAIL fonctionnel. Les sections Auth / Profil / Stories / Local Video n'ont **pas été exécutées**, pas rejetées.

---

## Contexte tickets mergés

- PILOT-FIX-02 — Upload avatar/couverture R2
- PILOT-FIX-03 — Stories R2
- PILOT-FIX-03.1 — Stories hors Fil local
- CREATORS-UX-04 — Rail « Ma Story »
- PILOT-UX-04 — Clarification UX inscription / Passport
- PILOT-FIX-05 — Google Maps Billing
- PILOT-FIX-05B — Google Maps cleanup

---

## 1. Surface publique — PASS

### Infra & déploiement

| Check | Résultat |
|-------|----------|
| Web Railway actif | ✅ headers `x-railway-*` |
| Build post-merge déployé | ✅ chunk map `page-8129fec6bc11d094.js` |
| API health | ✅ `GET /api/v1/health` → 200 `environment: prod` |
| Map API (bbox Reims) | ✅ 200 |

### Google Maps — PASS

| Check | Résultat |
|-------|----------|
| `/map` | ✅ 200 |
| Tuiles visibles | ✅ pas de watermark dev |
| Markers (quartiers, lieux, partenaires, événements) | ✅ |
| Filtres Quartiers / Lieux / Événements / Passport | ✅ |
| `BillingNotEnabledMapError` | ✅ absent |
| Warning `loading=async` | ✅ absent (`loading:"async"` dans bundle) |
| Warning `google.maps.Marker` | ⚠️ attendu — dette MAPS-TECH-01 |

### Register & Settings (bundles) — PASS partiel

| Check | Résultat |
|-------|----------|
| `/register`, `/settings` | ✅ 200 |
| Anciens libellés (`Vérification d'identité`, `compte non vérifié`) | ✅ absents des bundles |
| Nouveaux libellés Passport (`Programme Yunicity Passport`, `Disponible prochainement`) | ✅ présents (chunk `2577-…`) |
| Stepper register (« Sécurité du compte », « aucun SMS ») | ⚠️ chunks lazy — UI non parcourue |
| Settings UI (badge, icône horloge) | ⚠️ non rendu sans session |

### Régression routes publiques — PASS

| Route | HTTP |
|-------|------|
| `/`, `/feed`, `/events`, `/neighborhoods`, `/search`, `/notifications`, `/passport`, `/videos`, `/stories`, `/login` | ✅ 200 |
| `admin.yunicity.city` | ✅ 200 |
| `/partners` | ⚠️ 404 (route legacy — hors scope tickets) |

---

## 2. Surface authentifiée — NOT EXECUTED

**Raison : aucun compte pilote connecté pendant l'audit.**

| Section | Statut QA | Signification |
|---------|-----------|---------------|
| Auth (inscription, connexion, refresh, logout) | **NOT EXECUTED** | Non testé — pas d'échec constaté |
| Profil (avatar, bannière, CDN, persistance) | **NOT EXECUTED** | Non testé |
| Stories (création, rail, isolation fil) | **NOT EXECUTED** | Non testé |
| Local Video (upload, worker, transcodage, social) | **NOT EXECUTED** | Non testé |

`/settings` redirige vers login sans session — comportement attendu, pas une régression.

---

## Warnings connus (acceptés)

- **MAPS-TECH-01** — `google.maps.Marker` deprecated
- **SEED-PROD cover assets** — URLs seed `cover.jpg` / `hero.jpg` non hébergées (`docs/ops/SEED-PROD-cover-assets.md`)

---

## Prochaine étape

→ **[PILOT-SMOKE-02](PILOT-SMOKE-02-authenticated-smoke.md)** — compte pilote connecté, ~30 min.

Verdict cible après SMOKE-02 : **GO PRODUCTION CERTIFIED**.

---

## Synthèse CTO (2026-07-03)

Plateforme passée de plusieurs incidents bloquants (Maps billing, stories, uploads, CI) à une **surface publique stable** prête pour le pilote. Il reste une **campagne QA finale authentifiée** — ce n'est plus un chantier de développement.
