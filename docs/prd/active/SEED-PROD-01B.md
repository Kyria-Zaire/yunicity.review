# SEED-PROD-01B — Médias fiables auto-hébergés (lieux culturels & quartiers Reims)

> Prédécesseur : `SEED-PROD-01A` (#102) — suppression des visuels cassés/hors-sujet.

## Statut d'exécution — ✅ LIEUX CULTURELS FAITS (2026-07-13)

Les **12 lieux culturels** ont été traités **en prod** : covers Wikimedia Commons
redimensionnés (≤ 1600 px, < 250 Ko) uploadés sur R2 → `media.yunicity.city/places/reims/{slug}/cover.jpg`,
DB mise à jour (`hero_image_url`/`image_url`/`thumbnail_image_url`, `image_source=wikimedia_commons`,
`image_license`, `photo_credit`). Vecteur : `railway run` sur le service API prod (secrets non exfiltrés).
Snapshot d'avant : `backend/data/audit-archive/seed-prod-01b-snapshot-20260713T091802Z.json` (12/12).

Sections DESIGN ci-dessous conservées pour l'historique. **Reste (phase 2)** :
`gallery_images`, quartiers, 5 lieux hors des 12 audités.

## 1. Objectif

Remplacer les visuels placeholder / hotlinks fragiles des lieux culturels (et
quartiers éligibles) par des assets **auto-hébergés sur Cloudflare R2 + CDN**,
sourcés depuis **Wikimedia Commons** (licences libres vérifiées).

Dette actuelle à éteindre (`backend/app/db/seeds/reims_cultural_media.py`) :
- une seule photo Unsplash réutilisée pour tous les lieux via `_wiki()` ;
- quelques URLs tierces fragiles (Bing / linternaute / actualitix / elebase) ;
- `image_source='unsplash'` / `image_license='Unsplash License'` **faux**.

## 2. Garde-fou structurant (déjà dans le code)

`backend/app/core/neighborhood_hero_assets.py` interdit `wikimedia` / `wikipedia`
dans l'URL **finale stockée** (`FORBIDDEN_COVER_URL_FRAGMENTS`).

➡️ **On source depuis Commons mais on ne stocke jamais un lien Commons.** On
télécharge une fois, on auto-héberge (R2/CDN), on stocke l'URL CDN.

À faire (cohérence) : étendre ce garde-fou au domaine culturel, qui ne l'a pas.

## 3. Conformité licences (Wikimedia Commons)

Toutes les images retenues sont **CC BY-SA** ou **domaine public**. Obligations :
- **CC BY-SA** → créditer l'auteur + nommer la licence + lien ; ShareAlike sur
  les dérivés (le redimensionnement reste sous la même licence).
- **Domaine public (PD-self)** → aucune obligation ; crédit par courtoisie.

Stockage DB : `photo_credit` = `"<Auteur> / <Licence> via Wikimedia Commons"`,
`image_license` = code licence, `image_source` = `wikimedia_commons`.

## 4. SCOPE 1 — Lieux culturels (12/12 vérifiés)

Licences et auteurs confirmés sur la page `File:` de chaque fichier.

| slug | fichier Commons | licence | auteur / crédit | résolution orig. | vue | statut |
|------|-----------------|---------|-----------------|------------------|-----|--------|
| basilique-saint-remi | `Reims,_Abteikirche_Saint-Remi.jpg` | CC BY-SA 4.0 | Rolf Kranz | 2896×3939 | façade ouest | ✅ |
| cathedrale-notre-dame | `Exterior_view_of_the_west_facade_of_Notre-Dame_Cathedral_in_Reims.jpg` | CC BY-SA 4.0 | Gennadii Saus i Segura | 4821×7500 | façade ouest | ✅ |
| cryptoportique | `Cryptoportique1.jpg` | CC BY-SA 1.0 | Jean-Pierre Riocreux (2004) | 1024×768 | galerie gallo-romaine | ⚠️ basse rés + licence 1.0 |
| frac-grand-est | `Entrée_FRAC_Champagne-Ardenne_dans_l'Ancien_Collège_des_Jésuites_de_Reims.JPG` | CC BY-SA 4.0 | Gérald Garitan | 4240×2832 | entrée, rue Gambetta | ✅ **Reims confirmé** |
| halles-boulingrin | `Reims_-_halles_du_Boulingrin_(04).JPG` | CC BY-SA 3.0 | Fab5669 | 3264×2448 | intérieur voûté Art déco | ✅ (intérieur) |
| musee-des-beaux-arts | `Musée_des_beaux_arts_024.JPG` | CC BY-SA 3.0 | Gérald Garitan | 2592×1944 | façade (anc. Abbaye Saint-Denis) | ✅ **Reims confirmé** |
| musee-saint-remi | `Reims-Musée_St_Rémi-02.jpg` | Domaine public (PD-self) | Vassil | 1772×1240 | cloître XVIIe-XVIIIe | ✅ |
| opera-de-reims | `2026-05-10_19-15-22_-_Reims_-_Opéra.jpg` | CC BY-SA 4.0 | Baidax | 8160×6120 | façade/intérieur | ⚠️ cadrage à confirmer |
| palais-du-tau | `Reims_Palace_of_Tau_016_7893.jpg` | CC BY-SA 4.0 | Ludvig14 | 8488×5961 | palais + chapelle | ✅ |
| parc-de-champagne | `Parc_de_champagne_225.JPG` | CC BY-SA 3.0 | Garitan | 4592×2576 | parc (anc. parc Pommery) | ✅ |
| planetarium-de-reims | `Planétarium_de_Reims_Vue_extérieure.jpg` | CC BY-SA 4.0 | Planétarium de Reims / Fred Laures (Pégase51) | ~3543×2362 | façade extérieure | ✅ |
| porte-de-mars | `Reims_Portede_Mars_016_7344.jpg` | CC BY-SA 4.0 | Ludvig14 | 8673×4852 | arc antique | ✅ |

**Vérifications spécifiques demandées :**
- `musee-des-beaux-arts` → **c'est bien Reims** (façade de l'ancienne Abbaye Saint-Denis, auteur G. Garitan). Pas d'homonyme.
- `frac-grand-est` → **c'est bien Reims** (entrée de l'Ancien Collège des Jésuites, rue Gambetta). Nom de fichier exact figé.

**Points de vigilance (non bloquants, arbitrage Founder) :**
- `cryptoportique` : 1024×768 seulement + licence CC BY-SA 1.0 (rare). Suffisant pour vignette/carte, limite pour un hero. Alternative : chercher une meilleure prise ou accepter la basse rés.
- `opera-de-reims` : la légende Wikipédia dit « façades rue de Vesle » (extérieur), le résumé du fichier suggère un intérieur. À trancher visuellement avant download.
- `halles-boulingrin` : vue **intérieure** (voûte Art déco iconique) — représentatif mais pas une façade.

## 5. SCOPE 2 — Quartiers (2 candidats sur 7)

| slug | fichier Commons | licence | auteur | résolution | recommandation |
|------|-----------------|---------|--------|------------|----------------|
| chemin-vert | `Reims_Maison_commune_de_la_cité-jardin_du_chemin_Vert.jpg` | CC BY-SA 4.0 | Ours51 | 807×605 | ⚠️ Vignette seulement (trop basse pour hero) — sinon fallback |
| la-neuvillette | `La_neuvillette_43041.jpg` | CC BY-SA 4.0 | G. Garitan | 2832×4240 | ❌ **Fallback recommandé** |

**Recommandation la-neuvillette** : ne pas utiliser en cover. Le fichier « église »
est en réalité une **cérémonie de commémoration du 8 mai 2018** (personnes,
monument aux morts, format portrait) — ni neutre, ni représentatif d'un quartier
résidentiel. Conserver le fallback gradient+nom (livré en 01A).

**murigny, orgeval, jean-jaures, clairmarais, maison-blanche** : pas de photo
Commons exploitable et pertinente → **nécessitent photo terrain ou partenaire ville**.
Garder le fallback jusque-là.

## 6. SCOPE 3 — Plan technique (préparation)

### 6.1 Convention de clés R2 (réutilise les helpers existants)

| Ressource | Storage key | Helper existant | URL publique (recette) |
|-----------|-------------|-----------------|--------------|
| Lieu — cover | `places/reims/{slug}/cover.jpg` | `cultural_place_assets.py` | `https://media.recette.yunicity.city/places/reims/{slug}/cover.jpg` |
| Lieu — galerie | `places/reims/{slug}/gallery/{nn}.jpg` | *(à ajouter, même préfixe)* | idem |
| Quartier — hero | `neighborhoods/reims/{slug}/hero.jpg` | `neighborhood_hero_assets.py` | `https://media.recette.yunicity.city/neighborhoods/reims/{slug}/hero.jpg` |

Base CDN par env (INFRA-01) : `media.{env}.yunicity.city` (**prod** → `media.yunicity.city`).
**Décision : Option A confirmée** — réutilisation du bucket `yunicity-media-{env}`
et des credentials `LOCAL_VIDEO_R2_*` existants (préfixe de clés `places/reims/…`).
Pas de bucket dédié ni de vars `PUBLIC_MEDIA_R2_*`.

> ℹ️ **Exécution réelle (2026-07-13)** : faite sur **prod** (`media.yunicity.city`),
> l'environnement recette n'étant pas provisionné dans Railway (seul `production`
> l'est, avec `LOCAL_VIDEO_R2_*` configuré). `--execute` dérive l'URL de
> `LOCAL_VIDEO_CDN_BASE_URL` et upload dans `LOCAL_VIDEO_R2_BUCKET` (voir bandeau statut en tête).

### 6.2 Script d'upload batch (à créer, pas à exécuter)

`backend/scripts/seed_prod_01b_upload_media.py`, calqué sur le pattern boto3
existant (`app/services/local_video/r2_storage.py`). Entrée = manifest versionné
`backend/app/db/seeds/media_manifest_reims.json`.

Comportement : download `Special:FilePath` (timeout + retry backoff 5xx) →
validation MIME/taille → `head_object` skip si présent (idempotent, `--force`)
→ `put_object` avec `Cache-Control: public, max-age=31536000, immutable` →
rapport `{slug → url CDN}`. **Dry-run par défaut**, aucune exécution sans
validation Founder.

### 6.3 Mise à jour DB (via seed/ORM idempotent — jamais de SQL raw)

**`cultural_places`** (`reims_cultural_media.py`) :
`hero_image_url` (+ `image_url` legacy mirroir), `thumbnail_image_url`,
`gallery_images[].url` → URLs CDN R2 ;
`image_source='wikimedia_commons'`, `image_license=<code>`, `photo_credit=<auteur/licence>`.

**`neighborhoods`** (`reims_neighborhoods.py`) :
`cover_image_url` → URL CDN R2 (quartiers traités uniquement) ;
`hero_image_storage_key` déjà positionné.

### 6.4 Nettoyage induit
- Supprimer `frontend/apps/web/lib/cultural-place-image-overrides.ts`.
- Retirer le placeholder `_wiki()`/Unsplash de `reims_cultural_media.py`.
- Étendre `FORBIDDEN_COVER_URL_FRAGMENTS` au domaine culturel.

## 7. Reste à valider (Founder) avant BUILD
1. Arbitrage `cryptoportique` (basse rés) et `opera-de-reims` (cadrage).
2. Quartiers : `chemin-vert` en vignette vs. fallback ; `la-neuvillette` fallback confirmé.
3. Infra R2 : bucket dédié vs. réutilisation + vars d'env (bloquant DevOps).
4. Une fois validé : report des licences vérifiées (§4/§5) dans le manifest JSON.
