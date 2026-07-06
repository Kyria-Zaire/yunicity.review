# QA-03 — Partners Admin Validation

**Ticket** : QA-03  
**Feature** : FEATURE-ADMIN-V1  
**Phase** : QA HARDENING  
**Date** : 2026-06-05  
**Routes auditées** : `/partners`, `/partners/organizations/[organizationId]` (+ onglets workspace, `/partner-leads` lié)  
**Méthode** : revue statique + API live + tests d'intégration existants — **aucune modification produit**

> **Note périmètre ticket** : le ticket mentionne `/partners/[id]`. En code, la fiche 360° est exposée sous **`/partners/organizations/[organizationId]`** (`adminPartnerDetailPath`). Aucune route `/partners/[id]` n'existe.

---

# Résumé

Le workspace **Partenaires** est **structurellement riche** : quatre onglets (Leads, Partenaires, Vérifications, Activation), fiche admin 360° avec actions métier (créer profil, activer, pause, premium), compteurs opérationnels, liens admin/public, et protection `StaffRoute`.

Pour une **équipe terrain pilote**, l'exploitabilité est **partielle** :

- Le **CRM leads** et la **file de vérification** sont utilisables (filtres, pagination vérifications, actions review).
- L'onglet **Partenaires** ne liste que le **catalogue public** (`GET /api/v1/partners`) — les partenaires `signed` / privés sont **absents** (dette ADMIN-02D documentée en UI).
- La **readiness** et le **QR** ne sont pas sur la fiche 360° : ils vivent dans l'onglet **Activation** (vagues + checklist manuelle).
- Plusieurs **liens contextuels** depuis la fiche sont incomplets (creator content sans filtre org ; pas de lien événements admin).

Sur DB dev locale (quasi vide), les APIs répondent **200 avec listes vides** — validation fonctionnelle complète impossible sans **seeds pilote**.

| Verdict zone | Résultat |
|--------------|----------|
| Chargement / états | PASS avec réserve (effacement données en erreur) |
| Liste partenaires (onglet) | **Écart majeur** — périmètre public uniquement |
| Fiche 360° | PASS structure ; liens partiels |
| Readiness / QR | PASS onglet Activation ; **absent fiche** |
| Offres / contenus / events (compteurs) | PASS backend tests ; liens admin partiels |
| Navigation | PASS avec réserves (retour sans onglet, route URL ticket) |
| Responsive | PASS statique (tables scroll horizontal) |
| Exploitabilité opérateur terrain | **GO conditionnel** |

---

# Cas testés

## 1. Chargement liste — workspace `/partners`

| # | Cas | Méthode | Résultat |
|---|-----|---------|----------|
| 1.1 | Protection staff | Revue `partners/layout.tsx` | `StaffRoute` — OK |
| 1.2 | Onglet par défaut | `parsePartnersWorkspaceTab` | **`leads`** si `?tab` absent |
| 1.3 | Deep link onglets | `?tab=leads\|partners\|verification\|activation` | Parsing OK (`partners-workspace.tsx`) |
| 1.4 | Loading leads | `PartnerLeadsList` | Texte « Chargement des leads… » |
| 1.5 | Erreur leads | Revue hook inline | Bandeau rose + Réessayer |
| 1.6 | API live leads | `GET /api/v1/partner-leads?page=1&page_size=5` | **200** — `total: 0` |
| 1.7 | Pagination leads | Revue code | **Fixe** `page: 1`, `page_size: 100` — pas de UI pagination |
| 1.8 | Recherche leads | Revue code | Client-side sur max 100 lignes chargées — documenté en UI |
| 1.9 | Filtres leads | statut / source / ville API | Re-fetch API — OK |
| 1.10 | Loading onglet Partenaires | `usePublicPartnersList` | « Chargement des partenaires… » |
| 1.11 | Erreur onglet Partenaires | `use-public-partners-list.ts` | `setItems([])` + message — voir QA03-008 |
| 1.12 | API live catalogue | `GET /api/v1/partners?city=Reims&limit=100` | **200** — `total: 0` |
| 1.13 | Pagination catalogue | Revue code | **Aucune** — offset fixe 0, limit 100 |
| 1.14 | Recherche / filtres catalogue | Revue `PartnersDirectoryTab` | **Absents** (hors périmètre API publique) |
| 1.15 | Bannière périmètre | UI amber | Documente exclusion signed/privés — OK transparence |
| 1.16 | Loading vérifications | `useAdminOrganizationsList` | OK + pagination page_size 20 |
| 1.17 | API live orgs | `GET /api/v1/admin/organizations?city=Reims` | **200** — `total: 0` |
| 1.18 | Loading activation | `useAdminActivationWaves` | OK |
| 1.19 | API live waves | `GET /api/v1/admin/activation-waves?city=Reims` | **200** — `[]` |

## 2. Fiche partenaire — `/partners/organizations/[organizationId]`

| # | Cas | Méthode | Résultat |
|---|-----|---------|----------|
| 2.1 | Chargement initial | `PartnerDetailView` | État loading dédié |
| 2.2 | 404 organisation | API + UI | **404** `ORGANIZATION_NOT_FOUND` → écran « Organisation introuvable » |
| 2.3 | Erreur réseau | Revue hook | Bandeau rose + Réessayer |
| 2.4 | Identité affichée | `PartnerDetailIdentityCard` | nom, slug, type, ville, visibilité, dates |
| 2.5 | Profil partenaire | `PartnerDetailProfileCard` | statut, slug, type partenariat, featured |
| 2.6 | Badges header | `PartnerDetailHeader` | vérification, visibilité, statut partenaire / sans profil |
| 2.7 | Actions métier | `PartnerDetailActionsSection` | conditionnelles via `capabilities` |
| 2.8 | Réglages catalogue | `PartnerDetailSettingsPanel` | visibilité, featured, libellé — si `can_update_settings` |
| 2.9 | Cohérence API | `test_admin_partner_detail_api.py` | **21 passed** (compteurs, liens, capabilities) |
| 2.10 | API live 404 | UUID aléatoire | **404** `ORGANIZATION_NOT_FOUND` |
| 2.11 | Données live complètes | DB dev vide | **Non exécuté** — aucune org seed |

## 3. Readiness

| # | Cas | Résultat |
|---|-----|----------|
| 3.1 | Panneau readiness fiche 360° | **Absent** — pas de composant readiness sur `PartnerDetailView` |
| 3.2 | Checklist activation | 5 clés : contact, assets, offre passport, **qr_ready**, go_public | OK onglet Activation |
| 3.3 | Calcul progression | `checklistCompletionPercentage` — 5 items, arrondi % | OK (`admin-activation-wave.test.ts`) |
| 3.4 | Candidat prêt | `isWaveReadyCandidate` — checklist 100 % + statut `candidate` | Surlignage ligne emerald |
| 3.5 | Cas vides (waves) | Liste vide + message « Aucun partenaire dans cette vague » | OK |
| 3.6 | Sync état réel métier | Revue | Checklist **manuelle** — pas de lien auto offre publiée / QR scanné |

## 4. QR Passport

| # | Cas | Résultat |
|---|-----|----------|
| 4.1 | Présence UI fiche | **Non** — QR uniquement via checkbox `qr_ready` (Activation) |
| 4.2 | Libellé | « QR prêt » (`ACTIVATION_WAVE_CHECKLIST_LABELS`) | OK |
| 4.3 | Cohérence état | Pas de lecture état passport / scan réel | **Gap produit** — case à cocher opérationnelle |
| 4.4 | Liens QR / scan | Fiche 360° | Pas de lien vers `/partner-scan` depuis fiche partenaire |

## 5. Offres

| # | Cas | Résultat |
|---|-----|----------|
| 5.1 | Compteurs fiche | total / en revue / publiées | OK UI + tests backend |
| 5.2 | Lien admin | `links.offers_admin` | `/passport-offers?organization_id={id}` — **OK** |
| 5.3 | Affichage liste offres | Hors fiche (workspace passport-offers) | Non testé browser ; filtre org supporté côté URL |
| 5.4 | Cohérence live | DB vide | Compteurs à 0 attendus |

## 6. Événements

| # | Cas | Résultat |
|---|-----|----------|
| 6.1 | Compteurs fiche | total / en revue | OK UI |
| 6.2 | Lien admin événements | `AdminPartnerLinks` | **Absent** — pas de `events_admin` dans schéma backend |
| 6.3 | Navigation modération events | Depuis fiche | Opérateur doit connaître `/events` et filtrer manuellement |
| 6.4 | Cohérence compteurs | Tests intégration | OK avec fixtures |

## 7. Creator Content

| # | Cas | Résultat |
|---|-----|----------|
| 7.1 | Compteurs fiche | total / en revue | OK |
| 7.2 | Lien admin | `links.creator_content_admin` | **`/creator-content` sans `organization_id`** |
| 7.3 | Support filtre org UI | `creator-content-url.ts` | `organization_id` **supporté** si présent dans URL |
| 7.4 | Test backend lien | `test_links_are_present` | Assert explicitement `/creator-content` sans filtre — comportement **intentionnel code actuel** mais **incohérent produit** |
| 7.5 | Cohérence compteurs | Tests intégration | OK |

## 8. Navigation

| # | Cas | Résultat |
|---|-----|----------|
| 8.1 | Retour fiche → workspace | Lien `← Retour aux partenaires` → `/partners` | OK mais **perd l'onglet actif** (retour toujours onglet Leads par défaut) |
| 8.2 | Refresh bouton fiche | `handleRefresh` → `reload()` | OK — re-fetch détail |
| 8.3 | Refresh navigateur fiche | Route client + `StaffRoute` | Comportement attendu OK (session cookie QA-01) |
| 8.4 | URL directe fiche valide | `/partners/organizations/{uuid}` | OK si org existe |
| 8.5 | URL ticket `/partners/[id]` | Glob routes admin | **404 Next.js** — route inexistante |
| 8.6 | Lien vérification depuis fiche | `verification_queue` | `/partners?tab=verification&organization_id={id}` + highlight row — OK |
| 8.7 | Fiche publique | `partnerPublicPlaceUrl` | `/places/{slug}?city=Reims` — nouvel onglet |
| 8.8 | Cockpit → leads | `/partners?tab=leads` (QA-02) | OK |

## 9. Responsive

| Breakpoint | Comportement code | Risque |
|------------|-------------------|--------|
| Desktop | `max-w-6xl` workspace, `max-w-5xl` fiche | Faible |
| Table / mobile | Tables `min-w-[720px]` à `min-w-[1080px]` + `overflow-x-auto` | Scroll horizontal — **acceptable V1** |
| Onglets workspace | `PartnersWorkspaceTabs` | Non testé device réel |
| Activation checklist | Checkboxes compactes `text-xs` | Lisibilité mobile à valider en recette |

Checklist manuelle non exécutée sur devices — revue Tailwind uniquement.

## 10. Cohérence métier — question produit

> *« Une équipe Yunicity terrain peut-elle gérer ses partenaires depuis cet écran ? »*

**Réponse : partiellement, avec friction.**

| Besoin terrain | Couvert ? | Commentaire |
|----------------|-----------|-------------|
| Prospection / suivi leads | **Oui** | Onglet Leads + `/partner-leads` plein écran |
| Vérifier une organisation | **Oui** | Onglet Vérifications + actions review |
| Activer une vague pilote | **Oui** | Onglet Activation + checklist (dont QR) |
| Voir tous les partenaires signés/actifs | **Non** | Onglet Partenaires = catalogue **public** seulement |
| Fiche 360° opérationnelle | **Oui** | Si l'opérateur connaît l'`organization_id` (vérif / activation / lien externe) |
| Modérer offres du partenaire | **Oui** | Lien filtré par org |
| Modérer contenus du partenaire | **Partiel** | Lien générique — filtre org manquant |
| Modérer événements du partenaire | **Partiel** | Compteurs seulement |
| Readiness unifiée sur fiche | **Non** | Dispersée dans Activation waves |
| QR readiness fiable | **Partiel** | Case manuelle, pas d'état système |

**Conclusion opérateur** : un pilote Reims **peut travailler** leads → vérification → activation → fiche 360°, mais **ne peut pas** s'appuyer sur l'onglet « Partenaires » comme registre complet. La gestion quotidienne exige **navigation multi-onglets** et **connaissance des routes admin** hors fiche.

---

# Bugs

## QA03-001 — Onglet Partenaires : registre incomplet (API publique uniquement)

| Champ | Détail |
|-------|--------|
| Gravité | **Majeure** (exploitabilité / couverture métier) |
| Zone | `PartnersDirectoryTab` + `usePublicPartnersList` |
| Reproduction | 1. Créer org vérifiée + profil `signed` 2. Ouvrir `/partners?tab=partners` |
| Attendu (ticket pilote) | Liste exploitable de tous les partenaires à gérer |
| Observé | `GET /api/v1/partners` — uniquement `active`, `premium`, `founding_partner` |
| Impact | Partenaires signés / en cours d'activation **invisibles** dans l'onglet catalogue ; dépendance à Vérifications / Activation |
| Statut | Dette connue ADMIN-02D — bannière UI présente |

## QA03-002 — Lien « Contenus créateurs » sans filtre organisation

| Champ | Détail |
|-------|--------|
| Gravité | **Majeure** (UX / efficacité opérateur) |
| Zone | `admin_partner_service.py` L304, `PartnerDetailLinks` |
| Reproduction | Ouvrir fiche 360° → cliquer « Contenus créateurs » |
| Attendu | `/creator-content?organization_id={id}` (comme offres) |
| Observé | `/creator-content` — file globale `pending_review` par défaut |
| Impact | Opérateur doit re-filtrer manuellement ; risque de modérer le mauvais contenu sur file chargée |
| Référence | `creator-content-url.ts` supporte déjà `organization_id` |

## QA03-003 — Readiness / QR absents de la fiche 360°

| Champ | Détail |
|-------|--------|
| Gravité | **Majeure** (cohérence produit / ticket QA) |
| Zone | `PartnerDetailView` |
| Reproduction | Ouvrir fiche partenaire actif |
| Attendu (ticket) | Contrôle readiness + QR readiness sur fiche |
| Observé | Uniquement onglet Activation (vagues) — pas de synthèse sur fiche |
| Impact | Opérateur doit changer d'onglet pour voir l'état d'activation ; pas de vue unifiée « état pilote » |

## QA03-004 — Pas de lien admin événements depuis la fiche

| Champ | Détail |
|-------|--------|
| Gravité | **Majeure** (parité offres / contenus) |
| Zone | `AdminPartnerDetailLinks` schema + `PartnerDetailLinks` |
| Reproduction | Fiche avec `events_pending > 0` |
| Attendu | Lien vers file events filtrée par organisation |
| Observé | Compteurs affichés ; aucun deep link |
| Impact | Friction modération événements partenaire |

## QA03-005 — Liste catalogue : pas de recherche, filtres ni pagination

| Champ | Détail |
|-------|--------|
| Gravité | **Moyenne** (UX / scalabilité) |
| Zone | `PartnersDirectoryTab` |
| Reproduction | > 100 partenaires publics ou besoin filtrer par statut |
| Attendu (checklist ticket) | Recherche, filtres, pagination |
| Observé | Liste brute max 100, offset 0 fixe |
| Impact | Non scalable au-delà du pilote ; recherche impossible |

## QA03-006 — Leads embarqués : plafond 100 sans pagination UI

| Champ | Détail |
|-------|--------|
| Gravité | **Moyenne** (scalabilité CRM) |
| Zone | `partner-leads-list.tsx` L71-72 |
| Observé | `page: 1`, `page_size: 100` fixe ; `total` affiché mais pas de pages suivantes |
| Impact | Leads au-delà de 100 inaccessibles depuis workspace sans aller sur `/partner-leads` (même limite si page non implémentée) |

## QA03-007 — Route fiche différente du ticket (`/partners/[id]` inexistant)

| Champ | Détail |
|-------|--------|
| Gravité | **Moyenne** (documentation / bookmarks) |
| Observé | Route réelle : `/partners/organizations/[organizationId]` |
| Impact | Liens externes / docs ticket incorrects → 404 |
| Note | Helpers internes cohérents (`adminPartnerDetailPath`) |

## QA03-008 — Erreur API efface les listes (pattern cockpit)

| Champ | Détail |
|-------|--------|
| Gravité | **Moyenne** (résilience UX) |
| Fichiers | `use-public-partners-list.ts`, `use-admin-organizations-list.ts` |
| Reproduction | Charger liste OK → provoquer échec réseau sur reload |
| Observé | `setItems([])` + `setTotal(0)` dans `catch` |
| Impact | Perte contexte liste sur incident transitoire (même famille QA02-001) |

## QA03-009 — QR readiness : état manuel non relié au système

| Champ | Détail |
|-------|--------|
| Gravité | **Mineure** (cohérence données) |
| Zone | Activation wave checklist |
| Observé | `qr_ready` = checkbox staff ; pas de sync passport / scan |
| Impact | Décalage possible entre case cochée et réalité terrain |

## QA03-010 — Retour fiche ne restaure pas l'onglet workspace

| Champ | Détail |
|-------|--------|
| Gravité | **Mineure** (navigation) |
| Observé | Retour → `/partners` sans `?tab=` → défaut **Leads** |
| Impact | Perte de contexte si l'opérateur venait de Vérifications ou Partenaires |

## QA03-011 — Ville pilote hardcodée « Reims »

| Champ | Détail |
|-------|--------|
| Gravité | **Mineure** (V1 acceptable) |
| Observé | `DEFAULT_CITY = "Reims"` dans hooks / onglets |
| Impact | Pas de gestion multi-ville depuis UI |

## QA03-012 — DB dev vide : validation E2E limitée

| Champ | Détail |
|-------|--------|
| Gravité | **Info** (environnement) |
| Observé | Toutes listes live à 0 ; pas de parcours complet clic-à-clic avec données |
| Impact | Recette pilote nécessite **seed script** ou import leads/partenaires |

---

# Gravité

| Gravité | Count | IDs |
|---------|-------|-----|
| Critique | 0 | — |
| Majeure | 4 | QA03-001, QA03-002, QA03-003, QA03-004 |
| Moyenne | 4 | QA03-005, QA03-006, QA03-007, QA03-008 |
| Mineure | 3 | QA03-009, QA03-010, QA03-011 |
| Info | 1 | QA03-012 |

Tests automatisés : `test_admin_partner_detail_api.py` + `test_partners_api.py` → **21 passed, 1 skipped**.

---

# UX

## Points positifs

- Workspace à onglets clair : Leads / Partenaires / Vérifications / Activation.
- Transparence sur dette catalogue (bannière amber ADMIN-02D).
- Fiche 360° lisible : header badges, cartes identité/profil, compteurs, capabilities explicites.
- États vides guidés (messages contextuels par onglet).
- File vérification : pagination, highlight `organization_id`, actions review inline.
- Activation : progression % checklist, candidats prêts surlignés, lien fiche 360° par item.
- Erreurs avec bouton Réessayer sur tous les onglets principaux.

## Frictions opérateur

- **Double navigation** pour une tâche « partenaire » : pas de vue unique.
- Onglet « Partenaires » trompeur pour un opérateur qui cherche un signé non encore public.
- Liens admin asymétriques : offres filtrées, contenus non filtrés, événements sans lien.
- Tables larges → scroll horizontal mobile (acceptable mais fatigant en terrain).
- Retour fiche → mauvais onglet par défaut.
- Pas de message « rien à activer » proactif quand waves vides (état vide générique seulement).

---

# Recommandations

1. **Avant pilote terrain** : seed Reims (leads, orgs pending, 2–3 profils signed/active, 1 vague activation) pour recette manuelle complète.
2. **ADMIN-02D** : prioriser liste admin partenaires (tous statuts) ou documenter officiellement le parcours Vérifications → Fiche comme chemin principal.
3. **Liens fiche 360°** : ajouter `organization_id` sur `creator_content_admin` ; ajouter `events_admin` si le workspace events supporte le filtre.
4. **Readiness produit** : soit panneau synthèse sur fiche (read-only depuis wave item), soit renommer attentes ticket pour refléter l'onglet Activation.
5. **QR** : à moyen terme, dériver `qr_ready` d'un signal système (stamp configuré / premier scan) plutôt que checkbox seule.
6. **Résilience** : conserver données précédentes en erreur reload (alignement fix QA02-001 sur tous les hooks liste).
7. **Navigation** : retour fiche avec `?tab=` mémorisé (query ou state).
8. **Scalabilité** : pagination leads + catalogue avant montée > 100 entrées.
9. **Recette manuelle restante** :
   - [ ] Parcours lead → conversion → org
   - [ ] Vérification → création profil → activation depuis fiche
   - [ ] Checklist activation complète incl. QR
   - [ ] Liens offres / creator / public depuis fiche
   - [ ] Refresh navigateur + URL directe fiche
   - [ ] Responsive tablette (vérifications + activation)

---

# GO / NO GO

## Partners Admin — **GO conditionnel**

| Critère | Décision |
|---------|----------|
| Structure workspace + RBAC | **GO** |
| CRM leads + vérifications | **GO** |
| Fiche 360° + actions métier | **GO** (avec seeds) |
| Registre partenaires complet (onglet Partenaires) | **NO GO** tant qu'ADMIN-02D non livré |
| Readiness / QR sur fiche (attente ticket) | **NO GO** — disponible seulement via Activation |
| Liens admin cohérents (creator / events) | **NO GO** — friction majeure |
| Pilote Reims exploitable end-to-end | **GO conditionnel** si seeds + formation opérateur sur parcours multi-onglets |

**Conditions de passage prod pilote :**

1. Seeds recette validés sur les 4 onglets + fiche 360°.
2. Acceptation produit de la dette catalogue (QA03-001) ou livraison ADMIN-02D.
3. Correctifs ou contournements documentés pour QA03-002 (filtre creator) avant modération intensive.
4. Formation terrain : « Partenaires » ≠ liste complète ; readiness = onglet Activation.

**Bloquant absolu prod** : aucun bug critique sécurité identifié sur ce périmètre (staff guard API + `StaffRoute` UI). Les majeurs sont **exploitabilité et cohérence produit**, pas des failles d'accès.

---

*Rapport généré en phase QA HARDENING — aucun correctif appliqué, aucun commit.*
