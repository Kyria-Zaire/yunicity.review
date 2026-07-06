# ADMIN-06D — Discovery Audit Creator Content (staff)

**Phase BMAD :** DISCOVER  
**Feature :** FEATURE-ADMIN-V1 / ADMIN-06 Creators  
**Ticket :** ADMIN-06D-AUDIT-DISCOVERY  
**Date :** 2026-06-04  
**Statut :** Audit read-only — **aucun code modifié, aucun commit**

**Prérequis livrés :**

| Ticket | Statut |
|--------|--------|
| ADMIN-06A Discovery | ✅ |
| ADMIN-06B Workspace `/creator-content` | ✅ (PR #54) |
| ADMIN-06C Detail 360° `/creator-content/[id]` | ✅ (PR #55) |

**Base code auditée :** `main` post-merge PR #55 (`d6785f7`).

**Références :**

- `docs/product-review/ADMIN-06A-CREATORS-DISCOVERY.md`
- Pattern audit : `offer_admin_actions` (ADMIN-04E-B1), `event_admin_actions` (ADMIN-05D-A)
- Service : `backend/app/services/partner_creator_content_service.py`
- UI placeholder : `creator-content-detail-audit-placeholder.tsx`

---

## 1. Synthèse exécutive

ADMIN-06B/C ont livré **workspace** et **fiche 360°** avec modération **approve / reject / archive** et placeholder audit. **Creators** est le dernier module admin majeur **sans traçabilité staff persistée**.

**Recommandation CTO :** implémenter une table dédiée **`creator_content_admin_actions`** en copiant le pattern **Offers** (le plus proche : mêmes 3 actions, même side-effect `org.visibility = PUBLIC` à l’approve, même sync feed). Découper BUILD :

| Ticket | Scope | Priorité |
|--------|--------|----------|
| **ADMIN-06D-A** | Migration + modèle + repo + écriture dans `approve/reject/archive` + `GET .../actions` + tests API | **P0** |
| **ADMIN-06D-B** | Timeline UI (remplace placeholder) + hook + types + refresh post-action | **P0** (après A) |
| **ADMIN-06D-C** | Polish / liens (filtre `organization_id` API liste, lien partenaire filtré) | **P1** (optionnel, frontend/backend léger) |

**Hors scope 06D :** creator profiles, missions, audit actions partenaire (create/submit).

---

## 2. État actuel

### 2.1 Modèle métier

Table **`partner_creator_contents`** — champs modération utiles mais **non historiques** :

| Champ | Rôle |
|-------|------|
| `status` | État courant (`draft` … `archived`) |
| `is_active` | Distribution feed / public |
| `moderated_by_user_id` | **Dernier** modérateur seulement |
| `moderated_at` | **Dernière** action staff |
| `rejection_reason` | **Dernier** motif refus |

→ Insuffisant pour timeline multi-actions (ex. approve puis reject d’un republish futur, ou archive après publish).

### 2.2 Actions staff existantes

Fichier : `PartnerCreatorContentService` — routes `admin_partner_creator_contents.py`

| Action | Route | Transaction |
|--------|-------|-------------|
| Approve | `POST /{id}/approve` | 1× `commit` après transition + feed upsert + **org PUBLIC** |
| Reject | `POST /{id}/reject` | 1× `commit` après transition + feed deactivate |
| Archive | `POST /{id}/archive` | 1× `commit` après transition + feed deactivate |

**Aucun** `record_admin_action` aujourd’hui.

### 2.3 Feed sync

`FeedCreatorContentSyncService` :

- **approve** → `upsert_creator_content_post` (`PostType.PARTNER_CREATOR`, `is_active` selon statut)
- **reject / archive** → `deactivate_creator_content_post` (`post.is_active = false`)

L’audit **ne doit pas** piloter le feed — seulement **tracer** ce qui s’est passé dans la même transaction que la mutation.

### 2.4 Frontend

- Placeholder : « Timeline contenu prévue en ADMIN-06D »
- Client : `archiveContent` présent ; **pas** de `listContentActions`
- Après modération : `reload()` fiche — suffisant ; ajouter `reload` timeline en 06D-B

---

## 3. Réponses inspection backend (10 questions)

### 1. Où brancher l’écriture audit ?

**Dans `PartnerCreatorContentService`**, immédiatement **après** `_transition_content` (statuts connus) et **avant** `commit`, sur le même modèle que `PartnerOfferService._record_offer_admin_action` :

- `approve_content` — capturer `previous_status` **avant** transition
- `reject_content` — idem + `reason` du payload
- `archive_content` — idem + motif système (constante, comme offres)

**Ne pas** brancher dans le repository feed ni dans les routes (logique métier = service).

### 2. Quelle transaction porte approve/reject/archive ?

**Une transaction SQLAlchemy par action** : toutes les étapes jusqu’à `await self._session.commit()` :

```txt
_require_content
→ previous_status = content.status (normalisé string)
→ _transition_content(...)
→ [NOUVEAU] record_admin_action(...)
→ [approve] org.visibility = PUBLIC + FeedCreatorContentSyncService.upsert_*
→ [reject/archive] FeedCreatorContentSyncService.deactivate_*
→ commit
```

Si `record_admin_action` échoue → rollback global (comportement attendu).

### 3. Existe-t-il déjà une table réutilisable ?

**Non.** Tables audit **par domaine** :

| Table | FK parent |
|-------|-----------|
| `passport_admin_actions` | `passport_id` |
| `offer_admin_actions` | `partner_offer_id` |
| `event_admin_actions` | `local_event_id` |
| *(manquant)* | `partner_creator_content_id` |

Pas de table générique `admin_actions` polymorphique.

### 4. Une table dédiée est-elle nécessaire ?

**Oui** — FK CASCADE sur `partner_creator_contents`, index par `creator_content_id`, schéma identique aux sœurs pour maintenabilité et requêtes simples.

### 5. Quels champs minimum ?

Alignés sur `offer_admin_actions` / `event_admin_actions` :

| Colonne | Obligatoire | Notes |
|---------|-------------|-------|
| `id` | PK UUID | |
| `creator_content_id` | FK NOT NULL | `ondelete=CASCADE` |
| `actor_user_id` | FK nullable | `ondelete=SET NULL` |
| `action` | string(32) NOT NULL | `approve`, `reject`, `archive` |
| `previous_status` | string(32) nullable | statut `partner_creator_contents.status` |
| `new_status` | string(32) nullable | après transition |
| `reason` | text nullable | reject = motif partenaire ; approve/archive = copy système FR |
| `metadata` | JSONB nullable | V1 optionnel interne (ex. `feed_sync: upsert|deactivate`) — **non exposé API** |
| `created_at` | timestamptz NOT NULL | `server_default=now()` ; permettre override comme offres |

**Index recommandés :** `(creator_content_id)`, `(actor_user_id)`, `(action)`, `(created_at DESC)`.

### 6. Quels statuts réels transitent ?

Workflow `partner_creator_content_workflow.py` :

| Action staff | Transition autorisée |
|--------------|----------------------|
| **approve** | `pending_review` → `published` |
| **reject** | `pending_review` → `rejected` |
| **archive** | `published` → `archived` |

**Transitions partenaire (hors audit staff V1) :**

- `draft` → `pending_review` (submit)
- `rejected` → `draft` (édition implicite via update, pas action staff)

**Écart UI/API détecté :** le frontend autorise **reject** si `status === published` (`canAdminRejectCreatorContent`), mais le **workflow backend interdit** `published` → `rejected`. L’API renverrait `422 INVALID_CREATOR_CONTENT_TRANSITION`. **Recommandation 06D-C ou hotfix :** retirer reject sur `published` côté UI ou étendre le workflow (décision produit) — **hors audit strict**.

### 7. Quels motifs existent déjà ?

| Action | Motif aujourd’hui |
|--------|-------------------|
| **reject** | `PartnerCreatorContentRejectRequest.reason` (obligatoire, max 500) — stocké aussi dans `content.rejection_reason` |
| **approve** | Aucun champ motif — proposer constante `CREATOR_CONTENT_ADMIN_APPROVE_REASON` (miroir offres) |
| **archive** | Aucun — proposer `CREATOR_CONTENT_ADMIN_ARCHIVE_REASON` |

### 8. Où exposer le GET actions ?

**Route proposée :**

```http
GET /api/v1/admin/partner-creator-content/{content_id}/actions?page=1&page_size=20
```

- Guard : `moderation.manage` | `system.admin` (identique liste/détail)
- Service dédié léger : `AdminPartnerCreatorContentService.list_content_actions` **ou** méthodes sur repo appelées depuis route (pattern `AdminPartnerOfferService.list_offer_actions`)
- Pagination : default 20, max 50 (aligné events/offers)

### 9. Impact feed ?

- **Écriture audit :** aucun impact direct sur `posts`
- **Ordre dans transaction :** audit **après** transition, **avant** feed sync — si feed échoue, rollback annule aussi l’audit (cohérent)
- **metadata V1 (optionnel) :** `{ "feed_effect": "upsert" | "deactivate" }` pour debug ops — pas requis

### 10. Risques techniques ?

| Risque | Sévérité | Mitigation |
|--------|----------|------------|
| Migration prod (zone rouge) | Haute | Alembic idempotent (pattern 0033), review sécurité, rollback drop table |
| Transaction partielle | Moyenne | `flush` audit avant commit unique |
| Historique vide avant deploy | Info | Pas de backfill V1 — accepter timeline vide sur contenus anciens |
| Reject UI sur `published` | Moyenne | Corriger gating UI ou workflow (ticket polish) |
| Confusion `moderated_at` vs audit | Info | Documenter : champs contenu = dernier état ; audit = historique |
| RBAC lecture actions | Moyenne | Mêmes permissions que modération |

---

## 4. Proposition table `creator_content_admin_actions`

### 4.1 Pertinence du nom

**`creator_content_admin_actions`** — cohérent avec le domaine (`partner_creator_contents`) et le vocabulaire produit « Creator Content ». Alternative valide : `partner_creator_content_admin_actions` (plus long, plus explicite FK) — **recommandation : `creator_content_admin_actions`** si alignement ticket ADMIN-06.

### 4.2 DDL conceptuel (miroir `offer_admin_actions`)

```sql
CREATE TABLE creator_content_admin_actions (
  id UUID PRIMARY KEY,
  creator_content_id UUID NOT NULL REFERENCES partner_creator_contents(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(32) NOT NULL,
  previous_status VARCHAR(32),
  new_status VARCHAR(32),
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_creator_content_admin_actions_content_id ON creator_content_admin_actions (creator_content_id);
CREATE INDEX ix_creator_content_admin_actions_actor_user_id ON creator_content_admin_actions (actor_user_id);
CREATE INDEX ix_creator_content_admin_actions_action ON creator_content_admin_actions (action);
CREATE INDEX ix_creator_content_admin_actions_created_at ON creator_content_admin_actions (created_at);
```

### 4.3 Nullables & cascade

| Colonne | Nullable | FK on delete |
|---------|----------|--------------|
| `creator_content_id` | NON | CASCADE (suppression contenu → purge audit) |
| `actor_user_id` | OUI | SET NULL (compte staff supprimé) |
| `previous_status` / `new_status` | OUI | — |
| `reason` | OUI | approve peut avoir motif système non null en pratique |
| `metadata` | OUI | réservé V2 |

---

## 5. Parité produit — comparaison modules

| Dimension | Passport | Offers | Events | **Creator content** |
|-----------|----------|--------|--------|------------------------|
| Table audit | ✅ | ✅ | ✅ | ❌ |
| Actions auditées V1 | diverses | approve, reject, archive | approve, reject, cancel | approve, reject, archive |
| GET `/{id}/actions` | ✅ | ✅ | ✅ | ❌ |
| UI timeline | ✅ | ✅ | ✅ | placeholder |
| Statuts | passport-specific | 5 statuts offre | 3 modération + cancel bool | 5 statuts contenu |
| Feed sync | — | ✅ | ✅ | ✅ `PARTNER_CREATOR` |
| Approve → org PUBLIC | — | ✅ | — | ✅ |
| Reject published | — | ❌ workflow | partiel | ❌ workflow (UI incohérent) |

### 5.1 Peut-on copier le pattern ?

**Oui — copier Offers quasi à l’identique :**

1. `app/core/creator_content_admin_constants.py` — enum actions + motifs système
2. `app/models/creator_content_admin_action.py`
3. `app/repositories/admin_partner_creator_content_repository.py` (ou section dans repo admin dédié) — `record_admin_action`, `list_admin_actions`
4. Hooks dans `PartnerCreatorContentService` (3 méthodes)
5. `app/schemas/admin_partner_creator_content.py` — `AdminCreatorContentActionItem`, list response
6. Route `GET /{content_id}/actions` dans `admin_partner_creator_contents.py`
7. Tests `test_admin_partner_creator_content_actions_audit_api.py`

### 5.2 Différences spécifiques

| Différence | Impact audit |
|------------|--------------|
| Statut `published` vs `approved` | Stocker les **vraies** valeurs `partner_creator_contents.status` dans `previous_status` / `new_status` (pas traduire en « approved ») |
| Reject depuis `published` (UI seulement) | N’auditer que transitions **réellement exécutées** |
| Pas de cancel booléen | Pas d’action `cancel` — **archive** = retrait opérationnel |
| Side-effect org PUBLIC | Optionnel : `metadata = {"organization_visibility": "public"}` sur approve — **non exposé V1** |

### 5.3 Contraintes feed

- Même séquence que offres : audit n’altère pas le post
- Sur **archive**, le feed est désactivé — l’audit documente `published` → `archived`
- Pas de double post : contrainte unique `posts.partner_creator_content_id` déjà en place

---

## 6. Actions à auditer — recommandation V1

| Action | Auditer V1 ? | Justification |
|--------|--------------|---------------|
| **approve** | ✅ Oui | Action staff critique + side-effect org |
| **reject** | ✅ Oui | Motif partenaire obligatoire |
| **archive** | ✅ Oui | Retrait public / feed |
| **create** (partenaire) | ❌ Non | Hors périmètre staff ; pas de route staff create |
| **edit** (partenaire draft) | ❌ Non | Bruit opérationnel ; pas d’action staff |
| **submit** (partenaire) | ❌ Non | Peut être ticket futur « partner_audit » séparé |
| **restore** | ❌ N/A | Pas dans le workflow |

**V1 = 3 actions staff** — aligné Offers.

---

## 7. API READ — contrat proposé

### 7.1 Endpoint

`GET /api/v1/admin/partner-creator-content/{content_id}/actions`

Query : `page`, `page_size` (max 50)

### 7.2 Réponse (Pydantic)

```json
{
  "items": [
    {
      "id": "uuid",
      "action": "approve",
      "previous_status": "pending_review",
      "new_status": "published",
      "reason": "Contenu approuvé et publié.",
      "actor_user": { "id": "uuid", "email": "...", "display_name": "..." },
      "created_at": "2026-06-04T12:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20
}
```

- **`metadata` : non exposée V1** (comme pattern offres côté API publique — colonne DB seulement si besoin ops)
- **`actor_user` :** jointure `User` + `UserProfile.display_name` (copier `AdminPartnerOfferActionItem`)
- **404** si `content_id` inconnu (avant liste vide)

### 7.3 Constantes action

```python
class CreatorContentAdminAction(StrEnum):
    APPROVE = "approve"
    REJECT = "reject"
    ARCHIVE = "archive"
```

---

## 8. Impact frontend

### 8.1 Emplacement

Remplacer `CreatorContentDetailAuditPlaceholder` dans `creator-content-detail-view.tsx` par **`CreatorContentDetailAuditSection`** (copie `OfferDetailAuditSection` / `EventDetailAuditSection`).

### 8.2 UX

| Élément | Choix |
|---------|--------|
| Layout | Tableau + `PassportOpsPagination` (parité Offers/Events) |
| Colonnes | Action · Transition statut · Motif · Acteur · Date |
| Pagination | 20 / page |
| Refresh | `useAdminCreatorContentActions(contentId, detailReady)` ; après approve/reject/archive : `actions.reload()` dans `handleRefresh` (pattern offer detail) |
| Empty | « Aucune action staff enregistrée » + copy modération à venir pour contenus historiques |

### 8.3 Fichiers frontend estimés (06D-B)

- `lib/hooks/use-admin-creator-content-actions.ts`
- `components/creator-content/detail/creator-content-detail-audit-section.tsx`
- `packages/types` — types action list (si pas générés inline)
- `packages/utils` — `listContentActions` sur API client + labels `creatorContentAdminActionLabel`
- Mise à jour `creator-content-detail-view.tsx`

---

## 9. Découpage BUILD proposé

### ADMIN-06D-A — Backend audit (P0)

**Livrables :**

- Migration Alembic `creator_content_admin_actions`
- Modèle ORM + `__init__.py`
- `creator_content_admin_constants.py`
- Repository `record_admin_action` / `list_admin_actions`
- Patch `PartnerCreatorContentService` (3 actions)
- Schemas + route GET actions
- Tests intégration : approve → 1 ligne audit ; reject avec reason ; archive ; liste paginée ; RBAC ; 404

**Gates :** review sécurité (migration), pytest backend vert.

### ADMIN-06D-B — Audit timeline UI (P0)

**Livrables :**

- Remplacement placeholder par section réelle
- Hook + API client + helpers labels/transitions FR
- Refresh coordonné post-modération
- Tests utils labels (optionnel)

**Gates :** `pnpm --filter admin build`, test manuel fiche pending → approve → timeline.

### ADMIN-06D-C — Polish / liens (P1, optionnel)

Hors audit strict — issus discovery 06A/06B :

- `GET /admin/partner-creator-content?organization_id=` (backend)
- Lien fiche partenaire `creator_content_admin` avec query filtrée
- Corriger gating **reject** sur `published` (UI vs workflow)

Peut être traité en fin de ADMIN-06 pour **clôturer** le module sans bloquer 06D-A/B.

---

## 10. Différences Offers / Events / Creators (audit)

| | Offers | Events | Creators |
|---|--------|--------|----------|
| Clé FK audit | `partner_offer_id` | `local_event_id` | `creator_content_id` |
| 4e action | — | `cancel` (+ metadata) | — (archive suffit) |
| Champ statut audité | `offer_status` | `moderation_status` | `status` (5 valeurs) |
| Motif reject | payload | payload | payload (max 500) |
| Service écriture | `PartnerOfferService` | `LocalEventService` | `PartnerCreatorContentService` |
| Service lecture liste | `AdminPartnerOfferService` | admin events repo / service | **à créer** (léger) |

---

## 11. Recommandation CTO finale

1. **GO BUILD ADMIN-06D-A** — table dédiée + écriture transactionnelle sur les 3 mutations staff existantes. C’est le **seul gap bloquant** pour parité Passport/Offers/Events.

2. **GO BUILD ADMIN-06D-B** immédiatement après A — remplacer le placeholder ; critère « ADMIN-06 complet » côté produit.

3. **Reporter 06D-C polish** en P1 ou ticket unique « ADMIN-06 clôture » — ne pas retarder l’audit.

4. **Ne pas** auditer create/edit/submit partenaire en V1 — autre produit (piste `partner_content_events` si besoin analytics).

5. **Corriger** l’incohérence reject-sur-published (UI) lors du polish ou 06D-B.

6. **Pas de backfill** historique — accepter timeline vide sur contenus modérés avant deploy.

**Critère « ADMIN-06 COMPLET » (proposition) :**

- Workspace + detail 360° ✅ (livré)
- Timeline staff persistée + API + UI ✅ (06D-A/B)
- Tests backend audit + build admin vert
- (Optionnel) filtre org API + liens partenaire (06D-C)

→ Ensuite : **FEATURE-CREATORS-V1** (programme territorial, profils) — hors ADMIN-V1.

---

## 12. Annexes — fichiers de référence

| Rôle | Chemin |
|------|--------|
| Service mutations | `backend/app/services/partner_creator_content_service.py` |
| API admin | `backend/app/api/v1/admin_partner_creator_contents.py` |
| Workflow | `backend/app/core/partner_creator_content_workflow.py` |
| Feed sync | `backend/app/services/feed_creator_content_sync.py` |
| Pattern audit offres | `backend/app/models/offer_admin_action.py`, `partner_offer_service.py` (_record_offer_admin_action) |
| Pattern audit events | `backend/app/models/event_admin_action.py`, `local_event_service.py` |
| Migration offres | `backend/alembic/versions/20260604_0033_offer_admin_actions.py` |
| UI placeholder | `frontend/apps/admin/components/creator-content/detail/creator-content-detail-audit-placeholder.tsx` |
| UI cible | `frontend/apps/admin/components/passport-offers/detail/offer-detail-audit-section.tsx` |

---

*Document généré en phase DISCOVER — aucune modification de code. Validation CTO requise avant ADMIN-06D-A.*
