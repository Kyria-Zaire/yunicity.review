# MEDIA-PLATFORM — Fondation média Yunicity

| Champ | Valeur |
|-------|--------|
| Feature | MEDIA-INFRA-V1 — Yunicity Media Platform Foundation |
| Ticket | INFRA-01 |
| Phase BMAD | INFRA |
| Statut | Document de référence — provisionnement manuel Cloudflare |
| Liens | `docs/ops/INFRA-01-cloudflare-setup-checklist.md`, `docs/ops/MEDIA-MONITORING-SPEC.md`, `docs/ops/VIDEO-01-media-storage-readiness.md` |

---

## 1. Objectif

Centraliser la **fondation média** de Yunicity (stockage objet, CDN, conventions, monitoring, rétention) tout en conservant des **pipelines métier distincts** pour chaque type de média.

Yunicity gère ou gérera :

| Type | Pipeline | Statut |
|------|----------|--------|
| Vidéos Local Video | `local_video/` | ✅ Implémenté (VIDEO-01/01B) |
| Thumbnails vidéo | `local_video/` (dérivé) | ✅ |
| Images événements | `image_media/` (futur) | 📋 Planifié |
| Logos partenaires | `image_media/` (futur) | 📋 Planifié |
| Avatars utilisateurs | `image_media/` (futur) | 📋 Planifié |
| Images sociales | `image_media/` (futur) | 📋 Planifié |

**Décision CTO** : fondation unifiée OUI · pipeline monolithique NON.

---

## 2. Séparation fondation vs pipelines

```
┌─────────────────────────────────────────────────────────────┐
│                    FONDATION COMMUNE (futur)                 │
│  media/storage/  media/keys/  media/retention/  monitoring/ │
│  Buckets R2 · CDN · domaines · conventions · alertes coût   │
└──────────────────────────┬──────────────────────────────────┘
                           │ partage infra uniquement
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
┌─────────────────┐                 ┌─────────────────┐
│  local_video/   │                 │  image_media/   │
│  presigned PUT  │                 │  (futur)        │
│  FFmpeg worker  │                 │  resize/WebP    │
│  ffprobe        │                 │  validation img │
└─────────────────┘                 └─────────────────┘
```

Chaque pipeline possède sa propre logique de validation, processing et statuts. Ils ne passent **pas** par un `MediaService` monolithique.

---

## 3. Schéma architecture cible

### Upload (presigned)

```
Client (web/mobile)
    │ JWT auth
    ▼
API Yunicity — POST /upload-init
    │ génère clé objet + presigned PUT (TTL 15 min)
    ▼
Client ──PUT──► Cloudflare R2 (bucket env)
    │ pas de secret côté client
    ▼
API — publish / confirm
    │ HeadObject, validation métier
    ▼
Statut UPLOADED
```

### Processing (worker — futur VIDEO-03A)

```
API publish
    │ enqueue job (ARQ + Redis)
    ▼
Worker — ffprobe + FFmpeg / image resize
    │ upload processed + thumbnail
    ▼
R2 — objets finaux
    │ URLs publiques via CDN
    ▼
Statut READY (published) ou FAILED
```

### Lecture (CDN public)

```
Client (feed, fiche lieu, événement)
    │ GET HTTPS
    ▼
CDN Cloudflare — media.{env}.yunicity.city
    │ cache edge (images/thumbnails/vidéos processed)
    ▼
R2 bucket (origin privé, accès via CDN / signed si privé futur)
```

**Règle sécurité** : seuls les médias **publiés et publics** sont servis via CDN. Brouillons, contenus modérés ou privés ne doivent pas avoir d’URL CDN publique prédictible.

---

## 4. Multi-environnements

| Environnement | `APP_ENV` | Bucket R2 | Domaine CDN |
|---------------|-----------|-----------|-------------|
| Dev local | `dev` | `yunicity-media-dev` *(optionnel)* | `media.dev.yunicity.city` ou filesystem |
| Recette | `recette` | `yunicity-media-recette` | `media.recette.yunicity.city` |
| Preprod | `preprod` | `yunicity-media-preprod` | `media.preprod.yunicity.city` |
| Production | `prod` | `yunicity-media-prod` | `media.yunicity.city` |

**Décision CTO** : un bucket par environnement. Pas de préfixe `recette/` ou `prod/` dans un bucket unique.

**DNS** : domaine racine `yunicity.city`. Si contrainte registrar impose une variante (ex. sous-domaine technique), documenter l’écart dans `INFRA-01-cloudflare-setup-checklist.md` et mettre à jour les variables `LOCAL_VIDEO_CDN_BASE_URL`.

**Endpoint R2** : `https://<account_id>.r2.cloudflarestorage.com` — identique par compte ; le bucket distingue l’environnement.

---

## 5. Convention buckets

| Bucket | Usage | Accès public direct |
|--------|-------|---------------------|
| `yunicity-media-dev` | Dev local / tests infra | ❌ Non |
| `yunicity-media-recette` | Recette QA | ❌ Non — CDN only |
| `yunicity-media-preprod` | Preprod | ❌ Non — CDN only |
| `yunicity-media-prod` | Production | ❌ Non — CDN only |

- Pas de listing public du bucket.
- Tokens R2 least-privilege : Object Read & Write sur le bucket de l’environnement.
- Secrets stockés dans Railway / gestionnaire de secrets — **jamais git, jamais frontend**.

---

## 6. Convention domaines CDN

| Env | URL CDN (sans trailing slash) |
|-----|-------------------------------|
| dev | `https://media.dev.yunicity.city` |
| recette | `https://media.recette.yunicity.city` |
| preprod | `https://media.preprod.yunicity.city` |
| prod | `https://media.yunicity.city` |

Variable backend actuelle : `LOCAL_VIDEO_CDN_BASE_URL` → deviendra la base CDN partagée pour tous les pipelines média (alias futur `MEDIA_CDN_BASE_URL` possible, hors scope INFRA-01).

---

## 7. Convention clés objet

### 7.1 Cible long terme (recommandée)

```
media/{media_type}/{city_slug}/{owner_scope}/{owner_id}/{media_id}/source.{ext}
media/{media_type}/{city_slug}/{owner_scope}/{owner_id}/{media_id}/processed.{ext}
media/{media_type}/{city_slug}/{owner_scope}/{owner_id}/{media_id}/thumbnail.{ext}
```

| Segment | Valeurs exemples |
|---------|------------------|
| `media_type` | `video`, `event-image`, `partner-logo`, `avatar`, `social-image` |
| `city_slug` | `reims`, `paris`, `lyon` (lowercase ASCII) |
| `owner_scope` | `user`, `event`, `organization`, `partner` |
| `owner_id` | UUID propriétaire métier |
| `media_id` | UUID média |

**Exemples** :

```
media/video/reims/user/{user_id}/{video_id}/source.mov
media/video/reims/user/{user_id}/{video_id}/processed.mp4
media/video/reims/user/{user_id}/{video_id}/thumbnail.jpg
media/event-image/reims/event/{event_id}/{media_id}/source.jpg
media/partner-logo/reims/organization/{org_id}/{media_id}/source.png
media/avatar/reims/user/{user_id}/{media_id}/source.jpg
```

### 7.2 Local Video v1 — clés en production code (VIDEO-01B)

Le pipeline Local Video utilise aujourd’hui un layout **legacy/v1 compatible** :

```
local-video/{city_slug}/{video_id}/source.{ext}
local-video/{city_slug}/{video_id}/processed.mp4
local-video/{city_slug}/{video_id}/thumbnail.jpg
```

| Aspect | v1 actuel | cible `media/video/...` |
|--------|-----------|---------------------------|
| Préfixe racine | `local-video/` | `media/video/` |
| Owner scope | implicite (auteur en DB) | explicite `user/{user_id}/` |
| Migration | — | progressive, ticket dédié + validation CTO |

**INFRA-01 ne migre pas les clés.** Le bucket unifié `yunicity-media-recette` hébergera le préfixe `local-video/` tel quel. Une migration vers `media/video/...` pourra être planifiée lorsque plusieurs pipelines partageront les mêmes helpers `media/keys/`.

---

## 8. Upload et lecture

### Upload

| Règle | Détail |
|-------|--------|
| Presigned PUT | Obligatoire pour R2 (recette+) |
| TTL | 15 min (`LOCAL_VIDEO_PRESIGNED_TTL_SECONDS=900`) |
| Content-Type + Content-Length | Inclus dans la signature presigned |
| Auth init | JWT backend — jamais clé R2 côté client |

### Lecture

| Visibilité | Accès |
|------------|-------|
| Publié / public | URL CDN `{CDN}/{storage_key}` |
| Brouillon / processing | Pas d’URL CDN ; accès backend only |
| Modéré / masqué | 404 CDN ou signed URL future |
| Supprimé (soft delete) | CDN cache expire ; objet R2 conservé 30 j |

---

## 9. Rétention et suppression

| Phase | Comportement |
|-------|--------------|
| Soft delete applicatif | `status=deleted` / flag `deleted_at` en DB — URLs CDN invalidées côté app |
| Rétention 30 jours | Objet R2 conservé après soft delete |
| Purge physique | Job planifié (futur `media/retention/`) supprime l’objet R2 après 30 j |
| Suppression immédiate | Contenu illégal / critique — action admin + purge R2 sans attendre 30 j |

**INFRA-01** : politique documentée ; job de purge non implémenté.

---

## 10. Évolution code (hors scope INFRA-01)

Structure cible dans le monorepo :

```
backend/app/services/
  media/
    storage/      # factory R2/filesystem partagée (futur)
    keys/         # builders par media_type
    retention/    # soft delete + purge
    monitoring/   # métriques communes
  local_video/    # pipeline vidéo existant
  image_media/    # pipeline images (futur)
```

Ne pas fusionner `local_video_service` et futurs services image dans ce ticket.

---

## 11. Références

| Document | Rôle |
|----------|------|
| `docs/ops/INFRA-01-cloudflare-setup-checklist.md` | Provisionnement manuel Cloudflare |
| `docs/ops/MEDIA-MONITORING-SPEC.md` | KPIs et alertes |
| `docs/qa/MEDIA-INFRA-V1-smoke-test.md` | Validation recette R2 |
| `docs/adr/ADR-VIDEO-03A-async-media-processing-worker.md` | Worker FFmpeg async |
| `docs/ops/VIDEO-01-media-storage-readiness.md` | Readiness pipeline Local Video |

---

## 12. Risques et dépendances

| Risque | Mitigation |
|--------|------------|
| Bucket unique mal configuré (public access) | Checklist INFRA-01 + review sécurité |
| CORS trop permissif | Origines recette explicites |
| Coût R2/CDN non surveillé | `MEDIA-MONITORING-SPEC.md` |
| FFmpeg sync en prod | ADR VIDEO-03A — NO-GO prod public |
| Clés v1 vs cible `media/` | Coexistence documentée ; migration CTO |

**Verdict provisionnement recette** : **GO** après exécution checklist INFRA-01 par Kyria (aucune ressource créée par Cursor).
