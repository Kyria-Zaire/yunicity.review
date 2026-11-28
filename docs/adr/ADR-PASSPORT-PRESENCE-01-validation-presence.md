# ADR-PASSPORT-PRESENCE-01 — Validation de présence par agent affecté

| Champ | Valeur |
|---|---|
| Statut | **APPROVED** — Architecture Authority (CTO), GO BUILD du 2026-11-27, avec les amendements D1 à D7 (DOC-GOV-01 § 2.2) |
| Date | 2026-11-26 |
| Ticket | `docs/workflow/tickets/PASSPORT-PRESENCE-01.md` |
| PRD | `docs/prd/PRD-PASSPORT-PRESENCE-01-validation-presence.md` |
| Base | `ea1edf11` (`feat/c3-videos-refonte-final`) |
| Zone rouge | jetons porteurs · autorisations · PII · migration |

## 1. Contexte (faits, `ea1edf11`)

- Aucune notion de campagne, d'inscription, de présence ni d'agent. `EventInterest` est un
  signal d'intérêt, pas une inscription (B4/D4).
- QR Passport `YNCP1:<qr_token>` : jeton **statique**, stocké **en clair**
  (`passports.qr_token`, unique), utilisé par la remise partenaire (`/scan/resolve`,
  `/scan/redeem`). Des jetons ont été exposés à un service QR tiers
  (`PASSPORT-QR-THIRD-PARTY-01`) ; rotation préparée, non exécutée
  (`PASSPORT-QR-TOKEN-ROTATION-01`). **Hors de cet ADR (B12).**
- `/passport/stamps/claim` : auto-tampon par le participant ; **exclu** comme preuve de
  présence.
- Garde staff existante : `require_any_permission("moderation.manage", "system.admin")`.
- Audit persistant existant : tables `*_admin_actions` (ex. `passport_admin_actions`).
- Idempotence existante : `posts.client_request_id` + empreinte serveur
  (`post_idempotency.compute_request_fingerprint`) + index unique `(author_id,
  client_request_id)`.
- Limitation de débit : Redis `INCR` + `EXPIRE` atomique (`app/core/rate_limit.py`).
- Migrations : Alembic, tête `20261103_0066`, verrou consultatif dans `alembic/env.py`.

## 2. Décision

Créer un domaine **`presence`** indépendant de la remise et des récompenses :

1. Entités dédiées (§ 3) ; aucune table existante modifiée sauf l'ajout additif
   `users.is_test` et la migration de **convergence** `20261126_0068` (§ 11), qui
   retire un éventuel `DEFAULT` résiduel sur `users.is_system_account` et
   `users.force_password_reset` sans réécrire aucune ligne ni changer le schéma
   canonique (amendement CTO D1/D3, 2026-11-26).
2. Le participant obtient une **session éphémère** contenant un jeton QR `YNCP2:` opaque
   et un **code manuel** distinct, tous deux stockés **uniquement sous forme HMAC**.
3. Un **agent affecté** à la campagne résout puis confirme ; l'autorisation de l'agent est
   vérifiée **avant** toute recherche de jeton (anti-oracle, comme
   `SCAN-RESOLVE-TOKEN-ORACLE-01`).
4. La confirmation est **idempotente** (clé client + empreinte), crée **au plus une**
   présence par participant et campagne, **consomme** la session dans la même
   transaction et écrit une ligne d'audit immuable.
5. Tout le domaine est derrière `PRESENCE_VALIDATION_ENABLED=false` (404 si désactivé).
6. **Aucun** appel aux hooks Yunimoney, réputation, défis, tampons ou remise.

### Alternatives rejetées

| Alternative | Raison du rejet |
|---|---|
| Réutiliser `YNCP1` / `/scan/*` | Jeton statique exposé, sémantique remise, effets Yunimoney (B12, D6) |
| Jeton signé (JWT/HMAC) sans état | Rejeu et consommation unique exigent un état ; clé de signature partagée à éviter (le JWT tampon réutilise `jwt_secret_key`) |
| Code manuel = préfixe du jeton QR | Interdit (B7) : la capture du QR révélerait le code et inversement |
| Étendre `local_events` | Une campagne a des règles propres (organisation obligatoire, fenêtre, agents, `is_test`) (B2) |
| Inscription publique dans ce lot | Hors périmètre (B3, PILOT-04) |

## 3. Modèle de données

Toutes les clés primaires sont des UUID ; horodatages `timestamptz` (UTC).

**Règle d'indexation (amendement D1)** : **toute clé étrangère est indexée**, soit par un
index dédié `ix_<table>_<colonne>`, soit parce qu'elle est la première colonne d'une
contrainte d'unicité. Les tableaux ci-dessous restent la référence des contraintes ;
l'inventaire exhaustif des index est le suivant.

| Table | Index dédiés | FK couverte par la première colonne d'une unicité |
|---|---|---|
| `presence_campaigns` | `organization_id`, `local_event_id`, `status`, `created_by_user_id` | — |
| `presence_registrations` | `user_id`, `changed_by_user_id` | `campaign_id` (`uq_presence_registrations_campaign_user`) |
| `presence_agent_assignments` | `agent_user_id`, `changed_by_user_id` | `campaign_id` (`uq_presence_agent_assignments_campaign_agent`) |
| `presence_sessions` | `passport_id`, `user_id`, `expires_at` | — (`qr_token_hmac`, `manual_code_hmac` : uniques) |
| `presence_records` | `participant_user_id`, `registration_id`, `agent_user_id` | `campaign_id` (`uq_presence_records_campaign_participant`) |
| `presence_operations` | `campaign_id`, `participant_user_id`, `presence_id`, `created_at` | `agent_user_id` (`uq_presence_operations_agent_client_operation`) |
| `presence_admin_actions` | `action`, `actor_user_id`, `campaign_id`, `target_user_id` | — |

### `presence_campaigns`

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | uuid | PK |
| `organization_id` | uuid | **NOT NULL**, FK `organizations.id` `ON DELETE RESTRICT`, index |
| `local_event_id` | uuid | NULL, FK `local_events.id` `ON DELETE SET NULL` |
| `city` | varchar(128) | NOT NULL |
| `title` | varchar(160) | NOT NULL |
| `status` | varchar(16) | NOT NULL, défaut `draft`, CHECK `status IN ('draft','open','closed','archived')`, index |
| `presence_opens_at` | timestamptz | NOT NULL |
| `presence_closes_at` | timestamptz | NOT NULL ; CHECK `presence_closes_at > presence_opens_at` |
| `is_test` | boolean | NOT NULL, défaut `false` |
| `created_by_user_id` | uuid | NULL, FK `users.id` `ON DELETE SET NULL` |
| `created_at`, `updated_at` | timestamptz | NOT NULL |

### `presence_registrations`

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | uuid | PK |
| `campaign_id` | uuid | NOT NULL, FK `presence_campaigns.id` `ON DELETE RESTRICT` |
| `user_id` | uuid | NOT NULL, FK `users.id` `ON DELETE CASCADE`, index |
| `status` | varchar(16) | NOT NULL, CHECK `IN ('confirmed','cancelled')` |
| `status_changed_at` | timestamptz | NOT NULL |
| `changed_by_user_id` | uuid | NULL, FK `users.id` `ON DELETE SET NULL` |
| `created_at`, `updated_at` | timestamptz | NOT NULL |
| | | **UNIQUE (`campaign_id`, `user_id`)** |

### `presence_agent_assignments`

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | uuid | PK |
| `campaign_id` | uuid | NOT NULL, FK `presence_campaigns.id` `ON DELETE RESTRICT` |
| `agent_user_id` | uuid | NOT NULL, FK `users.id` `ON DELETE CASCADE`, index |
| `status` | varchar(16) | NOT NULL, CHECK `IN ('active','revoked')` |
| `status_changed_at` | timestamptz | NOT NULL |
| `changed_by_user_id` | uuid | NULL, FK `users.id` `ON DELETE SET NULL` |
| `created_at`, `updated_at` | timestamptz | NOT NULL |
| | | **UNIQUE (`campaign_id`, `agent_user_id`)** |

### `presence_sessions` (session éphémère du participant)

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | uuid | PK |
| `passport_id` | uuid | NOT NULL, FK `passports.id` `ON DELETE CASCADE`, index |
| `user_id` | uuid | NOT NULL, FK `users.id` `ON DELETE CASCADE` |
| `qr_token_hmac` | char(64) | NOT NULL, **UNIQUE** |
| `manual_code_hmac` | char(64) | NOT NULL, **UNIQUE** |
| `expires_at` | timestamptz | NOT NULL, index |
| `consumed_at` | timestamptz | NULL |
| `created_at` | timestamptz | NOT NULL |

Le jeton et le code **ne sont jamais stockés en clair** ; ils ne sont renvoyés qu'une fois,
à l'émission.

### `presence_records` (la présence)

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | uuid | PK |
| `campaign_id` | uuid | NOT NULL, FK `presence_campaigns.id` `ON DELETE RESTRICT` |
| `participant_user_id` | uuid | NOT NULL, FK `users.id` `ON DELETE CASCADE` |
| `registration_id` | uuid | NOT NULL, FK `presence_registrations.id` `ON DELETE RESTRICT` |
| `agent_user_id` | uuid | NULL, FK `users.id` `ON DELETE SET NULL` |
| `source` | varchar(8) | NOT NULL, CHECK `IN ('scan','manual')` |
| `validated_at` | timestamptz | NOT NULL |
| | | **UNIQUE (`campaign_id`, `participant_user_id`)** |

### `presence_operations` (idempotence + audit des validations — en ajout seulement)

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | uuid | PK (identifiant d'opération) |
| `campaign_id` | uuid | NOT NULL, FK `presence_campaigns.id` `ON DELETE RESTRICT`, index |
| `agent_user_id` | uuid | NULL, FK `users.id` `ON DELETE SET NULL` (la suppression d'un compte agent ne doit pas effacer l'audit) ; toujours renseigné à l'insertion |
| `client_operation_id` | uuid | NOT NULL |
| `request_fingerprint` | char(64) | NOT NULL |
| `participant_user_id` | uuid | NULL (inconnu si l'identifiant n'a pas été résolu), FK `users.id` `ON DELETE SET NULL` |
| `presence_id` | uuid | NULL, FK `presence_records.id` `ON DELETE SET NULL` |
| `source` | varchar(8) | NOT NULL, CHECK `IN ('scan','manual')` |
| `result` | varchar(24) | NOT NULL, CHECK `IN ('posted','already_processed','rejected')` |
| `reason_code` | varchar(48) | NULL (obligatoire si `rejected`) |
| `created_at` | timestamptz | NOT NULL, index |
| | | **UNIQUE (`agent_user_id`, `client_operation_id`)** |

`uncertain` n'existe **pas** en base (état client). `failed` (erreur serveur) ne laisse
**aucune** ligne : la transaction est annulée.

### `presence_admin_actions` (audit staff — modèle ADMIN-03B)

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | uuid | PK |
| `action` | varchar(48) | NOT NULL, index (`campaign_created`, `campaign_status_changed`, `registration_set`, `agent_assignment_set`, `user_test_flag_set`) |
| `actor_user_id` | uuid | NULL, FK `users.id` `ON DELETE SET NULL` |
| `campaign_id` | uuid | NULL, FK `presence_campaigns.id` `ON DELETE SET NULL` |
| `target_user_id` | uuid | NULL, FK `users.id` `ON DELETE SET NULL` |
| `previous_value`, `new_value` | varchar(32) | NULL |
| `created_at` | timestamptz | NOT NULL |

### Colonne ajoutée

`users.is_test boolean NOT NULL DEFAULT false` (métadonnée seule sous PostgreSQL ≥ 11).

## 4. Machines d'états

- **Campagne** : `draft → open → closed → archived` ; `draft → archived`. Toute autre
  transition → `409 PRESENCE_INVALID_TRANSITION`. Validation possible **si et seulement
  si** `status = open` **et** `presence_opens_at ≤ now_utc < presence_closes_at` (heure
  serveur UTC, aucune tolérance — B8).
- **Inscription** : `confirmed ⇄ cancelled` (staff uniquement). Seule `confirmed` rend
  éligible.
- **Affectation** : `active ⇄ revoked` (staff uniquement). Seule `active` autorise.
- **Session** : `émise → consommée` ou `émise → expirée` (60 s). Plusieurs sessions
  vivantes possibles pour un même Passport (la précédente reste valable jusqu'à son
  expiration, pour ne pas invalider un QR en cours de lecture lors du renouvellement à
  30 s) ; les sessions expirées du Passport sont supprimées à chaque émission.
  **Plafond (amendement CTO D1 de 01B, 2026-11-27)** : au plus **3** sessions vivantes par
  Passport, une session vivante vérifiant `consumed_at IS NULL AND expires_at >
  clock_timestamp()`. Le plafond est contrôlé **sous le verrou du Passport** (`SELECT …
  FROM passports … FOR UPDATE`), après la purge. Au-delà : `429
  PRESENCE_SESSION_LIMIT_REACHED` avec `Retry-After`, égal au nombre de secondes jusqu'à la
  **première** expiration parmi les sessions vivantes (arrondi au supérieur, minimum 1).
  Aucune session encore vivante n'est invalidée, et la réponse ne contient ni jeton ni
  condensat.
- **Présence** : `posted`, immuable (correction = hors périmètre, OPS-01).
- **Opération** : `posted | already_processed | rejected`, immuable.

## 5. Autorisations

| Action | Qui | Contrôle |
|---|---|---|
| Émettre une session | participant authentifié | Passport `active`, utilisateur actif |
| Lister ses campagnes | agent | affectations `active` |
| Résoudre / confirmer / relire une opération | agent | affectation `active` **vérifiée avant** la recherche de l'identifiant ; refus `403 PRESENCE_AGENT_NOT_ASSIGNED` |
| Auto-validation | — | `participant_user_id == agent_user_id` → `403 PRESENCE_SELF_VALIDATION_FORBIDDEN` (scan **et** code) |
| Campagnes, inscriptions, affectations, `is_test` | staff (`moderation.manage` ou `system.admin`) | garde existante + audit `presence_admin_actions` |

Aucun rôle d'agent global ; aucune route d'administration hors staff.

## 6. Jeton QR et code manuel

- **Jeton** : `secrets.token_urlsafe(32)` (256 bits), présenté `YNCP2:<jeton>`.
- **Code manuel** : 8 caractères tirés **indépendamment** par `secrets.choice` dans
  l'alphabet Crockford Base32 `0123456789ABCDEFGHJKMNPQRSTVWXYZ` (40 bits), affiché
  `XXXX-XXXX`. Saisie normalisée : majuscules, suppression des espaces et tirets,
  `I`/`L` → `1`, `O` → `0` ; tout autre caractère → invalide.
- **Stockage** : `HMAC-SHA256(PRESENCE_TOKEN_PEPPER, "qr:" + jeton)` et
  `HMAC-SHA256(PRESENCE_TOKEN_PEPPER, "code:" + code_normalisé)` — séparation de domaine ;
  le poivre rend inutilisable un vol de base pour un code de 40 bits.
- **TTL** : 60 s ; `refresh_after` : 30 s.
- **Horloge (amendement CTO D4 de 01B, 2026-11-27)** : horloge PostgreSQL
  **`clock_timestamp()`**, jamais `now()`. `now()` est figé au début de la transaction :
  une émission ayant attendu le verrou du Passport créerait sinon une session dont une
  partie des 60 s serait déjà écoulée. `expires_at = clock_timestamp() + 60 s` est calculé
  **après** l'acquisition du verrou, par la base, et renvoyé par `RETURNING`. Les
  prédicats d'expiration et de consommation (01C) et les tests de concurrence utilisent
  la même horloge.
- **Consommation** : `UPDATE … SET consumed_at = clock_timestamp() WHERE id = … AND
  consumed_at IS NULL AND expires_at > clock_timestamp()` dans la transaction qui insère
  la présence.
- **Collision des condensats** : `qr_token_hmac` et `manual_code_hmac` sont uniques sur
  toute la table, y compris pour les sessions expirées non encore purgées. Pour le code
  (40 bits), la probabilité de collision au tirage suivant est donc approximativement
  **`N / 2⁴⁰`**, où `N` est le nombre de condensats de code conservés, et non `2⁻⁴⁰`.
  Une violation d'unicité déclenche un nouveau tirage dans un **savepoint**, trois
  tentatives au maximum, sans laisser de ligne ni d'audit partiel ; au-delà, `503` et
  aucune session.
- **Poivre** : variable `PRESENCE_TOKEN_PEPPER` (≥ 32 caractères), **distincte** de
  `JWT_SECRET_KEY` et de `REFRESH_TOKEN_PEPPER`, par environnement, jamais dans Git.
  Drapeau actif sans poivre valide → erreur de configuration au démarrage (même convention
  que `REFRESH_TOKEN_PEPPER`). **Rotation** : changer le poivre invalide toutes les
  sessions vivantes (≤ 60 s d'impact) ; aucune donnée durable n'en dépend.

## 7. Idempotence et concurrence

- `client_operation_id` (UUID v4, généré par le client) **obligatoire** à la confirmation.
- Empreinte : `SHA-256` canonique de `{campaign_id, source, credential_hmac}` — jamais de
  secret brut.
- Même clé + même empreinte → **réponse rejouée** (même `operation_id`, même résultat,
  `replayed: true`). Même clé + autre empreinte → `409 IDEMPOTENCY_KEY_REUSED`.
- Unicité garantie par la base : `UNIQUE (campaign_id, participant_user_id)` sur
  `presence_records` et `UNIQUE (agent_user_id, client_operation_id)` sur
  `presence_operations`. Une `IntegrityError` déclenche une relecture dans une nouvelle
  transaction (`already_processed` ou rejeu), jamais une seconde écriture.
- Ordre de la confirmation (une transaction) : drapeau → affectation → opération existante
  → campagne et fenêtre → session par HMAC (`FOR UPDATE`) → auto-validation → Passport et
  utilisateur actifs → inscription `confirmed` → présence existante (`already_processed`,
  sans consommer) → session déjà consommée (`rejected`) → insertion présence + consommation
  + opération `posted` → commit.

## 8. Audit et rétention

- Chaque validation (y compris `rejected` et `already_processed`) produit **une** ligne
  `presence_operations` : agent, campagne, participant (si résolu), résultat, motif,
  horodatage, identifiant d'opération, source. **Jamais** de QR, code, haché d'identifiant,
  IP ni User-Agent (B9). Les refus antérieurs à l'autorisation (agent non affecté) ne sont
  pas rattachables à une campagne autorisée : ils sont journalisés (sans secret) et
  limités en débit, pas enregistrés en base.
- Résolution : lecture seule, non auditée en base (journalisée sans secret).
- Rétention (provisoire, B9) : 12 mois pour le pilote ; 30 jours pour les données
  `is_test`. **Purge automatisée : ticket de suivi obligatoire avant production.**

## 9. Modèle de menace (STRIDE)

| Menace | Vecteur | Contre-mesure | Test |
|---|---|---|---|
| **S** usurpation de participant | capture d'écran / photo du QR, transmission du code | TTL 60 s, consommation unique, agent affecté physiquement présent, aperçu minimisé | expiré, consommé, rejoué |
| **S** usurpation d'agent | compte non affecté | affectation `active` vérifiée en premier ; pas de rôle global | agent non affecté / révoqué |
| **S** auto-validation | participant affecté comme agent | refus `SELF_VALIDATION_FORBIDDEN` (scan et code) | dédié |
| **T** falsification d'identité | identifiant participant fourni par le client | jamais accepté : participant dérivé de la session | — (aucun paramètre) |
| **T** rejeu | même requête renvoyée | idempotence + consommation + unicité | double scan, même clé |
| **T** course | deux agents / deux requêtes simultanées | contraintes uniques + relecture | concurrence (deux sessions) |
| **R** répudiation | agent nie une validation | `presence_operations` immuable + `presence_admin_actions` | présence de la ligne |
| **I** oracle de jeton | sondage par un non-agent | autorisation avant recherche ; réponses uniformes | non-agent → 403 quel que soit le jeton |
| **I** fuite de PII | résolution | B6 : nom d'affichage, initiale, Passport masqué, état d'inscription uniquement | schéma de réponse |
| **I** fuite de secret | logs, URL, erreurs, Sentry | identifiants uniquement en corps POST ; jamais journalisés ; erreurs sans écho | capture des logs |
| **I** vol de base | lecture de `presence_sessions` | HMAC poivré ; TTL 60 s | — |
| **D** force brute du code | 2^40 combinaisons | débit par agent et par utilisateur ; affectation requise ; TTL ; au plus 3 codes vivants par Passport (D1 de 01B) | dépassement → 429 |
| **D** inondation de sessions | émission en boucle | débit par utilisateur (150 / h) ; plafond de 3 sessions vivantes par Passport, contrôlé sous verrou, `429 PRESENCE_SESSION_LIMIT_REACHED` avec `Retry-After` (D1 de 01B) ; purge des sessions expirées à l'émission ; débit par IP (600 / h) **secondaire uniquement** (D3 de 01B) : la confiance accordée à `X-Forwarded-For` sur Railway n'est pas prouvée (`PROXY-TRUSTED-CLIENT-IP-01`) et cette limite n'est pas une garantie | dépassement → 429 ; plafond sous concurrence |
| **D** contournement de la limitation de débit (D2 de 01B) | Redis absent ou indisponible | drapeau actif sans `REDIS_URL` → refus au démarrage, dans tous les environnements ; Redis indisponible à l'exécution → `503`, aucune session créée | configuration ; Redis en panne → 503 sans écriture |
| **E** élévation | appel d'une route staff | garde staff existante ; 404 si drapeau désactivé | non-staff → 403 |
| **E** effets économiques | présence déclenchant un avantage | aucun import des hooks Yunimoney / réputation / défis / tampons / remise | test statique + aucune ligne `yuni_transactions` |
| **E/R** abus ou erreur d'un membre du staff (amendement D1) | inscription, affectation, statut de campagne ou `is_test` modifiés à tort ou sans droit | autorisation staff stricte (`moderation.manage` ou `system.admin`, jamais anonyme ni utilisateur ordinaire, D4) ; **acteur enregistré** dans `presence_admin_actions` à chaque changement effectif, dans la même transaction. Risque résiduel : la table d'audit n'est pas protégée en base contre un rôle SQL privilégié (même niveau que les autres `*_admin_actions`) | anonyme 401, non-staff 403, `actor_user_id` présent dans l'audit, PUT sans changement → aucun audit |
| **T** `is_test` sans effet dans les anciens flux (amendement D1) | compte `is_test` utilisant `YNCP1`, tampons ou remise avant le ticket de suivi | **aucun branchement aux récompenses dans 01A** ; risque **résiduel documenté** ; exclusion dans les flux existants = **suivi obligatoire avant pilote réel** | — (hors 01A, ticket § 5) |
| **D/T** fenêtre de compatibilité pendant la migration (amendement D1) | `alembic upgrade` exécuté pendant que l'ancienne version sert | ancienne et nouvelle versions compatibles : `users.is_test` garde `DEFAULT false` (l'ancienne version l'ignore) ; `is_system_account` et `force_password_reset` toujours fournis par l'ORM (`default=False`, déjà le cas à `ea1edf11`, aucun INSERT SQL brut sur `users`) ; **aucune réécriture de lignes** ; `0068` convergente et idempotente ; exécution Preview **surveillée** (§ 11) | migration 0066→0067→0068 + downgrade, scénario historique, compilation des INSERT ORM, parité modèle / schéma migré |
| **I** différence de réponse avant authentification (D7) | anonyme envoyant un JSON **syntaxiquement** malformé à une route staff qui accepte un corps | FastAPI 0.136.1 décode le corps avant de résoudre les dépendances : réponse `422 json_invalid` **avant** authentification. **Limite acceptée pour 01A (D7)** : la réponse ne dépend que de la syntaxe du corps, jamais de l'existence de la campagne ni de l'utilisateur ; aucun code `*_NOT_FOUND`, aucune donnée métier, aucune écriture. Un corps syntaxiquement valide mais invalide métier est traité **après** l'authentification (401). **Aucun contournement global de FastAPI** dans ce lot | `test_anonymous_malformed_json_reveals_nothing_about_resources` (422 `json_invalid`, réponse identique pour une ressource existante ou inconnue, aucune écriture) ; `test_anonymous_is_refused_everywhere_without_existence_oracle` (401 sur les six routes, corps conforme ou non au schéma, aucune écriture) |

Environnements : bases et poivres distincts par environnement ; une session émise en
Preview n'existe pas en production.

## 10. Drapeau

`PRESENCE_VALIDATION_ENABLED` (`bool`, défaut **`false`**). Désactivé → **404** sur toutes
les routes du domaine (participant, agent, staff), sans lecture ni écriture. Activation
Preview uniquement après validation explicite.

Drapeau actif : `PRESENCE_TOKEN_PEPPER` valide (§ 6) **et** `REDIS_URL` renseignée sont
exigés **dans tous les environnements** (amendement CTO D2 de 01B, 2026-11-27) ; sinon la
configuration est refusée au démarrage. Redis indisponible à l'exécution → `503`, aucune
session créée.

Drapeau actif : `RATE_LIMIT_KEY_PEPPER` est aussi exigé, avec au moins 32 caractères, et
doit différer de `PRESENCE_TOKEN_PEPPER`, `JWT_SECRET_KEY` et `REFRESH_TOKEN_PEPPER`
(correction P3-1 de la revue 01B). La clé de comptage par IP vaut
`HMAC(RATE_LIMIT_KEY_PEPPER, "presence-ip:" + IP)` : le domaine explicite la sépare de
tout autre usage de ce poivre, y compris pour un `X-Forwarded-For` choisi par le client.
Aucune valeur de poivre n'apparaît dans les messages d'erreur.

## 11. Migration et retour arrière

- Révision `20261126_0067_passport_presence` (parent `20261103_0066`) : création des sept
  tables, index et contraintes ; ajout `users.is_test`. **Additive.**
- `downgrade` : suppression des tables dans l'ordre inverse, puis de `users.is_test`.
- Révision `20261126_0068_users_flags_no_server_default` (parent `20261126_0067`,
  amendement D1/D3) : **convergence**. `20260608_0040` (`is_system_account`) et
  `20260614_0052` (`force_password_reset`) retirent le `DEFAULT false` après remplissage,
  mais s'interrompent si la colonne existe déjà ; une base dont la colonne les précédait
  garde l'ancien défaut. `0068` impose la postcondition « aucun défaut serveur »
  (`ALTER COLUMN … DROP DEFAULT`) : idempotente, verrou bref, **aucune ligne réécrite**,
  aucune valeur modifiée, aucun index ni contrainte créé.
- `downgrade` de `0068` : **no-op motivé**. L'état canonique, avant comme après, est
  « sans défaut serveur » ; restaurer `DEFAULT false` recréerait l'état non conforme.
- Exécution sur la Preview à la fusion (`preDeployCommand`) : `0066 → 0067 → 0068`,
  **surveillée** (statut de déploiement terminé, `alembic_version = 20261126_0068`,
  santé, route du domaine en 404 drapeau faux).
- Ordre d'exploitation : déployer avec drapeau `false` (aucun effet), puis activer.
- Retour arrière : 1) drapeau `false` (immédiat, sans perte) ; 2) si nécessaire,
  `alembic downgrade 20261103_0066` après export des données d'audit utiles (`0068` :
  no-op ; `0067` : suppression des sept tables et de `users.is_test`).
- Aucune migration distante ni activation n'est exécutée par ce ticket.

## 12. Conséquences

- **+** Domaine isolé, testable, sans effet sur la remise ni Yunimoney.
- **+** Réutilise garde staff, limitation de débit, conventions de migration et d'audit.
- **−** Nouvelle variable secrète (`PRESENCE_TOKEN_PEPPER`) à provisionner par l'humain ops.
- **−** Purge de rétention et exclusion `is_test` des flux existants : tickets de suivi.

## 13. Historique

| Date | Changement |
|---|---|
| 2026-11-26 | Création (PROPOSED) |
| 2026-11-26 | Amendement sur arbitrage CTO provisoire (D1, D3, D4) : migration de convergence `0068` (§ 2, § 11), règle « toute FK indexée » et inventaire des index (§ 3), trois risques ajoutés au modèle de menace (§ 9). Statut **inchangé** : `PROPOSED`, approbation formelle après les résultats de vérification. |
| 2026-11-27 | GO BUILD formel (CTO, Architecture Authority) : statut **APPROVED** avec les amendements D1 à D7. Ajout au § 9 de la limite D7 (`422 json_invalid` avant authentification pour un JSON syntaxiquement malformé, acceptée sans contournement global de FastAPI). Base de la branche 01A : `7f11d6bf` (D5). Aucun GO MERGE ni GO DEPLOY. |
| 2026-11-27 | Amendements CTO D1 à D4 du lot 01B. D1 : au plus 3 sessions vivantes par Passport, contrôle sous verrou, `429 PRESENCE_SESSION_LIMIT_REACHED` avec `Retry-After` (§ 4, § 9). D2 : `REDIS_URL` obligatoire si le drapeau est actif, `503` si Redis est indisponible (§ 9, § 10). D3 : limite par IP de 600 / h, secondaire uniquement, et ticket `PROXY-TRUSTED-CLIENT-IP-01` (§ 9). D4 : horloge `clock_timestamp()` (§ 6). Correction de la probabilité de collision du code, `N / 2⁴⁰` (§ 6). Statut **inchangé** : `APPROVED`. |
| 2026-11-27 | Correction P3-1 de la revue 01B (option A du CTO) : domaine `presence-ip:` pour la clé de comptage par IP et exigences sur `RATE_LIMIT_KEY_PEPPER` quand le drapeau est actif (§ 10). Statut **inchangé** : `APPROVED`. |
