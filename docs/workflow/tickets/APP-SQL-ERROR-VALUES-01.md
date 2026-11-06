# APP-SQL-ERROR-VALUES-01 · Valeurs citées par les erreurs SQL dans les traces et Sentry

⛔ **ZONE ROUGE (jetons et données personnelles dans les journaux)** · ouvert le
2026-11-06 depuis `APP-DEBUG-SQL-ECHO-TOKENS-01` · **non traité**.

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
passeront en **XPASS (rouge)** dès que la fuite disparaît : il faudra alors
retirer la marque.

## Pistes (aucune retenue)

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
