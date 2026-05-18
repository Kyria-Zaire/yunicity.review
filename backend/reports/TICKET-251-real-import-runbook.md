# TICKET-251 — Runbook import données réelles Supabase

**Statut :** procédure opérationnelle officielle  
**Périmètre :** migration historique Supabase → `partner_leads` (Yunicity CRM)  
**Hors scope :** auth users, storage, events, feed, analytics, conversion organizations

---

## 1. Architecture import

```text
┌─────────────────────┐         lecture seule          ┌──────────────────────┐
│  PostgreSQL         │  ───────────────────────────►  │  Scripts TICKET-250  │
│  Supabase restauré  │       SUPABASE_DATABASE_URL    │  discovery + import  │
│  (port dédié)       │                                └──────────┬───────────┘
└─────────────────────┘                                           │
                                                                  │ dry-run / --apply
                                                                  ▼
                                                       ┌──────────────────────┐
                                                       │  PostgreSQL Yunicity │
                                                       │  partner_leads       │
                                                       │  (DATABASE_URL)      │
                                                       └──────────────────────┘
```

| Flux | Rôle |
|------|------|
| **Discovery** | Inventorie tables/colonnes Supabase sans écrire dans Yunicity |
| **Mapping** | Heuristiques documentées dans `supabase_partner_mapping.md` |
| **Dry-run** | Simule l’import (compteurs, doublons, invalides) — **aucune écriture CRM** |
| **Apply** | Insère uniquement les leads validés — **jamais d’organizations** |

**Règles non négociables :**

- Ne jamais écraser un `partner_lead` existant (skip doublon).
- Ne jamais créer / modifier `organizations` ni `users`.
- Pas de merge silencieux : toute ligne ambiguë → skip ou invalid, jamais overwrite.
- Dry-run par défaut ; `--apply` uniquement après validation humaine + accord CTO.

---

## 2. Séparation des bases (obligatoire)

| Instance | Variable | Port hôte recommandé | Base | Usage |
|----------|----------|----------------------|------|--------|
| **Yunicity CRM** | `DATABASE_URL` | `5434` (compose dev) | `yunicity_dev` | Cible d’import, API, admin |
| **Supabase restore** | `SUPABASE_DATABASE_URL` | `5435` (instance séparée) | ex. `supabase_restore` | Lecture seule migration |

**Ne jamais** pointer `SUPABASE_DATABASE_URL` vers la même base que `DATABASE_URL`.

### Exemple `.env` (extrait)

```env
# Yunicity — docker compose service postgres (host)
DATABASE_URL=postgresql+asyncpg://yunicity:yunicity_dev_password@localhost:5434/yunicity_dev

# Supabase — instance RESTAURÉE séparée (autre conteneur / autre port)
SUPABASE_DATABASE_URL=postgresql+asyncpg://postgres:YOUR_RESTORE_PASSWORD@localhost:5435/supabase_restore
```

Dans le conteneur `backend` du compose Yunicity :

```env
DATABASE_URL=postgresql+asyncpg://yunicity:yunicity_dev_password@postgres:5432/yunicity_dev
# SUPABASE_DATABASE_URL doit viser l’hôte Docker, pas le service postgres Yunicity :
SUPABASE_DATABASE_URL=postgresql+asyncpg://postgres:YOUR_RESTORE_PASSWORD@host.docker.internal:5435/supabase_restore
```

---

## 3. Prérequis

- [ ] Backup Supabase téléchargé (fichier `.sql` ou `.dump`), **hors dépôt git**
- [ ] Docker Desktop (ou Postgres local) avec **deux** instances distinctes
- [ ] Backend Yunicity à jour (`TICKET-250` mergé)
- [ ] `backend/.env` configuré (voir §2)
- [ ] Migrations Yunicity appliquées : `alembic upgrade head`
- [ ] Espace disque suffisant pour restore + `pg_dump` CRM
- [ ] Compte staff admin pour QA post-import (`moderation.manage` ou `system.admin`)

---

## 4. Restauration du backup Supabase

> Le backup reste **local** et **isolé**. Ne pas restaurer dans `yunicity_dev`.

### Option A — Conteneur PostgreSQL dédié (recommandé)

```powershell
# PowerShell — racine monorepo
docker run -d --name yunicity-supabase-restore `
  -e POSTGRES_PASSWORD=restore_dev_only `
  -e POSTGRES_DB=supabase_restore `
  -p 5435:5432 `
  postgis/postgis:16-3.4
```

Attendre que Postgres soit prêt :

```powershell
docker exec yunicity-supabase-restore pg_isready -U postgres
```

### Option B — Restaurer un dump plain SQL (`.sql`)

**Docker :**

```powershell
Get-Content C:\chemin\vers\backup.sql | docker exec -i yunicity-supabase-restore psql -U postgres -d supabase_restore
```

**Local (psql installé) :**

```powershell
psql "postgresql://postgres:restore_dev_only@localhost:5435/supabase_restore" -f C:\chemin\vers\backup.sql
```

### Option C — Restaurer un custom dump (`.dump` / `pg_dump -Fc`)

```powershell
docker cp C:\chemin\vers\backup.dump yunicity-supabase-restore:/tmp/backup.dump
docker exec yunicity-supabase-restore pg_restore -U postgres -d supabase_restore --no-owner --no-acl /tmp/backup.dump
```

En cas d’erreurs « already exists », ajouter `--clean` **uniquement** sur la base restore dédiée (jamais sur Yunicity).

### Vérification post-restore

```powershell
docker exec yunicity-supabase-restore psql -U postgres -d supabase_restore -c "\dt public.*"
```

---

## 5. Workflow discovery (étape A → D)

### A. Lancer discovery

**DB live restaurée :**

```bash
docker compose exec backend python scripts/supabase_discovery.py
```

**Sans DB live (fichier `.sql` uniquement) :**

```bash
docker compose exec backend python scripts/supabase_discovery.py `
  --sql-dump /chemin/monte/backup.sql
```

Rapport généré : `backend/reports/supabase_discovery_report.md`

### B. Lire les rapports

| Fichier | Contenu |
|---------|---------|
| `reports/supabase_discovery_report.md` | Tables, colonnes, scores heuristiques |
| `reports/supabase_partner_mapping.md` | Correspondance colonnes → `partner_leads` |

### C. Identifier la table source

Critères :

- Score heuristique ≥ 3 dans le rapport discovery
- Colonnes type nom / ville / contact / instagram
- **Exclure** tables `auth_*`, `users`, storage, analytics

Noter le nom retenu : `________________` (ex. `landing_partners`)

### D. Validation humaine (obligatoire)

- [ ] Table source validée par **reviewer** : ________________
- [ ] Échantillon 5–10 lignes inspecté manuellement dans Supabase
- [ ] Mapping colonnes validé ou ajustements notés
- [ ] Pas de données personnelles sensibles hors périmètre

---

## 6. Workflow dry-run

Le dry-run est le **comportement par défaut** (ne pas passer `--apply`).

### Étape 1 — Échantillon 10 lignes

```bash
docker compose exec backend python scripts/import_supabase_partner_leads.py `
  --source-table VOTRE_TABLE `
  --limit 10
```

### Étape 2 — Échantillon 50 lignes

```bash
docker compose exec backend python scripts/import_supabase_partner_leads.py `
  --source-table VOTRE_TABLE `
  --limit 50
```

### Étape 3 — Analyser les sorties

| Sortie | Fichier / flux |
|--------|----------------|
| JSON résumé | stdout (total, imported, duplicates, invalid, suspicious) |
| Rapport Markdown | `reports/supabase_partner_import_report.md` |
| Logs | stdout conteneur / niveau INFO |

Points d’attention :

- **`suspicious`** : ville manquante, aucun canal contact — à valider métier
- **`skipped_duplicates`** : normal si re-import ou chevauchement terrain Reims
- **`invalid`** : nom manquant, email invalide — corriger source ou accepter skip

### Étape 4 — Dry-run complet (sans limit)

```bash
docker compose exec backend python scripts/import_supabase_partner_leads.py `
  --source-table VOTRE_TABLE
```

Remplir le template : `reports/templates/import_validation_checklist.md`

---

## 7. Workflow apply (après validation)

### Checklist obligatoire avant `--apply`

| # | Critère | OK | Initiales / date |
|---|---------|----|------------------|
| 1 | Discovery relu et table source validée | ☐ | |
| 2 | Dry-run limit 10 + 50 revus | ☐ | |
| 3 | Dry-run complet revu | ☐ | |
| 4 | Doublons acceptés (liste jointe si besoin) | ☐ | |
| 5 | **Backup CRM Yunicity** effectué (§8) | ☐ | |
| 6 | **Approbation CTO** explicite | ☐ | |
| 7 | Fenêtre d’import planifiée (pas de démo live simultanée) | ☐ | |

**Sans les 7 cases : interdiction d’exécuter `--apply`.**

### Commande apply

```bash
docker compose exec backend python scripts/import_supabase_partner_leads.py `
  --source-table VOTRE_TABLE `
  --apply
```

Optionnel : conserver une trace horodatée du rapport :

```bash
docker compose exec backend python scripts/import_supabase_partner_leads.py `
  --source-table VOTRE_TABLE `
  --apply `
  --output reports/import_apply_YYYYMMDD_HHMM.md
```

---

## 8. Backup et rollback CRM

### Avant apply — sauvegarde `partner_leads`

**Docker (depuis l’hôte) :**

```powershell
docker compose exec postgres pg_dump -U yunicity -d yunicity_dev `
  --table=partner_leads --data-only --column-inserts `
  > backup_partner_leads_YYYYMMDD.sql
```

**Sauvegarde complète DB (recommandé avant grosse migration) :**

```powershell
docker compose exec postgres pg_dump -U yunicity yunicity_dev > backup_yunicity_dev_YYYYMMDD.sql
```

### Rollback (si apply incorrect)

1. Arrêter l’API si nécessaire.
2. Restaurer la table ou la base depuis le dump :

```powershell
# Table seule (exemple)
Get-Content backup_partner_leads_YYYYMMDD.sql | docker compose exec -T postgres psql -U yunicity -d yunicity_dev
```

3. Vérifier les counts :

```powershell
docker compose exec postgres psql -U yunicity -d yunicity_dev -c "SELECT COUNT(*) FROM partner_leads;"
```

### Export CSV pour audit (optionnel)

```powershell
docker compose exec postgres psql -U yunicity -d yunicity_dev -c `
  "\copy (SELECT id, name, city, source, status, created_at FROM partner_leads ORDER BY created_at DESC) TO STDOUT WITH CSV HEADER" `
  > partner_leads_export_YYYYMMDD.csv
```

> Le pipeline ne supprime pas de données ; le rollback repose sur la restauration du dump CRM.

---

## 9. Post-import QA

| # | Vérification | OK |
|---|--------------|-----|
| 1 | Admin `/partner-leads` — liste charge sans erreur | ☐ |
| 2 | Filtres statut / source / ville fonctionnels | ☐ |
| 3 | Fiche détail : tags `supabase-import` présents | ☐ |
| 4 | Statuts cohérents (`interested` / `signed`) | ☐ |
| 5 | `organizations` count inchangé vs pré-import | ☐ |
| 6 | Aucun lead converti automatiquement (`converted_organization_id` NULL) | ☐ |
| 7 | Doublons terrain Reims toujours uniques (pas de doublon visible) | ☐ |

Requête SQL de contrôle :

```sql
SELECT COUNT(*) FROM partner_leads WHERE metadata->>'imported_via' = 'supabase_partner_import';
SELECT COUNT(*) FROM organizations;  -- doit être identique au pré-import
SELECT COUNT(*) FROM partner_leads WHERE converted_organization_id IS NOT NULL;
-- attendu : 0 nouveaux convertis par cette migration
```

---

## 10. Erreurs fréquentes et recovery

| Symptôme | Cause probable | Action |
|----------|----------------|--------|
| `SUPABASE_DATABASE_URL est requis` | Variable absente dans `.env` backend | Définir URL port **5435**, redémarrer backend |
| Connexion refusée port 5435 | Conteneur restore arrêté | `docker start yunicity-supabase-restore` |
| Import écrit dans mauvaise DB | URLs identiques | Vérifier §2 — ports distincts |
| Tous les leads `invalid` | Mauvaise table / colonnes | Revoir discovery + mapping |
| `validation_error` email | Emails mal formés dans source | Accepter skip ou nettoyer source |
| Doublons 100 % | Re-run apply sans besoin | Normal — idempotence |
| `Impossible de déduire la table source` | Pas de `--source-table` | Passer `--source-table` explicitement |
| Encodage console Windows | CP1252 | Utiliser logs fichier ou `chcp 65001` |

---

## 11. Traçabilité

Pour chaque run réel, archiver hors git :

```text
imports/YYYYMMDD/
  backup_yunicity_dev.sql
  supabase_discovery_report.md
  supabase_partner_import_report.md
  import_validation_checklist.md (rempli)
  cto_approval.txt (email / message)
```

---

## 12. Références techniques

| Ressource | Chemin |
|----------|--------|
| Scripts | `scripts/supabase_discovery.py`, `scripts/import_supabase_partner_leads.py` |
| Mapping | `reports/supabase_partner_mapping.md` |
| Checklist validation | `reports/templates/import_validation_checklist.md` |
| Tests pipeline | `tests/test_supabase_partner_import.py` |
| Ticket implémentation | TICKET-250 |

**Ce runbook ne lance aucun import automatiquement.** L’exécution reste une action humaine explicitement validée.
