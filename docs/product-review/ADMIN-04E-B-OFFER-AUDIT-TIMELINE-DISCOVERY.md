# ADMIN-04E-B — Discovery Offer Audit Timeline

**Phase BMAD :** DISCOVER  
**Feature :** FEATURE-ADMIN-V1 / ADMIN-04 Offers  
**Ticket :** ADMIN-04E-B-OFFER-AUDIT-TIMELINE-DISCOVERY  
**Date :** 2026-06-04  
**Statut :** Audit read-only — **aucun code modifié, aucun commit**

**Prérequis livrés :**

| Ticket | Statut |
|--------|--------|
| ADMIN-04A Offers Discovery | ✅ |
| ADMIN-04B Workspace | ✅ |
| ADMIN-04C Offer Detail 360° | ✅ |
| ADMIN-04E-A Redemptions API | ✅ PR #43 |
| ADMIN-04E-C Redemptions UI | ✅ PR #44 |
| ADMIN-03C-D Passport audit | ✅ `passport_admin_actions` + GET actions |

**Base code auditée :** `main` post-merge PR #44 (`65619e9`).

**Placeholder UI restant :**

```txt
« Timeline offre prévue en ADMIN-04E-B. »
→ OfferDetailPreviewSection dans offer-detail-view.tsx
```

---

## 1. Synthèse exécutive

La modération offre (approve / reject / archive) est **opérationnelle** via `PartnerOfferService`, mais **non journalisée** : seuls `moderated_by_user_id`, `moderated_at` et `rejection_reason` (dernier état) subsistent sur `partner_offers`.

**Recommandation CTO :**

| Décision | Choix |
|----------|-------|
| Table dédiée | **Oui** — `offer_admin_actions` (miroir `passport_admin_actions`) |
| Actions V1 | **approve**, **reject**, **archive** uniquement |
| Backfill | **Non** — timeline à partir du déploiement 04E-B1 |
| Endpoint read | `GET /admin/partner-offers/{offer_id}/actions` |
| Frontend | **Table paginée** (pattern Passport Ops audit, pas timeline verticale) |
| BUILD | **04E-B1** backend → **04E-B2** frontend |

**Garde-fous validés :** aucune nouvelle action lifecycle, pas de changement redemptions, pas de backfill, écriture passive sur mutations existantes, GET read-only.

---

## 2. État actuel — backend

### 2.1 Endpoints modération existants

Fichier : `backend/app/api/v1/admin_partner_offers.py`

| Method | Path | Service | `current_user` |
|--------|------|---------|----------------|
| POST | `/{offer_id}/approve` | `PartnerOfferService.approve_offer(moderator, …)` | ✅ injecté |
| POST | `/{offer_id}/reject` | `PartnerOfferService.reject_offer(moderator, …)` | ✅ + body `reason` |
| POST | `/{offer_id}/archive` | `PartnerOfferService.archive_offer(moderator, …)` | ✅ injecté |

RBAC : `moderation.manage` \| `system.admin` — identique redemptions.

### 2.2 Service & transitions

Fichier : `backend/app/services/partner_offer_service.py`

```txt
approve_offer  → _transition_offer(..., PUBLISHED, moderator, clear_rejection=True)
               → org.visibility = public, feed sync, commit

reject_offer   → _transition_offer(..., REJECTED, moderator, rejection_reason=payload.reason)
               → feed deactivate, commit

archive_offer  → _transition_offer(..., ARCHIVED, moderator, clear_rejection=True)
               → feed deactivate, commit
```

`_transition_offer` :

- Appelle `assert_transition_allowed(offer.status, target)` (`partner_offer_workflow.py`)
- Met à jour `offer.status`, `offer.is_active`
- Si `moderator` : `moderated_by_user_id`, `moderated_at = now(UTC)`
- Reject : `rejection_reason` ; approve/archive clear : `rejection_reason = None`

**Transitions V1 autorisées (staff) :**

| Depuis | Vers | Action staff |
|--------|------|--------------|
| `pending_review` | `published` | approve |
| `pending_review` | `rejected` | reject |
| `published` | `archived` | archive |

### 2.3 Modèle `partner_offers` (champs modération)

Fichier : `backend/app/models/passport.py` — `PartnerOffer`

| Champ | Rôle audit actuel | Limite |
|-------|-------------------|--------|
| `status` | État courant | Pas d’historique |
| `moderated_by_user_id` | Dernier modérateur | Écrasé à chaque action |
| `moderated_at` | Dernière modération | Idem |
| `rejection_reason` | Dernier refus | Effacé à approve/archive |
| `created_by_user_id` | Créateur | Pas d’action « create » en V1 audit |

**Conclusion :** dénormalisation **insuffisante** pour timeline multi-événements.

### 2.4 Modèles audit existants (inspiration)

| Table | Scope | GET staff | Écriture offres |
|-------|-------|-----------|-----------------|
| `passport_admin_actions` | Passport citoyen | ✅ `/admin/passports/{id}/actions` | N/A |
| `partner_admin_actions` | Organisation partenaire | ❌ pas d’endpoint liste | N/A |

**Pattern retenu :** `passport_admin_actions` (plus proche : transition statut + reason + actor).

`PassportAdminAction` : `passport_id`, `user_id` (citoyen), `action`, `actor_user_id`, `previous_status`, `new_status`, `reason` NOT NULL, `metadata`, `created_at`.

Pour offres : **pas besoin de `user_id` citoyen** — le sujet est l’offre (`partner_offer_id`).

`PartnerAdminAction` : `reason` nullable — offres : **reason NOT NULL** (aligné passport, reject a toujours un motif ; approve/archive = libellé fixe staff).

### 2.5 Repository / service read existants (04E-A)

| Module | Rôle |
|--------|------|
| `admin_partner_offer_repository.py` | `offer_exists`, `list_offer_redemptions` |
| `admin_partner_offer_service.py` | Read redemptions uniquement |
| `partner_offer_repository.py` | CRUD offres, modération métier |

**04E-B1 :** étendre `admin_partner_offer_repository` + soit étendre `admin_partner_offer_service`, soit ajouter méthodes read dans un service dédié — **recommandé : un seul `AdminPartnerOfferService`** pour tous les sous-ressources read (`redemptions`, `actions`).

### 2.6 Tests actuels

Fichier : `backend/tests/test_admin_partner_offers.py`

- `test_approve_and_archive_offer` — vérifie statuts + visibility, **pas d’audit**
- Pas de test reject dédié dans ce fichier (couvert ailleurs possible — `test_partner_offer_moderation.py`)

**04E-B1 :** nouveau fichier `test_admin_partner_offer_actions_api.py` (miroir `test_admin_passport_actions_api.py`).

---

## 3. Réponses aux 10 questions backend

### 3.1 Où brancher l’écriture audit ?

**Dans `PartnerOfferService`**, immédiatement après `_transition_offer` et **avant** `await self._session.commit()` :

| Méthode | Point d’accroche |
|---------|------------------|
| `approve_offer` | Après `_transition_offer`, avant feed/commit |
| `reject_offer` | Idem |
| `archive_offer` | Idem |

Appel : `AdminPartnerOfferRepository.record_admin_action(...)` (ou méthode statique repo injectée via session partagée).

**Même transaction** que la mutation offre + feed — rollback atomique si échec.

**Ne pas** brancher dans les routes FastAPI (logique métier hors handlers — doctrine projet).

### 3.2 Faut-il une table `offer_admin_actions` ?

**Oui.**

Justification :

- `partner_admin_actions` = scope **organisation**, pas offre
- `passport_admin_actions` = scope **passport**, pas offre
- Champs `partner_offers.moderated_*` = dernier état seulement

### 3.3 Quels champs minimaux ?

```sql
offer_admin_actions
├── id              UUID PK
├── partner_offer_id UUID FK → partner_offers.id ON DELETE CASCADE
├── action          VARCHAR(32) NOT NULL   -- approve | reject | archive
├── actor_user_id   UUID FK → users.id ON DELETE SET NULL
├── previous_status VARCHAR(32) NULL      -- offer.status avant transition
├── new_status      VARCHAR(32) NULL      -- offer.status après transition
├── reason          TEXT NOT NULL
├── metadata        JSONB NULL            -- extension (organization_id, feed, …)
└── created_at      TIMESTAMPTZ NOT NULL  -- now() explicite à l’insert (leçon 03C-D)
```

**Index recommandés :** `partner_offer_id`, `action`, `actor_user_id`, `created_at`.

**Hors scope colonnes V1 :** `organization_id` redondant (via offer), `created_by_user_id` offre.

### 3.4 Comment capturer `previous_status` / `new_status` ?

```python
previous_status = offer.status  # AVANT _transition_offer
# ... _transition_offer(offer, target, ...)
new_status = target.value       # ou offer.status après transition
```

Utiliser les **valeurs string** enum (`PartnerOfferStatus.*.value`) — cohérent passport/partner audit.

### 3.5 Où récupérer `actor_user_id` ?

**Déjà disponible :** paramètre `moderator: User` passé depuis la route :

```python
async def approve_partner_offer(
    current_user: Annotated[User, Depends(_staff_guard)],
    ...
):
    return await PartnerOfferService(session).approve_offer(current_user, offer_id)
```

→ `actor_user_id = moderator.id`

### 3.6 Quelle `reason` pour reject ?

**`payload.reason.strip()`** — même texte que `offer.rejection_reason` (visible partenaire).

Validation existante : `PartnerOfferRejectRequest.reason` min 1, max 1000.

### 3.7 Quelle `reason` pour approve / archive ?

**Libellés fixes staff** (NOT NULL, pas de champ UI supplémentaire) :

| Action | `reason` proposée |
|--------|-------------------|
| approve | `Offre approuvée et publiée.` |
| archive | `Offre archivée.` |

Alternative : inclure `organization_id` en `metadata` pour support, pas dans `reason`.

**Ne pas** réutiliser `rejection_reason` pour approve/archive.

### 3.8 Faut-il backfill historique ?

**Non.**

| Approche | Verdict |
|----------|---------|
| Backfill depuis `moderated_at` / `rejection_reason` | ❌ Une seule ligne max, rejets antérieurs perdus |
| Ligne synthétique « historique antérieur » | ❌ Trompeur |
| Timeline vide + copy UI | ✅ |

**Copy empty state proposée :**

> Aucune action staff enregistrée. L’historique commence à partir du déploiement de la journalisation modération.

Option : si `moderated_at` présent et `total == 0`, bandeau info non bloquant (pas de fausse ligne audit).

### 3.9 Quel endpoint read ?

```http
GET /api/v1/admin/partner-offers/{offer_id}/actions
  ?page=1&page_size=20
```

| Aspect | Détail |
|--------|--------|
| Guard | `_staff_guard` (identique module) |
| 404 | `OFFER_NOT_FOUND` si offre absente |
| 403 | USER / partenaire sans permission |
| Pagination | default 20, max 50 — réutiliser constantes `ADMIN_OFFER_REDEMPTION_*` ou alias `ADMIN_OFFER_SUBRESOURCE_*` |
| Tri | `created_at DESC` |
| Response | Voir §4 |

**Placement route :** après `GET /{offer_id}/redemptions`, avant PATCH (comme passport).

### 3.10 Risques migration / Alembic heads ?

**État local (2026-06-04) :** tête unique `20260603_0032` (merge `passport_admin_actions` + activation waves).

| Risque | Mitigation |
|--------|------------|
| Nouvelle branche Alembic | **Non** — révision linéaire `down_revision = "20260603_0032"` |
| Table déjà existante (re-run) | Pattern `inspector.get_table_names()` + early return (comme `0031`) |
| Zone rouge migration | Review humaine, test upgrade/downgrade en dev |
| Conflit heads CI | Vérifier `alembic heads` = 1 avant merge |

**Pas de modification** `passport_admin_actions` ni `partner_admin_actions`.

---

## 4. Design API — GET actions

### 4.1 Schémas Pydantic proposés

Fichier : `backend/app/schemas/admin_partner_offer.py` (extension)

```python
OfferAdminActionKind = Literal["approve", "reject", "archive"]

class AdminOfferActionActorUser(BaseModel):
    id: UUID
    email: str
    display_name: str | None = None

class PartnerOfferAdminActionItem(BaseModel):
    id: UUID
    action: OfferAdminActionKind
    previous_status: str | None
    new_status: str | None
    reason: str
    actor_user: AdminOfferActionActorUser
    created_at: datetime

class PartnerOfferAdminActionListResponse(BaseModel):
    items: list[PartnerOfferAdminActionItem]
    total: int
    page: int
    page_size: int
```

### 4.2 Constantes métier

Nouveau fichier proposé : `backend/app/core/offer_admin_constants.py`

```python
class OfferAdminAction(StrEnum):
    APPROVE = "approve"
    REJECT = "reject"
    ARCHIVE = "archive"

OFFER_ADMIN_ACTIONS: frozenset[str] = frozenset(...)
OFFER_ADMIN_APPROVE_REASON = "Offre approuvée et publiée."
OFFER_ADMIN_ARCHIVE_REASON = "Offre archivée."
```

Validation GET : rejeter actions inconnues en base avec 500 contrôlé (pattern passport `INVALID_PASSPORT_ADMIN_ACTION`).

### 4.3 Mapping acteur

Join `users` + `UserProfile` (outerjoin) — identique `AdminPassportRepository.list_admin_actions` :

- `display_name` ← profile, fallback `user.full_name`
- email toujours exposé (staff authentifié — même doctrine Passport Ops)

---

## 5. Impact sur actions existantes

| Mutation | Changement comportement | Changement API contract |
|----------|-------------------------|-------------------------|
| approve | +1 INSERT audit | ❌ inchangé |
| reject | +1 INSERT audit | ❌ inchangé |
| archive | +1 INSERT audit | ❌ inchangé |
| PATCH update | ❌ pas d’audit V1 | ❌ |
| create admin | ❌ | ❌ |
| redemptions | ❌ | ❌ |

**Performance :** 1 INSERT supplémentaire par action modération — négligeable.

**Idempotence :** chaque POST modération = nouvelle ligne (pas de déduplication — comportement attendu).

---

## 6. Réponses aux 5 questions frontend

### 6.1 Peut-on réutiliser le pattern Passport Audit Timeline ?

**Oui — composant table, pas timeline verticale.**

Référence : `passport-detail-audit-section.tsx` — colonnes Action | Transition | Motif | Acteur | Date + `PassportOpsPagination`.

**Ne pas** réutiliser le composant tel quel (types différents) — **cloner/adaptater** en `offer-detail-audit-section.tsx`.

### 6.2 Section tableau ou timeline ?

**Tableau paginé** — cohérence Passport Ops + Redemptions (04E-C).

Une timeline verticale ajouterait un style divergent sans gain ops pour 3 types d’actions.

### 6.3 Où placer la section ?

Dans `offer-detail-view.tsx`, **après** `OfferDetailRedemptionsSection`, **remplacer** `OfferDetailPreviewSection` « Historique staff ».

Ordre final proposé :

```txt
… Modération → Édition → Redemptions → Historique staff (audit)
```

### 6.4 Refresh après approve/reject/archive ?

**Oui — trois déclencheurs :**

| Déclencheur | Comportement |
|-------------|--------------|
| `actionSuccess` (modération) | `void actions.reload()` — pattern `passport-detail-view.tsx` L46-53 |
| Bouton Actualiser header | `Promise.all([reload(), redemptions.reload(), actions.reload()])` — étendre handler 04E-C |
| Pagination | hook `useAdminOfferActions` avec `page` state |

Après modération : le hook `useAdminOfferDetail` recharge déjà l’offre (`syncOffer`) — statut à jour ; **audit nécessite reload explicite** (nouvelle ligne).

### 6.5 Quels labels action / statut ?

Helpers dans `frontend/packages/utils/src/admin-offer.ts` :

| Helper | Exemple |
|--------|---------|
| `offerAdminActionLabel("approve")` | « Approbation » |
| `offerAdminActionLabel("reject")` | « Refus » |
| `offerAdminActionLabel("archive")` | « Archivage » |
| `formatOfferAdminActionStatusTransition(prev, next)` | « En attente de validation → Publiée » via `offerStatusLabel` |

Tests vitest dans `admin-offer.test.ts`.

---

## 7. Design frontend (04E-B2)

### 7.1 Fichiers prévus

| Fichier | Action |
|---------|--------|
| `packages/types/src/admin_partner_offer.ts` | Types actions |
| `packages/utils/src/partner-offers-admin-api.ts` | `listOfferActions(offerId, params)` |
| `packages/utils/src/admin-offer.ts` | Labels + transition |
| `apps/admin/lib/hooks/use-admin-offer-actions.ts` | Miroir `use-admin-passport-actions.ts` |
| `apps/admin/components/passport-offers/detail/offer-detail-audit-section.tsx` | Nouveau |
| `apps/admin/components/passport-offers/detail/offer-detail-view.tsx` | Intégration + refresh |

**Supprimer** l’usage du placeholder audit (garder `offer-detail-preview-section.tsx` pour autres usages futurs ou supprimer import).

### 7.2 États UX

| État | Comportement |
|------|--------------|
| Loading | « Chargement de l'historique staff… » |
| Error + retry | Bandeau rose |
| Empty | « Aucune action staff enregistrée » + sous-texte déploiement |
| Success table | Lignes paginées |

---

## 8. Tests nécessaires

### 8.1 Backend — `test_admin_partner_offer_actions_api.py`

| # | Cas |
|---|-----|
| 1 | MODERATOR — approve → GET actions contient 1 ligne `approve` |
| 2 | MODERATOR — reject avec reason → ligne `reject` + reason = payload |
| 3 | MODERATOR — archive après published → ligne `archive` |
| 4 | USER simple → GET 403 |
| 5 | Offer inconnue → GET 404 |
| 6 | Pagination page_size |
| 7 | Tri `created_at DESC` (2 actions) |
| 8 | `previous_status` / `new_status` corrects |
| 9 | `actor_user.email` présent |
| 10 | `actor_user.display_name` présent si profile |

Fixture : org vérifiée + offre `pending_review` → approve → reject flow sur autre offre si besoin.

**Étendre** `test_approve_and_archive_offer` : optionnel assert COUNT audit post-action (éviter double responsabilité — préférer fichier dédié).

### 8.2 Frontend

| Check | Commande |
|-------|----------|
| Types | `pnpm --filter @yunicity/types exec tsc --noEmit` |
| Utils tests | `pnpm --filter @yunicity/utils test -- admin-offer` |
| Admin | `pnpm --filter admin exec tsc --noEmit` + `build` |

Pas de e2e obligatoire V1 si tests API + manuel recette.

---

## 9. Sécurité & garde-fous

| Garde-fou | Validation discovery |
|-----------|---------------------|
| Aucune nouvelle action lifecycle | ✅ Écriture passive sur 3 POST existants |
| Aucun changement redemptions | ✅ Fichiers 04E-A/C non touchés en B1 |
| Pas de backfill | ✅ Documenté |
| Audit actions futures seulement | ✅ INSERT post-déploiement |
| GET read-only | ✅ Pas de POST/PATCH sur `/actions` |
| PII acteur staff | ✅ Email staff — même niveau Passport |
| Motif reject | ✅ Exposé staff (déjà visible partenaire) |
| Zone rouge | Migration + hooks commit transaction + tests RBAC |

Checklist : `docs/ai/security-checklist.md` avant merge 04E-B1.

---

## 10. Découpage BUILD recommandé

### ADMIN-04E-B1 — Backend audit + GET actions

| Livrable | Détail |
|----------|--------|
| Migration | `offer_admin_actions` |
| Modèle | `backend/app/models/offer_admin_action.py` |
| Constantes | `offer_admin_constants.py` |
| Repository | `record_admin_action`, `list_admin_actions` dans `admin_partner_offer_repository.py` |
| Service read | `AdminPartnerOfferService.list_offer_actions` |
| Service write | Hooks dans `PartnerOfferService` (3 méthodes) |
| Route | `GET /{offer_id}/actions` |
| Schemas | Pydantic items/response |
| Tests | `test_admin_partner_offer_actions_api.py` |

**Hors scope B1 :** frontend, backfill, audit edit/create.

### ADMIN-04E-B2 — Frontend audit section

| Livrable | Détail |
|----------|--------|
| Types + API client | `listOfferActions` |
| Hook | `use-admin-offer-actions.ts` |
| Composant | `offer-detail-audit-section.tsx` |
| Intégration | `offer-detail-view.tsx` + refresh |
| Helpers + tests | `admin-offer.ts` |

**Ordre :** B1 mergé → B2 (dépendance API).

---

## 11. Annexes — fichiers pivot

### Backend (modération + audit ref)

- `backend/app/api/v1/admin_partner_offers.py`
- `backend/app/services/partner_offer_service.py` — **point d’écriture**
- `backend/app/core/partner_offer_workflow.py`
- `backend/app/services/admin_partner_offer_service.py` — **point de lecture**
- `backend/app/repositories/admin_partner_offer_repository.py`
- `backend/app/models/passport_admin_action.py` — modèle ref
- `backend/app/services/admin_passport_service.py` — `list_actions` / `record_admin_action` ref
- `backend/alembic/versions/20260603_0031_passport_admin_actions.py` — migration ref

### Frontend

- `frontend/apps/admin/components/passport-offers/detail/offer-detail-view.tsx`
- `frontend/apps/admin/components/passport-offers/detail/offer-detail-preview-section.tsx`
- `frontend/apps/admin/components/passport-ops/detail/passport-detail-audit-section.tsx`
- `frontend/apps/admin/lib/hooks/use-admin-passport-actions.ts`

---

## 12. Décision gate BUILD

| Gate | Statut |
|------|--------|
| Table `offer_admin_actions` validée | ⏳ CTO |
| Pas de backfill | ⏳ CTO |
| Reasons approve/archive fixes | ⏳ CTO |
| Pattern UI = table Passport | ⏳ CTO |
| Découpage B1 / B2 | ⏳ CTO |

**Prochaine étape après validation :** ouverture **ADMIN-04E-B1** (BUILD backend).

---

**Fin discovery ADMIN-04E-B** — discovery uniquement, aucun commit.
