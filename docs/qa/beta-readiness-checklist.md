# Checklist beta readiness — Yunicity (TICKET-604)

Usage : **go / no-go** avant beta humaine hors équipe. Cocher sur **web desktop**, **web responsive** (< 1024px) et **Expo Android** sauf mention « web only » ou « admin only ».

Référence intention : `docs/qa/ticket-604-beta-readiness-intent.md`  
Script testeurs externes : `docs/qa/external-beta-test-script.md`

---

## Prérequis techniques

- [ ] `alembic upgrade head` sur l’environnement cible
- [ ] `python -m app.db.seeds` puis `python -m app.db.seeds --demo` (dev/recette uniquement)
- [ ] API + Postgres + Redis opérationnels
- [ ] Frontend : variables `.env` / `EXPO_PUBLIC_API_URL` pointent vers la bonne API
- [ ] CI verte : Backend (ruff, mypy, pytest) + Frontend (lint, typecheck, build web/mobile)

## Compte recette Reims

- [ ] Connexion `demo@yunicity.dev` / `DemoReims1!` (si seed `--demo`)
- [ ] Ville profil = Reims

---

## Checklist technique (smoke)

- [ ] Aucune erreur 500 sur auth, feed, passport, neighborhoods, events, notifications
- [ ] Pas de message d’erreur API brut côté UI (codes techniques visibles)
- [ ] Deeplinks notifications → bon écran
- [ ] Refresh token / logout sans état fantôme

---

## Checklist web (citoyen)

### Auth
- [ ] Inscription → redirection fil
- [ ] Connexion / déconnexion
- [ ] Erreur identifiants : message clair, retry possible
- [ ] Register / login responsive (mobile viewport)

### Fil
- [ ] Skeleton / chargement calme
- [ ] Mix posts + event + offer (pas saturé)
- [ ] Badge quartier discret, cliquable → fiche quartier
- [ ] Like, commentaire
- [ ] Empty / erreur + retry

### Passport
- [ ] Activation (tier néo-arrivant compréhensible)
- [ ] Tampons, offres, QR — hiérarchie respirable
- [ ] Pas d’aspect gaming (pas de leaderboard)

### Événements
- [ ] Liste + détail
- [ ] Ligne `Quartier · Reims` si contexte territorial
- [ ] Intérêt toggle
- [ ] Navigation → quartier cohérente

### Quartiers
- [ ] `/neighborhoods` — 6 quartiers Reims, cartes aérées
- [ ] Détail : sections finies, empty states sobres
- [ ] Pas trending / leaderboard / feed quartier infini
- [ ] Retour fil / event naturel

### Notifications
- [ ] Inbox, marquer lu, ton sobre
- [ ] Volume raisonnable en seed

---

## Checklist mobile (Expo)

- [ ] 5 onglets : navigation fluide, safe areas OK
- [ ] Fil, Passport, Events, Quartiers (FlatList quartiers)
- [ ] Détail quartier `/(protected)/neighborhoods/[slug]`
- [ ] Badge quartier sur fil
- [ ] Transitions feed → quartier, event → quartier
- [ ] Pull-to-refresh quartiers

---

## Checklist partenaire (smoke)

- [ ] Compte partenaire seed : hub offres
- [ ] Création / publication offre (si parcours activé)
- [ ] Offre flash visible fil (discrète)
- [ ] Scan / redemption admin (web admin) — smoke si dispo

---

## Checklist admin (smoke)

- [ ] Login admin
- [ ] Modération offres / organisations — pas de régression bloquante

---

## Checklist contenu (seed Reims)

- [ ] 6 quartiers crédibles (copy éditoriale)
- [ ] Posts démo avec badges quartier (centre, Boulingrin, Saint-Remi)
- [ ] 2 événements liés quartiers + orgs
- [ ] 1 offre flash liée centre-ville
- [ ] Impression « ville vivante » sans surcharge

---

## Critères go / no-go beta

| Verdict | Condition |
|---------|-----------|
| **GO** | Tous les items « Prérequis » + ≥ 90 % checklist web/mobile + aucun P0 ouvert |
| **GO avec réserves** | P1 documentés, contournement connu, date correction Sprint 7 |
| **NO-GO** | Auth/feed/passport cassé, erreurs runtime systématiques, quartiers fragmentants, CI rouge |

---

*Dernière mise à jour : TICKET-604 — Sprint 6.*
