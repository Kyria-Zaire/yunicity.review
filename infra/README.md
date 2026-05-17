# Infra — Yunicity

Docker, environnements et déploiement.

## Contenu

| Dossier | Rôle |
|---------|------|
| [docker/](docker/) | Compose, Dockerfiles (TICKET-004) |
| [environments/](environments/) | dev, recette, preprod, prod |

## Promotion

```
dev → recette → preprod → prod
```

Jamais de modification directe non tracée en production.

## Secrets

- Variables injectées par l’hébergeur / CI
- Fichiers `.env` locaux gitignorés
- Modèles uniquement via `.env.example` à la racine des apps (TICKET-002+)
