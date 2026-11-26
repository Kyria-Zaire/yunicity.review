# ADR-PASSPORT-PRESENCE-01 — Validation de présence par agent affecté

| Champ | Valeur |
|---|---|
| Statut | **PROPOSED** — à approuver par l'Architecture Authority avant tout code (DOC-GOV-01 § 2.2) |
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
   `users.is_test`.
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
| `agent_user_id` | uuid | NOT NULL, FK `users.id` `ON DELETE CASCADE` |
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
- **Consommation** : `UPDATE … SET consumed_at = now() WHERE id = … AND consumed_at IS
  NULL AND expires_at > now()` dans la transaction qui insère la présence.
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
| **D** force brute du code | 2^40 combinaisons | débit par agent et par utilisateur ; affectation requise ; TTL | dépassement → 429 |
| **D** inondation de sessions | émission en boucle | débit par utilisateur ; purge des sessions expirées à l'émission | dépassement → 429 |
| **E** élévation | appel d'une route staff | garde staff existante ; 404 si drapeau désactivé | non-staff → 403 |
| **E** effets économiques | présence déclenchant un avantage | aucun import des hooks Yunimoney / réputation / défis / tampons / remise | test statique + aucune ligne `yuni_transactions` |

Environnements : bases et poivres distincts par environnement ; une session émise en
Preview n'existe pas en production.

## 10. Drapeau

`PRESENCE_VALIDATION_ENABLED` (`bool`, défaut **`false`**). Désactivé → **404** sur toutes
les routes du domaine (participant, agent, staff), sans lecture ni écriture. Activation
Preview uniquement après validation explicite.

## 11. Migration et retour arrière

- Révision `20261126_0067_passport_presence` (parent `20261103_0066`) : création des sept
  tables, index et contraintes ; ajout `users.is_test`. **Additive.**
- `downgrade` : suppression des tables dans l'ordre inverse, puis de `users.is_test`.
- Ordre d'exploitation : déployer avec drapeau `false` (aucun effet), puis activer.
- Retour arrière : 1) drapeau `false` (immédiat, sans perte) ; 2) si nécessaire,
  `alembic downgrade 20261103_0066` après export des données d'audit utiles.
- Aucune migration distante ni activation n'est exécutée par ce ticket.

## 12. Conséquences

- **+** Domaine isolé, testable, sans effet sur la remise ni Yunimoney.
- **+** Réutilise garde staff, limitation de débit, conventions de migration et d'audit.
- **−** Nouvelle variable secrète (`PRESENCE_TOKEN_PEPPER`) à provisionner par l'humain ops.
- **−** Purge de rétention et exclusion `is_test` des flux existants : tickets de suivi.
