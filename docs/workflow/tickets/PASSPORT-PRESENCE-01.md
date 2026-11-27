# PASSPORT-PRESENCE-01 — Validation de présence par un agent affecté (contrat backend)

> **Statut : En cours — lot 01A fusionné (`dcf30975`) et déployé sur la Preview, drapeau
> désactivé ; lot 01B en cours (GO du 2026-11-27). Aucune activation du drapeau ni des
> routes sans nouvelle autorisation.**
> Ouvert le 2026-11-26 sur
> décision CTO (GO 0015B). ⛔ **ZONE ROUGE** (jetons porteurs, autorisations, PII,
> migration). Aucune migration distante, aucun déploiement, aucune activation Preview
> sans décision explicite.
>
> **Base** : `ea1edf11` (`feat/c3-videos-refonte-final`, version déployée sur la Preview
> `dazzling-wisdom` le 2026-11-22). Intégration vers `feat/c3-videos-refonte-final`.
> `main` (246 commits en retard) **n'est pas** utilisé — voir `MAIN-RECONCILIATION-01`.
>
> Documents : [PRD](../../prd/PRD-PASSPORT-PRESENCE-01-validation-presence.md) ·
> [ADR + modèle de menace](../../adr/ADR-PASSPORT-PRESENCE-01-validation-presence.md).
> Consommateur : Yunimobile `YUNIMOBILE-0015B` (suivi) puis `YUNIMOBILE-0015C`
> (intégration mobile et recette à deux appareils).

## 1. Pourquoi

Le pilote (roadmap Yunimobile R1, backlog PILOT-05, planche PART-01, runbook pilote
§ 9.1 et § 11.3) exige qu'un **agent autorisé** valide la **présence** d'un participant
**inscrit** à une campagne, **une seule fois**, avec un statut relisible après un résultat
incertain et un journal d'audit persistant. Rien de cela n'existe sur `ea1edf11` :

| Capacité | État `ea1edf11` |
|---|---|
| Campagne / inscription / présence / affectation d'agent | absentes (`EventInterest` seulement) |
| QR Passport | `YNCP1:<qr_token>` statique, en clair, réservé à la remise (`/scan/*`) |
| Auto-tampon `/passport/stamps/claim` | existe, **exclu** comme preuve de présence |
| `is_test` | absent |
| Audit persistant | modèle `*_admin_actions` réutilisable |
| Idempotence | modèle `client_request_id` + empreinte (publications) réutilisable |

## 2. Arbitrages CTO (2026-11-26) — texte consigné mot pour mot

B1. Base ea1edf11 ; intégration vers feat/c3-videos-refonte-final.
    Ouvrir séparément une dette de réconciliation de main.
B2. Nouvelle entité presence_campaigns ; organization_id obligatoire ;
    local_event_id facultatif.
B3. Inscription administrative minimale confirmed/cancelled. Le parcours
    public PILOT-04, la capacité et la liste d’attente restent séparés.
B4. Dans 0015B, création des campagnes, inscriptions et affectations
    réservées au staff Yunicity.
B5. YNCP2 opaque, aléatoire >= 128 bits, stocké haché, TTL 60 s,
    renouvellement à 30 s, consommé atomiquement lors de la confirmation.
B6. Résolution minimisée : nom d’affichage, initiale si disponible,
    Passport masqué et état d’inscription. Aucun e-mail, téléphone,
    date de naissance, solde, identifiant complet ou photo.
B7. Code manuel Crockford Base32 aléatoire de 8 caractères, lié à la même
    session éphémère, haché, TTL 60 s, insensible à la casse et rate-limité.
    Il ne doit pas être dérivé par simple découpage du jeton QR.
B8. presence_opens_at et presence_closes_at explicites. Heure serveur UTC,
    aucune tolérance implicite.
B9. Aucun IP ni User-Agent. Aucun QR dans l’audit. Conservation pilote :
    12 mois ; données is_test : 30 jours. Politique provisoire avant prod.
B10. is_test sur utilisateurs et campagnes, contrôlé par le staff ;
     exclusion des récompenses, métriques et exports réels.
B11. PRESENCE_VALIDATION_ENABLED=false par défaut, fail-closed ;
     Preview seulement après validation ; routes désactivées => 404.
B12. YNCP1 fait l’objet d’un ticket sécurité séparé. Ne pas le modifier ici.
B13. Ticket PASSPORT-PRESENCE-01, PRD, ADR et modèle de menace obligatoires.

### Clarifications de contrat (CTO, mot pour mot)

- uncertain est un état client mobile, jamais un état final en base.
- client_operation_id doit être idempotent et associé à une empreinte de
  requête. Même identifiant avec une autre charge => erreur explicite.
- Un second traitement valide répond already_processed sans nouvelle
  présence ni nouvel avantage.
- Le jeton est consommé dans la même transaction que la présence.
- Aucun crédit Yunimoney.
- Aucun endpoint public d’administration dans ce lot.
- Aucun changement Web Yunicity.

**Interprétation retenue — confirmée par le CTO (D4, 2026-11-26)** : « aucun endpoint public
d'administration » = aucune route d'administration accessible hors staff. Les opérations
staff (B4) sont exposées sous `/api/v1/admin/presence/*`, protégées par la garde staff
existante (`moderation.manage` ou `system.admin`), derrière le même drapeau (404 si
désactivé), et auditées.

## 3. Découpage

| Lot | Contenu | Branche (proposée) |
|---|---|---|
| **01-DOCS** | ticket, PRD, ADR + modèle de menace, dette `MAIN-RECONCILIATION-01` | `feature/passport-presence-01-docs` |
| **01A** | modèles, migration Alembic additive et réversible, contraintes, drapeau, `is_test` (utilisateurs, campagnes), administration staff-only auditée, tests | `feature/passport-presence-01a-foundation` |
| **01B** | session éphémère : jeton `YNCP2` et code manuel, stockage HMAC, TTL, renouvellement, limitation de débit, tests de sécurité | `feature/passport-presence-01b-session` |
| **01C** | `assigned`, `resolve`, `confirm`, statut d'opération, idempotence, `already_processed`, audit, tests de concurrence | `feature/passport-presence-01c-validation` |

Chaque lot : PR distincte vers `feat/c3-videos-refonte-final` ; **aucune fusion qui
déclencherait une migration distante ni aucun déploiement** sans décision explicite.

**Conditions de fusion (CTO, 2026-11-26)** — toutes requises, chacune consignée :

1. suite complète Linux/PostgreSQL verte sur le SHA exact de la PR ;
2. revue satisfaisante des migrations du lot (01A : `0067` et `0068`) ;
3. approbation explicite du PRD et de l'ADR — **satisfaite** (GO BUILD du 2026-11-27) ;
4. validation des gates BUILD (PRD § 13) — **satisfaite** (GO BUILD du 2026-11-27) ;
5. revue sécurité humaine explicite, distincte de l'auto-revue de l'agent (D6).

**État pour 01A (PR #206, SHA `b2fd2705281be72b25b186c574e8454852929a1e`)** : les cinq
conditions sont levées.

- **Condition 1** (suite Linux/PostgreSQL) : **satisfaite**. L'essai 3, verdict officiel,
  compte 2182 passed, 0 failed, 0 error, 19 skipped et 7 xfailed, avec le code de sortie
  0. Il a été validé par la revue CTO du 2026-11-27. Les essais 1 (invalide : mauvais port
  Redis) et 2 (non concluant : harness incomplet) ainsi que le rejeu ciblé (diagnostic)
  sont conservés dans la PR.
- **Condition 2** (migrations `0067` et `0068`) : **satisfaite**, approuvée par le CTO le
  2026-11-27.
- **Conditions 3 et 4** : **satisfaites** (GO BUILD du 2026-11-27).
- **Condition 5** (revue sécurité humaine) : **satisfaite**, approuvée par le CTO le
  2026-11-27. Aucune anomalie P0, P1 ou P2. Un P3 documentaire a été relevé : la
  docstring de `require_presence_validation_enabled` affirmait une exécution avant le
  décodage du corps, ce que D7 contredit. Il a été corrigé dans le premier commit de 01B
  (option A), sans changement de comportement ni du SHA validé de 01A.

Les lots suivants restent soumis aux cinq conditions, à reconsigner pour leur propre PR.

**Base 01A (D5, dérogation approuvée sous contrôle)** : la branche du lot 01A part de
`7f11d6bf` (tête de `feat/c3-videos-refonte-final`, fusion de #205), et non de
`ea1edf11` ; `ea1edf11..7f11d6bf` ne contient que les quatre documents de #205.

## 4. Critères d'acceptation (synthèse — détail dans le PRD § 3 et § 9)

- [ ] `PRESENCE_VALIDATION_ENABLED` vaut `false` par défaut ; toutes les routes du domaine
  répondent **404** quand il est désactivé ; aucune écriture.
- [ ] Migration additive, `upgrade` / `downgrade` testés ; aucune table existante modifiée
  hormis : l'ajout de `users.is_test` (booléen, défaut `false`) ; la migration de
  convergence `20261126_0068`, **sans réécriture de données**, qui garantit l'absence de
  défaut serveur sur `users.is_system_account` et `users.force_password_reset`
  (amendement CTO D3, 2026-11-26).
- [ ] Agent non affecté, campagne non ouverte, hors fenêtre, inscription absente ou annulée,
  jeton ou code inconnu / expiré / déjà consommé, auto-validation : **refus**, aucune
  présence.
- [ ] Une seule présence par participant et campagne, y compris sous requêtes
  concurrentes (test dédié) ; second traitement valide → `already_processed`.
- [ ] Même `client_operation_id` + même empreinte → même résultat rejoué ; autre charge →
  `409 IDEMPOTENCY_KEY_REUSED`.
- [ ] Jeton consommé dans la transaction de la présence.
- [ ] Journal d'audit persistant (agent, campagne, participant, résultat, horodatage,
  identifiant d'opération, source) sans QR, code, IP ni User-Agent.
- [ ] Aucune écriture `yuni_transactions`, réputation, défi, tampon ou remise (tests).
- [ ] Jeton, code et hachés jamais dans les logs, URL ou réponses d'erreur (tests).
- [ ] `ruff`, `mypy`, `pytest` (unitaire et intégration) verts.
- [ ] 01B (amendements CTO D1 à D4, 2026-11-27) :
  - au plus 3 sessions vivantes par Passport (`consumed_at IS NULL AND expires_at >
    clock_timestamp()`), contrôlées sous le verrou du Passport ; au-delà, `429
    PRESENCE_SESSION_LIMIT_REACHED` avec `Retry-After`, sans invalider une session
    vivante ni révéler de jeton ou de condensat ;
  - drapeau actif sans `REDIS_URL` → refus au démarrage ; Redis indisponible → `503`,
    aucune session ;
  - `expires_at` calculé par `clock_timestamp()` après le verrou ;
  - collisions de condensat rejouées dans un savepoint, trois tentatives au plus, sans
    ligne partielle ;
  - suspension concurrente du Passport testée dans les deux ordres de verrouillage ;
  - aucun secret, code manuel ni QR en clair dans les logs, Redis, erreurs ou colonnes.

## 5. Hors périmètre

- `YNCP1`, `/scan/*`, `/passport/stamps/claim` et leurs effets Yunimoney (B12, D6 mobile).
- Parcours public d'inscription, capacité, liste d'attente (PILOT-04).
- Purge de rétention automatisée (politique B9 documentée ; implémentation = ticket de
  suivi avant production).
- Exclusion `is_test` dans les flux existants de récompense (remise, tampon) : ticket de
  suivi, ces flux n'étant pas modifiés ici.
- Web Yunicity, production, déploiement, activation Preview.
- Verrouillage des dépendances de l'image déployée. **Risque technique consigné le
  2026-11-27** : l'image Preview installe les dépendances par `pip install -e ".[dev]"`,
  sans `uv.lock`. Les versions déployées peuvent donc différer de celles validées par la
  suite Linux, qui utilise `uv sync --frozen`. La CI `backend-ci` présente le même écart.
  Ce risque ne bloque pas 01B ; un **suivi est obligatoire avant la production**.
- Fiabilité de l'IP client derrière le proxy Railway : ticket transversal
  `PROXY-TRUSTED-CLIENT-IP-01` (D3 de 01B). Dans ce ticket, la limite par IP n'est qu'une
  protection secondaire.

## 6. Journal

| Date | Événement |
|---|---|
| 2026-11-26 | Audit lecture seule ; version Preview établie (`ea1edf11`) ; arbitrages CTO B1–B13 ; ouverture du ticket et rédaction PRD / ADR |
| 2026-11-26 | Arbitrages CTO provisoires sur le dossier 01A (D1–D6, texte ci-dessous) ; amendements ADR (§ 2, § 3, § 9, § 11), PRD (§ 6) et ticket (§ 2, § 3, § 4). Statuts ADR `PROPOSED`, PRD `DESIGN` et ticket `DESIGN` **inchangés** ; gates non cochées. |
| 2026-11-27 | GO BUILD formel accordé par le CTO agissant comme Product Authority et Architecture Authority. ADR approuvé avec les amendements D1 à D7 ; PRD approuvé en phase BUILD ; six gates BUILD approuvées. Base `7f11d6bf` autorisée. Le comportement FastAPI `422 json_invalid` avant authentification pour un JSON syntaxiquement malformé est accepté et documenté, sans modification globale du framework. Cette décision autorise les commits, le push et l’ouverture d’une PR en brouillon, mais n’autorise ni fusion ni déploiement Preview. |
| 2026-11-27 | Suite Linux/PostgreSQL complète sur `b2fd2705` : l'essai 3, verdict officiel, est vert (2182 passed, 0 failed, 0 error, code de sortie 0). Il a été validé par la revue CTO. Condition 1 levée. |
| 2026-11-27 | Le CTO approuve la revue des migrations `0067` / `0068` et la revue sécurité humaine de 01A sur `b2fd2705`. Conditions 2 et 5 levées. Un P3 documentaire est consigné ; option A : correction dans le premier commit de 01B. |
| 2026-11-27 | GO MERGE et GO DEPLOY Preview pour 01A. La PR #206 est fusionnée dans `feat/c3-videos-refonte-final` par le commit `dcf309753435ad57193e4ddb1a8914fe0ef2e9b1`, à condition que la tête soit `b2fd2705`. Ses parents sont `7f11d6bf` et `b2fd2705`, et son arbre est identique à celui de `b2fd2705`. Preuves après déploiement sur la Preview `dazzling-wisdom` : voir ci-dessous. |
| 2026-11-27 | Le CTO valide le contrôle après déploiement, puis donne le GO 01B. Premier commit de 01B : correction de la docstring P3 et mise à jour du ticket. |
| 2026-11-27 | Branche `feature/passport-presence-01b` poussée à `a348097c` (sans PR). Plan 01B présenté ; GO 01B avec les arbitrages D1 à D4 et deux corrections techniques (texte ci-dessous). Amendements de l'ADR (§ 4, § 6, § 9, § 10) et du PRD (§ 3, § 6, § 7). Création du ticket transversal `PROXY-TRUSTED-CLIENT-IP-01`. |

### Preuves après déploiement de 01A (Preview, 2026-11-27)

- **Déploiement réellement terminé** : le service backend `unified-media-preview` est en
  `SUCCESS` sur `dcf30975`, et le déploiement précédent (`7f11d6bf`) est passé à
  `REMOVED`. Le déploiement GitHub de `dcf30975` est en `success`, et non plus seulement en
  `in_progress`. Le service Web `yunicity.review` a aussi été redéployé en `SUCCESS` sur le
  même commit ; ce lot ne modifie aucun fichier Web.
- **Migrations** : le journal de pré-déploiement montre `Running upgrade 20261103_0066 ->
  20261126_0067`, puis `20261126_0067 -> 20261126_0068`. L'application démarre ensuite
  normalement.
- **`alembic_version` = `20261126_0068`** est **déduit** de ces journaux de migration
  (`alembic upgrade head` réussi jusqu'à la tête). Il n'y a **pas eu de lecture SQL
  directe** : la base Preview n'a pas d'URL publique, et le CTO a décidé de ne pas
  accepter de clé SSH Railway pour répéter cette preuve. Le CTO a accepté cette preuve
  comme équivalente au contrôle attendu.
- **`/api/v1/health`** : 200. **`/api/v1/ready`** : 200, avec `status: ready`, base `ok`
  et Redis `ok`.
- **`/api/v1/admin/presence/campaigns`** : 404 `{"detail":"Not Found"}`, réponse identique
  à celle d'une route inconnue.
- **Drapeau** : aucune variable `PRESENCE_*` n'est définie sur les services Preview, donc
  `PRESENCE_VALIDATION_ENABLED` vaut `false`. Il est inchangé.
- **Journaux** : aucune ligne `ERROR`, `WARNING`, `CRITICAL` ni `Traceback` après le
  démarrage. Le worker et la tâche cron s'exécutent sans échec (`j_failed=0`).

### Décisions CTO du 2026-11-27 (revues, fusion, déploiement, 01B) — mot pour mot

- « J’approuve la revue des migrations 0067 et 0068 ainsi que la revue sécurité humaine de
  PASSPORT-PRESENCE-01A sur b2fd2705281be72b25b186c574e8454852929a1e. Les conditions 2 et
  5 peuvent être levées. »
- « Pour le P3 documentaire de presence_feature.py, je retiens l’option A : le consigner
  maintenant dans le corps de la PR #206 et corriger la docstring dans le premier commit de
  01B. Aucun changement ne doit être apporté au SHA validé de 01A. »
- « GO MERGE et GO DEPLOY Preview pour PASSPORT-PRESENCE-01A. […] Cette autorisation couvre
  le redéploiement automatique de la Preview et l’exécution surveillée des migrations 0067
  puis 0068. Le drapeau PRESENCE_VALIDATION_ENABLED doit rester désactivé. »
- « J’accepte donc cette preuve comme équivalente au contrôle attendu d’`alembic_version`. »
- « GO pour démarrer PASSPORT-PRESENCE-01B, conformément au PRD, à l’ADR, au modèle de
  menace et au ticket. »
- « L’écart des dépendances Preview non verrouillées doit être consigné comme risque
  technique et faire l’objet d’un suivi avant la production, mais il ne bloque pas 01B. »
- « Aucun changement du drapeau en Preview et aucune activation des routes sans nouvelle
  autorisation. »

### Arbitrages CTO du lot 01B (2026-11-27) — mot pour mot

| Décision | Arbitrage CTO |
|---|---|
| D1 — Sessions vivantes | **3 maximum par Passport.** Au-delà : `429`, sans invalider une session encore active. Ajouter `Retry-After` calculé sur la première expiration. Amender l’ADR et documenter le code d’erreur. |
| D2 — Redis | **`REDIS_URL` obligatoire dès que le drapeau est actif**, dans tous les environnements. URL absente : refus au démarrage. Redis indisponible à l’exécution : `503`, aucune session créée. |
| D3 — Limite IP | **600/h acceptée comme protection secondaire uniquement.** Elle ne doit jamais être présentée comme une garantie de sécurité tant que la confiance accordée à `X-Forwarded-For` sur Railway n’est pas prouvée. Créer immédiatement un ticket transversal sur les IP de proxy fiables. |
| D4 — Horloge | **Horloge PostgreSQL obligatoire**, mais utiliser `clock_timestamp()` et non `now()`. |

« Pourquoi `clock_timestamp()` : dans PostgreSQL, `now()` reste figé au début de la
transaction. Une requête ayant attendu le verrou du Passport pourrait donc créer une
session dont une partie des 60 secondes est déjà consommée. Utiliser l’horloge réelle :
après acquisition du verrou pour calculer `expires_at` ; dans les prédicats d’expiration
et de consommation de 01C ; dans les tests de concurrence. »

« Deuxième correction : la probabilité de collision du code n’est pas exactement `2⁻⁴⁰`
si les condensats historiques restent stockés. Elle est approximativement proportionnelle
au nombre de codes déjà conservés, soit `N / 2⁴⁰` pour le prochain tirage. Le mécanisme
de trois tentatives reste acceptable, mais le texte et les tests doivent employer la
formulation correcte. »

Ordre de travail validé :

1. commit documentaire dédié : ADR, PRD et ticket avec D1 à D4, le plafond,
   `Retry-After`, `clock_timestamp()` et le ticket transversal `X-Forwarded-For` ;
2. types et fonctions pures de génération, normalisation et HMAC, avec tests unitaires ;
3. repository et service transactionnel ;
4. endpoint et rate limiting fail-closed ;
5. tests d’intégration, concurrence, absence de secrets et isolation ;
6. revue sécurité, puis suite Linux sur le SHA exact avant toute PR.

Exigences supplémentaires, mot pour mot :

- « Le plafond de trois doit être contrôlé **sous le verrou du Passport**. »
- « Le décompte doit utiliser uniquement `consumed_at IS NULL AND expires_at >
  clock_timestamp()`. »
- « Un `429` lié au plafond ne doit révéler aucun jeton ni condensat. »
- « Les collisions doivent être rejouées dans un savepoint sans laisser de ligne ou
  d’audit partiel. »
- « La suspension concurrente doit être testée dans les deux ordres de verrouillage. »
- « Aucun secret, code manuel ou QR en clair dans les logs, Redis, erreurs ou colonnes. »
- « Le drapeau Preview reste désactivé. Aucun déploiement ni activation pendant 01B. »

### Arbitrages CTO D1–D6 (2026-11-26) — texte consigné mot pour mot

| Décision | Arbitrage CTO |
|---|---|
| **D1 — ADR** | **Accord conditionnel avec amendement.** Ne pas encore passer à `APPROVED`. Ajouter `0068`, compléter les index, les erreurs et les trois risques. Approbation formelle après les résultats. |
| **D2 — PRD** | **Aucune gate cochée pour l’instant.** Les six gates seront arbitrées individuellement après le §7 complet. |
| **D3 — Ticket §4** | **Amender le critère.** Autoriser explicitement `users.is_test` et la convergence sans réécriture de données de `is_system_account` et `force_password_reset`. `0068` reste dans le lot. |
| **D4 — Administration** | **Confirmé.** « Aucun endpoint public d’administration » signifie : routes `/admin/presence/*`, accessibles exclusivement au staff autorisé, jamais anonymes ni ouvertes aux utilisateurs ordinaires. |
| **D5 — Base** | **Dérogation approuvée sous contrôle.** Repartir de `7f11d6bf`, à condition de vérifier que `ea1edf11..7f11d6bf` ne contient que les documents annoncés et que `7f11d6bf` appartient bien à la lignée de la branche cible. L’ancienne branche sans commit reste intacte. |
| **D6 — Sécurité** | **Approuvé.** Ajouter une cinquième condition de fusion : revue sécurité humaine explicite, distincte de l’auto-revue de l’agent. |

Compléments CTO (2026-11-26), mot pour mot :

- « Les contrôles D5 sont concluants : la dérogation pour repartir de `7f11d6bf` est
  désormais validée définitivement. »
- « J’approuve également l’ajout de `PRESENCE_CAMPAIGN_NOT_FOUND` au PRD. Puisque ce code
  est implémenté, il fait partie du contrat API et doit être documenté. »

### GO BUILD formel (CTO, 2026-11-27) — D7 et conditions restantes, mot pour mot

D7 — JSON syntaxiquement malformé. Option recommandée **acceptée** :

- un JSON syntaxiquement malformé peut produire `422 json_invalid` avant authentification
  en raison du fonctionnement de FastAPI 0.136.1 ;
- ce comportement est accepté pour 01A parce qu’il ne révèle ni l’existence de la campagne
  ni une donnée métier, ne produit aucun code `*_NOT_FOUND` et n’effectue aucune écriture ;
- un corps syntaxiquement valide mais métier invalide reste traité après authentification ;
- aucun contournement global de FastAPI ne doit être introduit dans ce lot ;
- cette limite et ses preuves doivent être ajoutées à l’ADR §9.

La fusion restera interdite jusqu’à :

- suite Linux/PostgreSQL complète verte ;
- revue satisfaisante de `0067` et `0068` ;
- revue sécurité humaine explicite.

« GO BUILD accordé. Aucun GO MERGE ni GO DEPLOY n’est accordé. »
