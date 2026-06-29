# MEDIA-INFRA-V1 — Smoke test R2 recette

| Champ | Valeur |
|-------|--------|
| Feature | MEDIA-INFRA-V1 |
| Ticket | INFRA-01 |
| Script | `backend/scripts/pilot_m00_seed_videos.py` |
| Checklist infra | `docs/ops/INFRA-01-cloudflare-setup-checklist.md` |

---

## 1. Objectif

Valider bout-en-bout que le backend recette :

1. Génère des presigned URLs R2
2. Reçoit l’upload binaire
3. Publie et traite une vidéo (FFmpeg sync)
4. Écrit `source`, `processed.mp4`, `thumbnail.jpg` dans `yunicity-media-recette`
5. Expose des URLs CDN jouables

---

## 2. Préconditions

| # | Prérequis | Vérification |
|---|-----------|--------------|
| 1 | Bucket `yunicity-media-recette` créé | Cloudflare R2 dashboard |
| 2 | Custom domain `media.recette.yunicity.city` actif | HTTPS OK |
| 3 | Token R2 injecté Railway (pas git) | Variables §7 checklist INFRA-01 |
| 4 | API recette déployée `APP_ENV=recette` | Health check |
| 5 | `LOCAL_VIDEO_STORAGE_BACKEND=r2` | Startup sans erreur storage |
| 6 | `ffmpeg` + `ffprobe` dans container | `docker exec … which ffmpeg` |
| 7 | Fichier test présent | `backend/data/e2e-test-video.mp4` |
| 8 | DB recette seedée (quartiers Reims) | Quartier `d6010000-0000-4000-8000-000000000001` |
| 9 | Accès réseau vers API recette | VPN / IP allowlist si applicable |

---

## 3. Modes d’exécution

### 3.1 Smoke test infra (recommandé INFRA-01)

Une vidéo, validation CDN, **nettoyage storage par défaut** (R2 ou filesystem si env disponible).

```bash
cd backend

# Windows PowerShell — cleanup storage auto (défaut)
$env:YUNICITY_API_BASE_URL="https://api.recette.yunicity.city/api/v1"
python scripts/pilot_m00_seed_videos.py --smoke

# Conserver les objets R2 (debug)
python scripts/pilot_m00_seed_videos.py --smoke --leave-artifacts

# Sans upload/publish (health + upload-init seulement)
python scripts/pilot_m00_seed_videos.py --dry-run-safe
```

**Cleanup storage** : le script supprime `source.*`, `processed.mp4`, `thumbnail.jpg` via boto3 (`LOCAL_VIDEO_R2_*`) ou filesystem (`MEDIA_UPLOAD_DIR`).

**Cleanup DB (limitation)** : les lignes `local_videos`, `local_video_uploads` et l’utilisateur test `pilot-m00-*@example.com` **peuvent rester** — il n’existe **pas** d’API publique `DELETE /local-videos/{id}`. Voir `manual_db_cleanup` dans le JSON de sortie pour les IDs à traiter manuellement si besoin.

### Prod safety (Railway / api.yunicity.city)

| Mode | Storage | DB |
|------|---------|-----|
| `--dry-run-safe` | Aucun objet | 1 user + 1 upload pending |
| `--smoke` (défaut) | Cleanup auto après succès | 1 user + 1 vidéo publiée |
| `--smoke --leave-artifacts` | Objets conservés | Idem |

**Ne pas lancer `--smoke` sur prod sans GO CTO.**

### 3.2 Pilote M-00 complet (local ou recette)

Deux vidéos (lieu + événement) + vérification feed :

```bash
YUNICITY_API_BASE_URL=https://api.recette.yunicity.city/api/v1 \
  python scripts/pilot_m00_seed_videos.py
```

### 3.3 Dev local (filesystem)

```bash
# API locale sur :8000, backend filesystem (default)
python scripts/pilot_m00_seed_videos.py --smoke
```

---

## 4. Résultats attendus (mode `--smoke`)

### Sortie JSON (exemple)

```json
{
  "mode": "smoke",
  "api_base": "https://api.recette.yunicity.city/api/v1",
  "video": {
    "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "status": "published",
    "storage_key": "local-video/reims/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/processed.mp4",
    "media_url": "https://media.recette.yunicity.city/local-video/reims/.../processed.mp4",
    "thumbnail_url": "https://media.recette.yunicity.city/local-video/reims/.../thumbnail.jpg",
    "upload_storage_key": "local-video/reims/.../source.mp4"
  },
  "cdn_checks": {
    "media_url_http_status": 200,
    "thumbnail_url_http_status": 200
  }
}
```

### Exit codes

| Code | Signification |
|------|---------------|
| `0` | GO — publish + CDN OK |
| `1` | Fichier vidéo test manquant |
| `2` | Vidéo non `published` |
| `3` | URL CDN media ou thumbnail non accessible |
| `4` | Erreur HTTP API (init/upload/publish) |

---

## 5. Vérifications API

| Étape | Endpoint | Attendu |
|-------|----------|---------|
| Register | `POST /auth/register` | 201 + `access_token` |
| Upload init | `POST /local-videos/upload-init` | 201 ; `presigned_url` = URL R2 (pas `/binary`) |
| Upload binaire | `PUT {presigned_url}` | 200/204 |
| Publish | `POST /local-videos` | 201 ; `status=published` |
| Get video | `GET /local-videos/{id}` | 200 ; `media_url` + `thumbnail_url` non vides |

### Headers presigned

Le client PUT doit envoyer :

```
Content-Type: video/mp4
```

Taille réelle ≤ `file_size_bytes` déclaré à upload-init.

---

## 6. Vérifications bucket R2

Dans Cloudflare R2 → `yunicity-media-recette` → Browse, après smoke test :

```
local-video/reims/{video_id}/source.mp4
local-video/reims/{video_id}/processed.mp4
local-video/reims/{video_id}/thumbnail.jpg
```

| Objet | Présence |
|-------|----------|
| `source.mp4` | ✅ (upload initial) |
| `processed.mp4` | ✅ (post-FFmpeg) |
| `thumbnail.jpg` | ✅ |

---

## 7. Vérifications CDN

1. Ouvrir `media_url` dans navigateur — lecture vidéo
2. Ouvrir `thumbnail_url` — image JPEG
3. DevTools → Network : **aucun header `Authorization` R2** ; pas de secret dans réponse
4. Confirmer domaine `media.recette.yunicity.city` (pas endpoint R2 brut exposé au client feed)

---

## 8. Vérifications sécurité

- [ ] `presigned_url` expire après 15 min (non réutilisable)
- [ ] Frontend / script ne contient pas `LOCAL_VIDEO_R2_SECRET_ACCESS_KEY`
- [ ] Réponses API ne contiennent pas les credentials R2
- [ ] Listing bucket public impossible

---

## 9. Critères GO / NO-GO

### GO opérationnel recette

- [ ] `--smoke` exit code 0
- [ ] 3 objets présents dans bucket
- [ ] CDN 200 sur media + thumbnail
- [ ] Vidéo lisible navigateur
- [ ] Aucun secret exposé

### NO-GO

| Symptôme | Cause probable |
|----------|----------------|
| `presigned_url` contient `/binary` | `LOCAL_VIDEO_STORAGE_BACKEND` encore `filesystem` |
| PUT 403 | CORS ou signature presigned / Content-Length |
| Publish `failed` | ffmpeg absent ou média invalide |
| CDN 404 | Custom domain non mappé ou clé incorrecte |
| Startup crash | Vars R2/CDN manquantes |

---

## 10. Rollback test

1. Railway : repasser `LOCAL_VIDEO_STORAGE_BACKEND=filesystem`
2. Redéployer — API démarre
3. `--smoke` local fonctionne via `/binary`
4. Documenter dans canal ops

---

## 11. Références

- `docs/architecture/MEDIA-PLATFORM.md`
- `docs/ops/INFRA-01-cloudflare-setup-checklist.md`
- `docs/ops/VIDEO-01-media-storage-readiness.md`
- `docs/ops/MEDIA-MONITORING-SPEC.md`
