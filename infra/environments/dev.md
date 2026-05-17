# Environnement — DEV

## Rôle

**Expérimentation** locale des développeurs.

## Caractéristiques

| Aspect | Politique |
|--------|-----------|
| Données | Seed, fixtures, SQLite ou PostgreSQL Docker local |
| Secrets | `.env` local gitignoré ; copier depuis `.env.example` |
| Paiements | Mode test Stripe uniquement |
| Logs | Verbeux, stack traces autorisées côté dev |
| Accès | Équipe dev |

## Services typiques (TICKET-004)

- API : `http://localhost:8000`
- Web : `http://localhost:3000`
- PostgreSQL : port local mappé (ex. 5432)
- Redis : port local mappé (ex. 6379)

## Règles

- Pas de données production
- Pas de hack partagé comme solution permanente
- Hot reload activé

## Base de données

Nom cible : `yunicity_dev` (à confirmer TICKET-002).
