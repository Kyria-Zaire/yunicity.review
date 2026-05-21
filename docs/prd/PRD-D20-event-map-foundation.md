# PRD-D20 — Event Map Foundation

> **Phase :** DISCOVER → DESIGN  
> **Ticket :** FEATURE-D / D.2.0  
> **Workflow :** `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` — **BMAD :** `docs/bmad/BMAD.md`  
> **Ce document ne déclenche aucun code** — fondation produit et philosophie de la carte événementielle **avant tout BUILD**.

---

## 0. Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | PRD-D20 |
| **Nom** | Event Map Foundation |
| **Statut** | **DESIGN_READY** (DISCOVER + DESIGN pour D.2.0) |
| **Phase officielle** | DISCOVER → DESIGN |
| **Phase BMAD** | — (BUILD = tickets FEATURE-D dérivés) |
| **Sprint / programme** | FEATURE-D — EVENT MAP |
| **Priorité** | **P1** (pilote beta Reims — découverte spatiale complémentaire au feed et à la recherche) |
| **Rôles** | territorial-ux-designer, map-product-architect, calm-ux-designer |
| **Date création** | 2026-05-19 |
| **Dernière mise à jour** | 2026-05-19 |
| **Environnement cible** | dev → recette (pilote Reims) → preprod → prod |
| **Spec technique aval** | [`docs/technical/event-map-technical-spec.md`](../technical/event-map-technical-spec.md) |

### Dépendances amont (acquis Yunicity)

| Acquis | Référence | Rôle sur la carte |
|--------|-----------|-------------------|
| Événements locaux | TICKET-505, `local_events` | **Contenu principal** — titre, dates, lieu, lat/lng optionnels |
| Quartiers éditoriaux | PRD-601, TICKET-602–604 | Contexte territorial sur popup (nom quartier, pas géofence) |
| Organizations (lieux) | PRD-201 | Lieu hôte événement ; couche partenaire **optionnelle** post-MVP |
| Recherche territoriale | FEATURE-B (B.1–B.5) | Complémentaire — recherche = intention textuelle ; carte = exploration spatiale douce |
| Feed local | TICKET-402 | Cœur produit — la carte **ne remplace pas** le fil |
| Navigation locale | WebAppShell, Expo tabs | Entrée **secondaire** — pas d’onglet carte principal |
| Philosophie slow local | PRD-B1, beta readiness | Doctrine calme, anti-FOMO, anti-surveillance |

### Tickets aval (indicatif — hors scope D.2.0)

| Domaine | Objectif prévu |
|---------|----------------|
| D.2.1+ | Spec technique validée CTO (ce ticket produit la spec) |
| D.3+ | Backend `GET /api/v1/map/events` + index spatial |
| D.4+ | UI carte web (`/map` ou `/events/map`) |
| D.5+ | UI carte mobile (écran stack) |
| D.6+ | MEASURE — consultation fiche depuis carte, secteurs vides |

### Interdictions absolues (ce ticket)

| Interdit | Note |
|----------|------|
| Code, migrations, endpoints implémentés | BUILD uniquement |
| Composants Mapbox, clés en prod | Hors D.2.0 |
| Présence utilisateurs, heatmaps, live activity | §2, §11 |
| Notifications liées à la carte | §2 |
| Snapchat Map / radar social | §2, §12 |

---

# Question centrale

> **« Comment rendre la ville tangible et les moments locaux visibles sur une carte, sans transformer Yunicity en radar social ni en surface addictive ? »**

| Tension | Réponse philosophique |
|---------|----------------------|
| **Découverte** | La carte **contextualise** les événements déjà publics — elle ne crée pas une couche sociale parallèle |
| **Territoire** | Vue **ville-first** (Reims pilote) ; exploration limitée à la bbox visible — pas le monde entier |
| **Émotion** | Curiosité saine (« qu’est-ce qui se passe ce week-end ici ? ») — pas urgence artificielle |
| **Calme** | Marqueurs sobres, pas d’animation dopamine ; carte respirable même vide |

**Mantra Feature D :** *« Voir sa ville, pas surveiller ses voisins. »*

---

# Section 1 — Vision produit : « Voir sa ville »

## 1.1 Ce que signifie « voir sa ville » dans Yunicity

**Voir sa ville**, c’est :

- **Rendre le territoire tangible** : la ville n’est plus une liste abstraite — elle a une forme, des quartiers, des points de vie.
- **Faciliter la découverte locale** : repérer un concert, une brocante, une rencontre à deux pas sans parcourir dix écrans.
- **Contextualiser les moments réels** : un événement existe dans le **temps** (date) et l’**espace** (lieu) — la carte unit ces deux dimensions.
- **Encourager l’exploration douce** : déplacer la carte, zoomer sur un secteur — pas de boucle infinie ni de « live now » anxiogène.
- **Créer de la curiosité saine** : « Il se passe quelque chose près de la cathédrale samedi » — pas « 47 personnes sont ici maintenant ».

| La carte Yunicity est | La carte Yunicity n’est pas |
|----------------------|----------------------------|
| Un **plan éditorial** des moments publics | Un **heatmap** d’activité sociale |
| Une **aide à l’orientation** locale | Un **GPS de présence** des citoyens |
| Un **complément** au fil et à la recherche | Un **second feed** géolocalisé infini |
| **Stable et lisible** | Pulsante, gamifiée, addictive |

## 1.2 Alignement doctrine produit

Yunicity possède déjà : fil local, événements liste, recherche groupée, quartiers, tribus, Passport. La Feature D **matérialise l’espace** pour les **événements géolocalisés** — sans fusionner les autres entités en une carte fourre-tout MVP.

## 1.3 Relation aux autres surfaces

| Surface | Rôle | Carte |
|---------|------|-------|
| **Feed** | Mémoire et vie quotidienne ville | Lien discret « Voir sur la carte » depuis fiche event (BUILD aval) |
| **Liste `/events`** | Parcours temporel (dates) | Complément spatial |
| **Recherche** | Intent textuelle | Pas de doublon — recherche ne remplace pas bbox |
| **Fiche event** | Détail, intérêt, partage (B.2) | CTA popup « Voir détail » |

---

# Section 2 — Philosophie UX

## 2.1 Principes carte calme

| Principe | Application |
|----------|-------------|
| **Calme** | Pas de son, pas de vibration, pas d’alerte carte |
| **Respirable** | Marges, fond carte discret (style éditorial Yunicity), peu de chrome |
| **Éditoriale** | Marqueurs alignés design system ; typographie lisible sur popup |
| **Lisible** | Contraste suffisant ; labels courts ; max ~100 points visibles |
| **Stable** | Marqueurs fixes ; pas de rebond, pulse, cluster animé |

## 2.2 Interdictions UX explicites

| # | Interdit | Raison |
|---|----------|--------|
| 1 | Pulsations / marqueurs rebondissants | Dopamine, distraction |
| 2 | Heatmaps densité | Lecture « buzz » anxiogène |
| 3 | Live activity (« actif maintenant ») | FOMO temps réel |
| 4 | Clustering agressif style Uber | Surcharge cognitive ; masque le calme |
| 5 | Notifications push liées à la carte | Pas de « quelqu’un est près de vous » |
| 6 | Exploration infinie monde | Hors territoire pilote |
| 7 | Présence temps réel utilisateurs | Surveillance sociale |
| 8 | Clone Snapchat Map | Refus produit |
| 9 | Compteurs sociaux sur marqueurs (« 12 intéressés ») | Engagement bait |
| 10 | Autoplay / vidéo sur carte | Hors scope |
| 11 | Sponsored pins sans label | Confiance |
| 12 | Géolocalisation user obligatoire | Carte utilisable avec ville profil seule |

## 2.3 Grammaire visuelle (BUILD — rappel design)

- **Marqueurs** : petits, ronds ou pin minimal, couleur accent Yunicity, pas d’ombre portée animée.
- **Carte base** : style Mapbox sobre (rue claire ou custom léger) — pas satellite militaire par défaut.
- **Popup** : carte blanche arrondie, pas de carousel.

---

# Section 3 — Périmètre MVP

## 3.1 INCLUS

| Élément | Règle |
|---------|-------|
| **Événements publiés** | `moderation_status = approved`, `visibility = public`, `is_cancelled = false` |
| **Non expirés** | `starts_at >= now()` (aligné `list_public_for_city`) ; événements passés **absents** |
| **Géolocalisés uniquement** | `latitude` ET `longitude` non NULL — sinon **exclus** de la carte (restent en liste/recherche) |
| **Ville** | Filtre `city` obligatoire ou résolu profil (Reims pilote) |
| **Bbox** | Chargement selon viewport visible |
| **Limite** | 100 points max par requête |

## 3.2 OPTIONNEL (post-MVP ou flag — non bloquant D.2.0)

| Couche | Condition | Note |
|--------|-----------|------|
| Lieux partenaires (organizations vérifiées) | Coordonnées approximatives staff | Pins distincts, pas mélangés events sans distinction visuelle |
| Offres flash localisées | `latitude`/`longitude` sur offre ou org | Badge discret ; pas d’urgence visuelle carte |

## 3.3 EXCLUSIONS strictes

| Exclusion | Raison |
|-----------|--------|
| Utilisateurs / avatars sur carte | Vie privée |
| Tribus live / membres | Pas radar social |
| Présence sociale (« amis ici ») | Surveillance |
| Tracking comportement carte granulaire | Privacy — agrégats anonymes MEASURE seulement |
| Score popularité / trending géo | Anti-FOMO |
| Posts feed sur carte | Bruit ; hors intent spatial MVP |
| Mur tribu | Invariant FEATURE-A |
| Événements sans coords | Liste seulement |
| Événements non approuvés / privés | Permissions |

---

# Section 4 — Comportement carte

## 4.1 Contexte initial

| Paramètre | Valeur MVP |
|-----------|------------|
| **Ville par défaut** | `profile.city` si renseignée, sinon `Reims` |
| **Centre initial** | Centroïde ville pilote (config statique Reims) ou premier event — spec technique |
| **Zoom initial** | **~12** (quartier / centre-ville lisible) |
| **Recentrage** | Bouton « Revenir à {ville} » — recentre + zoom 12 |

## 4.2 Interaction

| Action | Comportement |
|--------|--------------|
| **Pan / zoom manuel** | Libre dans limites bbox max (spec — anti-monde entier) |
| **Tap marqueur** | Ouvre popup événement (pas navigation directe sans confirmation) |
| **CTA popup** | « Voir détail » → fiche `/events/{id}` |
| **Chargement données** | À chaque bbox stable (debounce 300 ms après fin de mouvement) |
| **Pull refresh mobile** | Optionnel — recharge bbox courante |

## 4.3 Limites territoriales

- Pas d’exploration **hors ville** sans changement explicite de ville (hors MVP multi-ville auto).
- Bbox trop grande → serveur tronque à 100 + message calme côté client si besoin.
- Bbox invalide (min > max, hors bornes lat/lon) → 422.

## 4.4 Pas d’exploration infinie

La carte reste **ancrée** : une ville, un regard, des moments — pas un globe Google Earth social.

---

# Section 5 — Marqueurs & popups

## 5.1 Marqueurs événement

| Attribut | Spécification |
|----------|---------------|
| Taille | Petit (8–12 px logique ; touch target 44 px zone pressable) |
| Forme | Pin minimal ou cercle plein accent |
| Couleur | Token `--yunicity-primary` / accent mobile |
| Animation | **Aucune** en MVP |
| État sélectionné | Bordure ou scale statique 1.1 max — pas de bounce |

## 5.2 Popup événement (callout)

| Champ affiché | Source |
|---------------|--------|
| Titre | `title` |
| Date | `starts_at` (+ `ends_at` si présent) — format humain FR |
| Quartier / ville | `neighborhood.display_name` ou `district` + `city` |
| Description courte | `description` tronquée ~120 caractères |
| CTA | « Voir détail » |

**Non affiché :** nombre d’intéressés, vues, trending, organisateur social graph.

## 5.3 Légende (optionnelle MVP)

Texte discret sous la carte : « Chaque point = un événement public à venir. »

---

# Section 6 — États vides & erreurs

## 6.1 Matrice états

| État | Message type (FR) | Comportement |
|------|-------------------|--------------|
| **Initial / chargement** | « Chargement de la carte… » | Spinner discret ; carte visible |
| **Aucun événement ville** | « Aucun événement à venir avec lieu sur la carte pour {ville}. » | Carte ville visible ; pas de marqueurs |
| **Secteur vide (bbox)** | « Aucun événement ce soir dans ce secteur. » | Calme — inviter zoom arrière ou autre quartier |
| **Erreur réseau** | « Impossible de charger la carte. » + **Réessayer** | Garde dernière bbox en cache client optionnel |
| **Géolocalisation refusée** | Pas bloquant — « La carte utilise votre ville de profil ({ville}). » | Pas de demande répétée agressive |
| **Token Mapbox manquant (dev)** | Message technique staff only | Fail graceful admin |

## 6.2 Principe : calme même vide

La carte **ne doit pas punir** l’utilisateur : fond carte + message éditorial > écran blanc ou illustration criarde.

---

# Section 7 — Entrées produit & navigation

## 7.1 Web

| Entrée | Priorité |
|--------|----------|
| Lien nav secondaire « Carte » ou sous-menu Événements | Discrète — pas avant Fil |
| Lien depuis `/events` | « Voir sur la carte » |
| Rail feed (optionnel BUILD) | Lien contextuel ville |

Route cible indicative : `/events/map` ou `/map` — décision BUILD D.4.

## 7.2 Mobile

| Entrée | Priorité |
|--------|----------|
| Header feed ou écran events | Lien texte « Carte » |
| Profil (lien discret) | Optionnel — même pattern recherche B.5 |
| **Pas** d’onglet tab bar dédié | Tab bar déjà dense (feed, passport, orgs, profile) |

Écran stack `/(protected)/events/map` — retour explicite.

## 7.3 Mobile — carte non fullscreen permanente

- Header contexte : titre « Carte des événements », sous-titre ville.
- Carte ~60–70 % hauteur écran ; bandeau info / liste courte optionnelle sous la carte (BUILD).
- Gestes : scroll page si contenu sous carte ; pas de conflit pan carte / scroll parent (spec technique).

---

# Section 8 — Stories utilisateur (MVP)

| ID | En tant que | Je veux | Afin de |
|----|-------------|---------|---------|
| S1 | Citoyen à Reims | voir les événements à venir sur une carte de ma ville | choisir une sortie selon le lieu |
| S2 | Citoyen | déplacer la carte et voir les événements d’un secteur | explorer un quartier sans liste infinie |
| S3 | Citoyen | ouvrir le détail d’un événement depuis un marqueur | passer à l’action (intérêt, partage futur) |
| S4 | Citoyen sans GPS | utiliser la carte avec ma ville de profil | ne pas exposer ma position |
| S5 | Staff | — | hors carte citoyenne ; modération reste admin |

---

# Section 9 — Risques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **Surcharge visuelle** | Moyenne | Abandon | Limite 100, marqueurs petits, pas de cluster MVP |
| **Anxiété sociale** | Faible | Confiance | Pas de présence user |
| **FOMO géographique** | Moyenne | Stress | Pas de « live », pas de heatmap |
| **Densité événements Reims** | Faible (pilote) | Carte vide | Messages secteur vide calmes |
| **Fatigue carte mobile** | Moyenne | UX | Surface secondaire, pas fullscreen permanent |
| **Dérive Snapchat Map** | Moyenne | Réputation | Checklist §2 + review CTO |
| **Confusion liste vs carte** | Moyenne | Produit | Entrées croisées, rôles clairs §1.3 |
| **Événements sans coords** | Haute (données) | Frustration | Message liste : « Ajoutez un lieu sur la carte » côté org (futur) |
| **Coût Mapbox** | Moyenne | Ops | Bbox + debounce ; pas de polling |
| **Bbox abuse** | Faible | Perf | Rate limit + validation (spec) |

---

# Section 10 — Futur (documenté, non MVP)

| Capacité | Valeur | Garde-fou |
|----------|--------|-----------|
| Clusters légers | Lisibilité forte densité | Statiques, pas animés |
| Filtres temporels (« ce week-end », « ce soir ») | Intent | Pas default anxieux |
| Couche partenaires / offres | Utilité Passport | Label distinct |
| Audio walks / parcours urbains | Culture | Hors gamification |
| Carte quartier (polygone éditorial) | Contexte PRD-601 | Pas géofence membership |
| Découverte IA locale | Synthèse sorties | Transparente, désactivable |
| PostGIS polygones quartiers | Requêtes secteur | Pas tracking user |

Aucun item sans nouveau PRD + gates §13.

---

# Section 11 — KPIs sains (MEASURE aval)

| KPI | Mesure | Anti-KPI |
|-----|--------|----------|
| **Clic marqueur → fiche event** | Conversion | Marqueurs cliqués sans suite |
| **Temps sur carte** | Session médiane | Temps excessif sans action |
| **Recentrage ville** | Usage bouton | Boucle pan monde |
| **Erreurs bbox / 5xx** | Technique | — |
| **Signalements « carte stressante »** | Support | — |

**Succès Feature D :** plus de **fiches événements consultées après exploration spatiale** — pas plus de **temps passé à zoomer sans action**.

---

# Section 12 — Plan de rollout indicatif

| Phase | Ticket | Contenu |
|-------|--------|---------|
| **0 — D.2.0** | Ce PRD + spec technique | DISCOVER + DESIGN |
| **1 — Backend** | D.3 | `GET /map/events`, index lat/lng, tests bbox |
| **2 — Web** | D.4 | Page carte Mapbox GL |
| **3 — Mobile** | D.5 | `@rnmapbox/maps`, écran stack |
| **4 — Polish** | D.6 | Liens feed/events, empty states, MEASURE |

**Pilote :** Reims — centroïde et zoom 12 calibrés sur la ville.

---

# Section 13 — Test plan (validation BUILD)

| # | Cas | Attendu |
|---|-----|---------|
| T1 | Bbox valide Reims | ≤ 100 events, coords présentes |
| T2 | Bbox sans résultat | 200 + `items: []` ; UI message secteur vide |
| T3 | Event sans lat/lng | Absent carte ; présent liste |
| T4 | Event passé (`starts_at < now`) | Absent carte |
| T5 | Event non approuvé | Absent carte |
| T6 | Bbox invalide | 422 |
| T7 | Debounce client | Pas de rafale requêtes au pan |
| T8 | Recentrage ville | Centre Reims, zoom 12 |
| T9 | Mobile retour | Navigation stack OK |
| T10 | Pas de géoloc user | Carte fonctionne ville profil |
| T11 | Rate limit | 429 message calme |
| T12 | Permissions Mapbox refusées (mobile) | Message + carte ville par défaut |

---

# Section 14 — Conclusion

## 14.1 Vision Yunicity de la découverte spatiale

Yunicity aide les gens à **ressentir leur ville** — à voir que des moments réels occupent l’espace public, sans les enfermer dans une **surveillance sociale permanente**. La carte événementielle est un **plan calme des sorties à venir**, aligné sur le fil et la recherche : **territorial**, **émotionnel**, **respirable**.

## 14.2 Pourquoi Feature D renforce le produit

- **Matérialise** ce que la liste et la recherche décrivent en texte.
- **Respecte** la doctrine slow local et les exclusions PRD-B1.
- **Refuse** la logique radar / heatmap / présence live.

## 14.3 Condition de succès

> La Feature D réussit si les gens **découvrent un événement qu’ils n’auraient pas vu en liste** et **consultent sa fiche** — pas s’ils **scrutent la carte comme un réseau social géolocalisé**.

## 14.4 Prochaine étape

| Livrable | Statut |
|----------|--------|
| [`docs/technical/event-map-technical-spec.md`](../technical/event-map-technical-spec.md) | Produire avec D.2.0 |
| Validation CTO | Avant BUILD D.3 |
| Gates PRD §13 | Cocher au premier ticket code |

---

# Section 15 — BMAD gates (BUILD futur)

> Ne pas cocher avant ticket BUILD.

- [ ] PRD validé (sections 1–6 complètes)
- [ ] Architecture identifiée (spec technique §7–9)
- [ ] Risques identifiés (§9)
- [ ] Permissions / authZ définies (spec §8)
- [ ] Endpoints + contrats définis (spec §8)
- [ ] Modèle DB / index planifiés (spec §6 — lat/lng existants, index bbox)
- [ ] Clés Mapbox & env documentés (spec §7)
- [ ] Review sécurité privacy (spec §10)

---

## Annexes

### Liens

- Événements existants : `GET /api/v1/events`
- Recherche : `GET /api/v1/search` (group `events`)
- Quartiers : PRD-601
- Intent UX recherche : `docs/ux/search-ui-intent.md`

### Prompts agents (BUILD aval)

- `docs/ai/prompts.md` — UI Builder, API Architect, Security Review
