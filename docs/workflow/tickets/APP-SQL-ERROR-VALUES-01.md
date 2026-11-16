# APP-SQL-ERROR-VALUES-01 · Valeurs citées par les erreurs SQL dans les traces et Sentry

⛔ **ZONE ROUGE** (jetons et données personnelles dans les journaux) · ouvert le
2026-11-06 depuis `APP-DEBUG-SQL-ECHO-TOKENS-01`.

| Champ | Valeur |
|-------|--------|
| **Statut** | ✅ **CLOS** le 2026-11-06 au stade **préproduction** (décision Kyria) |
| **Preview servie** | **`6ef03cee`** |
| **Décision C5** | **`FastAPI(debug=False)` toujours** (définitive) |
| **Passation** | `docs/workflow/passations/APP-SQL-ERROR-VALUES-01-erreurs-sql.md` |
| **Production / `main`** | **non promu** — gelés |

## Constat (mesuré, base jetable, SQLAlchemy 2.0.49, asyncpg 0.31.0)

`hide_parameters=True` masque les paramètres liés dans l'écho SQL et dans le texte
que SQLAlchemy compose pour ses erreurs. Il **ne couvre pas** les valeurs que
citent les **messages d'erreur** eux-mêmes :

| Erreur | Source | Forme du message (valeur expurgée) |
|---|---|---|
| Contrainte unique | Postgres | `DETAIL:  Key (col)=(<valeur>) already exists.` |
| Conversion refusée | Postgres | `invalid input syntax for type integer: "<valeur>"` |
| Encodage refusé | asyncpg | `invalid input for query argument $1: '<valeur tronquée ~30 car.>...'` |

Ces textes figurent dans `str(exc)`, dans l'exception asyncpg chaînée et dans la
trace formatée. Ils atteignent donc les journaux (`exc_info=True`), les traces
d'exceptions non gérées, et Sentry quand `SENTRY_DSN` est défini.

## Preuve exécutable

`backend/tests/test_sql_log_parameters.py` : tests marqués
`xfail(strict=True, raises=AssertionError)` — inspectent le texte **brut** de
l'exception (non modifié). Protection prouvée par
`backend/tests/test_sql_error_redaction.py`.

## Livraison (2026-11-06) — conservée

Protection **structurelle** : le message d'une erreur SQL (et de ses causes)
n'est jamais recopié ; restent la classe, le SQLSTATE, la contrainte, la table,
la colonne, le schéma, le type.

| Chemin | Protection |
|---|---|
| Journaux (app, uvicorn, arq) | fabrique d'enregistrements |
| Réponse HTTP 500 | `FastAPI(debug=False)` toujours (**C5**) |
| Sentry | `include_local_variables=False`, `before_send`, `before_breadcrumb` |
| Résultat arq / Redis | `SanitizedSqlError` |
| Rapports de backfill | `safe_str(exc)` |

**Limite permanente** : un texte d'exception recopié à la main (f-string,
concaténation, `str(exc)`) n'est pas couvert → passer par
`safe_str(exc)` (`backend/app/core/sql_error_redaction.py`).

## Limites / réserves à la clôture (passation §12)

- **Exceptions brutes** : l'objet exception garde la valeur (7 `xfail` le mesurent)
- Outil d'inventaire exclu : `scripts/data_cleanup_01_inventory_run.py`
- Journaux serveur Postgres → `POSTGRES-SERVER-LOGS-EXPOSURE-01`
- Autres moteurs → `DB-ENGINES-HIDE-PARAMS-01`
- Protection **non observée directement** sur Preview (pas d'erreur provoquée
  avec vrai jeton ; journaux Preview non examinés ; `SENTRY_DSN` non vérifié)

## Prochaine action

Aucune sur ce ticket (clos). Suite éventuelle distincte :
`POSTGRES-SERVER-LOGS-EXPOSURE-01` — voir index.
