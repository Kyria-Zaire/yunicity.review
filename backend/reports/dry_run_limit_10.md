# Dry-run limit 10 — TICKET-260

**Statut :** NON EXÉCUTÉ (import réel bloqué)  
**Date :** 2026-05-18

## Cause

- Backup Supabase non restauré (port 5435 fermé).
- `SUPABASE_DATABASE_URL` non configurée.

## Commande prévue

```bash
docker compose exec backend python scripts/import_supabase_partner_leads.py \
  --source-table <TABLE_VALIDEE> \
  --limit 10
```

## Résultats attendus (à compléter après restore)

| Métrique | Valeur |
|----------|--------|
| total_scanned | |
| imported (would) | |
| skipped_duplicates | |
| invalid | |
| suspicious | |

## Compteurs CRM

| Table | Avant | Après dry-run |
|-------|------:|--------------:|
| partner_leads | 1 | _(inchangé attendu)_ |
| organizations | 0 | _(inchangé attendu)_ |
