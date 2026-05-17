# Environnement — PREPROD

## Rôle

**Simulation production** — configuration et données proches du réel.

## Caractéristiques

| Aspect | Politique |
|--------|-----------|
| Données | Subset **anonymisé** ou synthétique haute fidélité — pas de PII prod |
| Config | Même artefact de build que prod (variables d’environnement différentes) |
| Paiements | Stripe test avec parcours 3DS |
| Charge | Tests smoke, perf légers |
| Migrations | Testées ici avant prod ; dry-run obligatoire |

## Miroir prod

- Topologie et versions alignées sur prod (Postgres/PostGIS, Redis, API)
- Secrets injectés par le gestionnaire de secrets de l’hébergeur — pas de `.env` commité
- `DEBUG=false`, logs sans stack traces client

## Obligatoire avant prod

- [ ] Migrations testées en dry-run sur preprod
- [ ] Rollback documenté et exercé
- [ ] Backup DB récent validé (restauration testée)
- [ ] Monitoring et alertes configurés
- [ ] Review CTO si changement sensible

## Base de données

Nom cible : `yunicity_preprod`.
