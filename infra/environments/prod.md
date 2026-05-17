# Environnement — PROD

## Rôle

**Stabilité maximale** — utilisateurs réels, données réelles.

## Caractéristiques

| Aspect | Politique |
|--------|-----------|
| Données | Production réelle |
| Secrets | **Gestionnaire de secrets** (pas de fichiers `.env` dans l’image ou le dépôt) |
| Backups | Automatisés, chiffrés, test de restauration régulier |
| Rollback | Plan documenté par release ; migrations réversibles quand possible |
| Accès | Moindre privilège, MFA, journalisation |
| Paiements | Stripe live |
| Logs | Sans PII ; pas de stack traces exposées au client |
| HTTPS | Obligatoire |

## Règles strictes

- **Jamais** de hack temporaire directement en prod
- **Jamais** de commit de secrets
- Promotion uniquement depuis preprod validée
- Hotfix : branche `hotfix/*` + validation **CTO**
- **Jamais** de données prod brutes en dev/recette

## Avant tout changement destructif

1. Backup base de données
2. Fenêtre de maintenance si nécessaire
3. Plan de rollback testé
4. Feature flag si changement risqué

## Incidents

- Monitoring 5xx, erreurs auth, échecs webhooks
- Procédure rollback documentée dans le ticket / PR

## Base de données

Nom cible : `yunicity_prod`.

## BMAD

Phase **RELEASE** puis **MEASURE → ANALYZE → DECIDE** sur métriques réelles.
