# OBS-01 — Observabilité plateforme Yunicity

| Champ | Valeur |
|-------|--------|
| Feature | PLATFORM-AUDIT-V1 |
| Ticket | OBS-01-SPEC |
| Phase BMAD | DOCUMENTATION |
| Date | 2026-07-02 |
| Liens | `docs/audit/AUDIT-01-platform-audit-v1.md` · `docs/ops/MEDIA-MONITORING-SPEC.md` · `docs/adr/ADR-ENV-01-environnements-recette-production.md` |

> **Spec uniquement** — aucune implémentation code, aucune configuration Railway, aucun déploiement dans ce ticket.

---

## 1. État actuel

Yunicity possède déjà une **base d'observabilité** exploitable. Elle est fragmentée entre Railway, GitHub CI et endpoints applicatifs — suffisante pour le développement et un pilote fermé, **insuffisante** pour une ouverture publique sans alerting externe.

### 1.1 Railway Metrics

| Attribut | Détail |
|----------|--------|
| **Disponibilité** | Dashboard Railway par service (API `powerful-abundance`, worker `creative-commitment`, Postgres, Redis) |
| **Métriques natives** | CPU, RAM, réseau, restarts, deploy status |
| **Limites** | Pas de corrélation métier (uploads, jobs ARQ) ; rétention courte ; pas d'alerting avancé sans intégration |
| **Usage actuel** | Validation post-deploy (INFRA-03) · diagnostic incident manuel |

Référence ops : `docs/ops/INFRA-03-railway-video-worker-setup.md` §3.

### 1.2 Railway Logs

| Service | Logs structurés utiles |
|---------|------------------------|
| **API** (`powerful-abundance`) | Requêtes HTTP, erreurs AppError, codes `LOCAL_VIDEO_*`, rate-limit hits |
| **Worker** (`creative-commitment`) | `video_worker_startup`, `process_local_video_job`, `local_video_processing_ready`, `local_video_processing_failed`, `local_video_job_exhausted` |
| **Postgres / Redis** | Logs plugin Railway (connexions, OOM) |

| Attribut | Détail |
|----------|--------|
| **Forces** | Accès immédiat post-incident · filtrage texte · corrélation deploy |
| **Limites** | Pas de recherche long terme · pas d'agrégation · pas d'alertes sur patterns |
| **Gap audit AUDIT-01** | MCP Railway / CLI non disponibles lors de l'audit — dépendance humaine au dashboard |

### 1.3 GitHub CI

Workflows actifs (`.github/workflows/`) :

| Workflow | Déclencheur | Rôle observabilité |
|----------|-------------|-------------------|
| `backend-ci.yml` | PR + push `backend/**` | ruff · mypy · pytest (144 fichiers test) |
| `frontend-ci.yml` | PR + push `frontend/**` | lint · typecheck · tests |
| `docker-ci.yml` | PR + push Dockerfile | build image API + worker |
| `pr-checks.yml` | PR | gates merge |
| `lint-agent-rules.yml` | PR rules/docs | cohérence gouvernance |

| Attribut | Détail |
|----------|--------|
| **Forces** | Détection régression pré-merge · historique GitHub Actions |
| **Limites** | Observabilité **pré-prod** uniquement — ne couvre pas runtime prod |

### 1.4 `/health` (liveness)

```
GET https://api.yunicity.city/api/v1/health
```

Réponse prod mesurée :

```json
{"status":"ok","service":"yunicity-api","environment":"prod"}
```

| Attribut | Détail |
|----------|--------|
| **Implémentation** | `backend/app/api/v1/health.py` |
| **Usage** | Liveness Railway · smoke externe |
| **Limite** | Ne vérifie pas DB/Redis |

### 1.5 `/ready` (readiness)

```
GET https://api.yunicity.city/api/v1/ready
```

Réponse prod mesurée :

```json
{"status":"ready","checks":{"database":"ok","redis":"ok"}}
```

| Attribut | Détail |
|----------|--------|
| **Implémentation** | `backend/app/api/v1/health.py` · `check_database()` · `check_redis()` |
| **Usage** | Validation déploiement · sonde externe possible |
| **Limite** | Ne vérifie pas worker ARQ, R2, queue depth |

### 1.6 Logs worker (ARQ)

Événements clés à monitorer (`backend/workers/video_worker.py`) :

| Log / événement | Signification |
|-----------------|---------------|
| `video_worker_startup` | Worker démarré, queue `yunicity-media-video` |
| `process_local_video_job` start | Job déqueue |
| `local_video_processing_ready` | Publish OK (`elapsed_ms`) |
| `local_video_processing_failed` | Échec FFmpeg / R2 / DB |
| `local_video_job_exhausted` | Retries épuisés |

Référence : `docs/adr/ADR-VIDEO-03A-async-media-processing-worker.md`.

### 1.7 Logs upload (API)

Pipeline upload-init → PUT R2 → publish :

| Étape | Endpoint | Codes / logs |
|-------|----------|--------------|
| Init session | `POST /local-videos/upload-init` | Rate limit · validation magic bytes |
| Binaire | `PUT /local-videos/uploads/{id}/binary` | Taille · content-type |
| Publish | `POST /local-videos` | `202 Accepted` · enqueue ARQ |

Référence contrats : `docs/api/LOCAL-VIDEO-API.md` · KPIs : `docs/ops/MEDIA-MONITORING-SPEC.md` §2.4–2.5.

### 1.8 Logs API (général)

| Catégorie | Exemples |
|-----------|----------|
| Auth | Rate limit login · refresh invalid |
| Erreurs métier | `AppError` avec code (`UNAUTHORIZED`, `weather_key_missing`, …) |
| Sécurité prod | Warning si `EMAIL_PROVIDER=console` en prod (`main.py` lifespan) |

OpenAPI / Swagger **désactivés en prod** (`openapi_url=None`) — bonne pratique sécurité.

### 1.9 Synthèse état actuel

```text
✅ Base existante     : Railway metrics/logs · CI GitHub · /health · /ready · logs structurés worker/API
⚠️ Gaps               : alerting externe · métriques métier · rétention · corrélation · erreurs frontend
❌ Manquant pilote+   : uptime externe · Sentry · dashboards agrégés · SLO formalisés
```

---

## 2. Santé plateforme

Définition des composants à surveiller en production.

| Composant | Rôle | Sonde actuelle | Sonde cible |
|-----------|------|----------------|-------------|
| **API** | HTTP FastAPI · enqueue jobs | `/health` · `/ready` · Railway metrics | + uptime externe · p95 latence · taux 5xx |
| **Worker** | FFmpeg · R2 · DB updates | Logs Railway `video_worker_startup` | + heartbeat job · queue depth · failed rate |
| **Redis** | Rate limits · sessions · queue ARQ | `/ready` → `redis: ok` | + mémoire · connexions · queue length |
| **PostgreSQL** | Persistance | `/ready` → `database: ok` | + connexions · slow queries · disk |
| **R2** | Stockage objets média | Manuel (Cloudflare dashboard) | + `media_objects_total` · coût · orphelins |
| **CDN** | `media.yunicity.city` | HEAD manuel | + uptime · cache hit · egress spike |

Services Railway prod (réf. `docs/ops/INFRA-R2-PROD-setup.md` §6) :

| Env | API | Worker |
|-----|-----|--------|
| Prod | `powerful-abundance` | `creative-commitment` |

---

## 3. Santé métier

Indicateurs orientés produit / pipeline média. Complète `docs/ops/MEDIA-MONITORING-SPEC.md`.

| Indicateur | Définition | Source | Seuil warning | Seuil critical |
|------------|------------|--------|---------------|----------------|
| **uploads_init_total** | Sessions upload-init créées / h | Logs API · DB `local_video_uploads` | — | — |
| **uploads_binary_ok** | PUT binaire réussis / h | Logs API · R2 | — | — |
| **publish_total** | `POST /local-videos` → 202 / h | Logs API | — | — |
| **processing_started** | Jobs ARQ démarrés / h | Logs worker | — | — |
| **processing_published** | Vidéos passées `published` / h | DB · logs `local_video_processing_ready` | — | — |
| **jobs_backlog** | Jobs en attente queue ARQ | Redis `LLEN` (futur) · logs | > 20 | > 100 |
| **processing_duration_avg** | Temps enqueue → published (p95) | Logs `elapsed_ms` | p95 > 60 s | p95 > 180 s |
| **processing_errors** | Jobs failed + exhausted / 24 h | Logs · DB `status=failed` | > 3 % publish | > 10 % publish |
| **upload_failures** | upload-init rejetés + PUT 4xx/5xx | Logs API · R2 | > 5 % / 1 h | > 15 % / 1 h |

Formule backlog acceptable (pilote Reims) :

```text
backlog OK  si jobs_backlog < 10 ET processing_duration_p95 < 120 s
backlog KO  si jobs_backlog > 100 OU worker sans log depuis > 5 min
```

---

## 4. Santé utilisateur

Indicateurs orientés expérience utilisateur réelle.

| Indicateur | Définition | Source cible | Seuil |
|------------|------------|--------------|-------|
| **js_errors** | Exceptions non catchées frontend | Sentry (Phase 3) | > 10/min même route |
| **api_errors_4xx** | Erreurs client (hors auth attendue) | Logs API agrégés | Spike > 3× baseline |
| **api_errors_5xx** | Erreurs serveur | Logs API · Railway | > 1 % requêtes / 5 min |
| **api_latency_p95** | Latence endpoints critiques | Better Stack / OTel | > 2 s (read) · > 5 s (write) |
| **availability** | Uptime composite web + API | UptimeRobot / Better Stack | < 99.5 % / 30 j |
| **upload_failures_user** | Uploads abandons côté client | Logs API + Sentry breadcrumb | > 5 % sessions upload |

Endpoints critiques à inclure dans les sondes uptime :

```text
https://api.yunicity.city/api/v1/health
https://api.yunicity.city/api/v1/ready
https://yunicity.city/
https://yunicity.city/map
https://media.yunicity.city/   (HEAD)
```

---

## 5. Politique d'alertes

Seuils proposés pour le pilote puis l'ouverture publique.

| Alerte | Condition | Sévérité | Action |
|--------|-----------|----------|--------|
| **API down** | `/health` non-200 > 2 min | P0 | Incident Railway · rollback deploy |
| **API degraded** | `/ready` → `degraded` > 5 min | P0 | Vérifier Postgres + Redis |
| **Worker down** | Aucun log `video_worker_startup` / job > 5 min post-deploy | P0 | Redémarrer service · vérifier `REDIS_URL` |
| **Redis down** | `/ready` → `redis: error` | P0 | Restart plugin · rate limits KO |
| **Queue bloquée** | `jobs_backlog` > 100 > 15 min | P1 | Scale worker · investiguer failed jobs |
| **Trop de jobs failed** | `processing_errors` > 10 % / 24 h | P1 | Sample logs FFmpeg · formats abusifs |
| **Trop de 5xx** | > 1 % requêtes API / 5 min | P1 | Corréler deploy · hotfix |
| **Upload failures** | > 15 % upload-init / 1 h | P1 | CORS R2 · credentials · presigned TTL |

Canaux recommandés :

| Phase | Canal |
|-------|-------|
| Pilote fermé | Email Better Stack + Railway notifications |
| Public | Email + Slack/Discord ops (Phase 2+) |

Politique d'escalade :

```text
P0 → notification immédiate · intervention < 30 min
P1 → notification · traitement < 4 h ouvrées
P2 → rapport quotidien
```

---

## 6. Comparaison des outils

Évaluation pour le contexte Yunicity (solo/small team · Railway · FastAPI · Next.js · pilote Reims).

| Outil | Avantages | Limites | Coût estimé | Complexité | Intérêt Yunicity |
|-------|-----------|---------|-------------|------------|------------------|
| **Railway** | Déjà en place · metrics/logs/deploy · zero setup | Rétention courte · pas métier · pas frontend | Inclus plan Railway | ★☆☆ | **Essentiel** — Phase 1 |
| **Better Stack** | Uptime + logs + incident · intégration Railway | Coût scale logs · moins métrique custom | ~0–30 €/mois MVP | ★★☆ | **Fort** — Phase 2 |
| **UptimeRobot** | Uptime simple · gratuit généreux | Pas de logs · pas APM | Gratuit → ~7 €/mois | ★☆☆ | **Fort** — Phase 2 (redondance uptime) |
| **Sentry** | Erreurs JS + Python · breadcrumbs · releases | Coût events · config source maps | Gratuit → ~26 €/mois | ★★☆ | **Fort** — Phase 3 |
| **Prometheus** | Métriques pull · standard · gratuit | Self-host ou managed · pas de logs | Infra à porter | ★★★★ | Moyen — Phase 4 |
| **Grafana** | Dashboards · alerting · multi-source | Setup + maintenance | Cloud ~0–50 €/mois | ★★★★ | Moyen — Phase 4 |
| **OpenTelemetry** | Standard vendor-neutral · traces/metrics/logs | Instrumentation code · backend collector | Variable | ★★★★★ | Long terme — Phase 4 |

Recommandation CTO : **ne pas sauter directement à OBS-C** — la base Railway + `/ready` + logs structurés existe déjà ; ajouter Better Stack + UptimeRobot couvre 80 % des besoins pilote/public MVP.

---

## 7. Architectures candidates

### OBS-A — Railway + Better Stack

```text
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Railway    │────▶│ Better Stack │────▶│  Alertes    │
│ metrics/logs│     │ uptime+logs  │     │  email      │
└─────────────┘     └──────────────┘     └─────────────┘
        │                   │
        ▼                   ▼
   /health /ready      sondes externes
```

| Attribut | Valeur |
|----------|--------|
| **Coût** | Faible |
| **Time-to-value** | 1–2 jours |
| **Couverture** | Infra + uptime + logs centralisés |
| **Manque** | Erreurs frontend · métriques métier fines |

---

### OBS-B — Railway + Better Stack + Sentry

```text
┌─────────────┐     ┌──────────────┐
│  Railway    │────▶│ Better Stack │
└─────────────┘     └──────────────┘
        │
┌───────┴───────┐
│  Sentry       │
│  web + API    │
└───────────────┘
```

| Attribut | Valeur |
|----------|--------|
| **Coût** | Modéré |
| **Time-to-value** | 1 semaine |
| **Couverture** | OBS-A + erreurs utilisateur JS/Python |
| **Recommandé pour** | Ouverture publique |

---

### OBS-C — Railway + OpenTelemetry + Prometheus + Grafana

```text
┌──────────┐    OTel SDK    ┌────────────┐    ┌──────────┐
│ API/Worker│──────────────▶│ Collector  │───▶│ Prometheus│
└──────────┘                └────────────┘    └────┬─────┘
                                                   │
                                              ┌────▼─────┐
                                              │ Grafana  │
                                              └──────────┘
```

| Attribut | Valeur |
|----------|--------|
| **Coût** | Infra + temps ingénierie |
| **Time-to-value** | 3–6 semaines |
| **Couverture** | Complète · SLO · dashboards custom |
| **Recommandé pour** | Scale multi-villes · équipe ops dédiée |

**Décision provisoire** : viser **OBS-B** avant public · étudier **OBS-C** post-PMF Reims.

---

## 8. Roadmap d'adoption

### Phase 1 — Exploiter à 100 % l'existant (immédiat)

| Action | Responsable | Livrable |
|--------|-------------|----------|
| Monitorer `/health` + `/ready` manuellement post-deploy | Dev | Checklist deploy |
| Consulter logs Railway API + worker après chaque release | Dev | Runbook incident |
| Exploiter GitHub CI comme gate qualité | CI auto | PR checks verts |
| Documenter patterns logs worker (cf. §1.6) | Ops | Ce document |

**Exit criteria** : aucun deploy prod sans check `/ready` + scan logs worker 5 min.

---

### Phase 2 — Better Stack + UptimeRobot

| Action | Responsable | Livrable |
|--------|-------------|----------|
| Créer compte Better Stack · ingérer logs Railway | Kyria | Dashboard logs |
| Configurer sondes uptime (§4) | Kyria | Alertes email P0 |
| Ajouter UptimeRobot en redondance `/health` | Kyria | Status page publique (optionnel) |
| Définir alertes §5 (API down, ready degraded) | Dev + Kyria | Playbook P0/P1 |

**Exit criteria** : alerte reçue < 5 min sur coupure API simulée (maintenance planifiée).

---

### Phase 3 — Sentry

| Action | Responsable | Livrable |
|--------|-------------|----------|
| Intégrer Sentry Next.js (`frontend/apps/web`) | Dev | Erreurs JS remontées |
| Intégrer Sentry FastAPI (optionnel) | Dev | Erreurs API 5xx corrélées |
| Configurer releases ↔ deploy Railway | Dev | Regression tracking |

**Exit criteria** : 0 erreur JS silencieuse sur parcours login + upload vidéo pilote.

---

### Phase 4 — Étudier OpenTelemetry · Prometheus · Grafana

| Action | Responsable | Livrable |
|--------|-------------|----------|
| POC OTel sur endpoint `/ready` + worker duration | Dev | Spike doc |
| Évaluer Grafana Cloud vs self-host | CTO | ADR observabilité |
| Implémenter `jobs_backlog` + métriques §3 | Dev | Ticket dérivé |

**Exit criteria** : décision GO/NO-GO OBS-C documentée en ADR.

---

## 9. Références

| Document | Rôle |
|----------|------|
| `docs/audit/AUDIT-01-platform-audit-v1.md` | Audit plateforme · verdict GO pilote |
| `docs/ops/MEDIA-MONITORING-SPEC.md` | KPIs média détaillés |
| `docs/ops/INFRA-R2-PROD-setup.md` | Services Railway prod |
| `docs/ops/INFRA-03-railway-video-worker-setup.md` | Setup worker |
| `docs/adr/ADR-VIDEO-03A-async-media-processing-worker.md` | Pipeline async |
| `docs/adr/ADR-ENV-01-environnements-recette-production.md` | Environnements |

---

## 10. Historique

| Date | Événement |
|------|-----------|
| 2026-07-02 | OBS-01-SPEC — spec initiale (doc-only, post AUDIT-01) |
