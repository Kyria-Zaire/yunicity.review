# TICKET-260 — Revue humaine import Supabase

**Date :** 2026-05-18  
**Décision apply :** **NO-GO**

---

## Contexte exécution

Tentative d’exécution opérationnelle selon `TICKET-251-real-import-runbook.md`.  
Aucune feature produit ajoutée. **Aucun `--apply` exécuté.**

---

## Exemples de lignes

| Source | Exemple |
|--------|---------|
| Fixture smoke (`landing_partners`) | `company_name=Café Supabase Test`, `city=Reims`, `signed=true` |
| Données réelles Supabase | **Non disponibles** — restore non effectué |

---

## Problèmes détectés

| # | Problème | Gravité | Impact |
|---|----------|---------|--------|
| 1 | **Backup Supabase introuvable** sur le poste | Bloquant | Impossible discovery/dry-run réels |
| 2 | Port **5435** fermé (pas de DB restore) | Bloquant | `SUPABASE_DATABASE_URL` inutilisable |
| 3 | **Docker CLI** très lent / sans réponse | Majeur | Restore conteneur non démarré |
| 4 | API `/health` timeout (port 8000 ouvert) | Mineur | QA admin post-import non testée aujourd’hui |
| 5 | `backend/.env` absent | Majeur | Variables non persistées localement |
| 6 | Checklist TICKET-251 non remplie | Bloquant apply | Pas d’approbation CTO |

---

## Recommandations

1. **Fournir le chemin absolu** du backup Supabase (`.sql` ou `.dump`) — hors git.
2. **Démarrer Docker Desktop** et vérifier `docker ps` répond en < 5 s.
3. **Créer `backend/.env`** depuis `.env.example` avec :
   - `DATABASE_URL` → port **5434**
   - `SUPABASE_DATABASE_URL` → port **5435**
4. Exécuter restore (runbook §4) puis enchaîner :
   ```powershell
   cd backend
   .\.venv\Scripts\python.exe scripts/supabase_discovery.py
   .\.venv\Scripts\python.exe scripts/import_supabase_partner_leads.py --source-table VOTRE_TABLE --limit 10
   .\.venv\Scripts\python.exe scripts/import_supabase_partner_leads.py --source-table VOTRE_TABLE --limit 50
   .\.venv\Scripts\python.exe scripts/import_supabase_partner_leads.py --source-table VOTRE_TABLE
   ```
5. Remplir `reports/templates/import_validation_checklist.md`.
6. **Backup CRM** (`pg_dump`) avant toute réflexion sur `--apply`.
7. Obtenir **approbation CTO écrite** puis seulement :
   ```powershell
   .\.venv\Scripts\python.exe scripts/import_supabase_partner_leads.py --source-table VOTRE_TABLE --apply
   ```

---

## Décision GO / NO-GO

| Décision | **NO-GO** pour `--apply` |
|----------|--------------------------|
| Motif principal | Restore réel non effectué ; dry-run réels non exécutés ; validation humaine / CTO absente |
| Apply exécuté ? | **Non** |
| Organizations créées ? | **Non** (count avant = 0, inchangé) |
| Écrasement CRM ? | **Non** |

### Conditions pour passer à GO

- [ ] Backup restauré sur port 5435
- [ ] Discovery réelle documentée
- [ ] Dry-run 10 + 50 + complet revus et archivés
- [ ] Checklist TICKET-251 complète
- [ ] Backup CRM pris
- [ ] Approbation CTO explicite

---

## Signatures

| Rôle | Nom | Date | Décision |
|------|-----|------|----------|
| Opérateur | _à compléter_ | | |
| Reviewer | _à compléter_ | | |
| CTO | _à compléter_ | | **NO-GO** (2026-05-18, exécution agent) |
