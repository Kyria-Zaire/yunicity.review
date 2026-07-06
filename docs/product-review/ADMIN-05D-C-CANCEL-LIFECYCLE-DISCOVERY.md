# ADMIN-05D-C — Discovery Cancel Lifecycle (Events)

**Phase BMAD :** DISCOVER  
**Feature :** FEATURE-ADMIN-V1 / ADMIN-05 Events  
**Ticket :** ADMIN-05D-C-CANCEL-LIFECYCLE-DISCOVERY  
**Date :** 2026-06-04  
**Statut :** Audit read-only — **aucun code, endpoint, migration ni commit**

**Prérequis livrés :**

| Module | Statut |
|--------|--------|
| ADMIN-05B Workspace | ✅ |
| ADMIN-05C Detail 360° | ✅ |
| ADMIN-05D-A Audit backend | ✅ (`event_admin_actions`, approve/reject) |
| ADMIN-05D-B Audit UI | ✅ (timeline `/events/[id]`) |

**Base code auditée :** `main` post-merge PR #50 (`bd5740a`).

**Références :**

- `docs/product-review/ADMIN-05A-EVENTS-DISCOVERY.md`
- `docs/product-review/ADMIN-05D-EVENTS-AUDIT-CANCEL-DISCOVERY.md`
- `docs/product/local-events.md`

---

## 1. Synthèse exécutive

Le champ **`is_cancelled`** existe depuis TICKET-505 et est **déjà respecté** par les lectures publiques (listes, carte, recherche, intérêts, détail 410). **Aucune API** ne permet aujourd’hui de passer `is_cancelled` à `true` en production (seeds/tests uniquement).

**Reject ≠ cancel** : le reject modère le contenu ; le cancel retire un événement **déjà approuvé** du parcours citoyen sans changer `moderation_status`.

**Recommandation CTO — Option B (soft cancel renforcé)** :

- Migration légère : `cancelled_at`, `cancelled_by_user_id` sur `local_events`
- **Staff seul** en V1 pour l’écriture (`POST /admin/local-events/{id}/cancel`)
- **Pas d’uncancel** V1
- **Précondition :** `moderation_status == approved` et `!is_cancelled`
- Audit `cancel` dans `event_admin_actions` (reason obligatoire)
- **Sync feed explicite** (`FeedEventSyncService.upsert_event_post`) — pas seulement filtrage lecture
- Partner portal : **lecture** du statut annulé (déjà partiel) ; **cancel org → V2**

**Découpage BUILD :** 05D-C1 backend → 05D-C2 admin UI → 05D-C3 régressions public/feed + UX 410 web.

---

## 2. État actuel du code (inspection)

### 2.1 Modèle `local_events`

Fichier : `backend/app/models/local_event.py`

| Champ | Rôle cancel |
|-------|-------------|
| `is_cancelled` | bool, défaut `false` — **seul indicateur métier annulation** |
| `moderation_status` | `pending_review` / `approved` / `rejected` — **indépendant** de l’annulation |
| `rejection_reason` | Lié au **reject**, pas au cancel |
| `moderated_by_user_id` / `moderated_at` | Dernière modération approve/reject |

**Absent :** `cancelled_at`, `cancelled_by_user_id`, `cancellation_reason` sur l’event.

### 2.2 Workflow modération

`backend/app/core/local_event_workflow.py` — transitions sur **`moderation_status` uniquement**. Cancel **n’y figure pas**.

### 2.3 API staff (`/api/v1/admin/local-events`)

| Route | Cancel |
|-------|--------|
| GET liste / GET détail | Lit `is_cancelled` (affichage admin) |
| POST approve / reject | Inchangé |
| GET actions | `approve`, `reject` seulement (`EVENT_ADMIN_ACTIONS`) |
| POST cancel | **Absent** |

### 2.4 API publique (`/api/v1/events`)

| Comportement | Code |
|--------------|------|
| Liste ville | `list_public_for_city` : `approved` + `!is_cancelled` + `visibility public` |
| Détail | `_require_public_event` : si `is_cancelled` → **410** `EVENT_CANCELLED` |
| Intérêt | `toggle_interest` via `_require_public_event` → **bloqué** si annulé |
| Saved | `list_saved_for_user` : exclut `is_cancelled` |

### 2.5 Feed

`FeedEventSyncService.upsert_event_post` :

```python
is_active = approved and not is_cancelled
```

- **Approve** → upsert post actif
- **Reject** → `deactivate_event_post` (`is_active = false`)
- **Cancel sans appel sync** → si post existait avec `is_active=true`, il **resterait actif** jusqu’à un upsert — **risque réel** pour BUILD

Lecture feed : `PostRepository` filtre `Post.is_active.is_(True)` — post inactif = hors feed.

### 2.6 Map / search

| Surface | Filtre cancelled |
|---------|------------------|
| `GET /api/v1/map/events` | `is_cancelled == false` (+ approved, bbox, dates) — test `test_map_events_excludes_cancelled_and_pending` |
| `search_repository` events | `is_cancelled == false` |
| Web map / search hooks | Filtre client supplémentaire `!is_cancelled` |

**Politique actuelle : masquer**, pas badge « annulé » sur carte/liste publique.

### 2.7 Partner portal

| Zone | État |
|------|------|
| `GET/PATCH /organizations/me/events` | **Pas** de route cancel ; PATCH ne touche pas `is_cancelled` |
| Liste org (`list_for_organization_ids`) | **Inclut** events annulés (pas de filtre `is_cancelled`) |
| UI `partner-portal-events.tsx` | Affiche ` · Annulé` si `is_cancelled` ; CTA submit/resubmit **désactivés** si annulé |
| Page publique partenaire `GET /partners/{slug}/events` | Exclut `is_cancelled` |

### 2.8 Admin UI

| Élément | État |
|---------|------|
| Liste / fiche | Badge annulé via `EventModerationStatusBadge` + champ « Annulé » |
| Modération | `canAdminApprove` / `canAdminReject` **ne regardent pas** `is_cancelled` → approve/reject **encore proposés** sur event annulé (edge case) |
| Filtre liste `cancelled` | **Absent** (`list_admin` filtre status/city seulement) |
| Bouton cancel | **Absent** |

### 2.9 Audit

`event_admin_actions` — actions V1 : `approve`, `reject` uniquement. Constante `EventAdminAction` sans `cancel`.

### 2.10 Web citoyen `/events/[id]`

- API renvoie 410 si annulé
- `use-event-detail-context` : erreur générique (`error: true`) — **pas de page dédiée « événement annulé »** (gap UX 05D-C3)

### 2.11 Intérêts

- `event_interests` **conservés** après cancel (pas de cascade delete)
- Compteur staff `interest_count` reste visible — **cohérent** (engagement historique)

---

## 3. Réponses aux 11 questions

### 1. Qui peut annuler ?

| Option | État actuel | Reco V1 | Risques |
|--------|-------------|---------|---------|
| Staff | Aucune API | **Oui** — `POST /admin/local-events/{id}/cancel` | RBAC `moderation.manage` \| `system.admin` |
| Organisation | Aucune API | **Non V1** (lecture seule) | Évite divergence staff/org, double annulation |
| Les deux | — | **V2** partner cancel si besoin support | Permissions org + audit mixte |

### 2. Annulation définitive ?

| | État actuel | Reco V1 |
|---|-------------|---------|
| Uncancel | Impossible (pas d’API) | **Interdit V1** |
| Réactivation | — | Ticket ultérieur si dates futures + sync feed + audit |

**Risque uncancel :** réapparition feed/carte, liens partagés, confusion avec reject→submit.

### 3. Quel statut métier ?

| Approche | État | Reco |
|----------|------|------|
| `is_cancelled` | Existe, utilisé partout en lecture | **Conserver** — source de vérité publique |
| `cancelled_at` / `cancelled_by` | Absent | **Ajouter** (Option B) — support, admin, pas d’audit-only |
| `cancellation_reason` sur event | Absent | **Non** — reason dans **audit** + body API (comme reject) |
| Statut `moderation_status=cancelled` | Non | **Non** — évite de casser workflow + filtres admin |

### 4. Effet côté citoyen

| | État actuel | Reco V1 |
|---|-------------|---------|
| Détail | **410** `EVENT_CANCELLED` | **Conserver 410** (sémantique HTTP correcte) |
| Listes / agenda | Exclus | Exclus |
| Badge public annulé | Non (absent des listes) | **Pas en V1** — masquage suffit |
| 404 vs 410 | 410 déjà | Ne pas passer en 404 (perd l’info « existait mais annulé ») |

**05D-C3 :** page web dédiée « Cet événement a été annulé » si `code === EVENT_CANCELLED` (au lieu d’erreur générique).

### 5. Effet feed

| | État actuel | Reco V1 |
|---|-------------|---------|
| Lecture | `is_active=true` requis | Inchangé |
| Écriture cancel | **Aucun appel** | **`upsert_event_post` obligatoire** après `is_cancelled=true` |

**Risque si sync oublié :** post EVENT reste visible en feed malgré event annulé.

### 6. Effet map / search / listes

| | État actuel | Reco V1 |
|---|-------------|---------|
| Map | Masque cancelled (testé) | Inchangé |
| Search | Masque | Inchangé |
| Listes publiques | Masquent | Inchangé |
| Badge sur carte | Non | **Non V1** — complexité produit faible valeur |

### 7. Admin

| | État actuel | Reco V1 |
|---|-------------|---------|
| Badge cancelled | Oui (badge + champ) | Renforcer header si annulé |
| Filtre liste | Non | **Optionnel 05E** — `?cancelled=true` hors scope minimal C |
| Actions après cancel | approve/reject encore possibles UI | **Bloquer** : `canAdminCancel` + masquer approve/reject si `is_cancelled` |
| Bouton cancel | Absent | **05D-C2** — confirm dialog + reason |

### 8. Workflow — qui peut être cancelled ?

| État modération | Cancel V1 ? | Justification |
|-----------------|-------------|---------------|
| `pending_review` | **Non** | Utiliser **reject** ; pas encore public |
| `approved` | **Oui** | Cas nominal |
| `rejected` | **Non** | Déjà hors public |
| `is_cancelled` déjà | **Non** (idempotent 409) | — |
| Event **passé** (`starts_at < now`) | **Oui** (staff) | Nettoyage feed/map si encore actif ; peu d’impact listes « upcoming » |

**Pas de règle temporelle stricte V1** — staff peut annuler un event passé approuvé pour cohérence opérationnelle.

### 9. Audit

| | Reco V1 |
|---|---------|
| Enregistrer `cancel` | **Oui** — étendre `EVENT_ADMIN_ACTIONS` + `EventAdminAction.CANCEL` |
| Reason obligatoire | **Oui** — 3–500 car. (aligné `LocalEventRejectRequest`) |
| `previous_status` / `new_status` | `moderation_status` **inchangé** (ex. `approved` → `approved`) **ou** `null` → documenter **approved → approved** + metadata `{"is_cancelled": true}` |
| Metadata | `{"is_cancelled": true}` en DB ; **non exposé** GET actions |

**Recommandation lisibilité timeline :**  
`action=cancel`, `previous_status=approved`, `new_status=approved`, `reason=<motif>`, metadata interne `{is_cancelled: true}` — libellé UI dédié « Annulation » (pas une transition de modération).

### 10. Partner portal

| | Reco |
|---|------|
| Cancel org V1 | **Non** — ticket **V2** `POST /organizations/me/events/{id}/cancel` |
| Après staff cancel | Liste org voit « Annulé » ; pas de resubmit ; lien public masqué côté `GET /partners/.../events` |
| Communication | Copy : « Annulé par l’équipe Yunicity » vs « Annulé par votre organisation » — **V2** si double acteur |

### 11. Risques

| Risque | Sévérité | Mitigation BUILD |
|--------|----------|------------------|
| Post feed reste actif | **P0** | `upsert_event_post` dans cancel service |
| Lien partagé `/events/[id]` | Moyen | 410 + page UX annulée (C3) |
| Intérêts orphelins | Faible | Conserver ; message UX « événement annulé » |
| SEO / indexation | Faible | 410 + hors listes |
| Staff confond reject / cancel | Moyen | Copy admin + précondition approved only |
| Double cancel | Faible | 409 `EVENT_ALREADY_CANCELLED` |
| Approve/reject sur cancelled | Moyen | Guards backend + helpers frontend |
| Analytics futures | Faible | Audit `cancel` suffit V1 |

---

## 4. Comparaison Options A / B / C

| Critère | **A — Minimal** | **B — Renforcé** ✅ | **C — Full lifecycle** |
|---------|-----------------|---------------------|-------------------------|
| `is_cancelled` | Oui | Oui | Oui |
| `cancelled_at` / `by` | Non | **Oui** | Oui |
| Audit cancel | Oui | Oui | Oui |
| Uncancel | Non | Non | Oui |
| Partner cancel | Non | V2 | V1 possible |
| Migration | Non | **1 migration** | Multi + workflow |
| Complexité | Faible | **Modérée** | Élevée |
| Traçabilité ops | Audit only | **Champs + audit** | Maximale |

### Décision CTO proposée : **Option B**

**Pourquoi pas A :** sans `cancelled_at`/`cancelled_by`, le support et la fiche admin dépendent uniquement de l’audit paginé — friction inutile pour un geste **irréversible**.

**Pourquoi pas C :** uncancel + statut dédié + partner cancel V1 = surface de régression trop large pour clôturer ADMIN-05.

---

## 5. Spécification V1 (BUILD cible)

### 5.1 Backend (05D-C1)

- Migration : `cancelled_at` (timestamptz nullable), `cancelled_by_user_id` (FK users SET NULL)
- `POST /api/v1/admin/local-events/{event_id}/cancel`
  - Body : `{ "reason": "..." }` (min 3, max 500)
  - Préconditions : event existe ; `moderation_status == approved` ; `!is_cancelled`
  - Effets : `is_cancelled=true`, `cancelled_at=now`, `cancelled_by_user_id=moderator.id`
  - Audit : `action=cancel`, reason payload, metadata `{is_cancelled: true}`
  - `FeedEventSyncService.upsert_event_post` (org si présente)
  - Commit transaction unique
  - Erreurs : `EVENT_ALREADY_CANCELLED`, `EVENT_CANCEL_NOT_ALLOWED` (si pas approved)
- Étendre `EVENT_ADMIN_ACTIONS` + labels frontend
- Exposer `cancelled_at` / `cancelled_by` (optionnel) sur `AdminLocalEventDetailResponse` — recommandé pour fiche
- Tests : cancel OK, double cancel 409, pending 422, feed inactive, audit row, 410 public inchangé

**Hors scope C1 :** uncancel, partner cancel, filtre admin liste, notification push/email.

### 5.2 Admin UI (05D-C2)

- Bouton « Annuler l’événement » sur fiche si `approved && !is_cancelled`
- Dialog motif (comme reject)
- Helpers : `canAdminCancelEvent(event)`, `eventAdminActionLabel('cancel')`
- Après succès : reload detail + audit timeline
- Masquer approve/reject si `is_cancelled`
- Afficher `cancelled_at` + acteur si champs présents

### 5.3 Public / régressions (05D-C3)

- Tests backend : intérêt 410 sur cancelled ; liste exclut
- Web : handler `EVENT_CANCELLED` → écran « Événement annulé » (pas erreur générique)
- Vérifier manuellement feed + map après cancel API
- **Pas** de changement politique « badge sur carte »

---

## 6. Découpage BUILD proposé

| Ticket | Livrable | Dépendances |
|--------|----------|-------------|
| **ADMIN-05D-C1** | Migration + cancel API + audit + feed sync + tests API | 05D-A mergé |
| **ADMIN-05D-C2** | Bouton cancel + guards modération + types/API client + detail fields | C1 déployé recette |
| **ADMIN-05D-C3** | UX web 410 + tests régression public/feed/map (+ doc recette) | C1 |

**Clôture ADMIN-05** après C1+C2+C3 + recette staff.

**Report V2 :**

- Partner self-cancel
- Filtre admin `cancelled`
- Uncancel
- Notification créateur / intéressés

---

## 7. Critères d’acceptation discovery → BUILD

- [ ] CTO valide **Option B** et **staff-only V1**
- [ ] CTO valide **approved-only** + **no uncancel**
- [ ] CTO valide **feed sync obligatoire** sur cancel
- [ ] CTO valide découpage **C1 / C2 / C3**
- [ ] Review sécurité + migration avant C1 (zone rouge DB)

---

## 8. Annexes — fichiers inspectés

| Zone | Fichiers clés |
|------|----------------|
| Modèle | `backend/app/models/local_event.py` |
| Service | `backend/app/services/local_event_service.py`, `feed_event_sync.py` |
| Repo | `backend/app/repositories/local_event_repository.py`, `search_repository.py` |
| Admin API | `backend/app/api/v1/admin_local_events.py` |
| Audit | `backend/app/core/event_admin_constants.py`, `event_admin_action` model |
| Tests | `backend/tests/test_event_map.py`, `test_admin_local_event_actions_audit_api.py` |
| Web | `frontend/apps/web/hooks/use-event-detail-context.ts`, `events-agenda.ts`, `partner-portal-events.tsx` |
| Admin | `event-detail-moderation-section.tsx`, `event-moderation-status-badge.tsx` |

---

*Document généré en phase DISCOVER — aucune modification de code. Validation CTO requise avant ADMIN-05D-C1.*
