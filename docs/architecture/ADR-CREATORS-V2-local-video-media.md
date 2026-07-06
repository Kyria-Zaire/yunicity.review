# ADR-CREATORS-V2 — Local Video Media Pipeline

| Champ | Valeur |
|-------|--------|
| Statut | **APPROVED** — aligné DESIGN-CREATORS-V2 · sync VIDEO-DOCS-SYNC-01 |
| Date | 2026-06-12 (mise à jour 2026-06-29) |
| PRD | `docs/prd/PRD-CREATORS-V2-local-video.md` |
| Décision | Stockage objet R2 + transcodage/thumbnail FFmpeg + CDN public |
| Conséquence | Nouveau pipeline distinct de Stories (local disk) et cultural media (URLs seed) |

---

## Contexte

Local Video V2 (PRD-CREATORS-V2) exige :

- Upload citoyen MP4/MOV (≤ 90 s pilote, ≤ 50 Mo)
- Stockage durable scalable
- Thumbnail automatique
- Lecture progressive dans un fil vertical web mobile-first
- URLs stables servies via CDN

**État actuel :**

| Pipeline | Implémentation | Limite |
|----------|----------------|--------|
| Stories | `StoryMediaService` → filesystem local `media_upload_dir` | Non scalable, pas CDN, éphémère |
| Avatar/bannière profil | Upload local similaire | Images seulement |
| Cultural places | URLs Wikimedia / seed | Pas UGC vidéo |
| Partner creator content | `media_url` string externe | Modéré org, pas vertical feed |

**Décision DISCOVER :** Local Video **ne prolonge pas Stories** — nouveau domaine `local_videos` + nouveau pipeline média.

---

## Décision

### 1. Stockage objet — Cloudflare R2

**Choix : Cloudflare R2** (compatible S3 API) plutôt que bucket local ou filesystem.

**Raisons :**

- Coût egress favorable vs S3 pur (bandwidth vidéo)
- API S3 standard → boto3 / aioboto3, migration possible vers AWS S3
- Intégration CDN Cloudflare native
- Aligné avec `cultural-media-strategy.md` (R2 prévu culturel)

**Structure des clés (VIDEO-01B — code actuel) :**

```
local-video/{city_slug}/{video_id}/source.{ext}
local-video/{city_slug}/{video_id}/processed.mp4
local-video/{city_slug}/{video_id}/thumbnail.jpg
```

`city_slug` résolu dynamiquement (`city_slug_resolver.py`). Cible long terme `media/video/...` : voir `docs/architecture/MEDIA-PLATFORM.md` §7.

**Buckets (MEDIA-PLATFORM / INFRA-01) :**

| Environnement | Bucket | Accès |
|---------------|--------|-------|
| dev | `yunicity-media-dev` | privé + CDN dev |
| recette | `yunicity-media-recette` | privé |
| preprod | `yunicity-media-preprod` | privé |
| prod | `yunicity-media-prod` | privé |

> Ancienne doc `yunicity-local-video-*` : **obsolète** — remplacée par bucket média unifié (MEDIA-INFRA-V1, PR merge infra).

**Pas de bucket public listing.** Lecture via CDN URL publique sur prefix contrôlé ou signed URLs courtes pour upload uniquement.

### 2. Upload — Presigned PUT (direct client → R2)

**Flux :**

```
1. Client → POST /local-videos/upload-init { content_type, size, filename }
2. API valide quota + MIME → génère storage_key + presigned PUT (TTL 15 min)
3. Client PUT binaire directement sur R2
4. Client → POST /local-videos { upload_id, metadata... }
5. API HeadObject → enqueue job Redis (ARQ) → **HTTP 202** (`processing_status=uploaded`)
6. Worker FFmpeg (container séparé) → processed.mp4 + thumbnail.jpg → update DB `published`
7. Client polling GET /local-videos/{id} jusqu'à `published` | `failed`
```

**Raisons presigned vs proxy upload :**

- Évite de faire transiter 50 Mo via FastAPI (mémoire, timeout, p95)
- Scalable pilote → prod
- Pattern industry standard

**Fallback dev sans R2 :** filesystem sous `media_upload_dir/local-video/` avec même interface `StorageBackend` — **dev only**, tests CI utilisent moto/minio container.

### 3. Traitement média — FFmpeg + ffprobe (worker async VIDEO-03A)

**Service :** `LocalVideoProcessingService` + worker ARQ (`workers/video_worker.py`) — **IMPLEMENTED** (PR #72).

**Étapes :**

| Étape | Outil | Output |
|-------|-------|--------|
| Probe | ffprobe | duration, codec, dimensions |
| Validate | règles métier | reject si > 60s ou codec dangereux |
| Transcode (si MOV/hevc) | ffmpeg | MP4 H.264 + AAC, max 1080p, `-movflags +faststart` |
| Thumbnail | ffmpeg `-ss 1 -vframes 1` | JPEG 720w, quality 85 |
| Upload derivatives | R2 put | `processed.mp4` + `thumbnail.jpg` |

**Déploiement FFmpeg :**

- Image worker (ou backend dev) inclut `ffmpeg` + `ffprobe`
- **Publish API :** aucun subprocess FFmpeg — traitement hors requête HTTP (ADR VIDEO-03A)
- CI : smoke `pilot_m00_seed_videos.py` avec polling worker
- Worker production : `docs/ops/INFRA-03-railway-video-worker-setup.md` (PR #73)

### 4. Delivery — CDN

**URLs publiques :**

```
https://media.{env}.yunicity.city/local-video/{city_slug}/{video_id}/processed.mp4
https://media.{env}.yunicity.city/local-video/{city_slug}/{video_id}/thumbnail.jpg
```

**Headers :**

```
Cache-Control: public, max-age=31536000, immutable
Content-Type: video/mp4 | image/jpeg
Accept-Ranges: bytes
```

**Player web :** `<video src={media_url} playsInline muted preload="metadata">` — pas HLS MVP.

### 5. Sécurité upload

| Contrôle | Détail |
|----------|--------|
| MIME whitelist | `video/mp4`, `video/quicktime` (MOV) |
| Magic bytes | ffprobe confirm |
| Taille max | 50 Mo presigned condition |
| Durée max | 90 s ffprobe |
| Rate limit | upload-init 10/h/user |
| Key layout | UUID paths — pas de filename user |
| Scan | hors MVP — hook futur ClamAV/Lambda |

### 6. Abstraction code

```python
# app/services/local_video/storage.py
class LocalVideoStorage(Protocol):
    async def create_presigned_upload(self, key: str, content_type: str, size: int) -> PresignedUpload: ...
    async def head_object(self, key: str) -> ObjectHead: ...
    async def public_url(self, key: str) -> str: ...

# Implementations:
# - R2LocalVideoStorage (prod)
# - FilesystemLocalVideoStorage (dev fallback)
```

```python
# app/services/local_video/processor.py
class LocalVideoMediaProcessor:
    async def process(self, source_key: str) -> ProcessResult:
        ...  # download to temp → ffprobe → transcode? → thumb → upload → cleanup
```

**Ne pas réutiliser** `StoryMediaService` directement — extraire utilitaires MIME/size si pertinent.

---

## Alternatives considérées

| Option | Rejet | Raison |
|--------|-------|--------|
| Filesystem comme Stories | ❌ | Non scalable, WEB-AUDIT-10 dette, pas CDN |
| Upload proxy via API | ❌ | p95, mémoire, timeout 50 Mo |
| HLS/DASH multi-bitrate | ❌ MVP | Complexité player ; MP4 progressive suffit pilote |
| Cloudinary / Mux SaaS | ❌ MVP | Coût + vendor lock ; R2 + FFmpeg suffisant |
| S3 AWS pur | ⚠️ fallback | R2 preferred egress ; API compatible |

---

## Conséquences

### Positives

- Pipeline scalable pilote → prod
- Séparation claire Stories / Local Video
- CDN + `faststart` = lecture mobile acceptable
- Thumbnail uniforme pour feed vertical + teasers futurs

### Négatives / coûts

- FFmpeg dans container backend (+~80–150 Mo image)
- Opérations R2 (credentials, CORS presigned, lifecycle)
- Temp files disk during transcode — nettoyage obligatoire
- Monitoring bande passante / storage quota

### Migration / coexistence

- **Stories** : aucun changement MVP
- **Cultural media R2** : bucket séparé ou prefix séparé — **ne pas mélanger** `local-video/` et `cultural-media/`
- **Partner creator content** : hors scope

---

## Configuration (.env.example)

```bash
# Local Video — R2 (S3-compatible)
LOCAL_VIDEO_R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
LOCAL_VIDEO_R2_ACCESS_KEY_ID=
LOCAL_VIDEO_R2_SECRET_ACCESS_KEY=
LOCAL_VIDEO_R2_BUCKET=yunicity-media-dev
LOCAL_VIDEO_CDN_BASE_URL=https://media.dev.yunicity.city
LOCAL_VIDEO_MAX_BYTES=52428800
LOCAL_VIDEO_MAX_DURATION_SECONDS=90
LOCAL_VIDEO_PRESIGNED_TTL_SECONDS=900
LOCAL_VIDEO_STORAGE_BACKEND=r2  # r2 | filesystem (dev)
```

---

## Plan d'implémentation (aligné sprints PRD)

| Phase | Livrable |
|-------|----------|
| C2-S1a | `LocalVideoStorage` R2 + filesystem fallback + tests moto |
| C2-S1b | presigned upload-init + HeadObject verify |
| C2-S1c | FFmpeg processor + thumbnail + transcode MOV |
| C2-S1d | DB `local_videos` + publish endpoint **202 async** |
| C2-S1e | Worker ARQ + polling (VIDEO-03A) ✅ |
| C2-S2 | Player consomme `media_url` CDN |
| C2-S4 | Metrics R2 + alertes quota |

---

## Critères d'acceptation ADR

- [ ] CTO valide R2 + FFmpeg in-container
- [ ] Infra recette : bucket + CDN + CORS presigned PUT from web origin
- [ ] Security review upload path (checklist §7 PRD)
- [ ] Dev fallback filesystem documenté pour contributors sans R2
- [ ] PRD §13 gate ADR coché

---

## Références

- PRD : `docs/prd/PRD-CREATORS-V2-local-video.md`
- Stories upload actuel : `backend/app/services/story_media_service.py`
- Stratégie média : `docs/architecture/cultural-media-strategy.md`
- Audit C1 (archivé) : `docs/_archive/creators/C1-B1-existing-audit-bmad.md`
- API : `docs/api/LOCAL-VIDEO-API.md`
- Worker : `docs/adr/ADR-VIDEO-03A-async-media-processing-worker.md`

---

## Historique

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-06-12 | CTO | Proposition initiale post-DISCOVER |
| 2026-06-29 | VIDEO-DOCS-SYNC-01 | Clés VIDEO-01B, buckets `yunicity-media-*`, worker async VIDEO-03A |
