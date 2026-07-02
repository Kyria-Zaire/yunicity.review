# INFRA-R2-PROD — Setup média production (Local Video)

| Champ | Valeur |
|-------|--------|
| Feature | MEDIA-INFRA-V1 · FEATURE-CREATORS-V2 |
| Ticket | INFRA-R2-PROD-DOCS |
| Date provisionnement | **2026-07-02** |
| Exécuteur | Kyria (Cloudflare + Railway) |
| Validation | VIDEO-04BC-POST-SMOKE ✅ · upload iPhone `.mov` Founder ✅ |
| Architecture | `docs/architecture/MEDIA-PLATFORM.md` |
| Checklist recette (réf.) | `docs/ops/INFRA-01-cloudflare-setup-checklist.md` |

> **Document de référence ops** — décrit l’état **réel** provisionné en production.  
> Cursor ne crée ni ne modifie les ressources Cloudflare / Railway via ce ticket.

---

## 1. Contexte

Avant juillet 2026, l’API prod Railway (`powerful-abundance`) et le worker (`creative-commitment`) pointaient par erreur vers le bucket **recette** (`yunicity-media-recette`) et le CDN `media.recette.yunicity.city`, sans CORS R2 configuré — les uploads browser depuis `https://yunicity.city` échouaient (« Load failed »).

**Décision CTO (Option B)** : créer la vraie infra média prod plutôt que patcher recette.

---

## 2. État provisionné — Cloudflare R2

### 2.1 Bucket

| Paramètre | Valeur prod |
|-----------|-------------|
| **Nom** | `yunicity-media-prod` |
| **Région** | Europe de l’Ouest (**WEUR**) |
| Public access R2.dev | **Désactivé** |
| Listing public | **Interdit** |

### 2.2 Endpoint S3 (compte Cloudflare)

```
https://f41aa4460e2276b488759321f6db4083.r2.cloudflarestorage.com
```

*(Identique recette/preprod — seul le **nom de bucket** distingue l’environnement.)*

### 2.3 CORS (bucket `yunicity-media-prod`)

Configuration appliquée pour autoriser les uploads presigned depuis le web prod :

```json
[
  {
    "AllowedOrigins": [
      "https://yunicity.city",
      "https://www.yunicity.city"
    ],
    "AllowedMethods": [
      "PUT",
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": [
      "Content-Type",
      "Content-Length",
      "x-amz-*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

**Note :** si le dashboard Cloudflare refuse le pattern `x-amz-*`, fallback acceptable **headers only** (origines restent strictes) :

```json
"AllowedHeaders": ["Content-Type", "Content-Length", "*"]
```

**Test OPTIONS (post-config) :**

```bash
curl -s -i -X OPTIONS \
  "https://f41aa4460e2276b488759321f6db4083.r2.cloudflarestorage.com/yunicity-media-prod" \
  -H "Origin: https://yunicity.city" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: content-type"
```

Attendu : réponse CORS valide (pas `CORS not configured for this bucket`).

### 2.4 Token R2 prod

| Paramètre | Valeur |
|-----------|--------|
| **Nom token** | `yunicity-media-prod-backend` |
| Permission | Object Read & Write |
| Scope | **`yunicity-media-prod` uniquement** (least-privilege) |
| Secrets Railway | `LOCAL_VIDEO_R2_ACCESS_KEY_ID` · `LOCAL_VIDEO_R2_SECRET_ACCESS_KEY` |

**Interdit :** committer les clés · exposer côté frontend · réutiliser le token recette en prod.

---

## 3. CDN prod — custom domain

| Paramètre | Valeur |
|-----------|-------------|
| **Domaine** | `media.yunicity.city` |
| Bucket lié | `yunicity-media-prod` |
| Statut Cloudflare | **Actif** |
| TLS | **1.0+** (certificat Cloudflare) |
| Accès public CDN | **Activé** (lecture objets publiés via URLs `media_url` / `thumbnail_url`) |

**Format URLs publiques Local Video v1 :**

```
https://media.yunicity.city/local-video/reims/{video_id}/processed.mp4
https://media.yunicity.city/local-video/reims/{video_id}/thumbnail.jpg
```

**Vérification rapide :**

```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://media.yunicity.city/"
# Attendu : 403 ou 404 — pas de listing bucket
```

---

## 4. Railway production

### 4.1 Services concernés

| Service Railway | Rôle | URL publique |
|-----------------|------|--------------|
| `powerful-abundance` | API FastAPI + enqueue ARQ | `https://api.yunicity.city` |
| `creative-commitment` | Video worker FFmpeg | *(interne — pas de domaine)* |

Les **deux** services doivent partager le **même bloc** `LOCAL_VIDEO_*` R2/CDN.

### 4.2 Variables d’environnement (prod)

| Variable | Valeur prod |
|----------|-------------|
| `APP_ENV` | `prod` |
| `LOCAL_VIDEO_STORAGE_BACKEND` | `r2` |
| `LOCAL_VIDEO_R2_BUCKET` | `yunicity-media-prod` |
| `LOCAL_VIDEO_CDN_BASE_URL` | `https://media.yunicity.city` |
| `LOCAL_VIDEO_R2_ENDPOINT` | `https://f41aa4460e2276b488759321f6db4083.r2.cloudflarestorage.com` |
| `LOCAL_VIDEO_R2_ACCESS_KEY_ID` | *(secret — token `yunicity-media-prod-backend`)* |
| `LOCAL_VIDEO_R2_SECRET_ACCESS_KEY` | *(secret)* |
| `LOCAL_VIDEO_PRESIGNED_TTL_SECONDS` | `900` |
| `LOCAL_VIDEO_MAX_BYTES` | `52428800` |
| `LOCAL_VIDEO_MAX_DURATION_SECONDS` | `90` |

**API prod — variables complémentaires (inchangées, vérifier cohérence) :**

| Variable | Exemple prod |
|----------|--------------|
| `CORS_ORIGINS` | `https://yunicity.city,https://www.yunicity.city,https://admin.yunicity.city` |
| `WEB_FRONTEND_URL` | `https://yunicity.city` |

**Worker — obligatoires en plus du bloc R2 :**

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | Référence même Postgres prod que l’API |
| `REDIS_URL` | Référence même Redis prod que l’API |
| Commande | `arq workers.video_worker.WorkerSettings` |

Voir aussi : `docs/ops/INFRA-03-railway-video-worker-setup.md`.

### 4.3 Ordre de bascule (reproductible)

1. Cloudflare : bucket + CORS + custom domain + token prod
2. Test OPTIONS CORS (§2.3)
3. Railway : variables API `powerful-abundance`
4. Railway : variables worker `creative-commitment`
5. Redéployer API puis worker
6. Smoke test §5

---

## 5. Smoke test de validation

### 5.1 Validation Founder (référence 2026-07-02)

Upload réel depuis `https://yunicity.city/videos/new` :

| Critère | Résultat attendu | Validé |
|---------|------------------|--------|
| upload-init | HTTP **201** | ✅ |
| PUT presigned R2 | Succès (plus « Load failed ») | ✅ |
| publish | HTTP **202** | ✅ |
| worker | Job ARQ succès (~11 s) | ✅ |
| DB | `status=published`, URLs CDN prod | ✅ |
| Source | `.mov` iPhone accepté | ✅ |
| CDN | `media.yunicity.city` HEAD **200** | ✅ |

Vidéo de référence QA : **« Fête de la musique »** — `664524b2-ca5a-4ece-8a17-2afa293ccf80`.

Ticket QA : **VIDEO-04BC-POST-SMOKE** — CLOSED ✅.

### 5.2 Script automatisé (optionnel — GO CTO requis sur prod)

```bash
cd backend

# Windows PowerShell
$env:YUNICITY_API_BASE_URL="https://api.yunicity.city/api/v1"
python scripts/pilot_m00_seed_videos.py --smoke
```

Référence complète : `docs/qa/MEDIA-INFRA-V1-smoke-test.md`.

**Ne pas lancer `--smoke` sur prod sans GO CTO explicite** — le script crée utilisateur + vidéo test en DB.

### 5.3 Vérifications manuelles post-déploiement

- [ ] DevTools Network : `presigned_url` contient `yunicity-media-prod`
- [ ] `media_url` / `thumbnail_url` préfixe `https://media.yunicity.city/`
- [ ] Objet `source.mov` ou `source.mp4` + `processed.mp4` + `thumbnail.jpg` dans bucket prod
- [ ] Logs worker : `process_local_video_job` → succès (●)
- [ ] Aucun secret R2 dans réponses API / bundle frontend

---

## 6. Séparation recette / prod (état effectif)

| Env | Bucket | CDN | API Railway | Worker Railway |
|-----|--------|-----|-------------|----------------|
| **Recette** | `yunicity-media-recette` | `media.recette.yunicity.city` | *(service recette)* | *(service recette)* |
| **Prod** | `yunicity-media-prod` | `media.yunicity.city` | `powerful-abundance` | `creative-commitment` |

**Dette connue :** les vidéos créées avant la bascule (URLs `media.recette.yunicity.city`) ne sont **pas migrées** automatiquement — ticket dédié si nécessaire.

**Recette :** CORS bucket recette reste à configurer séparément si uploads browser depuis `recette.yunicity.city` requis (checklist INFRA-01 §5).

---

## 7. Rollback (urgence)

| Symptôme | Action |
|----------|--------|
| Upload prod cassé après changement infra | Rollback variables Railway (§7.1) |
| Token prod compromis | Révoquer `yunicity-media-prod-backend` · en créer un nouveau · mettre à jour Railway |
| CDN prod down | Désactiver custom domain `media.yunicity.city` (Cloudflare) — URLs media 404 |
| Bucket prod corrompu | **Ne pas supprimer** — export inventaire + incident ops |

### 7.1 Rollback Railway — retour vars recette (urgence uniquement)

> ⚠️ **Non viable long terme** — recette n’a pas CORS prod ; ce rollback restaure un état connu mais **ne rétablit pas** l’upload browser prod.

Sur **`powerful-abundance`** et **`creative-commitment`**, repasser temporairement :

```bash
LOCAL_VIDEO_R2_BUCKET=yunicity-media-recette
LOCAL_VIDEO_CDN_BASE_URL=https://media.recette.yunicity.city
LOCAL_VIDEO_R2_ACCESS_KEY_ID=<token recette>
LOCAL_VIDEO_R2_SECRET_ACCESS_KEY=<secret recette>
```

Puis redéployer API + worker. Documenter timestamp + incident dans canal ops.

### 7.2 Interdictions rollback

- Ne pas supprimer `yunicity-media-prod` sans export inventaire
- Ne pas committer les secrets révoqués
- Ne pas désactiver le worker sans plan (vidéos bloquées en `processing`)

---

## 8. Références

| Document | Rôle |
|----------|------|
| `docs/architecture/MEDIA-PLATFORM.md` | Architecture multi-env + conventions |
| `docs/ops/INFRA-01-cloudflare-setup-checklist.md` | Template provisionnement recette |
| `docs/ops/INFRA-03-railway-video-worker-setup.md` | Worker ARQ Railway |
| `docs/qa/MEDIA-INFRA-V1-smoke-test.md` | Script smoke + exit codes |
| `docs/api/LOCAL-VIDEO-API.md` | Contrats upload-init / publish |
| `backend/scripts/pilot_m00_seed_videos.py` | Smoke automatisé |

---

## 9. Historique

| Date | Événement |
|------|-----------|
| 2026-07-01 | Diagnostic prod : upload-init OK · PUT R2 échoue (CORS absent · bucket recette) |
| 2026-07-02 | Provisionnement `yunicity-media-prod` + CORS + CDN + vars Railway prod |
| 2026-07-02 | VIDEO-04BC-POST-SMOKE GO · iPhone `.mov` validé Founder |
| 2026-07-02 | INFRA-R2-PROD-DOCS — formalisation repo |
