# TICKET-305B — Intention UX Partner Offers (gate BUILD)

## 1. Intention UX

**Idée directrice :** « Je publie une offre pour ma ville » — pas « je remplis un CRM ».

Le partenaire ouvre un hub léger : ses offres comme des cartes vivantes (titre, statut humain, ville), une action principale « Proposer une offre ». Le flux de création tient sur un écran mobile (titre → description → type → dates → soumettre). La modération Yunicity est expliquée avec bienveillance ; le rejet est une étape réparable, jamais un mur technique.

## 2. Émotion & anti-patterns

| Recherché | Évité |
|-----------|--------|
| Fierté locale, participation citoyenne | Dashboard SaaS froid |
| Confiance, clarté du statut | Jargon CRM / KPI vides |
| Simplicité tactile | Nested cards, gradients IA |
| Chaleur (tons pierre/ambre) | Couponing cheap, crypto UI |

**Références :** cartes type fiche commerce de quartier ; file d’attente modération type Linear (admin staff) ; formulaires courts type Notion mobile.

## 3. Structure écrans

### Partenaire (mobile + admin web `/partner-offers`)

| Écran | Contenu |
|-------|---------|
| Hub liste | Cartes offres, filtre statut optionnel, CTA créer, empty states |
| Création | Formulaire linéaire 5 champs + soumettre |
| Détail | Statut + micro-copy, stats simples (redemptions), édition si draft/rejected, bandeau rejet |

### Staff (`/passport-offers` — inchangé chemin, workflow 305A)

| Écran | Contenu |
|-------|---------|
| Liste | Table modération, filtres `pending_review` / `published` |
| Détail | Approuver / Rejeter (raison) / Archiver |

## 4. Composants

- `PartnerOfferStatusBadge` (web) / styles statut (mobile)
- Cartes offre partenaire (une carte = une offre)
- Bandeau rejet éditable
- Empty states : aucune offre, pas d’org vérifiée, pas de droits
- API : `PartnerOffersApi` + helpers accès org

## 5. États

| État | UX |
|------|-----|
| loading | Skeleton / indicateur discret |
| empty | Message encourageant + CTA |
| error | Message API français, retry |
| draft | Édition + « Soumettre à Yunicity » |
| pending_review | Lecture seule + « En attente de validation Yunicity » |
| published | « Visible dans la ville » + redemptions |
| rejected | Raison + modifier + resubmit |
| archived | Lecture seule, ton neutre |

## 6. Responsive

- **Mobile-first** : colonne unique, CTA sticky bas, touch 44px+
- **Admin web partenaire** : max-width ~640px centré, pas de sidebar analytics
- **Staff** : table desktop existante

## 7. Pourquoi ça renforce Yunicity

Relie l’organisation vérifiée au Passport citoyen : le partenaire voit le lien territoire ↔ offre ↔ validation humaine Yunicity, renforçant la confiance locale et l’autonomie sans outil enterprise.
