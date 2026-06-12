# Backups PostgreSQL — Yunicity (QA-05B)

## Stratégie minimale

| Paramètre | Valeur |
|-----------|--------|
| Fréquence | Quotidien à **03:00 UTC** |
| Rétention quotidienne | **7** dumps |
| Rétention hebdomadaire | **4** dumps (copie le dimanche) |
| Format | `pg_dump` plain SQL, compressé `.sql.gz` |
| Stockage recommandé | OVH Object Storage ou Cloudflare R2 (S3-compatible) |

## Scripts

| Script | Rôle |
|--------|------|
| `scripts/backup.sh` | Dump + rotation locale + upload S3 optionnel |
| `scripts/restore.sh` | Restauration guidée sur recette/preprod |

## Variables

| Variable | Requis | Description |
|----------|--------|-------------|
| `DATABASE_URL` | Oui | URL PostgreSQL (`postgresql+asyncpg://...` accepté) |
| `BACKUP_DIR` | Non | Défaut `./backups/postgres` |
| `BACKUP_RETENTION_DAILY` | Non | Défaut `7` |
| `BACKUP_RETENTION_WEEKLY` | Non | Défaut `4` |
| `BACKUP_S3_BUCKET` | Non | Bucket S3/R2/OVH |
| `BACKUP_S3_ENDPOINT` | Non | Endpoint S3-compatible (R2/OVH) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Si S3 | Clés injectées par l'hébergeur |

## Backup manuel

```bash
export DATABASE_URL='postgresql+asyncpg://user:pass@host:5432/yunicity_prod'
./scripts/backup.sh
```

## Cron (serveur ops)

```cron
0 3 * * * cd /opt/yunicity && set -a && . /etc/yunicity/backup.env && set +a && ./scripts/backup.sh >> /var/log/yunicity-backup.log 2>&1
```

Fichier `/etc/yunicity/backup.env` (permissions `600`, root/ops uniquement) :

```bash
DATABASE_URL=...
BACKUP_DIR=/var/backups/yunicity
BACKUP_S3_BUCKET=yunicity-prod-backups
BACKUP_S3_ENDPOINT=https://...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

## Restore test (recette)

Procédure mensuelle recommandée :

1. Provisionner une base `yunicity_recette_restore_test`.
2. Arrêter l'API pointant vers cette base.
3. Restaurer :

```bash
export DATABASE_URL='postgresql+asyncpg://user:pass@host:5432/yunicity_recette_restore_test'
export APP_ENV=recette
./scripts/restore.sh backups/postgres/daily/yunicity-YYYYMMDDTHHMMSSZ.sql.gz
```

4. Vérifier :

```bash
cd backend && uv run alembic current
API_BASE=https://api-recette.yunicity.fr WEB_BASE=https://recette.yunicity.fr bash scripts/smoke-check.sh
```

5. Documenter la date du test dans le ticket ops.

## Sécurité

- Ne jamais committer `DATABASE_URL` ni clés S3.
- Chiffrer le bucket (SSE-S3 ou équivalent).
- Restreindre l'accès IAM aux seuls dumps.
- Les logs de backup ne doivent pas contenir de secrets.
