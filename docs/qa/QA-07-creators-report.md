# QA-07 — Creators Administration Validation

**Ticket** : QA-07  
**Feature** : FEATURE-ADMIN-V1  
**Phase** : QA HARDENING  
**Date** : 2026-06-05  
**Routes auditées** : `/creator-content`, `/creator-content/[id]`  
**Méthode** : revue statique + tests d'intégration existants — **aucune modification produit**

---

# Résumé

Le module **Creators admin** (`/creator-content`) est le **workspace modération le plus abouti** d’ADMIN-V1 après Offers : routes conformes au ticket, file `pending_review` par défaut, filtres statut + organisation, pagination, fiche détail riche (aperçu média, exposition publique, feed, audit staff), actions **approve / reject / archive**, et navigation liste ↔ fiche **avec contexte préservé**.

Points forts vs Events (QA-06) :

- Workflow **sans auto-publication** : soumission partenaire → `pending_review` obligatoire avant publication staff.
- **Archive** staff + audit `creator_content_admin_actions` (parité Offers).
- **Parité contenu** admin ↔ citoyen sur `title`, `body`, `media_url` (aperçu staff avec image).

Écarts majeurs pour un pilote Reims :

- **Incohérence UI ↔ API** : bouton « Rejeter » affiché sur contenu **publié**, alors que le workflow backend n’autorise que `published → archived` (reject → **422**).
- **Filtre organisation côté client** (max 100 lignes) — pas de `organization_id` sur l’API admin.
- Lien Partner 360° → `/creator-content` **sans** `?organization_id=`.
- **Approve** force `organization.visibility = PUBLIC` (effet documenté mais risqué pilote).

| Verdict zone | Résultat |
|--------------|----------|
| Liste / filtres / pagination | PASS ; filtre org fragile |
| Fiche contenu | PASS ; auteur/modérateur incomplets |
| Modération | PASS avec réserve reject published |
| Publication / feed | PASS ; pas de lien post feed |
| Auteur / organisation | PASS partiel |
| Permissions | PASS code ; test USER partiel |
| Exploitabilité pilote | **GO conditionnel** |

**Environnement** : monorepo local ; DB dev quasi vide ; **16 tests** intégration creator content **passed** (~53 s).

---

# Routes réelles

| Route ticket | Route implémentée | Statut |
|--------------|-------------------|--------|
| `/creator-content` | `/creator-content` → `CreatorContentWorkspace` | ✅ Conforme |
| `/creator-content/[id]` | `/creator-content/[id]` → `CreatorContentDetailView` | ✅ Conforme |
| — | API `GET /api/v1/admin/partner-creator-content` | Liste staff |
| — | API `GET .../{id}`, `.../actions` | Détail + audit |
| — | API `POST .../approve`, `.../reject`, `.../archive` | Modération |
| — | Création / édition | Portail org `/organizations/me/creator-content` |

**Protection** : `StaffRoute` dans `creator-content/layout.tsx` ; API `_staff_guard` = `moderation.manage` | `system.admin`.

**Navigation transverse** :

| Source | Cible |
|--------|-------|
| Cockpit « À traiter » | `/creator-content?status=pending_review` |
| Cockpit quick action | `/creator-content` |
| Partner 360° lien | `links.creator_content_admin` → **`/creator-content`** (sans filtre org) |
| Sidebar | `Creator Content` (EN) → page `Contenus créateurs` (FR) |

**API publique citoyen** : `GET /api/v1/partners/{slug}/creator-content` (liste publiée sur fiche partenaire).

---

# Cas testés

## 1. Liste contenus — `/creator-content`

| # | Cas | Méthode | Résultat |
|---|-----|---------|----------|
| 1.1 | Protection staff | `creator-content/layout.tsx` | `StaffRoute` — OK |
| 1.2 | Chargement | `useAdminCreatorContentList` | Message chargement — OK |
| 1.3 | Erreur API | Revue hook | Bandeau + Réessayer ; `setItems([])` — QA07-012 |
| 1.4 | Filtre défaut | `parseCreatorContentSearchParams` | **`pending_review`** — OK |
| 1.5 | Filtres statut | 5 statuts + « Tous » | OK URL sync |
| 1.6 | Filtre organisation | Select org vérifiées | **Client-side** — QA07-003 |
| 1.7 | Pagination | `PassportOpsPagination` | OK ; org filter charge page 1 + page_size 100 |
| 1.8 | Recherche texte | Revue UI | **Absente** — QA07-005 |
| 1.9 | Tri | API `sort=newest\|oldest` | UI envoie toujours `newest` — QA07-006 |
| 1.10 | Modération inline | Revue liste | **Absente** — lien « Voir » seulement — QA07-010 |
| 1.11 | États vides | Messages contextualisés | OK |
| 1.12 | KPI strip | `countCreatorContentKpis` | Compteurs **page courante** — QA07-015 |

## 2. Fiche contenu — `/creator-content/[id]`

| # | Champ | Admin fiche | Observé |
|---|-------|-------------|---------|
| 2.1 | Titre | Oui | Header + identité + aperçu |
| 2.2 | Extrait / body | Oui | `CreatorContentDetailPreviewCard` (corps complet scroll) |
| 2.3 | `media_url` | Oui | Lien + preview image si extension image |
| 2.4 | Statut | Oui | Badge + identité (5 statuts) |
| 2.5 | `is_active` | Oui | Champ identité |
| 2.6 | `rejection_reason` | Oui | Bandeau modération |
| 2.7 | Auteur | **Liste seulement** | Absent fiche détail — QA07-008 |
| 2.8 | `moderated_at` / modérateur | **DB oui** | Absent API admin + UI — QA07-007 |
| 2.9 | Organisation | Oui | Carte org + liens admin / public |
| 2.10 | API 404 | Tests | `CREATOR_CONTENT_NOT_FOUND` — OK |

## 3. Modération

| Action | Fiche | API | Audit | Feed |
|--------|-------|-----|-------|------|
| Approve | Oui | `POST .../approve` | `approve` | `upsert_creator_content_post` |
| Reject (motif) | Oui | `POST .../reject` | `reject` | `deactivate` |
| Archive | Oui | `POST .../archive` | `archive` | `deactivate` |

**Transitions backend** (`partner_creator_content_workflow.py`) :

| Depuis | Vers autorisés |
|--------|----------------|
| `draft` | `pending_review` (partenaire submit) |
| `pending_review` | `published`, `rejected` |
| `rejected` | `draft` (édition partenaire) |
| `published` | **`archived` uniquement** |
| `archived` | (terminal) |

| # | Cas | Résultat |
|---|-----|----------|
| 3.1 | Approve depuis `pending_review` | Test `test_admin_get_detail_and_approve` — **PASS** |
| 3.2 | Reject depuis `pending_review` + motif | Test `test_admin_reject_requires_reason` — **PASS** |
| 3.3 | Archive depuis `published` | Test `test_archive_writes_audit_entry` — **PASS** |
| 3.4 | Archive depuis `pending_review` | Test `test_no_audit_when_moderation_action_fails` — **422** — OK |
| 3.5 | Reject depuis `published` (UI) | Bouton visible ; API → **422** `INVALID_CREATOR_CONTENT_TRANSITION` — **QA07-001** |
| 3.6 | Refresh après action | `reload()` + audit reload — OK |
| 3.7 | Confirm archive | **Aucun dialog** — QA07-011 |

## 4. Publication (admin ↔ web ↔ feed)

| # | Cas | Admin | Web / public | Feed |
|---|-----|-------|--------------|------|
| 4.1 | Champs contenu | title, body, media_url | Idem (`PartnerCreatorContentPublicItem`) | Post `PARTNER_CREATOR` |
| 4.2 | Date publication | `submitted_at` / `updated_at` proxy | `published_at` = `moderated_at` | Sync à approve |
| 4.3 | Visibilité fiche partenaire | Carte exposition (statut + is_active) | Liste slug partenaire | — |
| 4.4 | Feed | Carte « Distribution feed » (indicateur) | Feed citoyen | Pas de `post_id` / lien — QA07-009 |
| 4.5 | Approve side-effect | Avertissement org → PUBLIC | Org peut devenir publique | Documenté UI — QA07-002 |
| 4.6 | Reject / archive publié | Retrait feed (deactivate) | Disparaît liste publique | Test feed sync — **PASS** |

## 5. Auteur

| # | Cas | Résultat |
|---|-----|----------|
| 5.1 | Colonne auteur liste | `adminCreatorContentAuthorLabel` — OK |
| 5.2 | Fiche détail auteur | **Absent** (API expose `author` mais pas affiché) — QA07-008 |
| 5.3 | Lien profil utilisateur | **Absent** |
| 5.4 | Traçabilité audit | `actor_user` dans timeline — OK |

## 6. Organisation

| # | Cas | Résultat |
|---|-----|----------|
| 6.1 | Identification org | Liste + carte détail — OK |
| 6.2 | Lien Partner 360° admin | `adminPartnerDetailPath` — OK |
| 6.3 | Lien fiche publique | `partnerPublicPlaceUrl` — OK |
| 6.4 | Partner 360° → file filtrée | Lien **`/creator-content`** sans query — QA07-004 |
| 6.5 | Compteurs Partner 360° | Affichés ; **pas de deep link** sur compteurs — QA07-004 |
| 6.6 | Vérification / visibilité org | Renvoi « Voir fiche organisation » — OK |

## 7. Permissions

| Rôle | UI `StaffRoute` | API admin | Validé |
|------|-----------------|----------|--------|
| **SUPER_ADMIN** | Accès | `system.admin` | Code OK |
| **MODERATOR** | Accès | `moderation.manage` | Tests approve/reject/archive — **PASS** |
| **CITY_ADMIN** | Accès UI staff | RBAC seeds `moderation.manage` | Code OK |
| **USER** | `/unauthorized` | **403** sur `.../actions` — `test_user_denied_list_content_actions` | Partiel ; pas de test liste principale |
| **Non connecté** | Redirect login | **401** (pattern staff) | Code OK |

## 8. États vides

| # | Cas | Observé |
|---|-----|---------|
| 8.1 | Aucun contenu | Message liste — OK |
| 8.2 | Aucun pending | Filtre défaut — OK |
| 8.3 | Brouillon (`draft`) | Filtrable ; pas d’action staff — OK |
| 8.4 | Rejeté | Motif affiché ; resoumission partenaire — OK |
| 8.5 | Publié | Archive disponible ; reject UI **cassé** — QA07-001 |
| 8.6 | Sans média | Copy « Aucun média associé » — OK |
| 8.7 | Sans organisation | Impossible (FK obligatoire) — N/A |

## 9. Cohérence métier

> *« Une équipe Yunicity peut-elle réellement gérer un programme créateurs pilote depuis cette interface ? »*

**Réponse : oui pour la modération de contenus partenaires V1, non pour un « programme créateurs territorial » complet.**

| Besoin pilote | Couvert ? | Commentaire |
|---------------|-----------|-------------|
| File modération pending | **Oui** | Pas de bypass auto-publish (contrairement Events QA06-001) |
| Approuver / refuser soumission | **Oui** | Workflow testé |
| Retirer contenu publié | **Partiel** | **Archiver** OK ; **Rejeter** publié **cassé** en UI |
| Vérifier rendu citoyen | **Oui** | Aperçu staff + lien fiche publique |
| Filtrer par partenaire | **Partiel** | Filtre UI fragile (>100 contenus) |
| Créer / éditer depuis admin | **Non** | Portail organisation (documenté header) |
| Programme créateurs (profils, missions) | **Non** | Hors ADMIN-V1 — FEATURE-CREATORS-V1 |

**Conclusion** : l’équipe peut **modérer et publier des contenus éditoriaux partenaires** pour Reims. Ce n’est **pas** encore un hub « créateurs citoyens » — uniquement `partner_creator_contents`.

## 10. Tests auto exécutés

| Suite | Résultat |
|-------|----------|
| `test_admin_partner_creator_content_api.py` | **PASS** |
| `test_admin_partner_creator_content_actions_audit_api.py` | **PASS** |
| `test_partner_creator_content_feed_sync.py` | **PASS** |
| `frontend/packages/utils/src/admin-creator-content.test.ts` | Revue statique (non exécuté en CI local) |

**Total intégration** : **16 passed** en ~53 s.

---

# Bugs

## QA07-001 — Bouton « Rejeter » sur contenu publié : transition API interdite

| Champ | Détail |
|-------|--------|
| **Gravité** | **Majeure** |
| **Reproduction** | 1. Approuver un contenu (`published`) 2. Ouvrir fiche admin 3. Cliquer « Rejeter » + motif |
| **Attendu** | Retrait public avec motif (doc discovery mentionnait `published → rejected`) **ou** bouton masqué |
| **Observé** | UI : `canAdminRejectCreatorContent("published")` = true ; API : workflow n’autorise que `published → archived` → **422** `INVALID_CREATOR_CONTENT_TRANSITION` |
| **Impact pilote** | Opérateur bloqué ou confus ; doit utiliser **Archiver** (sans motif partenaire structuré) |

## QA07-002 — Approve force l’organisation en visibilité PUBLIC

| Champ | Détail |
|-------|--------|
| **Gravité** | **Majeure** |
| **Fichier** | `partner_creator_content_service.py` L209 |
| **Observé** | `org.visibility = OrganizationVisibility.PUBLIC` à chaque approve ; UI avertit via `CreatorContentDetailPublicExposureCard` |
| **Impact pilote** | Publication d’un article peut exposer un partenaire encore privé |

## QA07-003 — Filtre organisation client-side (plafond 100, total faux)

| Champ | Détail |
|-------|--------|
| **Gravité** | **Majeure** |
| **Fichier** | `use-admin-creator-content-list.ts` |
| **Observé** | Si `organization_id` en URL : fetch `page_size=100` puis filtre JS + pagination client ; API sans param `organization_id` |
| **Impact pilote** | Org avec >100 contenus : résultats incomplets ; KPI/total incorrects |

## QA07-004 — Partner 360° : lien creators sans filtre organisation

| Champ | Détail |
|-------|--------|
| **Gravité** | **Majeure** |
| **Fichier** | `admin_partner_service.py` — `creator_content_admin="/creator-content"` |
| **Observé** | Test `test_admin_partner_detail_api` attend `/creator-content` nu ; compteurs sans lien |
| **Impact pilote** | Investigation multi-clics (régression connue QA-03) |

## QA07-005 — Pas de recherche texte

| Champ | Détail |
|-------|--------|
| **Gravité** | **Moyenne** |
| **Observé** | Filtres statut + org uniquement |
| **Impact pilote** | Friction quand volume augmente |

## QA07-006 — Tri API non exposé en UI

| Champ | Détail |
|-------|--------|
| **Gravité** | **Moyenne** |
| **Observé** | `toAdminCreatorContentListParams` fixe `sort: "newest"` |
| **Impact pilote** | Pas de tri par ancienneté file |

## QA07-007 — Modérateur / date modération absents de la fiche

| Champ | Détail |
|-------|--------|
| **Gravité** | **Moyenne** |
| **Observé** | `moderated_at`, `moderated_by_user_id` en DB ; absents `PartnerCreatorContentAdminResponse` et UI |
| **Impact pilote** | Traçabilité modération incomplète hors audit |

## QA07-008 — Auteur absent de la fiche détail

| Champ | Détail |
|-------|--------|
| **Gravité** | **Moyenne** |
| **Observé** | API détail renvoie `author` ; carte identité ne l’affiche pas |
| **Impact pilote** | Incohérence liste ↔ fiche |

## QA07-009 — Pas de lien direct vers le post feed

| Champ | Détail |
|-------|--------|
| **Gravité** | **Moyenne** |
| **Observé** | `CreatorContentDetailFeedSyncCard` = indicateur texte ; pas de `post_id` admin |
| **Impact pilote** | Vérification feed = quitter admin |

## QA07-010 — Pas de modération inline en liste

| Champ | Détail |
|-------|--------|
| **Gravité** | **Moyenne** |
| **Observé** | Liste : colonne « Voir » seulement (vs Events approve/reject inline) |
| **Impact pilote** | File pending plus lente à traiter |

## QA07-011 — Archive sans confirmation

| Champ | Détail |
|-------|--------|
| **Gravité** | **Moyenne** |
| **Observé** | Clic « Archiver » immédiat ; pas de dialog motif (backend motif système fixe) |
| **Impact pilote** | Risque clic accidentel retrait public |

## QA07-012 — Erreur API efface la liste

| Champ | Détail |
|-------|--------|
| **Gravité** | **Moyenne** |
| **Fichier** | `use-admin-creator-content-list.ts` L83-84 |
| **Impact pilote** | Perte contexte sur incident réseau |

## QA07-013 — Libellé sidebar EN « Creator Content »

| Champ | Détail |
|-------|--------|
| **Gravité** | **Mineure** |
| **Fichier** | `admin-shell.tsx` L25 |
| **Impact pilote** | Cosmétique ; page titre FR OK |

## QA07-014 — Tests RBAC USER incomplets sur API liste principale

| Champ | Détail |
|-------|--------|
| **Gravité** | **Mineure** |
| **Observé** | `test_user_denied` sur `.../actions` seulement ; pas sur `GET /admin/partner-creator-content` |
| **Impact pilote** | Faible ; garde `_staff_guard` identique |

## QA07-015 — KPI « En attente / Approuvés / Refusés » = page courante

| Champ | Détail |
|-------|--------|
| **Gravité** | **Mineure** |
| **Observé** | `countCreatorContentKpis(items)` sur slice affiché |
| **Impact pilote** | Métriques trompeuses si pagination |

## QA07-016 — Pas de création / édition staff

| Champ | Détail |
|-------|--------|
| **Gravité** | **Info** (hors scope V1 documenté) |
| **Observé** | Header : « création et soumission restent dans le portail organisation » |
| **Impact pilote** | Dépannage = compte partenaire ou SQL |

---

# Gravité

| Gravité | Count | IDs |
|---------|-------|-----|
| Critique | 0 | — |
| Majeure | 4 | QA07-001, QA07-002, QA07-003, QA07-004 |
| Moyenne | 8 | QA07-005 … QA07-012 |
| Mineure | 3 | QA07-013, QA07-014, QA07-015 |
| Info | 1 | QA07-016 |

---

# UX

## Points positifs

- File modération par défaut alignée cockpit (`pending_review`).
- Fiche **360°** la plus complète des modules récents : aperçu média, exposition publique, feed, audit paginé.
- Avertissement explicite side-effect org PUBLIC à l’approve.
- Reject avec motif obligatoire + bandeau « Dernier refus ».
- Navigation contextuelle liste ↔ fiche (`buildCreatorContentListBackPath`) — y compris états erreur/404.
- Filtre organisation présent (unique parmi Events).
- Copy produit claire : contenus **partenaires vérifiés**, pas créateurs individuels.

## Frictions opérateur

- Rejet publié proposé mais impossible → utiliser Archiver (sémantique différente).
- Archive en un clic sans garde-fou.
- Pas de modération rapide depuis la liste.
- KPI strip peut induire en erreur.
- Sidebar anglais vs contenu français.

---

# Écarts V1 ↔ Vision Future

**Implémentation actuelle (ADMIN-V1)** = **`partner_creator_contents`** : contenus éditoriaux soumis par **organisations partenaires vérifiées**, modérés staff, publiés sur **fiche partenaire** + **feed** (`PostType.PARTNER_CREATOR`).

**FEATURE-CREATORS-V1 envisagée** (PRD-301, discovery ADMIN-06A §13) — **non couverte** :

| Capacité future | Statut V1 |
|-----------------|-----------|
| `creator_profiles` / créateurs individuels | ❌ Absent |
| Hub citoyen « Créateurs Reims » | ❌ Absent |
| Missions, quartiers, ambassadeurs | ❌ Absent |
| Badges, rémunération, sponsor | ❌ Absent |
| Multi-format (live, vidéo, sponsored) | ❌ Un seul type éditorial |
| Analytics programme / ranking | ❌ Absent |
| Lien contenu → event / place / quartier | ❌ FK absente |
| Création staff admin | ❌ Portail org uniquement |
| Route `/creators` unifiée | ❌ `/creator-content` (intentionnel V1) |

**Écarts structurants** : ADMIN-V1 = **modération de contenus partenaires**, pas un **programme créateurs territorial**. Le nom nav « Creators » / « Creator Content » peut créer une attente produit non satisfaite avant FEATURE-CREATORS-V1.

**Évolution discovery ADMIN-06A → état code** : plusieurs gaps 06B/C/D **livrés** depuis la discovery (audit, archive UI, exposition publique, deep-link cockpit status). Restent ouverts : filtre org **backend**, lien partner filtré, `moderated_*` / `post_id` en détail.

---

# Recommandations

1. **Avant pilote** : corriger **QA07-001** — masquer « Rejeter » sur `published` **ou** autoriser `published → rejected` côté workflow (décision produit).
2. **Décision écrite** sur **QA07-002** (approve → org PUBLIC) — confirmer ou retirer le side-effect.
3. **Backend** : ajouter `organization_id` sur `GET /admin/partner-creator-content` ; aligner lien Partner 360° → `/creator-content?organization_id={uuid}`.
4. **Fiche détail** : afficher `author`, `moderated_at`, modérateur ; optionnel `post_id` feed.
5. **UX** : dialog confirmation archive ; modération inline liste (approve/reject pending).
6. **Recherche** : param `q` sur titre.
7. **Seeds recette** : 1 pending, 1 published, 1 rejected, 1 archived, 1 avec media_url.
8. **Recette manuelle** :
   - [ ] Partenaire : draft → submit → staff approve → fiche publique + feed
   - [ ] Staff reject pending avec motif → partenaire voit raison
   - [ ] Staff archive published → absent public/feed
   - [ ] **Ne pas** utiliser Reject sur published (bug connu) — utiliser Archive
   - [ ] Filtre org depuis Partner 360° (après fix lien)
   - [ ] MODERATOR / CITY_ADMIN / USER sur `/creator-content`

---

# GO / NO GO

## Creators Admin — **GO conditionnel**

| Critère | Décision |
|---------|----------|
| Routes `/creator-content`, `/creator-content/[id]` | **GO** |
| Modération pending → published + audit | **GO** |
| Archive contenu publié | **GO** |
| Reject contenu publié (UI) | **NO GO** (QA07-001) |
| Filtre org fiable à l’échelle | **NO GO** (>100 items) |
| Programme créateurs territorial | **NO GO** (hors scope — FEATURE-CREATORS-V1) |
| Pilote contenus partenaires Reims | **GO conditionnel** |

**Conditions passage prod pilote :**

1. Formation opérateur : **retirer un publié = Archiver**, pas Rejeter ; comprendre side-effect org PUBLIC à l’approve.
2. Fix ou contournement documenté **QA07-001** avant charge modération réelle.
3. Seeds recette + parcours partenaire → staff documenté.
4. Accepter que « Creators admin » = **contenus partenaires**, pas profils créateurs citoyens.

**Bloquant absolu prod** : aucune faille accès identifiée (staff guard, MODERATOR testé, USER 403 sur audit). Les majeurs sont **cohérence workflow** et **filtre org**, pas bypass sécurité.

**Comparaison QA-06 Events** : Creators est **plus prêt** pour modération pilote (file pending fiable, archive, audit, parité contenu). Events reste plus faible sur auto-approve verified et parité champs publics.

---

*Rapport généré en phase QA HARDENING — aucun correctif appliqué, aucun commit.*
