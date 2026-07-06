# PRD-CREATORS-V2 — Local Video

> **Workflow** : `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` — gates BUILD : §13 + `docs/bmad/BMAD.md`  
> **ADR média** : `docs/architecture/ADR-CREATORS-V2-local-video-media.md`  
> **Audit existant** : archivé → `docs/_archive/creators/C1-B1-existing-audit-bmad.md` (stub : `docs/creators/C1-B1-existing-audit-bmad.md`)  
> **API (code = référence)** : `docs/api/LOCAL-VIDEO-API.md` — sync VIDEO-DOCS-SYNC-01  
> **DISCOVER** : validé CTO 2026-06-12 · **Backend BUILD** : VIDEO-01A/B, MEDIA-INFRA-V1, VIDEO-03A mergés (PR #71, #72, #73)

---

## 0. Métadonnées

| Champ | Valeur |
|---|---|
| ID | PRD-CREATORS-V2 |
| Nom | Local Video — fil vertical territorial |
| Statut | **VERIFY** — backend + infra mergés ; client upload UX ouvert (VIDEO-04A–D) |
| Phase BMAD | VERIFY (backend) · BUILD (frontend upload) |
| Priorité | **P0** — fonctionnalité signature post Go-Live Reims |
| Auteur | Founder + CTO |
| Owner technique | Backend media + Frontend web (pilote) |
| Date création | 2026-06-12 |
| Dernière mise à jour | 2026-06-29 (VIDEO-DOCS-SYNC-01) |
| Sprint cible | C2-S1 → C2-S5 (voir §10) |
| Environnement cible | dev → recette → preprod → prod |

### Positionnement produit (validé)

> **Le fil vertical qui transforme chaque swipe en une opportunité réelle de découvrir, vivre ou rejoindre quelque chose près de chez toi.**

> **Pas un scroll infini sans ancrage. Un fil vivant qui te rapproche de ta ville.**

---

# 1. Résumé Produit

## Objectif

Permettre aux citoyens de Reims de **publier et consommer des vidéos courtes ancrées territorialement**, avec une expérience immersive type TikTok, mais où **chaque swipe ouvre une action locale réelle** (s’y rendre, réserver, profiter d’une offre Passport).

## Pourquoi cette feature existe

- **Problème utilisateur** : Yunicity manque du « wow effect » et d’un format natif mobile-first ; le contenu existe (Stories éphémères, posts texte, contenus partenaires) mais **ne crée pas l’habitude d’ouverture quotidienne**.
- **Problème business** : Creators V1 = sur-ingénierie + faible désirabilité ; Local Video V2 doit **relier visionnage → déplacement → conversion partenaire/Passport**.
- **Impact attendu** : ouvertures répétées du fil vidéo, temps passé, clics « Y aller », visites lieux/événements, rétention J7 pilote Reims.

## Résultat attendu (MVP pilote)

- Un citoyen connecté peut **filmer/uploader** une vidéo MP4/MOV (≤ durée max), la **publier** avec quartier + type obligatoires.
- Un citoyen peut **consommer** un fil vertical dédié avec autoplay, swipe, like, commentaire, partage.
- Chaque vidéo affiche **proximité** (« à X m de chez toi ») et **CTA Y aller** quand un lieu/événement est rattaché.
- Admin peut **masquer/supprimer** une vidéo signalée ; file prioritaire à ≥ 3 signalements.

---

# 2. Contexte

## Contexte business

- **Pilote Reims** : 50–100 utilisateurs après clôture WEB-AUDIT-V1 (produit ~8,8/10, Go-Live autorisé).
- **Creators V1** : domaine partenaire (`PartnerCreatorContent`) + Stories UGC éphémères — **ne pas fusionner** avec Local Video.
- **Objectif score** : passer de 8,8 → 9,5 si Local Video exécuté comme défini en DISCOVER.

## Contexte technique

| Existant | Rôle | Décision V2 |
|----------|------|-------------|
| `Story` + `StoryMediaService` | Upload local disque, MP4 max 20 Mo, éphémère | **KEEP** — ne pas étendre pour V2 |
| `PartnerCreatorContent` | Contenu org modéré, feed `partner_creator` | **KEEP** — hors scope V2 |
| Feed posts (`Post`) | Texte + URL media | **KEEP** — teasers V2.1 seulement |
| Upload avatar/bannière profil | Pattern upload utilisateur | **Réutiliser patterns auth/MIME** |
| Modération admin reports | Trust & Safety | **Réutiliser** signalements |
| PostGIS / neighborhoods / events / places | Ancrage territorial | **Réutiliser** FK + utils distance |

**Dette connue** : Stories stocke en local filesystem (`media_upload_dir`) — **Local Video V2 migre directement vers R2** (voir ADR).

## Dépendances

| Domaine | Dépend de | Bloquant ? | Notes |
|---------|-----------|------------|-------|
| auth | JWT session citoyen | **oui** | Publish + like + comment |
| users / profiles | `city`, quartier préféré, géoloc opt-in | **oui** | Proximité wow |
| neighborhoods | liste Reims | **oui** | Hard gate quartier |
| cultural_places / partners / events | liens optionnels | non (MVP) | CTA Y aller |
| passport / offers | offres liées lieu | non | Wow P0 si lieu partenaire |
| notifications | likes/commentaires | non | Post-MVP ou best-effort |
| géoloc / PostGIS | distance utilisateur ↔ vidéo | **oui** (wow P0) | coarse lat/lng |
| médias / upload | **R2 + FFmpeg** (nouveau) | **oui** | ADR obligatoire |
| map | pins vidéos par lieu | non | P1 V2.1 |
| tribus | lien tribu type P2 | non | Sprint ultérieur |

## Risques connus

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Coût stockage/bandwidth R2 | moyenne | élevé | durée max, quota/user, compression |
| FFmpeg indispo en dev | moyenne | moyen | Docker service + fallback poster frame |
| Contenu illégal / abus | moyenne | élevé | signalement + admin + rate limits |
| IDOR sur vidéos privées | faible | élevé | authZ ownership + tests |
| Confusion Stories / Local Video | élevée | moyen | naming UI « Vidéos » vs « Stories », docs |
| Performance fil vertical | moyenne | élevé | pagination cursor, preload 1 next, CDN |
| MOV/codec exotique | moyenne | moyen | whitelist MIME + transcode FFmpeg → MP4 H.264 |

---

# 3. User Stories

## Story 1 — Publier une vidéo locale

En tant que **citoyen de Reims**  
Je veux **filmer ou uploader une courte vidéo et la publier avec mon quartier**  
Afin de **partager un bon plan ou un moment vécu près de chez moi**

### Critères d’acceptation

- [ ] Formats acceptés : MP4, MOV (transcodés en MP4 H.264 serveur si besoin)
- [ ] Durée max configurable ( défaut **90 s** pilote C2 )
- [ ] Taille max configurable ( défaut **50 Mo** pilote )
- [ ] Hard gate : **ville** (Reims auto), **quartier**, **type** (`bon_plan` | `moment` | `quartier` | `lieu` | `tribu` | `autre`)
- [ ] Soft gate : titre, description, lieu, événement, tribu — publish autorisé avec confirmation
- [ ] Thumbnail auto généré (FFmpeg frame @ 1s)
- [ ] États UI : upload progress, processing, success, error retry
- [ ] Vidéo visible dans le fil vertical après publish (pas de pre-review admin)

---

## Story 2 — Consommer le fil vertical

En tant que **citoyen**  
Je veux **ouvrir un fil vidéo plein écran et swiper verticalement**  
Afin de **découvrir Reims en immersion**

### Critères d’acceptation

- [ ] Route dédiée web : `/videos` (nom UI : **Vidéos**)
- [ ] Entrée nav : icône/onglet distinct du Feed classique
- [ ] Autoplay vidéo courante ; **mute par défaut** ; tap pour activer le son
- [ ] Swipe vertical : vidéo suivante / précédente
- [ ] Double tap : like + animation
- [ ] Tap centre : pause / play
- [ ] Fin de vidéo : loop si seule, sinon suggestion swipe
- [ ] Pagination cursor (pas de chargement massif)
- [ ] Empty state : message + CTA explorer quartiers / sortir

---

## Story 3 — Contexte territorial (wow P0)

En tant que **citoyen**  
Je veux **voir à quelle distance et dans quel contexte la vidéo a été tournée**  
Afin de **sentir que Yunicity est local, pas générique**

### Critères d’acceptation

- [ ] Affichage **distance** si géoloc utilisateur disponible : « À {X} m de chez toi » (seuil affichage : ≤ 5 km)
- [ ] Affichage **quartier** + **type** sur overlay
- [ ] **Contexte temporel P1** : « Publié il y a {n} min » ou « Ça se passe ce soir » si événement lié
- [ ] CTA **Y aller** si `cultural_place_id` ou `local_event_id` ou partenaire lié
- [ ] Deep link partage : `/videos/{id}`

---

## Story 4 — Interactions sociales

En tant que **citoyen**  
Je veux **aimer, commenter et partager une vidéo**  
Afin de **réagir et faire circuler un bon plan**

### Critères d’acceptation

- [ ] Like idempotent (toggle), compteur visible
- [ ] Commentaires en **sheet slide-up** (pas navigation full page)
- [ ] Partage : copier lien + Web Share API si disponible
- [ ] Auth requise pour like/comment ; lecture publique ou auth-only ( **décision : auth-only pilote** )

---

## Story 5 — Modération & signalement

En tant que **citoyen**  
Je veux **signaler une vidéo inappropriée**  
Afin de **protéger la communauté locale**

### Critères d’acceptation

- [ ] Signalement 1 tap (réutiliser `FeedReportReason` ou enum dédié)
- [ ] ≥ 3 signalements → flag `review_priority` + file admin
- [ ] Admin : masquer (`hidden`) / supprimer (`deleted`) + audit
- [ ] Auteur notifié uniquement post-MVP (hors scope S1–S3)

---

## Story 6 — Admin (minimal)

En tant qu’**admin modération**  
Je veux **voir et retirer une vidéo signalée**  
Afin de **maintenir la qualité du pilote**

### Critères d’acceptation

- [ ] Liste admin filtrable : signalées, cachées, récentes
- [ ] Action masquer / supprimer avec motif
- [ ] Audit trail (who/when/why)

---

# 4. Scope

## Inclus MVP (C2-S1 → C2-S4)

### Backend
- Entité `local_videos` + migrations
- Upload → R2 (voir ADR)
- Thumbnail FFmpeg
- CRUD publish + list feed cursor
- Likes + comments (tables dédiées ou polymorphiques — voir §6)
- Signalements + seuil 3
- Endpoints admin masquer/supprimer
- Calcul distance (PostGIS ou haversine coarse)

### Frontend Web (pilote)
- `/videos` fil vertical + player
- `/videos/new` upload + formulaire métadonnées
- `/videos/{id}` deep link (ouvre player à l’index)
- Overlay wow : distance, quartier, type, temporal P1, CTA Y aller
- États loading / empty / error / session expirée

### Types contenu prioritaires (P0)
- Bon plans, moments, quartiers

## Inclus V2.1 (C2-S5)

- Teaser carte vidéo dans Feed classique (1/5–7 posts) → ouvre fil à l’index
- Carte vivante : « Voir autres vidéos du lieu » sur Map
- Preuve sociale locale : « X Rémois ont vu cette vidéo »
- Expo mobile player natif (si web pilote validé)

## Hors scope (explicitement interdit MVP)

- Algorithme ML de recommandation
- Musique / filtres AR / duet / stitch
- Pre-review humaine systématique
- Live streaming
- Monétisation créateurs
- Fusion avec Stories ou PartnerCreatorContent
- Refonte Creators V1 / profils créateurs territorial (C1 reporté)
- WebSocket temps réel compteurs
- Transcoding multi-bitrate HLS/DASH (post-MVP ; MVP = MP4 progressive)

## Definition of Done (feature)

- [ ] Stories 1–6 critères validés en recette
- [ ] Tests backend upload, authZ, feed, like, report
- [ ] Tests frontend composant player + upload form
- [ ] Checklist sécurité upload (MIME, taille, path traversal, IDOR)
- [ ] `.env.example` R2 + FFmpeg documentés
- [ ] Copy UI français
- [ ] ADR média implémenté
- [ ] Pas de régression WEB-AUDIT-V1 surfaces

---

# 5. UX / UI

## Flux utilisateur — Publication

1. Tap **Vidéos** → FAB / « Publier »
2. Choisir fichier (MP4/MOV) ou enregistrer (web : file picker ; mobile futur : caméra)
3. Preview + trim info (durée affichée ; trim manuel hors MVP)
4. Formulaire : quartier (required), type (required), titre, description, lieu/événement optionnels
5. Upload progress → processing thumbnail → **Publié**
6. Redirection fil vertical sur sa vidéo

## Flux utilisateur — Consommation

1. Tap **Vidéos** (nav)
2. Fil vertical plein écran — première vidéo autoplay mute
3. Swipe / double-tap / comment sheet / partage / Y aller
4. Back → retour dernière page

## Maquettes

- **À produire en DESIGN** avant S2 (wireframes player overlay + upload form)
- Référence UX : TikTok minimal + overlay Yunicity (quartier, distance, CTA)

## États UI obligatoires

| État | Comportement |
|------|--------------|
| loading | Skeleton fil + spinner upload |
| empty | « Pas encore de vidéos à Reims » + CTA publier / explorer Sortir |
| error | Message FR + Réessayer |
| processing | « Préparation de votre vidéo… » post-upload |
| session expirée | Panel reconnecter (pattern WEB-AUDIT-09) |
| hidden (admin) | 404 ou « Vidéo indisponible » |

## Accessibilité

- [ ] Boutons overlay ≥ 44px
- [ ] Labels lecteur d’écran sur like/comment/share/Y aller
- [ ] Sous-titres : hors MVP (champ `caption` futur)
- [ ] Pas d’autoplay sonore sans action utilisateur

## Responsive

| Plateforme | Priorité | Notes |
|------------|----------|-------|
| Web mobile (375px+) | **P0 pilote** | Fil vertical natif web |
| Web desktop | P1 | Colonne centrée max-w-md ou split preview |
| Expo mobile | P1 (V2.1) | Player natif + caméra |
| Admin | P0 minimal | Liste + actions |

---

# 6. Architecture Technique

## Vue d’ensemble

```
[Client] → POST /local-videos/upload-init → presigned PUT → R2 (ou /binary dev)
         → POST /local-videos → HTTP 202 (LocalVideoPublishAcceptedResponse)
         → Redis queue yunicity-media-video
         → Worker ARQ (FFmpeg) → processed.mp4 + thumbnail.jpg → R2
         → GET /local-videos/{id} (polling processing_status)
         → GET /local-videos/feed → URLs CDN media.{env}.yunicity.city

[Admin] → PATCH /admin/local-videos/{id}/hide
```

Implémentation : PR #72 (VIDEO-03A), worker Railway PR #73 (INFRA-03). Détail contrats : `docs/api/LOCAL-VIDEO-API.md`.

## Frontend Web

### Écrans

| Route | Nouveau | Description |
|-------|---------|-------------|
| `/videos` | **NEW** | Fil vertical player |
| `/videos/new` | **NEW** | Upload + métadonnées |
| `/videos/[id]` | **NEW** | Deep link → player |

### Composants (prévision)

| Composant | Rôle |
|-----------|------|
| `LocalVideoFeedScreen` | Shell fil vertical |
| `LocalVideoPlayer` | `<video>` natif, gestures |
| `LocalVideoOverlay` | distance, quartier, CTAs |
| `LocalVideoUploadForm` | Hard/soft gates |
| `LocalVideoCommentSheet` | Bottom sheet |

### Hooks

| Hook | Rôle |
|------|------|
| `useLocalVideoFeed` | cursor pagination, preload |
| `useLocalVideoUpload` | presigned upload + poll processing |
| `useLocalVideoInteractions` | like, comment |

**Ne pas réutiliser** `use-stories-*` directement — hooks dédiés, patterns similaires autorisés.

## Backend

### Entité : `local_videos`

| Colonne | Type | Contraintes | Notes |
|---------|------|-------------|-------|
| `id` | UUID | PK | |
| `author_user_id` | UUID | FK users, NOT NULL | |
| `city` | varchar(64) | NOT NULL, default Reims | |
| `neighborhood_id` | UUID | FK, NOT NULL | hard gate |
| `video_type` | enum | NOT NULL | voir Story 1 |
| `title` | varchar(80) | nullable | soft |
| `description` | varchar(300) | nullable | soft |
| `cultural_place_id` | UUID | FK nullable | |
| `local_event_id` | UUID | FK nullable | |
| `tribe_id` | UUID | FK nullable | |
| `partner_id` | UUID | FK nullable | bon plan |
| `storage_key` | varchar(512) | NOT NULL | R2 object key |
| `media_url` | varchar(1024) | NOT NULL | CDN public/signed |
| `thumbnail_url` | varchar(1024) | NOT NULL | |
| `duration_seconds` | numeric(6,2) | NOT NULL | ffprobe |
| `file_size_bytes` | bigint | NOT NULL | |
| `mime_type` | varchar(64) | NOT NULL | |
| `latitude` | float | nullable | coarse, opt-in |
| `longitude` | float | nullable | |
| `status` | enum | `processing` \| `published` \| `failed` \| `hidden` \| `deleted` | lifecycle visibilité |
| `processing_status` | enum | `uploaded` \| `processing` \| `ready` \| `failed` | pipeline worker VIDEO-03A |
| `processing_error` | text | nullable | message si `failed` |
| `report_count` | int | default 0 | |
| `review_priority` | bool | default false | ≥3 reports |
| `like_count` | int | default 0 | dénormalisé |
| `comment_count` | int | default 0 | |
| `view_count` | int | default 0 | best-effort |
| `created_at` | timestamptz | NOT NULL | |
| `published_at` | timestamptz | nullable jusqu'à `published` | |

**Indexes :**
- `(city, status, published_at DESC)` — feed
- `(neighborhood_id, status, published_at DESC)` — filtres futurs
- `(cultural_place_id)` — carte vivante V2.1
- `(author_user_id, created_at DESC)` — profil futur

### Entités interactions

| Table | Rôle |
|-------|------|
| `local_video_likes` | `(video_id, user_id)` unique |
| `local_video_comments` | `id`, `video_id`, `author_user_id`, `body`, `created_at` |
| `local_video_reports` | réutiliser pattern reports feed ou table dédiée |

### Endpoints (contrats MVP)

#### `POST /api/v1/local-videos/upload-init`

**Auth :** citoyen connecté  
**Body :** `{ "filename", "content_type", "file_size_bytes" }`  
**Response :** `{ "upload_id", "presigned_url", "storage_key", "expires_at" }`  
**Erreurs :** 400 type/taille, 429 rate limit

#### `POST /api/v1/local-videos`

**Auth :** citoyen  
**Body :** métadonnées + `upload_id`  
**Response :** `202 Accepted` — `LocalVideoPublishAcceptedResponse` :

```json
{ "id", "status": "processing", "processing_status": "uploaded", "job_id", "message" }
```

**Side effect :** enqueue worker ARQ (FFmpeg hors requête HTTP). Polling : `GET /local-videos/{id}` jusqu'à `status=published` ou `failed`. Contrat complet : `docs/api/LOCAL-VIDEO-API.md` (VIDEO-03A, PR #72).

#### `GET /api/v1/local-videos/feed`

**Query :** `cursor`, `limit` (max 20), `city` (default Reims)  
**Auth :** citoyen (pilote)  
**Response :** items + `next_cursor` + champs wow (distance si lat/lng client en header/query opt-in)

#### `GET /api/v1/local-videos/{id}`

**AuthZ :** published ou auteur ou admin ; hidden → 404 public

#### `POST /api/v1/local-videos/{id}/like`

Toggle like

#### `GET/POST /api/v1/local-videos/{id}/comments`

Pagination comments + create

#### `POST /api/v1/local-videos/{id}/report`

**Body :** `{ "reason": "..." }`

#### Admin `PATCH /api/v1/admin/local-videos/{id}`

**Body :** `{ "status": "hidden" | "deleted", "reason" }`

### Migrations

- [ ] `alembic/versions/YYYYMMDD_local_videos_core.py`
- [ ] Réversible : oui (soft delete préféré)

### Jobs async (VIDEO-03A — IMPLEMENTED)

- Queue Redis `yunicity-media-video` · worker `arq workers.video_worker.WorkerSettings`
- États : `processing_status` `uploaded` → `processing` → `ready` (`status=published`) ou `failed`
- Retries max 3 · timeout job `LOCAL_VIDEO_PROCESSING_JOB_TIMEOUT_SECONDS` (default 600 s)
- Idempotence : `upload_id` unique ; reprise si `processed.mp4` + `thumbnail.jpg` déjà présents
- Déploiement worker : `docs/ops/INFRA-03-railway-video-worker-setup.md` (PR #73)

---

# 7. Sécurité & conformité

## Surface sensible

- [x] Données personnelles (géoloc coarse, auteur)
- [ ] Paiement
- [x] Upload fichier vidéo
- [ ] Webhook
- [x] Admin / modération

## Contrôles requis

| Contrôle | Implémentation |
|----------|----------------|
| AuthN | JWT session existante |
| AuthZ | Auteur = owner ; admin `moderation.manage` |
| Validation | MIME whitelist, magic bytes, durée ffprobe, taille |
| Rate limiting | upload-init : 10/h/user ; publish : 20/j/user pilote |
| Storage | R2 keys non devinables ; pas de listing public bucket |
| URLs | CDN public read ; upload presigned PUT courte durée |
| Logs | sans PII géoloc précise |

Référence : `docs/ai/security-checklist.md`

---

# 8. Performance & observabilité

| Métrique | Cible pilote |
|----------|--------------|
| p95 `GET /local-videos/feed` | < 300 ms |
| p95 presigned upload init | < 150 ms |
| Taille vidéo max | 50 Mo |
| Durée max | 90 s (pilote C2) |
| Preload player | 1 vidéo suivante (metadata + prefetch léger) |
| CDN cache | `Cache-Control: public, max-age=31536000, immutable` sur keys versionnées |

Monitoring : compteur uploads, échecs FFmpeg, 5xx feed, bande passante R2 (alerte quota).

---

# 9. Tests

## Backend

| Cas | Attendu |
|-----|---------|
| upload-init MIME invalid | 400 |
| publish sans quartier | 422 |
| feed cursor | pagination stable |
| like double | idempotent |
| report 3x | `review_priority=true` |
| IDOR delete autre user | 403 |
| hidden video public GET | 404 |

## Frontend

| Cas | Attendu |
|-----|---------|
| player swipe | index change |
| mute default | son off jusqu’à tap |
| upload error | retry |
| empty feed | CTA |

## Recette manuelle pilote

- [ ] Publier bon plan quartier Boulingrin avec lieu partenaire → CTA Y aller
- [ ] Swiper 10 vidéos sans crash mémoire mobile web
- [ ] Signaler → admin masque → disparaît du feed

---

# 10. Rollout & métriques

## Sprints proposés

| Sprint | Scope | Livrable |
|--------|-------|----------|
| **C2-S1** | Upload R2 + FFmpeg thumbnail + modèle DB | API publish sans UI polish |
| **C2-S2** | Player + fil vertical web | `/videos` consommable |
| **C2-S3** | Like + comment + share + report | Interactions complètes |
| **C2-S4** | Wow P0 + P1 temporal + admin minimal | Pilote-ready |
| **C2-S5** | Feed teaser + map + Expo | V2.1 |

## Feature flag

- `local_video_enabled` — default `false` prod until recette GO

## Métriques produit (MEASURE)

| Événement | Objectif pilote |
|-----------|-----------------|
| `local_video_published` | ≥ 30 vidéos semaine 1 |
| `local_video_feed_opened` | DAU/MAU ratio +20% vs baseline |
| `local_video_go_cta_clicked` | ≥ 15% des vues avec lieu |
| `local_video_completion_rate` | ≥ 40% watch > 50% duration |

## Rollback

- Flag off → routes `/videos` 404 propre
- R2 lifecycle rule : pas de delete auto MVP ; admin soft-delete

---

# 11. Open questions

| # | Question | Décision | Date |
|---|----------|----------|------|
| 1 | Feed public vs auth-only pilote | **Auth-only** pilote | 2026-06-12 |
| 2 | Durée max pilote C2 | **90 s** (VIDEO-04B.1, 2026-06-16) | 2026-06-16 |
| 3 | MOV transcode obligatoire | **Oui** via FFmpeg → MP4 | 2026-06-12 |
| 4 | Nom domaine API `local-videos` vs `videos` | **`local-videos`** (évite collision Stories) | 2026-06-12 |
| 5 | Expo dans MVP ou V2.1 | **V2.1** — web mobile-first pilote | 2026-06-12 |

---

# 12. Historique

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-06-12 | Founder + CTO | DISCOVER validé — création PRD |
| 2026-06-12 | CTO | Ajout contexte temporel P1 (FOMO local) |

---

# 13. BMAD — gates BUILD

> Backend mergé (VIDEO-01→03A). Gates frontend upload : VIDEO-04A–D.

## BUILD — gates (cocher avant premier commit)

- [x] PRD validé (sections 1–6 complètes)
- [x] ADR média validé (`ADR-CREATORS-V2-local-video-media.md` + VIDEO-03A)
- [x] Architecture identifiée (§6) — pipeline async documenté
- [x] Risques identifiés (§2, §7)
- [x] Permissions / authZ définies (§6, §7)
- [x] Endpoints + contrats définis (§6) — sync `docs/api/LOCAL-VIDEO-API.md`
- [x] Modèle DB + migrations (`local_videos`, social)
- [x] Wireframes DESIGN player + upload (`DESIGN-CREATORS-V2-local-video.md`)
- [ ] Client upload web (VIDEO-04B) + types (VIDEO-04A) + polling UX (VIDEO-04C)

## MEASURE — métriques cibles

Voir §10.

## DECIDE — post-pilote

- Scaler → si watch time + CTA Y aller validés
- Repousser Expo → si web pilote suffisant
- **Ne pas scaler** si FFmpeg/storage instables ou abus non maîtrisés

---

## Annexes

### Liens

- DISCOVER Founder vision : conversation 2026-06-12
- Audit C1 (archivé) : `docs/_archive/creators/C1-B1-existing-audit-bmad.md`
- API Local Video : `docs/api/LOCAL-VIDEO-API.md`
- ADR worker : `docs/adr/ADR-VIDEO-03A-async-media-processing-worker.md` (**IMPLEMENTED**)
- Stratégie média culturelle (R2 futur) : `docs/architecture/cultural-media-strategy.md`

### Séparation produit (ne pas confondre)

| Produit | Route | Durée de vie | Stockage actuel |
|---------|-------|--------------|-----------------|
| **Local Video V2** | `/videos` | Permanent feed | **R2** (nouveau) |
| Stories | `/stories` | Éphémère | Local disk |
| Partner Creator Content | feed + fiche partenaire | Modéré org | URL externe |
