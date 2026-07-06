# QA-04 — Passport Operations Validation

**Ticket** : QA-04  
**Feature** : FEATURE-ADMIN-V1  
**Phase** : QA HARDENING  
**Date** : 2026-06-05  
**Routes auditées** : `/passport-ops`, `/passport-ops/[id]`  
**Méthode** : revue statique + API live + tests d'intégration existants — **aucune modification produit**

---

# Résumé

Le module **Passport Ops** est **fonctionnel et bien structuré** pour la supervision V1 : liste avec recherche multi-mode, pagination, fiche détail riche (identité, QR staff masqué, stats, tampons, redemptions, historique staff), actions suspendre/réactiver avec audit `passport_admin_actions`, protection `StaffRoute` + garde API `moderation.manage` / `system.admin`.

Pour une **équipe opérations pilote**, l'exploitabilité est **bonne sur le cœur métier** (trouver un citoyen, inspecter son activité, suspendre/réactiver), avec des **écarts importants** sur le périmètre ticket :

- **Badges citoyen** : absents de l'admin (existants uniquement côté web citoyen, dérivés).
- **QR claims** : pas d'historique dédié ; proxy partiel via tampons `source = qr`.
- **Passports révoqués** : invisibles en liste + affichés comme « Suspendu » en fiche avec action « Réactiver » **cassée**.

Sur DB dev locale (quasi vide), les APIs répondent **200 avec listes vides** — parcours E2E complet nécessite **seeds pilote**.

| Verdict zone | Résultat |
|--------------|----------|
| Liste / recherche / pagination | PASS avec réserves |
| Fiche passport | PASS structure ; bug statut révoqué |
| Claims QR | **Partiel** — tampons seulement |
| Badges | **Non implémenté** admin |
| Tampons / compteurs | PASS (tests backend) |
| Navigation | PASS avec perte contexte retour |
| Permissions RBAC | PASS API ; PASS UI `StaffRoute` |
| Exploitabilité opérateur | **GO conditionnel** |

---

# Cas testés

## 1. Liste Passport Ops — `/passport-ops`

| # | Cas | Méthode | Résultat |
|---|-----|---------|----------|
| 1.1 | Protection staff | `passport-ops/layout.tsx` | `StaffRoute` — OK |
| 1.2 | Chargement initial | `useAdminPassportsList` | « Chargement des Passports… » |
| 1.3 | Erreur liste | Revue hook | Bandeau rose + Réessayer ; `setItems([])` — voir QA04-008 |
| 1.4 | API live liste | `GET /admin/passports?city=Reims` | **200** — `total: 0` |
| 1.5 | Pagination UI | `PassportOpsPagination` | Précédent/Suivant, « Affichage X–Y sur Z » — OK |
| 1.6 | Page size | `PASSPORT_OPS_DEFAULT_PAGE_SIZE = 20` | Aligné API |
| 1.7 | Filtres statut | Chips Tous / Actifs / Suspendus | `replaceState` URL `?status=` — OK |
| 1.8 | Recherche email | Tests `test_search_email_case_insensitive` | **PASS** |
| 1.9 | Recherche numéro | `test_search_passport_number_exact` | **PASS** |
| 1.10 | Recherche nom (≥2) | `test_search_display_name_min_two_chars` | **PASS** |
| 1.11 | Recherche fragment QR | `test_search_qr_fragment_min_twelve_chars` | **PASS** (mode explicite) |
| 1.12 | Recherche auto invalide | API live `q=x` | **422** `INVALID_PASSPORT_SEARCH` |
| 1.13 | Recherche auto QR | Revue `_resolve_search_mode` | **Non** — QR requiert `search_mode=qr_fragment` |
| 1.14 | QR jamais en liste | `test_list_never_exposes_qr_token` | **PASS** sécurité |
| 1.15 | État vide sans recherche | `PassportOpsList` | Message guidé ville/filtres — OK |
| 1.16 | État vide avec recherche | `hasSearchQuery` | Message critères recherche — OK |
| 1.17 | KPI strip | `PassportOpsKpiStrip` | **Écart libellé** — voir QA04-005 |
| 1.18 | Lien scanner | Header → `/partner-scan` | OK |

## 2. Fiche Passport — `/passport-ops/[id]`

| # | Cas | Méthode | Résultat |
|---|-----|---------|----------|
| 2.1 | Chargement | `PartnerDetailView` pattern | État loading dédié |
| 2.2 | 404 | API + UI | **404** `PASSPORT_NOT_FOUND` → écran dédié |
| 2.3 | Identité | `PassportDetailIdentityCard` | nom, email, compte actif, palier, dates |
| 2.4 | Header | `passport_number` + badge statut + ville | OK |
| 2.5 | QR staff | `PassportDetailQrCard` | Masqué par défaut, reveal + copie — OK |
| 2.6 | Token en détail only | `test_detail_includes_qr_token` | **PASS** |
| 2.7 | Stats | tampons / redemptions / validées | OK |
| 2.8 | Actions suspendre | `canSuspendPassport("active")` + dialog motif ≥3 | OK + audit |
| 2.9 | Actions réactiver | `canReactivatePassport("suspended")` | OK si vrai `suspended` |
| 2.10 | Refresh global | `handleRefresh` | Recharge détail + tampons + redemptions + audit — OK |
| 2.11 | API live 404 | UUID aléatoire | **404** `PASSPORT_NOT_FOUND` |
| 2.12 | Données live complètes | DB dev vide | **Non exécuté** E2E browser |

## 3. Claims QR

| # | Cas | Résultat |
|---|-----|----------|
| 3.1 | Section « Claims QR » dédiée | **Absente** — hors scope implémentation V1 |
| 3.2 | Proxy tampons `stamp_source = qr` | Colonne Source « QR » (`passportStampSourceLabel`) — OK |
| 3.3 | Tampons `organization` | Source « Partenaire » (scan QR citoyen par partenaire) — OK |
| 3.4 | Historique claim citoyen | API citoyen `POST /passport/stamps/claim` — **pas exposé admin** |
| 3.5 | Traçabilité `already_claimed` | **Non visible** opérateur — seul tampon final en DB |
| 3.6 | Recherche par fragment QR | Mode avancé `qr_fragment` (≥12 chars) — OK |
| 3.7 | Cohérence stamp ↔ claim | Un tampon QR = un claim réussi ; pas de doublon UI | OK logique MVP |

## 4. Badges

| # | Cas | Résultat |
|---|-----|----------|
| 4.1 | Affichage badges fiche | **Absent** — pas dans `AdminPassportDetailResponse` |
| 4.2 | Calcul badges | Côté web citoyen (`PassportDerivedBadge`) — **hors admin** |
| 4.3 | Table `passport_badges` | Prévu PRD — **non branché** Passport Ops V1 |
| 4.4 | État vide badges | N/A admin |

> Le ticket mentionne « badges » — en admin V1, seul `PassportStatusBadge` (statut actif/suspendu) existe.

## 5. Tampons

| # | Cas | Résultat |
|---|-----|----------|
| 5.1 | Section tampons | Table paginée + lien fiche partenaire — OK |
| 5.2 | Compteur liste | `stamps_count` par ligne — OK |
| 5.3 | Compteur fiche | `stats.stamps_total` — OK |
| 5.4 | Pagination sous-ressource | `useAdminPassportStamps` page_size 20 — OK |
| 5.5 | État vide | « Aucun tampon enregistré » — OK |
| 5.6 | Tests backend | `test_list_stamps_*` dans `test_admin_passports_api.py` | **PASS** |
| 5.7 | Cohérence compteurs | Tests intégration fixtures | **PASS** |

## 6. Navigation

| # | Cas | Résultat |
|---|-----|----------|
| 6.1 | Liste → fiche | `buildPassportOpsDetailPath(id)` | OK |
| 6.2 | Retour fiche → liste | `buildPassportOpsListPath()` sans query | **Perd** filtres/recherche/page — QA04-007 |
| 6.3 | Refresh bouton fiche | Re-fetch multi-endpoints | OK |
| 6.4 | Refresh navigateur | Route client + session cookie | Attendu OK (QA-01) |
| 6.5 | URL directe fiche | `/passport-ops/{uuid}` | OK si passport existe |
| 6.6 | URL recherche deep link | `/passport-ops?q=email@x.com&status=active&page=2` | Parsing `parsePassportOpsSearchParams` — OK |
| 6.7 | Sidebar | `AdminShell` lien Passport Ops actif sur sous-routes | OK |

## 7. Permissions

| Rôle | UI (`StaffRoute`) | API (`_staff_guard`) | Validé |
|------|-------------------|----------------------|--------|
| **SUPER_ADMIN** / bootstrap (`system.admin`) | Accès | 200 liste/détail/actions | Live login bootstrap **200** |
| **MODERATOR** (`moderation.manage`) | Accès | 200 — `test_moderator_can_list_passports` | **PASS** (37 tests) |
| **USER** citoyen | Redirection `/unauthorized` | **403** — `test_regular_user_denied_list` | **PASS** |
| **USER** patch status | N/A | **403** — `test_regular_user_denied_patch` | **PASS** |
| **Partner user** sans staff | N/A | **403** — `test_partner_user_without_staff_denied` | **PASS** |

Aucune élévation de privilège constatée.

## 8. États vides

| # | Cas | Observé |
|---|-----|---------|
| 8.1 | Aucun passport (DB dev) | Liste vide + message — OK |
| 8.2 | Aucun tampon | Section dashed empty — OK |
| 8.3 | Aucune redemption | Section dashed empty — OK |
| 8.4 | Aucune action staff | « Aucune action staff enregistrée » — OK |
| 8.5 | Recherche sans résultat | Message critères — OK |

## 9. Cohérence métier — question produit

> *« Un opérateur Yunicity peut-il réellement gérer un citoyen Passport depuis cette interface ? »*

**Réponse : oui pour le cœur V1, avec limites.**

| Besoin opérateur | Couvert ? | Commentaire |
|------------------|-----------|-------------|
| Trouver un citoyen (email, n°, nom, QR fragment) | **Oui** | Recherche avancée ; auto mode sans QR |
| Voir identité + palier + dates | **Oui** | Fiche complète |
| Voir / copier QR staff (investigation) | **Oui** | Masquage + reveal |
| Suspendre / réactiver avec motif | **Oui** | Audit staff tracé |
| Voir tampons (dont claims QR) | **Oui** | Source QR vs Partenaire |
| Voir redemptions + liens offre/partenaire | **Oui** | Table paginée |
| Voir historique actions staff | **Oui** | Suspend / reactivate uniquement |
| Voir badges citoyen | **Non** | Hors admin V1 |
| Historique détaillé claims QR | **Non** | Tampon final seulement |
| Gérer passport révoqué | **Non** | Invisible liste + UI trompeuse |
| Scanner terrain depuis fiche | **Partiel** | Lien header vers `/partner-scan` |

**Conclusion opérateur** : pour modération quotidienne (recherche → inspection → suspension), l'interface est **exploitable**. Pour investigation complète (badges, timeline claims, révoqués), des **compléments** sont nécessaires.

## 10. Tests automatisés (référence)

| Suite | Résultat |
|-------|----------|
| `test_admin_passports_api.py` | Lecture liste, recherche, détail, tampons, redemptions |
| `test_admin_passport_actions_api.py` | Suspend, reactivate, audit, validations, revoked |
| `admin-passport.test.ts` (frontend utils) | Labels, paths, QR mask, action gates |

**Total exécuté** : **37 passed** (backend intégration).

---

# Bugs

## QA04-001 — Passport révoqué affiché « Suspendu » avec bouton Réactiver cassé

| Champ | Détail |
|-------|--------|
| Gravité | **Majeure** (erreur métier / action bloquante) |
| Zone | `admin_passport_service._staff_status` + `PassportDetailActionsSection` |
| Reproduction | 1. Passport DB `status = revoked` 2. Ouvrir fiche `/passport-ops/{id}` 3. Cliquer « Réactiver » |
| Attendu | Statut « Révoqué » + actions désactivées (comme `canModifyPassportStatus` false) |
| Observé | API renvoie `status: "suspended"` → badge « Suspendu » + bouton Réactiver → **422** `PASSPORT_STATUS_NOT_MUTABLE` |
| Référence test | `test_patch_revoked_passport_in_db_rejected` — backend OK, **UI incohérente** |
| Impact | Opérateur croit pouvoir réactiver un citoyen définitivement révoqué |

## QA04-002 — Passports révoqués invisibles en liste et recherche

| Champ | Détail |
|-------|--------|
| Gravité | **Majeure** (trou opérationnel) |
| Zone | `admin_passport_repository._apply_status_filter`, `count_by_passport_number` |
| Reproduction | Passport `revoked` en DB → liste Reims / recherche par numéro |
| Attendu | Visible avec statut distinct ou filtre dédié |
| Observé | Liste filtre `ACTIVE` + `SUSPENDED` uniquement ; recherche auto exclut révoqués |
| Impact | Citoyen révoqué **introuvable** sauf URL directe si `passport_id` connu |

## QA04-003 — Badges citoyen absents de Passport Ops

| Champ | Détail |
|-------|--------|
| Gravité | **Majeure** (écart périmètre ticket / produit) |
| Zone | Schéma `AdminPassportDetailResponse`, UI fiche |
| Observé | Badges dérivés existent web citoyen ; **aucune surface admin** |
| Impact | Opérateur ne peut pas valider progression / récompenses citoyen depuis admin |

## QA04-004 — Pas d'historique dédié QR claims (traçabilité partielle)

| Champ | Détail |
|-------|--------|
| Gravité | **Majeure** (traçabilité ops) |
| Zone | Passport Ops vs `PassportStampClaimService` |
| Observé | Claims citoyen (`POST /passport/stamps/claim`) non journalisés côté admin ; tampons `source=qr` = résultat final seulement |
| Impact | Pas de visibilité sur tentatives `already_claimed`, horodatage claim vs création tampon, acteur |

## QA04-005 — KPI strip : libellé « page courante » affiche le total global

| Champ | Détail |
|-------|--------|
| Gravité | **Moyenne** (UX / confiance données) |
| Fichier | `passport-ops-kpi-strip.tsx` L28-30 |
| Observé | Sans recherche : label « Passports (page courante) » mais valeur = `response.total` (tous résultats) |
| Impact | Opérateur peut croire que le KPI = lignes affichées alors que c'est le total filtré |

## QA04-006 — Placeholder recherche mentionne QR mais mode auto ne le supporte pas

| Champ | Détail |
|-------|--------|
| Gravité | **Moyenne** (UX) |
| Zone | `PassportOpsSearchBar` + `_resolve_search_mode` |
| Reproduction | Saisir fragment QR ≥12 chars en mode Automatique |
| Observé | Auto résout email → n° → nom ; **pas** `qr_fragment` |
| Impact | Recherche QR échoue ou retourne mauvais résultats sans mode avancé |

## QA04-007 — Retour fiche perd contexte liste (filtres, recherche, page)

| Champ | Détail |
|-------|--------|
| Gravité | **Moyenne** (navigation) |
| Zone | `PassportDetailHeader`, états erreur/404 |
| Observé | `buildPassportOpsListPath()` sans query params |
| Impact | Perte du contexte après inspection d'un citoyen |

## QA04-008 — Erreur API efface la liste (pattern cockpit/partners)

| Champ | Détail |
|-------|--------|
| Gravité | **Moyenne** (résilience) |
| Fichier | `use-admin-passports-list.ts` L51-52 |
| Observé | `setItems([])` + `setTotal(0)` dans `catch` |
| Impact | Incident réseau transitoire → perte contexte liste |

## QA04-009 — Ville pilote hardcodée « Reims »

| Champ | Détail |
|-------|--------|
| Gravité | **Mineure** (V1 acceptable) |
| Observé | `DEFAULT_PASSPORT_OPS_CITY` ; API accepte `?city=` mais pas de sélecteur UI |
| Impact | Pas d'extension multi-ville depuis l'interface |

## QA04-010 — Historique staff limité aux transitions suspend/reactivate

| Champ | Détail |
|-------|--------|
| Gravité | **Mineure** (attente ticket élargie) |
| Observé | `passport_admin_actions` — pas d'actions citoyen (claims, scans) |
| Impact | « Historique » incomplet pour investigation fraude |

## QA04-011 — DB dev vide : validation E2E limitée

| Champ | Détail |
|-------|--------|
| Gravité | **Info** (environnement) |
| Observé | Liste live `total: 0` ; parcours clic-à-clic non exécuté en browser |
| Impact | Recette pilote nécessite seeds citoyens + tampons + redemptions |

---

# Gravité

| Gravité | Count | IDs |
|---------|-------|-----|
| Critique | 0 | — |
| Majeure | 4 | QA04-001, QA04-002, QA04-003, QA04-004 |
| Moyenne | 4 | QA04-005, QA04-006, QA04-007, QA04-008 |
| Mineure | 2 | QA04-009, QA04-010 |
| Info | 1 | QA04-011 |

---

# UX

## Points positifs

- Workspace clair : header + KPI + recherche + liste + pagination.
- Recherche avancée explicite (email, n°, nom, fragment QR).
- Filtres statut en chips rapides (Tous / Actifs / Suspendus).
- Fiche détail complète et hiérarchisée (identité → QR → stats → tampons → redemptions → audit).
- QR staff : masquage par défaut, reveal explicite, avertissement modération — bonne hygiène PII.
- Actions suspendre/réactiver : dialog motif validé (≥3 chars), feedback succès, reload audit auto.
- États vides contextualisés (recherche vs liste).
- Tables paginées sur tampons, redemptions, audit.
- Liens croisés : fiche partenaire, offre admin depuis redemptions.
- Lien rapide vers Scanner Passport (`/partner-scan`).

## Frictions opérateur

- KPI strip libellé ambigu (total vs page).
- Recherche QR nécessite mode avancé non évident depuis le placeholder.
- Retour liste sans mémoire de contexte.
- Passport révoqué : statut et actions trompeurs.
- Pas de badges ni timeline claims : investigation incomplète depuis un seul écran.
- Tables larges → scroll horizontal mobile (acceptable V1).

---

# Recommandations

1. **Avant pilote** : seed Reims (3–5 passports, tampons QR + organization, redemptions, 1 suspendu) pour recette manuelle.
2. **Révoqués** : exposer statut `revoked` distinct dans API/UI ; désactiver actions ; décider visibilité liste.
3. **KPI** : corriger libellé → « Passports correspondants » ou afficher `items.length` + total.
4. **Recherche QR** : auto-détecter fragment ≥12 chars en mode auto, ou retirer « fragment QR » du placeholder.
5. **Navigation** : retour fiche avec query params préservés (`buildPassportOpsListPath(state)`).
6. **Badges** (hors V1 ou ticket suivant) : endpoint admin read-only `passport_badges` + section fiche.
7. **Claims QR** : journal admin optionnel (claim events) ou enrichir tampons (metadata claim).
8. **Résilience** : conserver données liste en erreur reload (alignement QA02-001 / QA03-008).
9. **Recette manuelle restante** :
   - [ ] Recherche email / n° / nom / QR fragment
   - [ ] Suspendre → vérifier audit → réactiver
   - [ ] Refresh navigateur fiche + URL directe
   - [ ] USER tente `/passport-ops` → `/unauthorized`
   - [ ] Copier QR staff + scanner `/partner-scan`
   - [ ] Responsive tablette (liste + fiche)

---

# GO / NO GO

## Passport Ops — **GO conditionnel**

| Critère | Décision |
|---------|----------|
| Structure + RBAC | **GO** |
| Recherche + liste + pagination | **GO** |
| Fiche détail (identité, QR, tampons, redemptions) | **GO** (avec seeds) |
| Actions suspendre / réactiver + audit | **GO** |
| Gestion passports révoqués | **NO GO** — bugs QA04-001/002 |
| Badges + historique claims (attente ticket) | **NO GO** — non livré V1 |
| Pilote Reims exploitable quotidien | **GO conditionnel** |

**Conditions de passage prod pilote :**

1. Seeds recette validés (citoyens actifs + suspendus, tampons, redemptions).
2. Formation opérateur : recherche QR = mode avancé ; tampons QR = proxy claims.
3. Acceptation produit : badges et timeline claims hors scope V1, ou ticket follow-up.
4. Documenter comportement révoqués (invisibles + ne pas utiliser Réactiver) jusqu'à correctif.

**Bloquant absolu prod** : aucun bug critique sécurité (QR non exposé en liste, staff guard API, `StaffRoute` UI). Les majeurs sont **cohérence métier révoqués** et **écarts périmètre** (badges/claims), pas des failles d'accès.

---

*Rapport généré en phase QA HARDENING — aucun correctif appliqué, aucun commit.*
