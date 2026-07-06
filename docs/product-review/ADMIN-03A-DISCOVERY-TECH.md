# ADMIN-03A — Discovery technique (Passport Ops — lecture staff)

**Phase BMAD :** DISCOVER (pré-BUILD)  
**Feature :** FEATURE-ADMIN-V1 / ADMIN-03 Passport Ops  
**Ticket :** ADMIN-03A-DISCOVERY-TECH  
**Date :** 2026-06-03  
**Statut :** Spec technique validée CTO — **aucun code** dans ce ticket  
**Prérequis :** discovery produit ADMIN-03 (synthèse validée CTO, session 2026-06-03)

**Décisions CTO verrouillées :**

| Sujet | Décision |
|--------|----------|
| Périmètre produit | **ADMIN-03** = Citizen Passport Ops · **ADMIN-04** = Passport Offers (`/passport-offers` inchangé) |
| Statuts V1 | `active` \| `suspended` uniquement en API/UI staff |
| `revoked` | **Hors V1** (pas de BUILD, pas de PATCH) |
| Audit | Table `passport_admin_actions` en **ADMIN-03B** (pas 03A) |
| UI terrain | `/partner-scan` reste scan/redemption sur place |
| UI staff | `/passport-ops` workspace citoyen (ADMIN-03C) |
| Recherche priorité | `email` → `passport_number` → `display_name` → `city` (filtre scope) → `qr_fragment` (secondaire) |

**Base code auditée :** `main` post-merge PR #34 (`da16d6d`).

---

## 1. Scope par ticket

| Ticket | Backend | Frontend | Notes |
|--------|---------|----------|-------|
| **03A** | `GET /admin/passports`, `GET /admin/passports/{id}`, sous-listes stamps/redemptions paginées | — | Lecture seule, staff RBAC |
| **03B** | `PATCH /admin/passports/{id}` (`active`/`suspended`) + migration `passport_admin_actions` | — | Audit obligatoire, tests zones rouges |
| **03C** | — | `/passport-ops` liste + fiche + liens org/offre/partner | Consomme 03A/03B |

**03A n’inclut pas :** suspension, audit, exposition `qr_token` en liste, recherche full-text globale, `revoked`, mutations redemption.

---

## 2. Audit indexes & performance

### 2.1 `passports` (migration `20260519_0005_passport_foundation`)

| Besoin CTO | Mécanisme actuel | Verdict |
|------------|------------------|---------|
| `passport_number` | `UNIQUE uq_passports_passport_number` → index B-tree implicite PostgreSQL | ✅ Lookup **exact** O(1) |
| `user_id` | `ix_passports_user_id` | ✅ Join user / liste par citoyen |
| `city` | `ix_passports_city` | ✅ Filtre pilote Reims |
| `status` | `ix_passports_status` | ✅ Filtre optionnel staff |
| `qr_token` | `UNIQUE uq_passports_qr_token` | ✅ **Exact match** seulement ; fragment = seq scan acceptable en pilote |

**Index dédié `ix_passports_passport_number` :** **non requis** — la contrainte UNIQUE suffit.

**Index composite proposé V1 :** **aucun** — volumes pilote faibles (voir §6). Réévaluer `(city, status, updated_at DESC)` si > ~50k passports.

### 2.2 `users` (recherche email)

| Colonne | Index |
|---------|--------|
| `email` | `unique=True, index=True` sur `User.email` | ✅ Égalité case-insensitive (`lower(email) = lower(:input)`) |

### 2.3 `user_profiles` (recherche display_name)

| Colonne | Index |
|---------|--------|
| `display_name` | **Aucun** |
| `username` | UNIQUE + index (égalité / préfixe possible) |

**Stratégie display_name V1 :** `ILIKE '%' || :term || '%'` sur `user_profiles.display_name`, fallback `users.full_name` si profil absent. **Pas de migration trigram V1** — acceptable tant que < few thousand profiles actifs Reims.

### 2.4 `passport_stamps` / `passport_offer_redemptions`

| Table | Index pertinent |
|-------|-----------------|
| `passport_stamps` | `ix_passport_stamps_passport_id`, `ix_passport_stamps_stamped_at` |
| `passport_offer_redemptions` | `ix_passport_offer_redemptions_passport_id` (foundation migration) |

Listes paginées par `passport_id` + `ORDER BY created_at DESC` : **index-friendly**.

### 2.5 Contrainte métier

`uq_passports_one_active_per_user` (partiel `status = 'active'`) — un seul passport actif / user. La liste staff peut toutefois montrer **historique** (passports `suspended` ou anciens) si plusieurs lignes existent.

---

## 3. Stratégie de recherche (03A)

### 3.1 Paramètres query (`GET /admin/passports`)

| Paramètre | Type | Priorité | Comportement SQL |
|-----------|------|----------|------------------|
| `city` | string, défaut `Reims` | Scope territorial | `passports.city = :city` (index) |
| `email` | string optionnel | **1** | Join `users` · `lower(users.email) = lower(:email)` |
| `passport_number` | string optionnel | **2** | `passports.passport_number = :passport_number` (unique) |
| `display_name` | string optionnel | **3** | Join `users` + `user_profiles` · `display_name ILIKE :pattern` OR `users.full_name ILIKE :pattern` · `min_length=2` |
| `status` | `active` \| `suspended` optionnel | Filtre | `passports.status = :status` |
| `qr_fragment` | string optionnel | **4 (secondaire)** | `passports.qr_token = :qr_fragment` si longueur ≥ token complet **sinon** `qr_token LIKE :suffix` avec `min_length=12` · **refus** si `len < 12` |
| `page` / `page_size` | int | Pagination | Voir §4 |

**Règles de combinaison :**

1. `city` toujours appliqué (défaut cockpit).
2. Si **plusieurs** critères de recherche (`email`, `passport_number`, `display_name`, `qr_fragment`) : **priorité stricte** — le premier non vide gagne ; les autres ignorés (documenté OpenAPI). Évite AND ambigus.
3. Si **aucun** critère de recherche : liste paginée **tous passports de la ville** (browse ops) — ordre `passports.updated_at DESC`.
4. `qr_fragment` **interdit** seul comme premier critère si `email` / `passport_number` / `display_name` fournis.

**Rate limit recommandé (BUILD) :** `admin:passports:list:{actor_id}` — 120/h (aligné scan).

---

## 4. Pagination & constantes

Alignement **ADMIN-02B** (`admin_organization.py`) :

```python
ADMIN_PASSPORT_LIST_PAGE_SIZE_DEFAULT = 20
ADMIN_PASSPORT_LIST_PAGE_SIZE_MAX = 100
ADMIN_PASSPORT_SUBRESOURCE_PAGE_SIZE_DEFAULT = 20
ADMIN_PASSPORT_SUBRESOURCE_PAGE_SIZE_MAX = 50
DEFAULT_ADMIN_PASSPORTS_CITY = DEFAULT_COCKPIT_CITY  # "Reims"
```

**Réponses paginées :**

```python
class AdminPassportListResponse(BaseModel):
    items: list[AdminPassportListItem]
    total: int  # ge=0
    page: int   # ge=1
    page_size: int  # ge=1, le=MAX
```

Sous-ressources `…/stamps`, `…/redemptions` : même enveloppe `{ items, total, page, page_size }`.

---

## 5. Contrats Pydantic (03A)

Fichier cible : `backend/app/schemas/admin_passport.py`  
Router : `backend/app/api/v1/admin_passports.py`  
Service : `AdminPassportService` · Repo : `AdminPassportRepository`

### 5.1 Enums exposés staff V1

```python
# Réutiliser PassportStatus mais filtrer en service :
# API list/detail n'expose que active | suspended
# revoked présent en DB → masqué / 404 staff jusqu'à décision produit
```

### 5.2 `AdminPassportListItem`

| Champ | Type | Notes |
|-------|------|-------|
| `id` | UUID | |
| `user_id` | UUID | Lien futur fiche user |
| `city` | str | |
| `passport_number` | str | |
| `status` | `active` \| `suspended` | |
| `tier_code` | PassportTierCode | |
| `tier_name` | str | Dénormalisé lecture |
| `citizen_label` | str | `profile.display_name` → `user.full_name` → troncature email |
| `email` | str | **Staff PII** — liste autorisée |
| `stamps_count` | int ≥ 0 | Colonne `passports.stamps_count` |
| `redemptions_count` | int ≥ 0 | Colonne `passports.redemptions_count` |
| `activated_at` | datetime \| null | |
| `last_stamp_at` | datetime \| null | |
| `updated_at` | datetime | Tri liste |

**Exclus liste :** `qr_token`, `metadata`, `reputation_score` détaillé.

### 5.3 `AdminPassportUserSummary`

| Champ | Type |
|-------|------|
| `id` | UUID |
| `email` | str |
| `full_name` | str |
| `is_active` | bool |
| `is_verified` | bool |

### 5.4 `AdminPassportProfileSummary` (nullable)

| Champ | Type |
|-------|------|
| `username` | str \| null |
| `display_name` | str \| null |
| `avatar_url` | str \| null |

### 5.5 `AdminPassportTierSummary`

| Champ | Type |
|-------|------|
| `code` | PassportTierCode |
| `name` | str |

### 5.6 `AdminPassportStats`

| Champ | Type |
|-------|------|
| `stamps_count` | int |
| `redemptions_count` | int |
| `last_stamp_at` | datetime \| null |
| `reputation_score` | int |

### 5.7 `AdminPassportDetailResponse`

```python
class AdminPassportDetailResponse(BaseModel):
    passport: AdminPassportCore          # id, city, passport_number, status, dates…
    user: AdminPassportUserSummary
    profile: AdminPassportProfileSummary | None
    tier: AdminPassportTierSummary
    stats: AdminPassportStats
    links: AdminPassportDetailLinks
```

### 5.8 `AdminPassportCore` (détail)

| Champ | Type | Notes |
|-------|------|-------|
| `id` | UUID | |
| `user_id` | UUID | |
| `city` | str | |
| `passport_number` | str | |
| `status` | active \| suspended | |
| `qr_token` | str | **Staff-only détail** — jamais loggué |
| `onboarding_completed` | bool | |
| `activated_at` | datetime \| null | |
| `suspended_at` | datetime \| null | |
| `created_at` / `updated_at` | datetime | |

### 5.9 `AdminPassportDetailLinks`

| Champ | Exemple |
|-------|---------|
| `partner_scan` | `/partner-scan` (UI admin) |
| `offers_moderation` | `/passport-offers` |

Pas de lien « partner 360 » sans org — stamps portent `organization_id`.

### 5.10 `AdminPassportStampListItem`

| Champ | Type |
|-------|------|
| `id` | UUID |
| `organization_id` | UUID |
| `organization_name` | str |
| `organization_slug` | str |
| `stamp_source` | `organization` \| `qr` |
| `stamped_at` | datetime |
| `note` | str \| null |

### 5.11 `AdminPassportRedemptionListItem`

| Champ | Type |
|-------|------|
| `id` | UUID |
| `partner_offer_id` | UUID |
| `offer_title` | str |
| `organization_id` | UUID |
| `organization_name` | str |
| `status` | OfferRedemptionStatus |
| `redeemed_at` | datetime \| null |
| `created_at` | datetime |

### 5.12 Endpoints 03A

| Méthode | Route | Response |
|---------|-------|----------|
| GET | `/api/v1/admin/passports` | `AdminPassportListResponse` |
| GET | `/api/v1/admin/passports/{passport_id}` | `AdminPassportDetailResponse` |
| GET | `/api/v1/admin/passports/{passport_id}/stamps` | `AdminPassportStampListResponse` |
| GET | `/api/v1/admin/passports/{passport_id}/redemptions` | `AdminPassportRedemptionListResponse` |

**RBAC :** `require_any_permission("moderation.manage", "system.admin")` — identique cockpit / partners admin.

**Erreurs :**

| Code | HTTP | Quand |
|------|------|-------|
| `PASSPORT_NOT_FOUND` | 404 | UUID inconnu ou hors ville scope |
| `INVALID_PASSPORT_SEARCH` | 422 | display_name < 2 chars, qr_fragment < 12, paramètres contradictoires |
| `PASSPORT_STATUS_NOT_SUPPORTED` | 422 | filtre `revoked` (futur) |

---

## 6. Volumes attendus (pilote Reims)

| Entité | Ordre de grandeur V1 | Impact perf |
|--------|----------------------|-------------|
| Users actifs | 10² – 10³ | Email lookup indexé |
| Passports / city | 10² – 10³ | Liste browse paginée OK |
| Stamps / passport | 0 – 50 typique | Sous-liste ≤ 50/page |
| Redemptions / passport | 0 – 20 typique | Idem |
| Recherche display_name ILIKE | Scan profiles limité ville | Acceptable < 5k profils |

**Hypothèse BUILD :** pas de cache Redis liste ; invalidation simple.

---

## 7. Stratégie audit future (03B — hors 03A)

Table cible : `passport_admin_actions` (migration dédiée).

| Colonne | Type | Rôle |
|---------|------|------|
| `id` | UUID PK | |
| `passport_id` | UUID FK → passports CASCADE | index |
| `user_id` | UUID FK → users SET NULL | citoyen concerné |
| `action` | string(32) index | ex. `suspend`, `reactivate` |
| `actor_user_id` | UUID FK SET NULL | staff |
| `previous_status` | string(32) | |
| `new_status` | string(32) | |
| `reason` | text | obligatoire métier BUILD |
| `metadata` | JSONB nullable | IP, user-agent optionnel |
| `created_at` | timestamptz index | |

**PATCH 03B body :**

```python
class AdminPassportStatusPatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: Literal["active", "suspended"]
    reason: str = Field(min_length=3, max_length=1000)
```

Effets métier :

- `suspended` → set `suspended_at=now()`, bloque scan (`get_active_by_qr_token` déjà filtre `active`)
- `active` → clear `suspended_at`, réactive si pas d’autre contrainte user

**Pas de `revoked` en 03B.**

---

## 8. Sécurité & PII (BUILD gates)

- [ ] `qr_token` uniquement dans **detail** — jamais liste, jamais logs structurés
- [ ] Email citoyen : staff-only routes, pas de cache public CDN
- [ ] Tests : 401 non-auth, 403 non-staff, 404 cross-city (passport Reims, staff query autre ville)
- [ ] Pas de fuite `hashed_password` / refresh tokens dans joins
- [ ] Checklist `docs/ai/security-checklist.md` avant merge 03B (mutations)

---

## 9. Alignement frontend (03C — preview)

| Route | Rôle |
|-------|------|
| `/passport-ops` | Workspace : recherche (email, numéro, nom, ville) + tableau |
| `/passport-ops/[passportId]` | Fiche : infos, tampons, redemptions, actions suspend (03B) |
| `/partner-scan` | Inchangé — terrain |
| `/passport-offers` | Inchangé — ADMIN-04 |

Types miroir : `frontend/packages/types/src/admin-passport.ts` (BUILD 03C).

---

## 10. Checklist GO BUILD ADMIN-03A

- [ ] PRD §13 : permissions `moderation.manage` / `system.admin` confirmées
- [ ] Fichiers : `schemas/admin_passport.py`, `repositories/admin_passport_repository.py`, `services/admin_passport_service.py`, `api/v1/admin_passports.py`, `router.py` include
- [ ] Tests : `tests/test_admin_passports_api.py` — list by email, passport_number, display_name, city browse, detail 404, stamps/redemptions pagination, staff guard
- [ ] OpenAPI : descriptions priorités recherche
- [ ] **Aucune** migration en 03A (indexes existants suffisants)
- [ ] Frontend : **aucun** dans PR 03A (API-only)

---

## 11. Synthèse CTO

| Question | Réponse |
|----------|---------|
| Index `passport_number` ? | ✅ via UNIQUE `uq_passports_passport_number` |
| Index `user_id` / `city` ? | ✅ déjà présents |
| Email indexé ? | ✅ `users.email` unique + index |
| `display_name` index ? | ❌ — ILIKE pilote OK |
| `revoked` V1 ? | ❌ |
| Audit V1 ? | ❌ (03B) |
| Migration 03A ? | **Non** |

**Prochain ticket :** `ADMIN-03A-BUILD` (API lecture staff uniquement).
