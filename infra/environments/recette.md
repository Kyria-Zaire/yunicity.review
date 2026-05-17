# Environnement — RECETTE

## Rôle

**Validation fonctionnelle** avec données de test représentatives.

## Caractéristiques

| Aspect | Politique |
|--------|-----------|
| Données | Anonymisées ou générées — jamais prod brute |
| Déploiement | Pipeline CI/CD après merge `develop` |
| Paiements | Stripe test / sandbox |
| Utilisateurs | Équipe produit, QA, beta interne |
| BMAD | Phase **MEASURE** principale |

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

Nom cible : `yunicity_recette`.
