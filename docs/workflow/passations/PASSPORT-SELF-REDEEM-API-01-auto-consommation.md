# Passation — PASSPORT-SELF-REDEEM-API-01 · Un citoyen peut consommer une offre sans partenaire

> **Ouvert le 2026-11-05 par Kyria**, seul ticket actif. ⛔ **ZONE ROUGE**
> (autorisation, intégrité des données). Préproduction uniquement ; aucune
> action sur `main` ni la production.
> ✅ **Décision produit (Kyria, 2026-11-05)** : **la consommation d'une offre
> exige une validation partenaire.**

## 1. État Git

Worktree `C:/Users/kyria/yunicity-wt-deps-next-preview`, branche
**`fix/passport-self-redeem`** depuis **`1900fb01`** (Preview servie).
**Aucun code produit modifié.** Seul ajout : le test de reproduction
`backend/tests/test_passport_self_redeem_blocked.py`. Documents d'autres
tickets préservés, non commités (QR suspendu, demande support, clôture oracle).

## 2. Diagnostic

**Route** `POST /api/v1/passport/offers/{offer_id}/redeem`
(`backend/app/api/v1/passport.py:142`) → `PassportService.redeem_offer`
(`backend/app/services/passport_service.py:200`) : authentification seule ;
contrôles Passport actif, offre visible, tier, organisation vérifiée, doublon,
plafond ; puis **écrit une utilisation `COMPLETED`**, incrémente le compteur,
évalue les tampons locaux (`via_partner_scan=False`) et **attribue
réputation, Yuni, défis et niveau**. **Aucune** métadonnée d'audit, **aucun**
tampon partenaire, **aucun** partenaire impliqué.

**Reproduction — base jetable** (test du comportement attendu, lancé sur le
code actuel) :
- auto-consommation → **`200`**, utilisation `status: "completed"` créée →
  **échec du test** (défaut reproduit) ;
- consultation des offres et QR → **intacts** (test vert) ;
- parcours partenaire `/scan/redeem` → **consomme avec `metadata.audit`**
  (test vert).

**Effets mesurés d'UNE auto-consommation** (relevé temporaire, supprimé) :

| Utilisations | Compteur Passport | Transactions Yuni |
|---|---|---|
| 0 → **1** | 0 → **1** | 0 → **1** |

## 3. Appels identifiés

| Client | Appel | Atteignable ? |
|---|---|---|
| **Web** `apps/web/hooks/use-passport-offers.ts` → `redeemPassportOffer` | auto-consommation | **non** : branché seulement dans `passport-dashboard-screen` / `passport-offers-section`, **écrans morts** (`PASSPORT-WEB-DEAD-OFFERS-UI-01`) ; `passport-page` n'utilise le hook que pour **lister** |
| **Mobile** `apps/mobile/hooks/use-passport-offers.ts` → onglet Passport, bouton d'offre `onRedeem` | auto-consommation | **oui** |
| **Mobile** `app/(protected)/partner-scan/offers.tsx` → `scan.redeemOffer` | **parcours partenaire** | oui — existant |
| **Admin** `apps/admin/lib/hooks/use-partner-scan.ts` → `scanApi.redeemOffer` | **parcours partenaire** | oui — existant |

**Le parcours partenaire existant suffit** (`/scan/resolve` + `/scan/redeem`,
QR `YNCP1:` du citoyen, droits partenaire, audit, tampon) → **aucun nouveau
mécanisme de signature**.

## 4. Plan proposé — NON appliqué

**Backend (correctif minimal)**
1. `POST /passport/offers/{offer_id}/redeem` reste **authentifiée** mais
   répond **toujours `403 OFFER_PARTNER_VALIDATION_REQUIRED`** — « Cette offre
   se valide chez le partenaire : présentez votre QR Passport. » — **avant**
   toute lecture (même réponse que l'offre existe ou non : pas de nouvel
   oracle) ; **aucune écriture**.
2. `PassportService.redeem_offer` devient injoignable : **le retirer**
   *(recommandé : évite qu'un futur appel réactive l'auto-consommation)* — ou
   le conserver inutilisé (dette signalée). **Décision attendue.**
3. Parcours partenaire, consultation des offres, QR : **inchangés**.

**Tests**
- `test_passport_self_redeem_blocked.py` (3) : refus `403` **sans effet**
  (utilisations, compteur, Yuni) ; consultation + QR ; partenaire avec audit.
- `test_passport_redemptions.py` : `success` et `duplicate` → réécrits pour
  attendre le refus sans effet ; `requires_auth` (`401`) inchangé ;
  `unknown_offer` → même `403` (pas d'oracle sur l'existence de l'offre).
- `test_local_stamps.py` (2) : préparation par **`/scan/redeem`** au lieu de
  l'auto-consommation — mêmes assertions sur les tampons souvenir (le parcours
  partenaire évalue aussi les tampons, `via_partner_scan=True`).

**Clients**
- **Web** : aucun changement (chaîne morte).
- **Mobile** : **aucun changement dans ce lot** — l'erreur de l'API est affichée
  telle quelle (`err.message`) dans l'encart de retour : le citoyen lit
  « présentez votre QR Passport ». ⚠️ Le bouton « utiliser » reste visible :
  traitement UX **documenté à part** (proposé :
  `PASSPORT-MOBILE-REDEEM-BUTTON-01`, remplacer par « Présenter mon QR »).
- Écrans morts web : **non supprimés** ; leur sort reste
  `PASSPORT-WEB-DEAD-OFFERS-UI-01`.

**Validation** (même chemin que l'oracle) : tests ciblés sur base jetable →
`docker-ci` manuel sur la branche corrective (suite complète) **avant** la
Preview → avance rapide → SHA servi.

**Hors périmètre** : utilisations déjà créées par auto-consommation
(**non comptées** — leur recensement sur la Preview demanderait un accès à la
base ; production non lue) ; production.

## 5. ✅ Correctif appliqué (décision de Kyria, 2026-11-05)

- **Route** `POST /passport/offers/{offer_id}/redeem` : toujours
  **authentifiée** (`401` sans session) ; répond **toujours `403
  OFFER_PARTNER_VALIDATION_REQUIRED`** — « Cette offre se valide chez le
  partenaire : présentez votre QR Passport. » — **sans session de base, sans
  lecture métier, sans écriture**, quelle que soit l'offre. Limitations de débit
  et dépendance base retirées de cette route (plus aucune opération).
- **`PassportService.redeem_offer` retiré** — unique appelant : cette route
  (vérifié par recherche dans `backend` et `frontend`). **Conservés** car
  partagés avec le scan partenaire : `award_reputation_for_partner_redemption`,
  `award_yuni_for_partner_redemption`, `update_challenges_for_partner_redemption`,
  `evaluate_passport_level_after_activity`, `LocalStampService`. Imports devenus
  inutiles retirés des deux fichiers.
- ⚠️ **Dette signalée** : `PartnerOfferRepository.get_visible_offer_by_id` n'a
  plus d'appelant (il ne servait qu'à `redeem_offer`) ; **laissé en place**.

**Tests** (base jetable) :
- `test_passport_self_redeem_blocked.py` (3) : refus **sans aucun effet** —
  utilisations, compteur, **Yuni, réputation, progression de défis** ;
  consultation + QR intacts ; partenaire avec `metadata.audit`.
- `test_passport_redemptions.py` (5) : **réussite** (`/scan/redeem` : `success`,
  utilisation enregistrée, `metadata.audit`, **transaction Yuni rattachée à
  l'utilisation**), **doublon** (`409 REDEMPTION_ALREADY_EXISTS`), **offre
  inconnue** (`404 OFFER_NOT_FOUND`) — **via le partenaire** ; `401` sans
  session ; route citoyenne : **même `403` et même corps** pour une offre
  existante ou inexistante.
- `test_local_stamps.py` (2) : tampons souvenir attribués et non dupliqués
  **via le partenaire**.
- Aides partagées ajoutées à `tests/conftest_passport.py` :
  `register_partner_for_org`, `partner_redeem`.
- Résultats : **23 passed** puis **8 passed** (après correction d'une hypothèse
  de test : le partenaire crée **2** transactions Yuni — utilisation + tampon
  Passport ; l'assertion vise désormais la transaction **rattachée à
  l'utilisation**). **Mutation** : code d'origine → **2 tests de refus rouges**.
- `ruff` vert ; `mypy` vert sur les fichiers touchés (3 erreurs locales
  préexistantes dans `app/core/observability.py`, `sentry_sdk` absent du poste —
  fichier non modifié).

**Hors lot** : `PASSPORT-MOBILE-REDEEM-BUTTON-01` **en attente** (index) ;
écrans web morts (`PASSPORT-WEB-DEAD-OFFERS-UI-01`) ; **aucune correction des
données historiques**.
