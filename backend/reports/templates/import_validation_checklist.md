# Import validation checklist — Supabase → partner_leads

**Ticket :** TICKET-251  
**Ne pas committer ce fichier rempli** (copier dans `imports/YYYYMMDD/` hors repo si besoin).

---

## Métadonnées opération

| Champ | Valeur |
|-------|--------|
| Date | |
| Opérateur | |
| Reviewer | |
| Approbation CTO | ☐ Oui — référence : |
| Table source Supabase | |
| `SUPABASE_DATABASE_URL` (port) | ex. localhost:**5435** |
| `DATABASE_URL` Yunicity (port) | ex. localhost:**5434** |
| Backup CRM avant apply | ☐ Fichier : |

---

## Discovery

| Étape | OK | Notes |
|-------|----|-------|
| Discovery exécutée | ☐ | |
| Rapport `supabase_discovery_report.md` relu | ☐ | |
| Table source validée | ☐ | |
| Mapping `supabase_partner_mapping.md` validé | ☐ | |

---

## Dry-run — limit 10

| Métrique | Valeur |
|----------|--------|
| Total scanned | |
| Imported (would) | |
| Duplicates skipped | |
| Invalid | |
| Suspicious | |

| Étape | OK | Notes |
|-------|----|-------|
| Échantillon 10 lignes revu | ☐ | |
| Lignes suspectes acceptées | ☐ | |

---

## Dry-run — limit 50

| Métrique | Valeur |
|----------|--------|
| Total scanned | |
| Imported (would) | |
| Duplicates skipped | |
| Invalid | |
| Suspicious | |

| Étape | OK | Notes |
|-------|----|-------|
| Échantillon 50 lignes revu | ☐ | |
| Doublons CRM acceptés | ☐ | |

---

## Dry-run — complet

| Métrique | Valeur |
|----------|--------|
| Total scanned | |
| Imported (would) | |
| Duplicates skipped | |
| Invalid | |
| Suspicious | |

| Étape | OK | Notes |
|-------|----|-------|
| Rapport `supabase_partner_import_report.md` archivé | ☐ | |
| Aucune organization ne sera créée (confirmé) | ☐ | |

---

## Apply (uniquement si toutes les cases ci-dessus)

| Métrique | Valeur |
|----------|--------|
| Imported (réel) | |
| Duplicates skipped | |
| Invalid | |

| Étape | OK | Notes |
|-------|----|-------|
| `--apply` exécuté à : | ☐ | |
| Post-import QA (runbook §9) | ☐ | |
| Count organizations inchangé | ☐ | |

---

## Signatures

| Rôle | Nom | Date |
|------|-----|------|
| Opérateur | | |
| Reviewer | | |
| CTO | | |

---

## Anomalies / décisions

_Documenter ici toute ligne forcée, skip manuel, ou écart au mapping._

```
