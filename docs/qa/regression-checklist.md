# Checklist de régression — Sprint 5 (TICKET-506)

Usage : avant merge stabilisation, recette ou beta terrain. Cocher chaque scénario sur **web desktop**, **web mobile** (viewport étroit) et **Expo Android** lorsque applicable.

## Prérequis

- [ ] Migrations Alembic à jour (`alembic upgrade head`)
- [ ] Seeds : `python -m app.db.seeds` puis `python -m app.db.seeds --demo` (optionnel QA Reims)
- [ ] Compte démo : `demo@yunicity.dev` / `DemoReims1!` (si seed `--demo`)

## Auth & profil

- [ ] Inscription citoyen (ville Reims)
- [ ] Connexion / déconnexion
- [ ] Erreur identifiants : message clair, pas de fuite technique
- [ ] Profil : ville affichée, mise à jour ville

## Fil local

- [ ] Chargement fil (skeleton calme, pas de clignotement agressif)
- [ ] État vide : ton humain, sans surcharge visuelle
- [ ] Posts citoyens : lecture, scroll fluide
- [ ] Carte offre flash : badge discret, CTA lisible
- [ ] Carte événement : lien vers détail
- [ ] Like / unlike
- [ ] Commentaire : création et affichage
- [ ] Erreur réseau : retry si disponible

## Offres flash

- [ ] Offre visible dans le fil (rare, pas dominante)
- [ ] Timer / fin flash lisible sans urgence toxique
- [ ] Passport : liste offres ou empty state citoyen

## Événements locaux

- [ ] Liste événements filtrée par ville profil
- [ ] Détail événement : date, lieu, description
- [ ] Intérêt : toggle sauvegardé / retiré
- [ ] Rail / contexte : libellé ville cohérent (pas « Reims » figé si autre ville)
- [ ] Empty state événements

## Passport & tampons

- [ ] Activation passport (première fois)
- [ ] Carte passport : hiérarchie lisible, respiration
- [ ] Tampons territoriaux : section souvenirs, empty state
- [ ] Offres passport : empty state citoyen (micro-copy)
- [ ] Pas d’aspect « dashboard gaming » (pas de compteurs viraux)

## Notifications

- [ ] Inbox : chargement, empty state
- [ ] Tap notification → deeplink correct (fil / passport / événements)
- [ ] Marquer lu / tout marquer lu
- [ ] Ton sobre, pas manipulateur

## Partenaire (smoke)

- [ ] Hub offres partenaire (si compte partenaire seed)
- [ ] Scan / redemption (smoke, pas de régression)

## Responsive & shell

- [ ] Web desktop : rails contextuels, whitespace
- [ ] Web mobile : navigation, pas de débordement horizontal
- [ ] Mobile : safe areas, onglets, clavier formulaires
- [ ] Marque : blanc dominant, `#2A2FFF` / `yunicity-primary`, pas de violet legacy

## Qualité technique (CI locale)

- [ ] Backend : `uv run ruff check .`, `uv run mypy app`, `uv run pytest` (cibles feed, events, stamps, notifications)
- [ ] Frontend : `pnpm lint`, `pnpm typecheck`, `pnpm --filter web build`, `pnpm --filter mobile build`

## Notes de session

| Date | Testeur | Environnement | Résultat |
|------|---------|---------------|----------|
|      |         |               |          |
