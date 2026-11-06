# Passation — APP-DEBUG-SQL-ECHO-TOKENS-01 · Paramètres SQL dans les journaux

⛔ **ZONE ROUGE (jetons et données sensibles dans les journaux)** · Préproduction
uniquement · `main`, production, admin et infrastructure de production **gelés,
y compris en lecture** · aucun sous-agent.

## 1. Objectif

Aucun paramètre lié d'une requête SQL (jetons Passport, hash de jetons, e-mails…)
ne doit apparaître dans les journaux ou dans le texte des erreurs, que `DEBUG`
soit vrai ou faux. Le périmètre est **à valider par Kyria** (§6).

## 2. État Git

- **Ouvert le 2026-11-05** par Kyria, comme **seul ticket actif**.
- Base de diagnostic : **`eef6fd62`** (Preview servie, branche
  `fix/passport-self-redeem`, worktree `yunicity-wt-deps-next-preview`), lue par
  `git show` / `git grep` **sans checkout**. Les documents non commités de ce
  worktree sont **intacts**.
- **Aucun code modifié. Aucune branche créée.** Branche proposée après
  validation : `fix/app-sql-log-parameters`, issue de `eef6fd62`, dans un
  worktree dédié.
- Cette passation et l'index sont **non commités** dans `yunicity-wt-pr202-ci`
  (l'index contient des changements d'autres sessions).

## 3. Documents importants

- Ligne d'origine : `TICKETS-INDEX.md`, tableau « Sujets ouverts, hors recette ».
- `tickets/PASSPORT-QR-TOKEN-ROTATION-01.md`, « Correctif après CI ».
- Commit `eb07b6ce` (moteur du script de rotation durci).

## 4. Preuves acquises (diagnostic, 2026-11-05)

### 4.1 Moteurs de connexion à `eef6fd62`

| Moteur | Fichier | `echo` | `hide_parameters` |
|---|---|---|---|
| **Application** (API, workers) | `app/db/session.py:29-33` | **`settings.debug`** | **non** |
| Rotation QR | `scripts/rotate_passport_qr_tokens.py:143` | `False` | **oui** |
| Alembic | `alembic/env.py:94` (`async_engine_from_config`) | non | non |
| Seeds, bootstrap admin(s), promote_user, QA launcher, backfills ×3, imports partenaires ×2, supabase_recovery ×2 | `app/db/...`, `app/qa/launcher.py`, `scripts/*.py`, `app/services/supabase_recovery/*.py` | non | non |

`configure_logging` (`app/core/logging.py:29-31`) règle `sqlalchemy.engine` sur
**INFO si `DEBUG`**, sinon WARNING. `DEBUG=true` : `.env.example`,
`.env.qa.example`, `docker-compose.qa.yml` (×2), `docker-compose.yml` par défaut.
`DEBUG=false` : compose prod/unifié, Preview (relu le 05/11).

### 4.2 Comportement de SQLAlchemy 2.0.49 (version du verrou), mesuré

Expérience isolée (scratchpad, SQLite en mémoire, marqueur **fictif**) :

| Configuration | Paramètres dans l'écho | Paramètres dans le **texte de l'exception** | Lignes de résultat (logger à DEBUG) |
|---|---|---|---|
| `echo=True` (app avec `DEBUG=true`) | **oui** | **oui** | — |
| `echo=True` + `hide_parameters` | non | non | — |
| `echo=False` (app avec `DEBUG=false`) | non émis au niveau WARNING | **oui** | — |
| `hide_parameters`, logger forcé à DEBUG | non | non | **oui** |

**Conséquences établies :**

1. **Le défaut n'est pas propre à `DEBUG`.** Sans `hide_parameters`, toute
   erreur SQL porte `[parameters: (…)]` dans son texte, **même avec
   `DEBUG=false`**. Ce texte part dans les traces d'exception non gérées (il n'y
   a **pas de gestionnaire d'exception générique** : seul `AppError` est géré,
   `main.py:90`) et dans **Sentry** quand `SENTRY_DSN` est défini
   (`send_default_pii=False` ne filtre **pas** le message d'exception).
2. **`hide_parameters=True` n'est PAS une protection de tous les journaux.**
   Mesuré : il masque les paramètres dans l'écho et dans le texte des
   exceptions, mais **pas les lignes de résultat** si `sqlalchemy.engine` passe
   au niveau DEBUG.
3. **Non établi, à prouver sur Postgres** : les messages d'erreur produits par
   le **serveur** (ex. `DETAIL: Key (qr_token)=(…) already exists`, ou
   `invalid input syntax … "valeur"`) contiennent la valeur elle-même ;
   `hide_parameters` ne peut pas les masquer. Reste à mesurer ce qu'asyncpg
   0.31.0 et SQLAlchemy en recopient dans le texte de l'exception.

### 4.3 Le jeton observé dans la CI de `ea5e28fa` était-il réel ?

**Non : fictif au sens opérationnel**, établi **par lecture du code et du
workflow**, **sans ouvrir ni télécharger le journal** :

- Job `compose · health · pytest (disposable db)` (`docker-ci.yml`) : pile
  `docker-compose.qa.yml` montée **dans le runner**, tests sur une **base
  jetable** (`scripts.run_backend_tests`), **aucun secret** injecté, pile
  détruite en fin de job (`down -v`).
- Les Passports du test sont **créés par le test** (`activate_passport`) ; les
  jetons capturés sont les **paramètres de l'`UPDATE` de rotation**, générés par
  `generate_qr_token_placeholder()` → `secrets.token_urlsafe(24)`. Valeurs
  aléatoires, sans lien avec un compte réel, invalides hors de cette base.
- **Limite** : le journal CI conserve cette valeur sans valeur d'usage. **Aucun
  historique supprimé** (consigne de Kyria).

### 4.4 Autres journaux

- **QA locale** (`yunicity-backend-qa`, `DEBUG=true`) : l'écho porte sur
  `yunicity_qa`, peuplée de **fixtures** (ex. jeton constant de
  `qa_fixtures.py:1148`) — données fictives. Non relu.
- **Preview** : pas d'écho (`DEBUG=false`), mais le chemin « texte d'exception »
  (§4.2-1) **peut** y avoir écrit des paramètres si une erreur SQL a eu lieu.
  **Inconnu** — vérification ciblée proposée au plan, **sur accord de Kyria**.
- **Production** : **non examinée (gel)**. Même code de moteur : le risque §4.2-1
  s'y applique par construction. **Signalé, non vérifié.**

## 5. Inconnues

- Contenu recopié des erreurs **serveur** Postgres via asyncpg (§4.2-3).
- Présence de `[parameters:` dans les journaux Preview et dans Sentry (DSN
  défini ou non sur la Preview : non relu).
- Contenu des journaux de production : hors périmètre (gel).

## 6. Plan proposé — EN ATTENTE DE VALIDATION

**Décision 1 — périmètre du correctif :**

- **A (recommandée)** : moteur de l'application seulement (`session.py`) :
  `hide_parameters=True` **toujours**, indépendamment de `DEBUG` ; l'écho reste
  piloté par `DEBUG`, mais sans valeurs. Couvre l'API et les workers, donc les
  chemins qui servent du trafic. Les autres moteurs (§4.1) sont consignés en
  dette, avec un ticket séparé.
- **B** : fabrique unique `app/db/engine_factory.py` adoptée par tous les
  moteurs de `app/` et `scripts/` (environ 13 fichiers). Plus complet, mais
  diff plus large, dans une zone rouge.

**Décision 2 — lignes de résultat** : verrouiller `sqlalchemy.engine` au
niveau **INFO au plus bas** dans `configure_logging`, test à l'appui. Sinon, le
consigner comme limite.

**Étapes (après validation) :**

1. Worktree `fix/app-sql-log-parameters` depuis `eef6fd62`.
2. **Tests d'abord, rouges sur le code actuel** —
   `backend/tests/test_sql_log_parameters.py`, sur Postgres (base jetable de
   `run_backend_tests`), `DEBUG=true`. Marqueur fictif reconnaissable, par
   exemple `FICTIF-JETON-<uuid4>-NE-PAS-UTILISER` :
   - T1 · requête **réussie** (insertion puis sélection liées au marqueur), via
     le moteur de l'application : marqueur absent de `caplog` **et** de
     `capsys` (l'écho écrit aussi sur stdout) ;
   - T2 · erreur SQL **par contrainte** (doublon sur une colonne unique) :
     marqueur absent des journaux, de `str(exc)` et de la trace formatée ;
   - T3 · erreur SQL **par valeur invalide** (marqueur passé à une colonne
     typée) : même assertion. **Rouge attendu possible même après correctif**
     (message serveur, §4.2-3) → décision documentée, jamais masquée ;
   - T4 · `configure_logging` avec `DEBUG=true` : `sqlalchemy.engine` jamais
     sous INFO, et lignes de résultat absentes ;
   - T5 · moteur du script de rotation : T2 rejoué sur `build_engine`.
   - **Mutation** : retirer `hide_parameters` → T1/T2 rouges.
3. Correctif minimal selon les décisions 1 et 2.
4. Ajuster le commentaire de `test_refresh_rotation_replay_window.py:438`, qui
   décrit le comportement actuel comme « préexistant du mode DEBUG ».
5. Validation : `ruff`, `mypy`, suite ciblée, puis `docker-ci` manuel avant
   toute poussée. Diff et résultats présentés **avant livraison Preview**.
6. Sur accord de Kyria : **comptage seul** des occurrences de `[parameters:`
   dans les journaux de l'API Preview, sans export ni copie des lignes.
   Production exclue.

### 6 bis. Décisions de Kyria (2026-11-05)

- **Option A** retenue : `hide_parameters=True` systématique sur le moteur de
  l'application. Autres moteurs **consignés en dette, non modifiés** (§4.1).
- **Lignes de résultat** : à bloquer au niveau DEBUG, preuve par une requête
  retournant une valeur fictive (vérifier le niveau configuré ne suffit pas).
- **Étape 6 refusée** : aucune inspection des journaux Preview. Un comptage de
  `[parameters:` ne permettrait ni d'établir une fuite de jeton ni d'exclure les
  autres chemins de fuite.

## 9. BUILD (2026-11-06) — NON commité, NON poussé

Worktree `C:/Users/kyria/yunicity-wt-sql-log-params`, branche
`fix/app-sql-log-parameters` depuis `eef6fd62` (locale, aucune poussée).

**Diff** : `backend/app/db/session.py` : `hide_parameters=True` et filtre
`_DropResultRowRecords` sur le logger `sqlalchemy.engine.Engine` (supprime les
enregistrements DEBUG : lignes de résultat et noms de colonnes). Le filtre est posé
sur le logger partagé, donc il s'applique aussi aux autres moteurs du même
processus. Le commentaire de `test_refresh_rotation_replay_window.py` est
actualisé. Nouveau fichier `backend/tests/test_sql_log_parameters.py`.

**Instrument** : marqueur fictif court (`<16 hex>-FICTIF`), recherché par son
noyau aléatoire. **Erreur d'instrument corrigée et consignée** : un premier
marqueur de 66 caractères donnait un **faux vert** sur l'erreur du pilote, car
asyncpg tronque la valeur citée (~30 caractères). Un vrai jeton (`qr_ph_` + 32)
y serait exposé en partie.

**Résultats sur base jetable** (`scripts/qa-backend-pytest-host.sh`, Postgres QA
`127.0.0.1:5455`, bases `yunicity_test_*` créées puis supprimées) :

| Test | Avant | Après |
|---|---|---|
| Requête réussie, `DEBUG=true` | ❌ | ✅ |
| Requête réussie, `DEBUG=false` | ✅ | ✅ |
| Lignes de résultat, DEBUG **forcé**, `DEBUG=true` / `false` | ❌ / ❌ | ✅ / ✅ |
| Erreur de contrainte unique, `true` / `false` | ❌ / ❌ | **❌ / ❌** |
| Erreur de conversion côté serveur, `true` / `false` | ❌ / ❌ | **❌ / ❌** |
| Erreur d'encodage côté pilote, `true` / `false` | ❌ / ❌ | **❌ / ❌** |
| Moteur du script de rotation, contrainte unique | ❌ | **❌** (non modifié) |

**Contre-épreuve** : filtre retiré, `hide_parameters` conservé → le test des
lignes de résultat échoue en `DEBUG=false` (en `DEBUG=true`, SQLAlchemy plafonne
déjà l'écho à INFO). Fichier restauré.

**Autres contrôles** : `ruff check` et `ruff format` OK ; `mypy` OK sur les deux
fichiers (avec `--follow-imports=silent`, car `sentry_sdk` est absent du venv
local, ce qui est sans lien avec le ticket). `test_refresh_rotation_replay_window`
et `test_passport_qr_rotation` sont verts (33 réussis sur 40, les 7 échecs étant
ceux du tableau). `docker-ci` **non lancé**.

**Résultat à arbitrer — les messages du serveur et du pilote révèlent encore
la valeur** (sonde expurgée, `hide_parameters=True`) :

- contrainte unique : `DETAIL:  Key (tok)=(<valeur>) already exists.` (Postgres) ;
- conversion : `invalid input syntax for type integer: "<valeur>"` (Postgres) ;
- encodage : `invalid input for query argument $1: '<valeur tronquée>...'`
  (asyncpg).

Ces textes figurent dans `str(exc)`, dans l'exception asyncpg chaînée et dans la
trace. Ils atteignent donc tout `logger.exception`, toute trace non gérée et
Sentry. **`hide_parameters` ne les couvre pas.** Hors application, le journal
du serveur Postgres consigne aussi ces messages (non vérifié).

## 10. Décision et préparation de livraison (2026-11-06)

**Décision de Kyria** : livrer le gain prouvé (paramètres liés masqués, messages
DEBUG du moteur supprimés). Les fuites restantes sont conservées en
`xfail(strict=True)`, rattachées à un ticket de suivi, **sans assertion
affaiblie**. Le mypy local avec imports ignorés **n'équivaut pas** au contrôle
canonique : les contrôles habituels et `docker-ci` doivent passer sur le SHA
correctif **avant intégration à la Preview**. Présentation **avant déploiement**.

**Fait :**

- Filtre renommé `_DropAllDebugRecords` / `_ENGINE_DEBUG_FILTER` : il supprime
  **tous** les messages DEBUG du logger `sqlalchemy.engine.Engine`, pas seulement
  les lignes de résultat.
- 7 tests de fuite marqués `xfail(strict=True, raises=AssertionError)`, motif
  `APP-SQL-ERROR-VALUES-01`. Seule une `AssertionError` compte comme échec attendu.
  Un XPASS fait échouer la suite.
- Docstring de `build_engine()` (script de rotation) corrigée : limite mesurée
  et renvoi aux suivis.
- `PASSPORT-QR-TOKEN-ROTATION-01.md` corrigé **dans le worktree
  `yunicity-wt-deps-next-preview`**, au milieu de ses modifications non commitées,
  qui sont préservées. La phrase fausse est barrée, pas effacée. Le correctif
  précise que **les journaux du serveur Postgres n'ont pas été examinés**.
- Tickets ouverts sur la branche : `APP-SQL-ERROR-VALUES-01` (erreurs SQL dans
  les traces et Sentry) et `POSTGRES-SERVER-LOGS-EXPOSURE-01` (configuration et
  exposition, **aucune intervention sur l'infrastructure**). Dette
  `DB-ENGINES-HIDE-PARAMS-01` consignée dans l'index.
- Base jetable : **4 passed, 7 xfailed**, aucun XPASS.

### 10 bis. Contrôles sur le SHA correctif `a0e9d0bc` (2026-11-06)

| Contrôle | Environnement | Résultat |
|---|---|---|
| `ruff check .` | conteneur `python:3.12-slim`, `pip install -e ".[dev]"` (comme `backend-ci`) | ✅ |
| `mypy app tests` (canonique, `sentry_sdk` installé) | idem | ✅ 726 fichiers |
| `pytest` (mode unitaire, comme `backend-ci`) | idem, **dépôt complet** | ✅ 963 passed, 1146 skipped ; base `eef6fd62` : 963 passed, 1135 skipped. Listes d'échecs **identiques (vides)**. Les +11 ignorés sont les tests DB du ticket |
| `docker-ci` (`workflow_dispatch`) | GitHub, run `42150566964`, SHA `a0e9d0bc` | ✅ **2083 passed, 19 skipped, 7 xfailed**, 0 XPASS (base : 2079 passed) |

**Erreur d'instrument consignée** : une première exécution de `pytest` en
conteneur, sur une copie du seul dossier `backend/`, a donné 13 échecs et 19
erreurs. Ils venaient de l'absence des fichiers de la racine du dépôt
(`docker-compose.qa.yml`…). Avec le dépôt complet, il n'y a aucun échec, ni
sur le correctif ni sur la base.

**Git** : commit `a0e9d0bc` sur `fix/app-sql-log-parameters`, **branche
poussée** (nouvelle branche distante, suivie par aucun service). `main`, la
branche Preview et la production n'ont pas été touchés. **Rien n'est déployé.**

## 7. Tâches actives

Aucune. En attente de la décision de Kyria sur la livraison Preview.

## 8. Prochaine action

Sur décision de Kyria : avance rapide de la branche Preview
`feat/c3-videos-refonte-final` de `eef6fd62` vers `a0e9d0bc`, sans `--force`,
puis vérification des deux services. **À trancher avant** : joindre ou non au
lot les documents non commités du worktree `yunicity-wt-deps-next-preview`
(dont la correction de `PASSPORT-QR-TOKEN-ROTATION-01.md`).
