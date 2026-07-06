# Local Video — Contrats API

| Champ | Valeur |
|-------|--------|
| Feature | FEATURE-CREATORS-V2 |
| Base path | `/api/v1/local-videos` |
| Source code | `backend/app/api/v1/local_videos.py`, `backend/app/schemas/local_video.py` |
| Sync doc | VIDEO-DOCS-SYNC-01 (2026-06-29) — aligné PR #72 (VIDEO-03A), PR #71 (VIDEO-01B) |

---

## Pipeline bout-en-bout

```
POST /upload-init  →  presigned PUT R2 (ou PUT /uploads/{id}/binary en dev filesystem)
POST /local-videos →  HTTP 202 Accepted (enqueue worker)
Redis queue yunicity-media-video
Worker ARQ → FFmpeg → R2 (processed.mp4, thumbnail.jpg)
GET /local-videos/{id}  →  polling processing_status jusqu'à published | failed
GET /local-videos/feed  →  vidéos status=published uniquement
CDN media.{env}.yunicity.city
```

Références : `docs/architecture/MEDIA-PLATFORM.md`, `docs/adr/ADR-VIDEO-03A-async-media-processing-worker.md`.

---

## Types (backend = référence)

### `LocalVideoStatus` (visibilité / lifecycle DB)

| Valeur | Description |
|--------|-------------|
| `processing` | Publish accepté ; worker en cours ou en attente |
| `published` | Traitement OK ; visible feed |
| `failed` | Traitement échoué après retries |
| `hidden` | Masqué admin |
| `deleted` | Soft delete |

### `LocalVideoProcessingStatus` (pipeline worker VIDEO-03A)

| Valeur | Description |
|--------|-------------|
| `uploaded` | Objet source présent ; job pas encore pris |
| `processing` | Worker FFmpeg actif |
| `ready` | Derivatives OK ; `status` → `published` |
| `failed` | Erreur définitive ; voir `processing_error` |

### `LocalVideoType`

`bon_plan` · `moment` · `quartier` · `lieu` · `tribu` · `autre`

---

## Endpoints

### `POST /local-videos/upload-init`

**Auth :** JWT citoyen · **Rate limit :** 10/h/user

**Request** (`LocalVideoUploadInitRequest`) :

```json
{
  "filename": "clip.mp4",
  "content_type": "video/mp4",
  "file_size_bytes": 1048576,
  "city": "Reims",
  "neighborhood_id": "uuid-optionnel",
  "organization_id": "uuid-optionnel"
}
```

**Response** `201` (`LocalVideoUploadInitResponse`) :

```json
{
  "upload_id": "uuid",
  "presigned_url": "https://…",
  "storage_key": "local-video/reims/{upload_id}/source.mp4",
  "expires_at": "2026-06-29T12:00:00Z",
  "upload_method": "PUT",
  "upload_headers": { "Content-Type": "video/mp4" }
}
```

**Erreurs :** `422` type/taille · `429` rate limit

---

### `PUT /local-videos/uploads/{upload_id}/binary` (dev filesystem uniquement)

Proxy API pour CI/dev sans R2. **404** si `LOCAL_VIDEO_STORAGE_BACKEND=r2`.

---

### `POST /local-videos` (publish)

**Auth :** JWT citoyen

**Request** (`LocalVideoPublishRequest`) :

```json
{
  "upload_id": "uuid",
  "city": "Reims",
  "neighborhood_id": "uuid",
  "video_type": "quartier",
  "title": "optionnel",
  "description": "optionnel",
  "cultural_place_id": null,
  "local_event_id": null,
  "tribe_id": null,
  "organization_id": null,
  "latitude": null,
  "longitude": null
}
```

**Response** `202 Accepted` (`LocalVideoPublishAcceptedResponse`) — **pas 201** :

```json
{
  "id": "uuid",
  "status": "processing",
  "processing_status": "uploaded",
  "job_id": "arq-job-id",
  "message": "Traitement vidéo en cours."
}
```

**Side effects :** HeadObject source · enqueue ARQ · pas de FFmpeg dans la requête HTTP.

**Erreurs :** `400` upload invalide · `404` upload inconnu · `409` déjà consommé

---

### `GET /local-videos/{id}`

**AuthZ :** `published` public · auteur voit `processing`/`failed` · admin · `hidden` → 404 public

**Response** `200` (`LocalVideoItem`) — inclut `processing_status`, `processing_error`, `media_url`, `thumbnail_url` (vides tant que non `published`).

**Polling client :** intervalle recommandé 2 s · timeout UX 180 s · voir smoke script.

---

### `GET /local-videos/feed`

**Query :** `cursor`, `limit` (max 20), `city`, `latitude`, `longitude` (opt-in proximité)

**Response :** `LocalVideoListResponse` — items `status=published` uniquement.

---

### Social

| Méthode | Path | Response |
|---------|------|----------|
| `POST` | `/{id}/like` | `LocalVideoLikeResponse` |
| `GET` | `/{id}/comments` | `LocalVideoCommentListResponse` |
| `POST` | `/{id}/comments` | `LocalVideoComment` |
| `POST` | `/{id}/report` | `204` |

---

## Storage keys (VIDEO-01B)

```
local-video/{city_slug}/{video_id}/source.{ext}
local-video/{city_slug}/{video_id}/processed.mp4
local-video/{city_slug}/{video_id}/thumbnail.jpg
```

Bucket par env : `yunicity-media-{env}` (voir `MEDIA-PLATFORM.md`).

URLs publiques feed : `{LOCAL_VIDEO_CDN_BASE_URL}/{storage_key}` → typiquement `processed.mp4` et `thumbnail.jpg`.

---

## Types frontend (`packages/types`)

Fichier : `frontend/packages/types/src/local-video.ts`

| Champ backend | Présent types TS | Note VIDEO-04A |
|---------------|------------------|----------------|
| `LocalVideoFeedItem` | ✅ | |
| `processing_status` | ❌ | À ajouter VIDEO-04A |
| `LocalVideoPublishAcceptedResponse` | ❌ | À ajouter VIDEO-04A |
| `processing` dans `LocalVideoStatusId` | ⚠️ | Présent côté TS mais sémantique = worker ; aligner avec `processing_status` |

**Référence code backend :** `backend/app/schemas/local_video.py` — prioritaire sur TS tant que VIDEO-04A ouvert.

---

## Variables worker (publish async)

| Variable | Default | Rôle |
|----------|---------|------|
| `LOCAL_VIDEO_PROCESSING_JOB_TIMEOUT_SECONDS` | 600 | Timeout job ARQ |
| Queue Redis | `yunicity-media-video` | Nom fixe code |
| Worker | `arq workers.video_worker.WorkerSettings` | Container séparé (INFRA-03) |

---

## Références

| Document | Rôle |
|----------|------|
| `docs/prd/PRD-CREATORS-V2-local-video.md` | Spec produit |
| `docs/architecture/ADR-CREATORS-V2-local-video-media.md` | ADR stockage + FFmpeg |
| `docs/adr/ADR-VIDEO-03A-async-media-processing-worker.md` | Worker IMPLEMENTED |
| `docs/qa/MEDIA-INFRA-V1-smoke-test.md` | Validation recette |
| `docs/ops/INFRA-03-railway-video-worker-setup.md` | Déploiement worker |
