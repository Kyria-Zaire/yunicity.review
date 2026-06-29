# MEDIA-MONITORING-SPEC — KPIs et alertes fondation média

| Champ | Valeur |
|-------|--------|
| Feature | MEDIA-INFRA-V1 |
| Ticket | INFRA-01 |
| Architecture | `docs/architecture/MEDIA-PLATFORM.md` |

---

## 1. Objectif

Définir les métriques minimales pour piloter le stockage R2, le CDN, les uploads et le processing média — sans implémentation code dans INFRA-01.

---

## 2. KPIs

### 2.1 `media_objects_total`

| Attribut | Valeur |
|----------|--------|
| **Définition** | Nombre total d’objets dans le bucket média de l’environnement |
| **Source possible** | Cloudflare R2 analytics ; script inventaire S3 ListObjects ; métrique app `media/monitoring/` (futur) |
| **Warning** | Croissance > 20 % / semaine sans lancement produit associé |
| **Critical** | Croissance > 50 % / semaine ou > 500k objets (ajuster selon plan R2) |
| **Fréquence** | Quotidienne |
| **Action** | Auditer objets orphelins ; vérifier boucles upload ; revue rétention |

---

### 2.2 `media_storage_bytes_total`

| Attribut | Valeur |
|----------|--------|
| **Définition** | Taille totale stockée (bytes) dans le bucket |
| **Source possible** | R2 dashboard ; API Cloudflare GraphQL ; agrégation DB `file_size_bytes` par pipeline |
| **Warning** | > 80 % du quota/budget mensuel prévu |
| **Critical** | > 95 % quota ou croissance > 30 % / 7 j |
| **Fréquence** | Quotidienne |
| **Action** | Purge objets orphelins ; accélérer job rétention 30 j ; revue compression vidéo |

---

### 2.3 `media_average_size_bytes`

| Attribut | Valeur |
|----------|--------|
| **Définition** | `media_storage_bytes_total / media_objects_total` (objets > 0) |
| **Source possible** | Calcul dérivé ; échantillon audit S3 |
| **Warning** | Moyenne > 40 Mo (vidéos) ou > 2 Mo (images seules) hors pic attendu |
| **Critical** | Moyenne > 48 Mo (proche limite 50 Mo Local Video) de façon soutenue |
| **Fréquence** | Hebdomadaire |
| **Action** | Vérifier validation taille ; abus upload ; ajuster limites |

---

### 2.4 `media_upload_failures_total`

| Attribut | Valeur |
|----------|--------|
| **Définition** | Compteur d’échecs upload (presigned PUT 4xx/5xx, timeout, size mismatch, upload-init rejeté) |
| **Source possible** | Logs API (`LOCAL_VIDEO_*` codes) ; Redis rate limit hits ; R2 access logs |
| **Warning** | > 5 % des upload-init sur 1 h |
| **Critical** | > 15 % sur 1 h ou spike > 50 échecs / 15 min |
| **Fréquence** | Temps réel (alerte) + rapport quotidien |
| **Action** | Vérifier CORS, TTL presigned, credentials R2, latence CDN |

---

### 2.5 `media_processing_failures_total`

| Attribut | Valeur |
|----------|--------|
| **Définition** | Vidéos/images en statut `failed` après publish/processing (FFmpeg, ffprobe, transcode) |
| **Source possible** | DB `LocalVideo.status=failed` ; logs worker ARQ (`local_video_processing_failed`, `local_video_job_exhausted`) |
| **Warning** | > 3 % des publish sur 24 h |
| **Critical** | > 10 % sur 24 h ou ffmpeg indisponible (503 `LOCAL_VIDEO_PROCESSING_UNAVAILABLE`) |
| **Fréquence** | Temps réel + quotidien |
| **Action** | Vérifier ffmpeg container ; formats abusifs ; disk temp ; scale worker |

---

### 2.6 `media_processing_duration_seconds_avg`

| Attribut | Valeur |
|----------|--------|
| **Définition** | Durée moyenne enqueue → `published` (worker FFmpeg, hors requête HTTP) |
| **Source possible** | Logs structurés `local_video_processing_ready.elapsed_ms` ; métrique queue ARQ |
| **Warning** | p95 > 60 s |
| **Critical** | p95 > 180 s ou worker down / queue depth > seuil |
| **Fréquence** | Continue (recette+) |
| **Action** | Scale worker CPU ; vérifier ffmpeg ; profondeur queue Redis |

---

### 2.7 `media_orphan_objects_total`

| Attribut | Valeur |
|----------|--------|
| **Définition** | Objets R2 sans référence DB (upload expiré, publish abandonné, soft delete > 30 j non purgé) |
| **Source possible** | Job audit : ListObjects vs clés DB ; métrique `local_video_uploads` expirés |
| **Warning** | > 100 orphelins ou > 5 Go stockage orphelin |
| **Critical** | > 1000 orphelins ou > 50 Go |
| **Fréquence** | Hebdomadaire |
| **Action** | Job purge ; raccourcir TTL upload ; alerte abus |

---

### 2.8 `media_estimated_monthly_cost`

| Attribut | Valeur |
|----------|--------|
| **Définition** | Estimation USD/EUR mensuelle R2 (storage + Class A/B ops) + CDN egress |
| **Source possible** | Cloudflare billing dashboard ; formule : `(Go stockés × tarif R2) + (requêtes × tarif) + (egress CDN)` |
| **Warning** | > budget mensuel défini (ex. 50 € recette, 200 € prod MVP) |
| **Critical** | > 150 % budget ou spike egress > 3× baseline |
| **Fréquence** | Quotidienne (estimation) ; facturation mensuelle réelle |
| **Action** | Cache CDN ; compression ; purge orphelins ; revue abus |

---

## 3. Monitoring pilote (recette)

Période : premiers 30 jours post-provisionnement `yunicity-media-recette`.

| Activité | Responsable | Outil |
|----------|-------------|-------|
| Smoke test initial | Kyria | `pilot_m00_seed_videos.py --smoke` |
| Inventaire bucket hebdo | Kyria | R2 dashboard / aws s3 ls |
| Revue logs publish | Dev | Railway logs |
| Coût R2 | Kyria | Cloudflare billing |
| Feed vidéo recette | QA | `/videos` manuel |

Seuils assouplis en pilote : warning-only sauf indisponibilité totale CDN.

---

## 4. Monitoring production

| Exigence | Détail |
|----------|--------|
| Dashboard | Cloudflare + métriques app agrégées |
| Alertes Pager/email | Critical KPIs ci-dessus |
| SLO publish | p95 processing < 5 s *(nécessite worker async VIDEO-03A)* |
| Audit sécurité | Revue trimestrielle tokens R2 + CORS |
| Backup policy | R2 versioning ou export cold storage (décision CTO) |

**NO-GO prod public** tant que worker async + magic bytes non livrés (cf. VIDEO-01).

---

## 5. Alertes coût

| Alerte | Condition | Action |
|--------|-----------|--------|
| Budget R2 80 % | `media_estimated_monthly_cost` | Revue stockage ; purge orphelins |
| Egress CDN spike | > 3× baseline 24 h | Vérifier hotlinking ; Cache-Control |
| Ops Class A spike | Upload massif bot | Rate limits ; WAF |

---

## 6. Alertes sécurité

| Alerte | Condition | Action |
|--------|-----------|--------|
| Token R2 utilisé hors IP attendue | Cloudflare audit (si dispo) | Rotation clés |
| Bucket policy public | Scan config | Fermer accès public immédiat |
| Presigned URL leak | Log partage URL > TTL | Révoquer objet ; investiguer |
| CORS `*` détecté | Audit config bucket | Restreindre origines |

---

## 7. Alertes processing

| Alerte | Condition | Action |
|--------|-----------|--------|
| FFmpeg down | 503 `LOCAL_VIDEO_PROCESSING_UNAVAILABLE` | Redéployer container ; vérifier Dockerfile |
| Failed rate spike | `media_processing_failures_total` critical | Sample logs ; format abuse |
| Queue depth (futur) | ARQ jobs > 100 | Scale worker |

---

## 8. Implémentation future

```
backend/app/services/media/monitoring/
  collectors.py    # R2 list, DB aggregates
  metrics.py       # Prometheus / structured logs
  alerts.py        # seuils warning/critical
```

Hors scope INFRA-01 — cette spec sert de contrat pour tickets ultérieurs.

---

## 9. Références

- `docs/architecture/MEDIA-PLATFORM.md`
- `docs/ops/INFRA-01-cloudflare-setup-checklist.md`
- `docs/adr/ADR-VIDEO-03A-async-media-processing-worker.md`
