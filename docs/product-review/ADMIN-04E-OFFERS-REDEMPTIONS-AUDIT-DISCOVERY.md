# ADMIN-04E — Discovery Redemptions & Audit (fiche offre)

**Phase BMAD :** DISCOVER  
**Feature :** FEATURE-ADMIN-V1 / ADMIN-04 Offers  
**Ticket :** ADMIN-04E-DISCOVERY  
**Date :** 2026-06-04  
**Statut :** Audit read-only — **aucun code modifié**

**Prérequis livrés :**

| Ticket | Statut |
|--------|--------|
| ADMIN-04A Offers Discovery | ✅ |
| ADMIN-04B Offers Workspace | ✅ PR #41 |
| ADMIN-04C Offer Detail 360° | ✅ PR #42 |
| ADMIN-03 Passport Ops redemptions | ✅ `GET /admin/passports/{id}/redemptions` |
| ADMIN-03C-D Passport audit timeline | ✅ `GET /admin/passports/{id}/actions` + `passport_admin_actions` |

**Base code auditée :** `main` post-merge PR #42 (`8b4472a`).

**Placeholders UI actuels (04C) :**

- Redemptions : « Historique des utilisations prévu en ADMIN-04E. »
- Audit : « Timeline offre prévue en ADMIN-04E. »

---

## 1. Synthèse exécutive

La fiche offre 360° (04C) répond aux questions **identité, partenaire, conditions, modération, exposition**. Le gap produit le plus visible reste :

```txt
Offre
 ↓
 Qui l'a utilisée ?
 Quand ?
 Chez quel partenaire ?   → connu (fixe sur la fiche)
 Quel Passport ?
 Par quel canal (scan / self-redeem) ?
```

**Constat :** les **données redemptions existent** (`passport_offer_redemptions`), mais l’admin ne peut les lire que **par passport**, pas **par offre**. L’**audit modération offre** n’existe pas : seule la **dernière** modération est dénormalisée sur `partner_offers` (`moderated_by_user_id`, `moderated_at`, `rejection_reason`).

**Recommandation CTO (preview) :**

1. **Priorité P0 — Redemptions par offre** : endpoint read-only + section UI (pattern miroir Passport Ops).
2. **Priorité P1 — Audit timeline offre** : table `offer_admin_actions` + enregistrement sur approve/reject/archive + GET (pattern `passport_admin_actions`).
3. **Pas de discovery-tech séparée** — schémas et patterns admin déjà établis en 03A–03C.

**Ordre BUILD :** 04E-A (redemptions backend) → 04E-B (audit backend) → 04E-C (frontend sections). 04E-A seul débloque déjà ~70 % de la valeur produit.

---

## 2. Question produit — réponses

### 2.1 Que doit voir le staff sur une offre publiée ?

| Question staff | Source actuelle | Cible 04E |
|----------------|-----------------|-----------|
| Combien d’utilisations ? | `redemptions_count` sur détail offre | ✅ déjà (compteur agrégé) |
| Qui a utilisé l’offre ? | ❌ | Liste paginée par offre |
| Quand ? | ❌ | `redeemed_at` / `created_at` |
| Quel Passport / citoyen ? | ❌ | Lien `/passport-ops/{passport_id}` |
| Scan partenaire ou self-redeem ? | ❌ (metadata partielle) | Canal dérivé (voir §4) |
| Qui a approuvé / refusé / archivé ? | Dernière modération seulement | Timeline audit complète |
| Historique des rejets successifs ? | ❌ | Audit (P1) |

### 2.2 Faut-il une action staff sur les redemptions ?

**Non en V1.** Redemptions = **`completed` immédiat**, irréversible sans règles métier (zone rouge — cf. 04A §8). ADMIN-04E = **lecture seule** uniquement.

### 2.3 Audit : synthèse depuis `partner_offers` suffisante ?

**Non** pour une timeline staff crédible :

| Événement | Recoverable today ? |
|-----------|---------------------|
| Création offre | `created_at`, `created_by_user_id` — oui (1 ligne synthétique possible) |
| Dernière approve/reject/archive | `moderated_at`, `moderated_by_user_id` — oui (1 ligne) |
| Rejet antérieur puis resoumission | ❌ `rejection_reason` écrasé au clear |
| Plusieurs cycles modération | ❌ |
| PATCH contenu post-publication | ❌ non journalisé |

**Décision :** timeline complète = **nouvelle table** + enregistrement dans les mutations existantes (pas de nouvelle mutation produit).

---

## 3. Inventaire backend — redemptions

### 3.1 Modèle `PassportOfferRedemption`

Fichier : `backend/app/models/passport.py`

| Champ | Type | Notes staff |
|-------|------|-------------|
| `id` | UUID | Clé ligne |
| `passport_id` | FK | → lien Passport Ops |
| `partner_offer_id` | FK | Filtre 04E |
| `status` | enum | Seul `completed` créé en prod |
| `redeemed_at` | timestamptz | Date métier utilisation |
| `created_at` | timestamptz | Insertion row |
| `metadata` | JSONB | Scan : `event`, `partner_user_id`, `organization_id`, `client_ip` ; self-redeem : `{}` |

**Contrainte MVP :** `UNIQUE (passport_id, partner_offer_id)` — max **1 redemption par citoyen et par offre**.

**Index existant :** `ix_passport_offer_redemptions_partner_offer_id` — requête par offre **efficiente sans migration**.

### 3.2 Endpoints existants

| Method | Path | Scope | Utilisable pour 04E ? |
|--------|------|-------|----------------------|
| GET | `/admin/passports/{passport_id}/redemptions` | Par passport | ❌ inverse du besoin |
| GET | `/admin/partner-offers/{id}` | Détail offre + `redemptions_count` | Compteur seulement |
| — | `/admin/partner-offers/{id}/redemptions` | — | **Manquant — cœur 04E-A** |

**Repository existant réutilisable :**

- `partner_offer_repository.count_completed_redemptions(offer_id)` — déjà utilisé pour `redemptions_count`
- `admin_passport_repository.list_redemptions(passport_id=…)` — **pattern à inverser** (filtre `partner_offer_id`, join `Passport` + `User`)

### 3.3 Schéma API proposé (04E-A)

```txt
GET /api/v1/admin/partner-offers/{offer_id}/redemptions
  ?page=1&page_size=20

Guard: moderation.manage | system.admin
404: OFFER_NOT_FOUND
```

**Item suggéré** (`AdminOfferRedemptionListItem`) — symétrie Passport Ops :

| Champ | Description |
|-------|-------------|
| `id` | UUID redemption |
| `passport_id` | Lien fiche citoyen |
| `passport_number` | Repère staff |
| `user_email` | PII — même niveau que Passport Ops |
| `user_display_name` | Optionnel |
| `status` | `OfferRedemptionStatus` |
| `redeemed_at` | Nullable |
| `created_at` | Row created |
| `channel` | `partner_scan` \| `self_redeem` \| `unknown` — dérivé metadata |

**Response :** `{ items, total, page, page_size }` — constantes pagination alignées `ADMIN_PASSPORT_SUBRESOURCE_*` ou `PARTNER_OFFER_*`.

**Filtre statut V1 :** toutes lignes (pending rare en dev) ; optionnel filtre `status=completed` par défaut en service.

### 3.4 Canal de redemption (sans nouvelle colonne)

| Source | Heuristique V1 |
|--------|----------------|
| Scan partenaire | `metadata.event == "redemption_success"` ou `partner_user_id` présent |
| Self-redeem citoyen | metadata vide `{}` |
| Autre | `unknown` |

Pas de migration — lecture JSONB existante.

### 3.5 Tests backend à prévoir (04E-A)

| Cas | Attendu |
|-----|---------|
| Offre inexistante | 404 `OFFER_NOT_FOUND` |
| Offre sans redemption | 200, `items=[]`, `total=0` |
| Offre avec N redemptions | Pagination, ordre `redeemed_at DESC` |
| RBAC | 403 sans permission staff |
| PII | email/display_name présents si user lié |

Fixture : réutiliser patterns `test_admin_passports_api.py` / `_seed_passport_fixture`.

---

## 4. Inventaire backend — audit offre

### 4.1 État actuel

| Mécanisme | Offers | Passport Ops | Partners |
|-----------|--------|--------------|----------|
| Table audit dédiée | ❌ | ✅ `passport_admin_actions` | ✅ `partner_admin_actions` |
| GET timeline | ❌ | ✅ `/admin/passports/{id}/actions` | ❌ (écrit seulement) |
| Champs dénormalisés | `moderated_*`, `rejection_reason` | `suspended_at`, etc. | — |

**Modération offre** (`partner_offer_service.py`) :

- `approve_offer`, `reject_offer`, `archive_offer` → `_transition_offer` met à jour `moderated_by_user_id`, `moderated_at`
- **Aucun** `record_admin_action` équivalent offre

### 4.2 Table proposée — `offer_admin_actions`

Mirror minimal de `passport_admin_actions` :

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | UUID PK | |
| `partner_offer_id` | FK CASCADE | Index |
| `action` | string(32) | `approve`, `reject`, `archive` (V1) |
| `actor_user_id` | FK users SET NULL | Staff |
| `previous_status` | string(32) | |
| `new_status` | string(32) | |
| `reason` | text NOT NULL | Reject : motif partenaire ; approve/archive : chaîne fixe staff |
| `metadata` | JSONB nullable | Extension (ex. `organization_id`) |
| `created_at` | timestamptz NOT NULL | **`now()` explicite** (leçon 03C-D tri) |

**Hors scope V1 :** `edit`, `create`, `submit` — peuvent être 04F si besoin.

### 4.3 Endpoint proposé (04E-B)

```txt
GET /api/v1/admin/partner-offers/{offer_id}/actions
  ?page=1&page_size=20
```

**Item** (`AdminOfferActionItem`) :

| Champ | Description |
|-------|-------------|
| `id`, `action`, `previous_status`, `new_status`, `reason`, `created_at` | |
| `actor_user` | `{ id, email, display_name }` — pattern Passport Ops |

### 4.4 Écriture audit — points d’accroche

Dans `PartnerOfferService` **sans nouvelle route** :

| Mutation existante | Action audit | Reason |
|--------------------|--------------|--------|
| `approve_offer` | `approve` | « Offre approuvée et publiée. » |
| `reject_offer` | `reject` | `payload.reason` |
| `archive_offer` | `archive` | « Offre archivée. » |

**Zone rouge :** migration Alembic + tests idempotence + RBAC. **Pas de backfill historique** V1 — timeline commence à la mise en prod 04E-B (option : ligne synthétique « historique antérieur non disponible » côté UI si `total=0` et `moderated_at` présent).

### 4.5 Tests backend à prévoir (04E-B)

| Cas | Attendu |
|-----|---------|
| Approve → GET actions | 1 entrée, transitions correctes |
| Reject → GET actions | reason persisté |
| Archive | idem |
| GET pagination | ordre `created_at DESC` |
| Offre inconnue | 404 |

Référence : `test_admin_passport_actions_api.py`.

---

## 5. Inventaire frontend admin

### 5.1 État 04C (placeholders)

Fichier : `offer-detail-view.tsx`

- `OfferDetailPreviewSection` × 2 — à remplacer par sections réelles
- Refresh global déjà câblé — étendre à `Promise.all([detail, redemptions, actions])`

### 5.2 Patterns à réutiliser (Passport Ops)

| Composant source | Cible 04E |
|------------------|-----------|
| `passport-detail-redemptions-section.tsx` | `offer-detail-redemptions-section.tsx` (colonnes inversées : Passport au lieu d’Offre) |
| `passport-detail-audit-section.tsx` | `offer-detail-audit-section.tsx` |
| `use-admin-passport-redemptions.ts` | `use-admin-offer-redemptions.ts` |
| `use-admin-passport-actions.ts` | `use-admin-offer-actions.ts` |
| `PassportOpsPagination` | Réutilisation directe |

### 5.3 Client API à étendre

Fichier : `frontend/packages/utils/src/partner-offers-admin-api.ts`

```txt
listOfferRedemptions(offerId, { page, page_size })
listOfferActions(offerId, { page, page_size })
```

Types : `frontend/packages/types/src/admin_partner_offer.ts` (ou `admin-offer.ts` alias).

Helpers utils :

- `offerRedemptionChannelLabel(channel)`
- `offerAdminActionLabel(action)`
- `formatOfferActionStatusTransition(previous, new)`

### 5.4 Colonnes UI redemptions (proposition)

| Colonne | Contenu |
|---------|---------|
| Passport | `passport_number` + `user_display_name` ou email |
| Statut | Badge `completed` |
| Canal | Scan / App citoyen |
| Validée le | `redeemed_at` |
| Créée le | `created_at` |
| Liens | **Passport Ops** `/passport-ops/{passport_id}` |

Partenaire / offre : **redondants** sur fiche offre — ne pas répéter (contrairement à la vue passport→offre).

### 5.5 Colonnes UI audit (proposition)

Alignées Passport Ops : Action | Transition | Motif | Acteur | Date

### 5.6 États UX obligatoires

| État | Redemptions | Audit |
|------|-------------|-------|
| Loading | Skeleton / texte | idem |
| Error + retry | ✅ | ✅ |
| Empty | « Aucune utilisation enregistrée » | « Aucune action staff enregistrée » |
| Pagination | ✅ si total > page_size | ✅ |

---

## 6. Sécurité & PII

| Sujet | Règle |
|-------|-------|
| Permissions | Identiques offres admin (`moderation.manage` / `system.admin`) |
| PII | Email citoyen — même doctrine Passport Ops (staff authentifié) |
| QR / tokens | **Ne pas** exposer `metadata` brute scan en UI (IP interne OK staff) |
| Redemption cancel | **Interdit** V1 — zone rouge |
| Audit reason reject | Visible staff — déjà visible partenaire côté reject |

Checklist : `docs/ai/security-checklist.md` avant merge 04E backend.

---

## 7. Gaps récapitulatif

| Capacité | Backend | Frontend | Priorité |
|----------|---------|----------|----------|
| Liste redemptions par offre | ❌ GET | ❌ section | **P0** |
| Timeline audit modération | ❌ table + GET + write hooks | ❌ section | **P1** |
| Compteur `redemptions_count` | ✅ | ✅ 04C | — |
| Lien Passport Ops depuis redemption | — | ❌ | P0 (UI) |
| Canal scan vs self | ❌ dérivé | ❌ badge | P1 nice-to-have |
| Backfill audit historique | ❌ | N/A | Hors scope V1 |

---

## 8. Risques

| Risque | Sévérité | Mitigation |
|--------|----------|------------|
| Exposer email citoyens à staff non autorisé | Haute | Même guard que Passport Ops |
| Confondre compteur vs liste (désync) | Basse | Liste = source ; compteur = dénormalisé passport + count completed |
| Audit partiel sans backfill | Moyenne | Copy UI « actions depuis {date déploiement} » |
| Performance offre très utilisée | Basse | Pagination 20, index `partner_offer_id` existant |
| Tentation cancel redemption | Haute | Hors scope explicite + doc zone rouge |

---

## 9. Découpage BUILD proposé

| Ticket | Scope | Livrable |
|--------|-------|----------|
| **ADMIN-04E-A** | Backend redemptions | GET `…/redemptions`, schemas, repo, service, tests |
| **ADMIN-04E-B** | Backend audit | Migration `offer_admin_actions`, record on approve/reject/archive, GET `…/actions`, tests |
| **ADMIN-04E-C** | Frontend fiche offre | Remplace placeholders, hooks, API client, helpers, tests utils |

**Ordre strict :** A → B → C (C peut shipper redemptions seul si B retardé — feature-flag section audit).

**ADMIN-04D** (Moderation polish) reste **parallélisable** mais **moins urgent** post-04E-A.

---

## 10. Recommandation CTO

| Décision | Choix |
|----------|-------|
| Enchaîner avant 04D ? | **Oui** — gap métier visible sur placeholders 04C |
| Redemptions sans audit ? | **Acceptable** — ship 04E-A + 04E-C partiel si besoin |
| Nouvelle mutation produit ? | **Non** — read + journalisation passive uniquement |
| Discovery-tech séparée ? | **Non** |
| Route UI | Inchangée `/passport-offers/[id]` — sections substituent placeholders |

**Gate BUILD 04E-A :**

1. Valider ce document
2. Confirmer champs PII colonnes redemptions
3. Confirmer enum `action` audit V1 (`approve` | `reject` | `archive`)

**Prochaine étape :** validation CTO → **ADMIN-04E-A** (backend redemptions read-only).

---

## 11. Annexes — fichiers pivot

### Backend

- `backend/app/models/passport.py` — `PassportOfferRedemption`
- `backend/app/repositories/admin_passport_repository.py` — `list_redemptions` (pattern)
- `backend/app/repositories/partner_offer_repository.py` — `count_completed_redemptions`
- `backend/app/api/v1/admin_partner_offers.py` — routes à étendre
- `backend/app/services/partner_offer_service.py` — hooks audit 04E-B
- `backend/app/models/passport_admin_action.py` — modèle audit référence

### Frontend admin

- `frontend/apps/admin/components/passport-offers/detail/offer-detail-view.tsx`
- `frontend/apps/admin/components/passport-ops/detail/passport-detail-redemptions-section.tsx`
- `frontend/apps/admin/components/passport-ops/detail/passport-detail-audit-section.tsx`
- `frontend/packages/utils/src/partner-offers-admin-api.ts`

---

**Fin discovery ADMIN-04E** — en attente validation CTO pour ouverture BUILD 04E-A.
