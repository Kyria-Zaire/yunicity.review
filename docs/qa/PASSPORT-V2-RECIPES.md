# Passport V2 QA Recipes

**Feature** : FEATURE-PASSPORT-V2  
**Sprint** : PASSPORT-V2-S3.5 — Closure & Hardening  
**Ticket** : REC-04  
**Statut** : Référence officielle de validation citoyenne  
**Version doc** : 1.0 — 2026-06-12  
**Périmètre** : Web citoyen (`/passport`) — **aucun mock, aucun compte fictif inventé**

---

## 1. Objectif

Ce document permet à un développeur, un QA ou un futur collaborateur **sans connaissance préalable de Yunicity** de rejouer la recette Passport V2 et de valider l’expérience citoyenne livrée.

**Périmètre fonctionnel Passport V2 (citoyen) :**

| Domaine | Ce qui est validé |
|---------|-------------------|
| **Réputation** | Points historiques, palier affiché, carte réputation |
| **YuniMonnaie (YM)** | Solde wallet, crédit après claim |
| **Badges** | Badges obtenus, badges verrouillés visibles ; badges secrets **non exposés** |
| **Défis** | Actifs, complétés, partition API |
| **Claim** | Réclamation YM, feedback succès/erreur, idempotence |
| **Expérience citoyenne** | Hero contextuel, stats, états loading / erreur / activation / session expirée |

**Routes UI principales :**

- `/passport` — tableau de bord citoyen V2
- `/passport/stamp/claim` — tampon QR (hors scope détaillé ici, conservé)

**API citoyenne V2 (référence comportement réel) :**

| Méthode | Route |
|---------|-------|
| GET | `/api/v1/me/passport` |
| GET | `/api/v1/me/passport/badges` |
| GET | `/api/v1/me/passport/challenges` |
| POST | `/api/v1/me/passport/challenges/{code}/claim` |
| POST | `/api/v1/passport/activate` |

---

## 2. Prérequis

### Backend

```bash
# À la racine du monorepo
docker compose up --build -d
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.db.seeds
# Contenu QA Reims (citoyen démo + passport actif) — dev/recette uniquement
docker compose exec backend python -m app.db.seeds --demo
```

Vérifier :

```bash
curl http://localhost:8000/api/v1/health
curl http://localhost:8000/api/v1/ready
```

Backend attendu : **http://localhost:8000**

### Frontend

```bash
cd frontend
pnpm install
cp apps/web/.env.example apps/web/.env.local   # si absent
pnpm --filter web dev
```

Web attendu : **http://localhost:3000**

### Configuration obligatoire

Dans `frontend/apps/web/.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> **Important** : si l’URL pointe vers un autre port (ex. `8002`), l’activation ou le Passport V2 peuvent répondre `404 Not Found`. Après modification `.env.local`, faire un **hard refresh** (Ctrl+Shift+R) ou redémarrer le serveur dev.

### Catalogue Passport V2

Les seeds de base (`python -m app.db.seeds`) chargent notamment :

- Paliers passport (`passport_tiers`)
- Badges MVP (`passport_badges`) — dont badges **secret** non listés côté citoyen
- Défis MVP Reims (`passport_challenges`) — ex. `explorer_centre_ville`, `soutien_local_hebdo`, `sorties_remoises`, `premier_cercle`

---

## 3. Comptes QA recommandés

> Mots de passe documentés **uniquement** dans les seeds officiels (`reims_demo_content.py`). Ne jamais déployer ces comptes en preprod/prod.

### Utilisateur sans session

| | |
|---|---|
| **Objectif** | Valider auth, return URL (REC-01), garde `ProtectedRoute` |
| **Préparation** | Navigation privée / déconnecté / cookies supprimés |
| **Compte** | Aucun |

### Citoyen vierge (passport non activé)

| | |
|---|---|
| **Objectif** | Écran d’activation, premier parcours |
| **Option A** | S’inscrire via `/register` avec un email nouveau |
| **Option B** | `thomas@yunicity.dev` / `DemoReims1!Dev` (seed `--demo`, **sans** passport pré-créé) |

### Citoyen actif (passport activé, données limitées)

| | |
|---|---|
| **Objectif** | Hero, wallet, réputation, badges, défis (souvent vides ou partiels) |
| **Compte** | `demo@yunicity.dev` / `DemoReims1!Dev` |
| **Données seed** | Passport `REIMS-DEMO-0001`, `reputation_score=12`, pas de progression défis/YM garantie |

### Citoyen avec défi claimable

| | |
|---|---|
| **Objectif** | Bouton claim, succès, solde YM, double claim |
| **État requis** | Défi complété (`completed=true`, `reward_claimed=false`) — typiquement `explorer_centre_ville` (5 tampons) |
| **Préparation** | **Pas de fixture seed dédiée claimable en `--demo`.** |

**Pour obtenir un défi claimable en recette manuelle :**

1. Compte citoyen avec passport activé.
2. Accumuler la progression requise (ex. 5 tampons pour `explorer_centre_ville` via `/passport/stamp/claim?token=…` ou outillage partenaire/admin selon environnement).
3. Vérifier via API : `GET /api/v1/me/passport/challenges` → entrée dans `claimable`.

> Si la préparation est trop lourde : **créer des fixtures adaptées** (script seed ou commande dev documentée par l’équipe) en s’inspirant de `backend/tests/api/test_passport_me.py` (`_complete_explorer`).

---

## 4. Recette Session expirée

**Objectif** : valider REC-03 / hotfix auth — pas de crash sidebar, état dédié Passport.

### Étapes

1. Se connecter avec un compte valide.
2. Ouvrir **http://localhost:3000/passport** — le dashboard s’affiche.
3. Simuler une session invalide :
   - **Méthode A** : DevTools → Application → Cookies → supprimer `refresh_token`, puis déclencher une action API (ex. bouton « Réessayer », claim, ou navigation qui recharge le passport).
   - **Méthode B** : attendre l’expiration de l’access token (TTL ~15 min, voir `ACCESS_TOKEN_EXPIRE_MINUTES`) avec refresh impossible.
4. Observer l’écran Passport.

### Résultat attendu

- [ ] Écran **« Session expirée »** (`PassportSessionExpiredState`) — pas d’erreur brute non gérée.
- [ ] Message : *« Session expirée. Reconnectez-vous pour consulter votre Passport. »*
- [ ] Bouton **« Se reconnecter »** → `/login?next=%2Fpassport` (REC-01).
- [ ] Après reconnexion → retour sur `/passport`.
- [ ] Pas de `AuthError` non catché dans la console lié au sidebar (`WebSidebar` profile fetch).

---

## 5. Recette Passport inactif

**Objectif** : activation legacy `POST /api/v1/passport/activate` branchée UI.

### Étapes

1. Utiliser un **citoyen vierge** (§3 — inscription ou `thomas@yunicity.dev`).
2. Se connecter.
3. Naviguer vers **http://localhost:3000/passport**.
4. Lire l’écran d’activation.
5. Cliquer **« Activer mon Passport »** (libellé depuis `PASSPORT_ACTIVATE_CTA`).
6. Attendre la fin du chargement.

### Résultat attendu

- [ ] Écran activation avec titre/body (`PASSPORT_ACTIVATE_TITLE`, `PASSPORT_ACTIVATE_BODY`).
- [ ] Pas d’appel `/me/passport` affiché comme erreur fatale avant activation.
- [ ] Après activation : hero + sections V2 visibles.
- [ ] Second chargement : pas de ré-affichage de l’écran activation (passport déjà actif).
- [ ] Si backend V2 indisponible (404) : message explicite, pas un écran blanc.

---

## 6. Recette Citoyen vierge

**Compte** : nouvel inscrit ou `thomas@yunicity.dev` **après** activation passport (ou pendant activation selon cas).

### Étapes

1. Activer le passport si nécessaire (recette §5).
2. Parcourir `/passport` section par section.

### Points de contrôle

| Zone | Résultat attendu |
|------|------------------|
| **Hero** | Palier « Citoyen·ne » / basic, sous-titre contextuel, statut actif |
| **Wallet** | Solde YM à **0** (ou valeur réelle API, pas de mock) |
| **Réputation** | Points à **0** ou faibles ; carte lisible |
| **Stats grid** | Compteurs cohérents avec l’API (`badges`, `claimable_rewards`, etc.) |
| **Badges** | Empty state *« Aucun badge obtenu pour le moment »* ; badges verrouillés publics listés si catalogue seedé |
| **Défis** | Défis **actifs** listés (catalogue seedé) ; pas de claimable ; empty state global défis possible si catalogue vide |
| **Récompenses** | Si actifs > 0 et claimable = 0 : **pas** de bandeau *« Aucune récompense à récupérer »* (REC-02) |

---

## 7. Recette Citoyen actif

**Compte** : `demo@yunicity.dev` / `DemoReims1!Dev` (seed `--demo`).

### Étapes

1. Se connecter.
2. Ouvrir `/passport`.
3. Vérifier chaque bloc.

### Points de contrôle

| Zone | Résultat attendu |
|------|------------------|
| **Stats** | Grille alignée sur `overview.summary` |
| **Badges** | Section obtenus / à débloquer ; **aucun badge secret** visible |
| **Réputation** | Score cohérent API (seed démo : `reputation_score=12` sur entité passport) |
| **Progression défis** | Barres de progression sur défis actifs si `progress > 0` |
| **Hiérarchie** | Hero → stats → wallet/réputation → badges → défis |

---

## 8. Recette Claim récompense

**Prérequis** : compte avec au moins un défi dans `claimable` (§3).

### Étapes

1. Ouvrir `/passport`.
2. Section **« Récompenses à réclamer »** — identifier une carte claimable.
3. Cliquer le bouton claim (libellé `Réclamer {n} YM` si récompense > 0).
4. Observer l’état loading (`claimingCode` — bouton désactivé / chargement).
5. Attendre la réponse succès.
6. Noter le bandeau succès et le **nouveau solde wallet**.
7. Cliquer à nouveau claim sur le **même** défi (double claim).

### Résultat attendu

| Contrôle | Attendu |
|----------|---------|
| Bouton visible | Uniquement sur variant `claimable` |
| Loading | Feedback pendant l’appel `POST …/claim` |
| Succès | Bandeau vert + montant YM + option « Fermer » |
| Solde | Wallet rafraîchi après claim (`loadPassportData`) |
| Double claim | Erreur humanisée ou réponse idempotente — **pas** de double crédit |
| Wallet suspendu | Claim refusé (test API : `test_wallet_suspended_cannot_claim`) |

---

## 9. Mobile

**Viewport** : DevTools responsive ≤ 390px (iPhone) ou appareil réel.

### Vérifier

- [ ] Hero lisible sans scroll horizontal
- [ ] Scroll fluide sur toute la page
- [ ] CTA claim accessible (taille tactile, pas masqué)
- [ ] Cartes wallet / réputation empilées correctement
- [ ] Empty states et bandeaux erreur/succès lisibles

---

## 10. Desktop

**Viewport** : ≥ 1024px.

### Vérifier

- [ ] Hiérarchie visuelle : hero dominant, sections aérées
- [ ] Grille wallet + réputation en 2 colonnes (`lg:grid-cols-2`)
- [ ] Badges en grille `sm:grid-cols-2`
- [ ] Pas de dissonance récompenses / défis actifs (REC-02)

---

## 11. Régressions interdites

Ne **jamais** casser les comportements suivants lors d’une évolution Passport ou auth :

| # | Comportement | Référence |
|---|--------------|-----------|
| 1 | **Activation passport** | `POST /api/v1/passport/activate` + écran activation UI |
| 2 | **Auth return URL** | `/passport` non connecté → `/login?next=%2Fpassport` → retour post-login (REC-01) |
| 3 | **Session expirée** | État dédié + reconnect avec `next` |
| 4 | **Badges secrets** | `include_secret=False` côté API citoyen — jamais listés dans `/me/passport/badges` |
| 5 | **Claim idempotent** | Pas de double crédit YM sur re-claim |
| 6 | **Wallet refresh** | Solde mis à jour après claim sans rechargement manuel complet |
| 7 | **Partition défis** | `active` / `completed` / `claimable` mutuellement exclusifs |
| 8 | **Empty state récompenses** | Masqué si défis actifs présents (REC-02) |

---

## 12. Sign-off

### Checklist finale

| | Validé |
|---|--------|
| □ Backend OK (`health`, `ready`, seeds, API `/me/passport`) | |
| □ Frontend OK (`typecheck`, `build`, `.env.local`) | |
| □ UX OK (mobile + desktop, REC-02) | |
| □ Auth OK (return URL, session expirée) | |
| □ Passport OK (activation, claim, badges, défis) | |

**Nom du validateur :** ___________________________

**Date :** ___________________________

**Version validée :** commit `________` sur `main` — FEATURE-PASSPORT-V2

**Commentaires / écarts :**

```
```

---

## Limites connues

| Limite | Détail |
|--------|--------|
| Fixture claimable | Seed `--demo` ne garantit pas un défi claimable prêt à l’emploi |
| Réputation démo | Score legacy sur `passports.reputation_score` ; snapshot V2 peut différer selon hooks |
| Tampons QR | Parcours `/passport/stamp/claim` documenté séparément (WEB-PARTNERS) |
| Admin Passport Ops | Supervision opérateur : voir `docs/qa/QA-04-passport-ops-report.md` |
| Mobile natif | Ce document cible le **web** ; Expo non couvert ici |
| Access token | Stocké en mémoire (`MemoryTokenStorage`) — refresh via cookie HttpOnly |

---

## Historique livraison (contexte)

| Sprint | Contenu |
|--------|---------|
| S1 Foundation | Réputation, wallet YM, modèles |
| S2 Gamification | Badges, défis, claim service |
| S3 Citizen Experience | API 05A, UI 05B, UX 05C |
| S3.5 Hardening | REC-03 sidebar, REC-01 return URL, REC-02 empty state, REC-04 ce document |

---

*Document maintenu par l’équipe produit Yunicity. Toute modification des routes ou comportements citoyens doit mettre à jour ce fichier avant clôture de release.*
