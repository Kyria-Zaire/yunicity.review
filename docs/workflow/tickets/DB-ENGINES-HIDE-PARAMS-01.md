# DB-ENGINES-HIDE-PARAMS-01 · Moteurs SQLAlchemy sans `hide_parameters`

**DETTE** consignée le 2026-11-06 depuis `APP-DEBUG-SQL-ECHO-TOKENS-01` · décision
de Kyria : moteurs **non modifiés** dans ce lot · **non traité**.

## Constat (lecture de code, `eef6fd62`)

Seuls le moteur de l'application (`app/db/session.py`) et celui du script de
rotation QR (`scripts/rotate_passport_qr_tokens.py`) ont `hide_parameters=True`.
Les autres moteurs ne font pas d'écho SQL, mais **le texte de leurs erreurs porte
`[parameters: (…)]`** :

- `alembic/env.py` (`async_engine_from_config`) ;
- `app/db/seeds/__main__.py`, `app/db/bootstrap_admins/__main__.py`,
  `app/db/dev/promote_user.py`, `app/qa/launcher.py` ;
- `scripts/bootstrap_admin.py`, `scripts/backfill_passport_challenges.py`,
  `scripts/backfill_passport_reputation.py`, `scripts/backfill_yuni_wallet.py`,
  `scripts/import_partner_leads.py`, `scripts/import_supabase_partner_leads.py` ;
- `app/services/supabase_recovery/discovery.py`, `.../reader.py`.

Le filtre qui supprime les messages DEBUG de `sqlalchemy.engine.Engine` ne
s'applique à ces moteurs **que** dans un processus qui a appelé `init_db`.

Même avec `hide_parameters`, les messages d'erreur de Postgres et d'asyncpg citent
la valeur : `APP-SQL-ERROR-VALUES-01`.

## Première étape

Inventorier les valeurs que chaque moteur lie (jetons, hash, e-mails, mots de
passe à l'amorçage), puis choisir entre une fabrique commune et un correctif par
moteur. Présenter le plan avant modification.
