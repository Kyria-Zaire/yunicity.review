# RF-03B — Validation terrain événements Reims

| Champ | Valeur |
|-------|--------|
| **Ticket** | RF-03B |
| **Feature** | FEATURE-REALITY-FIX-V1 |
| **Phase BMAD** | OPERATE |
| **Prérequis** | RF-03A mergé (readiness + territory health) |
| **Date ouverture** | 2026-06-18 |
| **Owner ops** | _à assigner — coordinateur écosystème local_ |
| **GO publication auto** | **NON** |

---

## Synthèse exécutive

| Indicateur | Valeur au démarrage RF-03B |
|------------|----------------------------|
| Événements identifiés (pipeline) | **5** |
| Vérifiés terrain (CONFIRMED) | **0** |
| Publiés Yunicity (PUBLISHED) | **0** |
| Futurs publiés réels en base | **0** (4 seed pilotes = PLACEHOLDER) |
| **Territory Health** | **WARNING** 🟡 (4 futurs non réels) |
| Objectif pilote | **HEALTHY** 🟢 (≥ 5 futurs **réels** publiés) |

**Règle absolue :** aucune date, URL d'événement, contact ou lieu inventé dans ce document. Les champs non encore sourcés sont marqués **À sourcer** ou **À confirmer terrain**.

---

## Statuts autorisés (workflow ops)

| Statut | Signification | Qui décide |
|--------|---------------|------------|
| **PENDING** | Hypothèse pipeline RF-03A — pas encore contacté | Ops |
| **CONTACTED** | Organisateur contacté, attente réponse | Ops |
| **CONFIRMED** | Existence + date + lieu + org + autorisation publication validés | Ops + organisateur |
| **REJECTED** | Inexistant, refus, ou non intégrable | Ops |
| **PUBLISHED** | Fiche créée, `approved`, visible public, `event_readiness = ready` | Staff + ops |

**Transitions :** `PENDING → CONTACTED → CONFIRMED → PUBLISHED` ou `→ REJECTED` à tout moment avant publication.

---

## Phase 1 — Inventaire terrain (5 événements)

### E1 — Culture

| Champ | Valeur |
|-------|--------|
| **Nom** | Nuit des musées — édition Reims (visites nocturnes) |
| **Catégorie** | Culture |
| **Organisateur** | À sourcer — musées partenaires Reims / direction culture Ville de Reims |
| **Source** | Calendrier culturel municipal + sites musées locaux |
| **URL source** | À sourcer — page officielle de l'édition Reims (pas d'URL inventée) |
| **Date** | À confirmer terrain (programme annuel — date fixe une fois sourcée) |
| **Lieu** | À confirmer terrain (musées participants, adresses précises) |
| **Contact** | À assigner |
| **Statut ops** | **PENDING** |
| **Validation terrain** | Non démarrée |
| **event_quality_score** | **NOT_READY** (0/5 critères confirmés) |

---

### E2 — Étudiant

| Champ | Valeur |
|-------|--------|
| **Nom** | Forum / forum des associations étudiantes |
| **Catégorie** | Étudiant |
| **Organisateur** | À sourcer — CROUS Reims-Châlons-Charleville / BDE campus |
| **Source** | Agenda CROUS, réseaux assos étudiantes Reims |
| **URL source** | À sourcer |
| **Date** | À confirmer terrain (rentrée / semaine assos typique — à valider) |
| **Lieu** | À confirmer terrain (campus, Maison de l'Étudiant, etc.) |
| **Contact** | À assigner |
| **Statut ops** | **PENDING** |
| **Validation terrain** | Non démarrée |
| **event_quality_score** | **NOT_READY** |

---

### E3 — Association

| Champ | Valeur |
|-------|--------|
| **Nom** | Bourse aux plantes / troc végétal solidaire |
| **Catégorie** | Association |
| **Organisateur** | À sourcer — association de quartier ou Maison des associations |
| **Source** | Réseau assos Reims, programmation quartiers |
| **URL source** | À sourcer |
| **Date** | À confirmer terrain |
| **Lieu** | À confirmer terrain (place, salle associative, jardin partagé) |
| **Contact** | À assigner |
| **Statut ops** | **PENDING** |
| **Validation terrain** | Non démarrée |
| **event_quality_score** | **NOT_READY** |

---

### E4 — Commerce

| Champ | Valeur |
|-------|--------|
| **Nom** | Portes ouvertes / journée commerçants centre-ville |
| **Catégorie** | Commerce |
| **Organisateur** | À sourcer — UR Commerces Reims ou partenaire pilote existant (Belga Queen, Pittaya, etc.) |
| **Source** | Partenaires RF-02A déjà signés — pas de nouveau partenaire fictif |
| **URL source** | À sourcer — communication org partenaire |
| **Date** | À confirmer terrain |
| **Lieu** | À confirmer terrain (périmètre commerçants, adresse tête de parcours) |
| **Contact** | À assigner — référent partenaire existant |
| **Statut ops** | **PENDING** |
| **Validation terrain** | Non démarrée |
| **event_quality_score** | **NOT_READY** |

---

### E5 — Sport

| Champ | Valeur |
|-------|--------|
| **Nom** | Tournoi sportif local (5v5 foot ou course solidaire) |
| **Catégorie** | Sport |
| **Organisateur** | À sourcer — club local / asso sport / équipement (Stade Auguste-Delaune, complexe MAIF) |
| **Source** | Calendriers clubs, mairie quartiers, fédérations locales |
| **URL source** | À sourcer |
| **Date** | À confirmer terrain |
| **Lieu** | À confirmer terrain (stade, gymnasium, parcours urbain) |
| **Contact** | À assigner |
| **Statut ops** | **PENDING** |
| **Validation terrain** | Non démarrée |
| **event_quality_score** | **NOT_READY** |

---

## Phase 2 — Grille de validation terrain

Pour passer **CONFIRMED**, cocher **les 5** avec preuve (email, PV, lien officiel, capture) :

| Critère | E1 | E2 | E3 | E4 | E5 |
|---------|----|----|----|----|-----|
| Existe réellement (source vérifiable) | ☐ | ☐ | ☐ | ☐ | ☐ |
| Date réelle confirmée | ☐ | ☐ | ☐ | ☐ | ☐ |
| Lieu réel confirmé (nom + adresse ou GPS) | ☐ | ☐ | ☐ | ☐ | ☐ |
| Organisateur réel identifié (org Yunicity ou lead) | ☐ | ☐ | ☐ | ☐ | ☐ |
| Autorisation publication Yunicity | ☐ | ☐ | ☐ | ☐ | ☐ |

**Résultat par événement :**

| ID | CONFIRMED | REJECTED | Motif rejet (si applicable) |
|----|-----------|----------|----------------------------|
| E1 Culture | 0 | 0 | — |
| E2 Étudiant | 0 | 0 | — |
| E3 Association | 0 | 0 | — |
| E4 Commerce | 0 | 0 | — |
| E5 Sport | 0 | 0 | — |

**Totaux RF-03B (à mettre à jour après terrain) :**

| Métrique | Valeur |
|----------|--------|
| **CONFIRMED** | **0 / 5** |
| **REJECTED** | **0 / 5** |
| **PUBLISHED** | **0 / 5** |

---

## Phase 3 — Event Quality Score (ops)

Score **opérationnel** — pas de nouveau développement backend. S'appuie sur les mêmes critères que `event_readiness()` (RF-03A) une fois la fiche créée.

### Critères (1 point chacun)

| # | Critère | Seuil « point accordé » |
|---|---------|-------------------------|
| 1 | **Date connue** | `starts_at` confirmé avec l'organisateur |
| 2 | **Lieu connu** | `location_name` + adresse ou coordonnées |
| 3 | **Description suffisante** | ≥ 25 caractères, contenu réel, hors copy pilote |
| 4 | **Image disponible** | `cover_image_url` ou visuel fourni par l'org (optionnel pilote : point si absent mais description riche) |
| 5 | **Organisateur identifié** | Org liée en base, vérifiée ou en cours |

### Barème

| Score | Niveau | Action |
|-------|--------|--------|
| **5/5** | **READY** | Éligible publication + contribution territory health |
| **3–4/5** | **PARTIAL** | Compléter avant publication publique |
| **0–2/5** | **NOT_READY** | Ne pas publier — risque PLACEHOLDER |

### État actuel (aucune donnée terrain saisie)

| Événement | Date | Lieu | Description | Image | Org | Score | Niveau |
|-----------|------|------|-------------|-------|-----|-------|--------|
| E1 Culture | ☐ | ☐ | ☐ | ☐ | ☐ | 0/5 | NOT_READY |
| E2 Étudiant | ☐ | ☐ | ☐ | ☐ | ☐ | 0/5 | NOT_READY |
| E3 Association | ☐ | ☐ | ☐ | ☐ | ☐ | 0/5 | NOT_READY |
| E4 Commerce | ☐ | ☐ | ☐ | ☐ | ☐ | 0/5 | NOT_READY |
| E5 Sport | ☐ | ☐ | ☐ | ☐ | ☐ | 0/5 | NOT_READY |

**Vérification produit post-création :** admin `/events/{id}` → panneau readiness doit afficher **Prêt** et message *« contribue à maintenir l'agenda actif »*.

---

## Phase 4 — Pipeline publication

```
Découverte → Validation → Création Yunicity → Publication → Suivi
```

### Étapes détaillées

| Étape | Qui | Délai cible | Livrable | Où vérifier |
|-------|-----|-------------|----------|-------------|
| **1. Découverte** | Ops / coordinateur local | J0–J3 | Fiche E1–E5 remplie, statut PENDING → CONTACTED | Ce document |
| **2. Validation** | Ops + organisateur | J3–J10 | 5 critères terrain cochés, statut CONFIRMED ou REJECTED | Grille § Phase 2 |
| **3. Création Yunicity** | Partenaire (portail) ou staff (admin) | J10–J12 | Brouillon ou `pending_review` avec champs réels | Admin `/events` ou portail org |
| **4. Publication** | Staff modération | J12–J14 | `approved`, futur, readiness READY | Admin fiche + API publique |
| **5. Suivi** | Ops | J14+ | Intérêt, annulations, mise à jour dates | Cockpit + analytics |

### Rôles (RACI simplifié)

| Rôle | Découverte | Validation | Création | Publication | Suivi |
|------|:----------:|:----------:|:--------:|:-----------:|:-----:|
| **Ops terrain** | R/A | R/A | C | I | R |
| **Organisateur** | C | A | R | I | C |
| **Staff Yunicity** | I | C | C | R/A | C |
| **CTO / produit** | I | I | I | A (GO prod) | I |

_Légende : R = Responsible, A = Accountable, C = Consulted, I = Informed_

### Points de contrôle obligatoires

1. **Avant création** — statut CONFIRMED + quality score ≥ PARTIAL (idéal READY).
2. **Avant approve** — `event_readiness = ready` dans admin.
3. **Après publication** — visible `GET /api/v1/events?city=Reims` + cockpit `territory_event_health`.
4. **Interdit** — seed automatique, dates `now + 14j`, description pilote générique.

### Commandes de vérification (recette / prod)

```bash
# Futurs publiés réels (hors placeholder)
curl -sS "$API/api/v1/events?city=Reims&limit=50" \
  | jq '[.items[] | select(.description | test("moment pilote"; "i") | not)] | length'

# Territory health
curl -sS -H "Authorization: Bearer $STAFF_TOKEN" \
  "$API/api/v1/admin/cockpit/summary?city=Reims" \
  | jq '.signals.territory_event_health'
```

---

## Phase 5 — Objectif pilote

### Quota par catégorie (minimum 1 chacune)

| Catégorie | Cible | Statut RF-03B |
|-----------|-------|---------------|
| Culture | E1 | PENDING |
| Étudiant | E2 | PENDING |
| Association | E3 | PENDING |
| Commerce | E4 | PENDING |
| Sport | E5 | PENDING |

### Impact Territory Health

| Scénario | Futurs publiés réels | Health attendu |
|----------|---------------------|----------------|
| **Aujourd'hui** (seed pilote PLACEHOLDER) | 0 réel (+ 4 placeholder) | **WARNING** |
| **+1 réel publié** | 1 | WARNING |
| **+4 réels** (sans retirer placeholder) | 4 | WARNING |
| **≥ 5 réels publiés à venir** | 5+ | **HEALTHY** 🟢 |

**Note ops :** les 4 événements seed pilote PLACEHOLDER comptent dans `events_upcoming` mais **ne nourrissent pas** la vitalité réelle. Stratégie recommandée :

1. Publier 5 événements CONFIRMED réels ;
2. Archiver ou annuler les 4 placeholders seed en recette/prod une fois remplacés ;
3. Vérifier cockpit → **Agenda vivant**.

---

## Journal de progression (à remplir)

| Date | Événement | Action | Statut avant → après | Opérateur | Preuve / lien |
|------|-----------|--------|----------------------|-----------|---------------|
| _vide_ | — | — | — | — | — |

---

## Exclusions respectées (RF-03B)

- ❌ Nouveau backend / frontend
- ❌ Ticketing, paiement, réservation
- ❌ Local Video, Passport Economy (RF-01A)
- ❌ Événements fictifs ou données inventées
- ❌ Publication automatique

---

## Références

- Pipeline RF-03A : `docs/ops/RF-03A-reims-event-pipeline.md`
- Audit : `docs/qa/RF-03A-events-audit.md`
- Readiness produit : `backend/app/core/event_readiness.py`
- Territory health : `backend/app/core/territory_event_health.py`
- Partenaires pilotes (E4) : offres RF-02A — pas de nouveau partenaire fictif

---

## Prochaine action ops (J0)

1. Assigner owner + 5 contacts terrain (1 par catégorie).
2. Passer E1 en **CONTACTED** avec première source URL **réelle** documentée.
3. Ne pas créer de fiche Yunicity tant que **CONFIRMED** + quality score insuffisant.
4. Mettre à jour ce document après chaque contact — **aucune invention**.
