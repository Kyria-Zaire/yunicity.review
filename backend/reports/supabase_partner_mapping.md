# Supabase → partner_leads mapping

Document de référence TICKET-250. Le schéma Supabase réel est découvert via
`scripts/supabase_discovery.py` — ne pas faire confiance aux noms sans validation.

## Règles globales

| Règle | Valeur |
|-------|--------|
| `source` | Toujours `landing_page` |
| `status` | `signed` si convention signé détectée, sinon `interested` |
| Organizations | **Jamais** créées ni vérifiées par ce pipeline |
| Doublons | Skip (pas d’écrasement) — clé CRM + Instagram |

## Mapping colonnes (heuristique)

| Colonne Supabase (exemples) | `partner_leads` | Notes |
|----------------------------|-----------------|-------|
| `company_name`, `business_name`, `nom`, `raison_sociale` | `name` | Requis (≥ 2 car.) |
| `ville`, `city` | `city` | Suspicion si absent |
| `phone`, `telephone`, `tel`, `mobile` | `phone` | |
| `email`, `mail` | `email` | Validé format |
| `instagram`, `instagram_handle`, `insta` | `instagram` | Normalisé (@ retiré) |
| `website`, `site`, `url` | `website` | |
| `address`, `adresse` | `address` | |
| `contact_name`, `contact`, `prenom_nom` | `contact_name` | |
| `notes`, `message`, `comment`, `description` | `notes` | |
| `category`, `categorie` | `tags` | + `supabase-import` |
| `type`, `organization_type` | `organization_type` | Mapping partiel (commerce, …) |
| `status`, `signed`, `is_signed` | `status` | Voir tokens signé ci-dessous |
| `created_at`, `inserted_at` | `metadata.supabase_created_at` | |
| `id`, `uuid` | `metadata.supabase_id` | Traçabilité |

## Statut `signed` vs `interested`

Valeurs considérées comme **signé** : `signed`, `signé`, `partenaire`, `active`, `validated`, `yes`, `true`, `1`, etc.

Sinon : `interested`.

## Tags automatiques

- `supabase-import`
- `source-table:{table_name}`
- Catégorie / type de formulaire si présent

## Détection doublons

1. **Lot** : même `name` + `city` + `phone` normalisés
2. **CRM** : contrainte unique existante `uq_partner_leads_name_city_phone`
3. **Instagram** : handle normalisé (batch + CRM)

## Métadonnées

```json
{
  "supabase_table": "landing_partners",
  "supabase_id": "...",
  "supabase_row_index": 0,
  "imported_via": "supabase_partner_import",
  "suspicious_flags": ["missing_city"]
}
```
