# C1-B1 — Existing Audit & Technical BMAD

**Feature** : FEATURE-CREATORS-V1  
**Sprint** : C1 — Public Experience  
**Ticket** : C1-B1  
**Phase** : AUDIT (DISCOVER)  
**Date** : 2026-06-12  
**Statut** : Audit read-only — **aucun code, aucune migration, aucun endpoint**  
**Prérequis** : Creators-V1-B0 validé (cadrage produit) · Passport V2 clôturé

**Méthode** : scan exclusif du repo (`frontend/apps/web`, `frontend/apps/admin`, `backend/app`, `packages/types`, `packages/utils`, tests, docs discovery/QA).

---

## 1. Synthèse exécutive

Yunicity possède aujourd’hui **deux domaines distincts** souvent confondus sous le mot « créateur » :

| Domaine | Statut code | Périmètre C1 |
|---------|-------------|--------------|
| **Partner Creator Content** | **Complet** (org partenaire → modération → feed + fiche partenaire) | Socle réutilisable |
| **Stories** (`/stories`) | **Complet** (UGC citoyen éphémère, API `/stories`) | **Hors C1** — produit parallèle |
| **Programme créateurs territorial** (`creator_profiles`, profil public, intégrations quartiers/lieux) | **Absent** (PRD-301 V2+) | **Cœur C1** |

**Constat CTO** : C1 Public Experience n’est **pas un greenfield total**. Environ **30 % KEEP** (pipeline contenu partenaire, feed `partner_creator`, API liste publique, modération admin). Environ **55 % NEW** (fiche contenu dédiée, profil créateur, APIs detail/profile, intégrations territoriales). Environ **15 % REBUILD** (présentation feed/fiche partenaire encore « organisation », pas « créateur »).

**Risque produit n°1** : le label nav admin « Créateurs » et la route `/creator-content` désignent la **modération de contenus partenaires**, pas le futur programme territorial citoyen.

**Risque technique n°1** : aucun endpoint public `GET …/creator-content/{id}` ni table `creator_profiles` — bloquant pour C1-02 et C1-03.

---

## 2. Audit Web (`frontend/apps/web`)

### 2.1 Routes

| Fichier | Constat | Décision |
|---------|---------|----------|
| `app/passport/page.tsx` | Passport V2 citoyen — niveau `press_creator` affiché via utils, **sans lien créateur** | **KEEP** (hors C1) |
| `app/stories/page.tsx`, `app/stories/new/page.tsx` | Portail Stories citoyen (protégé) | **KEEP** — hors périmètre C1 |
| `app/organizations/me/partner/creator-content/page.tsx` | CRUD partenaire (draft → submit) | **KEEP** — hors C1 public |
| `app/feed` (via `feed-portal-screen`) | Affiche posts `partner_creator` | **REBUILD** — C1-01 |
| **Aucune** `app/creators/**` | Profil créateur public absent | **NEW** — C1-03 |
| **Aucune** `app/content/**` ou `app/creator-content/[id]` | Détail contenu public absent | **NEW** — C1-02 |
| `app/partners/[slug]` (fiche partenaire) | Section contenus via `listPartnerCreatorContent` | **KEEP** + **REBUILD** présentation |

### 2.2 Composants — Partner Creator Content (public)

| Fichier | Constat | Décision |
|---------|---------|----------|
| `components/partners/partner-creator-content-card.tsx` | Card liste sur fiche partenaire ; excerpt + date | **KEEP** → **REBUILD** (hiérarchie C1) |
| `components/partners/partner-detail-screen.tsx` | Charge `api.listPartnerCreatorContent(slug)` | **KEEP** |
| `components/feed/feed-card.tsx` | Route `partner_creator` → `OrganizationPostCard` | **REBUILD** |
| `components/feed/feed-card-shell.tsx` | Variante visuelle `partner_creator` | **REBUILD** |
| `components/feed/organization-post-card.tsx` | Rendu « Lieu partenaire » institutionnel | **REBUILD** — ton créateur attendu C1 |
| `components/feed/portal/feed-portal-screen.tsx` | Feed principal Reims | **KEEP** structure |
| `components/feed/portal/feed-stories-rail.tsx` | Rail Stories (anneaux) | **KEEP** — ne pas confondre avec creator content |

### 2.3 Composants — Stories (hors C1)

| Fichier | Constat | Décision |
|---------|---------|----------|
| `components/stories/*` (9 fichiers) | Écran, cards, création, rails | **KEEP** — **ne pas DELETE** ; documenter exclusion C1 |

### 2.4 Composants — Partner portal (hors C1 public)

| Fichier | Constat | Décision |
|---------|---------|----------|
| `components/partner-portal/partner-portal-creator-content.tsx` | Gestion brouillon/soumission | **KEEP** |
| `hooks/use-partner-portal-context.tsx` | `organizationCreatorContent.listContents` | **KEEP** |

### 2.5 Hooks

| Fichier | Constat | Décision |
|---------|---------|----------|
| `hooks/use-stories-portal-context.ts` | Contexte Stories | **KEEP** (hors C1) |
| `hooks/use-stories-list.ts` | Pagination stories | **KEEP** (hors C1) |
| `hooks/use-partner-portal-context.tsx` | Creator content partenaire | **KEEP** (hors C1 public) |
| **Aucun** `use-creator-*` / `use-creator-content-*` public | — | **NEW** — C1-01 à C1-03 |

### 2.6 Types (`@yunicity/types`)

| Fichier | Constat | Décision |
|---------|---------|----------|
| `partner-creator-content.ts` | `PartnerCreatorContentPublic`, statuts, DTOs admin | **KEEP** — étendre si profil créateur |
| `feed.ts` | `FeedPostType: partner_creator`, `FeedCreatorContentMeta` | **KEEP** |
| `story.ts` | Domaine Stories | **KEEP** (hors C1) |
| `passport.ts` | Tier `press_creator` | **KEEP** (hors C1 — réputation, pas contenu) |
| **Absent** `creator-profile.ts` | — | **NEW** |

### 2.7 Utils / presenters (`@yunicity/utils`)

| Fichier | Constat | Décision |
|---------|---------|----------|
| `partner-creator-content.ts` | `formatPartnerCreatorContentExcerpt`, `hasPartnerCreatorContentMedia` | **KEEP** |
| `partners-api.ts` | `listPartnerCreatorContent(slug)` | **KEEP** |
| `organization-creator-content-api.ts` | Client org (privé) | **KEEP** |
| `feed-portal.ts` | `buildFeedStoryShortcuts` — **Stories only** | **KEEP** |
| `partner-portal-labels.ts` | Copy fiche partenaire | **REBUILD** partiel |
| `stories-api.ts`, `stories-portal.ts` | API Stories | **KEEP** (hors C1) |
| **Absent** presenter détail contenu / profil créateur | — | **NEW** |

### 2.8 Intégrations territoriales web (état actuel)

| Surface | Constat | Décision |
|---------|---------|----------|
| **Explorer / Search** | Pas de type résultat « créateur » ni contenu creator | **NEW** — C1-04 |
| **Quartiers** | `editorial_excerpt` lieux ; pas de creator content | **NEW** — C1-04 |
| **Lieux / Places** | Idem | **NEW** — C1-04 |
| **Événements** | `creator_meetup` comme `event_type` dans seeds ; pas de lien `partner_creator_content` | **NEW** — C1-04 |

---

## 3. Audit Backend (`backend/app`)

### 3.1 Modèles

| Élément | Existe ? | Constat | Décision |
|---------|----------|---------|----------|
| `PartnerCreatorContent` | ✅ Complet | `title`, `body`, `media_url`, `status`, org FK, modération | **KEEP** |
| `CreatorContentAdminAction` | ✅ Complet | Audit staff approve/reject/archive | **KEEP** (hors C1 public) |
| `Post.partner_creator_content_id` | ✅ Partiel | Sync feed 1–1 | **KEEP** |
| `creator_profiles` | ❌ Absent | PRD-301 — non migré | **NEW** (si C1 inclut profils territoriaux) |
| `creator_posts` | ❌ Absent | PRD-301 | **NEW** ou réutiliser `PartnerCreatorContent` — **décision B0** |
| Lien `neighborhood_id` / `local_event_id` / `place_id` sur contenu | ❌ Absent | Pas d’ancrage territorial en DB | **NEW** — C1-04 |

### 3.2 Schémas Pydantic

| Fichier | Existe ? | Décision |
|---------|----------|----------|
| `partner_creator_content_management.py` | ✅ Complet | **KEEP** |
| `admin_partner_creator_content.py` | ✅ Complet | **KEEP** |
| `partner_creator_content_public.py` | ✅ Liste publique | **KEEP** — **étendre** pour detail si même entité |
| `feed.py` (`FeedCreatorContentMeta`) | ✅ Complet | **KEEP** |
| Schéma profil créateur public | ❌ Absent | **NEW** |

### 3.3 Repositories & services

| Service | Existe ? | Décision |
|---------|----------|----------|
| `PartnerCreatorContentService` | ✅ CRUD + modération | **KEEP** |
| `PublicPartnerCreatorContentService` | ✅ Liste par slug partenaire | **KEEP** |
| `FeedCreatorContentSyncService` | ✅ Upsert post feed à l’approve | **KEEP** |
| `AdminPartnerCreatorContentService` | ✅ Audit actions | **KEEP** |
| Service profil créateur | ❌ Absent | **NEW** |
| Service détail contenu public par `id` | ❌ Absent | **NEW** |

### 3.4 Routers / API

| Endpoint | Existe ? | Décision |
|----------|----------|----------|
| `GET /api/v1/partners/{slug}/creator-content` | ✅ Liste publiée | **KEEP** |
| `GET /api/v1/feed` (posts `partner_creator`) | ✅ Via feed général | **KEEP** |
| `POST /organizations/me/creator-content` (+ PATCH, submit) | ✅ Partenaire | **KEEP** |
| `GET/POST /admin/partner-creator-content/*` | ✅ Modération | **KEEP** |
| `GET /api/v1/partners/{slug}/creator-content/{id}` | ❌ Absent | **NEW** — C1-02 |
| `GET /api/v1/creators/{slug}` ou `/creators/{id}` | ❌ Absent | **NEW** — C1-03 |
| `GET /api/v1/stories/*` | ✅ Domaine Stories | **KEEP** (hors C1) |

### 3.5 RBAC & états éditoriaux

| Élément | Constat | Décision |
|---------|---------|----------|
| Statuts `draft → pending_review → published \| rejected → archived` | ✅ Machine complète (`partner_creator_content_workflow.py`) | **KEEP** |
| Permission dédiée `creator.*` | ❌ Absent — réutilise `offer_manager` + `moderation.manage` | **KEEP** V1 ; **NEW** si profils créateurs individuels |
| `press_creator` (Passport tier) | ✅ Partiel — notification/level service | **KEEP** hors C1 contenu |
| Badge famille `creator` (Passport) | ✅ Partiel | **KEEP** hors C1 |

### 3.6 Tests backend (preuve couverture)

| Fichier | Couverture |
|---------|------------|
| `test_partner_creator_content_api.py` | CRUD partenaire |
| `test_admin_partner_creator_content_api.py` | Approve/reject |
| `test_partner_creator_content_public_api.py` | Liste publique |
| `test_partner_creator_content_feed_sync.py` | Sync feed |
| `test_admin_partner_creator_content_actions_audit_api.py` | Audit |

**Absent** : tests API profil créateur, détail public par id.

---

## 4. Audit Admin (`frontend/apps/admin`)

> Admin = hors sprint C1 public, mais audit nécessaire pour éviter les collisions de nommage.

### 4.1 Routes

| Route | Constat | Décision |
|-------|---------|----------|
| `/creator-content`, `/creator-content/[id]` | Workspace modération contenus partenaires (QA-07 GO conditionnel) | **KEEP** |
| `/moderation` | Signalements citoyens (Trust & Safety) | **KEEP** — distinct de creator content |
| **Pas de** `/creators` | — | **NEW** possible plus tard (hub programme) — ne pas confondre avec C1 public |

### 4.2 Capacités modération creator content

| Capacité | Implémenté | Décision |
|----------|------------|----------|
| List + filtres | ✅ | **KEEP** |
| Detail fiche 360° | ✅ | **KEEP** |
| Approve (= publish + feed sync) | ✅ | **KEEP** |
| Reject / Archive | ✅ (réserve UI reject sur `published` — QA07) | **KEEP** + **REBUILD** UI mineur |
| Audit timeline | ✅ `creator_content_admin_actions` | **KEEP** |

### 4.3 Hooks & API clients

| Fichier | Décision |
|---------|----------|
| `use-admin-creator-content-list.ts`, `use-admin-creator-content.ts` | **KEEP** |
| `partner-creator-content-admin-api.ts` (packages/utils) | **KEEP** |
| `admin-creator-content.ts`, `admin-creator-content-command.ts` | **KEEP** |

---

## 5. Matrice finale

Légende : **✓** = décision retenue pour C1.

| Élément | KEEP | REBUILD | DELETE | NEW |
|---------|:----:|:-------:|:------:|:---:|
| **Feed Public** | ✓ | ✓ | | |
| **Content Detail** | | ✓ (liens depuis feed) | | ✓ |
| **Creator Profile** | | | | ✓ |
| **API List** | ✓ | | | |
| **API Detail** | | | | ✓ |
| **API Profile** | | | | ✓ |
| **Explorer Integration** | | | | ✓ |
| **Quartiers Integration** | | | | ✓ |
| **Lieux Integration** | | | | ✓ |
| **Événements Integration** | ✓ (type `creator_meetup` seed) | | | ✓ |

### Lecture matrice

| Élément | Verdict détaillé |
|---------|------------------|
| **Feed Public** | Infrastructure `partner_creator` + sync feed **KEEP** ; carte `OrganizationPostCard` et hiérarchie **REBUILD** |
| **Content Detail** | Aucune route/API détail **NEW** ; navigation depuis feed **REBUILD** |
| **Creator Profile** | Entité + route + API **100 % NEW** (PRD-301 non implémenté) |
| **API List** | `GET partners/{slug}/creator-content` + feed **KEEP** |
| **API Detail / Profile** | **NEW** |
| **Intégrations territoriales** | Quasi **100 % NEW** ; seul seed event `creator_meetup` **KEEP** comme ancrage futur |

---

## 6. Dette technique

### Bloquante (doit être traitée avant ou pendant C1)

| # | Dette | Preuve |
|---|-------|--------|
| B1 | **Pas d’API publique détail contenu** | Seul `GET /partners/{slug}/creator-content` (liste) dans `backend/app/api/v1/partners.py` |
| B2 | **Pas de modèle `creator_profiles`** | Absent de `backend/app/models/` ; PRD-301 §tables futures |
| B3 | **Ambiguïté produit Stories vs Creator Content** | `/stories` (API `stories.py`) vs `partner_creator` (feed) — deux stacks parallèles |
| B4 | **Pas d’ancrage territorial sur contenu** | `PartnerCreatorContent` sans FK quartier/lieu/event — ADMIN-06A §2.1 |

### Mineure

| # | Dette | Preuve |
|---|-------|--------|
| M1 | Feed card « Lieu partenaire » pas « Créateur » | `organization-post-card.tsx` L9–10 |
| M2 | Admin : bouton Reject sur `published` → 422 API | `docs/qa/QA-07-creators-report.md` §3 |
| M3 | Filtre organisation admin côté client (100 lignes max) | QA-07 §1.6 |
| M4 | KPI strip admin = page courante, pas total global | QA-07 §1.12 |
| M5 | Pas de deep link feed post → contenu source | `FeedCreatorContentMeta.partner_creator_content_id` non consommé en navigation web |

### Cosmétique

| # | Dette | Preuve |
|---|-------|--------|
| C1 | Nav admin « Créateurs » vs route `/creator-content` | `admin-nav-items.ts` — attente produit non alignée (QA-07 §écarts) |
| C2 | Tier Passport `press_creator` nommé « créateur » | `passport-level-labels.ts` — hors programme contenu |
| C3 | Copy partenaire EN/FR mixte sidebar admin | QA-07 navigation |

---

## 7. Ratio C1 — estimation BMAD

Comptage par **effort fonctionnel C1 Public Experience** (pas lignes de code) :

| Catégorie | % estimé | Justification |
|-----------|----------|---------------|
| **KEEP** | **~30 %** | Pipeline `PartnerCreatorContent` bout-en-bout, feed sync, types/utils publics, liste API, section fiche partenaire, modération admin (hors scope public mais stable) |
| **REBUILD** | **~15 %** | Présentation feed (`OrganizationPostCard`), cards fiche partenaire, liens navigation, copy « créateur » vs « organisation » |
| **DELETE** | **~0 %** | Rien à supprimer — Stories et partner portal restent ; risque régression si DELETE |
| **NEW** | **~55 %** | Profil créateur, page détail contenu, APIs detail/profile, 4 intégrations territoriales, possible table `creator_profiles` + migrations |

```
Creator C1 ≈ 30 % KEEP · 15 % REBUILD · 0 % DELETE · 55 % NEW
```

**Interprétation CTO** : C1 est majoritairement **construction de surface publique** sur un **socle partenaire déjà modéré**, pas une réécriture backend complète — **sauf** si B0 impose `creator_profiles` distinct de `PartnerCreatorContent` (décision à figer en C1-B2 design).

---

## 8. Décisions CTO proposées

| # | Décision | Recommandation |
|---|----------|----------------|
| D1 | Périmètre entité C1 | **Option A (pragmatique)** : étendre `PartnerCreatorContent` + APIs public detail. **Option B (PRD strict)** : introduire `creator_profiles` — plus de NEW, migration requise. **À trancher post-B0.** |
| D2 | Stories | **KEEP séparé** — ne pas fusionner dans C1 ; documenter dans QA C1-06 |
| D3 | Feed | **REBUILD** carte `partner_creator` — ne pas créer un second type feed |
| D4 | Admin `/creator-content` | **KEEP** tel quel — pas de renommage en C1 (cosmétique C1-05) |
| D5 | Intégrations territoriales | **NEW** incrémental — commencer par feed + fiche partenaire avant quartiers/lieux |
| D6 | Passport `press_creator` | **Hors C1** — pas de couplage automatique profil créateur |

---

## 9. Roadmap C1 — validation / ajustements

| Ticket | Verdict audit | Ajustement proposé |
|--------|---------------|-------------------|
| **C1-01 Feed Public** | Socle **KEEP**, UX **REBUILD** | Enrichir `partner_creator` : auteur créateur, CTA détail, métadonnées territoriales quand disponibles |
| **C1-02 Content Detail** | **100 % NEW** | Route web + `GET` public par `id` ; réutiliser DTO `PartnerCreatorContentPublic` étendu |
| **C1-03 Creator Profile** | **100 % NEW** | Dépend D1 (profil org enrichi vs `creator_profiles` utilisateur) |
| **C1-04 Territorial Integrations** | **~90 % NEW** | Prioriser : feed → quartier detail → lieu → event ; pas de FK aujourd’hui |
| **C1-05 UX Polish** | **REBUILD** + cosmétique | Aligner copy, mobile, hiérarchie ; traiter M1–M5 si dans scope |
| **C1-06 QA & Hardening** | **NEW** doc | S’inspirer de `docs/qa/PASSPORT-V2-RECIPES.md` ; rejouer pipeline approve → feed → détail |

### Ordre de build recommandé

```
C1-B2 Design (D1 entité) → C1-02 Detail API+UI → C1-01 Feed REBUILD
→ C1-03 Profile → C1-04 Integrations (par surface) → C1-05 → C1-06
```

### Hors scope C1 confirmé par l’audit

- Modération admin (déjà livrée ADMIN-06)
- Portail partenaire CRUD
- Stories `/stories`
- Passport tier `press_creator`
- Monétisation / missions / analytics créateur (PRD V3)

---

## 10. Références code (ancrage audit)

| Domaine | Fichiers clés |
|---------|---------------|
| Modèle | `backend/app/models/partner_creator_content.py` |
| Workflow | `backend/app/core/partner_creator_content_workflow.py` |
| API publique | `backend/app/api/v1/partners.py` L109+ |
| Feed sync | `backend/app/services/feed_creator_content_sync.py` |
| Web feed | `frontend/apps/web/components/feed/feed-card.tsx` |
| Web fiche | `frontend/apps/web/components/partners/partner-detail-screen.tsx` |
| Admin | `frontend/apps/admin/app/(protected)/creator-content/` |
| Types | `frontend/packages/types/src/partner-creator-content.ts` |
| PRD futur | `docs/prd/PRD-301-passport-benefits-foundation.md` §Creator Territorial |
| Discovery admin | `docs/product-review/ADMIN-06A-CREATORS-DISCOVERY.md` |
| QA admin | `docs/qa/QA-07-creators-report.md` |

---

**C1-B1 terminé — prêt review CTO**
