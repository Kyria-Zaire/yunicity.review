# ADMIN-05D — Discovery Audit / Cancel Events (staff)

**Phase BMAD :** DISCOVER  
**Feature :** FEATURE-ADMIN-V1 / ADMIN-05 Events  
**Ticket :** ADMIN-05D-DISCOVERY  
**Date :** 2026-06-04  
**Statut :** Audit read-only — **aucun code BUILD, aucun commit requis pour valider la discovery**

**Prérequis livrés :**

| Module | Statut |
|--------|--------|
| ADMIN-05A Discovery | ✅ |
| ADMIN-05B Workspace `/events` | ✅ (PR #47) |
| ADMIN-05C Detail 360° `/events/[id]` | ✅ (PR #48 → `main` @ `ee743ce`) |

**Base code auditée :** `main` post-merge PR #48.

**Références :**

- `docs/product-review/ADMIN-05A-EVENTS-DISCOVERY.md`
- `docs/product/local-events.md`
- Pattern audit offres : `offer_admin_actions`, ADMIN-04E-B1/B2

---

## 1. Synthèse exécutive

ADMIN-05B/C ont livré le **workspace** et la **fiche staff** avec modération **approve/reject** et placeholder audit. Il reste deux sujets distincts :

1. **Audit staff** — traçabilité des actions modération (et futures actions staff) ; parité avec Offers.
2. **Cancel lifecycle** — le champ `is_cancelled` existe et impacte public/feed/carte, mais **aucune API** (ni partenaire ni staff) ne le pilote.

**Recommandation CTO (à confirmer) :** ne pas fusionner audit + cancel dans un seul ticket BUILD. Découper :

| Ticket | Scope | Priorité |
|--------|--------|----------|
| **ADMIN-05D-A** | `event_admin_actions` + écriture approve/reject + `GET /admin/local-events/{id}/actions` | **P0** |
| **ADMIN-05D-B** | Timeline UI sur fiche `/events/[id]` (remplace placeholder) | **P0** (après A) |
| **ADMIN-05D-C** | Cancel staff (+ règles feed/public/partner) | **P1** |

**Polish transversal** (filtre `organization_id` sur liste admin, lien compteurs fiche partenaire) : tickets **05E** ou sous-tâches — hors périmètre strict 05D.

---

## 2. Réponses aux 8 questions discovery

### 1. Un cancel staff est-il différent d'un reject ?

**Oui — sémantique et technique différentes.**

| Dimension | **Reject** (existant) | **Cancel** (à définir) |
|-----------|----------------------|-------------------------|
| Cible | Modération contenu / conformité | Fin de vie opérationnelle d’un event **déjà accepté** |
| Champ | `moderation_status → rejected` + `rejection_reason` | `is_cancelled = true` (statut modération **inchangé**, typiquement reste `approved`) |
| Workflow | `assert_event_transition_allowed` ; partenaire peut `submit` → `pending_review` | **Pas** dans `local_event_workflow.py` aujourd’hui |
| Public | 404 (non approuvé) ou liste exclut `rejected` | **410 `EVENT_CANCELLED`** sur `GET /events/{id}` si `approved` + cancelled |
| Feed | `deactivate_event_post` à reject | `upsert_event_post` met `is_active = false` si `is_cancelled` (déjà dans `FeedEventSyncService`) |
| Partenaire | Voit rejet + motif ; peut resoumettre | Message « annulé » — **pas** de resoumission via reject |

**Conclusion :** cancel ≠ reject. Un staff ne doit pas utiliser reject pour « retirer un event du calendrier » sans casser le cycle partenaire (re-soumission).

---

### 2. Un event approved peut-il être cancel puis réactivé ?

**État actuel :** pas d’API cancel → pas de réactivation non plus.

**Recommandation produit V1 :**

- **Cancel :** autorisé depuis `approved` uniquement (staff **et/ou** partenaire — voir §7).
- **Réactivation (uncancel) :** **non** en V1 staff — évite les abus feed/carte et la confusion avec `submit` après reject.
- Si besoin ultérieur : ticket séparé `POST .../uncancel` avec règles strictes (date future, audit, notification).

**Alternative documentée (non retenue V1) :** uncancel staff = remettre `is_cancelled=false` + re-sync feed si dates encore valides.

---

### 3. Faut-il une table `event_admin_actions` ?

**Oui**, si objectif = **parité Offers** et historique multi-actions (approve, reject, cancel futur).

**Pattern existant à copier :** `offer_admin_actions` (`backend/app/models/offer_admin_action.py`)

| Colonne proposée | Type | Notes |
|------------------|------|-------|
| `id` | UUID PK | |
| `local_event_id` | UUID FK CASCADE | |
| `actor_user_id` | UUID FK SET NULL | staff |
| `action` | string(32) | `approve`, `reject`, `cancel` (V1) |
| `previous_status` | string nullable | `moderation_status` avant action |
| `new_status` | string nullable | après action |
| `reason` | text nullable | reject/cancel motif |
| `metadata` | JSONB nullable | ex. `is_cancelled` toggle |
| `created_at` | timestamptz | |

**Migration Alembic requise** — zone rouge (schéma DB) : review + rollback plan.

**Alternative rejetée pour V1 :** timeline dérivée uniquement de `moderated_at` / `rejection_reason` — insuffisant (une seule dernière modération, pas d’historique cancel).

---

### 4. Quelles actions auditer ?

**V1 (table + API) :**

| Action | Déclencheur | Champs audit |
|--------|-------------|--------------|
| `approve` | `POST /admin/local-events/{id}/approve` | previous/new `moderation_status`, reason fixe type Offers |
| `reject` | `POST /admin/local-events/{id}/reject` | + `reason` body |
| `cancel` | *05D-C* `POST /admin/local-events/{id}/cancel` | previous/new via metadata ou statut dérivé ; `reason` obligatoire |

**Hors audit V1 (pas d’endpoint staff) :**

- Création / PATCH / submit partenaire (`/organizations/me/events`) — traçabilité org, pas staff.
- Toggle intérêt citoyen.
- Auto-approval org vérifiée à la création — pas d’acteur staff.

**Rétroactivité :** pas de backfill obligatoire ; timeline vide pour events modérés avant 05D-A.

---

### 5. Impact feed / map / pages publiques ?

| Surface | Comportement actuel | Après **reject** | Après **cancel** (si API) |
|---------|---------------------|------------------|---------------------------|
| `GET /events` (liste ville) | Filtre `approved`, `!cancelled`, dates | Inchangé | Exclut cancelled (déjà) |
| `GET /events/{id}` | 404 si non approved ; **410 si cancelled** | 404 si rejected | **410** + copy annulation |
| `GET /map/events` | `!cancelled`, approved | Inchangé | Exclut cancelled |
| Recherche | `is_cancelled == false` | Inchangé | Inchangé |
| Feed post EVENT | `is_active` via sync | `deactivate` à reject | `is_active=false` si cancelled (sync à appeler) |
| Web `/sortir`, `/events/[id]` | Consomme API citoyen | Disparaît de listes | Détail 410 → UX « annulé » à valider |
| Mobile events tab | Idem | Idem | Idem |

**BUILD 05D-C doit inclure :** appel explicite `FeedEventSyncService.upsert_event_post` ou `deactivate` après cancel staff (aujourd’hui reject seul appelle `deactivate`).

**Pas de changement** du workflow auto-approval org vérifiée dans 05D.

---

### 6. Impact partner portal ?

| Zone | Impact |
|------|--------|
| `GET/PATCH /organizations/me/events` | Aujourd’hui expose `is_cancelled` en lecture via management DTO ; **pas** de PATCH cancel |
| `GET /partners/{slug}/events` | Liste publique : approved, !cancelled, gate partner status |
| UI portenaire events | Si cancel staff seulement : partenaire voit event **approved + cancelled** en back-office — besoin copy + badge « Annulé » |
| Resoumission | Cancel **ne remplace pas** reject ; pas de `submit` depuis cancelled en V1 |

**Option produit 05D-C :**

- **A)** Cancel staff-only (plus simple, risque support si partenaire ne comprend pas).
- **B)** Cancel staff + `POST /organizations/me/events/{id}/cancel` (symétrie opérationnelle) — **recommandé** si cancel est métier « l’org annule son event », staff peut annuler en urgence.

Discovery **recommande B** à moyen terme ; **05D-C peut livrer A puis B** en sous-PR.

---

### 7. Audit table ou timeline dérivée ?

| Approche | Verdict |
|----------|---------|
| Timeline dérivée (`moderated_at`, `rejection_reason` seuls) | ❌ Insuffisant |
| Table dédiée + GET actions | ✅ Aligné Offers, extensible cancel |
| Event sourcing complet | ❌ Overkill V1 |

**UI (05D-B) :** réutiliser `offer-detail-audit-section.tsx` — liste chronologique, libellés FR, actor email si dispo.

---

### 8. Séparer Audit et Cancel en deux tickets ?

**Oui.**

| Regroupement | Raison |
|--------------|--------|
| **05D-A + 05D-B** (audit) | Migration + instrumentation approve/reject + UI ; pas de changement lifecycle public |
| **05D-C** (cancel) | Règles métier, 410, feed sync, éventuel endpoint partenaire, action audit `cancel` |

Cancel sans table audit = dette ; audit sans cancel = livrable utile immédiat (remplace placeholder 05C).

---

## 3. État du code post-05C (rappel)

### Staff API (`/api/v1/admin/local-events`)

| Méthode | Route | Statut |
|---------|-------|--------|
| GET | `` | Liste |
| GET | `/{id}` | Détail 05C |
| POST | `/{id}/approve` | Modération |
| POST | `/{id}/reject` | Modération |
| GET | `/{id}/actions` | ❌ |
| POST | `/{id}/cancel` | ❌ |

### Champs modèle non exposés staff (cancel)

- `is_cancelled` — lu en détail 05C, **non modifiable**
- `moderated_by_user_id`, `moderated_at` — pas dans DTO détail admin actuel (candidat enrichissement 05D-B read-only)

### Tests

- `test_admin_local_events_api.py` — GET detail, 404, 403
- Pas de tests audit / cancel

---

## 4. Découpage BUILD recommandé

### ADMIN-05D-A — Event Audit Backend

**Gates :** migration review, RBAC inchangé, tests intégration.

- Migration `event_admin_actions`
- Modèle + repo + constantes (`approve`, `reject`, `cancel` réservé)
- Instrumenter `approve_event` / `reject_event` dans `LocalEventService` (comme `_record_offer_admin_action`)
- `GET /admin/local-events/{event_id}/actions`
- Schémas Pydantic + tests API

**Hors scope A :** cancel, UI.

---

### ADMIN-05D-B — Event Audit UI

- Types `AdminLocalEventAction*`
- `adminEventsApi.listEventActions(id)`
- Hook `use-admin-event-actions`
- `event-detail-audit-section.tsx` — remplacer `event-detail-audit-placeholder.tsx`
- Helpers labels (miroir `admin-offer.ts`)
- Refresh fiche après modération (déjà partiellement via reload detail)

**Hors scope B :** cancel.

---

### ADMIN-05D-C — Event Cancel Lifecycle

- Spécifier acteurs : staff obligatoire ; partenaire optionnel (phase C2)
- `POST /admin/local-events/{id}/cancel` body `{ reason }` (min/max comme reject)
- Préconditions : `moderation_status == approved`, `!is_cancelled`
- Effets : `is_cancelled=true`, feed sync, audit `cancel`
- **Pas** de uncancel V1
- Tests : public 410, map/liste exclus, feed inactive
- UI staff : bouton sur fiche + confirm dialog ; badge « Annulé » déjà partiellement présent
- Doc partenaire / notification : ticket séparé si besoin

---

## 5. Risques

| Risque | Sévérité | Mitigation |
|--------|----------|------------|
| Confusion reject vs cancel staff | UX / support | Copy UI + formation ; cancel réservé approved |
| Migration prod | Technique | Migration isolée 05D-A ; pas de backfill |
| Feed fantôme après cancel | Produit | Test sync `is_active` |
| Cancel sans endpoint partenaire | Support | Phase C2 partner cancel |
| Scope creep polish | Planning | 05E pour filtres org, liens partenaire |

---

## 6. Critères d’acceptation (proposition)

**05D complet (A+B+C) :**

- Timeline staff sur `/events/[id]` avec historique approve/reject (et cancel si C livré)
- Chaque modération staff post-05D-A crée une ligne audit
- Staff peut annuler un event approved avec motif ; citoyen reçoit 410 ; feed/carte/listes à jour
- CI : ruff, mypy, pytest admin events + utils admin ; build admin

---

## 7. Décision discovery (proposition)

| Question | Décision proposée |
|----------|-------------------|
| Cancel ≠ reject ? | **Oui** |
| Réactivation après cancel ? | **Non** V1 |
| Table `event_admin_actions` ? | **Oui** |
| Actions auditer V1 ? | approve, reject (+ cancel quand C) |
| Impact public ? | Exclusion listes + 410 détail + feed inactive |
| Impact partenaire ? | Lecture cancelled ; endpoint partner cancel en C2 recommandé |
| Table vs dérivée ? | **Table** |
| Split tickets ? | **Oui — 05D-A / 05D-B / 05D-C** |

**GO BUILD :** après validation CTO de ce document — commencer par **ADMIN-05D-A**.

---

*Document généré en phase DISCOVER — aucune modification de code applicatif. Validation CTO requise avant tickets BUILD 05D-A/B/C.*
