# WEB-PARTNERS-08A — Comptes et parcours recette (pilotes Reims)

**Environnements autorisés :** `dev`, `recette` uniquement.  
**Interdit :** `preprod`, `prod` — le seed `--pilot` refuse de s’exécuter.

## Prérequis base

```bash
cd backend
uv run alembic upgrade head
uv run python -m app.db.seeds --pilot
```

`--pilot` exécute le seed catalogue standard (partenaires, événements, sync feed) **et** crée les comptes pilotes OWNER.

Optionnel (contenu citoyen démo) :

```bash
uv run python -m app.db.seeds --pilot --demo
```

## Comptes partenaires pilotes

Mot de passe commun recette : **`PilotReims1!Dev`** (même politique de rotation que les comptes démo).

| Partenaire | Email | Slug org | Fiche publique |
|------------|-------|----------|----------------|
| Belga Queen | `belga-queen@partner.yunicity.dev` | `belga-queen` | `/places/belga-queen?city=Reims` |
| Pittaya | `pittaya@partner.yunicity.dev` | `pittaya` | `/places/pittaya?city=Reims` |
| Centre des Ressources | `centre-des-ressources@partner.yunicity.dev` | `centre-des-ressources` | `/places/centre-des-ressources?city=Reims` |
| Garçon Barbiers | `garcon-barbiers@partner.yunicity.dev` | `garcon-barbiers` | `/places/garcon-barbiers?city=Reims` |

Connexion : application web `/login` avec l’email partenaire ci-dessus.

## Compte citoyen (QA)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Citoyen démo | `demo@yunicity.dev` | `DemoReims1!Dev` |

Utiliser pour : feed, Passport, claim tampon QR, découverte des fiches pilotes.

Activer le Passport citoyen si besoin : `/passport`.

## Compte admin / modération

Aucun compte staff n’est créé par `--pilot`. Pour approuver offres ou creator content (08C) :

1. Utiliser un compte existant avec rôle **MODERATOR** ou **SUPER_ADMIN** en recette, **ou**
2. Attribuer `MODERATOR` via outil RBAC interne à un compte de test.

Permissions requises : `moderation.manage` ou `system.admin`.

## Données pilotes vérifiées (08A)

Sources documentées dans `backend/app/db/seeds/reims_pilot_partner_public_data.py`.

| Champ | Note |
|-------|------|
| Adresse / GPS | Issues des sites officiels (juin 2026) |
| Téléphone / site | Idem ; Belga Queen : pas de téléphone public listé |
| Instagram | Uniquement si URL confirmée sur source officielle |
| Logo / bannière | Placeholders SVG `/seed/partners/*` (recette) — remplacer par assets signés |

## Parcours test rapide (Gate 1 — 08A)

### Citoyen

1. Se connecter `demo@yunicity.dev`.
2. Ouvrir `/places?city=Reims&filter=partners` — les 4 pilotes listés.
3. Ouvrir `/places/belga-queen?city=Reims` — adresse, pas d’alerte carte « sans coordonnées ».
4. Ouvrir `/map?city=Reims` — pin Belga (et autres pilotes).
5. Ouvrir `/feed` — au moins un post **événement** lié à un pilote (seed + sync feed).

### Partenaire (Belga)

1. Se connecter `belga-queen@partner.yunicity.dev`.
2. `GET /api/v1/organizations/me` (ou UI organisations) — org Belga Queen, rôle OWNER.

### API

```http
GET /api/v1/partners/belga-queen?city=Reims
```

Attendu : `latitude`, `longitude`, `address`, `website_url` renseignés.

## Hors scope 08A (tickets suivants)

| Besoin | Ticket |
|--------|--------|
| Offres Passport seed / catalogue | WEB-PARTNERS-08B |
| UI QR tampon partenaire | WEB-PARTNERS-08B |
| Portail self-service (events, creator) | WEB-PARTNERS-08C |
| Scénario E2E Belga complet | WEB-PARTNERS-08D |

## Scénario Belga complet (référence 08D)

À exécuter après 08B + 08C : création contenu → modération → feed → offre → QR → tampon → vérification citoyen.
