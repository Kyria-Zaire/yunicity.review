# ADMIN-07D — Discovery Resolve / Dismiss / Audit

**Phase BMAD :** DISCOVER  
**Feature :** FEATURE-ADMIN-V1 / ADMIN-07 Moderation  
**Ticket :** ADMIN-07D-RESOLVE-DISMISS-AUDIT-DISCOVERY  
**Date :** 2026-06-04  
**Statut :** Audit read-only — **aucun code modifié, aucun commit**

**Prérequis livrés :**

| Ticket | Statut | Référence |
|--------|--------|-----------|
| ADMIN-07A Discovery | ✅ | `docs/product-review/ADMIN-07A-MODERATION-DISCOVERY.md` |
| ADMIN-07B Reports Workspace | ✅ | PR #59 — `GET /admin/reports`, `/moderation` |
| ADMIN-07C Report Detail 360° | ✅ | PR #60 — `/moderation/[id]`, `GET /admin/reports/{id}` |

**Base code auditée :** `main` post-merge PR #60 (`9b855a4`).

---

## 1. Synthèse exécutive

La boucle **Citizen report → Admin voit le report** est fermée (07B + 07C).  
Il manque la **fermeture staff** : transitions de statut + traçabilité + (optionnel) effet sur le contenu signalé.

**Recommandation CTO : Option B (Closure + audit table)** — avec périmètre BUILD découpé pour livrer d’abord le cœur métier (resolve/dismiss) puis la timeline UI.

**Option C (Trust & Safety expanded)** est **hors scope** ADMIN-07D : pas de sanctions utilisateur, pas de hub T&S, pas d’IA.

---

## 2. État actuel DB / API / UI

### 2.1 Table `reports` (migration `20260522_0008_feed_foundation.py`)

| Colonne | Type | Usage actuel |
|---------|------|--------------|
| `id` | UUID PK | — |
| `user_id` | FK → `users` ON DELETE **CASCADE** | Reporter |
| `post_id` | FK → `posts` ON DELETE **CASCADE** | Cible |
| `reason` | String(20) | Motif **citoyen** : `spam` \| `inappropriate` \| `other` |
| `status` | String(20), default `pending` | **Jamais muté côté staff** |
| `resolved_at` | timestamptz nullable | **Jamais alimenté** |
| `resolved_by` | FK → `users` ON DELETE SET NULL | **Jamais alimenté** |
| `created_at` | timestamptz | Horodatage signalement |

**Absent en DB :**

- `resolution_note` (mentionné dans le brief discovery — **n’existe pas** ; à ajouter en migration si requis)
- `updated_at`
- table `report_admin_actions`

### 2.2 Enums existants (`backend/app/core/feed_constants.py`)

```python
class ReportStatus(StrEnum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    DISMISSED = "dismissed"
    ACTION_TAKEN = "action_taken"
```

Aucune transition staff implémentée. Seule écriture : création `pending` via `ReportService.report_post`.

### 2.3 API citoyenne (inchangée V1)

| Méthode | Route | Comportement |
|---------|-------|--------------|
| POST | `/api/v1/posts/{post_id}/report` | Crée report `pending` ; idempotence 1 pending / (user, post) |

### 2.4 API admin (07B — lecture seule)

| Méthode | Route | RBAC |
|---------|-------|------|
| GET | `/api/v1/admin/reports` | `moderation.manage` **ou** `system.admin` |
| GET | `/api/v1/admin/reports/{report_id}` | idem |

**Aucune mutation** POST/PATCH/DELETE.

### 2.5 Repository / service reports

| Module | Capacités |
|--------|-----------|
| `ReportRepository` | `add`, `get_pending_by_user_and_post` uniquement |
| `AdminReportRepository` | list, detail, `fetch_status_summary` |
| `AdminReportService` | read mapping + KPI (`resolved` = `reviewed` + `action_taken`) |

### 2.6 UI admin (07C)

- Fiche `/moderation/[id]` : 360° read-only, placeholder actions 07D
- Liste `/moderation` : lien détail avec query params conservés
- Cockpit : `reports_pending` = count `status = pending` (`admin_cockpit_repository._count_reports_pending`)

### 2.7 Effet contenu signalé (état code)

| Mécanisme | Existe ? | Staff API ? |
|-----------|----------|-------------|
| `Post.is_active = false` | Oui (soft delete auteur/tribu) | **Non** — `PostService.soft_delete_post` exige `_can_moderate_post` (pas bypass staff global) |
| Feed sync deactivate (offer/event/creator) | Oui (modules 04–06) | Via silos partenaires, **pas** via report |
| Sanction reporter / auteur | Non | — |

---

## 3. Réponses aux 12 questions

### Q1 — Actions V1

| Action staff | V1 ? | Commentaire |
|--------------|------|-------------|
| **Dismiss** (classer sans suite) | ✅ **Oui** | Bouton principal |
| **Resolve** (clôturer examiné) | ✅ **Oui** | Bouton principal |
| `mark reviewed` (statut seul) | ⚠️ **Fusionné dans Resolve** | Pas de 3ᵉ bouton « examiné » distinct en UI |
| `action_taken` | ⚠️ **Phase 07D-A2 ou flag** | Uniquement si effet contenu (masquer post) — voir Q6 |
| **Reopen** | ❌ **Non V1** | Backlog 07F / T&S V2 |

**Décision produit :** 2 actions staff visibles en V1 : **Résoudre** et **Classer sans suite**.  
`action_taken` = variante de résolution avec effet contenu (opt-in), pas une 3ᵉ entrée de menu isolée en V1 minimal.

---

### Q2 — Statuts réels DB

Les 4 statuts **existent déjà** en enum + colonne `status` String(20). Aucun autre statut en production.

| Statut | Sémantique produit proposée |
|--------|----------------------------|
| `pending` | En file modération |
| `reviewed` | Staff a traité — contenu laissé en place |
| `dismissed` | Signalement non fondé / hors périmètre — pas d’action sur le contenu |
| `action_taken` | Staff a pris une mesure sur le contenu (ex. masquage feed) |

État terminal : `reviewed`, `dismissed`, `action_taken` (plus de `pending`).

---

### Q3 — Mapping produit UI → DB

| Libellé UI (FR) | Endpoint proposé | Statut DB | Effet post V1 |
|-----------------|------------------|-----------|---------------|
| **Classer sans suite** | `POST …/dismiss` | `dismissed` | Aucun |
| **Résoudre** | `POST …/resolve` | `reviewed` | Aucun (défaut) |
| **Résoudre et masquer le contenu** (checkbox ou 2ᵉ variante) | `POST …/resolve` body `{ deactivate_target: true }` | `action_taken` | `post.is_active = false` |

**`reviewed` vs `action_taken` :**

- `reviewed` = décision staff sans modification du feed
- `action_taken` = réservé au cas où le post est désactivé — **cohérent avec le KPI « Traités »** déjà agrégé en 07B

**Ne pas** utiliser `reviewed` comme état intermédiaire avant dismiss : en V1, une seule transition depuis `pending`.

---

### Q4 — Reason / note staff

| Champ | Obligatoire ? | Proposition |
|-------|---------------|-------------|
| Motif citoyen (`report.reason`) | Déjà fixé à la création | Lecture seule en fiche |
| **Note staff** (`staff_note` / `resolution_note`) | **Optionnelle** dismiss ; **recommandée** resolve avec masquage | `min_length=0`, `max_length=1000` si fournie ; si masquage post → `min_length=3` (aligné `AdminLocalEventRejectRequest`) |

**Pas de « reason » staff enum obligatoire** en V1 — la note libre suffit. Réutiliser le pattern reject offres/events (Text, max 1000).

Stockage :

- **Option A :** note uniquement dans `report_admin_actions.reason` (si table audit)
- **Option B recommandée :** colonne `resolution_note` sur `reports` (dernière note) **+** copie dans audit row

---

### Q5 — Audit

| Approche | Avantages | Inconvénients |
|----------|-----------|---------------|
| **Champs existants seuls** (`resolved_by`, `resolved_at`, `status`) | Zero migration audit | Pas d’historique reopen, pas de note persistée sans nouvelle colonne |
| **`report_admin_actions`** (parité `creator_content_admin_actions`) | Timeline, conformité BMAD zones rouges, évolution reopen | Migration + endpoints GET |

**Décision : Option B** — créer `report_admin_actions` :

| Colonne | Type | Rôle |
|---------|------|------|
| `id` | UUID | PK |
| `report_id` | FK reports CASCADE | |
| `actor_user_id` | FK users SET NULL | Modérateur |
| `action` | String(32) | `dismiss`, `resolve`, `resolve_with_deactivate`, `reopen` (futur) |
| `previous_status` | String(20) nullable | |
| `new_status` | String(20) nullable | |
| `reason` | Text nullable | Note staff |
| `metadata` | JSONB nullable | ex. `{ "deactivated_post_id": "…" }` |
| `created_at` | timestamptz | |

**Séquence transactionnelle** (doctrine 06D-A) :

1. Lock report (`SELECT … FOR UPDATE` ou re-read avec status check)
2. Valider transition `pending` → terminal
3. Update `reports` (status, resolved_at, resolved_by, resolution_note)
4. Insert `report_admin_actions`
5. Si `deactivate_target` : `post.is_active = false` (+ eventuel sync feed si type offer/event/creator — **décision 07D-A**)
6. Commit unique

---

### Q6 — Effet sur le contenu signalé

| Option | V1 ? | Risque |
|--------|------|--------|
| Report only (aucun effet post) | ✅ Dismiss + Resolve simple | Faible |
| Masquer post (`is_active=false`) | ✅ **Opt-in** sur Resolve | Moyen — contenu partenaire lié |
| Suppression hard | ❌ | — |
| Désactivation feed sync silo | ⚠️ **07D-A2** si post type ≠ `post` | Doublon avec modules 04–06 |

**Décision V1 :**

- **Dismiss / Resolve simple :** report only
- **Resolve + checkbox « Masquer du feed » :** `action_taken` + `is_active=false`
- Pour posts type `offer` / `event` / `partner_creator` : **ne pas** cascader le silo métier en 07D-A — masquer le **post feed** uniquement ; deep link staff vers silo pour action complète si besoin (07D-C polish)

**Justification :** évite de rejeter une offre/event entière depuis un report citoyen sans workflow partenaire.

---

### Q7 — Effet sur utilisateurs

| Cible | V1 |
|-------|-----|
| Reporter | **Aucune** |
| Auteur du post | **Aucune** sanction compte |
| Blocage / suspend | ❌ Backlog T&S V2 |

---

### Q8 — Cockpit

**Oui** — `reports_pending` doit diminuer dès qu’un report quitte `pending` (resolve ou dismiss).  
Aucun changement de requête cockpit si logique status respectée.

---

### Q9 — Champs exposés après résolution

**GET detail** (extension 07D-A) :

| Champ | Liste | Détail |
|-------|-------|--------|
| `status` | ✅ | ✅ |
| `resolved_at` | optionnel | ✅ |
| `resolver` | — | ✅ (déjà mappé si `resolved_by` set) |
| `resolution_note` | — | ✅ **nouveau** |
| `last_action` | — | ✅ label dérivé (`dismiss` / `resolve` / …) depuis dernière audit row |

**Liste :** ajouter `resolved_at` optionnel en colonne ou badge — polish 07D-B.

---

### Q10 — Edge cases

| Cas | Comportement proposé |
|-----|---------------------|
| Report déjà `reviewed` / `dismissed` / `action_taken` | **409** `REPORT_ALREADY_CLOSED` — idempotent strict interdit en V1 |
| Double clic concurrent | Lock + 409 sur 2ᵉ requête |
| Post déjà `is_active=false` | Resolve avec masquage : idempotent sur post ; report → `action_taken` |
| Post supprimé (hard) | CASCADE supprime report → **404** GET detail (existant) |
| Post soft-deleted (`is_active=false`) | Detail 07C affiche déjà « contenu indisponible » ; dismiss/resolve **autorisés** |
| Reporter supprimé (user CASCADE) | Report supprimé → 404 |
| Resolver supprimé | `resolved_by` SET NULL ; resolver null en detail |

**Reopen :** hors V1 — documenter transition `terminal → pending` pour 07F avec audit `reopen`.

---

### Q11 — RBAC

Confirmé — même garde que 07B :

```python
require_any_permission("moderation.manage", "system.admin")
```

Pas de permission granulaire `reports.resolve` en V1 (éviter prolifération RBAC).

Tests : 403 user standard ; 403 partner sans staff ; 200 MODERATOR / system.admin.

---

### Q12 — Audit timeline UI

| Option | V1 BUILD |
|--------|----------|
| Bloc « Résolution » dans fiche (resolver, date, note, statut) | ✅ **07D-B** |
| Timeline complète `GET /admin/reports/{id}/actions` | ✅ **07D-C** (si table audit en 07D-A) |

**Décision :** bloc résolution suffit pour fermer la boucle métier ; timeline = polish auditabilité (parité creator content 06D-B).

---

## 4. Comparaison options A / B / C

| Critère | **A — Minimal** | **B — Closure + audit** ✅ | **C — T&S expanded** ❌ |
|---------|-----------------|------------------------------|-------------------------|
| POST dismiss / resolve | ✅ | ✅ | ✅ + sanctions |
| `resolved_*` | ✅ | ✅ | ✅ |
| `report_admin_actions` | ❌ | ✅ | ✅ |
| Note staff | Migration `resolution_note` ou rien | Colonne + audit | + scoring |
| Masquer post | Optionnel flag | Optionnel flag | + user ban |
| Effort | ~1 ticket | ~2–3 tickets | >1 sprint |
| Dette audit | Moyenne | Faible | — |
| Alignement 07A / 06D | Partiel | **Fort** | Hors scope |

**Recommandation : Option B** avec découpage incrémental (backend audit dès 07D-A, timeline UI en 07D-C).

---

## 5. Risques

| Risque | Sévérité | Mitigation |
|--------|----------|------------|
| Masquer post partenaire sans workflow silo | **P1 produit** | Opt-in explicite ; copy staff ; pas de cascade silo en 07D-A |
| PII note staff / reporter dans logs | P1 RGPD | Note staff staff-only ; pas de log applicatif body |
| Race double résolution | P2 | Transaction + status guard |
| CASCADE report perdu si post deleted | P2 | Accepté V1 ; snapshot V2 |
| Confusion `reviewed` vs `action_taken` | P2 | Labels UI clairs + doc modérateur |
| `moderation.manage` trop large | P2 connu | Inchangé V1 |

---

## 6. Endpoints proposés (BUILD)

### 6.1 Mutations (07D-A)

| Méthode | Route | Body | Réponse |
|---------|-------|------|---------|
| POST | `/api/v1/admin/reports/{report_id}/dismiss` | `{ "note"?: string }` | `AdminReportDetailResponse` |
| POST | `/api/v1/admin/reports/{report_id}/resolve` | `{ "note"?: string, "deactivate_target"?: boolean }` | `AdminReportDetailResponse` |

**Codes erreur :**

| Code | HTTP |
|------|------|
| `REPORT_NOT_FOUND` | 404 |
| `REPORT_ALREADY_CLOSED` | 409 |
| `REPORT_NOTE_TOO_SHORT` | 422 (si masquage sans note min 3) |
| `REPORT_TARGET_DEACTIVATE_FAILED` | 500 |

### 6.2 Audit read (07D-C)

| Méthode | Route | Réponse |
|---------|-------|---------|
| GET | `/api/v1/admin/reports/{report_id}/actions` | Liste paginée (pattern creator content actions) |

---

## 7. Découpage BUILD recommandé

| Ticket | Intitulé | Périmètre | Backend | Frontend admin |
|--------|----------|-----------|---------|----------------|
| **ADMIN-07D-A** | Resolution backend | Migration `resolution_note` + `report_admin_actions` ; service mutations ; séquence transactionnelle ; extension GET detail ; tests RBAC/transitions/409 | ✅ | — |
| **ADMIN-07D-B** | Resolution UI | Remplacer placeholder actions ; modales confirm ; note optionnelle ; checkbox masquer ; refresh hook ; redirect liste | — | ✅ |
| **ADMIN-07D-C** | Audit timeline UI | Section timeline fiche ; consomme GET actions | optionnel GET | ✅ |
| **ADMIN-07D-D** (optionnel) | Feed sync polish | Si post type offer/event/creator + deactivate → appeler sync existant | ✅ | copy staff |

**Ordre strict :** 07D-A → 07D-B → (07D-C / 07D-D polish).

**Hors scope 07D :** reopen, sanctions, notifications citoyen, assignation modérateur, signalement comment/user.

---

## 8. Tests nécessaires (BUILD)

### Backend (`test_admin_reports_api.py` + nouveau `test_admin_report_actions.py`)

- [ ] MODERATOR dismiss pending → `dismissed`, `resolved_at/by` set
- [ ] MODERATOR resolve pending → `reviewed`
- [ ] MODERATOR resolve + `deactivate_target=true` → `action_taken`, `post.is_active=false`
- [ ] 409 sur second dismiss/resolve
- [ ] 403 user non staff
- [ ] 404 report inconnu
- [ ] 422 note trop courte si masquage
- [ ] Audit row créée (Option B)
- [ ] Cockpit `reports_pending` décrémente (test intégration ou service)
- [ ] GET detail expose `resolution_note` + resolver après action

### Frontend

- [ ] Boutons actifs seulement si `status=pending`
- [ ] Confirm + erreurs API
- [ ] Refresh fiche + retour liste
- [ ] États loading/error sur mutation

---

## 9. Décision produit (GO BUILD)

```txt
GO Option B — Closure + audit table (découpage 07D-A / 07D-B / 07D-C)

Actions V1 staff :
  • Classer sans suite → dismissed (report only)
  • Résoudre → reviewed (report only)
  • Résoudre + masquer → action_taken + post.is_active=false (opt-in)

Pas en V1 :
  • reopen, sanctions, action_taken sans lien post, Trust & Safety hub

Audit :
  • report_admin_actions + resolution_note on reports
  • UI : bloc résolution (07D-B), timeline (07D-C)

RBAC :
  • moderation.manage | system.admin (inchangé)
```

---

## 10. Prochaine étape

Attendre **GO BUILD ADMIN-07D-A** (backend) avant toute implémentation.

Après livraison 07D complet, la boucle ADMIN-07 est :

```txt
Citizen report → Admin voit report → Admin résout / classe sans suite ✅
```

Extensions V2 : reopen, notifications, signalements multi-cibles, sanctions hub — voir ADMIN-07A §12.

---

*Document généré en discovery read-only — BMAD DISCOVER — ADMIN-07D.*
