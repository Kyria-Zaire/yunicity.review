# RF-03A — Audit événements Reims

| Champ | Valeur |
|-------|--------|
| **Ticket** | RF-03A |
| **Feature** | FEATURE-REALITY-FIX-V1 |
| **Date** | 2026-06-18 |
| **Scope** | `LocalEvent` — audit territorial, sans nouveau moteur |

---

## Synthèse

| Indicateur | État actuel (pilote Reims) |
|------------|---------------------------|
| **Territory health** | **WARNING** (4 événements à venir si seed pilote actif) |
| **Seuil HEALTHY** | ≥ 5 événements publiés à venir |
| **Contenu réel exploitable** | **0 / 4** événements pilotes seed = REAL |
| **Moteur Event** | Existant — modération 3 états + annulation booléenne |

**Diagnostic RC-02 / RC-03 / RC-04 :** la carte et le cockpit comptent des événements, mais le territoire **paraît peu vivant** car le contenu pilote est majoritairement **PLACEHOLDER** et les analytics mélangeaient stock et flux.

---

## Vocabulaire admin vs DB

| Terme audit / UI | Implémentation réelle |
|------------------|----------------------|
| **draft** | N'existe pas (création → `pending_review` ou `approved` si org vérifiée) |
| **pending** | `moderation_status = pending_review` |
| **published** | `approved` + `is_cancelled = false` |
| **cancelled** | `is_cancelled = true` |
| **archived** | `moderation_status = rejected` |
| **futurs** | `starts_at >= now` + publiés |
| **passés** | `starts_at < now` + publiés |

---

## Inventaire par catégorie

### Pending (`pending_review`)

| Classification | Volume typique | Source | Qualité | Utilisation réelle |
|----------------|----------------|--------|---------|-------------------|
| PARTIAL | Variable | Créations org non vérifiées | Titre/date souvent OK, modération requise | File admin `/events` |
| REAL | Rare | Orgs vérifiées en attente staff | Complet | Aucune visibilité publique tant que non approuvé |

### Published (`approved`, non annulés)

| Sous-catégorie | Classification dominante | Volume seed pilote | Source | Utilisation |
|----------------|-------------------------|-------------------|--------|-------------|
| **Futurs** | PLACEHOLDER (4/4 pilotes) | 4 | `reims_partner_events.py` | Carte, agenda public, cockpit `events_upcoming` |
| **Passés** | PARTIAL / REAL mixte | Variable | Historique DB + démo | Admin uniquement (hors agenda public) |

**Détail seed pilote (`reims_partner_events.py`) — tous PLACEHOLDER :**

| Titre seed | Description | Classification | Readiness attendue |
|------------|-------------|----------------|-------------------|
| Afterwork découverte | « Un moment pilote proposé… » | PLACEHOLDER | NOT_READY |
| Découverte culinaire | idem | PLACEHOLDER | NOT_READY |
| Atelier ressources locales | idem | PLACEHOLDER | NOT_READY |
| Conseils style & entretien | idem | PLACEHOLDER | NOT_READY |

### Cancelled

| Classification | Source | Utilisation |
|----------------|--------|-------------|
| REAL (si contenu complet avant annulation) | Staff `POST /admin/local-events/{id}/cancel` | Retiré du catalogue ; 410 sur détail public |

### Archived (`rejected`)

| Classification | Source | Utilisation |
|----------------|--------|-------------|
| PARTIAL | Rejet modération staff | Admin audit ; invisible public |

### Demo (`--demo` seed uniquement)

| Volume | Source | Classification | Note |
|--------|--------|----------------|------|
| 3 événements | `reims_demo_content.py` | PARTIAL → REAL possible | **Bloqué prod** — ne pas utiliser comme carburant territorial |

---

## Event readiness (RF-03A)

Fonction : `event_readiness()` — `backend/app/core/event_readiness.py`

| Niveau | Critères clés |
|--------|---------------|
| **READY** | Titre, description, lieu, publié, public, à venir, non placeholder |
| **PARTIAL** | Contenu partiel ou passé ou en attente modération |
| **NOT_READY** | Placeholder, annulé, ou champs critiques manquants |

Détection placeholder : description pilote générique + titres vagues seed.

---

## Territory event health (RF-03A)

Fonction : `territory_event_health(upcoming_count)`

| Statut | Règle | Signal cockpit |
|--------|-------|----------------|
| **HEALTHY** | ≥ 5 futurs publiés | 🟢 Agenda vivant |
| **WARNING** | 1–4 futurs publiés | 🟡 Agenda faible |
| **CRITICAL** | 0 futur publié | 🔴 Aucun événement à venir |

**État Reims post-seed pilote :** 4 futurs → **WARNING** (données réelles, pas fictives).

---

## Analytics — séparation stock / flux (RC-04)

| Indicateur | Type | Calcul |
|------------|------|--------|
| Événements publiés | **Stock** | `approved` + non annulés |
| Événements à venir | **Flux** | publiés + `starts_at >= now` |
| Événements terminés | **Stock historique** | publiés + `starts_at < now` |

---

## Surfaces impactées RF-03A

| Surface | Enrichissement |
|---------|----------------|
| Cockpit | `territory_event_health` dans signals |
| Analytics | 3 KPI événements distincts |
| Admin `/events` | Colonne readiness + panneau contribution territoriale |
| API admin | `readiness` sur list + detail |

---

## Exclusions respectées

- Pas de ticketing, réservation, paiement
- Pas de spend YM / RF-01A
- Pas de seed artificiel ajouté
- Pas de nouveaux partenaires fictifs

---

## Prochaine étape

**RF-03B** (hors scope 03A) — pipeline Reims : intégrer ≥ 5 événements **réels** sourcés terrain (`docs/ops/RF-03A-reims-event-pipeline.md`).
