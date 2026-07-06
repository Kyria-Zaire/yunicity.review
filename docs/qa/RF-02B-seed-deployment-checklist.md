# RF-02B — Checklist déploiement seed offres partenaires

| Champ | Valeur |
|-------|--------|
| **Ticket** | RF-02B |
| **Scope** | Deploy idempotent `seed_reims_partner_offers` (4 offres RF-02A) |
| **Prérequis** | RF-02A sur `main` ; validation terrain en cours (`docs/ops/RF-02B-partner-offers-field-validation.md`) |
| **GO prod CTO** | **NON** — ne pas exécuter prod sans validation explicite |

---

## Rappel exclusions

- ❌ Pas de RF-01A / spend YM / wallet
- ❌ Pas de nouveaux partenaires fictifs
- ❌ Pas de modification contenu offres sans validation terrain
- ❌ Pas de deploy prod automatique

---

## Slugs attendus après seed (RF-02A)

| Partenaire | Slug offre |
|------------|------------|
| Belga Queen | `belga-queen-premiere-biere` |
| Pittaya | `pittaya-entree-offerte` |
| Centre des Ressources | `centre-des-ressources-atelier-silver` |
| Garçon Barbiers | `garcon-barbiers-coupe-soin-gold` |

**Slugs obsolètes (ne doivent plus apparaître après upsert) :** `belga-queen-accueil-passport`, `pittaya-avantage-passport`.

---

## Commandes seed

### Prérequis communs

```bash
cd backend
export DATABASE_URL="postgresql+asyncpg://..."   # URL de l'environnement cible
export APP_ENV="recette"   # ou prod — vérifier avant exécution
pip install -e ".[dev]"    # ou environnement déjà provisionné (Railway, Docker)
```

Vérifier la connexion :

```bash
python -c "from app.core.config import get_settings; s=get_settings(); print(s.app_env, bool(s.database_url))"
```

---

### Recette — option A (recommandée : catalogue partenaires + offres)

Seed production-safe : partenaires signés Reims + offres Passport (idempotent).

```bash
cd backend
APP_ENV=recette DATABASE_URL="<DATABASE_URL_RECETTE>" \
  python -m app.db.seeds --partners
```

**Résultat attendu :**

- Log `reims_partner_offers_seed_completed` avec `created` / `updated`
- 4 partenaires pilotes signés présents
- 4 offres avec slugs RF-02A, `status=published`, `is_active=true`
- `offers_created` ≥ 0 ; `offers_updated` ≥ 0 selon état DB (idempotent)

**Quand utiliser :** première mise en place recette ou resync catalogue + offres.

---

### Recette — option B (offres seules, partenaires déjà en base)

Si les organisations pilotes existent déjà :

```bash
cd backend
APP_ENV=recette DATABASE_URL="<DATABASE_URL_RECETTE>" \
  python -c "
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import get_settings
from app.db.seeds.reims_partner_offers import seed_reims_partner_offers

async def main() -> None:
    settings = get_settings()
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        created, updated = await seed_reims_partner_offers(session)
        await session.commit()
        print(f'offers_created={created} offers_updated={updated}')
    await engine.dispose()

asyncio.run(main())
"
```

**Résultat attendu :** `offers_created` + `offers_updated` = 4 max (upsert par UUID).

---

### Recette — option C (pipeline dev complet, hors prod)

Uniquement si recette autorise le seed standard (sans `--demo` / `--pilot` sauf besoin QA) :

```bash
cd backend
APP_ENV=recette DATABASE_URL="<DATABASE_URL_RECETTE>" \
  python -m app.db.seeds
```

⚠️ Exécute l'ensemble des seeds (RBAC, quartiers, etc.) — préférer option A ou B pour un deploy ciblé offres.

---

### Prod — **INTERDIT sans GO CTO**

> **Ne pas exécuter** tant que `docs/ops/RF-02B-partner-offers-field-validation.md` n'indique pas **4× CONFIRMED** + GO CTO signé.

Commande préparée (exécution manuelle uniquement) :

```bash
cd backend
APP_ENV=prod DATABASE_URL="<DATABASE_URL_PROD>" \
  python -m app.db.seeds --partners
```

**Garde-fous :**

- `--demo` et `--pilot` **refusés** en prod (`SystemExit 2`)
- `--partners` est le chemin catalog production-safe (`reims_partners_catalog.py`)
- Pas de rollback automatique — procédure manuelle ci-dessous

---

## Journal de déploiement (à remplir à l'exécution)

| Environnement | Commande | Opérateur | Date (UTC) | `created` | `updated` | Résultat | Notes |
|---------------|----------|-----------|------------|-----------|-----------|----------|-------|
| recette | `--partners` | _vide_ | _vide_ | — | — | **NON EXÉCUTÉ** | En attente validation terrain |
| prod | `--partners` | _vide_ | _vide_ | — | — | **BLOQUÉ** | GO CTO requis |

---

## Rollback

Le seed est **idempotent** (upsert UUID + sync `_SYNC_FIELDS`). Rollback = restaurer le contenu métier précédent puis re-seed.

### Option 1 — Re-seed version git précédente (recommandé)

```bash
# Sur une branche/tag antérieur à RF-02A
git show <commit_avant_RF-02A>:backend/app/db/seeds/reims_partner_offers.py > /tmp/reims_partner_offers_legacy.py
# Remplacer temporairement, exécuter option B recette/prod, puis restaurer le fichier RF-02A
```

### Option 2 — Correction admin manuelle

Staff : `admin.yunicity.city/passport-offers` → éditer / archiver l'offre concernée.

### Option 3 — SQL ciblé (dernier recours)

Désactiver l'offre :

```sql
UPDATE partner_offers
SET is_active = false, status = 'archived'
WHERE slug IN (
  'belga-queen-premiere-biere',
  'pittaya-entree-offerte',
  'centre-des-ressources-atelier-silver',
  'garcon-barbiers-coupe-soin-gold'
);
```

**Vérifier après rollback :** catalogue public ne liste plus les offres archivées.

---

## Vérifications post-deploy

### 1. API publique

Base recette : `https://api-recette.yunicity.fr`  
Base prod : `https://api.yunicity.city` (ajuster si infra différente)

```bash
API="https://api-recette.yunicity.fr"

# Catalogue global
curl -sS "$API/api/v1/partner-offers?city=Reims&limit=50" | jq '.items[].slug'

# Par partenaire
curl -sS "$API/api/v1/partners/belga-queen/offers?city=Reims" | jq '.items[0] | {slug, title, is_passport_eligible, readiness}'
```

**Attendu :**

- 4 slugs RF-02A présents
- `readiness.readiness` = `ready` si partenaire actif + org publique + verified
- `is_passport_eligible` = `true` pour offres complètes publiées
- Pas de copy placeholder (« Présentez votre Passport Yunicity pour découvrir… »)

### 2. API Passport (auth requise)

```bash
# Avec token citoyen actif
curl -sS -H "Authorization: Bearer <TOKEN>" \
  "$API/api/v1/passport/offers?city=Reims" | jq '.items | length'
```

**Attendu :** offres Basic visibles pour tous tiers ; Silver/Gold filtrées selon `tier_code_required`.

### 3. Admin

| Surface | URL | Vérification |
|---------|-----|--------------|
| Liste offres | `https://admin.<env>/passport-offers` | 4 offres, colonne readiness |
| Filtre readiness | `?readiness=ready` | Offres éligibles listées |
| Détail | `/passport-offers/{id}` | Checklist readiness + `human_description` |

API :

```bash
curl -sS -H "Authorization: Bearer <STAFF_TOKEN>" \
  "$API/api/v1/admin/partner-offers?readiness=ready&page_size=50" \
  | jq '.items[] | {title, readiness: .readiness.readiness}'
```

### 4. Web Passport (citoyen)

| Surface | URL recette (ex.) | Vérification |
|---------|-------------------|--------------|
| Catalogue offres | `https://recette.yunicity.fr/passport` (section offres) | Avantage lisible en < 5 s |
| Fiche partenaire | `https://recette.yunicity.fr/partners/reims/belga-queen` | Offre RF-02A affichée |

### 5. Portail partenaire

| Surface | Vérification |
|---------|--------------|
| `https://recette.yunicity.fr` → espace partenaire → Offres | Panneau readiness par offre |
| API `GET /api/v1/organizations/me/partner/offers` | Champ `readiness` présent avec checks |

---

## Tests automatisés (référence locale)

```bash
cd backend
pytest tests/test_partner_offer_readiness.py -q
pytest tests/test_partner_offers_api.py -q          # integration : skip sans DATABASE_URL
pytest tests/test_prod_partners_catalog_seed.py -q  # integration : skip sans DATABASE_URL
```

---

## Critères de succès RF-02B

- [ ] 4 / 4 offres **CONFIRMED** terrain (`docs/ops/RF-02B-partner-offers-field-validation.md`)
- [ ] Seed recette exécuté et journalisé
- [ ] Vérifications API + admin + web + portail OK en recette
- [ ] GO CTO prod documenté
- [ ] Seed prod exécuté manuellement (si GO)
- [ ] Vérifications prod identiques

---

## Références

- Validation terrain : `docs/ops/RF-02B-partner-offers-field-validation.md`
- Audit RF-02A : `docs/qa/RF-02A-partner-offers-audit.md`
- Seed : `backend/app/db/seeds/reims_partner_offers.py`, `reims_partners_catalog.py`
- Environnement recette : `infra/environments/recette.md`
