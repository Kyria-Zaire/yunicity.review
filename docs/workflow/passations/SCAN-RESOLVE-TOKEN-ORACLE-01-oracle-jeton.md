# Passation — SCAN-RESOLVE-TOKEN-ORACLE-01 · Le scan révèle la validité d'un jeton Passport

> ✅ **CLOS le 2026-11-05 au stade Preview sur `1900fb01`** (décision de Kyria).
> **Limite explicite** : l'appel **authentifié** d'un utilisateur non partenaire
> n'a **pas** été rejoué sur `preview.yunicity.city` (aucun identifiant Preview
> à disposition) ; le comportement est prouvé sur base jetable et par la CI
> (2 075 passed). Non fusionné dans `main`.
>
> **Ouvert le 2026-11-05 par Kyria**, seul ticket actif. ⛔ **ZONE ROUGE**
> (autorisation, jetons). Préproduction uniquement ; aucune action sur `main`
> ni la production. Ticket : `docs/workflow/tickets/SCAN-RESOLVE-TOKEN-ORACLE-01.md`.
> `PASSPORT-QR-THIRD-PARTY-01` et sa rotation : **suspendus** (index).

## 1. État Git

Worktree `C:/Users/kyria/yunicity-wt-deps-next-preview`, branche
**`fix/scan-resolve-token-oracle`** depuis **`eb07b6ce`** (Preview servie).
**Non commité, non poussé.** Documents préservés dans l'arbre de travail, non
commités : passation `PASSPORT-QR-THIRD-PARTY-01` (blocage SSH), ticket
`PASSPORT-QR-TOKEN-ROTATION-01` (blocage), demande
`docs/ops/RAILWAY-SSH-HOST-VERIFICATION-01-demande-support.md`.

## 2. Reproduction — base jetable (`scripts/qa-backend-pytest-host.sh`)

Tests du comportement **attendu** lancés sur le code **d'origine** (`eb07b6ce`) :

| Appel d'un utilisateur connecté **sans organisation** | Jeton existant | Jeton inexistant |
|---|---|---|
| `POST /scan/resolve` | **403** `SCAN_PARTNER_FORBIDDEN` | **404** `PASSPORT_NOT_FOUND` |
| `POST /scan/redeem` (offre d'une organisation qu'il ne gère pas) | **403** (`require_offer_manager`) | **404** `PASSPORT_NOT_FOUND` |

→ **2 échecs / 1 réussite** : **oracle reproduit sur les deux routes** ; le
parcours partenaire passe.

**Cause** (lecture de code confirmée par la reproduction) : `resolve_for_partner`
et `redeem_for_partner` appellent `_resolve_passport` (404 si jeton inconnu)
**avant** tout contrôle d'autorisation.

## 3. Correctif (non commité)

`backend/app/services/scan_redemption_service.py` :
- nouvelle méthode `_require_partner_scanner(partner_user)` — **règle et
  message existants** (`list_managed_organization_ids` vide → `403
  SCAN_PARTNER_FORBIDDEN`, « Aucun lieu vérifié ne vous autorise à scanner. »),
  extraits de `resolve_for_partner` ;
- `resolve_for_partner` : contrôle **déplacé avant** `_resolve_passport` ;
- `redeem_for_partner` : **même contrôle ajouté avant** `_resolve_passport` ;
  la suite (offre, `require_offer_manager`, vérification, tier, doublon,
  plafond, écriture) **inchangée**.

**Limite assumée** : un **partenaire** (gérant au moins une organisation
vérifiée) distingue toujours un jeton valide d'un jeton inconnu — c'est
l'usage même du scan. Hors périmètre.

## 4. Tests

`backend/tests/test_scan_resolve_token_oracle.py` (3) :
- non-autorisé, `/scan/resolve` : jeton existant et inexistant → **même statut
  (403) et même corps** ;
- non-autorisé, `/scan/redeem` : idem, avec l'offre d'une autre organisation
  **et** avec une offre inexistante ;
- partenaire : résolution `200` (offres listées), jeton inconnu `404
  PASSPORT_NOT_FOUND`, utilisation d'offre `200`.

*(Résultats après correctif : §5.)*

## 5. Résultats après correctif (base jetable, 2026-11-05)

- `test_scan_resolve_token_oracle.py` : **3/3** ; **mutation** (service
  d'origine) → **2 échecs**, comme attendu.
- **Test existant adapté** — `test_admin_passport_actions_api.py::
  test_suspended_passport_not_resolved_by_scan` : son « partenaire » était un
  utilisateur **sans organisation** et attendait `404` pour un Passport suspendu
  — il **reposait sur l'oracle**. Il utilise désormais un **vrai partenaire**
  (gestionnaire d'une organisation vérifiée) ; **intention inchangée** : un
  Passport suspendu n'est pas résolu (`404 PASSPORT_NOT_FOUND`). ✅
- Ensemble ciblé (oracle, `test_scan_redemption`, `test_admin_passport_actions_api`,
  `test_passport_redemptions`, `test_passport_qr_rotation`) : **45 passed,
  1 failed** avant adaptation (le test ci-dessus) ; **4/4** après sur les tests
  concernés.
- `ruff`, `mypy` verts.
- ⚠️ **Suite backend complète : NON obtenue en local** — deux lancements
  interrompus par leur délai de 50 min à ~14 % (Postgres QA très lent en
  local) ; partie exécutée **verte**. Bases jetables laissées par
  l'interruption (`yunicity_test_5bd210ba29aa`, `yunicity_test_a9bbe30394b5`,
  dates de création = mes deux lancements, aucune connexion) **supprimées** ;
  `yunicity_qa` intacte. **La suite complète sera prouvée par la CI Docker**
  lors de la livraison.

## 6. 🚀 LIVRAISON PREVIEW — *2026-11-05*

- Commit **`1900fb01`** (4 fichiers : service, 2 tests, passation) poussé sur
  `fix/scan-resolve-token-oracle`.
- **Validation AVANT la Preview** : une PR brouillon vers la branche Preview
  n'aurait lancé **aucune** CI (déclencheurs `pull_request` / `push` limités à
  `main`) → **`docker-ci.yml` lancé manuellement** (`workflow_dispatch`) sur la
  branche corrective : run `42090131115`, SHA `1900fb01`, **success — 2 075
  passed, 19 skipped** (suite backend complète, base jetable).
- **Puis** Preview avancée **`eb07b6ce..1900fb01`** en avance rapide, distante
  vérifiée, **sans `--force`**. `main` = `3e0b27ba`, **inchangé**.
- **CI PR #202 sur `1900fb01`** : Docker (2 075 passed), Backend, Frontend, Lint
  agent rules, Gitleaks, chemins interdits ✅ ; audit des dépendances ❌ **19,
  inchangé**.
- **Railway Preview** : web `462c339a`, API `6585f1e8` — **SUCCESS** sur
  `1900fb01` ; `/health` 200 ; `POST /scan/resolve` **sans session → 401**
  (jeton fictif).
- ⚠️ **Non vérifié sur la Preview** : appel **authentifié** d'un non-partenaire
  (aucun identifiant Preview à disposition de l'agent) — comportement prouvé par
  la suite sur base jetable et par la CI.
- Section **non commitée** (un commit relancerait un déploiement).
