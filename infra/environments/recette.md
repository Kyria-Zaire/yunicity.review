# Environnement — RECETTE

## Rôle

**Validation fonctionnelle** avec données de test représentatives.

## Caractéristiques

| Aspect | Politique |
|--------|-----------|
| Données | Anonymisées ou générées — **jamais prod brute** |
| Base | Instance **séparée** de dev/preprod/prod (`yunicity_recette`) |
| Déploiement | Pipeline CI/CD après merge `develop` (hors scope TICKET-004) |
| Paiements | Stripe test / sandbox |
| Utilisateurs | Équipe produit, QA, beta interne |
| BMAD | Phase **MEASURE** principale |

## Données de test

- Jeux de données dédiés recette (fixtures, générateurs)
- Refresh périodique depuis snapshots **anonymisés** uniquement
- Interdiction d’importer un dump production non traité

## Critères d’entrée

- PR mergée
- CI verte
- Migrations appliquées automatiquement
- Checklist sécurité si zone rouge

## Critères de sortie vers preprod

- Critères d’acceptation PRD validés
- Pas de P0 ouvert
- Review sécurité OK si applicable

## Base de données

Nom cible : `yunicity_recette` (hébergée hors Docker dev local).
