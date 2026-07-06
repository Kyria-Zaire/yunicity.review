# Feed Density Review — SPRINT-UX-01

| Champ | Valeur |
|-------|--------|
| Section | §2 — Feed Density Review |
| Référence | [ux-hardening-audit.md](./ux-hardening-audit.md) |
| Web | `components/feed/*`, `feed-screen.tsx` |
| Mobile | `components/feed/feed-screen.tsx`, `feed-theme.ts` |

---

## 1. Objectif

Évaluer **rythme**, **respiration**, **densité émotionnelle** et **hiérarchie** du fil local — densifier **intelligemment**, pas ajouter du bruit.

---

## 2. Modèle de contenu feed

Types de posts (`FeedPost`) routés côté web via `feed-card.tsx` :

| Type | Composant web | Mobile |
|------|---------------|--------|
| `citizen` | `CitizenPostCard` | `FeedCardMobile` générique |
| `organization` | `OrganizationPostCard` | générique |
| `offer` | `OfferFeedCard` | branche offre (Flash, Passport) |
| `event` | `EventFeedCard` | **non traité** → générique |

**Écart critique :** les moments locaux dans le fil **perdent leur identité** sur mobile.

---

## 3. Rythme & espacement

### 3.1 Web

| Zone | Valeur | Effet |
|------|--------|-------|
| Liste | `space-y-8` | Respiration **forte** entre cartes |
| Carte shell | `p-6`, `rounded-2xl` | Confort lecture |
| Event/Offer header | `-m-6` full-bleed band | **Focal point** — bon |
| Largeur | `max-w-2xl` (`contentWidth="feed"`) | Lisibilité optimale desktop |

**Verdict rythme web :** calme, parfois **trop uniforme** entre post citoyen et post citoyen (même shell).

### 3.2 Mobile

| Zone | Valeur | Effet |
|------|--------|-------|
| Liste | `padding: 16`, separator `16` | Plus dense que web |
| Carte | `padding: 16`, `gap: 10` | Correct mobile |
| Header feed | Titre + sous-titre + actions | Zone haute avant premier post |

**Verdict mobile :** densité OK ; **manque de variation** entre types de cartes.

---

## 4. Densité émotionnelle

### 4.1 Ce qui fonctionne

- **Offre feed** (web) : badges Flash / Passport → économie locale tangible.
- **Event feed card** (web) : badge « Moment local », dates, lieu, quartier, CTA « Découvrir ce moment ».
- **NeighborhoodBadge** sur auteur : ancrage territorial discret.
- **Composer** : invitation à publier (engagement citoyen).

### 4.2 Ce qui manque

| Manque | Impact émotionnel |
|--------|-------------------|
| Posts event = posts génériques (mobile) | Ville ne « pulse » pas dans le fil |
| Peu de variation typographique citoyen vs lieu | Lecture monotone |
| Empty state neutre | Pas de « ta ville t’attend » |
| Pas de repère temporel fort (Aujourd’hui / Ce week-end) | Moins d’urgence douce |

### 4.3 Comparaison cible (non-TikTok)

| Plateforme | Densité | Yunicity cible |
|------------|---------|----------------|
| TikTok | 1 post = plein écran, swipe | Non |
| Facebook | Mix bruit + réactions | Non |
| Newsletter locale | 1 sujet = 1 bloc aéré | **Oui** — event/offer = « éditions » |

---

## 5. Répétition & hiérarchie visuelle

### 5.1 Uniformité

Toutes les cartes citoyennes partagent :

- `FeedAuthorHeader` (avatar, ville, date)
- Body texte
- Footer : J’aime, Commentaires, Signaler

**Risque :** l’œil ne distingue pas **moment** vs **avis** vs **photo quartier**.

### 5.2 Focal points recommandés

| Type | Focal point |
|------|-------------|
| Event | Bandeau date + lieu en tête (déjà web) |
| Offer | Badge Passport + validité |
| Org | Badge « Lieu partenaire » |
| Citizen | Photo/media si présent, sinon citation courte |

### 5.3 Endroits trop vides

| Contexte | Observation |
|----------|-------------|
| Fil vide initial | `feed-empty-state` web — dashed large ; OK mais froid |
| Fil avec 1–2 posts | Beaucoup de blanc sous header |
| Mobile loading | Spinner plein écran — sensation « app vide » |

### 5.4 Endroits trop denses (futur)

| Risque | Mitigation |
|--------|------------|
| Commentaires inline mobile | Fatigue scroll si threads longs |
| Multi-offres flash même jour | Déjà géré par séparation cartes |

---

## 6. Rail contextuel web (`feed-context-rail`)

Liens : Mon profil, Rechercher à {ville}, Mon Passport, Proposer un lieu.

| Force | Faiblesse |
|-------|-----------|
| Rappelle ville | 4 liens = compétition avec nav globale |
| Ancrage Passport | Proposer lieu redondant nav |

**Recommandation P2 :** rail dynamique — sur Fil, montrer **Recherche + Passport** ; masquer Proposer lieu si déjà dans nav tier C.

---

## 7. CTAs & interactions

| CTA | Clarté | Note |
|-----|--------|------|
| J’aime / Aimé | OK | Pas surcharger compteurs |
| Commentaires | OK | |
| Charger plus | OK | |
| Voir Passport (offre mobile) | Bon | |
| Découvrir ce moment (web event) | Bon | Absent mobile |

---

## 8. Recommandations hardening (feed)

| ID | Action | Priorité | Effort |
|----|--------|----------|--------|
| F1 | Mobile : branche `event` → carte dédiée (parité `EventFeedCard`) | P0 | S |
| F2 | Séparateur ou bandeau couleur subtle `#2A2FFF` 4px top event/offer | P1 | S |
| F3 | Groupement optionnel « Ce week-end » si API fournit fenêtre dates | P2 | M |
| F4 | Empty state copy locale Reims + 1 CTA « Explorer les moments » → `/events` | P1 | S |
| F5 | Réduire header feed mobile (titre + 1 ligne, recherche icône) | P1 | S |
| F6 | Skeleton web : différencier hauteur event vs citizen | P2 | S |

**Non recommandé :** stories, reels, auto-play vidéo, infinite scroll sans « Charger plus ».

---

## 9. Critères succès MEASURE

| Signal beta | Seuil qualitatif |
|-------------|------------------|
| Utilisateur identifie un « moment » dans le fil | ≥ 4/5 sessions |
| Temps avant premier scroll | < 3s compréhension header |
| « Tout se ressemble » (verbatim) | < 2/10 users |

---

## 10. Fichiers impactés (futur BUILD)

| Fichier | Changement attendu |
|---------|-------------------|
| `mobile/.../feed-screen.tsx` | Branche event |
| `web/.../feed-card.tsx` | Déjà OK |
| `packages/utils/feed-labels.ts` | Copy empty / CTA |
| `web/.../feed-empty-state.tsx` | Ton local |

---

*Voir : [event-detail-review.md](./event-detail-review.md), [beta-observation-script.md](./beta-observation-script.md)*
