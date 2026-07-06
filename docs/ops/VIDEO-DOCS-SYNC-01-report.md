# VIDEO-DOCS-SYNC-01 — Rapport de synchronisation documentaire

| Champ | Valeur |
|-------|--------|
| Ticket | VIDEO-DOCS-SYNC-01 |
| Feature | FEATURE-CREATORS-V2 — Local Video |
| Phase | DISCOVER / DOCUMENTATION |
| Date | 2026-06-29 |
| Scope | Documentation uniquement — **aucun code modifié** |

---

## 0. Référence code (tickets mergés)

| Ticket | PR | Commit merge `main` | Contenu |
|--------|-----|---------------------|---------|
| VIDEO-01A/B | #71 | `6fdf3a1` | Storage keys VIDEO-01B, presigned R2 |
| MEDIA-INFRA-V1 | — | (INFRA-01 checklist) | Buckets `yunicity-media-*`, CDN |
| VIDEO-03A | #72 | `02dfe3e` | HTTP 202, worker ARQ, processing_status |
| INFRA-03 | #73 | `46053f2` | Worker Railway, docs ops |

**Code = source de vérité.** Chaque ligne doc modifiée dans ce ticket répond à : « un ticket mergé ou un commit existant ».

---

## 1. Audit documentaire — inventaire Local Video

### Actifs (référence à jour post-sync)

| Document | Rôle |
|----------|------|
| `docs/prd/PRD-CREATORS-V2-local-video.md` | Spec produit — VERIFY |
| `docs/api/LOCAL-VIDEO-API.md` | **NEW** — contrats HTTP + types |
| `docs/architecture/MEDIA-PLATFORM.md` | Pipeline plateforme média |
| `docs/architecture/ADR-CREATORS-V2-local-video-media.md` | ADR stockage + FFmpeg |
| `docs/adr/ADR-VIDEO-03A-async-media-processing-worker.md` | Worker — **IMPLEMENTED** |
| `docs/creators/DESIGN-CREATORS-V2-local-video.md` | Wireframes UX |
| `docs/ops/INFRA-01-cloudflare-setup-checklist.md` | Provisionnement Cloudflare |
| `docs/ops/INFRA-03-railway-video-worker-setup.md` | Déploiement worker |
| `docs/ops/VIDEO-01-media-storage-readiness.md` | Readiness storage |
| `docs/ops/VIDEO-03B-arq-backoff-alignment.md` | Dette backoff ARQ |
| `docs/ops/MEDIA-MONITORING-SPEC.md` | KPIs média |
| `docs/qa/MEDIA-INFRA-V1-smoke-test.md` | Smoke recette |
| `docs/workflow/FEATURE-ROADMAP-POST-RC.md` | Roadmap post-RC |

### Obsolètes partiellement (sections historiques conservées + note)

| Document | Élément obsolète | Traitement |
|----------|------------------|------------|
| `docs/adr/ADR-VIDEO-03A-*.md` | § Contexte décrit FFmpeg sync | Note historique 2026-06-29 |
| `docs/architecture/ADR-CREATORS-V2-*.md` | Buckets `yunicity-local-video-*`, sync MVP | Remplacé par `yunicity-media-*` + worker |

### Remplacés

| Ancien | Remplacé par | Raison |
|--------|--------------|--------|
| Ticket roadmap **VIDEO-02** | **VIDEO-04A–D** | Backend upload mergé ; scope restant = client UX |
| Publish HTTP **201** sync | **202** + polling | PR #72 VIDEO-03A |
| Buckets `yunicity-local-video-*` | `yunicity-media-{env}` | MEDIA-INFRA-V1 |

### Dupliqués (chevauchement accepté — rôles distincts)

| Zone | Documents | Note |
|------|-----------|------|
| Clés storage | ADR-CREATORS-V2, MEDIA-PLATFORM §7, VIDEO-01, LOCAL-VIDEO-API | v1 `local-video/{city}/{id}/` — cohérent |
| Pipeline | MEDIA-PLATFORM, ADR-VIDEO-03A, LOCAL-VIDEO-API | MEDIA-PLATFORM = vue plateforme ; ADR = décision worker |

### Archivés (`docs/_archive/`)

| Document | Stub conservé |
|----------|---------------|
| `docs/_archive/creators/C1-B1-existing-audit-bmad.md` | `docs/creators/C1-B1-existing-audit-bmad.md` |

Index : `docs/_archive/README.md`

---

## 2. Grep VIDEO-02 — références

### Avant sync

7 occurrences — **toutes** dans `docs/workflow/FEATURE-ROADMAP-POST-RC.md`.

### Après sync

| Fichier | Occurrences | Statut |
|---------|-------------|--------|
| `FEATURE-ROADMAP-POST-RC.md` | 3 | **Intentionnelles** — mention « remplace VIDEO-02 » + note obsolescence |

**Aucune référence VIDEO-02 active** comme ticket ouvert.

### Remplacement appliqué

| Ancienne référence | Nouvelle référence |
|--------------------|-------------------|
| VIDEO-02 Upload (backend) | VIDEO-01 + VIDEO-03A ✅ merged |
| VIDEO-02 Upload (client) | VIDEO-04A, 04B, 04C, 04D |
| VIDEO-04 Engagement | **VIDEO-05** (renumerotation roadmap) |
| VIDEO-05 Moderation | **VIDEO-06** |

---

## 3. Documents synchronisés (détail)

| Document | Changements clés | Justification |
|----------|------------------|---------------|
| `PRD-CREATORS-V2-local-video.md` | 202, worker, processing_status, gates VERIFY | PR #72 |
| `LOCAL-VIDEO-API.md` | **Créé** — schemas, polling, storage keys | Code `schemas/local_video.py` |
| `ADR-CREATORS-V2-local-video-media.md` | Clés VIDEO-01B, buckets media, async worker | PR #71, #72, MEDIA-PLATFORM |
| `ADR-VIDEO-03A-*.md` | Metadata merge, note historique, Railway ✅ | PR #72, #73 |
| `MEDIA-PLATFORM.md` | Risque FFmpeg sync → résolu | VIDEO-03A |
| `VIDEO-01-media-storage-readiness.md` | Worker ✅, buckets, flux 202 | PR #72, #73 |
| `MEDIA-INFRA-V1-smoke-test.md` | 202, polling, exit 6/7, worker précondition | Script smoke + PR #72 |
| `MEDIA-MONITORING-SPEC.md` | SLO processing worker | VIDEO-03A déployé |
| `FEATURE-ROADMAP-POST-RC.md` | VIDEO-04A–D, état 2026-06-29, renum 05/06 | VIDEO-04-AUDIT-01 |
| `architecture/README.md` | Liens MEDIA-PLATFORM, LOCAL-VIDEO-API, ADR-03A | Index doc |

---

## 4. Vérification cohérence

### Pipeline documenté (aligné code)

```
Upload-init → PUT R2 → POST publish (202)
→ Redis yunicity-media-video → Worker ARQ → FFmpeg
→ processed.mp4 + thumbnail.jpg → CDN → published
```

### Types documentés

| Type | Backend | `packages/types` | Action |
|------|---------|------------------|--------|
| `LocalVideoPublishAcceptedResponse` | ✅ | ❌ | VIDEO-04A |
| `processing_status` | ✅ | ❌ | VIDEO-04A |
| Publish HTTP 202 | ✅ | (client absent) | VIDEO-04A/B |

**Écart TS documenté** dans `LOCAL-VIDEO-API.md` — pas de modif code (hors scope).

### Liens

- Stub C1-B1 → archive ✅
- Nouveaux liens `docs/api/LOCAL-VIDEO-API.md` depuis PRD, ADR, README ✅
- Aucun lien vers bucket `yunicity-local-video-*` comme cible active (mentions historiques OK)

### Références restantes (HORS SCOPE doc sync — tickets futurs)

| Référence | Statut | Ticket |
|-----------|--------|--------|
| Client upload web absent | Code | VIDEO-04B |
| Types TS incomplets | Code | VIDEO-04A |
| Durées tier 90s/3min/5min | Code 60s | VIDEO-04D |
| Magic bytes | Non implémenté | TBD prod gate |
| Backoff ARQ 30/120/300 vs fixe 30s | Dette | VIDEO-03B |
| Migration clés `media/video/...` | Future | ticket dédié |

---

## 5. Traçabilité modifications

Toutes les modifications de ce ticket sont **documentation only**, traçables :

```
Feature: FEATURE-CREATORS-V2
Ticket doc: VIDEO-DOCS-SYNC-01
Commits code référencés: 6fdf3a1, 02dfe3e, 46053f2
PRs: #71, #72, #73
```

**Non créé** : DOC-GOV-01 (ticket séparé, comme demandé).

---

## 6. Synthèse exécutive

| Catégorie | Nombre |
|-----------|--------|
| Documents actifs synchronisés | 12 |
| Documents créés | 2 (`LOCAL-VIDEO-API.md`, ce rapport) |
| Documents archivés | 1 (+ README archive) |
| Références VIDEO-02 réparées | 7 → 0 actives |
| Incohérences majeures restantes | 0 doc (écarts code client = VIDEO-04A–D) |

**Verdict CTO doc** : documentation Local Video **cohérente avec l'état mergé** VIDEO-01 → VIDEO-03A + INFRA-03. Prochaine vague documentaire optionnelle : DOC-GOV-01 (gouvernance globale docs).
