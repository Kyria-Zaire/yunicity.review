# Environnement — PREPROD

## Rôle

**Simulation production** — configuration et données proches du réel.

## Caractéristiques

| Aspect | Politique |
|--------|-----------|
| Données | Subset anonymisé ou synthétique haute fidélité |
| Config | Même build artefact que prod (variables différentes) |
| Paiements | Stripe test avec parcours 3DS |
| Charge | Tests smoke, perf légers |
| Migrations | **Dry-run obligatoire** avant prod |

## Obligatoire avant prod

- [ ] Migrations testées en dry-run
- [ ] Rollback documenté
- [ ] Backup DB récent validé
- [ ] Monitoring et alertes configurés
- [ ] Review CTO si changement sensible

## Base de données

Nom cible : `yunicity_preprod`.
