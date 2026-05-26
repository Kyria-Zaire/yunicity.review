# Web Home / Feed Redesign — Intent (WEB-HOME-01)

| Champ | Valeur |
|-------|--------|
| Ticket | WEB-HOME-01 |
| Sprint | WEB-FIRST PRODUCT HARDENING |
| Phase | BUILD |
| Statut | Implémenté (web uniquement) |
| Polish | WEB-HOME-01B — sidebar/rail sticky, calendrier, icônes, cards neutres |
| Responsive | WEB-HOME-01C — sidebar compacte md–xl (icônes), pleine xl+, rail lg+ |

---

## 1. Intention produit

Transformer le fil web Yunicity en **expérience locale mémorable** — structure mentale type X/Twitter (nav stable, feed central, contexte droit) **sans** copier l’esthétique ni les mécaniques addictives.

**Mantra :** blanc, local, humain, premium, territorial, `#2A2FFF`.

---

## 2. Structure 3 colonnes

| Colonne | Rôle |
|---------|------|
| **Gauche** | Nav primaire icônes + CTA « Publier un moment » + profil bas + liens secondaires (Lieux, Proposer) |
| **Centre** | Greeting ville, composer, CTA tribu discret, feed typé |
| **Droite** | Contexte local : météo mock, moments semaine, quartiers, privilège Passport, Passport, hashtags éditoriaux |

---

## 3. Données branchées (API existantes)

| Bloc | Endpoint |
|------|----------|
| Feed | `listFeed` (hook `useFeed`) |
| Profil / ville | `getProfileMe` |
| Moments semaine | `events.listEvents` + filtre 7 j |
| Quartiers | `neighborhoods.listNeighborhoods` |
| Offre highlight | `listPassportOffers` |
| Passport | `getPassportMe` |
| Tribu CTA | `tribes.listTribes` (featured) |

**Exclusions respectées :** pas d’API météo externe ; météo = `mockLocalWeather` dans `@yunicity/utils`.

---

## 4. Fichiers clés

| Fichier | Rôle |
|---------|------|
| `lib/layout/web-layout-config.ts` | Nav primaire / secondaire |
| `lib/layout/web-nav-icons.tsx` | Icônes SVG sobres |
| `components/layout/web-sidebar.tsx` | Sidebar redesign |
| `components/home/*` | Header, rail droit, tribu CTA |
| `hooks/use-feed-home-context.ts` | Agrégation données rail |
| `components/feed/feed-screen.tsx` | Composition home |
| `packages/utils/src/home-labels.ts` | Micro-copy |

---

## 5. Non-objectifs (ticket)

- Mobile, admin
- Trending, For You, websocket, dark mode
- Refactor backend lourd

---

## 6. Suite MEASURE

Valider en beta Reims : compréhension greeting, utilité rail droit, lisibilité cartes event/offer, fatigue nav réduite.

Voir `docs/measure/feed-density-review.md`.
