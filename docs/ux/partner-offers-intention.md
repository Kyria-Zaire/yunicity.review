# Partner Offers — intention UX stratégique (TICKET-305B)

Document de référence validé avant BUILD. Complète `docs/ai/ticket-305b-ux-intent.md` et `docs/ai/frontend-design-system.md`.

---

## 1. Intention UX

Le partenaire ne doit pas avoir l’impression de gérer une « promo ». Il doit ressentir qu’il **contribue à l’énergie de la ville**.

L’expérience doit donner :

- participation locale,
- visibilité,
- appartenance Yunicity,
- simplicité.

Le commerçant doit pouvoir **publier une offre en moins d’une minute, depuis son téléphone**, sans comprendre un système complexe.

**Promesse émotionnelle :** « Ton lieu fait partie de la vie locale. »

**Pas :** « Bienvenue dans votre dashboard partenaire. »

---

## 2. Structure écrans

### A. Hub — Mes offres

- Cartes offres simples
- Statut lisible (langage humain, pas technique)
- CTA « Créer une offre »
- **Empty state :** message chaleureux + CTA (pas de page blanche)

**Interdit :** tableaux, analytics, sidebar enterprise.

### B. Création

Flow vertical sur **un écran scrollable** :

Titre → Description → Type → Dates → Soumettre

**Interdit :** wizard multi-étapes complexe.

### C. Détail

Carte émotionnelle : statut, visibilité, organisation, message Yunicity.

Exemple publié : « Ton offre est visible dans Yunicity Reims. »

### D. État rejeté

**Pas :** ERREUR / REFUSÉ.

**Oui :** « Quelques ajustements sont nécessaires avant publication. » + raison claire + modifier + resubmit.

---

## 3. Références design (sensation, pas copie)

| Référence | Pour |
|----------|------|
| Airbnb | Simplicité création, cartes chaleureuses |
| Notion | Clarté, respiration, densité maîtrisée |
| Apple Wallet | Carte vivante, premium simple |
| Instagram | Fluidité mobile, publication rapide |
| BeReal | Authenticité, proximité, pas de corporate |

---

## 4. Anti-patterns évités

- Tableau admin dense (20 colonnes, filtres enterprise)
- Nested cards infinies
- KPI fake (« +247% engagement »)
- Terminologie technique visible (`pending_review`, `archived`, …)
- CRM froid (backoffice bootstrap violet)
- Paramètres hors MVP (coupons, segmentation, analytics, campaign builder)

---

## 5. Direction visuelle

- Sombre élégant (mobile) / pierre-ambre (web partenaire)
- Accents champagne/or
- Cartes respirantes, typo claire
- Motion légère : 150–200 ms, pas de gadget

---

## 6. Philosophie

Le partenaire publie une **opportunité locale**, pas une campagne marketing.

C’est ce qui différencie Yunicity des apps locales classiques.

---

## 7. Implémentation

| Surface | Routes |
|---------|--------|
| Mobile | `apps/mobile/app/(protected)/partner-offers/*` |
| Web partenaire | `apps/admin/app/(protected)/partner-offers/*` |
| Modération staff | `apps/admin/app/(protected)/passport-offers/*` |

Libellés canon : `PARTNER_OFFER_*` dans `@yunicity/utils` (`passport-labels.ts`).
