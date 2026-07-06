# QA-02 — Admin Cockpit Validation

**Ticket** : QA-02  
**Feature** : FEATURE-ADMIN-V1  
**Phase** : QA HARDENING  
**Date** : 2026-06-05  
**Route** : `/` (cockpit admin)  
**Méthode** : revue statique + API live + tests d'intégration existants — **aucune modification produit**

---

# Résumé

Le Cockpit Admin est **structurellement prêt** : une requête agrégée (`GET /api/v1/admin/cockpit/summary`), skeleton au chargement, états erreur/retry, sections KPI / À traiter / snapshots Partenaires & Passport, actions rapides et liens de navigation cohérents avec les workspaces cibles.

Sur l'environnement local audité (DB dev quasi vide), l'API retourne **200 avec des zéros** — le cockpit s'affiche mais **ne permet pas un travail opérationnel réel** sans données pilote (partenaires, offres, leads, etc.).

| Verdict zone | Résultat |
|--------------|----------|
| Chargement / états | PASS avec réserve (bug refresh) |
| KPIs / données | PASS format ; incohérence scope territorial |
| À traiter (Attention) | PASS liens ; compteurs à 0 en dev |
| Actions rapides | PASS destinations ; libellé scan ambigu |
| Navigation | PASS |
| Responsive | PASS statique (grilles Tailwind) |
| Performance | PASS (1 fetch) |
| Exploitabilité opérateur | **GO conditionnel** |

---

# Cas testés

## 1. Chargement initial

| # | Cas | Méthode | Résultat |
|---|-----|---------|----------|
| 1.1 | Premier paint | Revue `cockpit-page.tsx` | Skeleton pulse (`CockpitLoading`) si `isLoading && !data` |
| 1.2 | Page vide permanente | API live + code | Non — données `{}` avec zéros s'affichent |
| 1.3 | Loading infini | Revue hook | Non — `finally` remet `isLoading` à false |
| 1.4 | Erreur API initiale | Revue hook | Bloc rose « Cockpit indisponible » + bouton Réessayer |
| 1.5 | Console / crash | Non exécuté browser | Aucun pattern crash évident dans le code |
| 1.6 | API live bootstrap | `GET /admin/cockpit/summary?city=Reims` | **200** — payload complet |

## 2. KPIs (Vue d'ensemble — « Executive Operations Dashboard »)

| # | Cas | Résultat |
|---|-----|----------|
| 2.1 | Format nombres | `formatAdminMetric` → fr-FR (`admin-cockpit.test.ts` OK) |
| 2.2 | NaN / null | Types TS `number` côté API ; pas de garde NaN UI (non observé en live) |
| 2.3 | Cartes cassées | Grille responsive `sm:2 / lg:4 / xl:7` — OK |
| 2.4 | Cohérence données live | `users_total: 4`, reste à 0 sur Reims dev |
| 2.5 | Scope territorial | **Écart** — `users_total` / `users_active` = **global** ; autres KPIs = Reims (voir bugs) |
| 2.6 | Sous-texte actifs | « X citoyens actifs sur Y comptes » — OK si données présentes |

**Note produit** : le ticket mentionne « Dispatch Summary » — dans le code, l'équivalent opérationnel est la section **« À traiter »** (`CockpitAttention`), pas une section nommée Dispatch.

## 3. Attention Required (« À traiter »)

| # | Carte | Lien cockpit | Filtre destination | Validé |
|---|-------|--------------|-------------------|--------|
| 3.1 | Offres en attente | `/passport-offers?status=pending_review` | `parsePassportOffersSearchParams` | ✅ |
| 3.2 | Contenus créateurs | `/creator-content?status=pending_review` | `creator-content-url.ts` | ✅ |
| 3.3 | Événements | `/events?status=pending_review` | pattern events URL | ✅ |
| 3.4 | Signalements | `/moderation?status=pending` | `moderation-url.ts` default pending | ✅ |
| 3.5 | Leads ouverts | `/partners?tab=leads` | `parsePartnersWorkspaceTab` | ✅ |
| 3.6 | Organisations à vérifier | `/partners?tab=verification` | onglet Vérifications | ✅ |
| 3.7 | Sévérité visuelle | count 0 → `none` ; couleurs border | ✅ |
| 3.8 | Données live | Tous compteurs 0 | État vide fonctionnel, pas de message « rien à traiter » |

`reports_pending` est compté **globalement** (pas filtré par ville) — à noter pour un pilote multi-villes.

## 4. Quick Actions

| CTA | Destination | StaffRoute cible | OK |
|-----|-------------|------------------|-----|
| Modérer offres | `/passport-offers` | ✅ | ✅ |
| Modérer contenus | `/creator-content` | ✅ (post QA01-FIX-002) | ✅ |
| Leads terrain | `/partners?tab=leads` | ✅ | ✅ |
| Scanner offre | `/partner-scan` | ProtectedRoute only | ⚠️ libellé (voir bugs) |
| Créer offre admin | `/passport-offers/new` | ✅ | ✅ |

Aucun contrôle RBAC supplémentaire sur les CTA — cohérent avec le reste de l'admin staff.

## 5. Navigation

| # | Cas | Résultat |
|---|-----|----------|
| 5.1 | Sidebar Cockpit → `/` | Lien actif `StaffRoute` + `CockpitPage` |
| 5.2 | Refresh bouton header cockpit | Relance `load()` — 1 nouvel appel API |
| 5.3 | Refresh navigateur | Cookie refresh + bootstrap auth → re-fetch cockpit attendu |
| 5.4 | Nouvel onglet `/` | Session via cookie refresh (même logique QA-01) |
| 5.5 | Retour depuis workspace | Liens internes standards Next.js |

## 6. Responsive

| Breakpoint | Comportement code |
|------------|-------------------|
| Desktop | Sidebar + grilles multi-colonnes |
| Laptop | `max-w-6xl`, grilles `lg:` |
| Tablet / mobile | Sidebar masquée (`hidden md:block`), nav pills header mobile |

Non testé sur devices réels — classes Tailwind standard, risque faible.

## 7. États vides

| # | Cas | Observé |
|---|-----|---------|
| 7.1 | DB dev vide (live) | Tous KPIs et attention à 0 — affichage « 0 » |
| 7.2 | Message guidé opérateur | Absent — pas de « Aucune file en attente » |
| 7.3 | Erreur réseau | Écran dédié + retry |
| 7.4 | Erreur refresh avec données | **Bug** — données précédentes effacées (voir QA02-001) |

## 8. Performance

| # | Observation |
|---|-------------|
| 8.1 | 1 seul endpoint au mount (`/admin/cockpit/summary`) |
| 8.2 | Pas de polling |
| 8.3 | `adminCockpitApi` stable (`useMemo` AuthProvider) — pas de boucle hook |
| 8.4 | React Strict Mode dev → possible double fetch (acceptable dev) |
| 8.5 | Pas de cache SWR — retour sur `/` refetch (acceptable V1) |

## 9. Tests automatisés existants (référence)

`backend/tests/test_admin_cockpit_api.py` — 4 tests intégration :
- MODERATOR accès 200
- USER refusé 403
- Ville défaut Reims
- Compteurs cohérents avec fixtures isolées

`frontend/packages/utils/src/admin-cockpit.test.ts` — format métriques / sévérité.

Pas de test composant `CockpitPage` côté admin.

---

# Bugs

## QA02-001 — Refresh en erreur efface tout le cockpit

| Champ | Détail |
|-------|--------|
| Gravité | **Majeure** (UX / résilience) |
| Fichier | `lib/hooks/use-admin-cockpit-summary.ts` |
| Reproduction | 1. Charger cockpit OK 2. Simuler échec API sur « Actualiser » (réseau coupé) |
| Attendu | Bandeau ambre « données dernière charge » (`cockpit-page.tsx` L64-68) |
| Observé | `setData(null)` dans le `catch` → écran erreur complet ; code bandeau **mort** |
| Impact | Perte de contexte opérationnel sur incident réseau transitoire |

## QA02-002 — Incohérence scope territorial affiché « Reims »

| Champ | Détail |
|-------|--------|
| Gravité | **Majeure** (cohérence produit / confiance opérateur) |
| Zone | Backend agrégation + UI header |
| Reproduction | Comparer `executive.users_total` avec comptes réellement « Reims » |
| Attendu | KPIs alignés sur la ville affichée |
| Observé | `users_total` / `users_active` = **globaux** ; `reports_pending` = **global** ; reste scopé `city=Reims` |
| Impact | Opérateur peut sur/sous-estimer l'activité territoire |

## QA02-003 — Double titre H1 sur la page cockpit

| Champ | Détail |
|-------|--------|
| Gravité | **Mineure** (UX / a11y) |
| Reproduction | Ouvrir `/` connecté staff |
| Observé | `AdminShell` h1 « Cockpit Yunicity » + `CockpitHeader` h1 « Cockpit Yunicity » |
| Impact | Redondance visuelle, hiérarchie heading confuse |

## QA02-004 — Libellé « Scanner offre » trompeur

| Champ | Détail |
|-------|--------|
| Gravité | **Mineure** (UX copy) |
| Zone | `cockpit-quick-actions.tsx`, `cockpit-passport-snapshot.tsx` |
| Observé | CTA pointe vers `/partner-scan` = scan **Passport QR**, pas scan d'offre isolée |
| Impact | Opérateur novice peut mal interpréter l'action |

## QA02-005 — Absence d'état vide explicite sur files à 0

| Champ | Détail |
|-------|--------|
| Gravité | **Mineure** (UX) |
| Observé | Compteurs à 0 sans message « Rien à traiter » / validation visuelle |
| Impact | Sur DB vide, cockpit ressemble à un tableau mort |

## QA02-006 — Ville pilote hardcodée sans sélecteur

| Champ | Détail |
|-------|--------|
| Gravité | **Mineure** (V1 acceptable) |
| Observé | `COCKPIT_CITY = "Reims"` dans `cockpit-page.tsx` ; API accepte `?city=` |
| Impact | Pas d'extension multi-ville depuis l'UI |

## QA02-007 — Grille attention 6 cartes / 5 colonnes XL

| Champ | Détail |
|-------|--------|
| Gravité | **Mineure** (layout) |
| Observé | `xl:grid-cols-5` avec 6 items → 5+1 wrap |
| Impact | Légère asymétrie desktop large |

---

# Gravité — synthèse

| Gravité | Count | IDs |
|---------|-------|-----|
| Critique | 0 | — |
| Majeure | 2 | QA02-001, QA02-002 |
| Mineure | 5 | QA02-003 à QA02-007 |

---

# UX

**Points forts**
- Skeleton propre au premier chargement
- Hiérarchie claire : header → vue d'ensemble → à traiter → snapshots → actions
- Cartes attention cliquables avec code couleur sévérité
- Bouton Actualiser avec état disabled
- Liens « À traiter » alignés sur les filtres réels des workspaces (validé par parsing URL)
- Protection `StaffRoute` sur `/` (post QA-01 / FIX-002 sur destinations)

**Points faibles**
- Double titre
- Zéros partout sans guidance opérateur
- Métriques globales dans un cockpit « Reims »
- Libellés scan ambigus
- Résilience refresh défaillante (QA02-001)

---

# Recommandations

1. **P0 recette** : charger données pilote (`seed --pilot` ou recette préremplie) avant validation opérateur réel.
2. **P1 correctif** : QA02-001 — ne pas `setData(null)` si données déjà présentes ; activer le bandeau ambre existant.
3. **P1 produit** : QA02-002 — documenter ou corriger scope users/reports (global vs Reims) ; libellé UI explicite.
4. **P2 UX** : fusionner titres shell/cockpit ; copy scan « Scanner Passport » ; empty state « Rien à traiter ».
5. **Checklist manuelle navigateur** (non exécutée ici) :
   - [ ] Login SUPER_ADMIN → cockpit visible
   - [ ] Actualiser → timestamp `Mis à jour` change
   - [ ] Clic chaque carte attention → bon filtre
   - [ ] Clic chaque quick action → bonne page
   - [ ] Viewport 768px / 1280px

---

# GO / NO GO

## Cockpit Admin — **GO conditionnel** (recette locale FEATURE-ADMIN-V1)

| Critère | Statut |
|---------|--------|
| Page charge sans crash (API OK) | ✅ |
| KPIs affichables | ✅ (zéros OK format) |
| Attention + liens | ✅ |
| Quick actions | ✅ (copy à améliorer) |
| Staff protégé | ✅ |
| Exploitable opérateur réel **sans seed** | ❌ |
| Bugs majeurs bloquants prod | 2 (résilience + scope) |

**GO** pour enchaîner **QA-03+** et la recette fonctionnelle Admin V1 **avec données pilote**.

**NO GO prod** sans :
- correction ou acceptation QA02-001 / QA02-002
- validation navigateur manuelle complète
- jeu de données recette représentatif

---

## Réponse produit

> *« Un opérateur Yunicity pilote peut-il réellement travailler depuis ce cockpit ? »*

**Partiellement.**

- **Oui** comme **centre de pilotage** : vue agrégée, priorisation visuelle (sévérité), accès direct aux files de modération, partenaires, passport ops — **à condition de données en base**.
- **Non** sur l'environnement dev audité (quasi tout à zéro) : aucune file à traiter, snapshots vides — navigation possible mais **pas de travail métier**.
- **Oui avec réserves** sur la **fiabilité** : un refresh raté fait perdre l'écran (QA02-001) ; les chiffres « citoyens » ne sont pas strictement Reims (QA02-002).

Pour un pilote Reims réel : **charger les seeds partenaires/offres/leads**, puis re-valider les compteurs cockpit contre les workspaces.

---

*Audit QA uniquement — aucun correctif, aucun commit.*
