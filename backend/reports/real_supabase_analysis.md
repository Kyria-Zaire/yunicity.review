# TICKET-260 — Analyse Supabase (exécution réelle)

**Date :** 2026-05-18  
**Opérateur :** agent BMAD (exécution automatisée)  
**Runbook :** `TICKET-251-real-import-runbook.md`

---

## Statut global

| Étape | Statut | Détail |
|-------|--------|--------|
| Validation environnement | **PARTIEL** | Voir §1 |
| Restore backup réel | **BLOQUÉ** | Fichier backup introuvable sur la machine |
| Discovery réelle (DB live) | **NON EXÉCUTÉE** | Pas de DB Supabase restaurée |
| Discovery smoke (fixture) | **OK** | Pipeline validé sur fixture uniquement |
| Dry-run 10 / 50 / complet | **NON EXÉCUTÉS** | `SUPABASE_DATABASE_URL` indisponible |
| Apply | **NON EXÉCUTÉ** | GO/NO-GO = **NO-GO** (§8) |

---

## 1. Validation environnement

| Contrôle | Résultat |
|----------|----------|
| Espace disque C: | **~2,7 Go libres** (suffisant pour restore modeste, surveiller) |
| Port Yunicity PostgreSQL | **5434 — OUVERT** |
| Port Supabase restore | **5435 — FERMÉ** (conteneur restore absent) |
| Port API | **8000 — OUVERT** (connexion HTTP health : **timeout 8s**) |
| Docker CLI | **LENT / non répondant** (>60s sans sortie sur `docker compose ps`, `docker run`) |
| `backend/.env` local | **Absent** (seul `.env.example` présent) |
| Backup Supabase hors repo | **Non localisé** (recherche repo + Downloads, pas de `.dump` / gros `.sql` Yunicity) |

### Ports documentés

| Instance | Port hôte | État constaté |
|----------|-----------|---------------|
| Yunicity CRM (`DATABASE_URL`) | **5434** | Actif |
| Supabase restore (`SUPABASE_DATABASE_URL`) | **5435** | Inactif |
| API FastAPI | **8000** | Port ouvert, health non confirmé |

### Compteurs CRM avant opération (via SQLAlchemy → localhost:5434)

| Table | Count |
|-------|------:|
| `partner_leads` | **1** |
| `organizations` | **0** |

---

## 2. Restore réel

**Non réalisé.**

| Champ | Valeur |
|-------|--------|
| Méthode prévue | Conteneur `yunicity-supabase-restore` + `psql` / `pg_restore` (runbook §4) |
| Fichier backup | **Non fourni / non trouvé** |
| Taille backup | N/A |
| Durée restore | N/A |
| Erreurs | Docker non opérationnel dans les délais ; chemin backup manquant |

**Action requise opérateur humain :**

1. Placer le backup Supabase hors repo (ex. `C:\imports\yunicity-supabase-2026.sql`).
2. Démarrer Docker Desktop et attendre qu’il soit « Running ».
3. Suivre `TICKET-251-real-import-runbook.md` §4 (restore sur port **5435** uniquement).

---

## 3. Discovery

### Réelle (backup / DB restore)

Non exécutée — aucune base Supabase accessible sur le port 5435.

### Smoke test pipeline (fixture — **pas des données historiques**)

| Champ | Valeur |
|-------|--------|
| Commande | `python scripts/supabase_discovery.py --sql-dump tests/fixtures/supabase_sample_dump.sql` |
| Rapport | `reports/supabase_discovery_report_real_attempt.md` |
| Tables | 2 (`landing_partners`, `auth_users`) |
| Table pertinente | `public.landing_partners` (score 12) |

---

## 4. Tables et volumes (estimation)

| Métrique | Valeur réelle | Source |
|----------|---------------|--------|
| Total tables Supabase | **Inconnu** | Restore bloqué |
| Tables pertinentes | **1 attendue** (heuristique fixture : `landing_partners`) | Fixture smoke |
| Leads estimés | **Inconnu** | Nécessite `COUNT(*)` post-restore |
| Villes / catégories | **Inconnu** | Nécessite analyse SQL post-restore |

---

## 5. Données manquantes / doublons / suspectes (prévision)

Sans restore réel, analyse qualitative basée sur le pipeline TICKET-250 :

| Risque | Probabilité | Mitigation |
|--------|-------------|------------|
| Ville manquante | Moyenne | Flag `suspicious` + revue humaine |
| Doublons avec terrain Reims (14 partenaires physiques) | **Élevée** | Skip CRM `name+city+phone` |
| Doublons Instagram | Moyenne | Skip handle normalisé |
| Emails invalides dans source legacy | Moyenne | Lignes `invalid` |
| Tribus / noms bloqués | Faible | Filtre `blocked_tribu_name` |

---

## 6. Dry-run (résultats)

| Run | Statut | Rapport |
|-----|--------|---------|
| limit 10 | **NON EXÉCUTÉ** | `reports/dry_run_limit_10.md` |
| limit 50 | **NON EXÉCUTÉ** | `reports/dry_run_limit_50.md` |
| complet | **NON EXÉCUTÉ** | `reports/dry_run_full.md` |

Cause : `SUPABASE_DATABASE_URL` non configurée + port 5435 fermé.

---

## 7. Tests pipeline (code)

| Commande | Résultat |
|----------|----------|
| `pytest tests/test_supabase_partner_import.py` | **10/10 OK** |
| `ruff check` (modules supabase) | **OK** |

---

## 8. Synthèse

L’infrastructure locale **Yunicity CRM (5434)** est joignable avec des données minimales (`partner_leads=1`).  
L’import historique Supabase **ne peut pas démarrer** tant que :

1. Le **fichier backup réel** n’est pas fourni à un chemin connu.
2. Le **conteneur restore** n’est pas démarré sur le port **5435**.
3. **`SUPABASE_DATABASE_URL`** n’est pas renseignée dans `backend/.env`.

Voir décision : `reports/real_import_review.md`.
