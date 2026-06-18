# RF-02A — Audit offres partenaires Reims

| Champ | Valeur |
|-------|--------|
| **Ticket** | RF-02A |
| **Feature** | FEATURE-REALITY-FIX-V1 |
| **Date** | 2026-06-16 |
| **Scope** | Seed `reims_partner_offers.py` + modèle `PartnerOffer` |

---

## Synthèse

| Classification | Avant RF-02A | Après seed RF-02A |
|----------------|--------------|-------------------|
| **PLACEHOLDER** | 4 / 4 | 0 / 4 |
| **REAL** | 0 / 4 | 4 / 4 (si partenaires actifs + publiés) |

---

## État avant correctif

Toutes les offres pilotes partageaient le même pattern placeholder :

- Description : *« Présentez votre Passport Yunicity pour découvrir… »*
- Conditions : *« Offre pilote, modalités confirmées sur place. »*
- `value_label` vague (Avantage membre, Offre pilote, Découverte…)
- `offer_type` : `custom` pour toutes

| Partenaire | Titre | Classification |
|------------|-------|------------------|
| Belga Queen | Accueil Passport | **PLACEHOLDER** |
| Pittaya | Avantage Passport | **PLACEHOLDER** |
| Centre des Ressources | Accès découverte | **PARTIAL** (titre OK, contenu placeholder) |
| Garçon Barbiers | Avantage membre Yunicity | **PLACEHOLDER** |

**Impact RC-01 :** partenaires présents sur la carte, valeur Passport illisible en 5 secondes.

---

## État après correctif (seed RF-02A)

| Partenaire | Offre | Catégorie | Tier | Classification attendue |
|------------|-------|-----------|------|-------------------------|
| Belga Queen | Première bière artisanale offerte | `percent_discount` | basic | **REAL** |
| Pittaya | Entrée offerte | `free_item` | basic | **REAL** |
| Centre des Ressources | Accès atelier découverte | `exclusive_access` | silver | **REAL** |
| Garçon Barbiers | Coupe + soin barbe | `exclusive_access` | gold | **REAL** |

Chaque offre dispose désormais de :

- `value_label` explicite
- `description` concrète
- `conditions` opérationnelles
- `tier_code_required` pour Silver/Gold
- `metadata.value_category` pour le catalogue

---

## Champs techniques inventoriés

| Concept | Implémentation |
|---------|----------------|
| `PartnerOffer` | ORM `partner_offers` |
| `PartnerOfferPublic` | API publique + Passport |
| `OfferVisibility` | `Organization.visibility` + `PartnerOffer.status` + `is_active` |
| `OfferStatus` | `PartnerOfferStatus` (draft → published) |
| Readiness | `partner_offer_readiness()` — READY / PARTIAL / NOT_READY |
| Passport eligible | `is_passport_eligible` (sans spend YM) |

---

## Risques restants

1. **Validation terrain** — les commerces doivent confirmer les modalités (RF-02B ops).
2. **Deploy seed prod** — exécution idempotente `seed_reims_partner_offers` requise.
3. **Partenaires paused** — readiness `NOT_READY` si `partner_status` hors actif/premium/fondateur.
4. **RF-01A** — `is_passport_eligible` prépare le branchement YM, pas encore de débit wallet.

---

## Prochaine étape

**RF-02B** — validation partenaires terrain + deploy recette/prod.
