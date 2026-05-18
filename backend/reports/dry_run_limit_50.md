# Dry-run limit 50 — TICKET-260

**Statut :** NON EXÉCUTÉ (import réel bloqué)  
**Date :** 2026-05-18

## Cause

Identique à `dry_run_limit_10.md` — restore Supabase requis.

## Commande prévue

```bash
docker compose exec backend python scripts/import_supabase_partner_leads.py \
  --source-table <TABLE_VALIDEE> \
  --limit 50
```

## Résultats

_À compléter après exécution réelle._
