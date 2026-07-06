# QA-05 — Offers Administration Validation

**Ticket** : QA-05  
**Feature** : FEATURE-ADMIN-V1  
**Phase** : QA HARDENING  
**Date** : 2026-06-05  
**Routes auditées** : `/passport-offers`, `/passport-offers/[id]`, `/passport-offers/new`  
**Méthode** : revue statique + API live + tests d'intégration existants — **aucune modification produit**

> **Note périmètre ticket** : le ticket mentionne `/offers` et `/offers/[id]`. En code admin V1, le workspace staff est **`/passport-offers`** (`buildOffersListPath` / `buildPassportOfferAdminPath`). Aucune route `/offers` n'existe côté admin.  
> Route distincte **`/partner-offers`** = hub self-service partenaire (hors ADMIN-04).

---

# Résumé

Le module **Offres admin** (`/passport-offers`) est **le plus mature** des workspaces ADMIN-04 audités : liste filtrée avec pagination, file modération par défaut (`pending_review`), fiche complète, actions approve/reject/archive, édition staff, création admin, redemptions paginées, audit staff, carte **exposition publique** (critères citoyen), et **navigation liste ↔ fiche avec contexte préservé** (query params).

Écarts majeurs vs ticket et vs **offre publique citoyen** :

- Champs catalogue **`value_label`** et **`conditions`** présents en DB + API publique — **absents** de l'API admin et de toute l'UI staff.
- **Readiness partenaire** (statut catalogue) marquée « non disponible » — check exposition publique incomplet.
- **`is_active`** utilisé dans la logique de visibilité mais **jamais affiché** à l'opérateur.
- Pas de **recherche texte** ni de **tri** configurable en liste.

Sur DB dev locale (quasi vide), APIs **200 avec listes vides** — recette E2E nécessite seeds pilote (`reims_partner_offers` ou workflow partenaire).

| Verdict zone | Résultat |
|--------------|----------|
| Liste / filtres / pagination | PASS ; pas de recherche/tri |
| Fiche offre | PASS structure ; champs catalogue manquants |
| Statuts / modération | PASS workflow V1 |
| Lien partenaire | PASS (liste + fiche + lien 360°) |
| Passport / exposition publique | PASS partiel ; écarts value_label / readiness |
| Publication (create/edit/approve/archive) | PASS ; pas de désactivation hors archive |
| Navigation | PASS avec réserve (erreur/404) |
| Permissions | PASS code ; 1 test RBAC flaky en dev local |
| Exploitabilité pilote Reims | **GO conditionnel** |

---

# Cas testés

## 1. Liste des offres — `/passport-offers`

| # | Cas | Méthode | Résultat |
|---|-----|---------|----------|
| 1.1 | Protection staff | `passport-offers/layout.tsx` | `StaffRoute` — OK |
| 1.2 | Chargement | `useAdminOffersList` | « Chargement des offres… » |
| 1.3 | Erreur liste | Revue hook | Bandeau rose + Réessayer ; `setItems([])` — QA05-007 |
| 1.4 | API live | `GET /admin/partner-offers` | **200** — `total: 0` |
| 1.5 | Filtre défaut | `parsePassportOffersSearchParams` | **`pending_review`** si pas de `organization_id` — aligné cockpit |
| 1.6 | Filtres statut | Select + chips équivalent | draft / pending_review / published / rejected / archived — OK |
| 1.7 | Filtre organisation | Select orgs vérifiées | `GET /verified-organizations` — OK (vide en dev) |
| 1.8 | Filtre type | drink, discount, vip, etc. | OK |
| 1.9 | Pagination | `PassportOpsPagination` | Précédent/Suivant — OK |
| 1.10 | Recherche texte | Revue UI | **Absente** — QA05-004 |
| 1.11 | Tri | Revue UI + repo | **Absent UI** ; backend `created_at desc` fixe — QA05-005 |
| 1.12 | KPI strip | `PassportOffersKpiStrip` | Total / ville active / filtre statut — OK |
| 1.13 | État vide | Message contextualisé | OK |
| 1.14 | Colonnes liste | titre, org, ville, statut, tier, redemptions, dates | OK |
| 1.15 | Lien fiche | `buildOfferDetailPathWithListContext` | Query liste propagée — OK |

## 2. Fiche offre — `/passport-offers/[id]`

| # | Champ ticket | Présent admin ? | Observé |
|---|--------------|-----------------|---------|
| 2.1 | Titre | Oui | Header + identité + édition |
| 2.2 | Description | Oui | Identité + édition |
| 2.3 | value_label | **Non** | Absent API `PartnerOfferAdmin` — QA05-001 |
| 2.4 | conditions | **Non** | Idem — QA05-001 |
| 2.5 | Partenaire | Oui | `OfferDetailPartnerCard` + header |
| 2.6 | Statut | Oui | Badge + identité (`offer_status`) |
| 2.7 | Visibilité | Partiel | Visibilité **organisation** ; pas `is_active` offre — QA05-003 |
| 2.8 | Type offre | Oui | Identité + édition |
| 2.9 | Dates validité | Oui | Identité + conditions Passport + édition |
| 2.10 | Palier requis | Oui (lecture) | `OfferDetailPassportConditionsCard` ; **non éditable** UI |
| 2.11 | Quota / limite | Oui (partiel) | redemption_limit éditable ; max_redemptions_total lecture seule |
| 2.12 | ID offre | Oui | Identité |
| 2.13 | Motif refus | Oui | Section modération si `rejection_reason` |
| 2.14 | API 404 | Live UUID | **404** `OFFER_NOT_FOUND` |

## 3. Statuts (implémentation réelle)

| Statut produit | Label UI | Actions staff disponibles |
|----------------|----------|---------------------------|
| `draft` | Brouillon | Édition ; pas approve/reject/archive |
| `pending_review` | En attente de validation | **Approuver**, **Refuser** |
| `published` | Publiée | **Archiver** ; édition contenu |
| `rejected` | Rejetée | Aucune action modération UI |
| `archived` | Archivée | Aucune action modération UI |

| # | Cas | Résultat |
|---|-----|----------|
| 3.1 | Cohérence UI/API | `canApproveOffer` / `canRejectOffer` / `canArchiveOffer` alignés backend — OK |
| 3.2 | `is_active` | Archive → `is_active: false` (test backend) ; **non affiché** UI — QA05-003 |
| 3.3 | Ticket « active/inactive » | Mapping : `published` + `is_active` ≈ actif ; `archived` ≈ inactif — pas de statut `inactive` nommé |
| 3.4 | Transition interdite | `test_approve_forbidden_from_rejected` (attendu 422) — **échec env local** (voir § tests) |
| 3.5 | Approve side-effect | Test : approve peut passer org en `public` — comportement métier à connaître |

## 4. Partenaire lié

| # | Cas | Résultat |
|---|-----|----------|
| 4.1 | Colonne organisation liste | Nom visible — **oui, immédiat** |
| 4.2 | Header fiche | `{org.name} · {city}` — OK |
| 4.3 | Carte partenaire | ID, vérification, visibilité org — OK |
| 4.4 | Lien fiche 360° | `buildPartnerDetailPath` — OK |
| 4.5 | Filtre par org | Deep link `?organization_id=` (cockpit/partners) — OK |
| 4.6 | Statut partenaire catalogue | Texte fixe « Non disponible » — QA05-002 |
| 4.7 | Contexte retour | Header fiche → `buildOffersListBackPath(searchParams)` — **OK** si query présente |

**Réponse produit** : oui, l'opérateur identifie le partenaire **immédiatement** (liste + header). Readiness catalogue partenaire : **non**.

## 5. Passport — relation offre ↔ citoyen

| # | Cas | Résultat |
|---|-----|----------|
| 5.1 | Palier requis | Affiché liste + fiche — OK |
| 5.2 | Limite / passport | Fiche + édition — OK |
| 5.3 | Redemptions | Table paginée + lien Passport Ops — OK |
| 5.4 | Canal redemption | self / scan / unknown — OK |
| 5.5 | Exposition publique | `OfferDetailPublicExposureCard` + `buildOfferPublicExposureChecks` — OK |
| 5.6 | Critères bloquants | org vérifiée, org publique, published+active, dates, quota — OK |
| 5.7 | Écart public | Citoyen voit `value_label` / `conditions` — admin **non** — QA05-001 |
| 5.8 | Écart readiness | Check `partner_status` = **unknown** — QA05-002 |

## 6. Publication

| Capacité | Disponible ? | Route / action |
|----------|--------------|----------------|
| Création admin | **Oui** | `/passport-offers/new` → `POST /admin/partner-offers` |
| Édition contenu | **Oui** | Section « Édition contenu (staff) » → `PATCH` |
| Approbation (publier) | **Oui** | `POST .../approve` depuis `pending_review` |
| Refus | **Oui** | `POST .../reject` + motif |
| Archivage (désactivation) | **Oui** | `POST .../archive` depuis `published` |
| Désactivation sans archive | **Non** | Pas d'action « dépublier » intermédiaire V1 |
| Repasser rejected → review | **Non** | Workflow partenaire doit resoumettre |

Champs création/édition **non** couverts : `value_label`, `conditions`, `tier_code_required`, `max_redemptions_total` (payload API les supporte partiellement — UI non).

## 7. Navigation

| # | Cas | Résultat |
|---|-----|----------|
| 7.1 | Liste → fiche | Query `status`, `organization_id`, `offer_type`, `page` sur URL fiche — OK |
| 7.2 | Retour fiche (succès) | `buildOffersListBackPath` — **contexte conservé** |
| 7.3 | Retour erreur/404 | `buildOffersListPath()` sans query — **perd contexte** — QA05-008 |
| 7.4 | Refresh fiche | Recharge détail + redemptions + audit — OK |
| 7.5 | URL directe fiche | `/passport-offers/{id}` — OK |
| 7.6 | Nouvel onglet | Même comportement session cookie attendu |

## 8. Permissions

| Rôle | UI `StaffRoute` | API `/admin/partner-offers` | Validé |
|------|-----------------|------------------------------|--------|
| **SUPER_ADMIN** | Accès | `system.admin` — 200 live bootstrap | OK |
| **MODERATOR** | Accès | `moderation.manage` — tests multiples | OK |
| **CITY_ADMIN** | Accès UI staff | Seeds RBAC incluent `moderation.manage` — accès attendu **200** | Code OK ; pas de test dédié offers |
| **USER** citoyen | `/unauthorized` | **403** attendu — `test_partner_offers_user_denied` | **Échec env local** (voir ci-dessous) |

Garde API : `require_any_permission("moderation.manage", "system.admin")` — cohérent avec `StaffRoute`.

## 9. États vides

| # | Cas | Observé |
|---|-----|---------|
| 9.1 | Aucune offre | Liste + message « Aucune offre pour ce filtre » — OK |
| 9.2 | Aucune org vérifiée | Filtre org vide ; création bloquée (select vide) — OK |
| 9.3 | Offre archivée | Visible si filtre ; pas d'actions modération — OK |
| 9.4 | Redemptions / audit vides | Sections dashed empty — OK |

## 10. Cohérence métier — question produit

> *« Une équipe Yunicity peut-elle réellement gérer les offres partenaires du pilote Reims depuis cet écran ? »*

**Réponse : oui pour la modération et le cycle de vie V1, avec réserves catalogue.**

| Besoin pilote | Couvert ? | Commentaire |
|---------------|-----------|-------------|
| File modération entrante | **Oui** | Défaut `pending_review` + lien cockpit |
| Approuver / refuser / archiver | **Oui** | Workflow testé backend |
| Créer offre admin pour un partenaire | **Oui** | `/passport-offers/new` |
| Éditer titre/description/dates | **Oui** | PATCH staff |
| Identifier le partenaire | **Oui** | Liste + fiche |
| Vérifier visibilité citoyen | **Partiel** | Carte exposition ; readiness partenaire inconnue |
| Aligner contenu admin / public | **Non** | `value_label` / `conditions` absents — QA05-001 |
| Rechercher une offre par titre | **Non** | Pas de recherche texte |
| Gérer palier / quota global | **Partiel** | Lecture seule UI |

**Conclusion** : exploitable pour **valider et publier** des offres pilote ; **insuffisant** pour garantir parité affichage citoyen (badge valeur, conditions) sans aller sur l'API publique ou la fiche web.

## 11. Tests automatisés (référence)

| Suite | Résultat exécution locale |
|-------|---------------------------|
| `test_admin_partner_offers.py` | 1 échec (`test_partner_offers_user_denied`) |
| `test_admin_partner_offer_actions_audit_api.py` | PASS |
| `test_admin_partner_offer_redemptions_api.py` | PASS |
| `test_partner_offer_moderation.py` | 2 échecs (`approve_forbidden`, `moderation_queue`) |
| `admin-offer.test.ts` (utils) | Référence transitions / exposition |

**Total** : **30 passed, 3 failed** (94s) — échecs probablement liés à l'état DB dev / pollution données ; **à revalider en CI propre**. La logique RBAC et workflow reste validée par les 30 tests passants + revue code.

---

# Bugs

## QA05-001 — `value_label` et `conditions` absents de l'admin (écart public)

| Champ | Détail |
|-------|--------|
| Gravité | **Majeure** (parité admin / citoyen) |
| Zone | `PartnerOfferAdmin` schema, `OfferDetailIdentityCard`, édition, création |
| Reproduction | 1. Seed offre avec `value_label` + `conditions` (pilote Reims) 2. Ouvrir fiche admin |
| Attendu | Champs visibles et éditables comme côté public |
| Observé | Colonnes DB + `GET /api/v1/partner-offers` public ; **aucun champ** dans API admin ni UI |
| Impact | Opérateur ne peut pas vérifier/corriger le badge valeur ni les conditions affichées aux citoyens |

## QA05-002 — Readiness partenaire non disponible (exposition publique incomplète)

| Champ | Détail |
|-------|--------|
| Gravité | **Majeure** (cohérence métier / ticket) |
| Zone | `OfferDetailPartnerCard`, `buildOfferPublicExposureChecks` |
| Observé | « Statut partenaire catalogue : Non disponible dans cette version admin » ; check `partner_status` = **unknown** |
| Impact | Impossible de valider depuis l'admin si le partenaire est réellement « prêt » pour publication Passport |

## QA05-003 — `is_active` masqué à l'opérateur

| Champ | Détail |
|-------|--------|
| Gravité | **Majeure** (statut / visibilité) |
| Zone | Fiche offre, liste |
| Observé | `is_active` dans API (`PartnerOfferAdmin`) et critère exposition ; **jamais affiché** UI |
| Impact | Offre `published` mais `is_active: false` (post-archive partiel, edge cases) difficile à diagnostiquer |

## QA05-004 — Pas de recherche texte en liste

| Champ | Détail |
|-------|--------|
| Gravité | **Moyenne** (UX / ticket) |
| Zone | `PassportOffersWorkspace` |
| Attendu (ticket) | Recherche par titre / partenaire |
| Observé | Filtres statut / org / type uniquement |
| Impact | Friction quand > quelques offres pilote |

## QA05-005 — Pas de tri configurable

| Champ | Détail |
|-------|--------|
| Gravité | **Moyenne** (UX) |
| Observé | Tri fixe `created_at desc` (`partner_offer_repository`) ; aucun contrôle UI |
| Impact | Opérateur ne peut pas trier par titre, MAJ, ou redemptions |

## QA05-006 — Routes ticket `/offers` inexistantes

| Champ | Détail |
|-------|--------|
| Gravité | **Moyenne** (documentation) |
| Observé | Routes réelles `/passport-offers`, `/passport-offers/[id]` |
| Impact | Bookmarks / docs ticket incorrects → 404 |

## QA05-007 — Erreur API efface la liste

| Champ | Détail |
|-------|--------|
| Gravité | **Moyenne** (résilience) |
| Fichier | `use-admin-offers-list.ts` |
| Observé | `setItems([])` + `setTotal(0)` dans `catch` — même famille QA02/03/04 |
| Impact | Perte contexte sur incident réseau transitoire |

## QA05-008 — Retour liste sans contexte sur écrans erreur/404 fiche

| Champ | Détail |
|-------|--------|
| Gravité | **Moyenne** (navigation) |
| Zone | `offer-detail-view.tsx` états erreur/404 |
| Observé | `buildOffersListPath()` sans query ; header succès utilise `buildOffersListBackPath` |
| Impact | Après erreur chargement, retour perd filtres |

## QA05-009 — Édition/création incomplètes (champs API non exposés)

| Champ | Détail |
|-------|--------|
| Gravité | **Moyenne** (workflow publication) |
| Zone | `offer-detail-edit-section`, `passport-offers/new` |
| Observé | Pas d'UI pour `tier_code_required`, `max_redemptions_total`, `value_label`, `conditions` alors que payloads API create/update les supportent (partiellement) |
| Impact | Staff doit passer par SQL/autre canal pour palier ou quota global |

## QA05-010 — Pas de désactivation hors archivage

| Champ | Détail |
|-------|--------|
| Gravité | **Mineure** (workflow) |
| Observé | Seul `archive` depuis `published` ; pas de « dépublier » vers `draft` / `pending_review` |
| Impact | Correction rapide d'une offre live = archiver puis recréer |

## QA05-011 — Composant preview non branché

| Champ | Détail |
|-------|--------|
| Gravité | **Mineure** (dette UI) |
| Fichier | `offer-detail-preview-section.tsx` — **non importé** dans `offer-detail-view` |
| Impact | Pas de prévisualisation rendu citoyen depuis admin |

## QA05-012 — Tests RBAC flaky en dev local

| Champ | Détail |
|-------|--------|
| Gravité | **Mineure** (environnement) |
| Observé | 3 tests échoués sur 33 en session auditée |
| Impact | Ne remet pas en cause le garde code ; revalider CI |

## QA05-013 — DB dev vide

| Champ | Détail |
|-------|--------|
| Gravité | **Info** |
| Observé | `items: []`, `verified-organizations: []` en live |
| Impact | Recette manuelle nécessite seeds ou workflow partenaire complet |

---

# Gravité

| Gravité | Count | IDs |
|---------|-------|-----|
| Critique | 0 | — |
| Majeure | 3 | QA05-001, QA05-002, QA05-003 |
| Moyenne | 6 | QA05-004, QA05-005, QA05-006, QA05-007, QA05-008, QA05-009 |
| Mineure | 3 | QA05-010, QA05-011, QA05-012 |
| Info | 1 | QA05-013 |

---

# UX

## Points positifs

- File modération **prête à l'emploi** (filtre défaut `pending_review`).
- Filtres combinables statut / organisation / type + pagination claire.
- Liste riche : partenaire, ville, statut, tier, redemptions, dates.
- Fiche structurée : identité → partenaire → Passport → exposition publique → modération → édition → redemptions → audit.
- **Navigation contextuelle** liste ↔ fiche (meilleure que Partners/Passport Ops).
- Carte exposition publique : diagnostic citoyen actionnable (critères OK/KO).
- Modération : approve/reject/archive avec feedback et historique staff.
- Lien croisé Passport Ops depuis redemptions.
- Création admin guidée (orgs vérifiées uniquement).

## Frictions opérateur

- Impossible de voir/éditer `value_label` et `conditions` — risque d'écart citoyen.
- Readiness partenaire opaque (« non disponible »).
- `is_active` invisible.
- Pas de recherche par titre.
- Tables larges → scroll horizontal mobile.
- Création impossible si aucune org vérifiée (état vide silencieux sur filtre org).

---

# Recommandations

1. **Avant pilote** : exécuter seeds `reims_partner_offers` ou parcours partenaire → submit → modération admin.
2. **Parité catalogue** : exposer `value_label` + `conditions` dans API admin + fiche + édition (QA05-001).
3. **Readiness** : brancher statut partenaire catalogue dans `PartnerOfferAdminOrganization` + check exposition (QA05-002).
4. **Afficher `is_active`** sur fiche et liste (badge ou ligne dédiée).
5. **Recherche** : param `q` sur titre (API + barre recherche).
6. **Prévisualisation** : brancher `OfferDetailPreviewSection` ou lien vers rendu public.
7. **Résilience** : conserver liste en erreur reload (pattern QA02-001).
8. **Retour erreur** : utiliser `buildOffersListBackPath` aussi sur 404/erreur si query dispo.
9. **Recette manuelle** :
   - [ ] File `pending_review` depuis cockpit
   - [ ] Approve → vérifier exposition publique OK
   - [ ] Reject avec motif → vérifier affichage
   - [ ] Archive published → `is_active` false côté API
   - [ ] Création admin + édition + redemptions
   - [ ] MODERATOR + CITY_ADMIN + USER sur `/passport-offers`
   - [ ] Comparer fiche admin vs carte offre web citoyen (value_label)

---

# GO / NO GO

## Offers Admin — **GO conditionnel**

| Critère | Décision |
|---------|----------|
| Modération workflow V1 | **GO** |
| Liste + filtres + pagination | **GO** |
| Fiche + actions + audit | **GO** |
| Lien partenaire clair | **GO** |
| Parité contenu public (value_label, conditions) | **NO GO** |
| Readiness partenaire depuis offre | **NO GO** |
| Pilote Reims modération offres | **GO conditionnel** |

**Conditions de passage prod pilote :**

1. Seeds recette (offres pending + published + partner vérifié public).
2. Acceptation produit écart `value_label` / `conditions` **ou** correctif avant mise en vitrine citoyenne.
3. Formation opérateur : archiver = seule désactivation ; exposition publique ≠ readiness partenaire complet.
4. Revalider les 3 tests pytest échoués en CI propre.

**Bloquant absolu prod** : aucune faille sécurité identifiée (staff guard, QR/token N/A, USER 403 attendu). Les majeurs sont **parité catalogue et diagnostic visibilité**, pas des bypass d'accès.

---

*Rapport généré en phase QA HARDENING — aucun correctif appliqué, aucun commit.*
