# PREVIEW-PARTNER-TEST-ACCOUNT-01 — Compte partenaire de test, Preview uniquement

> **Statut : préparé le 2026-11-05, NON créé.** Besoin né de
> `PASSPORT-QR-TOKEN-ROTATION-01` (prouver « ancien QR refusé / nouveau QR
> accepté » sur la Preview) et des limites de `PASSPORT-QR-THIRD-PARTY-01`
> (parcours partenaire jamais vérifié). ⛔ **Preview seulement** ; production
> exclue. Création soumise à l'accord de Kyria.

## 1. Pourquoi un script

- **Inscriptions fermées** sur la Preview : `GET /api/v1/auth/registration-status`
  → `open: false`, `mode: pilot` (relevé du 2026-11-05).
- Aucune route d'administration simple ne crée un membre d'organisation
  vérifiée ; aucun compte partenaire n'existe en QA (`qa_fixtures.py` : aucun
  `OrganizationMember`) ni n'est documenté sur la Preview.
- Droit de scanner (`list_managed_organization_ids`) : membre **`owner` ou
  `admin`**, statut **`active`**, d'une organisation **`verified`**.

## 2. Ce que créerait le script (à écrire, non écrit)

`backend/scripts/create_preview_partner_test_account.py`, sur le modèle de
`rotate_passport_qr_tokens.py` :

- **ciblage obligatoire** : `--expected-railway-project`,
  `--expected-railway-environment`, `--expected-railway-service` (comparés à
  `RAILWAY_*_ID`) + `--expected-database` ; **simulation par défaut** ;
- **idempotent** : ne recrée rien si l'e-mail ou le slug existe ;
- crée :
  - un **utilisateur** de test — e-mail choisi par Kyria ; **mot de passe lu
    depuis une variable d'environnement** au lancement, **jamais affiché ni
    journalisé** ; e-mail marqué vérifié ;
  - une **organisation** « QA Partenaire Preview », **`verified`**,
    **`private`** (absente des surfaces publiques citoyennes, comme le prévoit
    `cleanup_test_partner_public_surfaces.py` pour les partenaires de test) ;
  - une **adhésion `owner` `active`** ;
  - **une offre de test** publiée, réservée à cette organisation (utile au
    parcours partenaire, sans effet tant qu'aucun scan n'est fait) ;
- sortie : identifiants (UUID), **jamais** de secret.

## 3. Utilisation prévue

1. Créer le compte (après accord).
2. Recette du **parcours partenaire** (`/organizations/me/partner/passport`,
   QR de tampon généré sur l'appareil — limite de `PASSPORT-QR-THIRD-PARTY-01`).
3. Avant rotation : `POST /api/v1/scan/resolve` (lecture seule) avec le QR d'un
   citoyen de test → `200`.
4. Après rotation : même QR → `404 PASSPORT_NOT_FOUND` ; QR rechargé → `200`.

## 4. Retrait

Script inverse ou option `--retire` : adhésion désactivée, organisation
`private` conservée (pas de suppression de données), compte désactivé.
