# Supabase discovery report

**Source:** SQL dump `C:\Users\kyria\yunicity\backend\tests\fixtures\supabase_sample_dump.sql`

## Summary

- Tables discovered: **2**
- Partner-relevant (score ≥ 3): **1**

## Partner-relevant tables (heuristic)

### `public.landing_partners` (score 12)
- nom de table contient 'partner'; nom de table contient 'landing'; 7 colonne(s) type partenaire/lead
- Row count: unknown

| Column | Type | Nullable |
|--------|------|----------|
| `id` | uuid | yes |
| `company_name` | text | no |
| `city` | text | yes |
| `phone` | text | yes |
| `email` | text | yes |
| `instagram_handle` | text | yes |
| `notes` | text | yes |
| `signed` | boolean | yes |
| `created_at` | timestamptz | yes |

## Full table inventory

| Schema | Table | Rows | Relevance |
|--------|-------|------|-----------|
| `public` | `landing_partners` | ? | 12 |
| `public` | `auth_users` | ? | 1 |

_Généré par `scripts/supabase_discovery.py` — valider le mapping dans `supabase_partner_mapping.md`._
