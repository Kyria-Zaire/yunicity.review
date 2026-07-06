# WEB-PARTNERS-REVIEW-01 — Audit parcours partenaire Yunicity

**Phase BMAD :** PRODUCT REVIEW (STOP BUILD)  
**Sprint :** Partner Ecosystem  
**Date :** 2026-06-01  
**Périmètre tickets revus :** WEB-PARTNERS-01 → 06C (foundation à feed sync creator content)  
**Partenaires pilotes :** Belga Queen · Pittaya · Centre des Ressources · Garçon Barbiers  

**Méthode :** revue code + seeds + routes API + écrans web/mobile/admin (pas de session live navigateur). Les statuts **Fonctionnel / Partiellement fonctionnel / Non fonctionnel** décrivent l’état **après seed standard** (`python -m app.db.seeds`, sans `--demo`) sur un environnement aligné avec `main` post-merge PR #8.

---

# État global

L’écosystème partenaire est **architecturalement en place** (modèle, API publiques, fiches `/places`, événements liés, creator content + sync feed, Passport offers/QR côté backend). En revanche, l’**expérience bout-en-bout des quatre pilotes** reste **démo technique** plus que **parcours produit crédible** : données catalogue incomplètes, peu ou pas de contenu métier seedé (offres, creator content, tampons), et **trous majeurs d’UI partenaire** sur le web (création événement, creator content, génération QR tampon).

**Verdict synthétique :** le sprint WEB-PARTNERS a livré des **briques** ; il n’a pas encore livré un **réseau partenaire vérifiable par un vrai commerçant ou un citoyen non-dev**.

---

## Ce qui fonctionne

| Zone | Preuve / comportement |
|------|------------------------|
| **Catalogue partenaires ACTIVE** | Les 4 pilotes sont `PartnerStatus.ACTIVE`, `OrganizationVisibility.PUBLIC` dans `reims_signed_partners.py`. |
| **Liste & fiche publique** | `GET /api/v1/partners`, `GET /api/v1/partners/{slug}` ; web `/places` + `/places/{slug}` résout partenaire après échec cultural place (`use-place-detail.ts`). |
| **Rail partenaires** | `/places` charge `listPartners` ; filtre `?filter=partners` ; cartes vers `/places/{slug}?city=Reims`. |
| **Événements pilotes seedés** | `reims_partner_events.py` : 1 événement `partner_event` approuvé par pilote (J+14). API `GET /partners/{slug}/events` + section fiche partenaire. |
| **Badge événement partenaire** | `PartnerEventBadge` sur cartes / détail événement (05B). |
| **Creator content (lecture)** | `GET /partners/{slug}/creator-content` + section fiche + carte `PartnerCreatorContentCard` (06B). |
| **Feed sync creator (technique)** | À l’approval admin, `FeedCreatorContentSyncService` crée/met à jour `PostType.partner_creator` (06C) ; `FeedCard` route vers `OrganizationPostCard`. |
| **Passport citoyen (structure)** | Dashboard : tampons, offres (si en base), partenaires mis en avant, claim QR `/passport/stamp/claim`. |
| **Offres — API self-service** | `POST/PATCH /organizations/me/offers` + workflow modération admin ; UX **mobile + admin** (hub / création). |
| **QR tampon — API** | `POST /api/v1/partners/{slug}/passport-qr` + `POST /passport/stamps/claim` (04A), tests d’intégration Belga Queen. |
| **Scan offre partenaire** | Admin `/partner-scan` + mobile `partner-scan` (flux scan citoyen / validation offre — distinct du QR tampon). |

---

## Ce qui fonctionne partiellement

### Parcours 1 — Partenaire signé

| # | Question | Statut | Détail |
|---|----------|--------|--------|
| 1 | Fiche exploitable ? | **Partiel** | Nom, description, catégorie, badge statut OK. **Manquent** adresse, téléphone, site, logo, bannière, coordonnées GPS dans le seed pilote. |
| 2 | Présence `/places` ? | **Fonctionnel** | Les 4 apparaissent dans la liste partenaires (statut ACTIVE). Fiche riche limitée (cf. données). |
| 3 | Présence `/map` ? | **Partiel** | Rail partenaires OK (`useMapPartners`). **Aucun marqueur** sans `latitude`/`longitude` — message `PARTNER_DETAIL_MAP_NOTICE` sur la fiche. |
| 4 | Offres Passport ? | **Partiel / Non en seed** | Backend `PublicPartnerOfferService` + fiche filtre `listPassportOffers()`. **`reims_partner_offers.py` absent de `main`** et **non appelé** dans `seeds/__main__.py` → catalogue vide en seed standard. Tests d’intégration référencent un fichier seed inexistant sur disque. |
| 5 | QR Passport ? | **Partiel** | API + claim web OK. **Aucun écran** partenaire (web/admin/mobile) pour **générer** le QR tampon (`passport-qr`). |
| 6 | Créer un événement ? | **Partiel** | API `POST /organizations/me/events` + gate statut partenaire. **Pas d’UI web**. Événements pilotes créés par compte système seed, pas par le partenaire. |
| 7 | Créer un contenu créateur ? | **Partiel** | API `POST /organizations/me/creator-content` + workflow. **Pas d’UI web/mobile** dédiée ; modération admin API seulement. |
| 8 | Voir le contenu publié ? | **Non (données)** | Sans contenu `published` + `is_active`, sections vides. Aucun seed creator content pour les pilotes. |
| 9 | Écrans manquants ? | **Oui** | Hub partenaire web unifié, gestion événements, creator content, génération QR tampon, tableau de bord « ma visibilité ». |
| 10 | Actions impossibles ? | **Oui (sans dev)** | Se connecter en tant qu’org pilote (pas de `OrganizationMember` seedé sur Belga/Pittaya/CDR/Garçon), publier offre/événement/contenu, afficher QR tampon. |

### Parcours 2 — Citoyen

| # | Question | Statut | Détail |
|---|----------|--------|--------|
| 1 | Découvrir le partenaire ? | **Partiel** | Via `/places`, rail partenaires, Passport (featured Belga/Pittaya), carte sans pin, recherche explorer (points partenaires si offres). |
| 2 | Voir la fiche ? | **Fonctionnel** | `/places/{slug}` complet structurellement. |
| 3 | Voir les événements ? | **Fonctionnel** | Si seed exécuté ; lien vers `/events/{id}` + badge partenaire. |
| 4 | Voir creator content ? | **Non (contenu)** | UI prête, **listes vides** sans données publiées. |
| 5 | Tampon Passport ? | **Partiel** | Page claim OK. **Bloqué** sans QR généré côté partenaire (pas d’UI + membership). |
| 6 | Bénéficier d’une offre ? | **Partiel** | Redemption Passport si offre `published` + auth. **Aucune offre pilote** en seed standard. |
| 7 | Comprendre l’écosystème ? | **Partiel** | Badge partenaire, bloc « Pourquoi ce lieu », libellés Passport. Pas de narration forte « réseau Yunicity Reims ». |
| 8 | CTA clairs ? | **Partiel** | Partager, voir événement OK. Contact (tel/site) **désactivés** faute de données. Offres / creator : empty states corrects mais **frustrants**. |

**Frictions UX :** fiches « coquilles vides » (passport, creator, carte) ; carte sans géoloc ; double chargement offres (catalogue global + filtre org).

**Incohérences :** `fetchPublicPartnerOffers` cible `/api/v1/partners/offers` alors que le routeur n’expose que `/{slug}/offers` et `passport/offers` — risque d’échec catalogue public non authentifié.

**Zones mortes :** sections Passport / creator vides ; map sans pins pilotes.

### Parcours 3 — Créateur

| # | Question | Statut | Détail |
|---|----------|--------|--------|
| 1 | Contenu lié partenaire ? | **Partiel** | Modèle **org-owned** (`partner_creator_contents`), pas créateur indépendant cross-org. |
| 2 | Association facile ? | **Partiel** | `organization_id` implicite via membership — **pas d’UX**. |
| 3 | Visibilité ? | **Partiel** | Fiche + feed **après** approval admin ; sinon invisible. |
| 4 | Workflows compréhensibles ? | **Non (UI)** | Draft → submit → modération : **API + tests** seulement. |
| 5 | Écrans manquants ? | **Oui** | Tout le parcours créateur/partenaire web ; admin sans UI creator content repérée. |

*Note produit :* « Créateur » au sens Yurpass / créateur local ≠ parcours implémenté ici (06 = **contenu porté par l’organisation partenaire**).

### Parcours 4 — Passport

| # | Question | Statut | Détail |
|---|----------|--------|--------|
| 1 | Avantages visibles ? | **Partiel** | UI `PassportOffersList` / section fiche partenaire — **données absentes** pour pilotes. |
| 2 | Tampons visibles ? | **Partiel** | `PassportStampsSection` OK si tampons en base ; pilotes sans parcours QR bout-en-bout. |
| 3 | Mécanique compréhensible ? | **Partiel** | Claim page claire ; **génération QR** opaque pour le partenaire. |
| 4 | Envie d’utiliser ? | **Partiel** | Promesse UX documentée (`docs/ux/partner-offers-intention.md`) **non ressentie** sans offres réelles et tampons obtenus. |

### Parcours 5 — Feed

| # | Question | Statut | Détail |
|---|----------|--------|--------|
| 1 | Contenus partenaires visibles ? | **Partiel** | Types `event`, `offer`, `partner_creator` supportés. **Pilotes :** events seed **sans** `FeedEventSyncService` dans `reims_partner_events.py` → **probablement absents du feed** malgré agenda public. |
| 2 | Trop visibles ? | **Non** | Dominance citoyenne conservée. |
| 3 | Invisibles ? | **Oui (effet actuel)** | Creator content : rien sans approval + sync. Events pilotes : sync feed non déclenchée au seed. |
| 4 | Contenus citoyens dominants ? | **Oui** | Comportement sain pour la promesse produit. |
| 5 | WEB-PARTNERS-07 nécessaire ? | **Non en priorité** | 06C = sync technique. **07 (distribution éditoriale)** n’a de sens qu’**après** contenu réel et parcours partenaire utilisables. |

---

## Ce qui manque

1. **Seed produit pilote complet** : adresses/GPS, médias, offres Passport publiées (`reims_partner_offers` intégré au pipeline seeds), 1–2 creator contents publiés par pilote (ou script QA), sync feed events au seed ou job idempotent.
2. **Comptes & memberships** : utilisateurs partenaires liés aux 4 orgs (`OrganizationMember` OWNER) pour tests recette réalistes.
3. **UI partenaire web** (ou parity mobile) : événements, creator content, génération QR tampon, gestion offres si le web est la cible pilote.
4. **UI admin** : modération creator content (API `admin/partner-creator-content` sans écran admin identifié).
5. **Catalogue offres public** : aligner route (`/partner-offers` vs `/partners/offers` vs `passport/offers`) et documenter le contrat consommé par le front.
6. **Onboarding partenaire** : checklist « votre lieu est prêt » (données, 1 offre, 1 événement, 1 contenu, QR test).

---

## Dette UX

- Empty states répétés sur fiches pilotes (Passport, creator, événements si seed oublié) — **sentiment de produit non lancé**.
- Fiche partenaire : contact désactivé, alerte carte ambre — **signaux d’inachevé** visibles par le citoyen.
- Feed : `partner_creator` rendu comme `OrganizationPostCard` générique — **pas de mise en avant** du creator content (`creator_content` meta peu exploitée en UI).
- Mobile : offres + scan OK ; **pas** de parcours creator / événements / QR tampon équivalent.
- Passport : distinction floue entre **tampon QR** (04A) et **scan validation offre** (scan existant) — risque confusion partenaire.

---

## Dette produit

- **Promesse vs réalité** : tickets 01–06C livrés en code, mais **pilotes non « habitables »** sans travail contenu + accès.
- **Deux vitesses** : admin/mobile pour offres ; web citoyen riche ; **web partenaire quasi absent**.
- **Creator = org** : le parcours « créateur local » du brief n’est pas un persona séparé — à clarifier dans la roadmap (Yurpass / tribus vs partner creator).
- **WEB-PARTNERS-07** : distribution éditoriale **prématurée** tant que la visibilité de base (données + parcours) n’est pas validée en recette.

---

## Dette technique

| Item | Impact |
|------|--------|
| `reims_partner_offers.py` référencé par tests mais **absent de `main`** | CI / recette offres incohérente ; catalogue vide. |
| `fetchPublicPartnerOffers` → `/api/v1/partners/offers` **non monté** | Appels catalogue public potentiellement 404. |
| Tests `test_partner_offers_api.py` vs router réel | Dette contrat API. |
| Seed events sans `FeedEventSyncService` | Incohérence agenda public / feed. |
| Pilotes sans coordonnées | Map inutilisable pour le cas d’usage principal. |
| Backend CI mypy/ruff baseline | Bruit sur futures PR (hors scope review mais bloque confiance merge). |
| Aucun `OrganizationMember` sur orgs signées seed | Bloque toute démo self-service partenaire. |

---

## Priorité P0

1. **Seed & données pilotes** : GPS, adresse, contacts, offres publiées pour les 4 noms, optionnel creator content publié + sync feed events au seed.
2. **Comptes partenaire recette** : membership OWNER par pilote + doc « comment se connecter ».
3. **UI minimale génération QR tampon** (web ou mobile) pour valider 04A bout-en-bout.
4. **Corriger le contrat catalogue offres** (route + seed + tests alignés).

---

## Priorité P1

1. **UI web partenaire** : créer / soumettre événement + creator content (réutiliser patterns mobile/admin offres).
2. **UI admin modération creator content** (approve/reject/archive — miroir offres).
3. **Sync feed événements pilotes** (seed ou à l’approval) pour cohérence agenda / feed.
4. **Enrichissement fiches** : images, horaires si prévus au modèle, CTA « Obtenir un tampon » côté citoyen quand QR disponible.

---

## Priorité P2

1. **WEB-PARTNERS-07** — distribution éditoriale (slots, quotas, curation), **sans pub sponsorisée**.
2. Narration « Réseau partenaires Reims » (page hub, copy Passport).
3. Parcours créateur indépendant (si produit distinct de 06).
4. Chore CI backend + doc recette unique « Partner Pilot Checklist ».

---

## Recommandation CTO

Le sprint a **sur-construit la stack** et **sous-livré l’expérience pilote**. Le risque principal n’est pas l’absence de ranking (07), c’est l’**absence de parcours complet vérifiable** avec Belga Queen, Pittaya, Centre des Ressources et Garçon Barbiers.

**Tableau pilotes (synthèse)**

| Partenaire | Slug | Statut seed | Fiche | Map | Offres seed | Events seed | Creator | Feed |
|------------|------|-------------|-------|-----|-------------|-------------|---------|------|
| Belga Queen | `belga-queen` | ACTIVE, featured | Partielle | Sans pin | Non | Oui | Non | Event non sync seed |
| Pittaya | `pittaya` | ACTIVE, featured | Partielle | Sans pin | Non | Oui | Non | Idem |
| Centre des Ressources | `centre-des-ressources` | ACTIVE | Partielle | Sans pin | Non | Oui | Non | Idem |
| Garçon Barbiers | `garcon-barbiers` | ACTIVE | Partielle | Sans pin | Non | Oui | Non | Idem |

---

## RECOMMANDATION

**B) Corriger les manques identifiés avant WEB-PARTNERS-07**

Motifs :

1. **07 ne résout pas** cartes vides, offres absentes, QR non générable, ou self-service invisible.
2. Un sprint « distribution » sur un feed **sans contenus partenaires réels** masquerait le problème de fond.
3. Les correctifs P0–P1 sont **bornés** (seed, memberships, 2–3 écrans, alignement API) vs un sprint 07 **plus ambigu** côté produit.

**Séquence suggérée :**

```text
REVIEW-01 (ce doc) → WEB-PARTNERS-08 « Pilot readiness » (seed + memberships + QR UI + offers seed)
                  → WEB-PARTNERS-09 « Partner self-service web » (events + creator + modération admin UI)
                  → puis WEB-PARTNERS-07 « Feed distribution » (éditorial uniquement)
```

**Critère de reprise 07 :** en recette, un citoyen voit au moins 2 pilotes avec offre + événement + (optionnel) creator dans le feed, et un partenaire pilote complète le parcours sans appeler l’API à la main.

---

*Document généré en phase PRODUCT REVIEW — aucun code, commit, migration ni feature implémentés.*
