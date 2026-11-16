# SCAN-RESOLVE-TOKEN-ORACLE-01 — `/scan/resolve` révèle la validité d'un jeton Passport

⛔ **ZONE ROUGE** (jetons, autorisation).

| Champ | Valeur |
|-------|--------|
| **Statut** | ✅ **CLOS** le 2026-11-05 au stade Preview (décision Kyria) |
| **Preview** | **`1900fb01`** |
| **Branche corrective** | `fix/scan-resolve-token-oracle` (depuis `eb07b6ce`) |
| **Passation** | `docs/workflow/passations/SCAN-RESOLVE-TOKEN-ORACLE-01-oracle-jeton.md` |
| **Production / `main`** | **non fusionné** |

## Limite explicite à la clôture

L'appel **authentifié** d'un utilisateur non partenaire **n'a pas** été rejoué
sur `preview.yunicity.city` (aucun identifiant Preview à disposition).
Comportement prouvé sur **base jetable** et par la **CI** (2 075 passed).

## 1. Constat (historique — avant correctif)

`POST /api/v1/scan/resolve` exigeait seulement un utilisateur authentifié.
Dans `ScanRedemptionService.resolve_for_partner` :

1. `_resolve_passport` d'abord — jeton inconnu → **`404 PASSPORT_NOT_FOUND`** ;
2. **ensuite** contrôle partenaire — sinon **`403 SCAN_PARTNER_FORBIDDEN`**.

**Conséquence** : tout utilisateur connecté distinguait jeton valide (`403`) /
inconnu (`404`) — oracle. Même ordre sur `scan/redeem`.

## 2. Correctif livré (rappel)

- Autorisation partenaire **en premier** ; non-partenaire → **toujours `403`**
- Tests de non-régression (non-partenaire valide/inconnu → même `403` ; partenaire)
- CI Docker + PR #202 sur `1900fb01` ; Railway Preview SUCCESS

## 3. Hors périmètre

Rotation des jetons (`PASSPORT-QR-TOKEN-ROTATION-01` / QR tiers) ; production
(décision séparée, sur demande explicite).

## Prochaine action

Aucune sur ce ticket (clos). Voir index.
