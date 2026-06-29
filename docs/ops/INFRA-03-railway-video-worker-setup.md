# INFRA-03 — Railway video-worker setup (VIDEO-03A)

| Champ | Valeur |
|-------|--------|
| Feature | FEATURE-CREATORS-V2 — Local Video |
| Tickets | VIDEO-03A (merged) · INFRA-03 (ce doc) |
| Prérequis | PR #72 sur `main` · Redis + Postgres recette · R2 (INFRA-01) |
| Exécuteur | Kyria (Railway dashboard) |
| Liens | `docs/adr/ADR-VIDEO-03A-async-media-processing-worker.md`, `docs/architecture/MEDIA-PLATFORM.md`, `docs/ops/INFRA-01-cloudflare-setup-checklist.md` |

> **Cursor ne crée aucun service Railway.** Checklist actionnable manuellement.

---

## 1. Résumé

Le publish vidéo (`POST /api/v1/local-videos`) retourne **HTTP 202** et enqueue un job ARQ.  
Sans worker séparé, les vidéos restent en `processing` indéfiniment.

| Service | Rôle | Commande par défaut (Dockerfile) |
|---------|------|----------------------------------|
| **API** (`powerful-abundance` recette) | HTTP + enqueue | `uvicorn app.main:create_app ...` |
| **video-worker** (à créer) | FFmpeg + R2 + DB | `arq workers.video_worker.WorkerSettings` |

---

## 2. Même image Docker que l’API ?

**Oui.** Une seule image `backend/Dockerfile` :

- `ffmpeg` + `ffprobe` installés
- `workers/` copié dans l’image
- dépendance `arq` dans `pyproject.toml`

Seule la **commande de démarrage Railway** diffère. Pas de second Dockerfile.

**Attention healthcheck :** le `HEALTHCHECK` du Dockerfile cible Uvicorn (`/api/v1/health`).  
Sur le service worker : **désactiver le healthcheck HTTP Railway** (pas de port HTTP exposé) ou accepter « no health check » — le worker est sain si les logs affichent `video_worker_startup`.

---

## 3. Commande exacte du service

```bash
arq workers.video_worker.WorkerSettings
```

Équivalent local / Docker Compose (déjà dans `docker-compose.yml`) :

```yaml
command: arq workers.video_worker.WorkerSettings
```

**Après création du service Railway**, la première validation sans smoke test :

1. Onglet **Deployments** → dernier deploy **Success**
2. Onglet **Logs** → ligne structurée contenant `video_worker_startup` et `queue=yunicity-media-video`
3. Pas d’erreur `REDIS_URL is required` / `Database is not configured`

Commande de diagnostic (local, mêmes variables que recette) :

```bash
cd backend
arq workers.video_worker.WorkerSettings
```

---

## 4. Variables d’environnement

Copier depuis le service **API recette** (`powerful-abundance`) tout ce qui touche DB, Redis et média.  
Railway permet **Reference Variable** depuis un autre service — préférer ça pour `DATABASE_URL` et `REDIS_URL`.

### Obligatoires (worker)

| Variable | Exemple recette | Notes |
|----------|-----------------|-------|
| `APP_ENV` | `recette` | Aligné API |
| `DATABASE_URL` | `postgresql+asyncpg://…` | **Référence** service API ou Postgres plugin |
| `REDIS_URL` | `redis://…` | **Référence** service API ou Redis plugin |
| `LOCAL_VIDEO_STORAGE_BACKEND` | `r2` | Identique API |
| `LOCAL_VIDEO_CDN_BASE_URL` | `https://media.recette.yunicity.city` | URLs publiques post-traitement |
| `LOCAL_VIDEO_R2_ENDPOINT` | `https://<account_id>.r2.cloudflarestorage.com` | Sans trailing slash |
| `LOCAL_VIDEO_R2_BUCKET` | `yunicity-media-recette` | |
| `LOCAL_VIDEO_R2_ACCESS_KEY_ID` | *(secret)* | Même token que API |
| `LOCAL_VIDEO_R2_SECRET_ACCESS_KEY` | *(secret)* | Même token que API |

### Recommandées

| Variable | Défaut | Notes |
|----------|--------|-------|
| `LOCAL_VIDEO_PROCESSING_JOB_TIMEOUT_SECONDS` | `600` | Min. 300 — timeout job ARQ (FFmpeg 60 s + marge Railway) |
| `LOG_LEVEL` | `INFO` | Logs worker structurés |
| `APP_NAME` | `Yunicity Video Worker` | Cosmétique logs |

### Optionnelles (selon API recette)

| Variable | Quand |
|----------|-------|
| `LOCAL_VIDEO_DEFAULT_CITY_SLUG` | `reims` — le worker résout le slug depuis la clé objet ; utile si validation Settings partagée, pas critique worker seul |
| `LOCAL_VIDEO_MAX_BYTES` / `LOCAL_VIDEO_MAX_DURATION_SECONDS` | Garder alignés API si surchargés |

### Non requises pour le worker

- `CORS_ORIGINS`, `JWT_*`, `WEB_FRONTEND_URL` — pas de surface HTTP auth sur le worker
- `PORT` — ARQ n’écoute pas HTTP

---

## 5. Création pas à pas (Railway dashboard)

### 5.1 Prérequis

- [ ] PR #72 mergée sur `main` (commit VIDEO-03A)
- [ ] Redeploy API recette terminé (`powerful-abundance`)
- [ ] Redis recette accessible (même instance que rate limits API)
- [ ] Variables R2 recette déjà OK sur API (INFRA-01)

### 5.2 Nouveau service

1. Railway → projet **recette** (même projet que l’API)
2. **+ New** → **GitHub Repo** → repo `yunicity.review` (ou équivalent)
3. Si Railway propose un second service sur le repo existant : **Add Service** depuis le même repo
4. **Root Directory** : `backend` (identique API)
5. **Builder** : Dockerfile (`backend/Dockerfile`)

### 5.3 Commande de démarrage

1. Service **video-worker** → **Settings** → **Deploy**
2. **Custom Start Command** :

   ```
   arq workers.video_worker.WorkerSettings
   ```

3. **Healthcheck** : désactiver ou laisser vide (ne pas utiliser `/api/v1/health`)

### 5.4 Réseau

1. **Settings** → **Networking** : **pas de domaine public** (worker interne)
2. Vérifier accès sortant vers R2 (HTTPS) — par défaut OK sur Railway

### 5.5 Variables

1. **Variables** → copier bloc §4 ou utiliser **Reference** depuis `powerful-abundance` pour `DATABASE_URL`, `REDIS_URL`
2. Dupliquer les `LOCAL_VIDEO_*` R2 depuis l’API
3. Ajouter `APP_ENV=recette`, `LOG_LEVEL=INFO`
4. Optionnel : `LOCAL_VIDEO_PROCESSING_JOB_TIMEOUT_SECONDS=600`

### 5.6 Ressources

1. **Settings** → **Resources** : CPU/RAM ≥ API si transcodes concurrents (pilote : même tier que API ou +1 CPU)
2. Un replica suffit pour le pilote Reims ; scaler horizontal = ticket futur

### 5.7 Deploy

1. **Deploy** → attendre **Active**
2. **Logs** :

   ```
   video_worker_startup ... queue=yunicity-media-video job_timeout_seconds=600
   ```

3. [ ] Pas de crash loop
4. [ ] **Ne pas lancer smoke test** tant que CTO ne donne pas GO (publish restera 202 sans worker = normal avant cette étape)

### 5.8 Nommage suggéré

| Env | Service Railway | Queue Redis |
|-----|-----------------|-------------|
| recette | `video-worker` ou `yunicity-video-worker-recette` | `yunicity-media-video` |
| prod | `video-worker` | `yunicity-media-video` |

---

## 6. Vérification post-setup (sans smoke R2)

Checklist légère **sans** `pilot_m00_seed_videos.py --smoke` :

- [ ] Logs worker : `video_worker_startup`
- [ ] Redis : queue `yunicity-media-video` existe (optionnel : `redis-cli KEYS arq:*`)
- [ ] API recette sur commit `02dfe3e`+ (merge #72)
- [ ] Publish manuel futur : HTTP 202 puis `processing_status=processing` → après worker → `published`

---

## 7. Dette connue — backoff ARQ

| Doc / ADR | Implémentation actuelle |
|-----------|-------------------------|
| Backoff annoncé **30 / 120 / 300 s** | `retry_delay=30` fixe ; ARQ calcule `(try-1)² × 30` → ~30 s, 120 s, … |

Ticket suivi : **`docs/ops/VIDEO-03B-arq-backoff-alignment.md`**

---

## 8. Rollback

1. Arrêter le service **video-worker** (scale 0 ou pause)
2. L’API continue de répondre 202 ; vidéos restent `processing`
3. Pas de rollback Cloudflare / R2 requis

---

## 9. Références code

| Fichier | Rôle |
|---------|------|
| `backend/workers/video_worker.py` | `WorkerSettings`, `on_job_failure` |
| `backend/app/services/local_video/job_queue.py` | Enqueue API |
| `backend/app/services/local_video/processing_service.py` | Pipeline FFmpeg |
| `docker-compose.yml` | Service `video-worker` dev |
