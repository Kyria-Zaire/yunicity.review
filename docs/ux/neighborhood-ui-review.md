# Revue UX — Quartiers UI Foundation (TICKET-603)

**Date :** 2026-05-20  
**Référence :** `docs/ux/neighborhood-ui-intent.md`, PRD-601, TICKET-602

## Cohérence émotionnelle

| Critère | Statut | Notes |
|---------|--------|-------|
| Ton calme et éditorial | OK | Cartes aérées, copy humaine, pas de hype |
| Blanc + `yunicity-primary` | OK | Pas de violet legacy ni gradients |
| Exploration douce | OK | CTA « Découvrir », listes finies sur fiche quartier |

## Anti-tribalisation respectée

| Interdit | Statut |
|----------|--------|
| Trending / leaderboard | OK — absent |
| Feed quartier autonome | OK — fil ville-first inchangé |
| Groupes / chat | OK — absent |
| Métriques agressives | OK — stats contexte non exposées en liste publique |
| Grille casino mobile | OK — FlatList cartes larges |

## Respirabilité feed

- Badge quartier **petit**, sous la meta auteur, cliquable.
- N’occulte pas le contenu ; pas de filtre quartier implicite.

## Équilibre quartiers / events / offers

- Fiche quartier : sections distinctes, empty states sobres.
- Événements : ligne `Quartier · Ville` quand `neighborhood_summary` ou `district` disponible.

## Risques UX restants

| Risque | Mitigation |
|--------|------------|
| Trop de badges si 100 % posts tagués | Garder rattachement optionnel côté contenu |
| 5 onglets mobile (charge tab bar) | Acceptable pilote Reims ; revue DECIDE si fatigue |
| Peu de contenu lié en seed | Lier progressivement org/events aux quartiers en QA |

## Verdict

**TICKET-603 prêt pour recette** — intention territoriale respectée : le quartier reste une **fenêtre sur la ville**, pas un mini-réseau social.
