# RF-02B — Validation terrain offres partenaires Reims

| Champ | Valeur |
|-------|--------|
| **Ticket** | RF-02B |
| **Feature** | FEATURE-REALITY-FIX-V1 |
| **Prérequis** | RF-02A mergé (`80e884a`, `f024dc3`) |
| **Date ouverture** | 2026-06-18 |
| **Owner ops** | _à assigner_ |
| **GO prod CTO** | **NON** — en attente validation terrain |

---

## Objectif

Confirmer que les **4 offres RF-02A** sont exploitables en conditions réelles (commerce, staff, citoyen) **avant** de les considérer comme carburant Passport.

**Hors scope RF-02B :** spend YM, wallet, RF-01A, modification du contenu seed sans accord partenaire, deploy prod automatique.

---

## Synthèse terrain (2026-06-18)

| # | Partenaire | Slug offre | Tier | Validation terrain | GO prod |
|---|------------|------------|------|-------------------|---------|
| 1 | Belga Queen | `belga-queen-premiere-biere` | Basic | **PENDING** | **NO-GO** |
| 2 | Pittaya | `pittaya-entree-offerte` | Basic | **PENDING** | **NO-GO** |
| 3 | Centre des Ressources | `centre-des-ressources-atelier-silver` | Silver | **PENDING** | **NO-GO** |
| 4 | Garçon Barbiers | `garcon-barbiers-coupe-soin-gold` | Gold | **PENDING** | **NO-GO** |

**Verdict global :** 0 / 4 **CONFIRMED** — deploy prod **interdit** jusqu’à GO CTO explicite.

---

## Fiches offres (contenu seed RF-02A — référence, non modifiable sans validation)

### 1 — Belga Queen

| Champ | Valeur |
|-------|--------|
| **Partenaire** | Belga Queen (`belga-queen`) |
| **Offre** | Première bière artisanale offerte |
| **Slug** | `belga-queen-premiere-biere` |
| **UUID offre** | `d6043000-0000-4000-8000-000000000001` |
| **Avantage exact (seed)** | `-15 % ou 1ère bière offerte` |
| **Description** | Bière artisanale belge à l'ouverture de la visite |
| **Conditions** | Passport Yunicity, 1 usage/personne ; hors happy hour et soirées privées |
| **Tier Passport requis** | Basic (aucun `tier_code_required`) |
| **Type / catégorie** | `discount` / `percent_discount` |
| **Statut validation terrain** | **PENDING** |
| **Contact / preuve** | _nom, email, date appel, PV signé ou mail_ |
| **Commentaire terrain** | _À compléter : choix définitif -15 % **ou** 1ère bière ? Les deux ne peuvent pas rester ambigus en caisse._ |
| **Décision go/no-go prod** | **NO-GO** |

---

### 2 — Pittaya

| Champ | Valeur |
|-------|--------|
| **Partenaire** | Pittaya (`pittaya`) |
| **Offre** | Entrée offerte |
| **Slug** | `pittaya-entree-offerte` |
| **UUID offre** | `d6043000-0000-4000-8000-000000000002` |
| **Avantage exact (seed)** | `Entrée au choix offerte` |
| **Description** | Entrée offerte pour les porteurs Passport |
| **Conditions** | Commande d'un plat principal, présentation Passport, midi et soir, 1×/personne |
| **Tier Passport requis** | Basic |
| **Type / catégorie** | `gift` / `free_item` |
| **Statut validation terrain** | **PENDING** |
| **Contact / preuve** | _à compléter_ |
| **Commentaire terrain** | _Valider liste entrées éligibles et plafond coût pour le restaurant._ |
| **Décision go/no-go prod** | **NO-GO** |

---

### 3 — Centre des Ressources

| Champ | Valeur |
|-------|--------|
| **Partenaire** | Centre des Ressources (`centre-des-ressources`) |
| **Offre** | Accès atelier découverte |
| **Slug** | `centre-des-ressources-atelier-silver` |
| **UUID offre** | `d6043000-0000-4000-8000-000000000003` |
| **Avantage exact (seed)** | `Accès Silver — atelier découverte` |
| **Description** | Atelier découverte des ressources locales |
| **Conditions** | Silver et Gold ; inscription sur place selon places disponibles |
| **Tier Passport requis** | **Silver** (Gold accepté via tier supérieur) |
| **Type / catégorie** | `event_access` / `exclusive_access` |
| **Statut validation terrain** | **PENDING** |
| **Contact / preuve** | _à compléter_ |
| **Commentaire terrain** | _Calendrier ateliers, capacité, contact accueil, procédure scan QR._ |
| **Décision go/no-go prod** | **NO-GO** |

---

### 4 — Garçon Barbiers

| Champ | Valeur |
|-------|--------|
| **Partenaire** | Garçon Barbiers (`garcon-barbiers`) |
| **Offre** | Coupe + soin barbe |
| **Slug** | `garcon-barbiers-coupe-soin-gold` |
| **UUID offre** | `d6043000-0000-4000-8000-000000000004` |
| **Avantage exact (seed)** | `Offre Gold — coupe & soin` |
| **Description** | Coupe et soin barbe pour ambassadeurs Passport Gold |
| **Conditions** | Sur rendez-vous, Passport Gold, 1 utilisation/trimestre/personne |
| **Tier Passport requis** | **Gold** |
| **Type / catégorie** | `vip` / `exclusive_access` |
| **Statut validation terrain** | **PENDING** |
| **Contact / preuve** | _à compléter_ |
| **Commentaire terrain** | _Confirmer créneaux RDV, durée soin inclus, politique no-show._ |
| **Décision go/no-go prod** | **NO-GO** |

---

## Statuts validation terrain

| Statut | Signification | Action |
|--------|---------------|--------|
| **PENDING** | Pas encore contacté ou réponse incomplète | Planifier contact |
| **CONFIRMED** | Commerce valide avantage + conditions + validité | Éligible GO prod (unitaire) |
| **REJECTED** | Refus ou incohérence bloquante | Retirer ou réécrire offre (hors RF-02B auto — ticket séparé) |

**Règle GO prod globale :** les 4 offres doivent être **CONFIRMED** + checklist opérationnelle complète + signature CTO.

---

## Checklist opérationnelle (par offre)

Cocher **par partenaire** après validation terrain.

| # | Critère | Belga Queen | Pittaya | Centre Ressources | Garçon Barbiers |
|---|---------|:-----------:|:-------:|:-----------------:|:---------------:|
| 1 | Commerce contacté | ☐ | ☐ | ☐ | ☐ |
| 2 | Avantage confirmé (identique ou ajustement validé) | ☐ | ☐ | ☐ | ☐ |
| 3 | Conditions confirmées (écrites, comprises en caisse) | ☐ | ☐ | ☐ | ☐ |
| 4 | Période de validité confirmée (`valid_from` / `valid_until`) | ☐ | ☐ | ☐ | ☐ |
| 5 | Visuel / logo partenaire OK (fiche publique) | ☐ | ☐ | ☐ | ☐ |
| 6 | QR Passport expliqué au responsable lieu | ☐ | ☐ | ☐ | ☐ |
| 7 | Offre visible côté **web** (catalogue / fiche partenaire) | ☐ | ☐ | ☐ | ☐ |
| 8 | Offre visible côté **admin** (`/passport-offers`, readiness) | ☐ | ☐ | ☐ | ☐ |
| 9 | Offre visible côté **portail partenaire** (checklist readiness) | ☐ | ☐ | ☐ | ☐ |

**Visibilité technique attendue (post-seed) :**

- Web public : `GET /api/v1/partner-offers?city=Reims`
- Fiche partenaire : `GET /api/v1/partners/{slug}/offers?city=Reims`
- Passport utilisateur : `GET /api/v1/passport/offers` (auth)
- Admin : `GET /api/v1/admin/partner-offers` (staff)
- Portail partenaire : `GET /api/v1/organizations/me/partner/offers` (membre org)

---

## Parcours validation recommandé

1. **Contact terrain** — script d'appel (5 min) : avantage, conditions, tier, validité, scan QR.
2. **Mise à jour statut** — passer la ligne à CONFIRMED ou REJECTED dans ce doc.
3. **Deploy recette** — voir `docs/qa/RF-02B-seed-deployment-checklist.md` (après ≥ 1 CONFIRMED ou batch complet selon décision ops).
4. **Vérification multi-surface** — API + admin + web + portail.
5. **GO CTO prod** — uniquement si 4× CONFIRMED + checklist complète.
6. **Deploy prod** — commande manuelle, jamais automatique.

---

## Escalade

| Situation | Action |
|-----------|--------|
| Partenaire refuse l'offre seed | Statut **REJECTED** ; ticket produit pour réécriture (hors auto-modif seed) |
| Avantage différent du seed | Noter l'écart ; **ne pas** modifier le seed sans validation CTO + partenaire |
| Partenaire `paused` | Readiness `NOT_READY` — résoudre statut partenaire avant deploy |
| Offre placeholder résiduelle en DB | Re-seed idempotent RF-02A ; vérifier slugs obsolètes (`*-accueil-passport`) |

---

## Références

- Audit RF-02A : `docs/qa/RF-02A-partner-offers-audit.md`
- Seed source : `backend/app/db/seeds/reims_partner_offers.py`
- Deploy : `docs/qa/RF-02B-seed-deployment-checklist.md`
- Roadmap : `docs/workflow/FEATURE-ROADMAP-POST-RC.md` (RF-02B)
