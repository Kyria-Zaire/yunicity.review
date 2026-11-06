# SCAN-RESOLVE-TOKEN-ORACLE-01 — `/scan/resolve` révèle la validité d'un jeton Passport

> **Statut : ouvert le 2026-11-05, NON traité.** ⛔ **ZONE ROUGE** (jetons,
> autorisation). Relevé pendant la préparation de
> `PASSPORT-QR-TOKEN-ROTATION-01`. **Constat par lecture de code — non
> observé** sur un environnement déployé.

## 1. Constat

`POST /api/v1/scan/resolve` (`backend/app/api/v1/scan.py`) exige seulement un
utilisateur **authentifié**. Dans `ScanRedemptionService.resolve_for_partner`
(`backend/app/services/scan_redemption_service.py`) :

1. `_resolve_passport(qr_secret, …)` cherche le Passport **d'abord** — jeton
   inconnu → **`404 PASSPORT_NOT_FOUND`** ;
2. **ensuite seulement**, `list_managed_organization_ids` vérifie que
   l'appelant gère une organisation vérifiée — sinon **`403
   SCAN_PARTNER_FORBIDDEN`**.

**Conséquence** : **tout utilisateur connecté**, même sans organisation,
distingue un jeton **valide** (`403`) d'un jeton **inconnu** (`404`) — un
oracle de validité. `scan/redeem` est à vérifier selon le même ordre.

## 2. Correctif proposé (non appliqué)

- Vérifier l'**autorisation partenaire en premier** dans `resolve_for_partner`
  (et `redeem_for_partner` si même ordre) ; un non-partenaire reçoit **toujours
  `403`**, quel que soit le jeton.
- Tests de non-régression : non-partenaire + jeton valide → `403` ; non-partenaire
  + jeton inconnu → `403` (même code, même corps) ; partenaire + jeton inconnu →
  `404` ; partenaire + jeton valide → `200`.
- Vérifier l'absence de limitation de débit propre à ces routes (énumération).

## 3. Hors périmètre

Rotation des jetons (`PASSPORT-QR-TOKEN-ROTATION-01`) ; production (décision
séparée, sur demande explicite).
