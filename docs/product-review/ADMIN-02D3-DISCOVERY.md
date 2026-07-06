# ADMIN-02D3 — Discovery Actions (Partner Status & Profile)

**Phase BMAD :** DISCOVER (pré-BUILD) — document de référence  
**Feature :** FEATURE-ADMIN-V1 / ADMIN-02 Partners  
**Ticket :** ADMIN-02D3-DISCOVERY-ACTIONS  
**Date :** 2026-06-03 (audit actualisé post-livraison)  
**Statut :** Discovery validée — **implémentée** (aucune modification code dans ce ticket)

| Livrable | PR | Statut |
|----------|-----|--------|
| ADMIN-02D1 Read API | #28 | ✅ |
| ADMIN-02D2 Detail page | #29 | ✅ |
| ADMIN-02D3A Backend actions | #30 | ✅ |
| ADMIN-02D3B Frontend actions UI | #31 | ✅ |
| ADMIN-02D3C Audit UI / polish | — | ⏳ optionnel |

**Base audit :** `main` @ merge PR #33 (`9a50995`) — code 02D3A/B présent.

---

## 0. Synthèse exécutive

Premier ticket admin avec **mutations réelles** sur le cycle de vie partenaire. La discovery a retenu **Option B** (POST explicites + PATCH limité), une table d’audit dédiée, et des garde-fous stricts. L’implémentation actuelle suit ces décisions avec quelques écarts documentés (§10).

**Principe :** `verification_status` (org) et `partner_status` (profil) restent des axes distincts ; la pause ne force pas `visibility=private`.

---

## 1. État du modèle

### 1.1 `PartnerProfile` (`backend/app/models/partner_profile.py`)

| Champ | Rôle |
|--------|------|
| `organization_id` | 1 profil / org (unique) |
| `partner_status` | `signed`, `active`, `paused`, `premium`, `founding_partner` |
| `partnership_type` | Typologie métier (requis à la création) |
| `signed_at`, `activated_at` | Jalons cycle de vie |
| `is_featured`, `featured_priority` | Catalogue (priority non exposé admin V1) |
| `public_partner_label` | Libellé catalogue |
| `contract_reference`, contacts, `notes_internal` | **CRM interne — hors API admin V1** |

Pas de `paused_at`. Pas de lien auto entre `paused` et `verification_status=suspended`.

### 1.2 `Organization`

| Champ | Valeurs pertinentes |
|--------|---------------------|
| `verification_status` | `pending`, `under_review`, `verified`, `rejected`, `suspended` |
| `visibility` | `private`, `public`, `unlisted` |

Review org : `POST /api/v1/organizations/{id}/review` — ne crée pas de profil, ne change pas `visibility`.

### 1.3 Effet produit de `partner_status`

`PUBLIC_PARTNER_STATUSES` = `{active, premium, founding_partner}`.

Hors ensemble → catalogue public, QR, gates events/creator content, offres publiques filtrées.

### 1.4 Création de profil (hors admin)

| Chemin | Crée profil ? |
|--------|----------------|
| `PartnerLeadService.convert_lead` | Non |
| Seeds Reims | Oui |
| `POST …/admin/partners/…/profile` | Oui (staff) |

### 1.5 Journalisation

| Mécanisme | Réutilisable 02D3 ? |
|-----------|---------------------|
| `organization_verifications` | Non (agrégat vérification org) |
| **`partner_admin_actions`** | **Oui — livré 02D3A** |

Champs audit : `action`, `actor_user_id`, `previous_status`, `new_status`, `previous_visibility`, `new_visibility`, `reason`, `metadata`, `created_at`.

---

## 2. Réponses — questions backend

| # | Question | Décision discovery | **Implémenté (code actuel)** |
|---|----------|-------------------|------------------------------|
| 1 | Transitions autorisées ? | Matrice §3 | Oui — via handlers dédiés, pas de PATCH `partner_status` |
| 2 | `verified` avant activation ? | Oui | Oui — `ORGANIZATION_NOT_VERIFIED` |
| 3 | Profil requis avant activation ? | Oui | Oui — `PARTNER_PROFILE_NOT_FOUND` |
| 4 | Créer profil séparé de activation ? | Oui | Oui — `POST …/profile` puis `POST …/activate` |
| 5 | Activation → `visibility=public` ? | Opt-in recommandé | **Opt-in strict** : `visibility` appliquée **uniquement** si présente dans le body activate |
| 6 | Pause → visibility ? | Ne pas forcer private | Oui — pause ne touche pas `Organization.visibility` |
| 7 | Premium exige active ? | Oui | Oui — 422 si statut ≠ `active` |
| 8 | `founding_partner` modifiable V1 ? | Non | Non — aucune route ; seeds seulement |
| 9 | Champs safe PATCH ? | visibility, featured, label | Oui — `AdminPartnerPatchRequest` `extra=forbid` |
| 10 | Table audit utilisable ? | Créer table | **`partner_admin_actions`** (migration `20260603_0029`) |

### 2.1 Matrice `partner_status` V1 (autorisée)

```text
(create profile) → signed
signed ──activate──▶ active ──upgrade-premium──▶ premium
  ▲                    │                           │
  │                    │ pause                       │ pause
  │                    ▼                           ▼
  └──── activate ─── paused ◀───────────────────────┘
```

| Transition | Endpoint | Préconditions |
|------------|----------|---------------|
| → `signed` | `POST …/profile` | org `verified`, pas de profil |
| `signed` → `active` | `POST …/activate` | org `verified`, profil `signed` ; `activated_at = now` |
| `paused` → `active` | `POST …/activate` | profil `paused` ; **`activated_at` conservé** |
| `active` → `premium` | `POST …/upgrade-premium` | statut `active` |
| `active` \| `premium` → `paused` | `POST …/pause` | — |
| `*` → `founding_partner` | — | **Interdit** |
| `premium` → `active` (downgrade) | — | **Interdit** |
| `active` → `signed` | — | **Interdit** |

---

## 3. Actions autorisées V1

| Action | Effet | Endpoint livré |
|--------|-------|----------------|
| Créer profil | Insert profil `signed`, `signed_at=now` | `POST /api/v1/admin/partners/{organization_id}/profile` |
| Activer / réactiver | `signed\|paused` → `active` | `POST …/activate` |
| Pause | `active\|premium` → `paused` | `POST …/pause` |
| Premium | `active` → `premium` | `POST …/upgrade-premium` |
| Réglages | visibility (org), `is_featured`, `public_partner_label` | `PATCH …/admin/partners/{organization_id}` |

**RBAC :** `moderation.manage` \| `system.admin` (identique cockpit / D1).

**Capabilities GET detail (livré) :**

| Flag | Condition |
|------|-----------|
| `can_create_profile` | org `verified`, sans profil |
| `can_activate` | org `verified` + profil `signed` **ou** `paused` |
| `can_pause` | `active` ou `premium` |
| `can_upgrade_premium` | `active` |
| `can_update_settings` | profil existant |

Pas de `can_reactivate` séparé — fusionné dans `can_activate`.

---

## 4. Actions interdites V1

- PATCH / POST avec `partner_status` libre (`AdminPartnerPatchRequest` : `extra=forbid`)
- Activation sans org `verified`
- Activation sans profil
- Création profil si profil existe (409) ou org non verified
- Transitions hors matrice (422 `INVALID_PARTNER_STATUS_TRANSITION`)
- `is_featured=true` si statut ∉ `{active, premium, founding_partner}`
- `visibility` `public` / `unlisted` si org non `verified`
- Exposition CRM (`notes_internal`, contacts) dans payloads
- Batch activation (**ADMIN-02C** — waves checklist only, pas de mutation partenaire)
- Suppression profil via API admin

---

## 5. API design — comparaison et contrat livré

### 5.1 Option A vs B

| Critère | PATCH unique (A) | Actions explicites (B) |
|---------|------------------|------------------------|
| Sécurité | Combinaisons invalides | Intent par route |
| Tests | Matrice large | 1 route = 1 suite |
| UI | Form générique | Boutons = endpoints |
| Audit | Action floue | `PartnerAdminAction` enum stable |

**Décision : Option B + PATCH limité** — **retenue et livrée.**

### 5.2 Contrat HTTP livré (`admin_partners.py`)

```text
GET  /api/v1/admin/partners/{organization_id}
POST /api/v1/admin/partners/{organization_id}/profile
POST /api/v1/admin/partners/{organization_id}/activate
POST /api/v1/admin/partners/{organization_id}/pause
POST /api/v1/admin/partners/{organization_id}/upgrade-premium
PATCH /api/v1/admin/partners/{organization_id}
```

**Bodies :**

- **profile :** `partnership_type`, `public_partner_label?`, `reason?`
- **activate :** `visibility?`, `reason?` — pas de défaut `public` côté serveur
- **pause / premium :** `reason?`
- **PATCH :** `visibility?`, `is_featured?`, `public_partner_label?` — au moins un champ

**Réponse mutation :** `AdminPartnerDetailResponse` (detail rechargé ; `expire_all()` après commit).

**Codes erreur utilisés :** `ORGANIZATION_NOT_FOUND`, `PARTNER_PROFILE_NOT_FOUND`, `PARTNER_PROFILE_ALREADY_EXISTS`, `ORGANIZATION_NOT_VERIFIED`, `INVALID_PARTNER_STATUS_TRANSITION`, `FEATURED_REQUIRES_ACTIVE_PARTNER`, `EMPTY_PATCH_PAYLOAD`.

**Écart discovery :** pas de `POST …/reactivate` dédié — réactivation = même `activate` depuis `paused`.

---

## 6. UI design — recommandations et livrable 02D3B

### 6.1 Placement (livré)

| Zone | Contenu |
|------|---------|
| **Actions métier** | `PartnerDetailActionsSection` — create / activate / pause / premium |
| **Réglages catalogue** | `PartnerDetailSettingsPanel` — visibility, featured, label |
| **Capabilities** | Miroir serveur (informatif) |
| Fiche 360° | `/partners/organizations/[organizationId]` |

Pattern modales : `PartnerCreateProfileDialog`, `PartnerActivateDialog`, `PartnerActionReasonDialog` (inspiré reject dialog).

### 6.2 Disabled / confirmations

| Action | Disabled | Confirmation |
|--------|----------|--------------|
| Créer profil | `!can_create_profile` | Modal type partenariat |
| Activer | `!can_activate` | Modal + checkbox visibility `public` (opt-in) |
| Pause | `!can_pause` | Modal + motif optionnel |
| Premium | `!can_upgrade_premium` | Modal + motif optionnel |
| Réglages | `!can_update_settings` | Submit formulaire |

### 6.3 Feedback

- Bannières succès / erreur post-mutation
- `useAdminPartnerDetail` : mutations + `reload` implicite via `setData(response)`
- Pas d’optimistic update (counters + capabilities serveur)

### 6.4 Messages produit (livrés en FR)

- Org **vérifiée ≠ publique** (create profile, activate)
- Activation catalogue **volontaire** ; checkbox visibility public
- Pause : hors catalogue, **visibility org inchangée**
- Lien file vérification via `links.verification_queue`

---

## 7. Garde-fous sécurité

### 7.1 Règles codées (`AdminPartnerService`)

1. Pas d’activation / création profil sans `verification_status = verified`
2. Pas d’activation sans `PartnerProfile`
3. Transitions statut uniquement via POST dédiés
4. Pas de `founding_partner` via admin
5. `visibility` public/unlisted exige org verified
6. `visibility` private toujours autorisée
7. `public_partner_label` max 160
8. `is_featured=true` exige statut featured-eligible
9. Chaque mutation → `partner_admin_actions` + `actor_user_id`
10. Logique métier dans **service**, pas dans les routes

### 7.2 Zones rouges (review obligatoire)

- AuthZ staff strict
- Pas de fuite PII CRM
- Tests intégration RBAC + transitions
- Pas de batch activate sur ce module

---

## 8. Tests (livré vs recommandé)

### 8.1 Backend `test_admin_partner_actions_api.py` (~20 cas)

| Groupe | Couvert |
|--------|---------|
| RBAC user 403, moderator OK | ✅ |
| create profile | ✅ |
| activate signed → active, `activated_at` | ✅ |
| paused → active, `activated_at` preserved | ✅ |
| pause active/premium | ✅ |
| premium depuis active ; rejets signed/paused | ✅ |
| PATCH visibility / featured guards | ✅ |
| PATCH `partner_status` field → 422 | ✅ |
| capabilities flow | ✅ |
| audit | implicite via `record_admin_action` (pas de test liste audit UI) |

### 8.2 Frontend 02D3B

- Tests manuels / build CI admin — pas de suite e2e dédiée dans le ticket.

### 8.3 02D3C (restant)

- Panel lecture `partner_admin_actions` sur fiche D2
- Tests régression gates après pause (events, creator)
- Export audit / filtres staff

---

## 9. Découpage BUILD (historique + suite)

| Ticket | Statut | Contenu |
|--------|--------|---------|
| **02D3A** | ✅ | Service, routes, migration audit, tests API |
| **02D3B** | ✅ | Actions UI, modales, API client, hook mutations |
| **02D3C** | ⏳ | Historique audit UI, polish, doc sécurité |

**Parallèle livré ailleurs :** ADMIN-02C Activation Waves (A fondation, B API) — **sans** mutation `partner_status`.

---

## 10. Écarts discovery → implémentation

| Sujet | Discovery | Livré |
|-------|-----------|-------|
| Endpoint `reactivate` | Route séparée suggérée | Fusionné dans `activate` |
| `can_reactivate` | Capability dédiée | Absorbé par `can_activate` |
| Visibility défaut `public` à l’activate | Débat produit | **Non** — opt-in explicite |
| `activated_at` sur réactivation | Refresh ou conserver | **Conservé** si déjà set |
| Idempotence double activate | 409 suggéré | 422 transition invalide si déjà active |
| GET detail `public_partner_label` | — | Non exposé en lecture D1 (PATCH seulement) |

---

## 11. Synthèse décisionnelle CTO (référence)

| Sujet | Décision |
|-------|----------|
| API shape | **Option B** + PATCH limité |
| Verified avant activate / create profile | **Oui** |
| Profil séparé de activate | **Oui** |
| Pause vs visibility | **Pause = statut** ; visibility indépendante |
| founding_partner V1 | **Interdit** |
| Audit | **`partner_admin_actions`** |
| Activation waves | **ADMIN-02C** (pilotage, pas activate batch) |

---

## 12. Prochaines étapes produit

1. **ADMIN-02C-D** — UI tab Activation (API waves déjà sur `main`)
2. **ADMIN-02D3C** (optionnel) — historique audit sur fiche 360°
3. Pas de réouverture 02D3A/B sauf bugfix ciblé

---

*Document d’audit / discovery — aucun changement code. Pour l’état runtime, se référer à `AdminPartnerService`, `admin_partners.py`, et `partner-detail-view.tsx`.*
