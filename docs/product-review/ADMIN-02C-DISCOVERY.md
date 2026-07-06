# ADMIN-02C — Discovery Activation Waves

**Phase BMAD :** DISCOVER (pré-BUILD)  
**Feature :** FEATURE-ADMIN-V1 / ADMIN-02 Partners  
**Ticket :** ADMIN-02C-ACTIVATION-WAVES-DISCOVERY  
**Date :** 2026-06-03  
**Statut :** Audit code uniquement — aucune modification applicative, aucun commit

**Prérequis livrés :**

| Ticket | Statut |
|--------|--------|
| ADMIN-02A Workspace | ✅ |
| ADMIN-02B Verification Queue | ✅ |
| ADMIN-02D1 Partner Detail Read API | ✅ |
| ADMIN-02D2 Partner Detail Page | ✅ |
| ADMIN-02D3A Partner Actions API | ✅ (#30) |
| ADMIN-02D3B Partner Actions UI | ✅ (#31) |

---

## 1. Synthèse exécutive

**Problème :** l’admin gère un partenaire **individuellement** (fiche 360°, actions D3A/D3B), mais pas le **pilotage collectif** des vagues Reims (qui est dans quelle vague, où en est la préparation, qui peut passer en catalogue).

**Recommandation CTO : Option B — Lightweight DB** pour V1, avec **pas de batch activate** en V1.

| Option | Verdict |
|--------|---------|
| **A — No DB** | Utile comme **prototype UI 48h** uniquement ; insuffisant dès qu’on assigne des partenaires nommés à Wave 1 vs Wave 2 (même statut `signed`). |
| **B — Lightweight DB** | **Choix V1** : `activation_waves` + `activation_wave_items` + checklist JSON + signaux dérivés. |
| **C — Full Workflow** | **V2+** : batch, historique wave, règles automatiques, multi-ville. |

---

## 2. État du code (audit)

### 2.1 Modèles existants — pas de concept « wave »

| Entité | Champs / rôle pertinents | Wave ? |
|--------|--------------------------|--------|
| `partner_profiles` | `partner_status`, `signed_at`, `activated_at`, `contact_*`, `notes_internal`, `is_featured` | **Non** |
| `organizations` | `verification_status`, `visibility`, `logo_url`, coordonnées | **Non** |
| `partner_admin_actions` | Audit mutations D3 (`action`, `reason`, `metadata` JSONB) | **Non** — historique actions, pas checklist ops |
| `partner_leads` | CRM terrain, conversion → org (sans profil auto) | **Non** |
| `partner_offers` | `status` (`published`, `pending_review`, …) | **Non** |
| `passport_stamps` | Tampons citoyens par `organization_id` | **Non** — compteur ops, pas config QR |

**Conclusion backend Q1 :** aucun champ `wave`, `campaign`, `activation_batch` ou équivalent en base aujourd’hui.

### 2.2 Seeds Reims — dérivation partielle possible, pas suffisante

Fichier canon : `backend/app/db/seeds/reims_signed_partners.py` (14 orgs + profils).

**Alignement cas produit Reims (état seed) :**

| Vague produit | Partenaires | `partner_status` seed | `visibility` |
|---------------|-------------|----------------------|----------------|
| **Wave 1 active** | Belga Queen, Pittaya, Centre des Ressources, Garçon Barbiers | `active` | `public` |
| **Wave 2 candidates** | Marcel et Jane, Daiboken, Eat Night, Kebab Tacos Gourmand, Face à Face | `signed` | `private` |

**Autres `signed` dans le seed (hors listes produit) :** ETT Europe Top Team, Rhinocéreims, Imoria, Champagne Basket, Yurpass, etc.

**Pilotes complémentaires (WEB-PARTNERS-08) :**

- `reims_pilot_partner_public_data.py` — assets publics (logo, site) pour les 4 actifs
- `reims_partner_offers.py` — offres Passport **published** pour les 4 actifs uniquement
- `reims_pilot_partner_memberships.py` — comptes recette partenaires pilotes

**Conclusion backend Q3 :** on peut **dériver une vue « par statut »** (actifs vs signés), mais **pas** Wave 1 vs Wave 2 ni l’assignation nominative **sans** table ou config explicite (plusieurs `signed` ne sont pas Wave 2).

### 2.3 API admin partenaire actuelle

Préfixe : `/api/v1/admin/partners` (`admin_partners.py`)

| Méthode | Route | Rôle |
|---------|-------|------|
| GET | `/{organization_id}` | Fiche 360° + `capabilities` + **counters** |
| POST | `/{organization_id}/profile` | Créer profil |
| POST | `/{organization_id}/activate` | Activer |
| POST | `/{organization_id}/pause` | Pause |
| POST | `/{organization_id}/upgrade-premium` | Premium |
| PATCH | `/{organization_id}` | Settings limités |

**Manque pour 02C :** aucun `GET` liste staff (signed/non-public), aucun agrégat wave, aucun endpoint batch.

**Signaux ops déjà disponibles** (via `AdminPartnerRepository.fetch_counters`) :

- `offers_published`, `offers_pending`
- `stamps_total` (tampons citoyens collectés — indicateur faible pour « QR configuré »)
- events / creator contents pending

### 2.4 Frontend admin actuel

| Zone | État |
|------|------|
| `/partners?tab=activation` | **Placeholder** (`PartnersPlaceholderTab`) — bullets Wave 1 / 2 en texte statique |
| Fiche 360° | Actions D3B complètes, lien depuis directory **public** uniquement |
| Tab « Partenaires » | `GET /api/v1/partners` — **catalogue public** (active/premium/founding) |
| Tab « Vérifications » | File org `pending` / `under_review` |
| Cockpit | Métriques leads / attention — **pas** de lien wave ; quick actions vers leads / modération |

---

## 3. Réponses — questions produit

### 3.1 Wave = modèle DB ou vue filtrée ?

**Les deux, en couches :**

- **V1 :** modèle DB **léger** pour l’**assignation** et la **checklist ops** (qui est dans quelle vague).
- **Signaux techniques** (offre publiée, org vérifiée, etc.) : **dérivés** à la lecture (pas dupliqués en dur dans la checklist si évitable).

Une **vue filtrée seule** (`partner_status = signed`) ne suffit pas pour Reims : trop de `signed` hors Wave 2.

### 3.2 Assigner un partenaire à une wave ?

**Oui, V1.** C’est le cœur du besoin « pilotage sans SQL » : membership explicite `organization_id` ↔ `wave_id`.

Règles proposées :

- Une org au plus **une** wave à la fois (V1).
- Déplacer entre waves = PATCH item (staff), audit optionnel V2.

### 3.3 Suivre contact / assets / offre / QR / GO public ?

**Oui, en deux niveaux :**

| Signal | Type V1 | Source |
|--------|---------|--------|
| Contact validé | **Dérivé** + override manuel | `contact_email` / `contact_phone` sur profil ; org `verified` |
| Assets reçus | **Dérivé** + override | `organization.logo_url` (et bannière) ; pilot merge seed |
| Offre Passport prête | **Dérivé** | `offers_published >= 1` |
| QR prêt | **Hybride** | Dérivé faible : offre published + profil `signed|active` ; **checkbox ops** si QR physique / claim testé |
| GO public | **Dérivé** | `partner_status ∈ {active, premium, founding_partner}` + `visibility = public` |

**Ne pas** mélanger GO public (mutation D3) avec checklist : la checklist **prépare** ; l’action **Activer** reste sur la fiche 360° (une org à la fois).

### 3.4 Checklist par partenaire ?

**Oui, V1** — 5 items alignés produit, stockés en JSON sur `activation_wave_items.checklist` (bool + `checked_at` + `checked_by` optionnel).

### 3.5 Batch activate ?

**V2.** V1 = liens vers fiche + bouton Activer **unitaire** (D3B déjà sécurisé).

### 3.6 Batch activate trop risqué en V1 ?

**Oui.**

Raisons (doctrine sécurité + D3 discovery) :

- Chaque activation touche catalogue, gates events/offres/QR.
- `partner_admin_actions` journalise **par** org — un batch masque la responsabilité.
- Erreur partielle (1 org non `verified`, 1 sans profil) = rollback UX complexe.
- **Recommandation :** interdit V1 ; réévaluer V2 avec dry-run + preview + limite N≤5 + double confirmation.

---

## 4. Réponses — questions backend

### 4.1 Champ wave / campaign existant ?

**Non** (voir §2.1).

### 4.2 Où stocker la checklist wave ?

| Approche | Avis |
|----------|------|
| `partner_profiles.notes_internal` | **Non** — texte libre, non structuré, non par wave |
| `partner_admin_actions.metadata` | **Non** — audit événements, pas état persistant checklist |
| **Table `activation_wave_items`** | **Oui** — JSONB checklist versionné |

Schéma checklist proposé (V1) :

```json
{
  "contact_validated": { "done": false, "manual": false },
  "assets_received": { "done": false, "manual": false },
  "passport_offer_ready": { "done": false, "manual": false },
  "qr_ready": { "done": false, "manual": true },
  "go_public": { "done": false, "manual": false }
}
```

Champs dérivés calculés côté service à chaque `GET` (avec cache court optionnel V2).

### 4.3 Dériver Wave 1 / 2 depuis données existantes ?

**Partiellement :**

- Wave 1 ≈ intersection slugs pilotes + `partner_status = active` → **OK en lecture**
- Wave 2 ≈ liste nominative + `signed` → **nécessite assignation explicite** (seed ou table)

**Migration seed V1 :** insérer vague `reims-wave-1` / `reims-wave-2` + items pour les 9 slugs produit.

### 4.4 Table `activation_waves` ?

**Oui (V1).**

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | UUID | PK |
| `code` | string unique | ex. `reims-wave-1` |
| `name` | string | « Reims — Vague 1 » |
| `city` | string | `Reims` |
| `status` | enum | `draft` \| `active` \| `closed` |
| `sort_order` | int | |
| `description` | text nullable | |
| `created_at` / `updated_at` | datetime | |

### 4.5 Table `activation_wave_items` ?

**Oui (V1).**

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | UUID | PK |
| `wave_id` | FK | |
| `organization_id` | FK unique | une wave par org V1 |
| `sort_order` | int | |
| `checklist` | JSONB | §4.2 |
| `ops_notes` | text nullable | |
| `added_at` | datetime | |

Index : `(wave_id)`, `(organization_id)` unique.

**Pas en V1 :** `partner_profile_id` redondant (joindre via org).

### 4.6 Endpoints proposés

Préfixe suggéré : `/api/v1/admin/activation-waves`  
Permissions : `moderation.manage` ou `system.admin` (aligné D3A).

| Méthode | Route | V1 |
|---------|-------|-----|
| GET | `/` | Liste waves (filtre `city`) |
| GET | `/{wave_id}` | Détail wave + **items enrichis** (org, profil, statut, checklist dérivée+stockée, counters résumés, `capabilities`, lien admin) |
| POST | `/` | Créer wave (staff) — optionnel si seed-only Reims |
| PATCH | `/{wave_id}` | Metadata wave |
| POST | `/{wave_id}/items` | Assigner org à la wave |
| PATCH | `/{wave_id}/items/{organization_id}` | MAJ checklist / notes / reorder |
| DELETE | `/{wave_id}/items/{organization_id}` | Retirer de la wave |
| POST | `/{wave_id}/items/{organization_id}/activate` | **V2** — batch unitaire |

**Réutilisation :** pas de duplication logique activate — V2 appellerait `AdminPartnerService.activate` en boucle transactionnelle séparée.

**Endpoint complémentaire (option V1.1) :**

- `GET /api/v1/admin/partners/workspace-summary?city=Reims` — compteurs signed / active / sans profil (alimente en-tête tab Activation).

---

## 5. Réponses — questions frontend

### 5.1 Design tab Activation (`/partners?tab=activation`)

Remplacer le placeholder par :

1. **En-tête** — ville (Reims), légende signaux dérivés vs manuels
2. **Sections par wave** (cards empilées)
3. **Tableau partenaires** par wave (pas carte seule — densité ops)

### 5.2 Cards par wave ?

**Oui** — une card par wave avec :

- Titre + statut wave + progression `X/Y prêts` (définition « prêt » = 5 checklist items true OU règle produit : 4/5 sans GO public)
- Liste lignes partenaires

### 5.3 Liste par readiness ?

**Oui** — colonnes suggérées :

| Colonne | Source |
|---------|--------|
| Nom / slug | org |
| Statut partenaire | profil |
| Vérification org | org |
| Checklist (5 icônes) | dérivé + JSON |
| Offres publiées | counter |
| Actions | lien fiche 360° + raccourcis modération offres |

Tri : `sort_order` wave item, puis statut (`signed` avant `active` en wave 2).

### 5.4 Checklists visibles ?

**Oui** — inline (icônes) + panneau slide/over sur la ligne pour cocher items **manuels** ; items **dérivés** en lecture seule avec tooltip « source : offre publiée ».

### 5.5 Liens fiches 360° ?

**Oui, obligatoire** — chaque ligne → `/partners/organizations/[organizationId]` (existant `adminPartnerDetailPath`).

Actions activate/pause **uniquement** sur la fiche (D3B), pas sur la ligne wave V1.

### 5.6 Pas de batch mutation en V1 ?

**Confirmé.** Tab = pilotage + checklist ; mutations = fiche 360°.

---

## 6. Comparaison options A / B / C

### Option A — No DB (vue statique / config)

**Implémentation :** config TS `REIMS_WAVES` (slugs), fetch N× `GET admin/partners/{id}` ou script manuel.

| Pour | Contre |
|------|--------|
| Zéro migration | N+1 API, lent, fragile |
| Rapide maquette | Checklist non persistée |
| | Pas d’assignation dynamique |
| | Hors doctrine « intégrité données » |

### Option B — Lightweight DB ✅ recommandé

**Implémentation :** §4.4–4.6 + tab Activation + seed Reims.

| Pour | Contre |
|------|--------|
| Assignation nominative | 1 migration |
| Checklist persistée | 2–3 tickets BUILD |
| SQL ops → UI | |
| Évolutif vers C | |

### Option C — Full Workflow

Batch activate, règles auto, historique wave, notifications, multi-ville, dashboard cockpit.

| Pour | Contre |
|------|--------|
| Scale national | Sur-engineering maintenant |
| | Risque sécurité / dette |

---

## 7. Modèle recommandé & scopes

### 7.1 Modèle recommandé (V1)

```
activation_waves 1──* activation_wave_items *──1 organizations
                              │
                              └── checklist JSONB (ops)
                              └── join partner_profiles (read)
                              └── counters dérivés (read, même repo D1)
```

**Principe :** la wave est un **contenant ops** ; le **cycle de vie partenaire** reste sur `partner_profiles` (D3A inchangé).

### 7.2 Scope V1 (BUILD)

- Migration + modèles SQLAlchemy
- Seed Reims wave 1 + wave 2 (9 partenaires produit)
- API CRUD wave + items + GET enrichi
- Service dérivation checklist (5 signaux §3.3)
- Frontend tab Activation (cards + table + checklist PATCH)
- Liens fiche 360° + copy FR (verified ≠ public, pause, activation volontaire — rappel contextuel)
- Tests API + tests service dérivation
- **Exclus :** batch activate, founding_partner, audit UI historique (→ 02D3C), export CSV

### 7.3 Scope V2

- `POST …/activate` batch avec dry-run
- Panel audit `partner_admin_actions` sur fiche (02D3C)
- Multi-ville / waves dynamiques staff
- Filtre readiness global cross-waves
- Cockpit metric « partenaires wave 2 prêts »
- Règles auto (ex. checklist complète → suggestion activate)

### 7.4 Risques

| Risque | Mitigation |
|--------|------------|
| Confusion wave vs `partner_status` | Copy UI explicite ; wave = planning, statut = catalogue |
| Double source vérité checklist | Dérivés recalculés ; manuels en JSON ; afficher badge « auto » vs « manuel » |
| Batch activate accidentel | Hors V1 ; garde-fous V2 |
| N+1 perf sur GET wave | 1 requête SQL items + join org/profile ; counters en agrégat SQL (pas N appels detail) |
| Org hors seed assignée par erreur | Validation staff + ville wave |
| QR « prêt » flou | Item manuel par défaut + tooltip |

---

## 8. UI proposée (wireframe textuel)

```
/partners?tab=activation
┌─────────────────────────────────────────────────────────┐
│ Activation Waves — Reims                                 │
│ Les vagues organisent la préparation. L’activation       │
│ catalogue se fait depuis la fiche partenaire (1 par 1).  │
└─────────────────────────────────────────────────────────┘

┌─ Wave 1 — Actifs territoire ──────────── 4/4 GO public ─┐
│ Belga Queen      active  ✓✓✓✓✓  [Fiche] [Offres]        │
│ Pittaya          active  ✓✓✓✓✓  [Fiche] [Offres]        │
│ …                                                       │
└─────────────────────────────────────────────────────────┘

┌─ Wave 2 — Candidats signature ─────── 0/5 prêts ────────┐
│ Marcel et Jane   signed  ○○○○○  [Fiche] [+ checklist]   │
│ …                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Découpage BUILD recommandé

| Ticket | Contenu | Estimation relative |
|--------|---------|---------------------|
| **ADMIN-02C-A** | Migration `activation_waves` + `activation_wave_items`, modèles, seed Reims, repository | M |
| **ADMIN-02C-B** | API admin waves (GET list/detail, PATCH checklist, POST/DELETE items), tests API | M |
| **ADMIN-02C-C** | Service dérivation signaux + schémas Pydantic enrichis | S |
| **ADMIN-02C-D** | Frontend tab Activation (remplace placeholder), hooks API, table + checklist UI | M |
| **ADMIN-02C-E** | Recette doc + smoke staff (wave 2 → préparer → activer via fiche) | S |

**Ordre :** A → B → C en parallèle partiel → D → E.

**Parallèle possible :** ADMIN-02D3C (audit UI) indépendant ; prioriser **02C** si objectif pilotage Reims Wave 2.

---

## 10. Décision CTO (à valider)

| Question | Décision proposée |
|----------|-------------------|
| DB vs vue seule | **DB lightweight (Option B)** |
| Assignation wave | **Oui V1** |
| Checklist 5 items | **Oui V1** (JSONB + dérivés) |
| Batch activate | **Non V1** — trop risqué |
| Prochain BUILD | **ADMIN-02C-A** après GO sur ce document |

---

## 11. Annexes — mapping slugs Reims

| Nom produit | Slug | UUID org (seed) | Wave produit |
|-------------|------|-----------------|--------------|
| Belga Queen | `belga-queen` | `…0009` | 1 |
| Pittaya | `pittaya` | `…0011` | 1 |
| Centre des Ressources | `centre-des-ressources` | `…0012` | 1 |
| Garçon Barbiers | `garcon-barbiers` | `…0014` | 1 |
| Marcel et Jane | `marcel-et-jane` | `…0005` | 2 |
| Daiboken | `daiboken` | `…0004` | 2 |
| Eat Night | `eat-night` | `…0006` | 2 |
| Kebab Tacos Gourmand | `kebab-tacos-gourmand` | `…0010` | 2 |
| Face à Face | `face-a-face` | `…0002` | 2 |

---

*Document généré par audit codebase — `main` @ merge PR #31 (`7a190b1`).*
