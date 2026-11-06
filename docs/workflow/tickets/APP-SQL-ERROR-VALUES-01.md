# APP-SQL-ERROR-VALUES-01 · Valeurs citées par les erreurs SQL dans les traces et Sentry

⛔ **ZONE ROUGE (jetons et données personnelles dans les journaux)** · ouvert le
2026-11-06 depuis `APP-DEBUG-SQL-ECHO-TOKENS-01` · **protection livrée sur la
Preview** (`5147bdab`, `5960cf68`), ticket **non clos** : voir « Livraison » et la
passation `docs/workflow/passations/APP-SQL-ERROR-VALUES-01-erreurs-sql.md`.

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
trace formatée. Ils atteignent donc :

- tout `logger.exception` / `exc_info=True` de l'application ;
- les traces des exceptions non gérées (seul `AppError` a un gestionnaire,
  `app/main.py`) ;
- Sentry quand `SENTRY_DSN` est défini (`send_default_pii=False` ne filtre pas le
  message d'exception).

Cela vaut avec `DEBUG=true` comme avec `DEBUG=false`. Les moteurs qui ont
`hide_parameters` (application, script de rotation QR) sont concernés comme les
autres.

## Preuve exécutable

`backend/tests/test_sql_log_parameters.py` : tests marqués
`xfail(strict=True, raises=AssertionError)` avec le motif de ce ticket. Ils
inspectent aussi le texte **brut** de l'exception, que la protection ne modifie
pas : ils restent en échec attendu (7 cas : 4 tests, dont 3 paramétrés
`DEBUG` vrai/faux). La protection elle-même est prouvée par
`backend/tests/test_sql_error_redaction.py`.

## Pistes initiales (avant diagnostic)

1. Réécrire, au niveau des handlers de journalisation, toute exception dont la
   chaîne contient une erreur SQL : n'en garder que la classe, le SQLSTATE et le
   nom de contrainte.
2. Gestionnaire d'exception générique FastAPI qui journalise ce même résumé.
3. Hook `before_send` de Sentry qui expurge les erreurs SQL.

**Limites connues** : les journaux propres d'uvicorn et le journal du serveur
Postgres (`POSTGRES-SERVER-LOGS-EXPOSURE-01`) ne sont pas couverts par 1 à 3.

## Première étape

Inventorier les chemins réels (handlers, uvicorn, Sentry), puis présenter un
diagnostic et un plan **avant toute modification**. Revue de sécurité requise.

## Livraison (2026-11-06)

Diagnostic par sondes sur base jetable, puis protection **structurelle** : le
message d'une erreur SQL (et de ses causes) n'est jamais recopié ; restent la
classe, le SQLSTATE, la contrainte, la table, la colonne, le schéma, le type.
Valeurs tronquées couvertes, puisque la valeur n'est pas recherchée.

| Chemin | Protection |
|---|---|
| Journaux (application texte/JSON, uvicorn, arq) | fabrique d'enregistrements : trace, arguments `%s`, exception passée comme message |
| Réponse HTTP 500 | `FastAPI(debug=False)` toujours |
| Sentry | `include_local_variables=False` (les frames SQLAlchemy portent les paramètres liés), `before_send`, `before_breadcrumb` |
| Résultat arq dans Redis | tâches décorées : `SanitizedSqlError` ; `Retry`, annulation, délais inchangés |
| Rapports de backfill | `safe_str(exc)` |

**Limite permanente** : un texte d'exception recopié à la main (f-string,
concaténation, `str(exc)`) n'est pas couvert. Tout nouveau code qui compose un
texte depuis une exception pouvant venir de la base passe par
`safe_str(exc)` (`backend/app/core/sql_error_redaction.py`).

**Hors périmètre** : journaux du serveur Postgres
(`POSTGRES-SERVER-LOGS-EXPOSURE-01`), autres moteurs
(`DB-ENGINES-HIDE-PARAMS-01`), texte brut de l'objet exception.
