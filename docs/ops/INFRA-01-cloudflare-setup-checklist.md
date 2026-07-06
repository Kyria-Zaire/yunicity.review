# INFRA-01 — Checklist Cloudflare R2 / CDN (Media Foundation)

| Champ | Valeur |
|-------|--------|
| Feature | MEDIA-INFRA-V1 |
| Ticket | INFRA-01 |
| Exécuteur | Kyria (dashboard Cloudflare + Railway) |
| Architecture | `docs/architecture/MEDIA-PLATFORM.md` |

> **Cursor ne crée aucune ressource Cloudflare.** Cette checklist est actionnable manuellement.

---

## 1. Prérequis

- [ ] Compte Cloudflare actif avec facturation R2 activée
- [ ] Domaine `yunicity.city` géré dans Cloudflare (DNS)
- [ ] Accès **DNS** (Edit) sur `yunicity.city`
- [ ] Accès **R2** (Object Read & Write) sur le compte
- [ ] Accès **Railway** (ou secret manager) pour variables backend recette
- [ ] Backend recette déployé avec `ffmpeg` dans le container (`backend/Dockerfile`)
- [ ] PostgreSQL + Redis recette opérationnels
- [ ] Lecture de `docs/architecture/MEDIA-PLATFORM.md` et `docs/qa/MEDIA-INFRA-V1-smoke-test.md`

---

## 2. Création bucket recette

### Paramètres

| Paramètre | Valeur |
|-----------|--------|
| **Nom exact** | `yunicity-media-recette` |
| Location | Automatic (Cloudflare choisit) |
| Public access | **Désactivé** — pas de R2.dev public |
| Object versioning | Optionnel (recommandé : off pour MVP, activer si rollback objet requis) |
| Lifecycle rules | À configurer plus tard (purge 30 j — ticket retention) |

### Étapes dashboard

1. Cloudflare Dashboard → **R2** → **Create bucket**
2. Nom : `yunicity-media-recette`
3. Confirmer création
4. Noter l’**Account ID** (Overview R2) → sert à construire l’endpoint

### Endpoint R2

```
https://<account_id>.r2.cloudflarestorage.com
```

Exemple : `https://a1b2c3d4e5f6.r2.cloudflarestorage.com`

- [ ] Bucket `yunicity-media-recette` créé
- [ ] Account ID noté
- [ ] Endpoint URL noté (sans trailing slash)

---

## 3. Access keys R2

### Bonnes pratiques

- Créer une **API token R2** dédiée recette (pas la clé master compte)
- Permissions minimales : **Object Read & Write** sur `yunicity-media-recette` uniquement
- Rotation planifiée (ex. tous les 90 jours)

### Étapes

1. R2 → **Manage R2 API Tokens** → Create API Token
2. Permissions : Object Read & Write
3. Specify bucket : `yunicity-media-recette` (si option disponible)
4. Copier **Access Key ID** et **Secret Access Key** (affiché une seule fois)

### Stockage secrets

| Secret | Où stocker |
|--------|------------|
| `LOCAL_VIDEO_R2_ACCESS_KEY_ID` | Railway recette (secret) |
| `LOCAL_VIDEO_R2_SECRET_ACCESS_KEY` | Railway recette (secret) |

- [ ] Token R2 recette créé (least-privilege)
- [ ] Secrets injectés dans Railway — **pas dans git**
- [ ] Confirmé : aucun secret dans le frontend / repo / logs CI

---

## 4. Custom domain CDN — recette

### Domaine cible

```
media.recette.yunicity.city
```

### Étapes Cloudflare

1. R2 → bucket `yunicity-media-recette` → **Settings** → **Custom Domains**
2. **Connect Domain** → `media.recette.yunicity.city`
3. Cloudflare crée l’enregistrement DNS (CNAME) automatiquement si zone gérée
4. Attendre statut **Active** + certificat HTTPS provisionné

### Vérifications DNS

- [ ] Enregistrement `media.recette.yunicity.city` résout (dig / nslookup)
- [ ] HTTPS valide (certificat Cloudflare)
- [ ] Pas d’accès listing bucket (`https://media.recette.yunicity.city/` ne liste pas les objets)

**Variante DNS** : si contrainte registrar, documenter ici l’URL effective et mettre à jour `LOCAL_VIDEO_CDN_BASE_URL` en conséquence.

---

## 5. CORS (bucket R2)

Configurer CORS sur le bucket pour autoriser les uploads presigned depuis les origines recette.

### Origines autorisées (recette)

Remplacer par les URLs réelles déployées :

```
https://api.recette.yunicity.city
https://recette.yunicity.city
https://admin.recette.yunicity.city
```

*(Ajuster selon déploiement Railway / Vercel effectif.)*

### Configuration CORS recommandée (JSON)

```json
[
  {
    "AllowedOrigins": [
      "https://api.recette.yunicity.city",
      "https://recette.yunicity.city",
      "https://admin.recette.yunicity.city"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

### Règles

- **Ne pas** utiliser `"*"` en recette/preprod/prod
- Méthode `PUT` requise pour presigned upload
- `GET` / `HEAD` pour vérifications client et CDN origin fetch

- [ ] CORS configuré sur `yunicity-media-recette`
- [ ] Test OPTIONS depuis origine web recette (si applicable)

---

## 6. Cache rules (CDN Cloudflare)

Configurer via **Rules** → **Cache Rules** (ou Page Rules legacy) sur `media.recette.yunicity.city`.

| Pattern URL | Cache | TTL suggéré | Notes |
|-------------|-------|-------------|-------|
| `*/thumbnail.jpg` | ✅ Cache | 7–30 j | Immutable si hash/version dans clé futur |
| `*/processed.mp4` | ✅ Cache | 7–30 j | Vidéos publiées |
| `*.jpg`, `*.png`, `*.webp` (images futures) | ✅ Cache | 7–30 j | Logos, avatars, event images |
| `*/source.*` | ❌ Bypass / no cache | — | Uploads bruts — ne pas exposer publiquement si possible |
| Préfixe brouillon (futur) | ❌ No cache | — | Non public |

### Headers recommandés (origin R2 / futur worker)

Pour objets publiés immuables :

```
Cache-Control: public, max-age=31536000, immutable
```

**Note Local Video v1** : les clés `local-video/{city}/{id}/source.*` ne devraient pas être liées en CDN public avant publish ; après publish, seuls `processed.mp4` et `thumbnail.jpg` sont référencés dans `media_url` / `thumbnail_url`.

- [ ] Cache rules créées pour thumbnails et processed
- [ ] Sources uploads non servies publiquement via CDN feed

---

## 7. Variables d’environnement (Railway recette)

Copier dans Railway → service API recette :

```bash
APP_ENV=recette

# Backend storage Local Video → R2
LOCAL_VIDEO_STORAGE_BACKEND=r2
LOCAL_VIDEO_CDN_BASE_URL=https://media.recette.yunicity.city
LOCAL_VIDEO_R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
LOCAL_VIDEO_R2_BUCKET=yunicity-media-recette
LOCAL_VIDEO_R2_ACCESS_KEY_ID=<secret-manager>
LOCAL_VIDEO_R2_SECRET_ACCESS_KEY=<secret-manager>

# Limites média
LOCAL_VIDEO_MAX_BYTES=52428800
LOCAL_VIDEO_MAX_DURATION_SECONDS=90
LOCAL_VIDEO_PRESIGNED_TTL_SECONDS=900

# Fallback territorial — dev/recette only (warning log si utilisé)
LOCAL_VIDEO_DEFAULT_CITY_SLUG=reims

# Média partagé (Stories / fallback dev)
MEDIA_PUBLIC_BASE_URL=https://api.recette.yunicity.city
```

### Variables futures (documentées, non requises INFRA-01)

```bash
# Alias futur fondation commune — ne pas refactorer le code dans INFRA-01
# MEDIA_CDN_BASE_URL=https://media.recette.yunicity.city
# MEDIA_R2_BUCKET=yunicity-media-recette
# MEDIA_R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
```

### Validations au démarrage API

L’API refuse de démarrer si :

- `APP_ENV=recette` + `LOCAL_VIDEO_STORAGE_BACKEND=r2` sans credentials R2
- `APP_ENV=recette` + `LOCAL_VIDEO_STORAGE_BACKEND=r2` sans `LOCAL_VIDEO_CDN_BASE_URL`

- [ ] Toutes variables ci-dessus configurées
- [ ] Redéploiement API recette sans erreur `LOCAL_VIDEO_*_MISCONFIGURED`
- [ ] Logs startup : pas d’erreur storage validation

---

## 8. Smoke test recette

Exécuter après configuration complète. Détail : `docs/qa/MEDIA-INFRA-V1-smoke-test.md`.

Résumé :

1. [ ] Backend recette healthy (`GET /health` ou équivalent)
2. [ ] Lancer smoke script (depuis poste ou CI avec accès API recette)
3. [ ] Objet `local-video/reims/{video_id}/source.mp4` présent dans bucket
4. [ ] Objet `local-video/reims/{video_id}/processed.mp4` présent
5. [ ] Objet `local-video/reims/{video_id}/thumbnail.jpg` présent
6. [ ] `media_url` et `thumbnail_url` répondent 200 via CDN
7. [ ] Vidéo lisible dans navigateur
8. [ ] Aucun secret R2 dans réponses API / DevTools frontend

---

## 9. Rollback

| Action | Quand |
|--------|-------|
| Repasser `LOCAL_VIDEO_STORAGE_BACKEND=filesystem` | Urgence recette — perte R2 temporaire *(non viable prod)* |
| Désactiver custom domain CDN | CDN cassé — URLs media down |
| Révoquer token R2 | Compromission suspectée |
| Redéployer API avec anciennes vars | Config incorrecte |

### Interdictions rollback

- **Ne pas supprimer le bucket** avant export inventaire objets + logs d’audit
- **Ne pas committer** les secrets révoqués — rotation propre

### Procédure rollback recette

1. Railway : `LOCAL_VIDEO_STORAGE_BACKEND=filesystem` + `MEDIA_UPLOAD_DIR` writable
2. Retirer custom domain ou le laisser inactif
3. Révoquer token R2 compromis ; en créer un nouveau si reprise R2
4. Documenter incident + date dans canal ops

---

## 10. Buckets autres environnements (référence)

| Env | Bucket | CDN |
|-----|--------|-----|
| dev | `yunicity-media-dev` | `media.dev.yunicity.city` |
| recette | `yunicity-media-recette` | `media.recette.yunicity.city` |
| preprod | `yunicity-media-preprod` | `media.preprod.yunicity.city` |
| prod | `yunicity-media-prod` | `media.yunicity.city` |

Répéter cette checklist par environnement lors de l’ouverture preprod/prod.

---

## 11. GO / NO-GO provisionnement recette

| Critère | Statut |
|---------|--------|
| Architecture documentée | ✅ MEDIA-PLATFORM.md |
| Checklist actionnable | ✅ Ce document |
| Code Local Video compatible R2 | ✅ VIDEO-01/01B |
| Worker async prod | ❌ Hors scope — NO-GO prod public |
| Bucket créé | ☐ Kyria |
| CDN actif | ☐ Kyria |
| Smoke test passé | ☐ Kyria |

**Recommandation** : **GO provisionnement recette** dès que Kyria exécute les sections 2–7. Smoke test section 8 valide le **GO opérationnel**.
