# Passation — APP-SQL-ERROR-VALUES-01 · Valeurs citées par les erreurs SQL

⛔ **ZONE ROUGE** · Préproduction uniquement · `main`, production, admin et
infrastructure de production **gelés, y compris en lecture** · aucun sous-agent ·
**valeurs fictives sur base jetable uniquement** · **aucun examen des journaux
Preview**.

## 1. Objectif

Identifier les chemins qui transmettent les erreurs Postgres et asyncpg aux
journaux, aux traces et à Sentry, puis proposer une protection qui **garde les
informations de diagnostic** (classe, SQLSTATE, contrainte, table, colonne,
emplacement) **sans exposer les valeurs**, exceptions imbriquées et valeurs
tronquées comprises. **Plan présenté avant toute modification.**

**Hors périmètre** : journaux propres du serveur Postgres
(`POSTGRES-SERVER-LOGS-EXPOSURE-01`), autres moteurs SQLAlchemy
(`DB-ENGINES-HIDE-PARAMS-01`).

## 2. État Git

- **Ouvert le 2026-11-06** par Kyria, **seul ticket actif**. Précédent :
  `APP-DEBUG-SQL-ECHO-TOKENS-01`, **suspendu**, protection partielle sur
  `a4c9a628`.
- Base de diagnostic : `a4c9a628` (Preview servie), worktree
  `C:/Users/kyria/yunicity-wt-sql-log-params`, sans modification.
- Ticket : `docs/workflow/tickets/APP-SQL-ERROR-VALUES-01.md` (commité dans
  `a0e9d0bc`).

## 3. Diagnostic — par lecture de code (`a4c9a628`)

| # | Chemin | Constat | Mesure par sonde |
|---|---|---|---|
| C1 | Handler racine de l'application (`configure_logging`, texte ou `JsonLogFormatter`) | `formatException` écrit toute la chaîne (`__cause__` / `__context__`) | à faire |
| C2 | Blocs `except IntegrityError as exc` → `raise AppError(...) from exc` (auth, neighborhood, passport_reputation, profile, scan_redemption, tribe) et `YuniWalletError ... from exc` | l'erreur Postgres reste **chaînée** : toute trace de l'exception qui en résulte la contient | à faire |
| C3 | Hooks qui journalisent avec `exc_info=True` (notification, passport challenge, reputation, level, social…) | traces complètes, chaîne comprise | à faire |
| C4 | Exception non gérée dans une requête : `ServerErrorMiddleware` de Starlette, puis uvicorn (`uvicorn.error`, « Exception in ASGI application ») | uvicorn est lancé en CLI (`Dockerfile`, `unified_process`, compose QA) avec **sa propre configuration de journalisation** ; `configure_logging` ne touche pas `uvicorn.error` → chemin **hors du formateur applicatif** | à faire |
| C5 | `FastAPI(debug=settings.debug)` (`app/main.py:73`) | avec `DEBUG=true` (QA, dev), Starlette renvoie la **trace dans la réponse HTTP 500** → au **client**. Preview : `DEBUG=false` (relu le 05/11) | à faire |
| C6 | Sentry (`init_sentry`, `sentry-sdk[fastapi]`, verrou 2.73.0) | événements construits à partir de la chaîne d'exceptions (`value` = message) ; **variables locales des frames** probablement envoyées (option par défaut), donc les **paramètres eux-mêmes**, quel que soit `hide_parameters` ; `LoggingIntegration` par défaut (`logger.error` → événement) ; intégration SQLAlchemy activée automatiquement (breadcrumbs) | à faire |
| C7 | Worker arq (dans `unified_process`) | journalisation des échecs de tâche par arq : configuration à relire | à faire |

## 4. Incident pendant le diagnostic (2026-11-06) — BLOQUANT

Pour mesurer C6, j'ai voulu un venv aligné sur le verrou, avec `sentry_sdk`.
**Erreur consignée** : `uv pip install -e` a d'abord résolu des versions **plus
récentes** que le verrou (SQLAlchemy 2.0.57, asyncpg 0.32.0). `uv sync --frozen`
a ensuite échoué : **disque `C:` plein** (os error 112), venv corrompu
(segfault). J'ai supprimé **uniquement mes artefacts** de session (ce venv et la
copie `base_tree` du scratchpad) : 0,1 Go libre après. La pile QA tourne
toujours ; documents vérifiés intacts. Cache `uv` : 2,4 Go, en partie dû à
cette synchronisation, **non touché**.

**Aucune sonde lancée. Aucune modification de code.**

### 4 bis. Libération d'espace (2026-11-06, décision de Kyria)

- `uv cache prune` : uv annonce 90 751 fichiers / 1,4 Gio supprimés, mais le
  disque n'a **récupéré que 0,24 Go** (0,10 → **0,33 Go libres**). Écart
  probablement dû aux liens physiques partagés avec des venvs existants ; non
  vérifié.
- **Venv réutilisable** (`uv pip sync --dry-run --offline` contre `uv.lock` de
  `a4c9a628`) : `yunicity-wt-pr202-ci/backend/.venv` diffère du verrou par **un
  seul paquet** (`sentry-sdk==2.73.0` absent) ; `auth02a` et `auth04a` par deux
  (`sentry-sdk` 2.69.1, `pillow` absent). Aucun n'est conforme tel quel.
- **Artefacts régénérables des tickets terminés** : 8 worktrees
  (`auth02a`, `auth03`, `auth04a`, `auth04b`, `media01`, `media01b-fix`,
  `media01c-fix`, `media02`). Tous sont **propres**, **contenus dans la branche
  Preview**, avec un dernier commit en septembre. Récupérable mesuré : ≈ 0,8 Go
  (`.venv` d'auth02a et auth04a, ≈ 0,14 Go chacun ; `.mypy_cache`, ≈ 0,1 Go
  chacun). Les `.next` sont vides et les temporaires Claude pèsent 0,13 Go.
  `node_modules` (pnpm, liens physiques) : gain réel non mesuré.
- **Aucune suppression** au-delà du cache uv. Docker et Postgres QA **non
  redémarrés**.

### 4 ter. Nettoyage ciblé et relevé (2026-11-06, décision de Kyria)

- **Avant nettoyage, le disque libre avait chuté à 0,011 Go**, sans aucune
  action de cette session : un autre processus écrit en parallèle. L'espace
  libre fluctue d'une mesure à l'autre.
- **Supprimés**, après avoir vérifié pour chaque chemin qu'il n'est pas
  versionné (`ls-files` vide) et qu'il est ignoré (`check-ignore`) :
  - `backend/.venv` d'`auth02a` et d'`auth04a` ;
  - `.mypy_cache`, `.pytest_cache` et `.ruff_cache` sous `backend/` d'`auth02a`,
    `auth03`, `auth04a`, `auth04b`, `media01`, ainsi que le `.pytest_cache` de
    `media01b-fix`.
  
  `media01c-fix` et `media02` n'avaient aucun de ces caches. **Gain réel :
  0,653 Go** (0,208 → 0,861 Go libres). Liste dans le scratchpad de la session
  (`cleanup-targets.txt`).
- **Relevé en lecture seule** (métadonnées seulement : `robocopy /L`, tailles,
  aucun fichier ouvert) :

  | Taille | Dossier | Possibilité de nettoyage |
  |---|---|---|
  | 36,6 Go | `Cursor\User\globalStorage\state.vscdb.backup` (12/09) | Sauvegarde de l'état de Cursor, qui peut contenir un historique. **Décision de Kyria** : déplacer ou supprimer, Cursor fermé |
  | 37,2 Go | `Cursor\User\globalStorage\state.vscdb` | Base active de Cursor : ne pas toucher |
  | 43,5 Go | `Docker\wsl\disk\docker_data.vhdx` | Compactage possible seulement Docker arrêté, **interdit** : la base QA est en mémoire |
  | 11,7 Go | `Downloads` | Fichiers personnels, non ouverts : décision de Kyria |
  | 8,1 Go | `AppData\Local\pnpm` (store) | `pnpm store prune` : retire les paquets non référencés |
  | 6,4 Go | `AppData\Local\Android` | SDK et émulateurs : à juger par Kyria |
  | 4,0 Go | `AppData\Local\ms-playwright` | Anciennes versions de navigateurs, retéléchargeables |
  | 2,9 Go | `AppData\Local\Temp` | Temporaires, dont ceux d'autres sessions actives : pas de suppression en bloc |
  | 512 Go apparents | `Google\Play Games\…\userdata.img` | **Faux positif** : fichier creux, 0,52 Go réellement sur disque |
- **Aucune autre suppression.** Docker et Postgres QA **non redémarrés**.
  Données QA, captures, historiques et documents non touchés.
- **Marge encore insuffisante** (≈ 0,86 Go libres) : installation de
  `sentry-sdk==2.73.0` **différée**.

### 4 quater. Base Cursor, volumes, pnpm (2026-11-06, décision de Kyria)

- **Base Cursor et sauvegarde : rien n'est supprimé ni déplacé.** Leur
  occupation réelle (`GetCompressedFileSize`) est égale à leur taille apparente :
  `state.vscdb` 37,16 Go, `state.vscdb.backup` 36,62 Go. Ni l'un ni l'autre n'est
  creux ou compressé. La sauvegarde n'a qu'un seul lien physique ; elle date du
  12/09. Cursor est ouvert (15 processus).
- **Volumes** (`Win32_LogicalDisk`) : **`C:` est le seul volume** (475,4 Go,
  NTFS). Aucun disque secondaire, amovible ni réseau monté. **Aucune
  destination adaptée** au déplacement pour l'instant.
- **`pnpm store prune`** (pnpm 10.16.1, store
  `AppData\Local\pnpm\store\v10`) : 154 paquets et 3 385 fichiers retirés.
  **Gain réel : 0,427 Go** (0,334 → 0,760 Go libres), approximatif parce que
  l'espace libre fluctue.
- **Fluctuation** : l'espace libre est retombé de 0,861 à 0,3 Go entre deux
  mesures, sans action de cette session. `docker_data.vhdx` a été écrit à
  12:07:20, puis il est resté stable (43,508 Go) sur une minute d'observation.
- **Docker : le démon ne répond plus** (`docker ps` muet après 30 s), alors que
  ses processus tournent. Les ports 5455 (Postgres QA) et 6399 (Redis QA)
  acceptent les connexions TCP, mais cela ne prouve pas que les conteneurs sont
  en bonne santé : Docker Desktop peut relayer ces ports. Cause probable :
  saturation du disque (0,011 Go libres observés), **non prouvée**. **Docker
  n'a pas été redémarré.**
- **Aucune installation.** La marge reste instable et insuffisante.

### 4 quinquies. Compression de la sauvegarde Cursor (2026-11-06, décision de Kyria)

- **Avant** : Cursor arrêté (0 processus) ; ouverture exclusive du fichier
  réussie, donc aucun autre handle. SHA-256 de
  `state.vscdb.backup` : `52D2B96C…A473EE4F` (39 322 664 960 octets), stocké
  dans le scratchpad (`cursor-backup-sha256-before.txt`).
- `compact.exe /c` sur **ce seul fichier**, sans `/s` : code de sortie 0, taux
  33,9 pour 1, durée 549 s. `state.vscdb` n'a pas été compressé (attributs
  `Archive`).
- **Après** : SHA-256 **identique**, taille logique identique, date de
  modification inchangée (12/09). Occupation sur disque : **1,081 Go** (contre
  36,62 Go). Attribut `Compressed`.
- **Espace récupéré : 35,44 Go** (0,287 → 35,724 Go libres). 35,717 Go libres à
  12:32.
- Cursor a été rouvert ensuite (19 processus à 12:32). Docker et WSL **non
  redémarrés** ; aucune installation.

### 4 sexies. Reprise conditionnelle (2026-11-06) — arrêtée avant installation

- **Disque stable** : 35,702 → 35,701 Go libres sur 40 s (12:38–12:39).
- **Docker toujours bloqué** : `docker ps` muet après 30 s. Conformément à la
  consigne, **aucune installation de `sentry-sdk`**, aucune sonde lancée, aucun
  redémarrage de Docker ou de WSL.
- **Postgres QA joignable directement** (asyncpg du venv `pr202-ci`, sur
  127.0.0.1:5455, identifiants de test de `docker-compose.qa.yml`), en lecture
  seule :
  - PostGIS 16.4 et PostGIS 3.4.3, **en marche depuis 1 j 20 h**, donc pas de
    redémarrage pendant l'incident disque ;
  - `yunicity_qa` : 22 Mo, 80 tables `public`, environ 9 131 lignes estimées,
    1 séquence, révision Alembic `20261103_0066` ;
  - bases `postgres` et `yunicity_test` ;
  - rôle `yunicity_qa` superutilisateur.
- **Sauvegarde possible, mais non faite** :
  - `pg_dump` et `psql` sont absents de la machine, et `docker exec` est
    bloqué ;
  - un essai de `COPY … TO STDOUT` sur `alembic_version` réussit, sans rien
    écrire ;
  - une sauvegarde **des données** des 80 tables par `COPY` (asyncpg) est donc
    faisable sans installation. Le schéma se reconstruit avec Alembic en
    `20261103_0066`, ce qui reste moins fidèle qu'un `pg_dump`.

### 4 septies. Sondes C1 à C7 (2026-11-06, décision de Kyria) — DIAGNOSTIC

**Environnement**
- Docker est toujours bloqué. Postgres QA est atteint directement sur
  127.0.0.1:5455. Le lanceur habituel (`qa-backend-pytest-host.sh` →
  `run_backend_tests`) a fait valider la cible par
  `evaluate_pytest_database_target` avant toute connexion.
- Bases jetables : `yunicity_test_b7354f7bcb8f`, puis `yunicity_test_466f186d6801`,
  **supprimées par le lanceur**. Redis de test sur la db 1, vidé.
  **`yunicity_qa` n'a pas été touchée.**
- Code testé : `a4c9a628` (worktree `sql-log-params`, resté propre :
  `PYTHONDONTWRITEBYTECODE=1`, cache pytest désactivé).
- Venv `pr202-ci` non modifié. `sentry-sdk==2.73.0` installé à part dans le
  scratchpad (`--target`, `--no-deps`, empreinte du verrou exigée).
- Versions **chargées** (relevé `versions-loaded.txt`), toutes conformes à
  `uv.lock` :
  - SQLAlchemy 2.0.49, asyncpg 0.31.0 ;
  - sentry-sdk 2.73.0, chargé depuis le scratchpad ;
  - FastAPI 0.136.1, Starlette 1.0.0, uvicorn 0.47.0, arq 0.28.0,
    Pydantic 2.13.4 ;
  - `app` chargé depuis `yunicity-wt-sql-log-params`.
  
  **Écart : Python 3.13.1 en local, 3.12 en CI.**
- Sondes hors dépôt, dans le scratchpad (`probes/test_sql_error_probes.py`),
  chargées avec `-p tests.conftest` : **27 passées, puis 6 relancées**. Les
  constats sont écrits en JSON lignes, sans assertion de fuite.
- Elles utilisent un vrai serveur uvicorn (configuration de journaux de la
  ligne de commande), le vrai lifespan, Sentry réel avec un transport de capture
  local (aucun envoi réseau, DSN `sentry.invalid`) et un vrai worker arq en mode
  burst.
- La route et le hook de sonde reproduisent la forme du code applicatif
  (`raise … from exc`, `exc_info=…`). Sous Windows, `SIGUSR1` est remplacé dans
  la sonde arq seulement.

**Erreurs provoquées** (marqueur fictif de 23 caractères)
- `unique` : 23505, la valeur apparaît dans `DETAIL`.
- `cast_serveur` : 22P02, la valeur apparaît dans le message du serveur.
- `encodage_pilote` : erreur côté asyncpg, la valeur apparaît dans le message
  du pilote.

**Résultats**

| Chemin | Constat mesuré |
|---|---|
| C0 Champs | **Sûrs** (sans valeur) : `sqlstate`, `constraint_name`, `table_name`, `schema_name`, `severity`, ainsi que la classe à chaque niveau de la chaîne. **Porteurs de la valeur** : `str()` à tous les niveaux, `detail` (23505), `message` (22P02 et pilote). Aucun code de `app/` n'inspecte `.orig`, `sqlstate` ni `constraint_name` |
| C1 / C3 Formateurs de l'application | **Fuite** dans le formateur texte **et** dans `JsonLogFormatter`, avec `exc_info` comme avec `"%s", exc` |
| C2 `AppError from exc` | Via HTTP : 409 propre, rien dans les journaux, **aucun événement Sentry**. **Fuite** dès que l'`AppError` est journalisée avec `exc_info` (la chaîne est imprimée). Avec `"%s", AppError` : pas de fuite |
| C4 uvicorn | Erreur non gérée : « Exception in ASGI application » est journalisé par `uvicorn.error` **avec la valeur**, quel que soit `DEBUG`. Ce chemin échappe au formateur de l'application |
| C5 `FastAPI(debug=…)` | `DEBUG=true` : **la trace, avec la valeur, est renvoyée au client** dans la réponse 500. `DEBUG=false` : pas de fuite |
| C6 Sentry | Erreur non gérée **et** `logger.error(..., exc_info=…)` : la valeur apparaît dans **`exception.value`** et dans les **variables locales des frames**. **Indépendamment de la sonde**, les frames de SQLAlchemy et d'asyncpg portent les **paramètres liés** (`parameters`, `distilled_parameters`, `args`, `effective_parameters`). Sentry envoie donc **tous les paramètres** de la requête en échec, **même si le message d'erreur ne cite aucune valeur**, et quelle que soit l'option `hide_parameters`. Transactions et spans : pas de fuite (requêtes SQL sans valeurs). Le worker n'initialise pas Sentry |
| C7 Worker arq | **Fuite** dans le journal `arq.worker` (`failed, %s: %s` plus la trace). **Fuite persistée** : le résultat de la tâche, c'est-à-dire l'exception sérialisée avec la valeur, est stocké dans Redis (`arq:result:<id>`, durée de conservation par défaut d'arq) |

**Limites de la mesure**
- Les colonnes `stdout` et `stderr` ne sont pas significatives. Les handlers
  ont été créés avant le `capsys` du test : les preuves sont les captures
  posées sur les loggers.
- La troncature n'a **pas** été exercée cette fois : le marqueur de 23
  caractères reste sous le seuil d'asyncpg (environ 30). La troncature a été
  mesurée dans `APP-DEBUG-SQL-ECHO-TOKENS-01` ; un test avec un marqueur
  long est prévu.
- **SENTRY_DSN de la Preview : non vérifié** (infrastructure non consultée). On
  ne sait donc pas si C6 est actif en Preview.

## 4 octies. Plan de protection proposé — NON IMPLÉMENTÉ, en attente de validation

1. **Module pur `app/core/db_error_redaction.py`**, sans dépendance à FastAPI.
   - `describe_db_error(exc)` parcourt la chaîne `__cause__` / `__context__`,
     groupes d'exceptions compris. Pour les exceptions de SQLAlchemy
     (`StatementError` / `DBAPIError`) et d'asyncpg, il produit : classe,
     SQLSTATE, contrainte, table, colonne, schéma, type de données, et
     éventuellement les premiers caractères de l'instruction SQL, avec
     ses `$n` sans valeurs.
   - Le **message** et `DETAIL` **ne sont jamais réutilisés**. Le masquage est
     **structurel**, il ne recherche pas la valeur : les valeurs tronquées
     sont donc couvertes.
   - `format_redacted_exception(exc_info)` reproduit le format standard de
     Python, avec les frames et la chaîne complète, mais remplace le message
     de chaque exception SQL par sa description sûre.
2. **Journaux**
   - Un filtre de handler `RedactDbErrorValues` pré-remplit `record.exc_text`
     avec la version masquée, et remplace par leur description sûre les
     exceptions SQL passées dans `record.args` ou dans `record.msg`.
   - `JsonLogFormatter` doit utiliser `exc_text`.
   - `configure_logging` pose ce filtre sur le handler racine **et** sur les
     handlers d'`uvicorn` déjà configurés par la ligne de commande (C4). Le
     `startup` du worker le pose sur les handlers d'`arq` (C7).
3. **Sentry**
   - Ajouter `include_local_variables=False` (C6). Les frames de SQLAlchemy
     portent les paramètres, et le nettoyage par nom de variable de Sentry ne
     reconnaît ni `parameters` ni `args`.
   - Ajouter `before_send`, qui réécrit `exception.values[].value` des types
     SQL avec la description sûre et nettoie `logentry`, et
     `before_breadcrumb`, qui nettoie les messages de journal.
4. **C5**
   - **Option A (recommandée)** : `FastAPI(debug=False)` toujours. La trace
     reste dans les journaux, masquée.
   - **Option B** : `debug` seulement si `APP_ENV == "dev"`.
   
   **À trancher par Kyria** : avec l'option A, le développeur perd la trace
   dans le navigateur.
5. **C7 Worker** : le décorateur `redact_db_errors` sur les tâches arq
   intercepte les erreurs SQL et relève une `SanitizedDbError(description)
   from None`. Le journal d'arq et le résultat stocké dans Redis ne
   contiennent plus de valeur.
6. **Tests**, à ajouter au dépôt, sur base jetable :
   - chaque chemin de C1 à C7 ;
   - les variantes `DEBUG` vrai et faux, les 3 types d'erreur, les chaînes
     imbriquées et un marqueur long (plus de 30 caractères) ;
   - preuve **positive** que le SQLSTATE et la contrainte restent dans la
     sortie.
   
   Les 4 `xfail(strict)` existants mesurent l'exception **brute**, qui garde
   la valeur. Ils restent tels quels : la protection agit aux sorties, pas
   sur l'objet exception.
7. **Hors périmètre, à consigner** :
   - les journaux du serveur Postgres (`POSTGRES-SERVER-LOGS-EXPOSURE-01`) ;
   - les autres moteurs (`DB-ENGINES-HIDE-PARAMS-01`) ;
   - les messages qui insèrent une exception par f-string ou par
     `extra={"error": str(exc)}`. Relevé : 3 occurrences dans les seeds et
     les scripts, aucune sur un chemin SQL de requête.

## 4 nonies. Sauvegarde de `yunicity_qa` et implémentation (2026-11-06, décision de Kyria)

**Outils clients PostgreSQL 16**
- Source : `get.enterprisedb.com`, archive « binaries » Windows x64
  **16.15-1**. La 16.16 répond 403 ; la 16.15 est la plus récente servie.
- SHA-256 de l'archive :
  `25e6fcdfb8caec38691bf461125e7564508760666f7b8e5dc6a5f0818f58f81e`.
- **Exécutables non signés** (Authenticode `NotSigned`) et **pas d'empreinte
  publiée par EDB** : l'intégrité repose sur le seul HTTPS depuis la source
  officielle.
- Seuls les clients et leurs DLL ont été extraits (35 fichiers, 60 Mo) dans
  `C:\Users\kyria\tools\pgsql-16.15-client\bin`. Aucun installeur, aucun
  service, aucune modification du `PATH`.

**Sauvegarde**
- `pg_dump -Fc` (16.15) d'un serveur 16.4 →
  `C:\Users\kyria\yunicity-qa-backups\yunicity_qa-20261106-131603.dump`
  (346 710 octets).
- SHA-256 `4a8f5b3a…a886740`, conservé dans le fichier `.sha256` voisin.
- 78 blocs « TABLE DATA ».

**Restauration prouvée**
- Restauration avec `pg_restore --no-owner --exit-on-error` dans
  `yunicity_test_restore_b598c6ca` : code de sortie 0.
- Comparaison exhaustive avec la source, toutes **identiques** :
  - 78 tables et 9 131 lignes, avec 0 écart de lignes table par table ;
  - 330 index et 298 contraintes ;
  - 2 vues, 791 fonctions et 7 triggers ;
  - les séquences et leurs valeurs ;
  - les extensions (plpgsql 1.0, postgis 3.4.3) ;
  - la révision Alembic `20261103_0066`.
- La base de restauration a été supprimée ensuite, après vérification de son
  préfixe. `yunicity_qa` n'a pas été modifiée.

**Implémentation** : branche `fix/app-sql-error-values`, issue de `a4c9a628`,
commit `5147bdab`, non poussé à ce stade.
- **C5 : option A appliquée** (`FastAPI(debug=False)` toujours). C'était ma
  recommandation ; Kyria n'avait pas tranché explicitement : **à confirmer**.
- Modules ajoutés :
  - `app/core/sql_error_redaction.py` (300 lignes) : classification,
    description sûre, trace masquée, fabrique d'enregistrements de journal,
    décorateur arq ;
  - `app/core/sentry_sql_scrubbing.py` : `before_send` et `before_breadcrumb`.
- **Nouveau constat** : l'intégration ASGI de sentry-sdk 2.73.0 relève
  l'exception avec `raise exc from None` (`integrations/asgi.py:217`). Cela
  **efface la `__cause__` de l'exception d'origine**, avant même qu'uvicorn la
  journalise.
  - C'est déjà le comportement en production dès que Sentry est actif : la
    trace d'uvicorn y perd toute la chaîne des causes.
  - Le correctif lit donc les champs de diagnostic via `StatementError.orig`,
    et un test de non-régression couvre ce cas.
- **Erreur de test corrigée** : la remise à zéro de Sentry dans les tests
  (`sentry_sdk.init()` sans argument) relisait `SENTRY_DSN` dans
  l'environnement et recréait un transport HTTP.
  - Conséquence : **3 tentatives de résolution DNS de `sentry.invalid`**,
    domaine réservé qui ne résout jamais. Aucune donnée ne pouvait partir.
  - Correction : transport local injecté dès `init` et remise à zéro avec
    `dsn=""`. Plus aucune tentative ensuite (0 sur les deux lancements
    suivants).
  - Les sondes du §4 septies avaient la même remise à zéro : aucune trace de
    tentative DNS dans leurs journaux, mais on ne peut pas l'exclure. La
    conclusion reste la même : rien ne pouvait être envoyé.
- **Décompte des xfail réconcilié** : il y a **4 tests marqués, dont 3
  paramétrés `debug_true` / `debug_false`**, ce qui fait **7 cas**. Le « 4 » du
  rapport précédent comptait les tests ; le « 7 », les cas exécutés.
  - Aucun n'a disparu, et leurs assertions sont inchangées.
  - Seule la justification (`reason`) a été mise à jour. Ils inspectent aussi
    le texte **brut** de l'exception, qui garde la valeur par conception : ils
    restent donc en échec attendu.
- **Contrôles locaux** (Python 3.13, venv `pr202-ci` avec sentry 2.73.0 à part,
  base jetable via le lanceur) :
  - ruff : OK ;
  - mypy strict `app tests workers` en `--python-version 3.12 --platform
    linux` : 732 fichiers, 0 erreur. Sans `--platform linux`, on obtient
    5 erreurs POSIX préexistantes dans `volume_bootstrap.py` ;
  - tests ciblés : **49 réussis, 7 xfail, 0 XPASS**.
- **Suite complète en local : non concluante.** Elle a été arrêtée par le délai
  de 50 minutes à 14 % : environ 7 s de préparation par test sous Windows,
  mesuré sur un fichier admin (11 tests en 78 s). Ce n'est pas un blocage.
  - La base `yunicity_test_485ae86d483d`, laissée par l'interruption, a été
    supprimée après vérification : aucune session, aucun processus.
  - Le Redis de test (db 1) n'a pas été vidé par le lanceur interrompu ; c'est
    sans effet sur la db 0.
- **Branche poussée** `fix/app-sql-error-values` (`5147bdab`), nouvelle sur la
  distante, sans `--force`.
- **CI Docker** (`workflow_dispatch`, run 42229543565), **succès** sur
  `5147bdab`, en **Python 3.12.16** :
  - **2122 réussis, 19 ignorés, 7 xfailed, 0 XPASS** ;
  - référence `a4c9a628` : 2083 / 19 / 7. Il y a donc +39 tests, autant que
    de nouveaux tests : aucun n'a été ignoré.
- **Non fait** : la CI Backend (ruff, mypy et pytest en 3.12). Elle ne se
  déclenche que sur une PR vers `main`, donc après intégration à la branche
  Preview, via la PR #202, comme pour `a4c9a628`.
- **Aucune intégration à la Preview, aucun déploiement.**

## 4 decies. Audit des formats manuels d'exception (2026-11-06, décision de Kyria)

**Périmètre vérifié** : `backend/app`, `backend/workers` et `backend/scripts`,
à `5147bdab`. Les motifs recherchés sont :
- appels de journalisation en f-string, `%`, `.format` ou concaténation ;
- `str()` ou `repr()` d'une variable d'exception ;
- `{exc}`, `{e}`, `{err}`, `{error}` et `{ex}` dans une f-string ;
- `extra=` contenant une exception.

**Aucune recherche des valeurs par expression régulière** dans les messages
(consigne de Kyria).

| Chemin | Exceptions possibles | Verdict |
|---|---|---|
| `passport_challenge_backfill_service` (2), `passport_reputation_backfill_service` (2), `yuni_wallet_backfill_service` (2) : `f"… {exc}"` dans `error_details`, imprimé par `scripts/backfill_*.py` | `except Exception` autour d'écritures en base, donc **erreurs SQL possibles**. `DETAIL` cite la clé ; une violation `CHECK` cite la ligne entière | **Corrigé** (`5960cf68`) : `safe_str(exc)`. 3 tests de régression, **en échec sur l'ancien code** (vérifié), réussis ensuite |
| `detail=str(exc)` : `admin_partner_creator_contents`, `organization_partner_creator_contents`, `profile_service`, `*_media_service`, `local_video_media_policy`, `passport_me` | `ValueError` de validation, `ContentTypeMismatchError`, `ChallengeRewardWalletError` (message fixe) | Pas d'erreur SQL possible |
| `schemas/partner_offer_management.py:59` | `validate_flash_fields`, fonction pure | Pas d'erreur SQL |
| `qa_fixtures` `extra={"error": str(exc)}` | `OSError` / `RuntimeError` du système de fichiers | Pas d'erreur SQL |
| `partner_lead_import`, `qa/launcher` | JSON invalide, refus du garde | Pas d'erreur SQL |
| `scripts/rotate_passport_qr_tokens.py` `REFUS : {error}` | Chaînes produites par le garde | Pas d'erreur SQL |
| `scripts/bootstrap_admin`, `import_*`, `app/db/dev`, `bootstrap_admins`, `seed_prod_01b`, `pilot_m00` | Erreurs métier ou HTTP typées | Pas d'erreur SQL |
| `scripts/data_cleanup_01_inventory_run.py:93` `print(f"ERROR: {exc}")` | Erreur asyncpg possible, sur un SQL statique sans paramètre | **Non modifié** : outil d'inventaire en lecture seule qui **imprime déjà des lignes de données** sur le terminal de l'opérateur, par conception. Masquer son message d'erreur ne changerait pas son exposition. Limite consignée |

**Limite conservée pour les futurs appels** :
- les protections couvrent l'exception passée à la journalisation (`exc_info`,
  argument `%s`, message), Sentry, la réponse HTTP et le résultat arq ;
- **pas** le texte d'une exception recopié à la main (f-string,
  concaténation, `str(exc)`). Tout code qui construit un texte à partir d'une
  exception pouvant venir de la base doit passer par `safe_str(exc)`
  (`app/core/sql_error_redaction.py`). La docstring du module énonce cette
  limite.

**Contrôles sur `5960cf68`** :
- ruff : OK ;
- mypy strict (3.12, Linux) : 732 fichiers, 0 erreur ;
- tests des 3 services sur base jetable : 21 réussis.

## 5. Inconnues

- Présence de `SENTRY_DSN` en Preview (non vérifiée).
- Comportement sous Python 3.12 (CI) : à confirmer par la CI Docker lors de
  l'implémentation.
- État de Docker : le démon ne répond plus. Postgres QA et Redis répondent
  directement.

## 6. Tâches actives

Aucune. Diagnostic terminé, plan (§4 octies) présenté, **aucune modification
de code**.

## 7. Prochaine action

Go de Kyria pour l'intégration (2026-11-06), après l'audit du §4 decies :
1. Avance rapide de `feat/c3-videos-refonte-final` jusqu'à `5960cf68`, plus
   un commit documentaire séparé, sans `--force`, après vérification de la
   distante.
2. CI de la PR #202, puis SHA servi par les deux services Preview.
3. Aucune erreur provoquée avec un vrai jeton. C5 (option A) reste à
   confirmer explicitement par Kyria.
