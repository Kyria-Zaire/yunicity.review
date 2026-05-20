# PRD-A0 — Tribes Philosophy & Social Boundaries

> **Phase :** DISCOVER → DESIGN  
> **Ticket :** FEATURE-A / A.0  
> **Workflow :** `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` — **BMAD :** `docs/bmad/BMAD.md`  
> **Ce document ne déclenche aucun code** — philosophie et frontières sociales des tribus **avant tout BUILD**.

---

## 0. Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | PRD-A0 |
| **Nom** | Tribes Philosophy & Social Boundaries |
| **Statut** | **DESIGN_READY** (DISCOVER + DESIGN pour A.0) |
| **Phase officielle** | DISCOVER → DESIGN |
| **Phase BMAD** | — (BUILD = tickets FEATURE-A dérivés) |
| **Sprint / programme** | FEATURE-A — TRIBUS |
| **Priorité** | **P0** (feature sociale la plus sensible du produit) |
| **Rôles** | social-product-architect, community-systems-designer, moderation-strategist, territorial-product-designer |
| **Date création** | 2026-05-20 |
| **Dernière mise à jour** | 2026-05-20 |
| **Environnement cible** | dev → recette (pilote Reims) → preprod → prod |

### Dépendances amont (acquis Yunicity)

| Acquis | Référence |
|--------|-----------|
| Feed citoyen ville-first | Sprint 4, TICKET-402 |
| Passport, réputation calme, tampons | PRD-301, Sprint 5 |
| Événements locaux | TICKET-505 |
| Quartiers éditoriaux (contexte, pas communauté) | PRD-601, TICKET-602–604 |
| Notifications sociales sobres | TICKET-503 |
| Beta readiness & philosophie slow local | TICKET-604, TICKET-506 |
| Auth, profils, organizations, RBAC | PRD-101, PRD-201 |

### Tickets aval (indicatif — hors scope A.0)

| Domaine | Objectif prévu |
|---------|----------------|
| A.1+ | Modèle tribu, memberships, rôles minimaux |
| A.2+ | API lecture / adhésion / sortie |
| A.3+ | Surfaces UX calmes (pas chat temps réel) |
| A.4+ | Modération, signalements, staff |
| A.5+ | Lien événements / feed / notifications |
| A.6+ | Pilote 3–5 tribus Reims + MEASURE |

### Interdictions absolues (ce ticket)

| Interdit | Note |
|----------|------|
| Migrations, modèles DB, API | BUILD uniquement |
| Frontend, WebSocket, chat temps réel | Hors philosophie MVP |
| Maquettes finales Figma | Spec UX §11 ; design system existant |
| Fusion tribus × quartiers | Interdit — §5 |
| Feed tribu autonome infini | Interdit — §6, §14 |

---

# Question centrale

> **« Pourquoi une personne rejoint-elle une tribu si le feed principal Yunicity existe déjà ? »**

| Surface | Rôle |
|---------|------|
| **Feed principal** | Mémoire et découverte de la **ville entière** — moments, voix locales, offres, événements. Ouvert, calme, non adhésif. |
| **Tribu** | **Coordination légère** autour d’un **intérêt ou projet humain partagé** — retrouvailles, organisation, continuité entre les mêmes personnes. Fermé par intention, pas par territoire. |

**Valeur humaine spécifique des tribus :** faire ensemble ce que le fil général ne structure pas — *« on se retrouve pour courir le dimanche »*, *« on prépare la prochaine sortie photo »*, *« l’asso a besoin de 4 bénévoles samedi »* — sans créer un second réseau social parallèle.

**Ce n’est pas une duplication** : le feed ne garantit ni la confiance récurrente, ni le fil conducteur d’une action collective, ni la permission sociale de parler à un cercle restreint sans polluer toute la ville.

---

# 1. Vision produit

## 1.1 Ce qu’est une tribu Yunicity

Une **tribu** est un **cercle d’intérêt humain local** : un petit groupe de citoyens (et parfois d’organisations) qui partagent une passion, une pratique ou une mission associative, avec une **coordination légère** et une **culture commune** — dans le respect du rythme lent de Yunicity.

| Une tribu est | Une tribu n’est pas |
|---------------|-------------------|
| Un espace de **retrouvailles intentionnelles** | Un serveur Discord |
| Une **suite légère** autour d’événements / intérêts | Un Slack de quartier |
| Un **contexte social positif** limité | Un groupe Facebook ouvert à la toxicité |
| Une **exploration collective douce** (sorties, ateliers) | Une faction territoriale ou un clan |
| Un **outil de coordination** (qui vient, quand, où) | Une machine à engagement et temps écran |

## 1.2 Ce qu’une tribu n’est PAS

- **Pas** une mini-plateforme autonome (pas d’app dans l’app).
- **Pas** un substitut du feed, du Passport ou des quartiers.
- **Pas** un canal de consommation de contenu infini.
- **Pas** un territoire géographique rival des quartiers éditoriaux (PRD-601).

**Mantra :** *« Le fil raconte la ville ; la tribu aide à agir ensemble. »*

---

# 2. Philosophie sociale

## 2.1 Piliers

| Pilier | Signification |
|--------|---------------|
| **Intérêt partagé** | La tribu existe pour une raison claire (course, photo, bénévolat…) — pas « parce qu’on habite le même coin » |
| **Lien humain** | Priorité aux rencontres réelles et à la confiance progressive, pas aux métriques |
| **Coordination locale** | Qui, quand, où — sans bureaucratie |
| **Culture commune** | Ton, règles simples, respect du calme Yunicity |
| **Exploration collective douce** | Sorties, ateliers, moments — pas compétition inter-groupes |

## 2.2 Ce que Yunicity refuse

| Refus | Pourquoi |
|-------|----------|
| **Guerre sociale** entre tribus | Fragmente la ville, attire le drama |
| **Engagement farming** (XP, streaks, leaderboard tribu) | Transforme la coordination en jeu toxique |
| **Clans** (identité fermée vs « les autres ») | Contredit ville unifiée |
| **Communautés toxiques** non modérées | Risque légal, réputation, sécurité utilisateurs |

**Alignement doctrine CTO :** sécurité et intégrité sociale > vélocité feature.

---

# 3. Pourquoi rejoindre une tribu ? (section critique)

## 3.1 Problèmes humains résolus

| Problème | Feed seul | Avec tribu (MVP cible) |
|----------|-----------|-------------------------|
| Retrouver les **mêmes personnes** autour d’une pratique | Difficile (bruit, pas de mémoire de groupe) | Espace dédié **limité** aux membres |
| **Organiser** une activité récurrente | Commentaires publics inadaptés | Fil tribu **court** + lien événements |
| **Continuité** après un événement | Le moment disparaît dans le fil ville | Tribu **événementielle ou persistante légère** prolonge le lien |
| **Bénévolat / asso** — appel ciblé | Spam ville entière | Cercle déjà engagé par la mission |
| **Passion locale** (photo, musique) | Découverte OK, approfondissement faible | Partage ciblé sans exposer toute la ville |

## 3.2 Usages impossibles ou inadaptés dans le feed général

- Planifier **3 prochaines sorties running** avec les mêmes 12 personnes.
- Discuter **logistique associative** sans inonder les voisins du fil.
- Maintenir un **fil conducteur** « atelier photo du mois » sans répéter en public.
- Créer une **confiance progressive** avant de se donner rendez-vous IRL.

## 3.3 Ce que les tribus ne doivent PAS servir à faire

| Interdit comme usage principal | Alternative Yunicity |
|-------------------------------|----------------------|
| Scroller du contenu **à l’infini** | Feed ville + découverte quartiers |
| Remplacer **Instagram / TikTok** | Pas de feed tribu autonome infini |
| **Harceler** ou exclure socialement | Modération + sortie saine §12 |
| **Politiser** ou polariser la ville | Exclusions typologie §4 |

---

# 4. Typologie des tribus MVP

## 4.1 Types autorisés (pilote Reims)

| Type | Exemple | Valeur |
|------|---------|--------|
| **Sport local** | Running Reims, vélo doux | Coordination sorties |
| **Photographie** | Lumières de Reims | Partage ciblé, sorties |
| **Bénévolat** | Entraide quartiers (sans être un « quartier clan ») | Mission, pas territoire |
| **Cafés & culture** | Lectures, café-philo | Rencontres calmes |
| **Étudiants** | Rentrée, études (ville, pas campus toxique) | Lien générationnel local |
| **Musique** | Jam acoustique, concerts locaux | Organisation légère |
| **Associations** | Club sportif, culturel vérifié | Continuité org ↔ citoyens |

## 4.2 Types et contenus interdits

| Interdit | Raison |
|----------|--------|
| Politique extrême, propagande | Polarisation, modération ingérable |
| Haine, discrimination | Illégal, contraire doctrine |
| Harcèlement, « revenge » groups | Sécurité P0 |
| Pseudo-gangs, suprémacie | Exclusion immédiate |
| **Tribalisation quartier** (« Clan Boulingrin ») | Doublon toxique avec quartiers — §5 |
| Arnaques, MLM, crypto pumps | Confiance produit |
| Contenu adulte explicite | Hors scope citoyen local |

**Règle création :** charte courte obligatoire + validation staff en pilote.

---

# 5. Relation avec les quartiers

## 5.1 Principe de séparation

| Entité | Nature | Adhésion |
|--------|--------|----------|
| **Quartier** (PRD-601) | Contexte **éditorial / géographique** | Aucune — fenêtre sur la ville |
| **Tribu** | Cercle **d’intention humaine** | Opt-in explicite |

**Les tribus ne fusionnent pas avec les quartiers.** Pas de tribu officielle « par slug quartier ».

## 5.2 Coexistence sans clans territoriaux

- Une tribu **peut mentionner** un quartier dans sa description ou ses événements (« on se retrouve près de Saint-Remi ») — **sans** devenir la tribu propriétaire du quartier.
- Les **badges quartier** sur le feed restent **contextuels**, pas des frontières d’appartenance tribale.
- Passport et tampons restent **ville / lieux**, pas « score de tribu ».

**Mantra territorial :** *« Quartier = ambiance ; tribu = intention. »*

---

# 6. Relation avec le feed

## 6.1 Le feed principal reste le cœur

- Ordre de découverte par défaut : **fil ville** (Reims).
- Aucune obligation de rejoindre une tribu pour utiliser Yunicity.
- Les tribus **n’aspirent pas** le trafic du fil via notifications agressives.

## 6.2 Visibilité et propagation contrôlée

| Mécanisme MVP (cible DESIGN) | Règle |
|------------------------------|-------|
| Publication **depuis** une tribu | Par défaut **visible tribu uniquement** |
| Partage vers fil ville | **Opt-in explicite** du membre (anti-pollution) |
| Carte / badge tribu sur fil | **Discret** — pas de promotion tribu trending |
| Événement tribu | Peut apparaître dans **events ville** si public et modéré |

## 6.3 Anti-pollution

- Plafond de **partages fil / jour / tribu** (conceptuel — à chiffrer en BUILD).
- Pas de **repost automatique** de toute activité tribu vers le fil.
- Modération : spam tribu → impact réputation org / créateur, pas leaderboard public.

---

# 7. Structure sociale MVP

## 7.1 Ouverture et découverte

| Mode | MVP pilote | Notes |
|------|------------|-------|
| **Découverte** | Liste **curated** 3–5 tribus pilotes | Pas annuaire ouvert jour 1 |
| **Rejoindre** | Demande + approbation **ou** invitation lien | Éviter portes ouvertes toxiques |
| **Public / privé** | **Public limité** (visible, adhésion contrôlée) + **privé sur invitation** | Pas de « secret » hors charte |

## 7.2 Rôles minimaux (pas Discord)

| Rôle | Pouvoir |
|------|---------|
| **Membre** | Lire, publier (selon règles), quitter |
| **Hôte / créateur** | Inviter, épingler annonce, modérer léger (masquer post), exclure avec trace |
| **Staff Yunicity** | Suspendre tribu, audit, appel |

**Interdit MVP :** 10 rôles, permissions par canal, bots, webhooks communautaires.

## 7.3 Limites de complexité

| Paramètre | Cible MVP |
|-----------|-----------|
| Membres actifs / tribu | **Plafond doux** (ex. 50–150 — à valider MEASURE) |
| Tribus rejointes / utilisateur | **Plafond bas** (ex. 3–5 actives) |
| « Canaux » | **Un seul fil** tribu chronologique limité |
| Messages | **Asynchrone** — pas temps réel |

---

# 8. Persistance sociale

## 8.1 Modèles autorisés

| Type | Description | Quand |
|------|-------------|-------|
| **Persistante légère** | Intérêt stable (running, photo) | Communauté de pratique |
| **Événementielle** | Créée autour d’un **événement** ; archive ou sommeil après | Réduit fatigue |
| **Hybride** | Événementielle → persistante si le groupe demande + staff OK | Transition explicite |

## 8.2 Risques des communautés permanentes

| Risque | Mitigation |
|--------|------------|
| **Fatigue** (obligations implicites) | Rappels rares ; pas de streak ; sortie facile §12 |
| **Cliquisme** | Rotation hôte encouragée ; plafond membres |
| **Modération lourde** | Staff + hôtes formés ; signalement 1-tap |
| **Zombie tribes** | Archivage auto après inactivité N mois (DECIDE post-MVP) |

**Recommandation pilote :** privilégier **1–2 tribus événementielles** + **2–3 persistantes** culture/asso.

---

# 9. Créateurs & ambassadeurs

## 9.1 Rôles dans l’écosystème

| Acteur | Rôle tribu |
|--------|------------|
| **Citoyen** | Membre, co-organisateur possible |
| **Organization vérifiée** | Hôte naturel (asso, commerce culturel) |
| **press_creator** | Tribu éditoriale **limitée** (ex. « Parcours photo Reims ») — pas influence territoriale |
| **business** | Tribu **liée à l’org**, pas tribu « marque » publicitaire |
| **Staff** | Validation pilote, arbitrage |

## 9.2 Garde-fous créateurs

- Pas de **tribu monétisée** MVP (pas d’abonnement tribu).
- Offres Passport / flash : restent dans **logique ville**, pas spam tribu.
- Créateur ≠ modérateur absolu — **appel staff** possible.

---

# 10. Modération

## 10.1 Principes

Les tribus sont le **plus gros risque modération** post-lancement. Traitement **P0** au même niveau que auth et signalements feed.

| Capacité | MVP |
|----------|-----|
| **Signalement** membre / message | 1-tap, raisons standard (spam, harcèlement, haine, autre) |
| **Exclusion** par hôte | Avec motif interne ; récidive → flag compte |
| **Suspension tribu** | Staff — tribu gelée, membres notifiés sobrement |
| **Suppression contenu** | Hôte + staff ; rétention logs audit |
| **Anti-harassment** | Blocage utilisateur global Yunicity prioritaire sur conflit tribu |

## 10.2 Processus pilote

- **Modération humaine** renforcée sur les 3–5 tribus pilotes.
- Charte **Tribu Yunicity** acceptée à l’adhésion (2 min lecture).
- SLA interne : signalement grave < 24 h recette.

## 10.3 Liens existants

- Réutiliser philosophie signalements feed (TICKET-402+).
- Notifications : **pas** de « X vous a insulté en direct » — ton factuel, lien modération si besoin.

---

# 11. UX philosophy

## 11.1 Principes interface (cible DESIGN → BUILD)

| Principe | Application |
|----------|-------------|
| **Calme** | Blanc, `#2A2FFF`, pas de violet legacy ni gradients agressifs |
| **Respiration** | Peu de posts visibles ; pagination / « charger plus » limité |
| **Anti-chaos** | Un fil, pas 100 salons |
| **Anti-discordification** | Pas de sidebar channels, pas de statut en ligne |
| **Anti-slackification** | Pas de @channel, pas de ping storm |
| **Anti-fatigue** | Notifications tribu **opt-in** et **plafonnées** |

## 11.2 Interdictions UX (rappel §14)

Pas de : chat temps réel, vocaux, threads infinis type forum, badge « en ligne », compteur messages non lus agressif sur l’icône tab.

---

# 12. Quitter une tribu sainement

## 12.1 Principes

| Principe | Implémentation cible |
|----------|----------------------|
| **Discrétion** | Sortie **sans annonce** au groupe |
| **Sans pression** | Pas de « pourquoi partez-vous ? » obligatoire |
| **Sans drama produit** | Pas de guilt modal (« vous allez manquer… ») |
| **Réversibilité** | Rejoindre à nouveau = nouvelle demande (évite harcèlement leave/join) |

## 12.2 Effets de la sortie

- Accès fil tribu **révoqué** immédiatement.
- Publications passées : **anonymisation ou attribution figée** (DECIDE BUILD — défaut : posts restent, nom masqué optionnel).
- Notifications tribu **coupées**.
- Événements créés : restent **ville** si publics ; pas de suppression rétroactive sauf modération.

**Copy cible :** *« Vous avez quitté [Tribu]. Vous retrouvez le fil de Reims comme avant. »*

---

# 13. Risques produit

| Risque | Gravité | Mitigation A.0 → BUILD |
|--------|---------|------------------------|
| **Addiction sociale** (check tribu en boucle) | Haute | Pas temps réel ; plafonds notifs ; pas XP |
| **Bulles** (echo chamber) | Haute | Partage fil opt-in ; diversité tribus pilotes |
| **Clans** (nous vs eux) | Critique | Pas tribu par quartier ; pas guerre tribus |
| **Harcèlement** | Critique | Signalement, blocage, staff |
| **Fatigue sociale** | Moyenne | Plafond tribus/user ; sortie facile |
| **Fragmentation produit** | Haute | Feed reste home ; tribu = onglet/entrée secondaire |
| **Isolement** (ville vs bulle) | Moyenne | Événements IRL encouragés ; lien fil ville |
| **Modération sous-capacité** | Critique | Pilote petit ; pas ouverture sauvage |

---

# 14. Exclusions strictes (non négociables)

| # | Exclusion |
|---|-----------|
| 1 | Guerre tribus / rivalité affichée |
| 2 | Leaderboard tribus |
| 3 | Score d’influence tribu |
| 4 | Chat temps réel |
| 5 | Vocaux / audio rooms |
| 6 | Threads infinis type forum |
| 7 | Rôles complexes type Discord |
| 8 | « Tribu trending » |
| 9 | Notifications agressives (batch, FOMO) |
| 10 | Système XP communautaire |
| 11 | Feed séparé autonome infini |
| 12 | Fusion tribu = quartier |
| 13 | Politique / haine / gangs |
| 14 | WebSocket social MVP |

Toute demande BUILD contredisant cette liste → **refus** ou ticket DECIDE explicite avec review sécurité.

---

# 15. Rollout strategy

## 15.1 Phases

| Phase | Contenu |
|-------|---------|
| **0 — PRD A.0** | Ce document ; alignement équipe |
| **1 — BUILD minimal** | 1 fil tribu, adhésion, sortie, modération base |
| **2 — Pilote Reims** | **3–5 tribus** culture / asso / sport doux |
| **3 — MEASURE** | Qualité interactions, incidents modération, fatigue |
| **4 — ANALYZE / DECIDE** | Ouvrir création ? plafonds ? archivage ? |
| **5 — Échelle** | Autres villes **seulement** si philosophie tenue |

## 15.2 Critères d’ouverture pilote

- [ ] Charte tribu + process modération staff validés
- [ ] Hôtes identifiés (asso / créateur vérifié)
- [ ] Pas de régression feed / quartiers en recette
- [ ] Plan rollback : désactivation tribu sans impact fil ville

## 15.3 Tribus pilotes suggérées (Reims)

| Tribu (exemple) | Type | Persistance |
|-----------------|------|-------------|
| « Sorties running Reims » | Sport | Persistante légère |
| « Lumières de Reims » (photo) | Culture | Persistante |
| « Bénévolat culturel Reims » | Asso | Événementielle + hybride |
| « Café-rencontres » (partenaire org) | Culture | Événementielle |
| « Étudiants & ville » | Étudiants | Persistante plafonnée |

**Observation forte** 4–8 semaines avant tout « créer sa tribu » citoyen.

---

# 16. KPIs humains (pas vanity)

| KPI | Mesure | Anti-KPI |
|-----|--------|----------|
| **Qualité interactions** | Ratio signalements / posts tribu | Messages / minute temps réel |
| **Rencontres réelles** | Événements tribu avec participants IRL (déclaratif léger) | DAU tribu seul |
| **Événements créés** | Events liés tribu → ville | Nombre de tribus créées |
| **Participation saine** | Membres actifs / mois, churn volontaire | Temps écran tribu max |
| **Diversité sociale** | Âges / orgs mélangés (audit échantillon) | Une tribu > 50 % trafic |
| **Rétention calme** | Retour 30j **sans** pic notif | Notifications tribu / user / jour |

**DECIDE** : scaler uniquement si KPIs humains OK **et** incidents modération sous seuil.

---

# 17. Conclusion stratégique

## 17.1 Pourquoi les tribus peuvent enrichir Yunicity

Yunicity a construit la **mémoire et la découverte** de la ville (fil, quartiers, passport, événements). Il manque un espace **humain et intentionnel** pour **faire ensemble** sans enfermer la ville en silos. Les tribus, **bornées et calmes**, comblent ce gap : coordination, confiance récurrente, culture associative — **sans** devenir Discord ni Facebook Groups.

## 17.2 Pourquoi elles n’endommagent pas la philosophie

- Le **feed reste le cœur** ; les tribus sont **opt-in** et **limitées**.
- Les **quartiers** restent éditoriaux, pas claniques.
- La **réputation Passport** reste ville / comportement, pas score de tribu.
- Les **exclusions strictes** empêchent la dérive engagement-first.

## 17.3 Condition de succès

> Les tribus réussissent si les gens **se retrouvent dans la vraie vie** plus souvent — pas s’ils passent plus de temps dans un fil tribu.

## 17.4 Prochaine étape (hors A.0)

| Ticket suggéré | Phase | Contenu |
|----------------|-------|---------|
| **A.1** | DESIGN | Modèle conceptuel memberships + états (spec, pas code si gate) |
| **A.2** | BUILD gates §13 | Migrations, API, permissions — **après** validation PRD A.0 |

---

## Annexe — Réponses aux 14 questions centrales (index)

| # | Question | Section |
|---|----------|---------|
| 1 | Pourquoi les tribus existent ? | §1, §3 |
| 2 | Quel problème humain ? | §3.1 |
| 3 | Différence vs groupes classiques ? | §1, §7, §14 |
| 4 | Éviter tribalisation ? | §5, §4.2, §14 |
| 5 | Lien quartiers/events/feed ? | §5, §6 |
| 6 | Niveau d’ouverture ? | §7.1 |
| 7 | Rôle créateurs ? | §9 |
| 8 | Modération ? | §10 |
| 9 | Limites strictes ? | §7.3, §14 |
| 10 | Risques psycho/socials ? | §13 |
| 11 | Pas endommager le feed ? | §6 |
| 12 | Quitter sainement ? | §12 |
| 13 | Persistantes ou temporaires ? | §8 |
| 14 | Éviter fatigue communautaire ? | §8.2, §11, §16 |

---

## Gates PRD §13 (A.0 — DISCOVER/DESIGN)

| Gate | Statut A.0 |
|------|------------|
| Problème et valeur validés | ✅ Question centrale + §3 |
| Scope / exclusions | ✅ §0, §14 |
| Risques et modération | ✅ §10, §13 |
| Cohérence quartiers / ville | ✅ §5 |
| Pas de BUILD prématuré | ✅ Aucun code |
| Review sécurité sociale | ⏳ Validation humaine requise avant A.1 BUILD |

---

*Document canon FEATURE-A — à valider par produit + modération + CTO avant tout ticket BUILD tribus.*
