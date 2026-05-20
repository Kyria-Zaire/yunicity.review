# Intention UX — Quartiers (TICKET-603)

> **PRD :** `docs/prd/PRD-601-neighborhoods-territorial-identity.md`  
> **Backend :** TICKET-602 — catalogue éditorial, pas de réseau social quartier

## 1. Émotion recherchée

**Calme, curiosité douce, appartenance sans pression.**  
L’utilisateur doit sentir qu’il découvre des **morceaux de ville** avec une identité, pas qu’on le classe dans une tribu ou qu’on le pousse à « performer » localement.

## 2. Quartier comme ambiance

Un quartier = **nom + ambiance + texte court + image** — jamais un score, un rang ou un mur communautaire.  
L’ambiance (`calm`, `lively`, `cultural`…) est un **indice éditorial**, pas un label compétitif.

## 3. Exploration douce

- Liste limitée, cartes respirables, CTA « Découvrir » (pas « Rejoindre »).
- Détail quartier : sections finies (événements, lieux, offres, posts) — **pas** de scroll infini dédié.
- Pas de carousel agressif ni de « pour vous » algorithmique territorial.

## 4. Ville unifiée

- Navigation : quartiers **en plus** du fil ville-first, pas **à la place**.
- Fil par défaut inchangé ; badge quartier = **méta**, pas filtre implicite.
- Copy : « Reims » reste l’ancrage ; le quartier précise le coin.

## 5. Anti-tribalisation UX

| Refus | Alternative |
|-------|-------------|
| Trending / top quartier | Ordre éditorial (featured + nom) |
| Métriques agressives (posts/jour) | Comptages contexte admin-only ou absents en public |
| « Rejoindre le quartier » | « Découvrir » |
| Feed quartier autonome | Fiche quartier + retour fil / événements |
| Couleurs criardes par quartier | `accent_color` à peine visible |

## 6. Respiration éditoriale

- Blanc dominant, `#2A2FFF` / `yunicity-primary` pour liens et badges.
- Espacement Sprint-5 : cartes aérées, hero léger, pas de mur de texte.
- Skeletons sobres (pas de pulse agressif).

## 7. Rôle dans le feed

- `neighborhood_summary` : badge **petit**, sous ou à côté de la meta auteur, **cliquable** vers `/neighborhoods/{slug}`.
- Ne pas masquer le contenu ville ; ne pas forcer le quartier sur chaque carte.

## 8. Quartiers et mémoire locale

- Passport : pas de progression quartier dans ce ticket ; lien futur « quartiers croisés ».
- Le quartier **contextualise** tampons et moments sans gamification.

## 9. Cohérence Passport / events

- Même ton que événements (« moments locaux ») et Passport (souvenirs, pas scores).
- Événements : ligne territoriale `Quartier · Ville` quand disponible.
- Transitions : feed → quartier, event → quartier, sans rupture de ton.

## 10. Anti-patterns refusés

- Groupes / chat quartier, leaderboard, heatmap, stories geo, réputation quartier.
- Grille type casino mobile, feed TikTok territorial, emojis hype, copy « trending ».
