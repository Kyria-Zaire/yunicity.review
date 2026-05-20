# PRD-601 — Neighborhoods & Territorial Identity

> **Phase :** DISCOVER → DESIGN  
> **Ticket :** SPRINT-6 / TICKET-601  
> **Workflow :** `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` — **BMAD :** `docs/bmad/BMAD.md`  
> **Ce document ne déclenche aucun code** — il définit la couche « quartiers & territoires » avant tout BUILD.

---

## 0. Métadonnées

| Champ | Valeur |
|-------|--------|
| **ID** | PRD-601 |
| **Nom** | Neighborhoods & Territorial Identity |
| **Statut** | **DESIGN_READY** (DISCOVER + DESIGN terminés pour ce ticket) |
| **Phase officielle** | DISCOVER → DESIGN |
| **Phase BMAD** | — (BUILD = tickets Sprint 6 dérivés) |
| **Sprint** | Sprint 6 — Quartiers & Territoires |
| **Priorité** | **P0** (couche identitaire stratégique) |
| **Auteur** | product-architect + territorial-system-designer + urban-experience-designer + social-product-strategist |
| **Owner technique** | À nommer au kickoff BUILD |
| **Date création** | 2026-05-19 |
| **Dernière mise à jour** | 2026-05-19 |
| **Environnement cible** | dev → recette (pilote Reims) → preprod → prod |

### Dépendances amont (acquis)

| Acquis | Référence |
|--------|-----------|
| Feed citoyen, ville-first | TICKET-402, Sprint 4 |
| Passport, tampons territoriaux, offres | PRD-301, TICKET-302–504 |
| Événements locaux (`district` optionnel déjà en modèle) | TICKET-505 |
| Notifications sociales calmes | TICKET-503 |
| Stabilisation UX / philosophie slow local | TICKET-506 |
| Profils, organizations vérifiées, city | PRD-201 |

### Tickets aval (indicatif — hors scope PRD-601)

| Domaine | Objectif prévu |
|---------|----------------|
| TICKET-602+ | Modèle `neighborhoods` + migrations + seed Reims pilote |
| TICKET-603+ | API lecture publique + rattachement contenus (feed, events, offers) |
| TICKET-604+ | UX découverte quartier (web/mobile) |
| TICKET-605+ | Passport — souvenirs / quartiers explorés |
| TICKET-606+ | Créateurs locaux × quartier (press_creator) |
| TICKET-607+ | Modération & anti-spam territorial |

### Exclusions explicites (ce PRD)

| Exclusion | Note |
|-----------|------|
| Code, migrations, endpoints | Tickets BUILD uniquement |
| Maquettes Figma finales | Spec UX §8 ; design system existant |
| Groupes privés quartier, messagerie de quartier | Hors vision — voir §11 |
| Cartes interactives temps réel, audio walks | Future opportunities §12 |
| 100 villes / quartiers auto-générés | Rollout progressif §10 |

---

# 1. Vision produit

## 1.1 Pourquoi les quartiers existent dans Yunicity

Yunicity est en train de devenir une **mémoire sociale locale** : fil, passport, tampons, événements, offres. Ces briques racontent *ce qui se passe* et *ce que l’on a vécu* — mais pas toujours *où* cela prend sens émotionnellement dans la ville.

Les **quartiers** apportent une **couche de contexte local** :

- Donner une **ambiance** aux contenus (un café-rencontre n’est pas la même chose à Boulingrin qu’à la gare).
- Aider à **découvrir la ville** par morceaux humains, pas par une carte administrative froide.
- Renforcer le **sentiment d’appartenance calme** : « je connais un peu ce coin », sans obligation d’y vivre ou d’y adhérer.

## 1.2 Ce que le quartier n’est PAS

| Le quartier n’est pas | Le quartier est |
|----------------------|-----------------|
| Une communauté fermée avec mur et adhésion | Un **contexte éditorial** et géographique léger |
| Un groupe Facebook de quartier | Une **étiquette d’ambiance** sur le fil et les moments |
| Un clan ou une tribu compétitive | Une **facette de la ville vécue** |
| Une frontière sociale agressive | Une **invitation à explorer** |

## 1.3 Résultat attendu (état observable post-MVP)

- Un citoyen à Reims voit **d’où vient** un moment local (quartier + ville) sans être enfermé dans un silo.
- Il peut **explorer** 3–8 quartiers pilotes avec une identité visuelle sobre (nom, description, ambiance).
- Son **Passport** évoque les quartiers **visités / vécus** comme souvenirs, pas comme un jeu à 100 %.
- Les **créateurs locaux** peuvent ancrer un récit dans un quartier sans devenir des influenceurs de territoire.

**Mantra produit :** *« La ville par morceaux humains, pas par tribus. »*

---

# 2. Philosophie territoriale

## 2.1 Principes fondateurs

| Principe | Signification produit |
|----------|----------------------|
| **Territoire émotionnel** | Le quartier évoque une atmosphère (calme, vivant, culturel) avant une statistique |
| **Mémoire locale** | Les passages, tampons et événements s’inscrivent dans une histoire de lieux |
| **Exploration humaine** | Découvrir = marcher, rencontrer, assister — pas scroller à l’infini |
| **Ville vécue** | Reims n’est pas une liste de POI ; c’est une succession de quartiers ressentis |
| **Proximité douce** | La géographie sert la confiance, pas la surveillance ni la peur du voisin |

## 2.2 Ce que Yunicity refuse explicitement

| Refus | Raison |
|-------|--------|
| **Compétition entre quartiers** | Divise la ville, gamifie l’identité, attire le clash |
| **Classement / leaderboard territorial** | Crée des gagnants et des perdants dans l’espace public |
| **Tribalisation** | Replie communautaire, bulles, « nous vs eux » |
| **Addiction territoriale** | Notifications « ton quartier brûle », FOMO hyperlocal |
| **Nextdoor anxiogène** | Peur du voisin, délation, tonalité alarmiste |

## 2.3 Lien avec la doctrine Yunicity

Alignement avec TICKET-506 et la vision CTO : **sécurité > intégrité > architecture > UX > scalabilité > vitesse**.  
La couche quartier doit **augmenter la crédibilité territoriale** sans augmenter le bruit cognitif.

---

# 3. Modèle de quartier MVP

## 3.1 Entité conceptuelle `Neighborhood`

Champ proposé pour le MVP (spec BUILD — pas d’implémentation ici) :

| Champ | Type (concept) | Règles |
|-------|----------------|--------|
| `id` | UUID | Stable |
| `city` | string | Ex. `Reims` — ville parente obligatoire |
| `district` | string \| null | Regroupement optionnel (ex. « Centre », « Ouest ») — **administratif léger**, pas affiché en premier |
| `slug` | string | URL-safe, unique par ville : `boulingrin`, `centre-ville` |
| `display_name` | string | Ex. « Boulingrin » — humain, court |
| `description` | text | 2–4 phrases éditoriales, ton calme |
| `ambiance` | enum léger | Ex. `calm`, `lively`, `cultural`, `student`, `green` — **une** ambiance dominante MVP |
| `cover_image_url` | string \| null | Photo locale, pas stock générique |
| `accent_hint` | string \| null | Teinte **très** subtile (ex. `#EEF0FF`) — jamais de gradient agressif |
| `is_active` | bool | Quartiers pilotes actifs uniquement |
| `display_order` | int | Ordre éditorial dans la ville |

**Pas de branding agressif :** pas de logo quartier obligatoire, pas de mascotte, pas de slogan marketing en CAPS.

## 3.2 Relation ville ↔ quartier

```text
City (Reims)
 └── District (optionnel, ex. « Centre »)
      └── Neighborhood (Boulingrin, Cathédrale, …)
```

MVP : **8 quartiers pilotes max** à Reims, validés éditorialement (équipe produit + terrain).

## 3.3 Rattachement des contenus existants

| Entité existante | Lien quartier MVP |
|------------------|-------------------|
| `Post` (feed) | `neighborhood_id` optionnel — dérivé du lieu ou saisi org |
| `LocalEvent` | `neighborhood_id` + `district` legacy conservé pour compat |
| `Organization` | `neighborhood_id` optionnel (adresse / quartier déclaré) |
| `PartnerOffer` | Hérite de l’organization |
| Tampons / redemptions | Agrégation « quartier visité » via organization |

**Règle :** un contenu peut exister **sans** quartier (ville seule) — le quartier **enrichit**, il ne **bloque** pas.

---

# 4. Rôle dans le feed

## 4.1 Principe : contextualiser, pas enfermer

| Comportement | MVP |
|--------------|-----|
| Fil par défaut | **Ville-first** (inchangé) — quartier en **méta** sur la carte |
| Filtre quartier | Option **douce** : « Voir plus du Boulingrin » — pas filtre par défaut |
| Création post citoyen | Quartier **optionnel** (géoloc approximative ou choix manuel) |
| Post organization / offer / event | Quartier hérité de l’org ou de l’événement |

## 4.2 Présentation UI (spec)

- **Badge discret** sous l’auteur : `Boulingrin · Reims` (pas de drapeau, pas de score).
- **Pas de fil « uniquement mon quartier »** au lancement — évite les bulles.
- **Pas de trending** par quartier.

## 4.3 Équilibre feed

Objectif de densité éditoriale (recette Reims, fil seedé) :

- ~70 % contenu **ville** ou sans quartier explicite
- ~30 % avec quartier visible — pour **apprendre** la lecture territoriale sans saturation

---

# 5. Découverte territoriale

## 5.1 Parcours MVP

| Parcours | Description |
|----------|-------------|
| **Découverte depuis le fil** | Tap sur le badge quartier → fiche quartier (description, ambiance, événements à venir, lieux partenaires) |
| **Exploration ville** | Écran « Reims par quartiers » — grille calme, pas carte plein écran MVP |
| **Événements** | Filtre optionnel par quartier dans la liste événements |
| **Passport** | « Quartiers que vous avez croisés » — liste sobre |

## 5.2 Principes de découverte

- **Douce** : pas de carousel infini, pas de « pour vous » algorithmique territorial MVP.
- **Éditoriale** : ordre choisi (display_order), textes humains.
- **Limitée** : 3 suggestions « à découvrir » max par session — pas d’endless exploration.
- **Réelle** : chaque suggestion mène à un **lieu ou moment** concret (événement, commerce), pas à du contenu vide.

## 5.3 Anti-patterns découverte

| Anti-pattern | Mitigation |
|--------------|------------|
| Carte addictive zoom in/out | Carte statique ou liste MVP ; carte interactive = V2 |
| « Quartiers populaires » | Interdit §11 |
| Notifications « découvre X » en rafale | Max 1 notif territoriale / semaine / utilisateur (hors événement explicite) |

---

# 6. Passport & territoires

## 6.1 Extension conceptuelle du Passport

Le Passport reste **identité citoyenne** ; les quartiers y ajoutent une **couche mémoire** :

| Concept | Description | Ton |
|---------|-------------|-----|
| **Quartiers croisés** | Liste des quartiers où au moins 1 tampon, redemption ou intérêt événement | « Vous avez croisé Boulingrin » |
| **Souvenirs territoriaux** | Agrégation existante (tampons TICKET-504) + contexte quartier | Pas de score |
| **Moments vécus** | Lien vers événements auxquels l’utilisateur a manifesté un intérêt | Chronologie calme |
| **Historique émotionnel** | Copy éditorial : « Votre Reims se construit au fil des passages » | Pas de % complétion |

## 6.2 Ce qui est interdit sur le Passport territorial

- Barre « 100 % du quartier exploré »
- Classement entre citoyens d’un même quartier
- Badges « maître du Boulingrin »
- Comparaison publique des quartiers visités

## 6.3 Lien tampons existants

Les tampons **locaux** (premier lieu, premier scan, flash) restent **mérit-based**.  
Le quartier **contextualise** le tampon (« obtenu chez un partenaire du Boulingrin ») sans nouvelle mécanique de grind.

---

# 7. Créateurs locaux

## 7.1 Rôle des `press_creator` et ambassadeurs

| Rôle | Mission territoriale |
|------|---------------------|
| **press_creator** (tier passport) | Raconter les lieux : portraits, courts formats, regard local |
| **Créateur / org culturelle** | Annoncer et documenter des **moments** quartier (exposition, marché) |
| **Ambassadeur de quartier** (futur, non MVP) | Voix éditoriale validée — pas modérateur communautaire |

## 7.2 Règles produit

- Les créateurs **ancrent** un contenu dans un quartier ; ils ne **possèdent** pas le quartier.
- Pas de compteur d’abonnés quartier, pas de « top creator du coin ».
- Modération identique au reste de la plateforme (signalement, staff).

## 7.3 Différenciation vs influence

| Influence classique | Créateur territorial Yunicity |
|--------------------|------------------------------|
| Maximiser vues | **Documenter** un lieu ou un moment |
| Feed personnel viral | Contenus **liés** à org ou événement vérifié |
| Territoire = audience | Territoire = **cadre narratif** |

---

# 8. UX philosophy

## 8.1 Ton et éditorial

- **Vouvoiement** ou tutoiement cohérent avec le reste du produit (harmonisation TICKET-506).
- Phrases courtes, **pas** de jargon startup (« unlock », « level up your hood »).
- Titres de quartier : noms réels Reims, pas de surnoms moqueurs.

## 8.2 Calme visuel

- Blanc dominant, accent `#2A2FFF` unique (design system).
- Fiche quartier : **respiration** — image cover, titre, 2 paragraphes, sections espacées.
- Pas de compteurs rouges, pas de pastilles « LIVE » quartier.

## 8.3 Anti-noise / anti-chaos

| Éviter | Préférer |
|--------|----------|
| Mur de badges quartier | Une ligne de contexte |
| Feed filtré agressivement | Ville-first + filtre opt-in |
| Mini TikTok géographique | Cartes événement / org existantes |
| Couleurs criardes par quartier | `accent_hint` à peine perceptible |

## 8.4 États UI obligatoires (BUILD)

Chaque écran quartier : **loading**, **empty** (« Ce quartier se réveille bientôt »), **error** + retry, **success** — aligné checklist TICKET-506.

---

# 9. Risques produit

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| **Tribalisation** (« notre quartier ») | Moyenne | Élevé | Pas de groupes, pas de classement ; copy inclusive |
| **Anxiété locale** (crimes, conflits) | Moyenne | Élevé | Pas de fil « alertes quartier » ; modération renforcée |
| **Spam quartier** (orgs / faux lieux) | Moyenne | Moyen | Quartiers assignés staff au seed ; org verified pour offers |
| **Sur-segmentation** | Moyenne | Moyen | Quartier optionnel ; fil ville par défaut |
| **Hyperlocal toxique** (FOMO) | Faible | Élevé | Pas de trending ; notifications limitées |
| **Modération charge** | Moyenne | Moyen | Peu de quartiers pilotes ; signalement existant |
| **Données géo incorrectes** | Élevée | Moyen | Pas de géofence strict MVP ; rattachement éditorial |
| **Dette : `district` vs `neighborhood`** | Élevée | Faible | Migration planifiée ; alias API temporaire |

---

# 10. Rollout strategy

## 10.1 Phases

| Phase | Périmètre | Critère de passage |
|-------|-----------|-------------------|
| **0 — Design** | PRD-601 (ce document) | DESIGN_READY |
| **1 — Reims pilote** | 5–8 quartiers seedés, read-only public | Recette OK checklist |
| **2 — Contenus rattachés** | Events, orgs, offers, feed meta | 50 % contenus pilotes tagués |
| **3 — Passport mémoire** | Quartiers croisés | Pas de régression perf |
| **4 — Créateurs** | press_creator × quartier | Modération stable 2 semaines |
| **5 — Beta terrain** | 30–50 citoyens Reims | KPIs humains §13 positifs |
| **6 — Autre ville** | Repoussé tant que Reims pas sain | Décision DECIDE BMAD |

## 10.2 Quartiers pilotes Reims (proposition éditoriale)

À valider avec le terrain — liste indicative, pas exhaustive :

| Slug | Display name | Ambiance |
|------|--------------|----------|
| `centre-ville` | Centre-ville | lively |
| `boulingrin` | Boulingrin | lively |
| `cathédrale` | Cathédrale & Petit Paris | cultural |
| `gare-champ-de-mars` | Gare & Champ de Mars | calm |
| `croix-rouge` | Croix-Rouge | calm |
| `jean-jaures` | Jean Jaurès | student |
| `claire-marais` | Clairmarais | green |
| `tinqueux` | Tinqueux (périphérie) | calm |

## 10.3 Seed territorial

- Seed **éditorial** (comme `reims_demo_content` TICKET-506), pas génération automatique.
- Comptes démo **dev/recette uniquement** (`APP_ENV` guard existant).
- Contenus exemples par quartier : 1 event, 1 org, 1 post — pas de flood.

## 10.4 Feature flag (BUILD)

- Nom proposé : `neighborhoods_enabled`
- Défaut : `false` en prod jusqu’à fin phase 3 recette.

---

# 11. Exclusions strictes

Les éléments suivants sont **interdits** pour Yunicity (MVP et vision alignée) :

| Interdit | Raison |
|----------|--------|
| Guerres de quartiers, défis inter-quartiers | Division sociale |
| Leaderboard territorial | Compétition toxique |
| Ranking / trending quartiers | FOMO, viralité locale |
| Gamification territoriale agressive | Contredit passport « mémoire » |
| Groupes privés par quartier | Bulles, modération ingérable |
| Stories géographiques | Format addictif, hors slow social |
| Score d’influence quartier | Statut social toxique |
| Dark patterns (notifications culpabilisantes, mur payant quartier) | Confiance |
| Mur d’adhésion « rejoindre le quartier » | Communauté fermée |
| Carte temps réel des citoyens | Vie privée |

Toute demande produit contredisant cette liste nécessite **revue CTO + produit** explicite.

---

# 12. Future opportunities (non MVP)

Documentées pour alignement long terme — **aucun BUILD** dans TICKET-601 :

| Opportunité | Valeur | Garde-fou |
|-------------|--------|-----------|
| **Cartes territoriales** | Orientation douce | Pas de tracking temps réel |
| **Parcours découverte** | « Une après-midi à Boulingrin » | Linéaire, fini, pas infini |
| **Collections locales** | Albums souvenirs passport | Pas de % complétion public |
| **Guides quartier** | Contenu éditorial staff + creators | Pas wiki ouvert non modéré |
| **Audio walks** | Immersion culturelle | Partenariat culturel, pas UGC seul |
| **Creators territorial stories** | Format court ancré lieu | Pas stories infinies type Snapchat |

Priorisation via **DECIDE** BMAD après mesure du MVP Reims.

---

# 13. KPIs humains

Métriques orientées **valeur territoriale**, pas temps d’écran maximal :

| KPI | Définition | Cible indicative (beta Reims) | Anti-KPI |
|-----|------------|-------------------------------|----------|
| **Quartiers explorés** | Nombre de fiches quartier distinctes consultées / utilisateur actif / mois | ≥ 2 | Max scroll sans action |
| **Événements découverts via quartier** | Intérêt événement après vue fiche quartier | ≥ 15 % des intérêts | Notifications spam |
| **Interactions locales** | Redemptions + intérêts events + commentaires sur contenus tagués quartier | Croissance lente stable | Pic artificiel seed |
| **Rétention calme** | D7 / D30 sans hausse des signalements | D30 ≥ baseline Sprint 5 | D1 only via notifs |
| **Diversité exploration** | Entropie des quartiers visités (pas 95 % sur un seul) | ≥ 2 quartiers pour 60 % des actifs | Mono-quartier bulle |

**Ne pas optimiser :** temps passé sur carte, nombre de posts par quartier/jour, « engagement » brut sans qualité.

---

# 14. Conclusion stratégique

## Pourquoi les quartiers peuvent devenir une couche identitaire forte

Yunicity a déjà les **gestes** de la vie locale (fil, passport, tampons, événements, offres). Il manque le **fil narratif spatial** : comprendre *dans quel coin de la ville* ces gestes prennent sens.

Une architecture quartiers **humaine, calme et culturelle** permet de :

1. **Différencier** Yunicity des réseaux nationaux et des apps d’alerte quartier.
2. **Renforcer** la crédibilité des partenaires (« ancrés » dans un lieu réel).
3. **Donner envie d’explorer** Reims sans compétition ni repli tribal.
4. **Préparer** l’expansion ville par ville avec un modèle éditorial reproductible.

**Condition de succès :** le quartier reste une **couche de contexte** visible mais jamais une **frontière**. Si les KPIs montrent une bulle mono-quartier ou une hausse des signalements, la fonctionnalité se **restreint** (DECIDE : repousser ou simplifier) plutôt que de scaler.

> **Yunicity doit devenir une cartographie émotionnelle de ville — pas un réseau tribal local.**

---

# Annexes

## A. User stories (résumé BUILD)

### US-601-1 — Contexte quartier sur le fil

En tant que **citoyen**, je veux **voir de quel quartier provient un moment local**, afin de **mieux situer l’information sans changer de fil**.

### US-601-2 — Explorer un quartier

En tant que **citoyen**, je veux **ouvrir une fiche quartier sobre**, afin de **découvrir événements et lieux de ce coin**.

### US-601-3 — Mémoire passport

En tant que **citoyen avec passport actif**, je veux **revoir les quartiers que j’ai croisés**, afin de **donner du sens à mes passages locaux** — sans score public.

### US-601-4 — Ancrage partenaire

En tant que **organization vérifiée**, je veux **associer mon commerce à un quartier**, afin que **les citoyens me trouvent dans le bon contexte territorial**.

### US-601-5 — Récit créateur

En tant que **press_creator**, je veux **publier un contenu ancré dans un quartier**, afin de **raconter un lieu** — sans devenir une influence métrique.

## B. Architecture conceptuelle (aperçu BUILD)

```text
┌─────────────┐     ┌──────────────────┐
│   City      │────▶│  Neighborhood    │
│  (Reims)    │     │  slug, ambiance  │
└─────────────┘     └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
    ┌─────────┐        ┌───────────┐       ┌────────────┐
    │  Post   │        │LocalEvent │       │Organization│
    │ (feed)  │        │           │       │ + Offer    │
    └─────────┘        └───────────┘       └────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Passport memory  │
                    │ (quartiers       │
                    │  croisés)        │
                    └─────────────────┘
```

## C. Open questions

| # | Question | Décision | Date |
|---|----------|----------|------|
| 1 | Liste finale des 5–8 quartiers Reims | En attente validation terrain | — |
| 2 | Filtre quartier dans le fil : opt-in dès MVP ou phase 2 ? | Recommandation : phase 2 | — |
| 3 | Géoloc citoyen pour auto-tag quartier ? | Recommandation : hors MVP (vie privée) | — |
| 4 | `district` legacy : déprécier ou mapper 1:1 ? | À trancher au TICKET-602 | — |

## D. Historique

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-05-19 | TICKET-601 | Création PRD — DISCOVER + DESIGN |

---

# 15. BMAD — gates BUILD (à cocher avant premier commit code)

> Ne pas cocher dans TICKET-601. Référence pour tickets Sprint 6 BUILD.

- [ ] PRD validé (sections 1–14)
- [ ] Architecture identifiée (Annexe B + schémas API)
- [ ] Risques identifiés (§9)
- [ ] Permissions / authZ définies (lecture publique quartiers ; écriture staff / org)
- [ ] Endpoints + contrats définis
- [ ] Modèle DB + migration planifiés (`neighborhoods`, FK optionnelles)
- [ ] Checklist sécurité : pas de géoloc citoyen brute stockée MVP
- [ ] Seed Reims éditorial + garde-fou env (dev/recette)
- [ ] Tests : lecture quartier, rattachement event, pas de fuite cross-ville

### Prompts agents (BUILD)

- `docs/ai/prompts.md` — Senior Implementation, API Architect, UI Builder
- Revue : `docs/ai/security-checklist.md` + règle `05-code-review`
