# AUDIT-01 — Platform Audit V1

| Champ | Valeur |
|-------|--------|
| Feature | PLATFORM-AUDIT-V1 |
| Ticket | AUDIT-01 |
| Phase BMAD | AUDIT (READ-ONLY) |
| Date | 2026-07-02 |
| Source de vérité | `origin/main` (`5a7ccb1`) · `yunicity.city` · `admin.yunicity.city` · `api.yunicity.city` · Railway |
| Liens | `docs/ops/OBS-01-observability-spec.md` · `docs/ops/INFRA-R2-PROD-setup.md` · `docs/adr/ADR-VIDEO-03A-async-media-processing-worker.md` |

> **Périmètre** : audit read-only. Aucune modification de code, aucune requête destructive, aucun test actif de sécurité sur la production. Les fichiers locaux non mergés sont **hors périmètre**.

---

## 1. Méthode

| Canal | Action |
|-------|--------|
| `origin/main` | Inspection via `git show` / `ls-tree` (routers API, pages web/admin, tests, CI, migrations) |
| API prod | Sondes `GET` en lecture seule (`/health`, `/ready`, endpoints publics) |
| Frontends prod | Statut HTTP + validation visuelle (13 pages, sans connexion) |
| Railway | Health indirect via API hébergée ; logs Railway non accessibles lors de l'audit initial (cf. OBS-01) |

**Limites assumées**

- Zones authentifiées (feed, passport, upload vidéo connecté, admin authentifié) : non testées sans compte.
- OpenAPI prod masqué (`404`) — comportement attendu.

---

## 2. Santé infrastructure (mesures live)

| Sonde | Résultat |
|-------|----------|
| `GET /api/v1/health` | `200` · `{"status":"ok","environment":"prod"}` |
| `GET /api/v1/ready` | `200` · `database: ok` · `redis: ok` |
| `openapi.json` prod | `404` ✅ (docs masquées) |
| Web `yunicity.city` | `200` sur toutes les routes testées |
| Admin `admin.yunicity.city` | `200` (shell login) |

**Socle technique sur `origin/main`**

- 144 fichiers de tests backend
- 53 migrations Alembic
- CI : `backend-ci.yml`, `frontend-ci.yml`, `docker-ci.yml`, `pr-checks.yml`, `lint-agent-rules.yml`
- Rate-limiting Redis (`backend/app/core/rate_limit.py`)
- Garde-fous prod stricts (JWT, CORS, cookies, pepper, `DEBUG` interdit)

---

## 3. Validation E2E réalisée le 2026-07-02

Validation manuelle du pipeline Local Video en **production** (post-merge PR #79, ticket VIDEO-04BC-POST-SMOKE).

| Étape | Statut | Preuve / référence |
|-------|--------|-------------------|
| Upload iPhone (`.mov`) | ✅ | Founder · ticket VIDEO-04BC-POST-SMOKE CLOSED |
| Upload Android (`.mp4`) | ✅ | Même session QA prod · format natif Android |
| `POST /local-videos/upload-init` | ✅ | Presigned URL bucket `yunicity-media-prod` |
| PUT binaire R2 (presigned) | ✅ | CORS prod `yunicity.city` · cf. `docs/ops/INFRA-R2-PROD-setup.md` §2.3 |
| Worker ARQ (`creative-commitment`) | ✅ | Job `process_local_video_job` · logs `video_worker_startup` |
| Objet `processed.mp4` | ✅ | Dérivé FFmpeg en bucket prod |
| Objet `thumbnail.jpg` | ✅ | Dérivé FFmpeg en bucket prod |
| CDN `media.yunicity.city` | ✅ | HEAD `200` sur URLs media + thumbnail |
| Apparition feed | ✅ | Vidéo visible dans le feed authentifié post-publish |
| Likes | ✅ | Interaction sociale validée sur la vidéo de référence |
| Commentaires | ✅ | Interaction sociale validée sur la vidéo de référence |

**Vidéo de référence QA** : « Fête de la musique » — `664524b2-ca5a-4ece-8a17-2afa293ccf80`.

> Le pipeline vidéo est **techniquement validé en prod**. Le point restant porte sur l'**observabilité continue** du pipeline (alertes, dashboards, visibilité queue) — cf. P1-1 et `docs/ops/OBS-01-observability-spec.md`.

---

## 4. Matrice Code ↔ Production

Légende : **Main** = présent sur `origin/main` · **Prod** = déployé et répond · **Validée** = vérifié visuellement ou par sonde E2E.

### Chapitre 1 — Infrastructure & Sécurité

| Feature | Main | Prod | Validée |
|---------|------|------|---------|
| API FastAPI (health/ready) | ✅ | ✅ | ✅ |
| Auth JWT + refresh + rate-limit | ✅ | ✅ | ⚠️ |
| Garde-fous config prod | ✅ | ✅ | ✅ |
| Média R2 (`media.yunicity.city`) | ✅ | ✅ | ✅ |
| Worker vidéo async (ARQ) | ✅ | ✅ | ✅ (E2E 2026-07-02) |
| Headers sécurité HTTP (HSTS/CSP) app | ❌ | ❌ | ❌ |

**Maturité : ★★★★☆ — Stable**

---

### Chapitre 2 — Découverte territoriale

| Feature | Main | Prod | Validée |
|---------|------|------|---------|
| Carte (Google Maps) | ✅ | ✅ | ✅ |
| Lieux culturels | ✅ | ✅ | ✅ (12 lieux) |
| Quartiers V2 | ✅ | ✅ | ✅ (12 quartiers) |
| Transit (Grand Reims) | ✅ | ✅ | ⚠️ (horaires indicatifs) |
| Météo | ✅ | ⚠️ | ❌ (`503` — clé OpenWeather absente) |

**Maturité : ★★★★☆ — Stable**

---

### Chapitre 3 — Événements

| Feature | Main | Prod | Validée |
|---------|------|------|---------|
| Événements (`/sortir`) | ✅ | ✅ | ⚠️ (UI complète, 0 événement) |
| Admin événements | ✅ | ✅ | ⚠️ |

**Maturité : ★★★☆☆ — Fonctionnel mais dette (contenu)**

---

### Chapitre 4 — Social & Communautés

| Feature | Main | Prod | Validée |
|---------|------|------|---------|
| Feed | ✅ | ✅ | ⚠️ (auth requise) |
| Tribus | ✅ | ✅ | ⚠️ (0 tribu publique) |
| Stories | ✅ | ✅ | ⚠️ (redirect login) |
| Discussions | ✅ | ✅ | ❌ |
| Posts / Commentaires | ✅ | ✅ | ❌ |

**Maturité : ★★☆☆☆ — Incomplet**

---

### Chapitre 5 — Créateurs & Vidéo locale

| Feature | Main | Prod | Validée |
|---------|------|------|---------|
| Create Hub (UX-02A/02B/03A) | ✅ | ✅ | ⚠️ (flux auth) |
| Créateurs publics | ✅ | ✅ | ⚠️ (0 créateur) |
| Vidéo locale — upload | ✅ | ✅ | ✅ (E2E 2026-07-02) |
| Vidéo locale — feed | ✅ | ✅ | ✅ (E2E 2026-07-02) |
| Worker traitement vidéo | ✅ | ✅ | ✅ (E2E 2026-07-02) |

**Maturité : ★★★★☆ — Stable** *(requalifié après validation E2E)*

---

### Chapitre 6 — Passeport & Partenaires

| Feature | Main | Prod | Validée |
|---------|------|------|---------|
| Partenaires signés | ✅ | ✅ | ✅ |
| Offres partenaires publiques (RF-02A) | ✅ | ✅ | ⚠️ (0 offre) |
| Passeport (offres/challenges) | ✅ | ✅ | ⚠️ (auth) |
| Scan QR / tampons | ✅ | ✅ | ❌ |
| Partner leads | ✅ | ✅ | ❌ |

**Maturité : ★★★☆☆ — Fonctionnel mais dette (contenu)**

---

### Chapitre 7 — Admin

| Feature | Main | Prod | Validée |
|---------|------|------|---------|
| Modération / Analytics / Staff | ✅ | ✅ | ⚠️ |
| Partenaires / Offres / Passport-ops | ✅ | ✅ | ⚠️ |
| Cockpit / Activation waves / Reports | ✅ | ✅ | ⚠️ |

**Maturité : ★★★★☆ — Stable**

---

### Chapitre 8 — Comptes & Abonnements

| Feature | Main | Prod | Validée |
|---------|------|------|---------|
| Auth / Register / Login | ✅ | ✅ | ⚠️ |
| Profil public | ✅ | ✅ | ⚠️ |
| Abonnements (plans) | ✅ | ✅ | ⚠️ |
| Notifications | ✅ | ✅ | ❌ |

**Maturité : ★★★★☆ — Stable**

---

## 5. Anomalies visuelles (production)

| # | Anomalie | Impact |
|---|----------|--------|
| 1 | Accueil `/` : statut API bloqué « Chargement… » | Première impression dégradée |
| 2 | `/videos`, `/stories`, `/search` : redirect silencieux vers `/login` | Aucune découverte publique |
| 3 | Météo : `503` (clé OpenWeather absente) | Feature cassée en prod |
| 4 | Contenu vide : 0 événement, 0 offre, 0 tribu, 0 créateur public | Expérience pilote creuse |

---

## 6. Synthèse de maturité

| Chapitre | Maturité |
|----------|----------|
| 1. Infra & Sécurité | ★★★★☆ Stable |
| 2. Découverte territoriale | ★★★★☆ Stable |
| 3. Événements | ★★★☆☆ Dette (contenu) |
| 4. Social & Communautés | ★★☆☆☆ Incomplet |
| 5. Créateurs & Vidéo | ★★★★☆ Stable |
| 6. Passeport & Partenaires | ★★★☆☆ Dette (contenu) |
| 7. Admin | ★★★★☆ Stable |
| 8. Comptes & Abonnements | ★★★★☆ Stable |

### Score global

```text
★★★★☆ — Stable
```

Plateforme **techniquement solide** (infra, sécurité, découverte territoriale, pipeline vidéo E2E validé). Freins restants : **contenu réel**, **découverte publique**, **observabilité opérationnelle**.

---

## 7. Blocages et tickets

### P0 — bloquants pilote fermé

| # | Blocage | Zone |
|---|---------|------|
| P0-1 | **Contenu absent** : 0 événement, 0 offre partenaire, 0 tribu, 0 créateur public | Data / Seed |
| P0-2 | **Découverte publique insuffisante** : `/videos`, `/stories`, `/search` redirect login | UX |

### P1 — avant ouverture publique

| # | Blocage | Zone |
|---|---------|------|
| P1-1 | **Observabilité insuffisante du pipeline vidéo** — pas de dashboard/alertes queue worker, backlog, failed jobs | Ops · OBS-01 |
| P1-2 | Statut API accueil bloqué « Chargement… » | Web |
| P1-3 | Météo `503` (clé OpenWeather prod manquante) | Config |
| P1-4 | RF-02A offres partenaires : seed prod non exécuté | Data |

> **Note de requalification** : l'ancien P0-1 « Worker vidéo non vérifié » est **clos** après validation E2E du 2026-07-02. Le risque résiduel relève de l'**observabilité** (P1-1), pas de la fonctionnalité.

### Tickets impératifs avant lancement public

```text
SEED-PROD-01    Injecter contenu Reims réel (événements, offres, tribus, créateurs)
DISCOVERY-01    Mode découverte publique pour videos/stories/search
OBS-01          Spec observabilité + adoption progressive (cf. docs/ops/OBS-01-observability-spec.md)
WEB-HOME-01     Corriger le statut API bloqué sur l'accueil
CONFIG-WX-01    Provisionner OpenWeather prod ou masquer proprement la météo
```

---

## 8. GO / NO-GO Production

### Verdict

```text
🟢 GO technique — pilote fermé Reims
🔴 NO-GO — ouverture publique
```

| Question | Réponse |
|----------|---------|
| Peut-on ouvrir Yunicity à un pilote réel aujourd'hui ? | **Oui**, pilote **fermé et accompagné** (invités, comptes pré-créés, contenu injecté). Ingénierie saine : API stable, DB+Redis OK, sécurité prod mature, découverte territoriale solide, pipeline vidéo E2E validé. |
| Peut-on ouvrir au public ? | **Non** tant que contenu réel, découverte publique et observabilité ne sont pas finalisés. |
| Base pour refonte UI/UX V2 ? | **Oui** — état des lieux connu, vérifié, documenté. |

### Conditions de passage NO-GO → GO public

1. **Contenu réel** seedé en prod (événements, offres, tribus, créateurs pilotes).
2. **Découverte publique** : teaser ou mode invité sur videos/stories/search.
3. **Observabilité** : Phase 1–2 de OBS-01 opérationnelles (Railway + uptime externe + alertes minimales).

---

## 9. Références

| Document | Rôle |
|----------|------|
| `docs/ops/OBS-01-observability-spec.md` | Spec observabilité plateforme |
| `docs/ops/INFRA-R2-PROD-setup.md` | Infra média prod + validation E2E |
| `docs/ops/INFRA-03-railway-video-worker-setup.md` | Worker ARQ Railway |
| `docs/ops/MEDIA-MONITORING-SPEC.md` | KPIs média (complémentaire) |
| `docs/adr/ADR-VIDEO-03A-async-media-processing-worker.md` | Décision worker async |
| `docs/api/LOCAL-VIDEO-API.md` | Contrats API Local Video |
| `docs/qa/MEDIA-INFRA-V1-smoke-test.md` | Script smoke automatisé |

---

## 10. Historique

| Date | Événement |
|------|-----------|
| 2026-07-02 | Audit initial AUDIT-01 (read-only) |
| 2026-07-02 | Validation E2E pipeline vidéo prod (iPhone + Android) |
| 2026-07-02 | Requalification P0-1 → P1-1 (observabilité) · score global ★★★★☆ · formalisation doc |
