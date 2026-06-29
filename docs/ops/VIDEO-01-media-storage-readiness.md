# VIDEO-01 — Media Storage R2/S3 Production Readiness

| Champ | Valeur |
|-------|--------|
| Feature | FEATURE-CREATORS-V2 — Local Video |
| Ticket | VIDEO-01 |
| Phase BMAD | BUILD |
| Date audit | 2026-06-18 |
| ADR | `docs/architecture/ADR-CREATORS-V2-local-video-media.md` |
| Verdict | **GO recette** (checklist infra + VIDEO-01B) · **NO-GO prod** (worker async + magic bytes + frontend upload) |
| Mise à jour | VIDEO-01B (2026-06-16) — city_slug dynamique, ADR worker async |

---

## 1. État actuel

### Ce qui marche (backend)

| Composant | Fichier(s) | Statut |
|-----------|------------|--------|
| Protocol storage + factory | `backend/app/services/local_video/storage.py` | ✅ |
| Filesystem dev/CI | `backend/app/services/local_video/filesystem_storage.py` | ✅ (corrigé VIDEO-01 : URLs sans double préfixe) |
| R2 S3-compatible | `backend/app/services/local_video/r2_storage.py` | ✅ (presigned PUT + ContentLength) |
| Upload-init presigned | `backend/app/api/v1/local_videos.py` | ✅ auth + rate limit 10/h |
| Publish + HeadObject | `backend/app/services/local_video_service.py` | ✅ |
| FFmpeg transcode + thumb | `backend/app/services/local_video/processor.py` | ✅ (sync in-process, Docker ffmpeg) |
| Limites MIME/taille/durée | `local_video_constants.py` + service + schema | ✅ |
| Policy + validation config | `backend/app/core/local_video_media_policy.py` | ✅ (VIDEO-01) |
| Startup check | `backend/app/main.py` lifespan | ✅ |
| Feed web (lecture) | `frontend/apps/web/components/videos/` | ✅ |
| Tests API | `backend/tests/test_local_videos_api.py` | ✅ |
| Tests storage | `backend/tests/test_local_video_storage.py` | ✅ (VIDEO-01) |

### Ce qui manque (hors scope VIDEO-01)

| Élément | Impact |
|---------|--------|
| Upload client web/mobile (presigned → R2 direct) | Prod bloquée côté UX |
| `city_slug` dynamique dans clés | ✅ VIDEO-01B — résolution territoriale |
| Worker async publish | ❌ **BLOQUANT prod** — ADR `docs/adr/ADR-VIDEO-03A-async-media-processing-worker.md` |
| Magic bytes explicites | ❌ **BLOQUANT prod** — hors scope VIDEO-01B |

---

## 2. Architecture stockage

### Flux dev (filesystem)

```
Client authentifié
  → POST /api/v1/local-videos/upload-init
  → PUT /api/v1/local-videos/uploads/{id}/binary  (proxy API, dev only)
  → POST /api/v1/local-videos  (publish)
  → FFmpeg in-process → processed.mp4 + thumbnail.jpg
  → URLs : {MEDIA_PUBLIC_BASE_URL}/media/local-video/{city_slug}/...
  → StaticFiles /media → MEDIA_UPLOAD_DIR
```

### Flux prod cible (R2)

```
Client authentifié
  → POST /api/v1/local-videos/upload-init
  → PUT presigned URL Cloudflare R2 (direct client → bucket, TTL 15 min)
  → POST /api/v1/local-videos  (publish)
  → HeadObject → FFmpeg → upload derivatives R2
  → URLs : {LOCAL_VIDEO_CDN_BASE_URL}/local-video/{city_slug}/...
  → CDN Cloudflare (domaine media.*)
```

### Layout des clés objet (VIDEO-01B)

```
local-video/{city_slug}/{video_id}/source.{ext}      # upload initial (presigned PUT)
local-video/{city_slug}/{video_id}/processed.mp4       # après transcode
local-video/{city_slug}/{video_id}/thumbnail.jpg       # miniature JPEG
```

`video_id` = identifiant de session upload (`upload_id`), réutilisé comme `LocalVideo.id` au publish.

### Résolution `city_slug`

Ordre de priorité (`backend/app/services/local_video/city_slug_resolver.py`) :

1. Ville fournie (`city` sur upload-init ou publish)
2. Ville du quartier (`Neighborhood.city`)
3. Ville de l'organisation (`Organization.city`)
4. **Dev / recette uniquement** : fallback `LOCAL_VIDEO_DEFAULT_CITY_SLUG` + warning log
5. **Preprod / prod** : erreur `LOCAL_VIDEO_CITY_SLUG_REQUIRED` si non résolu

Aucun hardcode `reims` dans le code applicatif — seule la variable d'environnement de fallback dev/recette peut valoir `reims`.

---

## 3. Variables d'environnement

### Média partagé (Stories + fallback)

| Variable | Obligatoire | Description | Exemple dev |
|----------|-------------|-------------|-------------|
| `MEDIA_UPLOAD_DIR` | dev | Racine fichiers statiques | `uploads` |
| `MEDIA_PUBLIC_BASE_URL` | oui | Base URL API pour `/media` en dev | `http://localhost:8000` |

### Local Video — limites

| Variable | Default | Description |
|----------|---------|-------------|
| `LOCAL_VIDEO_STORAGE_BACKEND` | `filesystem` | `filesystem` (dev/CI) ou `r2` (recette+) |
| `LOCAL_VIDEO_MAX_BYTES` | `52428800` | 50 Mo max |
| `LOCAL_VIDEO_MAX_DURATION_SECONDS` | `60` | Durée max (ffprobe) |
| `LOCAL_VIDEO_PRESIGNED_TTL_SECONDS` | `900` | TTL presigned PUT (15 min) |
| `LOCAL_VIDEO_DEFAULT_CITY_SLUG` | `reims` | Fallback dev/recette si territoire absent à upload-init |

### Local Video — R2 / S3-compatible

| Variable | Obligatoire si `r2` | Description |
|----------|---------------------|-------------|
| `LOCAL_VIDEO_R2_ENDPOINT` | oui | URL API S3 R2 | `https://<account_id>.r2.cloudflarestorage.com` |
| `LOCAL_VIDEO_R2_ACCESS_KEY_ID` | oui | Access key R2 | *(secret manager)* |
| `LOCAL_VIDEO_R2_SECRET_ACCESS_KEY` | oui | Secret key R2 | *(secret manager)* |
| `LOCAL_VIDEO_R2_BUCKET` | oui | Nom bucket | `yunicity-local-video-recette` |
| `LOCAL_VIDEO_CDN_BASE_URL` | recette/preprod/prod | URL publique CDN (sans trailing slash) | `https://media.recette.yunicity.fr` |

**Region** : non applicable R2 — boto3 utilise `region_name="auto"` (hardcodé `r2_storage.py`).

**Pas de secrets frontend** : les clés R2 restent backend-only. Le client reçoit uniquement l'URL presigned éphémère.

### Buckets recommandés (ADR — création manuelle CTO)

| Env | Bucket suggéré |
|-----|----------------|
| dev | `yunicity-local-video-dev` |
| recette | `yunicity-local-video-recette` |
| preprod | `yunicity-local-video-preprod` |
| prod | `yunicity-local-video-prod` |

---

## 4. Sécurité — audit

| Contrôle | Implémentation | Verdict |
|----------|----------------|---------|
| Upload public non contrôlé | `upload-init` exige auth JWT ; publish exige auth + ownership | ✅ |
| Endpoint binary dev sans auth | UUID v4 difficile à deviner ; **dev/CI only** ; 404 si `r2` | ⚠️ dev only |
| MIME whitelist | `video/mp4`, `video/quicktime` — schema + service | ✅ |
| Extensions | `.mp4`, `.mov` via `EXTENSION_BY_LOCAL_VIDEO_MIME` | ✅ |
| Taille max | Schema (50 Mo const) + service (settings) + HeadObject publish + R2 presigned ContentLength | ✅ |
| Durée max | ffprobe à publish, tolérance +0.5 s | ✅ |
| URLs signées upload | Presigned PUT TTL 15 min, Content-Type + ContentLength | ✅ |
| URLs publiques lecture | CDN public immutable (pas de listing bucket) | ⚠️ infra à configurer |
| Secrets hardcodés | Aucun dans le code — env only | ✅ |
| Rate limit upload-init | 10/h/user (Redis) | ✅ |
| Rate limit publish | 20/jour/user | ✅ |
| Path traversal | `..` strippé dans filesystem adapter | ✅ |
| ffmpeg subprocess | Timeout 30s probe / 120s transcode / 60s thumb | ✅ |
| filesystem en prod | **Interdit** — `validate_local_video_storage_config` | ✅ |

### Risques résiduels

1. **Pas de magic bytes** avant ffprobe — un fichier non-vidéo renommé échoue au probe (acceptable MVP).
2. **Publish synchrone** — timeout HTTP possible sur gros MOV.
3. **Frontend upload absent** — recette prod-like impossible sans script/curl.
4. **CDN CORS** — à configurer pour `<video src>` cross-origin si CDN ≠ API domain.

---

## 5. URLs `media_url` / `thumbnail_url`

| Backend | Formule |
|---------|---------|
| filesystem | `{LOCAL_VIDEO_CDN_BASE_URL ou MEDIA_PUBLIC_BASE_URL}/media/{storage_key}` |
| r2 | `{LOCAL_VIDEO_CDN_BASE_URL}/{storage_key}` |

Exemple recette :

```
https://media.recette.yunicity.fr/local-video/reims/{video_id}/processed.mp4
https://media.recette.yunicity.fr/local-video/reims/{video_id}/thumbnail.jpg
```

Property config : `Settings.local_video_public_base_url` → CDN si défini, sinon `MEDIA_PUBLIC_BASE_URL`.

---

## 6. Thumbnails & FFmpeg

| Étape | Outil | Output |
|-------|-------|--------|
| Probe durée | ffprobe | reject si > max |
| Transcode MOV | ffmpeg H.264/AAC, max 1080p, faststart | `processed.mp4` |
| Thumbnail | ffmpeg `-ss 1 -vframes 1 -vf scale=720:-2` | `thumbnail.jpg` image/jpeg |

Les derivatives sont ré-uploadés via `storage.upload_file()` — **compatible R2 et filesystem**.

Prérequis Docker : `ffmpeg` installé (`backend/Dockerfile` ligne apt).

---

## 7. Plan R2 prod (infra — sans exécution auto)

### Phase A — Recette (GO conditionnel)

1. **CTO** : créer bucket `yunicity-local-video-recette` (privé, pas de public access).
2. Créer token R2 scoped (Object Read & Write sur prefix `local-video/`).
3. Configurer custom domain CDN `media.recette.yunicity.fr` → bucket prefix.
4. Injecter secrets via Railway / secret manager (jamais git).
5. Variables :

```bash
LOCAL_VIDEO_STORAGE_BACKEND=r2
LOCAL_VIDEO_CDN_BASE_URL=https://media.recette.yunicity.fr
LOCAL_VIDEO_R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
LOCAL_VIDEO_R2_BUCKET=yunicity-local-video-recette
LOCAL_VIDEO_R2_ACCESS_KEY_ID=<secret>
LOCAL_VIDEO_R2_SECRET_ACCESS_KEY=<secret>
LOCAL_VIDEO_MAX_BYTES=52428800
LOCAL_VIDEO_MAX_DURATION_SECONDS=60
```

6. Smoke test script : `backend/scripts/pilot_m00_seed_videos.py` (adapter env recette).
7. Vérifier HeadObject + publish + URLs CDN jouables dans navigateur.

### Phase B — Preprod / Prod

- Répéter avec buckets dédiés.
- `APP_ENV=prod` → filesystem **refusé** au démarrage.
- Monitoring quota R2 + alertes (C2-S4 futur).

---

## 8. Checklist recette / prod

### Recette (GO bucket — VIDEO-01B)

- [x] Hardcode `reims` supprimé du code (VIDEO-01B)
- [x] `city_slug` résolu dynamiquement (VIDEO-01B)
- [x] Tests clés multi-villes (reims, paris, lyon)
- [ ] Bucket R2 `yunicity-local-video-recette` créé (CTO)
- [ ] Token R2 least-privilege (prefix `local-video/`)
- [ ] `LOCAL_VIDEO_CDN_BASE_URL` configuré
- [ ] Toutes vars R2 injectées (pas dans git)
- [ ] API démarre sans erreur `LOCAL_VIDEO_*_MISCONFIGURED`
- [ ] Upload-init retourne URL R2 (pas `/binary`)
- [ ] PUT presigned réussit (curl ou script pilot)
- [ ] Publish → `media_url` + `thumbnail_url` CDN accessibles
- [ ] Feed web `/videos` lit la vidéo
- [ ] Rejet MIME invalide (422)
- [ ] Rejet taille > 50 Mo (400)
- [ ] ffmpeg présent dans container

### Prod (NO-GO jusqu'à)

- [ ] Worker async (ADR VIDEO-03A implémentée)
- [ ] Magic bytes validation
- [ ] Frontend upload client livré
- [ ] Review sécurité zone rouge (uploads)
- [ ] Bucket prod séparé + CDN prod + Cache-Control immutable
- [ ] Rollback testé (voir §9)

---

## 9. Rollback

| Scénario | Action |
|----------|--------|
| R2 indisponible | Repasser `LOCAL_VIDEO_STORAGE_BACKEND=filesystem` **uniquement dev/recette test** ; prod = désactiver feature feed |
| CDN cassé | URLs pointent vers API `/media` temporairement (non recommandé prod) |
| FFmpeg échec massif | Vidéos restent `status=failed` ; pas de corruption bucket |
| Mauvaise config secrets | API refuse démarrage (`LOCAL_VIDEO_R2_MISCONFIGURED`) — corriger env + redeploy |
| Bucket compromis | Révoquer token R2, rotation clés, audit objets prefix |

**Rollback code** : revert commit VIDEO-01 ; pas de migration DB impactée.

---

## 10. Fichiers audités / modifiés (VIDEO-01 + VIDEO-01B)

### Audités

| Fichier |
|---------|
| `backend/app/services/local_video/storage.py` |
| `backend/app/services/local_video/filesystem_storage.py` |
| `backend/app/services/local_video/r2_storage.py` |
| `backend/app/services/local_video/processor.py` |
| `backend/app/services/local_video_service.py` |
| `backend/app/api/v1/local_videos.py` |
| `backend/app/schemas/local_video.py` |
| `backend/app/core/local_video_constants.py` |
| `backend/app/core/config.py` |
| `backend/app/main.py` |
| `backend/Dockerfile` |
| `backend/.env.example` |
| `backend/tests/test_local_videos_api.py` |
| `backend/scripts/pilot_m00_seed_videos.py` |
| `docs/architecture/ADR-CREATORS-V2-local-video-media.md` |

### Modifiés (VIDEO-01)

| Fichier | Changement |
|---------|------------|
| `backend/app/core/local_video_media_policy.py` | **NEW** — validation MIME/taille + config storage |
| `backend/app/services/local_video/filesystem_storage.py` | Fix chemin/URL public ; ContentLength param |
| `backend/app/services/local_video/r2_storage.py` | Presigned ContentLength |
| `backend/app/services/local_video/storage.py` | Protocol ContentLength |
| `backend/app/services/local_video_service.py` | Passe file_size à presigned |
| `backend/app/main.py` | Validation config au startup |
| `backend/tests/test_local_video_storage.py` | **NEW** — tests unitaires storage/policy |
| `backend/tests/test_local_videos_api.py` | Test binary 404 en mode r2 |
| `backend/.env.example` | Commentaires R2/CDN |
| `docs/ops/VIDEO-01-media-storage-readiness.md` | **NEW** — ce document |

### Modifiés (VIDEO-01B)

| Fichier | Changement |
|---------|------------|
| `backend/app/services/local_video/storage_keys.py` | **NEW** — layout clés unifié |
| `backend/app/services/local_video/city_slug_resolver.py` | **NEW** — résolution territoriale |
| `backend/app/services/local_video/storage.py` | Protocol sans hardcode env/reims |
| `backend/app/services/local_video/filesystem_storage.py` | Clés city-scoped |
| `backend/app/services/local_video/r2_storage.py` | Clés city-scoped |
| `backend/app/services/local_video/processor.py` | `processed.mp4` / `thumbnail.jpg` |
| `backend/app/services/local_video_service.py` | Résolution slug init + publish |
| `backend/app/schemas/local_video.py` | Champs optionnels upload-init |
| `backend/app/core/config.py` | `LOCAL_VIDEO_DEFAULT_CITY_SLUG` |
| `backend/tests/test_local_video_city_slug.py` | **NEW** — tests VIDEO-01B |
| `backend/tests/test_local_video_storage.py` | Clés mises à jour |
| `docs/adr/ADR-VIDEO-03A-async-media-processing-worker.md` | **NEW** — ADR worker async |

---

## 11. Tests lancés

```bash
cd backend
pytest tests/test_local_video_storage.py tests/test_local_video_city_slug.py -q
pytest tests/test_local_videos_api.py -q
ruff check app/services/local_video/ app/services/local_video_service.py
mypy app/services/local_video/ app/services/local_video_service.py
```

---

## 12. Recommandation GO / NO-GO

| Environnement | Verdict | Condition |
|---------------|---------|-----------|
| **dev** | **GO** | `filesystem` default, ffmpeg local/Docker |
| **recette** | **GO** | VIDEO-01B validé ; bucket + CDN + secrets CTO |
| **preprod** | **NO-GO** | Worker async + magic bytes |
| **prod** | **NO-GO** | Worker async + magic bytes + frontend upload |

**Prochaine étape CTO** : **GO création bucket `yunicity-local-video-recette`** après merge VIDEO-01B → smoke `pilot_m00_seed_videos.py` contre R2 → activer CDN.
