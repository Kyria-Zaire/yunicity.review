# Dry-run complet — TICKET-260

**Statut :** NON EXÉCUTÉ (import réel bloqué)  
**Date :** 2026-05-18

## Cause

Identique à `dry_run_limit_10.md` — restore Supabase requis.

## Commande prévue

```bash
# SANS --apply
docker compose exec backend python scripts/import_supabase_partner_leads.py \
  --source-table <TABLE_VALIDEE>
```

Rapport généré : `reports/supabase_partner_import_report.md`

## Résultats

_À compléter après exécution réelle._

## Confirmation

- [ ] Aucun `--apply` exécuté lors de ce dry-run
- [ ] `organizations` count stable
