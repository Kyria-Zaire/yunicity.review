# Search UI — Intent (FEATURE-B / TICKET-B.5)

> **Références :** [`docs/prd/PRD-B1-local-discovery-and-search-philosophy.md`](../prd/PRD-B1-local-discovery-and-search-philosophy.md) · [`docs/technical/search-technical-spec.md`](../technical/search-technical-spec.md)

## Intention produit

La recherche Yunicity est un **outil d’exploration intentionnelle**, pas un second fil addictif.

| Oui | Non |
|-----|-----|
| Trouver un événement, lieu, quartier, tribu | Trending, viral, FOMO |
| Résultats **groupés par type** | Flux mélangé infini |
| Debounce 300 ms, requête ≥ 2 caractères | Autocomplete agressive |
| « Voir plus » par section | Infinite scroll |
| Ville par défaut (profil) | Recherche mondiale |

## Surfaces

| Surface | Route | Entrée |
|---------|-------|--------|
| Web | `/search` | Nav « Recherche », rail feed |
| Mobile | `/(protected)/search` | Lien feed, profil |

## États UX

1. **Initial** — pas de requête valide : message calme, pas de résultats forcés.
2. **Chargement** — texte sobre, pas de skeleton agressif.
3. **Résultats** — sections fixes (événements, lieux, quartiers, offres, posts, tribus, personnes).
4. **Vide** — orientation vers autre mot ou type.
5. **Erreur** — retry explicite.

## Comportement « Voir plus »

- Mode **Tous** : max 8 par groupe ; « Voir plus » bascule sur le type concerné et charge la page suivante.
- Mode **type unique** : pagination 20, append local (pas de scroll infini automatique).

## Liens résultats

| Type | Web | Mobile |
|------|-----|--------|
| Événement | `/events/{id}` | `events/[id]` |
| Offre | `/passport` | Passport tab |
| Tribu | `/tribes/{slug}` | `tribes/[slug]` |
| Quartier | `/neighborhoods/{slug}` | `neighborhoods/[slug]` |
| Publication | — (pas de fiche publique) | — |
| Personne | `/profile/{username}` | — (MVP) |

## Hors scope B.5

Partage, suggestions trending, historique serveur, carte, filtres date/géo avancés.
