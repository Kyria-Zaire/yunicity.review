# PASSPORT-PRESENCE-01 — Validation de présence par un agent affecté (contrat backend)

> **Statut : DESIGN — documentation à valider, aucun code.** Ouvert le 2026-11-26 sur
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

**Interprétation retenue (à confirmer en revue)** : « aucun endpoint public
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

## 4. Critères d'acceptation (synthèse — détail dans le PRD § 3 et § 9)

- [ ] `PRESENCE_VALIDATION_ENABLED` vaut `false` par défaut ; toutes les routes du domaine
  répondent **404** quand il est désactivé ; aucune écriture.
- [ ] Migration additive, `upgrade` / `downgrade` testés ; aucune table existante modifiée
  hormis l'ajout de `users.is_test` (booléen, défaut `false`).
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

## 5. Hors périmètre

- `YNCP1`, `/scan/*`, `/passport/stamps/claim` et leurs effets Yunimoney (B12, D6 mobile).
- Parcours public d'inscription, capacité, liste d'attente (PILOT-04).
- Purge de rétention automatisée (politique B9 documentée ; implémentation = ticket de
  suivi avant production).
- Exclusion `is_test` dans les flux existants de récompense (remise, tampon) : ticket de
  suivi, ces flux n'étant pas modifiés ici.
- Web Yunicity, production, déploiement, activation Preview.

## 6. Journal

| Date | Événement |
|---|---|
| 2026-11-26 | Audit lecture seule ; version Preview établie (`ea1edf11`) ; arbitrages CTO B1–B13 ; ouverture du ticket et rédaction PRD / ADR |
