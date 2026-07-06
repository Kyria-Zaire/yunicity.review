# QA-06 — Events Administration Validation

**Ticket** : QA-06  
**Feature** : FEATURE-ADMIN-V1  
**Phase** : QA HARDENING  
**Date** : 2026-06-05  
**Méthode** : revue statique + API live + tests d'intégration existants — **aucune modification produit**

---

# Résumé

Le module **Events admin** (`/events`) est **aligné avec le ticket de routes** et **fonctionnel pour la modération V1** : liste filtrée (statut + ville), pagination, modération inline (approve/reject), fiche détail structurée, annulation staff (événements approuvés), audit `event_admin_actions`, lien public web, et navigation liste ↔ fiche **avec contexte préservé**.

Points forts par rapport aux audits QA-03 à QA-05 :

- Routes ticket **`/events`** et **`/events/[id]`** existent telles quelles.
- Modération **liste + fiche** (approve / reject / cancel).
- Retour contextuel via `buildEventsListBackPath` (header fiche).

Écarts majeurs pour un pilote Reims :

- **Auto-approbation** des événements créés par organisations **vérifiées** — la file `pending_review` peut être **vide** alors que des événements sont déjà publics.
- Champs citoyen **`event_type`**, **`cover_image_url`**, **`district`**, **géoloc** absents de l'API/UI admin détail.
- Pas de **création / édition** staff ; pas d'**archive / restore** ; pas de **filtre organisation**.
- Pas de lien **feed** admin ni depuis **Partner 360°** vers la file events.

| Verdict zone | Résultat |
|--------------|----------|
| Liste / filtres / pagination | PASS ; pas recherche/tri/org |
| Fiche événement | PASS structure ; médias/type absents |
| Modération | PASS ; auto-approve verified = risque pilote |
| Visibilité publique | PASS partiel ; écarts champs + feed |
| Organisation / partenaire | PASS identification ; pas filtre retour |
| Navigation | PASS avec réserve erreur/404 |
| Permissions | PASS code + tests |
| Exploitabilité pilote | **GO conditionnel** |

---

# Environnement

| Élément | Valeur auditée |
|---------|----------------|
| Stack | Docker Compose local, backend FastAPI, admin Next.js |
| DB | `yunicity_dev` quasi vide (0 événements) |
| Auth bootstrap | `admin@yunicity.dev` — API admin **200** |
| API admin | `GET /api/v1/admin/local-events` |
| API publique | `GET /api/v1/events` (citoyen, sans auth liste) |
| Tests auto exécutés | **27 passed** (`test_admin_local_events_api`, `test_admin_local_event_actions_audit_api`, `test_admin_local_event_cancel_api`) |

---

# Routes réelles

| Route ticket | Route implémentée | Statut |
|--------------|-------------------|--------|
| `/events` | `/events` → `EventsWorkspace` | ✅ Conforme |
| `/events/[id]` | `/events/[id]` → `EventDetailView` | ✅ Conforme |
| — | API `GET /api/v1/admin/local-events` | Backend staff |
| — | API `POST .../approve`, `.../reject`, `.../cancel` | Modération |
| — | Création/édition | **Portail organisation** (`/organizations/me/events`) — pas admin |

Sidebar admin : lien **Events** → `/events` (`admin-shell.tsx`).

Cockpit « À traiter » : `/events?status=pending_review` (`cockpit-attention.tsx`).

---

# Cas testés

## 1. Liste événements — `/events`

| # | Cas | Méthode | Résultat |
|---|-----|---------|----------|
| 1.1 | Protection staff | `events/layout.tsx` | `StaffRoute` — OK |
| 1.2 | Chargement | `useAdminEventsList` | « Chargement des événements… » |
| 1.3 | Erreur API | Revue hook | Bandeau rose + Réessayer ; `setItems([])` — QA06-009 |
| 1.4 | API live | `GET /admin/local-events?city=Reims` | **200** — `total: 0` |
| 1.5 | Filtre défaut | `parseEventsSearchParams` | **`pending_review`** — aligné cockpit |
| 1.6 | Filtres | statut modération + ville (texte) | OK URL sync |
| 1.7 | Pagination | `PassportOpsPagination` | OK |
| 1.8 | Recherche texte | Revue UI | **Absente** — QA06-005 |
| 1.9 | Tri | Revue repo | `created_at desc` fixe — QA06-006 |
| 1.10 | Filtre organisation | Revue UI/API | **Absent** — QA06-007 |
| 1.11 | Modération inline | Approve/Reject par ligne | OK (sans cancel liste) |
| 1.12 | État vide | Message contextualisé | OK |
| 1.13 | Colonne visibilité liste | `eventVisibilityLabel("public")` | **Hardcodé** — QA06-010 |

## 2. Fiche événement — `/events/[id]`

| # | Champ | Admin fiche | Observé |
|---|-------|-------------|---------|
| 2.1 | Titre | Oui | Header + identité |
| 2.2 | Description | Oui | Identité |
| 2.3 | Date / heure | Oui | `EventDetailScheduleCard` + timezone |
| 2.4 | Lieu | Oui | `location_name`, `address`, ville |
| 2.5 | Organisateur | Oui | `EventDetailOrganizationCard` + lien 360° |
| 2.6 | Statut modération | Oui | Badge + champ identité |
| 2.7 | Annulé | Oui | `is_cancelled`, badge « Annulé » |
| 2.8 | Visibilité | Oui | Champ identité (`public` seul enum MVP) |
| 2.9 | Image / média | **Non** | `cover_image_url` en DB — absent admin — QA06-002 |
| 2.10 | Type événement | **Non** | `event_type` absent admin — QA06-002 |
| 2.11 | Quartier / district | **Non** | Absent admin — QA06-002 |
| 2.12 | Géoloc | **Non** | Placeholder carte « hors périmètre V1 » |
| 2.13 | Intérêts | Oui | `interest_count` ; pas de liste nominative (documenté) |
| 2.14 | API 404 | Live UUID | **404** `EVENT_NOT_FOUND` |

## 3. Statuts (implémentation réelle)

### Modération (`moderation_status`)

| Statut | Label UI | Présent |
|--------|----------|---------|
| `pending_review` | En attente de validation | Oui |
| `approved` | Approuvé | Oui (= « publié » côté public si non annulé) |
| `rejected` | Rejeté | Oui |

### Statuts ticket non présents comme enum modération

| Statut ticket | Équivalent V1 |
|---------------|---------------|
| `draft` | Pas de statut modération draft — création partenaire → `pending_review` ou **auto `approved`** si org vérifiée |
| `published` | **`approved`** + non annulé |
| `archived` | **Non** — remplacé par `cancel` (`is_cancelled`) |
| `cancelled` | Flag **`is_cancelled`** (badge séparé), modération reste `approved` |
| `active` / `inactive` | N/A |

### Transitions autorisées (`local_event_workflow.py`)

| Depuis | Vers |
|--------|------|
| `pending_review` | `approved`, `rejected` |
| `approved` | `rejected` |
| `rejected` | `pending_review` (resoumission partenaire) |

| # | Cas | Résultat |
|---|-----|----------|
| 3.1 | UI approve | `canAdminApproveEvent` — `pending_review` seulement | OK |
| 3.2 | UI reject | `pending_review` **ou** `approved` | OK (aligné workflow) |
| 3.3 | Cancel | `approved` + non annulé — fiche seulement | OK |
| 3.4 | Modération si annulé | Bloquée — copy explicite | OK |

## 4. Modération

| Action | Liste | Fiche | API | Audit |
|--------|-------|-------|-----|-------|
| Approve | Oui | Oui | `POST .../approve` | `approve` + feed upsert |
| Reject (motif) | Oui (dialog) | Oui (dialog) | `POST .../reject` | `reject` + feed deactivate |
| Cancel (motif) | Non | Oui | `POST .../cancel` | `cancel` + feed update |
| Archive | Non | Non | N/A | — |
| Restore | Non | Non | N/A | — |

| # | Cas | Résultat |
|---|-----|----------|
| 4.1 | Refresh après action | Liste `load()` ; fiche `reload()` + audit reload | OK |
| 4.2 | Motif refus affiché | Bandeau amber « Dernier refus » | OK |
| 4.3 | Motif annulation | Validé ≥3 chars (`validateEventCancelReason`) | OK |
| 4.4 | Dialog reject liste | Ferme **avant** confirmation async | QA06-011 |
| 4.5 | Tests cancel | `test_admin_local_event_cancel_api` — public 410, map, feed | **PASS** |

## 5. Visibilité publique (admin ↔ web ↔ feed)

| # | Cas | Admin | Web citoyen | Feed |
|---|-----|-------|-------------|------|
| 5.1 | Liste publique | — | `GET /events` — approved + non cancelled | Via `FeedEventSyncService` |
| 5.2 | Détail public | Lien `buildPublicEventUrl` | `/events/{id}` web | Post sync on approve |
| 5.3 | `event_type` | Absent | Affiché (hero, practical) | Metadata feed |
| 5.4 | `cover_image_url` | Absent | Hero web | Probable feed card |
| 5.5 | `district` | Absent | Agenda / territorial line | Feed |
| 5.6 | `latitude/longitude` | Absent admin | Carte web | Map API |
| 5.7 | Annulé | Badge admin | **410** public (`get_local_event`) | Retiré listes (tests cancel) |
| 5.8 | Lien feed admin | **Absent** | — | Sync invisible opérateur — QA06-008 |
| 5.9 | `NEXT_PUBLIC_WEB_APP_URL` | Lien absolu si défini ; sinon chemin relatif + hint | — | — |

## 6. Organisation / partenaire

| # | Cas | Résultat |
|---|-----|----------|
| 6.1 | Colonne org liste | Nom org ou « — » | OK |
| 6.2 | Fiche org | Nom, slug, vérification, visibilité | OK |
| 6.3 | Lien Partner 360° | `adminPartnerDetailPath(org.id)` | OK |
| 6.4 | Partner 360° → events | Compteurs `events_*` seulement ; **pas** deep link `/events?org=` | QA06-007 |
| 6.5 | Événement sans org | Carte « Aucune organisation liée » | OK (edge case) |

## 7. Navigation

| # | Cas | Résultat |
|---|-----|----------|
| 7.1 | Liste → fiche | `buildEventDetailPathWithListContext` + query | OK |
| 7.2 | Retour fiche (succès) | `buildEventsListBackPath(searchParams)` | **Contexte conservé** |
| 7.3 | Retour erreur/404 | `buildEventsListPath()` sans query | **Perd contexte** — QA06-012 |
| 7.4 | Refresh | Multi-reload détail + audit | OK |
| 7.5 | Cockpit → events | `/events?status=pending_review` | OK |
| 7.6 | URL directe | `/events/{uuid}` | OK |

## 8. Permissions

| Rôle | UI `StaffRoute` | API `/admin/local-events` | Validé |
|------|-----------------|----------------------------|--------|
| **SUPER_ADMIN** | Accès | `system.admin` — live **200** | OK |
| **MODERATOR** | Accès | `moderation.manage` — tests | OK |
| **CITY_ADMIN** | Accès UI staff | RBAC seeds incluent `moderation.manage` | Code OK ; pas de test dédié events |
| **USER** | `/unauthorized` | **403** — `test_regular_user_denied_event_detail` | OK |
| **Non connecté** | Redirect login | **401** (pattern API staff) | OK |

## 9. États vides

| # | Cas | Observé |
|---|-----|---------|
| 9.1 | Aucun événement | Liste vide + message — OK |
| 9.2 | Aucun pending | Filtre défaut → état vide (DB dev) — OK fonctionnel |
| 9.3 | Sans image | Admin n'affiche pas le champ — N/A UI |
| 9.4 | Sans organisation | Carte dédiée — OK |
| 9.5 | Événement expiré | `eventTemporalStatus` = « Terminé » sur fiche — OK |

## 10. Cohérence métier

> *« Une équipe Yunicity peut-elle réellement modérer et publier les événements du pilote Reims depuis cet écran ? »*

**Réponse : oui pour la modération explicite, avec une réserve majeure sur l'auto-publication.**

| Besoin pilote | Couvert ? | Commentaire |
|---------------|-----------|-------------|
| Voir file en attente | **Partiel** | Filtre `pending_review` OK ; **orgs vérifiées contournent la file** |
| Approuver / refuser | **Oui** | Liste + fiche + audit |
| Annuler événement live | **Oui** | Cancel staff + 410 public (testé) |
| Vérifier contenu vs citoyen | **Partiel** | Lien public OK ; **type/image/district absents** admin |
| Filtrer par partenaire | **Non** | Pas de filtre org |
| Créer / éditer depuis admin | **Non** | Portail organisation uniquement (documenté header) |
| Publier via modération | **Oui** | Approve → feed sync + notification |

**Conclusion** : pour Reims, si les partenaires pilote sont **déjà vérifiés**, leurs événements peuvent être **publics sans passage** par la file admin — l'écran Events sert surtout au **contrôle a posteriori** (reject/cancel) et aux cas `pending_review`.

---

# Bugs trouvés

## QA06-001 — Auto-approbation événements org vérifiée (bypass file modération)

| Champ | Détail |
|-------|--------|
| **Gravité** | **Majeure** |
| **Reproduction** | 1. Organisation `verification_status = verified` 2. Partenaire crée/soumet un événement 3. Ouvrir `/events?status=pending_review` |
| **Attendu** | Tout événement pilote passe par validation staff avant publication |
| **Observé** | `_initial_moderation_status` → **`APPROVED`** si org vérifiée ; feed publié sans action staff |
| **Impact pilote** | File « En attente » vide ; cockpit compteur events pending à 0 ; modération **contournée** pour partenaires vérifiés Reims |

## QA06-002 — Champs publics absents de la fiche admin (type, image, district, géoloc)

| Champ | Détail |
|-------|--------|
| **Gravité** | **Majeure** |
| **Reproduction** | Créer événement avec `cover_image_url`, `event_type`, `district` 3. Ouvrir fiche admin |
| **Attendu** | Parité modération : voir ce que le citoyen verra |
| **Observé** | `AdminLocalEventDetailResponse` et UI sans ces champs ; placeholder carte seulement |
| **Impact pilote** | Modération « à l'aveugle » sur le rendu web/feed |

## QA06-003 — Pas de création / édition staff dans l'admin Events

| Champ | Détail |
|-------|--------|
| **Gravité** | **Majeure** (écart périmètre ticket / ops) |
| **Reproduction** | Chercher bouton créer ou formulaire édition sur `/events` |
| **Attendu** (ticket) | Création / édition si disponible |
| **Observé** | Header documente : « création et modification partenaire restent dans le portail organisation » ; aucune route admin POST/PATCH event |
| **Impact pilote** | Équipe Yunicity **ne peut pas** créer/corriger un événement sans compte partenaire |

## QA06-004 — Pas d'archive ni restore ; annulation seule voie de retrait

| Champ | Détail |
|-------|--------|
| **Gravité** | **Majeure** (workflow ticket) |
| **Reproduction** | Chercher actions archive/restore sur fiche |
| **Attendu** (ticket) | archive, restore si disponible |
| **Observé** | Uniquement **cancel** (approved → `is_cancelled`) ; pas de restore |
| **Impact pilote** | Pas de dépublier temporaire ; annulation = 410 public définitif |

## QA06-005 — Pas de recherche texte en liste

| Champ | Détail |
|-------|--------|
| **Gravité** | **Moyenne** |
| **Reproduction** | Chercher un événement par titre sur `/events` |
| **Attendu** | Recherche (ticket §1) |
| **Observé** | Filtres statut + ville uniquement |
| **Impact pilote** | Friction quand volume events augmente |

## QA06-006 — Pas de tri configurable

| Champ | Détail |
|-------|--------|
| **Gravité** | **Moyenne** |
| **Observé** | Tri fixe `created_at desc` ; pas de tri par date événement |
| **Impact pilote** | Priorisation modération par date de début difficile |

## QA06-007 — Pas de filtre organisation + pas de lien Partner 360° → events

| Champ | Détail |
|-------|--------|
| **Gravité** | **Moyenne** |
| **Reproduction** | Depuis fiche partenaire (compteur events) → chercher lien file events filtrée |
| **Attendu** | Contexte org conservé (comme offres `?organization_id=`) |
| **Observé** | API admin `list_admin` sans `organization_id` ; Partner 360 compteurs sans deep link |
| **Impact pilote** | Investigation partenaire multi-clics |

## QA06-008 — Pas de lien / visibilité feed admin

| Champ | Détail |
|-------|--------|
| **Gravité** | **Moyenne** |
| **Observé** | `FeedEventSyncService` sur approve/cancel ; admin n'affiche pas lien post feed ni statut sync |
| **Impact pilote** | Opérateur ne peut pas vérifier présence feed sans quitter admin |

## QA06-009 — Erreur API efface la liste

| Champ | Détail |
|-------|--------|
| **Gravité** | **Moyenne** |
| **Fichier** | `use-admin-events-list.ts` |
| **Observé** | `setItems([])` dans `catch` — pattern QA02–05 |
| **Impact pilote** | Perte contexte sur incident réseau |

## QA06-010 — Colonne visibilité liste hardcodée « Public »

| Champ | Détail |
|-------|--------|
| **Gravité** | **Mineure** |
| **Fichier** | `events-list.tsx` L121 — `eventVisibilityLabel("public")` |
| **Observé** | N'utilise pas `event.visibility` (MVP = public uniquement) |
| **Impact pilote** | Faible aujourd'hui ; dette si nouvelles visibilités |

## QA06-011 — Dialog reject liste se ferme avant résultat API

| Champ | Détail |
|-------|--------|
| **Gravité** | **Mineure** |
| **Fichier** | `events-list.tsx` — `setRejectTarget(null)` immédiat dans `onConfirm` |
| **Observé** | Dialog se ferme même si reject échoue ; erreur dans bandeau global seulement |
| **Impact pilote** | UX confuse sur échec refus |

## QA06-012 — Retour liste sans contexte sur erreur/404 fiche

| Champ | Détail |
|-------|--------|
| **Gravité** | **Mineure** |
| **Zone** | `event-detail-view.tsx` états erreur/404 |
| **Observé** | `buildEventsListPath()` sans query |
| **Impact pilote** | Perte filtres après erreur chargement |

## QA06-013 — DB dev vide

| Champ | Détail |
|-------|--------|
| **Gravité** | **Info** |
| **Observé** | `total: 0` live ; E2E browser non exécuté |
| **Impact pilote** | Seeds ou workflow partenaire requis pour recette |

---

# Gravité

| Gravité | Count | IDs |
|---------|-------|-----|
| Critique | 0 | — |
| Majeure | 4 | QA06-001, QA06-002, QA06-003, QA06-004 |
| Moyenne | 5 | QA06-005, QA06-006, QA06-007, QA06-008, QA06-009 |
| Mineure | 3 | QA06-010, QA06-011, QA06-012 |
| Info | 1 | QA06-013 |

---

# UX

## Points positifs

- File modération par défaut (`pending_review`) alignée cockpit.
- Modération **depuis la liste** (gain de temps) + fiche complète.
- Badges modération + badge **Annulé** distinct.
- Cartes fiche claires : identité, dates, lieu, org, modération, engagement.
- Statut temporel (À venir / En cours / Terminé) utile pour événements expirés.
- Annulation avec dialog motif + copy d'avertissement (feed, carte, 410).
- Audit staff paginé (approve / reject / cancel).
- Navigation contextuelle liste ↔ fiche (meilleure que Passport Ops / Partners).
- Header explicite sur périmètre création partenaire.

## Frictions opérateur

- File pending potentiellement vide (auto-approve verified).
- Impossible de prévisualiser image/type/district sans ouvrir le web.
- Pas de filtre par partenaire.
- Tables larges (1200px min) → scroll mobile.
- Titre page « Events » en anglais dans un admin français.
- Pas de création admin pour dépannage pilote.

---

# Écarts admin ↔ citoyen

| Champ / comportement | Admin | Web / API publique |
|----------------------|-------|-------------------|
| `title`, `description` | ✅ | ✅ |
| `starts_at`, `ends_at`, `timezone` | ✅ | ✅ |
| `location_name`, `address`, `city` | ✅ | ✅ |
| `event_type` | ❌ | ✅ (labels, hero) |
| `cover_image_url` | ❌ | ✅ (hero) |
| `district` | ❌ | ✅ (territorial line) |
| `latitude`, `longitude` | ❌ (placeholder) | ✅ (carte) |
| `organization` (résumé) | ✅ (partiel) | ✅ (+ logo, partner_status) |
| `moderation_status` | ✅ | Visible indirectement (liste = approved only) |
| `is_cancelled` | ✅ | 410 détail / absent listes |
| `interest_count` | ✅ | ✅ |
| `rejection_reason` | ✅ staff | Partenaire (management API) |
| Feed post | Sync invisible | Visible feed citoyen |

---

# Recommandations

1. **Avant pilote Reims** : décision produit sur **auto-approve org vérifiée** — désactiver pour pilote ou accepter modération a posteriori uniquement.
2. **Seeds recette** : au moins 1 event `pending_review`, 1 `approved`, 1 `approved`+cancelled, 1 `rejected`.
3. **Parité modération** : exposer `event_type`, `cover_image_url`, `district`, preview image dans fiche admin.
4. **Filtre organisation** : `?organization_id=` + lien depuis Partner 360° (comme offres).
5. **Feed** : lien « Voir dans le feed » post-approve ou indicateur sync.
6. **Recherche** : param `q` sur titre (API + barre).
7. **Tri** : option « par date de début » pour prioriser modération.
8. **Résilience** : conserver liste en erreur reload.
9. **Recette manuelle** :
   - [ ] Workflow partenaire → submit → modération admin
   - [ ] Approve → lien public web + présence feed
   - [ ] Reject approved → retrait public
   - [ ] Cancel → 410 public + map absent
   - [ ] MODERATOR / CITY_ADMIN / USER sur `/events`
   - [ ] Comparer fiche admin vs page web événement

---

# GO / NO GO

## Events Admin — **GO conditionnel**

| Critère | Décision |
|---------|----------|
| Routes `/events`, `/events/[id]` | **GO** |
| Modération approve/reject/cancel + audit | **GO** |
| Navigation contextuelle | **GO** |
| File pending fiable pilote Reims | **NO GO** si auto-approve verified non acceptée |
| Parité admin ↔ citoyen (image, type) | **NO GO** pour modération visuelle complète |
| Création / édition staff | **NO GO** (hors scope V1 documenté) |
| Pilote modération explicite | **GO conditionnel** |

**Conditions de passage prod pilote :**

1. Décision écrite sur **QA06-001** (auto-approve verified vs modération systématique).
2. Seeds recette couvrant pending, approved, cancelled, rejected.
3. Formation opérateur : annulation = irréversible côté public (410) ; pas d'archive.
4. Accepter création/édition **uniquement** via portail partenaire, ou prévoir dépannage manuel hors admin.

**Bloquant absolu prod** : aucune faille sécurité (staff guard, USER 403, cancel audité). Les majeurs sont **workflow pilote** et **parité contenu**, pas des bypass d'accès.

---

*Rapport généré en phase QA HARDENING — aucun correctif appliqué, aucun commit.*
