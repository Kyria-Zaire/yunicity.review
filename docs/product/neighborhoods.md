# Quartiers & territoires — produit

> **PRD :** `docs/prd/PRD-601-neighborhoods-territorial-identity.md`  
> **Backend :** TICKET-602 — `docs/architecture/neighborhood-foundation.md`

## En une phrase

Les quartiers Yunicity sont une **couche de contexte local** (ambiance, nom, description) qui enrichit le fil, les événements et le passport — **sans** communautés fermées ni compétition territoriale.

## Ce que l’utilisateur voit (MVP)

- Badge discret sur le fil : `Boulingrin · Reims` via `neighborhood_summary`.
- Fiche quartier : description humaine, stats légères, événements et lieux à venir.
- Exploration : liste des quartiers actifs d’une ville (`GET /neighborhoods?city=Reims`).

## Ce que l’utilisateur ne voit pas

- Classement des quartiers.
- Feed « uniquement mon quartier » par défaut.
- Création de quartier par les citoyens ou partenaires.
- Groupes ou chat de quartier.

## Gouvernance

- Catalogue géré par **staff** (`moderation.manage` ou `system.admin`).
- Seed Reims : `python -m app.db.seeds` (6 quartiers pilotes).
- Désactivation = `is_active=false` (pas de suppression destructive).

## Suite produit (hors 602)

- Passport : quartiers croisés (TICKET-605+).
- Filtre opt-in sur le fil.
- Carte éditoriale statique (PRD-601 §12).
