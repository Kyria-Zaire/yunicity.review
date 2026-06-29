# ADR-VIDEO-03A — Worker asynchrone pour le traitement média Local Video

| Champ | Valeur |
|-------|--------|
| Statut | **IMPLEMENTED** (VIDEO-03A) |
| Feature | FEATURE-CREATORS-V2 — Local Video |
| Ticket | VIDEO-01B (documentation) · implémentation future VIDEO-03A |
| Date | 2026-06-16 |
| Liens | `docs/ops/VIDEO-01-media-storage-readiness.md`, `docs/architecture/ADR-CREATORS-V2-local-video-media.md` |

---

## Contexte

Le pipeline Local Video (VIDEO-01) exécute **FFmpeg et ffprobe de façon synchrone** dans la requête HTTP `POST /api/v1/local-videos` (publish). Le flux actuel :

```
upload-init → PUT binaire → publish (HeadObject + ffprobe + transcode + thumbnail + upload derivatives) → réponse API
```

### Pourquoi le synchrone est acceptable aujourd'hui

| Contexte | Justification |
|----------|---------------|
| **Développement** | Faible charge, timeouts locaux tolérés, débogage immédiat |
| **Recette** | Smoke tests scriptés, volume contrôlé, équipe interne |
| **Smoke tests** | Validation bout-en-bout sans infra worker |

### Pourquoi le synchrone devient inacceptable

| Contexte | Risque |
|----------|--------|
| **Uploads utilisateurs réels** | Pic de publishes concurrents |
| **Production** | SLA HTTP, p95 publish, saturation workers API |
| **Charge réelle** | MOV 50 Mo + transcode 1080p ≈ 30–120 s CPU |
| **Timeout HTTP** | Reverse proxy / Railway / Cloudflare coupe la requête avant fin FFmpeg |

Le publish bloque un worker Uvicorn pendant toute la durée du transcodage. À l'échelle Reims puis multi-villes, c'est un goulot d'étranglement structurel.

---

## Pipeline cible

```
UPLOAD (client → R2 presigned)
    ↓
UPLOADED (HeadObject OK, upload session consommée)
    ↓
QUEUE (job Redis)
    ↓
PROCESSING (worker : ffprobe + transcode + thumbnail + upload derivatives)
    ↓
READY (status=published, URLs CDN)
    ou
FAILED (status=failed, processing_error, retry policy)
```

L'API publish devient **acceptation rapide** : validation métier + enqueue + `status=processing` + réponse **202 Accepted** avec `processing_status` ; polling via `GET /local-videos/{id}`.

---

## Solutions étudiées

### 1. FastAPI BackgroundTasks

| Critère | Évaluation |
|---------|------------|
| Avantages | Zéro dépendance ; intégration native FastAPI |
| Inconvénients | Même processus que l'API ; pas de retry durable ; perdu au restart ; pas de visibilité queue |
| Complexité | Faible |
| Compatibilité Yunicity | ⚠️ Insuffisant prod — acceptable smoke dev uniquement |

### 2. ARQ (Async Redis Queue)

| Critère | Évaluation |
|---------|------------|
| Avantages | Async natif (aligné SQLAlchemy async) ; Redis déjà présent ; léger ; retries configurables |
| Inconvénients | FFmpeg = subprocess bloquant → worker async doit déléguer en thread pool ; communauté plus petite que Celery |
| Complexité | Moyenne |
| Compatibilité Yunicity | ✅ **Recommandé** — stack async + Redis existant |

### 3. Celery

| Critère | Évaluation |
|---------|------------|
| Avantages | Mature, retries, monitoring (Flower), patterns éprouvés media |
| Inconvénients | Process séparé, config broker, courbe ops ; surdimensionné pour MVP Reims |
| Complexité | Élevée |
| Compatibilité Yunicity | ⚠️ Possible mais coût ops > bénéfice court terme |

### 4. RQ (Redis Queue)

| Critère | Évaluation |
|---------|------------|
| Avantages | Simple, Redis, bon pour jobs CPU subprocess |
| Inconvénients | Sync ; second runtime ; moins aligné avec FastAPI async |
| Complexité | Moyenne |
| Compatibilité Yunicity | ⚠️ Acceptable si ARQ rejeté pour subprocess |

### 5. Railway / container worker dédié + polling DB

| Critère | Évaluation |
|---------|------------|
| Avantages | Pas de nouvelle lib ; table `local_video_jobs` |
| Inconvénients | Polling, race conditions, pas de DLQ standard |
| Complexité | Moyenne-élevée (custom) |
| Compatibilité Yunicity | ❌ Dette — éviter |

---

## Décision

**Recommandation : ARQ + worker container séparé** (implémentation ticket VIDEO-03A).

Raisons :

1. Redis déjà provisionné (rate limits, cache).
2. Cohérence avec stack async FastAPI.
3. Retries + visibility timeout sans Celery ops overhead.
4. FFmpeg exécuté via `asyncio.to_thread()` ou pool dédié dans le worker ARQ.

Alternative de repli : **RQ** si l'équipe préfère un modèle sync explicite pour subprocess lourds.

---

## Conséquences

### Évolution du publish

- `POST /local-videos` : validation + création `LocalVideo` en `processing` + enqueue job → réponse immédiate.
- Worker : reprend `LocalVideoMediaProcessor` (logique inchangée, déplacée hors requête).
- Idempotence : job key = `video_id` ; retry safe si derivatives déjà présents.

### Évolution API

- Optionnel : `GET /local-videos/{id}` déjà expose `status` + `processing_error` — suffisant MVP polling.
- Futur : webhook interne ou SSE pour notification ready.

### Évolution UX

- Client mobile/web : état « En préparation » après publish ; refresh feed quand `published`.
- Pas de blocage spinner 120 s sur publish.

### Monitoring

- Métriques : queue depth, job duration p95, taux `failed`, retries.
- Alertes : queue > seuil, worker down, FFmpeg error rate.

### Retries

- Transient (R2 timeout, ffmpeg OOM) : retry exponentiel max 3.
- Permanent (invalid media) : `failed` immédiat, pas de retry.
- Backoff ARQ : `retry_delay=30` → defer `(try-1)² × 30` s (30, 120, … cap 86400).

### Idempotence job

Avant FFmpeg, le worker vérifie :

1. DB `status=published` → skip (log `local_video_processing_skip_ready`).
2. R2/filesystem : `processed.mp4` **et** `thumbnail.jpg` présents (HeadObject) → ffprobe léger sur processed uniquement, finalize DB sans re-transcode (log `local_video_processing_ready_idempotent`).

Cas couvert : crash worker après upload derivatives, avant commit DB.

### Timeout ARQ

| Paramètre | Défaut | Env |
|-----------|--------|-----|
| `job_timeout` | 600 s (10 min) | `LOCAL_VIDEO_PROCESSING_JOB_TIMEOUT_SECONDS` (min 300) |
| `max_tries` | 3 | constante code |
| `retry_delay` | 30 s | `LOCAL_VIDEO_PROCESSING_RETRY_BACKOFF_SECONDS[0]` |

Logs : `local_video_job_exhausted` avec `timed_out=true` si timeout ARQ ; message DB explicite.

---

## Statut implémentation

| Élément | VIDEO-03A |
|---------|-----------|
| ADR | ✅ Ce document |
| Worker ARQ (`workers/video_worker.py`) | ✅ |
| Queue Redis `yunicity-media-video` | ✅ |
| Publish async HTTP 202 | ✅ |
| FFmpeg hors requête HTTP | ✅ |
| Retries max 3 + backoff ARQ | ✅ |
| Logs structurés (`local_video_processing_*`) | ✅ |
| Docker service `video-worker` | ✅ dev Compose |

**Composants livrés :**

- `app/services/local_video/processing_service.py` — pipeline FFmpeg (thread pool)
- `app/services/local_video/job_queue.py` — enqueue ARQ
- `workers/video_worker.py` — worker container séparé
- États pipeline : `UPLOADED` → `PROCESSING` → `READY` (`published`) / `FAILED`
