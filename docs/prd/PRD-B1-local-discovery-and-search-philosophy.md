# PRD-B1 — Local Discovery & Search Philosophy

> **Phase :** DISCOVER → DESIGN  
> **Ticket :** FEATURE-B / B.1  
> **Workflow :** `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` — **BMAD :** `docs/bmad/BMAD.md`  
> **Ce document ne déclenche aucun code** — philosophie de la découverte et de la recherche locale **avant tout BUILD**.

---

## 0. Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | PRD-B1 |
| **Nom** | Local Discovery & Search Philosophy |
| **Statut** | **DESIGN_READY** (DISCOVER + DESIGN pour B.1) |
| **Phase officielle** | DISCOVER → DESIGN |
| **Phase BMAD** | — (BUILD = tickets FEATURE-B dérivés) |
| **Sprint / programme** | FEATURE-B — RECHERCHE & PARTAGE |
| **Priorité** | **P0** (couche transversale — impact feed, territoire, confiance produit) |
| **Rôles** | product-discovery-architect, calm-search-experience-designer, territorial-content-strategist |
| **Date création** | 2026-05-20 |
| **Dernière mise à jour** | 2026-05-20 |
| **Environnement cible** | dev → recette (pilote Reims) → preprod → prod |

### Dépendances amont (acquis Yunicity)

| Acquis | Référence | Rôle dans la découverte |
|--------|-----------|-------------------------|
| Feed local ville-first | TICKET-402, Sprint 4 | **Cœur vivant** — hors scope recherche directe pour posts tribu |
| Passport, tampons, offres | PRD-301, Sprint 5 | Découverte d’avantages et lieux vérifiés |
| Événements locaux | TICKET-505 | Moments temporels, forte utilité recherche |
| Quartiers éditoriaux | PRD-601, TICKET-602–604 | Contexte territorial, pas silo social |
| Tribus (cercles d’intérêt) | PRD-A0, FEATURE-A | Catalogue **public** uniquement ; mur tribu isolé |
| Notifications sobres | TICKET-503 | Pas de boucle découverte compulsive |
| Flash offers | TICKET-503+ | Urgence locale **contextuelle**, pas trending |
| Profils & organizations | PRD-201 | Lieux et citoyens publics recherchables |
| Beta readiness & philosophie slow local | TICKET-604, TICKET-506 | Doctrine « slow local » |

### Tickets aval (indicatif — hors scope B.1)

| Domaine | Objectif prévu |
|---------|----------------|
| B.2 | Partage sobre — liens externes, contexte territorial |
| B.3+ | Spec technique recherche (index, API, permissions) |
| B.4+ | UX recherche web/mobile |
| B.5+ | Blocs découverte éditoriale (home, feed rail) |
| B.6+ | MEASURE découverte → action réelle |

### Interdictions absolues (ce ticket)

| Interdit | Note |
|----------|------|
| Migrations, modèles DB, API, endpoints | BUILD uniquement |
| Frontend, composants recherche | Hors B.1 |
| Moteur « For You » opaque, embeddings prod | Future §13 |
| Fusion recherche × feed algorithmique | Interdit — §4 |
| Posts mur tribu dans résultats globaux | Aligné FEATURE-A — §2, §4 |

---

# Question centrale

> **« Comment permettre la découverte utile et l’exploration locale sans transformer Yunicity en moteur addictif ni casser la cohérence territoriale ? »**

| Tension | Réponse philosophique |
|---------|----------------------|
| **Utilité** | La recherche aide à **trouver** et **agir** (événement, lieu, offre, quartier) — pas à scroller indéfiniment |
| **Territoire** | Tout part de **la ville de l’utilisateur** (ex. Reims) ; le quartier **contextualise**, ne cloisonne pas |
| **Cohérence** | Une seule grammaire : calme, lisible, éditoriale — comme le feed et les quartiers |
| **Transparence** | Pas de classement opaque ; l’utilisateur comprend **pourquoi** un résultat apparaît |

**Mantra Feature B :** *« Le fil fait vivre la ville ; la recherche aide à la parcourir avec intention. »*

---

# 1. Vision — Découvrir sa ville

## 1.1 Ce que signifie « découvrir » dans Yunicity

**Découvrir sa ville**, c’est :

- **Reconnecter au réel** : sorties, lieux, personnes, moments — pas à un flux abstrait.
- **Aider à agir** : trouver un événement ce week-end, un café, une asso, une offre Passport.
- **Rendre la ville lisible** : morceaux humains (quartiers), pas carte administrative froide.
- **Faciliter les rencontres locales** : événements, tribus publiques, lieux — sans forcer l’adhésion.
- **Valoriser le territoire** : contenu ancré ville / quartier / lieu vérifié.
- **Créer de la curiosité saine** : sérendipité locale douce (« à deux pas », « ce week-end ») — pas FOMO.

| La découverte Yunicity est | La découverte Yunicity n’est pas |
|--------------------------|----------------------------------|
| Un **compas local** intentionnel | Un fil « Pour vous » infini |
| Une **aide à la décision** (où aller, quoi faire) | Une machine à maximiser le temps écran |
| Une **extension du fil** quand on cherche quelque chose | Un second produit social parallèle |
| **Transparente** (éditoriale, proximité, date) | **Opaque** (scores secrets, engagement ML) |

## 1.2 Alignement doctrine produit

Yunicity a déjà plusieurs surfaces (feed, passport, events, quartiers, tribus, notifications, flash). La Feature B **orchestre l’accès intentionnel** à ces briques — elle ne les remplace pas.

---

# 2. Types de recherche MVP

## 2.1 Contenus recherchables (MVP)

| Type | Recherchable MVP | Rationale | Notes frontières |
|------|:----------------:|-----------|------------------|
| **Posts citoyen / org (feed ville)** | ✅ Oui | Mémoire locale publique | `tribe_id IS NULL` uniquement — jamais mur tribu |
| **Événements locaux** | ✅ Oui | Forte intent « quoi faire » | Ville + dates + quartier optionnel |
| **Quartiers** | ✅ Oui | Exploration territoriale | Fiche éditoriale, pas groupe |
| **Organizations (lieux)** | ✅ Oui | Points d’ancrage réels | Vérification / type lieu |
| **Offres Passport / partenaires** | ✅ Oui | Utilité concrète | Actives, ville, validité |
| **Tribus publiques** | ✅ Oui (catalogue) | Intérêt partagé, opt-in | Slug, nom, description — **pas** posts tribu |
| **Profils publics** | ✅ Oui (limité) | Connexion humaine | Username, ville ; pas PII |
| **Flash offers** | ✅ Oui (filtre / tag) | Urgence locale | Fenêtre courte, pas « hot trending » |
| **Notifications** | ❌ Non | Inbox, pas discovery | Lien depuis résultat OK |
| **Mur tribu** | ❌ Non | Isolation FEATURE-A | Rejoindre tribu puis mur dédié |
| **Tribus private_invite** | ❌ Non (liste) | Pas de découverte cachée | Invitation seulement |
| **DM / messagerie** | ❌ Non | Hors produit | — |
| **Paiements / PII** | ❌ Non | Zones rouges | — |

## 2.2 Hors scope MVP (explicitement)

| Hors scope | Report | Alternative MVP |
|----------|--------|-----------------|
| Recherche **mondiale** ou multi-ville par défaut | B.6+ voyageurs | Ville profil utilisateur ; changement ville explicite |
| Recherche **sémantique / IA** | §13 Future | Texte simple + synonymes légers |
| **Carte interactive** plein écran | §13 Future | Liens quartier / lieu / event |
| Posts **tribu** dans recherche globale | Jamais (invariant A) | Fiche tribu + join |
| **Commentaires** isolés | Faible valeur | Résultat = post parent |
| **Historique serveur** long | Vie privée | 5 recherches récentes **locales** effaçables |
| **Trending global** | Interdit §10 | Blocs éditoriaux staff |

## 2.3 Principe territorial par défaut

```
Scope recherche par défaut = ville_utilisateur (ex. Reims)
```

| Règle | Détail |
|-------|--------|
| **Ville** | Toujours dérivée du profil / session ; affichée clairement (« Reims ») |
| **Quartier** | Filtre ou boost **optionnel** — jamais prison |
| **Proximité géo** | Future ; MVP = ville + quartier éditorial + district event |
| **Autre ville** | Action explicite « Changer de ville » (profil) — pas autocomplete planétaire |

**Pas de** recherche ouverte « partout sur internet » ni « toutes les villes Yunicity » en un clic.

---

# 3. Philosophie de découverte

## 3.1 Ce que Yunicity expose (et comment)

| Mode | Description | Transparence |
|------|-------------|--------------|
| **Recherche intentionnelle** | L’utilisateur tape une requête | Résultats par type, ordre explicable |
| **Découverte éditoriale** | Blocs staff / règles métier lisibles | « Événements ce week-end », pas « trending » |
| **Proximité locale** | Même ville, quartier proche si connu | Libellé « près de vous » = ville, pas GPS opaque |
| **Temporalité réelle** | Events à venir, offres valides, flash actifs | Dates visibles |
| **Sérendipité douce** | 3–5 suggestions max, rotatives lentes | Pas refresh auto agressif |

## 3.2 Ce que Yunicity refuse

| Refus | Pourquoi |
|-------|----------|
| **Trending agressif** | FOMO, course au clic |
| **Ranking dopamine** | « Top », « most viewed », « hot » |
| **Ragebait amplification** | Contre confiance locale |
| **Infinite rabbit holes** | Scroll recherche infini interdit |
| **Systèmes de recommandation opaques** | Pas de « parce que l’algo pense… » |

## 3.3 Ordre de pertinence MVP (explicable, non secret)

Ordre **par type de résultat** puis **règles métier publiques** — pas un score unique noir :

1. **Correspondance texte** (titre, nom, description, slug) — priorité exacte > partielle.
2. **Pertinence temporelle** (événements à venir > passés ; offres actives).
3. **Ancrage ville** (même ville = obligatoire).
4. **Boost éditorial staff** (quartiers featured, events mis en avant) — **badge visible** « Suggestion Yunicity ».
5. **Proximité quartier** (si profil / contexte) — **optionnel**, jamais seul critère.

**Interdit MVP :** modèle ML entraîné sur dwell time pour classer le feed de recherche.

## 3.4 Relation tribus × découverte

| Autorisé | Interdit |
|----------|----------|
| Trouver une **tribu publique** par nom / catégorie | Indexer les **posts tribu** |
| Fiche tribu → rejoindre → mur | Résultats « activité tribu hot » |
| Tribu `private_invite` absente du catalogue | Fuite contenu privé via search |

---

# 4. Recherche vs feed

## 4.1 Rôles distincts

| Dimension | **Feed local** | **Recherche & découverte** |
|-----------|----------------|----------------------------|
| **Intent** | Parcourir la **vie de la ville** sans but précis | **Trouver** quelque chose de précis |
| **Rythme** | Chronologique, pagination calme | Requête → résultats groupés |
| **Émotion** | Présence, mémoire collective | Efficacité, clarté |
| **Contenu** | Posts ville, offres, events (tribe_id NULL) | Multi-types agrégés |
| **Profondeur** | Scroll limité « charger plus » | Pas de scroll infini résultats |
| **Algorithme** | Pas de For You — ordre temporel / métier feed | Pas de ranking opaque |

## 4.2 Frontières UX

| Frontière | Règle |
|-----------|-------|
| **Entrée feed** | Tab / route dédiée — reste **premier** ancrage quotidien |
| **Entrée recherche** | Barre globale ou page `/search` — **secondaire** mais visible |
| **Pas de fusion** | Les résultats recherche **ne remplacent pas** le fil |
| **Pas de hijack** | Ouvrir l’app ≠ landing sur recherche |
| **Retour** | Depuis recherche → feed ou contexte d’origine en 1 geste |

## 4.3 Logiques comportementales

| Comportement sain | Comportement à éviter |
|-------------------|----------------------|
| « Je cherche un concert samedi » → events | Feed devient moteur search-only |
| « Je scroll le soir » → feed | Recherche vide → infinite suggestions |
| Quitter recherche sans culpabilisation | Notifications « tu n’as pas fini de chercher » |

## 4.4 Invariants croisés (FEATURE-A)

- **Invariant feed :** `posts.tribe_id IS NULL` dans feed et recherche posts.
- **Invariant tribu :** mur accessible **après** membership uniquement.
- **Invariant quartier :** quartier = **contexte** sur carte event/post, pas communauté fermée (PRD-601).

---

# 5. Recherche territoriale

## 5.1 Dimensions territoriales

| Dimension | Usage recherche | Limite anti-anxiété |
|-----------|-----------------|---------------------|
| **Ville** | Scope par défaut, toujours visible | Une ville active à la fois (MVP) |
| **Quartier** | Filtre, badge, page quartier | Pas « mur de quartier » ni adhésion |
| **District / lieu event** | Contexte sur événement | Pas hyper-précision adresse MVP |
| **Proximité** | « À Reims » / « ce week-end » | Pas tracking GPS continu MVP |
| **Tribus publiques** | Exploration intérêts | Pas carte des membres |
| **Organizations** | Lieux vérifiés | Pas scraping avis externes |

## 5.2 Quartiers : contextuels, pas silos

Alignement PRD-601 :

- Un résultat peut **taguer** un quartier (« Boulingrin · Reims »).
- **Pas** de recherche « uniquement mon quartier » qui cache le reste de la ville par défaut.
- Filtre quartier = **affiner**, pas **enfermer**.

## 5.3 Tribus et territoire

- Tribu = **intérêt**, pas polygon géographique.
- Recherche tribu : par **nom**, **catégorie**, **ville** — pas par « tribus près de moi » GPS MVP.

## 5.4 Événements et temporalité

- Filtres MVP : **à venir** (défaut), **cette semaine**, **ce week-end** (éditorial).
- Passés : accessibles via recherche explicite ou fiche, pas mis en avant.

---

# 6. UX recherche

## 6.1 Surfaces MVP

| Surface | Rôle |
|---------|------|
| **Barre recherche** | Entrée unique : placeholder calme (« Rechercher à Reims ») |
| **Page résultats** | Groupes par type : Événements, Lieux, Quartiers, Posts, Offres, Tribus, Profils |
| **Suggestions avant saisie** | Max 4–6 entrées éditoriales + récentes |
| **Filtres légers** | Type, période (events), optionnel quartier |
| **Empty states** | Humains, orientés action (« Explorer les quartiers », « Voir les moments ») |
| **Retour** | Fil ou page précédente — pas piège |

## 6.2 Principes UX

| Principe | Application |
|----------|-------------|
| **Calme** | Pas d’animation agressive, pas de compteurs rouges |
| **Rapide** | Résultats < perception 1 s (objectif BUILD) |
| **Humain** | Micro-copy française, pas jargon « trending » |
| **Lisible** | Cartes cohérentes design system (#2A2FFF, blanc, radius existants) |

## 6.3 Historique recherches

| Règle | Valeur |
|-------|--------|
| **Stockage** | Local device MVP ; serveur optionnel B.4+ |
| **Max** | **5** recherches récentes |
| **Effacement** | 1 action « Effacer l’historique » |
| **Pas de** | Suggestions basées sur historique opaque cross-user |

## 6.4 Interdictions UX (§10 rappel)

- ❌ Scroll infini agressif sur résultats
- ❌ Auto-refresh permanent des suggestions
- ❌ Dark patterns (cacher le fil, fausses urgentes)
- ❌ Boucles « people also searched » infinies
- ❌ Autocomplete qui envoie vers contenu sponsorisé non labelisé

## 6.5 États vides

| État | Ton |
|------|-----|
| Aucun résultat | « Rien pour cette recherche à Reims — essayez un autre mot ou explorez les quartiers. » |
| Recherche trop courte | Guidage sans punition |
| Ville sans contenu | Editorial + lien feed |
| Erreur réseau | Retry sobre |

---

# 7. Suggestions & découverte éditoriale

## 7.1 Blocs autorisés (exemples)

| Bloc | Logique | Label utilisateur |
|------|---------|-------------------|
| Événements ce week-end | `starts_at` dans fenêtre + ville | « Ce week-end à Reims » |
| Nouveaux lieux locaux | Organizations récentes vérifiées | « Nouveaux lieux » |
| Quartiers à explorer | Featured neighborhoods | « Quartiers à découvrir » |
| Offres actives | Passport offers valides | « Avantages locaux » |
| Tribus ouvertes | `visibility=public`, featured | « Tribus ouvertes » |
| À proximité (soft) | Même ville + quartier profil si dispo | « Près de chez vous » (= ville/quartier, pas GPS) |

Chaque bloc : **lien « Voir tout »** → liste filtrée **explicable**.

## 7.2 Interdictions libellés

| Interdit | Alternative |
|----------|-------------|
| Viral | « Populaire à Reims » (même interdit) |
| Trending now | « Ce week-end » |
| Most viewed | « Mis en avant » (staff badge) |
| Top engagement | *(aucun)* |
| Hot / 🔥 | *(aucun)* |

## 7.3 Rotation et fraîcheur

- Suggestions changent **au plus** 1× / jour (staff/config) — pas à chaque focus champ.
- **Pas** de personnalisation cross-user opaque en MVP.

---

# 8. Partage — Vision B.2 (préparation)

> **Hors implémentation B.1** — cadre philosophique pour le ticket partage.

## 8.1 Ce que signifie « partager » dans Yunicity

| Le partage Yunicity | Le partage n’est pas |
|---------------------|----------------------|
| **Faire circuler l’utile** dans la ville | Maximiser les vues brutes |
| **Contextualiser le territoire** | Lien générique « télécharge l’app » |
| **Favoriser l’action réelle** (y aller, s’inscrire) | Viralité hors-sol |
| **Enrichir la ville** (event, lieu, quartier) | Repost sans ancrage |

## 8.2 Objets partageables (vision)

| Objet | Priorité | Notes |
|-------|----------|-------|
| **Événement** | P0 | Date, lieu, ville dans preview |
| **Offre Passport** | P1 | Validité, partenaire |
| **Quartier** | P1 | Ambiance, pas mur social |
| **Organization** | P1 | Lieu vérifié |
| **Post feed ville** | P2 | Repost local sobre — **pas** post tribu vers feed |
| **Tribu publique** | P2 | Fiche tribu, pas contenu mur |
| **Profil public** | P3 | Username, pas PII |

## 8.3 Partage externe (autorisé)

Canaux : WhatsApp, SMS, Messenger, Instagram story, email, etc.

| Règle | Exemple bon | Exemple mauvais |
|-------|-------------|-----------------|
| **Contexte territorial visible** | « Découvre cet événement à Reims sur Yunicity » | « Viens sur Yunicity » |
| **Deep link** | Ouvre fiche event / quartier | Landing homepage générique |
| **Open Graph** | Titre, image, ville, date | Clickbait sans lieu |
| **Pas de** | Tracking pixel agressif, invite pyramidale | — |

## 8.4 Repost local sobre (B.2 — principe)

Si repost feed :

- **Uniquement** contenu `tribe_id IS NULL` → feed ville.
- **Interdit** : repost mur tribu → feed global (invariant A).
- Repost = **citation légère** avec lien source — pas chaîne infinie type Twitter.

## 8.5 Partage × recherche

- Partage **ne remplace pas** la recherche.
- Lien partagé peut être **indexé** comme entrée découverte (deep link) — pas comme boost algorithmique secret.

---

# 9. Risques

| Risque | Probabilité | Impact | Mitigation philosophique |
|--------|-------------|--------|--------------------------|
| **Bruit informationnel** | Moyenne | Fatigue | Types groupés, limite résultats / page |
| **Surcharge cognitive** | Moyenne | Abandon | Filtres simples, pas 12 facettes |
| **Bulle sociale** | Faible | Confiance | Ville ouverte par défaut, tribus opt-in |
| **Tribalisation contenu** | Moyenne | Fragmentation | Pas de posts tribu en search |
| **Spam découverte** | Moyenne | Qualité | Rate limit, modération existante |
| **Scroll addictif recherche** | Moyenne | Doctrine | Pas infinite scroll |
| **Hyperlocalisation toxique** | Faible | Exclusion | Quartier = filtre, pas mur |
| **Fatigue recherche** | Moyenne | UX | 5 récentes max, pas notif search |
| **Fuite PII** | Faible | Légal | Profils publics stricts |
| **Confusion feed/search** | Moyenne | Produit | Rôles §4, design distinct |
| **« For You » creep** | Moyenne | Dette | Gate PRD §13 + review CTO |

---

# 10. Exclusions strictes (Feature B)

Liste **non négociable** pour tout ticket BUILD/DESIGN aval :

| # | Exclusion |
|---|-----------|
| 1 | Trending global |
| 2 | For You / fil personnalisé opaque |
| 3 | Recommendation engine non explicable |
| 4 | Doomscrolling patterns (infinite search) |
| 5 | Autoplay média dans résultats |
| 6 | Engagement bait (« 12 personnes regardent ») |
| 7 | Ragebait amplification |
| 8 | « People also watched / searched » infini |
| 9 | Infinite algorithmic discovery |
| 10 | Dopamine-first ranking (views, likes) |
| 11 | Posts tribu dans index recherche globale |
| 12 | Recherche mondiale par défaut |
| 13 | Sponsored results sans label |
| 14 | Historique recherche serveur illimité sans consentement |

Toute demande contredisant → **refus** ou DECIDE documenté + review sécurité.

---

# 11. Rollout MVP recommandé

| Phase | Ticket indicatif | Contenu | Dépendances |
|-------|------------------|---------|-------------|
| **0 — B.1** | Ce PRD | Philosophie, frontières | Acquis Features A, 601 |
| **1 — Recherche simple** | B.3–B.4 | Index texte, API lecture, UI barre + résultats groupés | Spec technique |
| **2 — Découverte locale** | B.5 | Blocs éditoriaux (week-end, quartiers, lieux) | Staff config Reims |
| **3 — Partage sobre** | B.2 | Deep links, OG, share sheet | Events, orgs |
| **4 — Enrichissements** | B.6+ | Filtres avancés, carte, sémantique | MEASURE B.1–3 |

**Pilote ville :** Reims jusqu’à validation KPIs.

**Critères ouverture phase 2 :**

- [ ] Invariant feed/tribu vérifié en recette
- [ ] Pas de régression temps feed p95
- [ ] Micro-copy validée (pas trending)
- [ ] Modération signalements search testée

---

# 12. KPIs sains

| KPI | Mesure | Anti-KPI |
|-----|--------|----------|
| **Événements découverts puis consultés** | Clic fiche event depuis search / discovery | Clics sans suite |
| **Lieux explorés** | Vues fiche organization depuis search | — |
| **Recherches abouties** | Requête → clic résultat < 60 s | Nombre recherches vides |
| **Navigation locale réussie** | Retour feed ou action (RSVP, carte) | Boucles search only |
| **Conversion découverte → action** | Présence event, redemption offer (agrégé) | — |
| **Pertinence territoriale** | % résultats même ville | Résultats hors ville |
| **Satisfaction calme** | Sondage léger / support tickets | Temps passé search max |
| **Signalements abuse search** | Volume / type | — |

**DECIDE scaler :** si KPIs action réelle ↑ **sans** hausse temps écran search disproportionnée.

---

# 13. Futur (documenté, non implémenté)

| Capacité | Valeur potentielle | Garde-fou |
|----------|-------------------|-----------|
| **Recherche sémantique** | Requêtes naturelles | Explicable, opt-in |
| **Carte interactive** | Explorer géographiquement | Pas gamification territoire |
| **Découverte contextuelle** | « Près de moi maintenant » | Consentement géoloc explicite |
| **IA locale** | Synthèse « quoi faire samedi » | Pas remplacement feed |
| **Exploration audio** | Parcours quartier | Accessibilité |
| **Recommandations douces** | Suggestions personnalisées | **Transparentes**, désactivables |

Aucun de ces items ne déclenche BUILD sans nouveau PRD + gates §13.

---

# 14. Conclusion

## 14.1 Vision Yunicity de la découverte locale

Yunicity aide les gens à **mieux voir et parcourir leur ville** — pas à rester collés à un moteur de distraction. Le **feed** reste le battement quotidien de la mémoire collective. La **recherche** et la **découverte éditoriale** sont des **outils intentionnels** : trouver un moment, un lieu, un quartier, une tribu ouverte, une offre — toujours **ancrés Reims (ou ville choisie)**, toujours **compréhensibles**.

## 14.2 Pourquoi Feature B renforce le produit sans le trahir

- **Complète** les surfaces existantes sans les fusionner.
- **Respecte** les invariants tribu / feed / quartiers.
- **Refuse** la logique attention economy des grands réseaux.
- **Prépare** un partage externe **territorial** (B.2), pas viral hollow.

## 14.3 Condition de succès

> La Feature B réussit si les gens **font plus de choses réelles dans leur ville** grâce à ce qu’ils ont trouvé — pas s’ils **scrollent plus longtemps** dans la recherche.

## 14.4 Prochaine étape (hors B.1)

| Ticket suggéré | Phase | Contenu |
|----------------|-------|---------|
| **B.2** | DESIGN → BUILD | PRD partage + deep links |
| **B.3** | DESIGN | Spec technique index / permissions |
| **B.4** | BUILD gates §13 | API + UI recherche MVP |

---

## Annexe — Cartographie surfaces × découverte

| Surface existante | Découverte via search | Découverte éditoriale | Partage B.2 |
|-------------------|:---------------------:|:---------------------:|:-------------:|
| Feed ville | Posts only | Rail contextuel | Post (sobre) |
| Events | ✅ | Week-end | ✅ P0 |
| Quartiers | ✅ | À explorer | ✅ |
| Organizations | ✅ | Nouveaux lieux | ✅ |
| Offers / Passport | ✅ | Avantages | ✅ |
| Tribus (public) | ✅ fiche | Tribus ouvertes | ✅ fiche |
| Profils publics | ✅ limité | — | Optionnel |
| Flash offers | ✅ tag | — | ✅ |
| Mur tribu | ❌ | ❌ | ❌ contenu |
| Notifications | ❌ | ❌ | — |

---

## Gates PRD §13 (B.1 — DISCOVER/DESIGN)

| Gate | Statut B.1 |
|------|------------|
| Problème et valeur validés | ✅ Question centrale + §1 |
| Scope / exclusions | ✅ §2, §10 |
| Cohérence feed / tribus / quartiers | ✅ §4, §5, annexe |
| Risques et abus | ✅ §9 |
| UX / accessibilité philosophie | ✅ §6, §7 |
| KPIs et rollout | ✅ §11, §12 |
| Pas de BUILD prématuré | ✅ Aucun code |
| Review CTO / produit | ⏳ Validation humaine requise avant B.2/B.3 |

---

*Document vivant — version 1.0 — TICKET B.1 — FEATURE-B RECHERCHE & PARTAGE.*
