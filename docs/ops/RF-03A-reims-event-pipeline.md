# RF-03A — Pipeline événements Reims

| Champ | Valeur |
|-------|--------|
| **Ticket** | RF-03A |
| **Objectif** | Identifier ≥ 5 événements **réels** pour vitalité territoriale |
| **GO seed** | **NON** — aucun événement fictif injecté par RF-03A |

---

## Contexte

- Territory health actuel : **WARNING** (4 futurs pilotes PLACEHOLDER)
- Seuil **HEALTHY** : 5 événements publiés à venir avec contenu REAL
- RF-03A mesure et rend visible — **n'ajoute pas** d'événements en base

---

## Cibles pipeline (5 événements réels minimum)

| # | Nom proposé | Catégorie | Source terrain | Statut | Potentiel Yunicity |
|---|-------------|-----------|----------------|--------|-------------------|
| 1 | Nuit des musées — visites nocturnes | **Culture** | Musées de Reims / Ville de Reims | **PENDING** | Élevé — dates fixes, lieu public, forte visibilité carte |
| 2 | Forum associations étudiantes | **Étudiant** | CROUS / assos campus | **PENDING** | Élevé — cible 18–25, flux récurrent |
| 3 | Bourse aux plantes solidaire | **Association** | Associations quartier / Maison des associations | **PENDING** | Moyen — lieu + horaire confirmables |
| 4 | Portes ouvertes commerçants centre-ville | **Commerce** | UR Commerces / partenaires pilotes existants | **PENDING** | Élevé — lien partenaires RF-02 sans nouveau partenaire |
| 5 | Tournoi sportif local (5v5 / running) | **Sport** | Clubs / MAIF Stadium / assos sport | **PENDING** | Moyen — tier lieu + inscription sur place |

**Statuts :** PENDING → SOURCED → CONFIRMED → INTEGRATED (workflow ops, pas automatisé)

---

## Critères d'intégration Yunicity (REAL)

Chaque événement intégré doit passer `event_readiness = ready` :

- [ ] Titre explicite (≥ 3 caractères)
- [ ] Description opérationnelle (≥ 25 car., hors copy pilote)
- [ ] `starts_at` / `ends_at` confirmés avec l'organisateur
- [ ] `location_name` + adresse ou coordonnées
- [ ] Org existante ou lead converti (pas de partenaire fictif)
- [ ] Modération `approved` après validation staff
- [ ] `contributes_to_territory = true` (futur + publié)

---

## Checklist par événement (à remplir ops)

| Champ | E1 Culture | E2 Étudiant | E3 Asso | E4 Commerce | E5 Sport |
|-------|----------|-------------|---------|-------------|----------|
| Contact terrain | ☐ | ☐ | ☐ | ☐ | ☐ |
| Date confirmée | ☐ | ☐ | ☐ | ☐ | ☐ |
| Lieu confirmé | ☐ | ☐ | ☐ | ☐ | ☐ |
| Description validée | ☐ | ☐ | ☐ | ☐ | ☐ |
| Org liée | ☐ | ☐ | ☐ | ☐ | ☐ |
| Fiche admin créée | ☐ | ☐ | ☐ | ☐ | ☐ |
| Visible carte / agenda | ☐ | ☐ | ☐ | ☐ | ☐ |
| Readiness READY | ☐ | ☐ | ☐ | ☐ | ☐ |

---

## Méthode d'intégration (sans seed fictif)

1. **Sourcing** — identifier événement réel (calendrier ville, assos, partenaires).
2. **Validation terrain** — contact + confirmation date/lieu/conditions.
3. **Création** — portail partenaire ou admin staff (`POST /admin/local-events` ou org `/me/events`).
4. **Modération** — approve si org vérifiée ou après review.
5. **Vérification** — readiness READY + territory health ≥ WARNING puis HEALTHY.

**Interdit RF-03A :** upsert seed avec copy générique, dates glissantes `now + 14j`, descriptions pilote.

---

## Commandes de vérification post-intégration

```bash
# API publique — futurs uniquement
curl -sS "$API/api/v1/events?city=Reims&limit=50" | jq '.items | length'

# Cockpit staff
curl -sS -H "Authorization: Bearer $STAFF_TOKEN" \
  "$API/api/v1/admin/cockpit/summary?city=Reims" \
  | jq '.signals.territory_event_health'

# Analytics
curl -sS -H "Authorization: Bearer $STAFF_TOKEN" \
  "$API/api/v1/admin/analytics/summary?city=Reims&period=30d" \
  | jq '.events | {published, upcoming, past}'
```

**Résultat attendu HEALTHY :** `upcoming >= 5`, `territory_event_health.status = healthy`.

---

## Rollback

- Annuler événement : admin `POST /admin/local-events/{id}/cancel`
- Rejeter brouillon non validé : `reject` avec motif
- Pas de rollback seed automatique — événements créés manuellement traçables via audit admin

---

## Références

- Audit : `docs/qa/RF-03A-events-audit.md`
- Readiness : `backend/app/core/event_readiness.py`
- Health : `backend/app/core/territory_event_health.py`
- Seed pilote (PLACEHOLDER — à remplacer par pipeline) : `backend/app/db/seeds/reims_partner_events.py`
