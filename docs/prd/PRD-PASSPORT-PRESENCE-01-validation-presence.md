# PRD-PASSPORT-PRESENCE-01 — Validation de présence par agent affecté

> Workflow : `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` — décision technique :
> `docs/adr/ADR-PASSPORT-PRESENCE-01-validation-presence.md` — ticket :
> `docs/workflow/tickets/PASSPORT-PRESENCE-01.md`.

## 0. Métadonnées

| Champ | Valeur |
|---|---|
| ID | PRD-PASSPORT-PRESENCE-01 |
| Nom | Validation de présence par agent affecté |
| Statut | **DESIGN** |
| Phase BMAD | — (BUILD après validation des gates § 13) |
| Priorité | P0 (jalon pilote R1, PILOT-05) |
| Auteur | Agent d'exécution IA (supervisé) |
| Owner technique | Kyria (CTO) |
| Date création | 2026-11-26 |
| Dernière mise à jour | 2026-11-26 |
| Environnement cible | dev → recette (Preview) ; production : décision séparée |

# 1. Résumé produit

## Objectif

Permettre à un **agent affecté par le staff** à une campagne de valider, **une seule
fois**, la présence d'un participant **inscrit**, en scannant un QR éphémère ou en
saisissant un code de secours, sans aucun effet Yunimoney.

## Pourquoi

Le pilote mesure « inscription → présence validée » (roadmap Yunimobile R1, PILOT-05,
planche PART-01, runbook § 9.1 et § 11.3). Le backend ne sait ni ce qu'est une campagne,
ni une inscription, ni une présence.

## Résultat attendu

Une API derrière drapeau, prête pour une recette Preview à deux appareils réels
(Yunimobile 0015C), avec statut relisible après un résultat incertain et audit persistant.

# 2. Contexte

- **Business** : campagne pilote validée par l'équipe ; personnes autorisées désignées par
  Yunicity (runbook R0).
- **Technique** : voir ADR § 1. Réutilisation : garde staff, limitation de débit Redis,
  conventions Alembic, modèle d'audit `*_admin_actions`, modèle d'idempotence des
  publications.
- **Dépendances** : `PRESENCE_TOKEN_PEPPER` provisionné par l'humain ops avant activation ;
  comptes `is_test` créés par le staff (Preview : inscriptions fermées).
- **Risques connus** : capture d'écran du QR (TTL 60 s + consommation), force brute du code
  (débit + affectation), course concurrente (contraintes uniques), fuite de secret dans
  les logs (tests), confusion avec la remise `YNCP1` (domaine séparé).

# 3. User stories

## Story 1 — Staff : préparer une campagne

En tant que staff Yunicity, je crée une campagne (organisation obligatoire, événement
facultatif, fenêtre explicite, `is_test`), j'inscris des participants et j'affecte des
agents.

- [ ] Création : `draft` ; `presence_closes_at > presence_opens_at` sinon 422.
- [ ] Transitions limitées à `draft→open→closed→archived` et `draft→archived` ; sinon 409.
- [ ] Inscription et affectation idempotentes par `(campagne, utilisateur)`.
- [ ] Chaque action est tracée dans `presence_admin_actions`.
- [ ] Un non-staff reçoit 403 ; drapeau désactivé → 404.

## Story 2 — Participant : présenter un QR éphémère

- [ ] `POST /passport/me/presence-session` renvoie un QR `YNCP2:` et un code `XXXX-XXXX`
  valables 60 s, avec `refresh_after_seconds = 30`.
- [ ] Passport non actif → 403 ; débit dépassé → 429.
- [ ] Le jeton et le code ne sont jamais renvoyés ultérieurement ni journalisés.

## Story 3 — Agent : vérifier avant de confirmer

- [ ] `GET /presence/campaigns/assigned` liste ses campagnes `active` (ouvertes ou non,
  avec la fenêtre).
- [ ] `resolve` renvoie uniquement : nom d'affichage, initiale si disponible, Passport
  masqué, état d'inscription, état de présence, éligibilité et motif ; aucune écriture.
- [ ] Agent non affecté → 403 **avant** toute lecture de l'identifiant.

## Story 4 — Agent : confirmer une seule fois

- [ ] Première confirmation valide → 201 `posted`.
- [ ] Confirmation valide ultérieure (autre QR, autre agent) → 200 `already_processed`,
  sans nouvelle présence ni avantage.
- [ ] Même `client_operation_id` et même charge → même résultat rejoué ; autre charge →
  409 `IDEMPOTENCY_KEY_REUSED`.
- [ ] Refus explicites : hors fenêtre, campagne non ouverte, non inscrit, inscription
  annulée, identifiant invalide, expiré ou déjà consommé, auto-validation, Passport
  inactif.

## Story 5 — Agent : lever un résultat incertain

- [ ] `GET …/operations/{client_operation_id}` renvoie le résultat enregistré, ou 404
  `PRESENCE_OPERATION_NOT_FOUND` (rien n'a été traité : nouvel essai volontaire possible
  avec la **même** clé).

# 4. Scope

## Inclus

Lots 01A (fondation + administration staff), 01B (session éphémère), 01C (validation) —
voir ticket § 3.

## Hors scope

`YNCP1` et remise, auto-tampon, PILOT-04 public (capacité, liste d'attente), corrections
de présence (OPS-01), purge de rétention automatisée, exclusion `is_test` dans les flux
existants, Web Yunicity, production, déploiement, activation Preview.

## Definition of Done

Critères du ticket § 4 prouvés par tests ; ADR `APPROVED` ; revue sécurité humaine ; PR
par lot ; aucune migration distante ni activation sans décision.

# 5. UX / UI

Backend uniquement. Contrat d'états pour le client mobile (Yunimobile 0015C) :

| Résultat API | État client (FM-08) |
|---|---|
| 201 `posted` | `success` |
| 200 `already_processed` | `success` « déjà enregistrée » (aucun doublon) |
| 4xx motif métier | `error` / refus explicite, nouveau scan possible |
| 429 | `error` « trop de tentatives » |
| délai, réseau perdu, 5xx | `uncertain` côté client → `GET …/operations/{id}` |

# 6. Architecture technique

## Modèle de données

Voir ADR § 3 (sept tables + `users.is_test`) et § 4 (machines d'états).

## Endpoints

Préfixe `/api/v1`. Toutes les routes : **404** si `PRESENCE_VALIDATION_ENABLED=false`.
Identifiants (QR, code) **uniquement dans le corps** de requêtes POST.

### Participant

#### `POST /passport/me/presence-session`

Réponse 201 :

```json
{
  "qr_payload": "YNCP2:<jeton opaque>",
  "manual_code": "XXXX-XXXX",
  "expires_at": "2026-11-26T10:01:00Z",
  "refresh_after_seconds": 30
}
```

Erreurs : 401, 403 `PASSPORT_NOT_ACTIVE`, 404 (drapeau ou Passport absent), 429.

### Agent

#### `GET /presence/campaigns/assigned`

`[{ "id", "title", "city", "status", "presence_opens_at", "presence_closes_at", "is_test" }]`

#### `POST /presence/campaigns/{campaign_id}/resolve`

Corps : `{ "credential": { "type": "qr" | "manual", "value": "…" } }`

Réponse 200 (notation : `a | b` = une des valeurs) :

```text
{
  "participant": { "display_name": "…", "initial": "D", "passport_masked": "•••• 1234" },
  "registration_status": "confirmed" | "cancelled" | "none",
  "presence_status": "none" | "already_present",
  "eligible": true,
  "reason_code": null
}
```

#### `POST /presence/campaigns/{campaign_id}/confirmations`

Corps : `{ "client_operation_id": "<uuid v4>", "credential": { "type": "qr" | "manual", "value": "…" } }`

- 201 : `{ "operation_id", "result": "posted", "presence_id", "validated_at", "replayed": false }`
- 200 : `{ "operation_id", "result": "already_processed", "presence_id", "validated_at", "replayed": false }`
- 4xx : `{ "code", "message", "operation_id" }` (refus métier enregistré)
- Rejeu (même clé, même charge) : statut et corps d'origine, `replayed: true`.

#### `GET /presence/campaigns/{campaign_id}/operations/{client_operation_id}`

200 `{ "operation_id", "result", "reason_code", "presence_id", "recorded_at" }` ou 404
`PRESENCE_OPERATION_NOT_FOUND`. Restreint à l'agent auteur de l'opération.

### Staff (`moderation.manage` ou `system.admin`)

| Méthode | Route | Effet |
|---|---|---|
| POST | `/admin/presence/campaigns` | créer (`draft`) |
| GET | `/admin/presence/campaigns` | lister (paginé) |
| PATCH | `/admin/presence/campaigns/{campaign_id}/status` | transition d'état |
| PUT | `/admin/presence/campaigns/{campaign_id}/registrations/{user_id}` | `confirmed` / `cancelled` |
| PUT | `/admin/presence/campaigns/{campaign_id}/agents/{user_id}` | `active` / `revoked` |
| PUT | `/admin/presence/users/{user_id}/test-flag` | `is_test` vrai / faux |

### Codes d'erreur (stables)

| Code | HTTP |
|---|---|
| `PRESENCE_AGENT_NOT_ASSIGNED` | 403 |
| `PRESENCE_SELF_VALIDATION_FORBIDDEN` | 403 |
| `PASSPORT_NOT_ACTIVE` | 403 |
| `PRESENCE_CAMPAIGN_NOT_OPEN` | 409 |
| `PRESENCE_OUTSIDE_WINDOW` | 409 |
| `PRESENCE_NOT_REGISTERED` | 409 |
| `PRESENCE_REGISTRATION_CANCELLED` | 409 |
| `PRESENCE_CREDENTIAL_INVALID` | 422 |
| `PRESENCE_CREDENTIAL_EXPIRED` | 410 |
| `PRESENCE_CREDENTIAL_USED` | 409 |
| `IDEMPOTENCY_KEY_REUSED` | 409 |
| `PRESENCE_OPERATION_NOT_FOUND` | 404 |
| `PRESENCE_INVALID_TRANSITION` | 409 |
| `RATE_LIMITED` (existant) | 429 |

## Migrations

`20261126_0067_passport_presence` — additive, réversible (ADR § 11).

# 7. Sécurité & conformité

- Zone rouge : jetons porteurs, autorisations, PII, migration → revue sécurité humaine.
- Modèle de menace : ADR § 9 (STRIDE).
- Données minimisées (B6) ; aucun IP ni User-Agent stocké (B9) ; aucun secret dans Git,
  logs, URL, réponses d'erreur ; poivre dédié par environnement.
- Débit : émission de session 150 / h / utilisateur ; résolution et confirmation
  600 / h / agent ; identifiants manuels 30 / 10 min / agent (valeurs initiales,
  configurables, à confirmer en MEASURE).

# 8. Performance & observabilité

- Index : clés étrangères, `presence_sessions.expires_at`, `presence_operations.created_at`.
- Logs structurés sans secret : `presence_session_issued`, `presence_resolve`,
  `presence_confirmation` (résultat, motif, identifiants internes seulement).

# 9. Tests

- Unitaires : génération (entropie, alphabet, indépendance jeton / code), normalisation du
  code, HMAC avec séparation de domaine, empreinte, machines d'états.
- Intégration (`httpx` + base de test isolée) : drapeau 404, autorisations (non-staff,
  non affecté, révoqué), fenêtre (avant, pendant, après, bornes), campagne non ouverte,
  inscription absente / annulée, jeton expiré / consommé / inconnu, auto-validation,
  double scan, rejeu, clé réutilisée, statut d'opération, minimisation de `resolve`.
- Concurrence : deux confirmations simultanées pour un même participant → **une** présence.
- Effets : aucune ligne `yuni_transactions`, réputation, défi, tampon ou remise ; test
  statique d'imports.
- Secrets : jeton et code absents des logs capturés et des réponses d'erreur.
- Migration : `upgrade` puis `downgrade` sur base de test.

# 10. Rollout & métriques

- Déploiement : code fusionné avec drapeau `false` → aucun effet. Activation Preview après
  validation, poivre provisionné, comptes `is_test`.
- Métriques (MEASURE) : taux inscription → présence ; refus par motif ; délai résolution →
  confirmation ; `already_processed` ; 429.
- Rollback : drapeau `false`, puis `downgrade` si nécessaire (ADR § 11).

# 11. Open questions

- Purge de rétention (12 mois / 30 jours `is_test`) : ticket de suivi avant production.
- Exclusion `is_test` dans les flux existants de récompense et dans les exports futurs.
- Valeurs de débit définitives après mesure Preview.

# 12. Historique

| Date | Changement |
|---|---|
| 2026-11-26 | Création (DESIGN) — arbitrages CTO B1–B13 |

# 13. BMAD

## BUILD — gates (cocher avant premier commit code)

- [ ] PRD validé (sections 1–6 complètes)
- [ ] Architecture identifiée (§ 6, ADR)
- [ ] Risques identifiés (§ 2, § 7, ADR § 9)
- [ ] Permissions / authZ définies (§ 6, ADR § 5)
- [ ] Endpoints + contrats définis (§ 6)
- [ ] Modèle DB + migration planifiés (ADR § 3, § 11)

## MEASURE — métriques cibles

| Domaine | Métrique | Cible | Mesuré le |
|---|---|---|---|
| Produit | inscription → présence | à fixer avec le pilote | |
| Technique | p95 confirmation, taux 5xx | < 300 ms, < 0,5 % | |
| Sécurité | 429, refus par motif | suivi | |

## ANALYZE / DECIDE

À compléter après recette Preview.
