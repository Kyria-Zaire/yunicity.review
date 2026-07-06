# ADMIN-SETTINGS-01 — DISCOVER
## Paramètres / Configuration plateforme

| Champ | Valeur |
|-------|--------|
| **Phase** | DISCOVER |
| **Feature** | FEATURE-ADMIN-V2 |
| **Ticket** | ADMIN-SETTINGS-01 |
| **Prérequis** | ADMIN-ANALYTICS-01 livré sur `main` (`e201480`) |
| **Date** | 2026-06-10 |
| **Statut** | Prêt review CTO — **aucun code, aucun commit** |

---

## 1. Résumé exécutif

Yunicity **ne dispose pas** aujourd’hui d’un onglet ni d’une couche backend « configuration plateforme ». Les réglages sont **dispersés** entre :

- variables d’environnement (`backend/app/core/config.py`)
- ~29 fichiers `*_constants.py` (code versionné)
- tables métier (`passport_tiers`, préférences user)
- endpoints admin **par entité** (ex. `PATCH /admin/partners/{id}`)

**Recommandation CTO :** livrer une **V1 read-only majoritaire** avec **2–3 toggles sécurisés** maximum, via un endpoint snapshot unique — pas de table `platform_settings` ni de `PATCH` global en V1.

| Bucket V1 | Part |
|-----------|------|
| Consultatif read-only | ~85 % |
| Dérivé de l’existant (constantes + health) | ~10 % |
| Modifiable sécurisé (feature flags booléens) | ~5 % |
| Exclu (secrets, auth, QR, rate limits, maintenance) | 100 % hors périmètre V1 |

L’onglet `/settings` doit devenir le **panneau de transparence opérationnelle** du pilote Reims : ce que la plateforme fait, sous quelles règles, dans quel environnement — **sans donner le pouvoir de casser Passport, auth ou modération**.

---

## 2. Audit repo

### 2.1 Backend — ce qui existe

| Zone | Fichiers clés | Constat |
|------|---------------|---------|
| Config runtime | `app/core/config.py`, `.env.example` | Pydantic-settings ; secrets + feature flags booléens |
| Ville pilote | `schemas/admin_cockpit.py` (`DEFAULT_COCKPIT_CITY = "Reims"`) | Constante code ; overridable par `?city=` sur summaries |
| Passport | `core/passport_constants.py`, `passport_qr.py`, `passport_stamp_qr.py`, `passport_level_rules.py`, `models/passport.py` (`PassportTier`) | Règles QR, seuils badges, tiers en DB sans API admin CRUD |
| Partenaires | `core/partner_constants.py`, `organization_constants.py`, `partner_admin_constants.py` | Statuts, visibilité ; patch par org via admin |
| Modération | `local_event_constants.py`, `partner_creator_content_constants.py`, `offer_admin_constants.py` | Auto-approve events si org vérifiée ; contenus/offres toujours en review |
| Notifications | `notification_constants.py`, `notification_preferences.py`, `integrations/expo_push.py` | Push Expo ; pas d’email transactionnel |
| Health | `api/v1/health.py` | `GET /health`, `GET /ready` (DB + Redis) |
| Audit | 7 tables `*_admin_actions` + `tribe_moderation_logs` | Par domaine ; pas d’audit settings global |
| RBAC | `db/seeds/auth_rbac.py` | 9 permissions ; **pas de `settings.*`** |
| Business | `core/subscription_constants.py` | Plans citoyens en code ; Stripe via env |

### 2.2 Backend — ce qui n’existe pas

- Table `platform_settings` / modèle ORM dédié
- `GET /admin/settings` ou `/admin/platform-config`
- `PATCH` configuration plateforme
- Mode maintenance
- Service email / digest admin
- Permission RBAC `settings.read` / `settings.manage`
- API admin CRUD `passport_tiers`

### 2.3 Frontend — ce qui existe

| Zone | Fichiers | Constat |
|------|----------|---------|
| Admin settings plateforme | — | **Absent** — pas de route `/settings` |
| Settings partenaire | `components/partners/detail/partner-detail-settings-panel.tsx` | PATCH org : visibilité, featured, label |
| Analytics (pattern proche) | `components/analytics/*`, `lib/analytics-display.ts` | Read-only agrégats ; empty states propres |
| Health admin | `components/readiness-status-panel.tsx` | `GET /ready` — **composant orphelin** (non monté) |
| Settings citoyen | `apps/web/app/settings/*` | Profil / notifs user — **hors scope admin** |
| Env public admin | `apps/admin/.env.example` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WEB_APP_URL` |
| Brand tokens | `packages/ui/src/brand-tokens.ts`, `brand.css` | Primary `#2A2FFF` — pas éditable admin |

### 2.4 Navigation

`admin-nav-items.ts` : Cockpit, Analytics, Partenaires, Passport Ops, modération, Staff — **pas de Configuration**.  
*(Hors scope DISCOVER : pas de modification nav dans ce ticket.)*

---

## 3. Paramètres existants détectés

### Tableau par domaine

| Domaine | Paramètre | Source actuelle | Modifiable aujourd’hui ? | Backend V1 nécessaire ? | Risque |
|---------|-----------|-----------------|--------------------------|-------------------------|--------|
| **Identité** | Nom plateforme | `config.app_name` | Env + redeploy | Snapshot read-only | Faible |
| | Ville pilote | `DEFAULT_COCKPIT_CITY` | Constante code | Snapshot read-only | Faible |
| | Description courte | — | Absent | Non V1 | — |
| | URL API publique | `NEXT_PUBLIC_API_URL` | Build-time FE | Snapshot read-only (admin) | Faible |
| | URL web publique | `NEXT_PUBLIC_WEB_APP_URL` | Build-time FE | Snapshot read-only | Faible |
| | Logo / assets | `packages/utils/brand-assets.ts` | Code / static | Read-only chemins | Faible |
| | Couleur principale | `packages/ui/brand-tokens.ts` | Code | Read-only | Faible |
| | Statut pilote | Implicite Reims + seeds | Code / seed | Read-only badge | Faible |
| **Passport** | Passport activé | Toujours actif (MVP) | N/A | Read-only « actif » | Moyen |
| | Durée QR stamp | `STAMP_QR_DEFAULT_EXPIRES_MINUTES=1440` | Code | Read-only | Élevé si éditable |
| | QR payload prefix | `passport_qr.py` `YNCP1:` | Code | Jamais exposer édition V1 | Critique |
| | Règles tampons | `passport_constants.py`, services scan | Code + DB | Read-only | Moyen |
| | Seuils badges | `passport_level_rules.py` (Silver 25, Gold 70) | Code | Read-only | Moyen |
| | Tiers visibles | `passport_tiers` DB + `MVP_PASSPORT_TIER_SEED` | Seed / DB direct | Read-only via `GET /passport/tiers` | Moyen |
| | Max redemptions/offre | `PartnerOffer.max_redemptions_*` | Par offre (admin) | Hors settings global | Moyen |
| | Claim QR / expiration | `passport_stamp_qr.py`, rate limits inline | Code | Read-only | Élevé |
| | Suspension / révocation | `admin_passports` PATCH | Admin passport ops | Lien vers module existant | Moyen |
| **Partenaires** | Validation manuelle org | `organization_constants.py` workflow | Admin orgs | Read-only règles | Moyen |
| | Labels / featured / visibilité | `PATCH /admin/partners/{id}` | **Oui** (par org) | Déjà couvert — pas global settings | Moyen |
| | Premium / founding | `partner_constants.py` + actions admin | Admin partner actions | Read-only statuts supportés | Moyen |
| | Readiness / onboarding | Activation waves, workspace | Admin modules | Liens read-only | Faible |
| **Modération** | Auto-approval events | Org `verified` → approved initial | Code `local_event_service` | Read-only règle | Moyen |
| | Auto-approval contenus | Toujours `pending_review` | Code | Read-only | Faible |
| | Seuil attention signalements | `MODERATION_ATTENTION_THRESHOLD=5` (FE utils) | Code FE | Read-only | Faible |
| | Statuts supportés | Enums dans constants | Code | Read-only catalogue | Faible |
| | Files d’attente | Summaries admin existants | APIs summaries | Réutiliser analytics/cockpit | Faible |
| **Notifications** | Push Expo | `EXPO_PUSH_ENABLED`, token env | Env | Read-only booléen safe | Moyen |
| | Préférences user | `user_profiles.notification_preferences` | User self-service | Hors scope admin plateforme | Faible |
| | Emails système | — | **Absent** | Coming soon | — |
| | Alertes admin / digest | — | **Absent** | Coming soon | — |
| **Sécurité / ops** | Environnement | `config.app_env` via `/health` | Env | Réutiliser `/health` | Faible |
| | Health / readiness | `/api/v1/health`, `/ready` | Existant | Réutiliser | Faible |
| | Mode maintenance | — | **Absent** | Exclu V1 | Élevé |
| | Version app | — | **Absent** (web hardcode `0.0.0`) | Read-only build metadata futur | Faible |
| | Audit logs | Tables `*_admin_actions` | Append-only | Lien Activity futur ; pas liste V1 | Moyen |
| | Rate limits | Inline routes + `rate_limit.py` | Code | Read-only résumé ; jamais éditable V1 | Élevé |
| **Business** | Plans citoyens | `subscription_constants.py` | Code | Read-only | Faible |
| | Stripe / commissions | env Stripe | Secrets | **Jamais exposer** | Critique |
| | Passport premium / CPC | — | Futur | Coming soon read-only | — |

### Objectifs pilote (dérivés FE — pas backend)

| Objectif | Constante `@yunicity/utils` | Valeur |
|----------|------------------------------|--------|
| Passports actifs cible | `PASSPORT_OPS_PILOT_GOAL` | 50 |
| Offres publiées cible | `OFFERS_CATALOG_PILOT_GOAL` | 10 |
| Événements à venir cible | `EVENTS_AGENDA_PILOT_GOAL` | 10 |
| Contenus approuvés cible | `CREATOR_CONTENT_EDITORIAL_PILOT_GOAL` | 10 |
| Leads qualifiés cible | `PARTNER_LEAD_PILOT_QUALIFIED_GOAL` | 25 |
| Seuil signalements | `MODERATION_ATTENTION_THRESHOLD` | 5 |
| Rôles staff critiques | `STAFF_CRITICAL_ROLE_COUNT` | 3 |

**Dette identifiée :** objectifs pilote **uniquement frontend** — à centraliser côté backend dans BUILD (cf. audit ADMIN-EXTENSION-AUDIT-01).

---

## 4. Paramètres absents

| Paramètre attendu produit | Statut | Impact V1 |
|-------------------------|--------|-----------|
| Table `platform_settings` | Absent | Pas d’édition runtime globale |
| Description plateforme | Absent | Section Général partielle |
| Mode maintenance | Absent | Section Sécurité : « non disponible » |
| Emails / digest admin | Absent | Section Notifications : coming soon |
| Device analytics | Absent | Pas de Mobile/Desktop |
| Sessions web analytics | Absent | Déjà traité dans Analytics |
| Version API semver exposée | Absent | Afficher `app_env` + service name |
| Permission `settings.*` | Absent | Utiliser `system.admin` pour V1 |
| Audit modifications settings | Absent | Obligatoire avant tout PATCH V2 |
| Auto-approve creator content (flag) | Absent (comportement fixe) | Read-only : toujours review |
| Commissions / CPC / CPM | Absent | Coming soon read-only |

---

## 5. Périmètre recommandé V1

### Philosophie V1

> **Utile, transparent, limité.**  
> La page répond à : « Comment est configuré Yunicity aujourd’hui ? » — pas « Comment je reconfigure tout le produit ? »

### Inclus V1 (BUILD — ticket 01B)

#### A. Endpoint snapshot read-only (recommandé)

```
GET /api/v1/admin/platform-config
```

Réponse structurée par sections (pas de secrets). Sources :
- `config.py` champs safe (app_name, app_env, passport_stamp_feed_events, expo_push_enabled)
- Constantes backend centralisées (`pilot_constants.py` à créer)
- `GET /passport/tiers` (lecture catalogue)
- Règles métier documentées (enums / seuils depuis constants)
- Optionnel : proxy health (`environment` + readiness summary)

#### B. Page `/settings` — sections

| Section | Contenu V1 | Mode |
|---------|------------|------|
| **Général** | Nom app, ville pilote, URLs publiques (API + web), statut pilote, objectifs pilote | Read-only |
| **Passport** | Tiers visibles, seuils badges, durée QR (info), règles redemption par défaut, feature flag stamp feed | Read-only |
| **Partenaires** | Statuts supportés, règles visibilité publique, lien vers module Partenaires | Read-only + liens |
| **Modération** | Auto-approve events (règle org verified), statuts workflow, seuil attention, pending counts | Read-only + KPIs |
| **Notifications** | Push Expo activé/désactivé | Read-only |
| **Sécurité & système** | Environnement, health DB/Redis, RBAC rôles plateforme, rate limit « configuré en code » | Read-only |
| **Business** | Plans citoyens (catalogue code), Stripe « configuré via infrastructure » | Read-only + coming soon |

#### C. Toggles modifiables V1 (optionnels — max 3)

Uniquement si validation sécurité explicite :

| Toggle | Source | Permission | Garde-fous |
|--------|--------|------------|------------|
| `passport_stamp_feed_events` | env → futur DB flag | `system.admin` | Audit log obligatoire ; pas de régression feed |
| *(aucun autre en V1)* | — | — | — |

**Recommandation forte :** **V1 100 % read-only** ; reporter tout PATCH à V2 avec table + audit.

### Dérivable sans nouveau backend (fallback minimal)

Si CTO refuse endpoint V1 : page FE lisant `@yunicity/utils` constantes + `GET /health` + `GET /ready` + `GET /rbac/me/permissions`.  
**Non recommandé** — source de vérité éclatée, objectifs pilote absents du backend.

---

## 6. Périmètre exclu V1

| Exclusion | Raison |
|-----------|--------|
| `PATCH /admin/settings` global | Pas de modèle persistence ; risque régression |
| Table `platform_settings` + migration | Hors DISCOVER ; complexité VERIFY |
| Mode maintenance | Absent backend ; impact prod |
| Édition JWT / QR / rate limits | Zone rouge sécurité |
| Édition tiers passport | Pas d’API admin CRUD |
| Édition seuils badges / pilot goals via UI | Nécessite versioning + audit |
| Emails / digest / alertes admin | Pas de service email |
| Stripe / commissions / CPC | Secrets + produit immature |
| Device / session analytics | Données inexistantes |
| Liste audit logs complète | Ticket Activity séparé |
| Navigation sidebar | Ticket closure dédié |
| Édition CORS / secrets / DB URL | Ops uniquement |

---

## 7. Architecture backend recommandée

### Option retenue : **Snapshot read-only V1**

```
api/v1/admin_platform_config.py
  └── GET /admin/platform-config

services/admin_platform_config_service.py
  └── assemble snapshot from:
        - Settings (safe fields whitelist)
        - pilot_constants.py (new)
        - PassportTierRepository (public tiers)
        - rule catalogs from existing constants modules

schemas/admin_platform_config.py
  └── AdminPlatformConfigResponse (sectioned)

repositories/ (optional)
  └── passport_tier read for catalog
```

**Pas de PATCH en V1.**

### Option V2 (hors 01B)

```
platform_settings table (key, value_json, updated_by, updated_at)
GET  /admin/platform-config
PATCH /admin/platform-config  (whitelist keys only)
platform_config_admin_actions table (audit)
permissions: settings.read (CITY_ADMIN+), settings.manage (SUPER_ADMIN)
```

### Endpoints à réutiliser (pas recréer)

| Endpoint | Usage settings |
|----------|----------------|
| `GET /api/v1/health` | environment, service |
| `GET /api/v1/ready` | DB/Redis status |
| `GET /api/v1/rbac/me/permissions` | Permissions effectives viewer |
| `GET /api/v1/passport/tiers` | Catalogue tiers (si pas inclus snapshot) |
| `GET /api/v1/admin/cockpit/summary` | Optionnel : pending counts section Modération |
| `GET /api/v1/admin/analytics/summary` | Optionnel : objectifs vs réel |

---

## 8. Architecture frontend recommandée

### Route

```
app/(protected)/settings/page.tsx
```

### Structure composants (BUILD 01B)

```
components/settings/
  settings-page.tsx           # orchestrateur
  settings-header.tsx         # titre + badge read-only V1
  settings-section.tsx        # carte section générique
  settings-general-section.tsx
  settings-passport-section.tsx
  settings-partners-section.tsx
  settings-moderation-section.tsx
  settings-notifications-section.tsx
  settings-system-section.tsx
  settings-business-section.tsx
  settings-readonly-field.tsx
  settings-coming-soon.tsx
  settings-loading-state.tsx
  settings-error-state.tsx
  settings-data-footer.tsx    # réutiliser esprit analytics footer
```

### Packages

```
packages/types/src/admin-platform-config.ts
packages/utils/src/admin-platform-config-api.ts
apps/admin/lib/hooks/use-admin-platform-config.ts
```

### Patterns à réutiliser

| Pattern source | Réutilisation |
|----------------|---------------|
| `analytics-page.tsx` | Loading / error / empty |
| `analytics-data-footer.tsx` | Disclaimer données réelles |
| `partner-detail-settings-panel.tsx` | Futur : formulaire PATCH V2 |
| `readiness-status-panel.tsx` | Intégrer dans section Système |
| `@yunicity/ui` brand tokens | Couleurs — pas de hex hardcodés |

### Navigation (ticket ultérieur)

Label : **Configuration** — groupe **Administration** — route `/settings`.  
*(Non implémenté dans DISCOVER.)*

---

## 9. Permissions / sécurité / audit

### Permissions V1

| Action | Permission recommandée |
|--------|---------------------|
| Lecture `/settings` (page) | `moderation.manage` ∨ `system.admin` |
| Lecture snapshot config | Idem |
| Toute modification V2+ | **`system.admin` uniquement** |

### Règles sécurité non négociables

1. **Whitelist stricte** des champs exposés — revue sécurité avant merge.
2. **Jamais** : `DATABASE_URL`, `JWT_*`, `STRIPE_*`, `*_PASSWORD`, `*_TOKEN`, `*_KEY`, `REDIS_URL`, `refresh_token_pepper`.
3. **Jamais** édition QR prefix, algorithmes JWT, rate limits via UI.
4. Toute modification future → **audit append-only** (`platform_config_admin_actions`).
5. Validation Pydantic stricte sur PATCH V2 — pas de mass assignment.
6. Feature flags booléens seulement — pas de JSON libre admin.

### Matrice risque par type

| Type | Exposition V1 | Édition |
|------|---------------|---------|
| Identité marketing | Read-only | V2+ marketing ops |
| Règles Passport | Read-only | Jamais sans review sécurité |
| Partenaire global | Read-only | Par org (existant) |
| Modération workflow | Read-only | Code + PR |
| Infra / secrets | Masqué | Ops / Railway uniquement |
| Business / Stripe | Masqué | Ops |

---

## 10. UX proposée pour `/settings`

### Layout (aligné Analytics / maquette admin)

```
┌─────────────────────────────────────────────────────────┐
│ Configuration plateforme                    [Read-only]│
│ Paramètres opérationnels du pilote Yunicity — Reims      │
├─────────────────────────────────────────────────────────┤
│ [Général] [Passport] [Partenaires] [Modération]         │
│ [Notifications] [Sécurité] [Business]    ← tabs ou ancres │
├─────────────────────────────────────────────────────────┤
│ Section active : cartes champs read-only                 │
│ Badge "Lecture seule" sur chaque champ non éditable      │
│ "Bientôt" sur sections sans donnée                       │
├─────────────────────────────────────────────────────────┤
│ Footer violet : À propos des données                     │
└─────────────────────────────────────────────────────────┘
```

### Détail par section

| Section | Champs UI | Mode | Fallback |
|---------|-----------|------|----------|
| **Général** | Nom plateforme, ville pilote, URLs, objectifs pilote (5 KPI cibles) | Read-only | « Donnée indisponible » |
| **Passport** | Tiers (liste), seuils Silver/Gold, durée QR, max redemption défaut, stamp feed flag | Read-only | — |
| **Partenaires** | Statuts (active, premium, founding…), visibilité publique, validation org | Read-only | Lien `/partners` |
| **Modération** | Auto-approve events, workflows contenus/offres, seuil 5, pending counts | Read-only | Lien modules |
| **Notifications** | Push Expo on/off | Read-only | Email : coming soon |
| **Sécurité** | Env, health DB/Redis, rôles RBAC, rate limits summary | Read-only | Maintenance : coming soon |
| **Business** | Plans Free/Plus/Premium (prix catalogue) | Read-only | Commissions : coming soon |

### États UX obligatoires

- Loading skeleton (pattern analytics)
- Error + retry
- Empty section si bloc absent
- Badge global **« Configuration V1 — lecture seule »**

### Danger zone

**Absente en V1.**  
Prévoir emplacement V2 pour : maintenance mode, reset caches, toggles critiques — `system.admin` + confirmation double.

---

## 11. Liste des endpoints — créer ou réutiliser

| Endpoint | Action DISCOVER | Ticket BUILD |
|----------|-----------------|--------------|
| `GET /api/v1/admin/platform-config` | **À créer** | 01B |
| `PATCH /api/v1/admin/platform-config` | **Ne pas créer** V1 | V2 |
| `GET /api/v1/health` | Réutiliser | 01B (section système) |
| `GET /api/v1/ready` | Réutiliser | 01B (section système) |
| `GET /api/v1/rbac/me/permissions` | Réutiliser | 01B (section sécurité) |
| `GET /api/v1/passport/tiers` | Réutiliser ou inclure dans snapshot | 01B |
| `GET /api/v1/admin/cockpit/summary` | Optionnel (pending) | 01B option |
| `PATCH /api/v1/admin/partners/{id}` | Existant — hors settings global | — |

---

## 12. Risques techniques

| Risque | Sévérité | Mitigation |
|--------|----------|------------|
| Exposition accidentelle secret via snapshot | **Critique** | Whitelist + test sécurité + review |
| Source de vérité éclatée FE/BE (objectifs pilote) | Moyenne | `pilot_constants.py` centralisé en BUILD |
| Attente produit d’édition alors que V1 read-only | Moyenne | Badge + copy explicite « lecture seule » |
| Confusion settings user web vs admin | Faible | Titres distincts, routes séparées |
| Temptation PATCH sans audit | Élevée | Reporter V2 avec table + audit |
| `passport_tiers` modifiable DB sans API | Moyenne | Read-only catalogue V1 |
| Health exposé sans auth sur `/ready` | Faible | Admin page utilise endpoint public existant — acceptable |

---

## 13. Décision CTO recommandée

### GO conditionnel — V1 read-only

1. **Approuver** `GET /admin/platform-config` snapshot unique.
2. **Refuser** table `platform_settings` et `PATCH` en 01B.
3. **Centraliser** `pilot_constants.py` backend + réexport documenté FE.
4. **Permission** : lecture `moderation.manage` ∨ `system.admin` ; écriture future `system.admin` only.
5. **Réutiliser** `ReadinessStatusPanel` dans section Système.
6. **Ne pas** exposer maintenance, email, sessions, devices en V1.
7. **Navigation** `/settings` dans ticket closure ADMIN-V1 (après page stable).

### Anti-patterns à refuser

- Page settings avec toggles cosmétiques non branchés backend
- Chiffres objectifs pilote éditables sans persistence
- Duplication des constantes en dur dans les composants
- `PATCH` sur variables d’environnement

---

## 14. Plan BUILD proposé — ADMIN-SETTINGS-01B

### Ticket : ADMIN-SETTINGS-01B — Configuration plateforme V1 (read-only)

| Étape | Livrable | Backend | Frontend | Tests |
|-------|----------|---------|----------|-------|
| 1 | `pilot_constants.py` + schemas snapshot | Oui | — | Unit constants |
| 2 | `GET /admin/platform-config` | Oui | — | `test_admin_platform_config_api.py` |
| 3 | Types + API util | — | Oui | Utils test |
| 4 | Page `/settings` + 7 sections | — | Oui | Nav test (closure) |
| 5 | Intégration health + readiness | Réutilise | Oui | — |
| 6 | Security review whitelist | Oui | — | Test « no secrets in response » |

### Ordre d’exécution

```
01B Backend snapshot → 01B Frontend page → ADMIN-V1-FINAL-CLOSURE (nav /settings)
```

### Critères d’acceptation 01B

- [ ] `GET /admin/platform-config` opérationnel
- [ ] Aucun secret dans la réponse (test automatisé)
- [ ] Page `/settings` avec 7 sections
- [ ] 100 % read-only — aucun toggle actif sans backend
- [ ] États loading / error
- [ ] Objectifs pilote affichés depuis backend
- [ ] `pnpm --filter admin typecheck/build` OK
- [ ] `pytest tests/test_admin_platform_config_api.py` OK
- [ ] Review sécurité checklist

### Ticket suivant (V2 — hors scope immédiat)

**ADMIN-SETTINGS-02** : table `platform_settings`, PATCH whitelist, audit, permission `settings.manage`.

---

## Annexe — Classification des réglages (4 buckets)

| Bucket | Description | Exemples | V1 |
|--------|-------------|----------|-----|
| **A — Runtime DB** | Persistant, modifiable admin | Futur `platform_settings` | Non |
| **B — Env infra** | Secrets, URLs infra | JWT, DATABASE_URL | Jamais API |
| **C — Constantes produit** | Code versionné | Seuils, pilot goals, workflows | Read-only |
| **D — Par entité** | APIs domaine existantes | Partner patch, offer approve | Liens modules |

---

**ADMIN-SETTINGS-01 DISCOVER terminé — prêt review CTO**

*Document généré en phase DISCOVER — aucun code applicatif modifié.*
