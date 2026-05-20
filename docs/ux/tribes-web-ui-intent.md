# Tribus — Intent UX Web (TICKET-A.3)

**Références :** PRD-A0, spec technique A.1, backend A.2  
**Surfaces :** `/tribes`, `/tribes/[slug]`, `/tribes/invitation`

## Philosophie

Les tribus sont des **cercles d’intérêt locaux**, pas des serveurs Discord ni des groupes Facebook.

| Oui | Non |
|-----|-----|
| Coordination légère | Channels, threads infinis |
| Mur confiné aux membres | Feed autonome addictif |
| Join/leave silencieux | Drama, FOMO, @everyone |
| Compteur discret | Leaderboard, trending |

## Séparation feed / tribu

- Le **fil local** (`/feed`) reste le cœur produit — lien visible depuis les pages tribu.
- Les publications tribu ne sont **jamais** mélangées au feed global (contrat API : `tribe_id IS NULL`).
- Badge mur : « Espace tribu » — contextuel, pas viral.

## Respiration sociale

- Cartes larges, peu d’informations par écran.
- Pas de « trending », « top », compteurs dopamine.
- Empty states calmes, sans emoji excessifs.
- Quitter : confirmation sobre, sans message public.

## Anti-discordification (UI)

Exclusions MVP respectées dans le code :

- Pas de WebSocket, live typing, vocaux.
- Pas de repost, quote, polls, hashtags.
- Pagination « charger plus » — pas de scroll infini agressif.
- Notifications tribu : hors scope UI (backend minimal invitation).

## Risques fatigue communautaire

| Risque | Mitigation UI |
|--------|----------------|
| Tribu devient 2ᵉ feed | Rappel fil local + nav « Fil local » prioritaire |
| Mur trop bruyant | Cooldown 60s côté API ; composer simple |
| Modération lourde | Actions owner/mod discrètes (exclure, retirer post) |
| Invitation spam | Lien unique, copy manuel, pas de broadcast |

## Routes

- `GET /tribes` → liste éditoriale publique
- `GET /tribes/{slug}` → fiche + mur si membre
- `POST join/leave` → actions calmes
- Invitation → `/tribes/invitation?token=`

## Suite

- A.4 Mobile UI
- A.2.1 Archive owner (`DELETE /tribes/{slug}`) si besoin produit
- Enrichissement noms membres (API) si affichage prénom requis
