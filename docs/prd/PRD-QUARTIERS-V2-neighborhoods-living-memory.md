# PRD-QUARTIERS-V2 — Mémoire vivante des quartiers

> **Workflow** : `docs/workflow/YUNICITY-OFFICIAL-WORKFLOW.md` — gates BUILD : §13 + `docs/bmad/BMAD.md`  
> **Héritage** : `docs/prd/PRD-601-neighborhoods-territorial-identity.md` (couche V1 — catalogue + fiche)  
> **Local Video** : `docs/prd/PRD-CREATORS-V2-local-video.md` (teasers hero — C2-S5)  
> **DISCOVER** : validé Founder 2026-06-13 — **codage interdit** tant que ADR + DESIGN + gates §13 non cochés.

---

## 0. Métadonnées

| Champ | Valeur |
|---|---|
| ID | PRD-QUARTIERS-V2 |
| Nom | Quartiers V2 — mémoire vivante |
| Statut | **PRD VALIDÉE** — ADR ✅ (`docs/architecture/ADR-QUARTIERS-V2.md`) |
| Phase officielle | DISCOVER ✅ → DESIGN (ADR + maquettes) |
| Phase BMAD | — (BUILD = Q2-S1 → Q2-S4) |
| Priorité | **P0** — différenciation stratégique post Local Video |
| Auteur | Founder (Kyria) + CTO |
| Owner technique | À nommer au kickoff ADR |
| Date création | 2026-06-13 |
| Dernière mise à jour | 2026-06-13 |
| Sprint cible | Q2-S1 → Q2-S4 (voir §10) |
| Environnement cible | dev → recette (Reims) → preprod → prod |

### Positionnement produit (validé)

> **Quartiers V2 transforme chaque quartier en mémoire vivante de la ville : un lieu où l'on comprend son histoire, découvre ce qu'il s'y passe aujourd'hui et ressent qu'on en fait partie.**

### Parcours émotionnel cible

```txt
"Je connais cet endroit."
↓
"Je comprends cet endroit."
↓
"J'ai envie d'y aller."
↓
"J'en fais partie."
```

### Roadmap feature

```txt
FEATURE-QUARTIERS-V2
├─ DISCOVER     ✅
├─ PRD          ✅ (ce document)
├─ ADR          ✅
├─ DESIGN       🟢 EN REVIEW (`docs/quartiers/DESIGN-QUARTIERS-V2.md`)
├─ BUILD        🔒
└─ PILOT        🔒
```

### Décisions Founder verrouillées

| # | Question | Décision | Implication produit |
|---|----------|----------|---------------------|
| Q1 | Structure vs vocabulaire | **C — Hybride** | 12 quartiers administratifs + alias habitants en front |
| Q2 | Histoire | **B + C** | Texte long éditorial + timeline interactive |
| Q3 | Contributions | **B** | Soumissions citoyennes, publication après validation admin |
| Q4 | Vidéos | **B** | Vidéos locales visibles dès le hero (pas en bas de page) |
| Q5 | Moods | **B → C** | Moods éditoriaux au lancement ; dynamiques plus tard |
| Q6 | Signature | **C** | Faire ressentir l'appartenance (« Pourquoi les Rémois aiment… ») |

---

# 1. Résumé Produit

## Objectif

Passer d'une **fiche quartier statique** (description, lieux, événements) à une **expérience éditoriale vivante** qui raconte Reims quartier par quartier, en combinant histoire, vidéos locales, communauté et actions Passport.

## Problème

Aujourd'hui (`/neighborhoods/{slug}`) :

```txt
Quartier → description courte → lieux → événements → infos pratiques
```

**Limites :**

- Peu émotionnel, peu différenciant
- Pas de sentiment d'appartenance
- Pas d'histoire ni de mémoire collective
- Vidéos locales reléguées en rail secondaire (post C2-S5)
- 6 quartiers seedés — couverture incomplète de Reims
- Pas de voix des habitants

## Pourquoi cette feature existe

- **Problème utilisateur** : un Rémois ne *ressent* pas le quartier ; il consulte une fiche utilitaire.
- **Problème business** : après Local Video, Yunicity doit **ancrer** les vidéos dans un récit territorial — sinon TikTok reste interchangeable.
- **Impact attendu** : temps passé fiche quartier, multi-quartiers consultés, CTR « Y aller », contributions citoyennes, rétention pilote Reims.

## Objectifs (O1–O3)

| ID | Objectif | Formulation |
|----|----------|-------------|
| O1 | Faire découvrir | Comprendre **pourquoi** ce quartier existe et ce qu'il raconte |
| O2 | Faire agir | Avoir envie **d'y aller** (lieux, moments, Passport) |
| O3 | Faire appartenir | Ressentir : **« ce quartier est aussi le mien »** |

## Résultat attendu (MVP Reims)

Un Rémois ouvrant `/neighborhoods/boulingrin` peut répondre aux 5 questions d'acceptation (§4.3) sans quitter la fiche.

---

# 2. Contexte

## Contexte business

- **Pilote Reims MEASURE** actif en parallèle — Quartiers V2 BUILD ne remplace pas l'écoute terrain ; les KPIs pilote informent Q2-S3/S4.
- **Effet stratégique** : Local Video montre des vidéos ; Quartiers V2 **raconte une ville** — combinaison impossible à copier rapidement (Maps, TikTok, Wikipédia isolés).

## Contexte technique (état V1)

| Existant | Fichiers / refs | Rôle V1 |
|----------|-----------------|---------|
| Modèle `Neighborhood` | `backend/app/models/neighborhood.py` | slug, display_name, short_description, ambiance, cover, géo |
| Seed 6 quartiers | `reims_neighborhoods.py` | Reims pilote partiel |
| API quartiers | `/api/v1/neighborhoods` | Liste + détail public |
| Fiche web | `neighborhood-detail-screen.tsx` | Hero, tabs, lieux, moments, rail vidéo (C2-S5) |
| Local Video teasers | `LocalVideoTeaserSection` | Max 3, thumbnail → `/videos?video=` |
| Tribus, events, places, Passport | hooks contexte quartier | Agrégation existante |

**Manques V2 :** alias, histoire longue, timeline, moods éditoriaux, contributions modérées, hero vidéo-first, 12 quartiers, section appartenance.

## Dépendances

| Domaine | Dépend de | Bloquant ? | Notes |
|---------|-----------|------------|-------|
| auth | JWT citoyen | oui | Contributions, favoris futurs |
| neighborhoods V1 | PRD-601 / TICKET-602 | oui | Extension modèle, pas remplacement |
| local video | PRD-CREATORS-V2 | oui | Hero vidéos — teasers existants |
| cultural places | WEB-MAP-03 | non | Rail « lieux emblématiques » |
| events / feed | TICKET-505+ | non | Section « aujourd'hui » |
| tribus | PRD tribus | non | Section vie locale |
| admin modération | ADMIN-V1 | oui (Q2-S4) | Validation contributions |
| médias | ADR assets quartiers | oui (Q2-S1) | Images hébergées Yunicity |
| passport / offres | PRD-301 | non | Section explorer |

## Risques connus

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Dette contenu (12 quartiers × histoire) | Élevée | Élevé | Rédaction éditoriale Q2-S1 avant BUILD UI ; Boulingrin + Centre-ville pilotes |
| Hotlink / droits images | Moyenne | Élevé | ADR médias — assets hébergés, pas Bing/iStock/presse |
| Contributions abusives / PII | Moyenne | Élevé | Validation admin obligatoire MVP ; pas de commentaires publics |
| Scope creep (votes, IA, wiki) | Moyenne | Moyen | Hors scope §4.2 verrouillé |
| Performance fiche (N+1 agrégats) | Moyenne | Moyen | Endpoint detail enrichi + cache recette |
| Conflit PRD-601 (quartier = contexte léger) | Faible | Moyen | V2 **étend** sans devenir groupe Facebook — mantra conservé |

---

# 3. User Stories

## Story 1 — Découvrir un quartier

En tant que **citoyen rémois**  
Je veux **ouvrir la fiche Boulingrin et comprendre son histoire et son ambiance**  
Afin de **décider si j'ai envie d'y passer ma journée**

### Critères d'acceptation

- [ ] Hero affiche nom officiel + alias habitants + moods éditoriaux
- [ ] Section histoire + timeline navigable
- [ ] Au moins 1 vidéo locale visible dans le hero (si disponible)
- [ ] États loading / empty / error en français

---

## Story 2 — Voir le quartier vivant

En tant que **citoyen**  
Je veux **voir ce qui se passe aujourd'hui dans le quartier**  
Afin de **passer à l'action (moment, lieu, vidéo)**

### Critères d'acceptation

- [ ] Section « Ce qu'il se passe aujourd'hui » : vidéos (max 3 hero), moments à venir
- [ ] CTA cohérents avec Local Video (`/videos?video=`)
- [ ] CTR mesurable vers « Y aller » / lieux / events

---

## Story 3 — Explorer et profiter

En tant que **citoyen**  
Je veux **trouver lieux, partenaires et offres Passport du quartier**  
Afin de **concrétiser ma sortie**

### Critères d'acceptation

- [ ] Section « Explorer le quartier » : lieux culturels, partenaires, offres Passport
- [ ] Liens vers fiches lieu / partenaire / passport

---

## Story 4 — Ressentir l'appartenance

En tant que **citoyen**  
Je veux **lire pourquoi les Rémois aiment ce quartier**  
Afin de **me sentir connecté à la ville**

### Critères d'acceptation

- [ ] Section « Pourquoi les Rémois aiment {quartier} » avec contenu éditorial validé
- [ ] Anecdotes citoyennes modérées (Q2-S4) affichées si approuvées

---

## Story 5 — Contribuer (Q2-S4)

En tant que **habitante du quartier**  
Je veux **proposer une anecdote ou un souvenir**  
Afin de **enrichir la mémoire collective**

### Critères d'acceptation

- [ ] Formulaire soumission (texte, quartier, auteur connecté)
- [ ] Statut `pending` jusqu'à validation admin
- [ ] Publication visible uniquement si `approved`
- [ ] Pas de commentaires publics sur les anecdotes (MVP)

---

## Story 6 — Modérer (admin)

En tant qu'**admin Yunicity**  
Je veux **valider ou rejeter les contributions quartier**  
Afin de **garantir qualité et sécurité**

### Critères d'acceptation

- [ ] File admin contributions avec preview
- [ ] Actions approve / reject + motif optionnel
- [ ] Audit trail (qui, quand)

---

# 4. Scope

## 4.1 Inclus MVP (par phase BUILD)

### Q2-S1 — Fondations

- Extension catalogue **12 quartiers administratifs Reims** (6 existants + 6 nouveaux seedés)
- **Alias habitants** (ex. Boulingrin → « Halles du Boulingrin »)
- **Images hébergées** Yunicity (hero + galerie légère)
- **Histoire longue** (HTML/markdown sanitizé côté API)
- **Timeline interactive** (entrées datées ordonnées)

### Q2-S2 — Quartier vivant

- **Hero vidéo-first** (max 3 teasers — réutilisation C2-S5)
- Agrégation **créateurs**, **tribus**, **discussions**, **moments** du quartier
- Réorganisation sections selon wireframe §5

### Q2-S3 — ADN Yunicity

- **Moods éditoriaux** (liste MVP §4.4)
- Section **« Pourquoi les Rémois aiment… »** (contenu staff)
- **Pulse local** / **vie du moment** (agrégats légers — pas d'algorithme)

### Q2-S4 — Participation citoyenne

- **Soumissions habitantes** + **validation admin** + publication
- Préparation **votes futurs** (schéma extensible, UI hors scope)

## 4.2 Hors scope (interdit MVP)

| Exclusion | Note |
|-----------|------|
| Votes citoyens publics | Futur — après pilote |
| Algorithmes de recommandation quartier | Moods éditoriaux only |
| IA générative (histoire, anecdotes) | Contenu humain |
| Commentaires publics sur anecdotes | Modération trop lourde MVP |
| Édition libre type Wikipédia | Contributions modérées uniquement |
| Multi-ville | Reims only |
| Messagerie / groupes privés quartier | Voir PRD-601 §11 |

## 4.3 Critères d'acceptation finaux ( Founder )

Un Rémois ouvrant une fiche quartier V2 doit pouvoir répondre :

1. **Que s'y passe-t-il aujourd'hui ?**
2. **Pourquoi ce quartier est important ?**
3. **Qu'est-ce que je peux y faire ?**
4. **Qui y vit et l'anime ?**
5. **Ai-je envie d'en faire partie ?**

## 4.4 Definition of Done (feature complète)

- [ ] 12 quartiers Reims avec contenu éditorial minimum (histoire + hero image)
- [ ] Boulingrin + Centre-ville **reference implementations** complètes
- [ ] Tests API quartiers enrichis + modération contributions
- [ ] Checklist sécurité si contributions PII
- [ ] Copy UI français — `docs/ai/frontend-design-system.md` pour web P1
- [ ] Migrations Alembic + seed idempotent
- [ ] QA recette : parcours Stories 1–4

---

# 5. UX / UI

## 5.1 Expérience cible — `/neighborhoods/boulingrin`

### HERO

```txt
Boulingrin
Quartier officiel · Alias : Halles du Boulingrin
Gourmand • Convivial • Vivant
[ vidéos locales — max 3 — thumbnail only ]
```

### Sections (ordre cible)

| # | Section | Contenu | Phase |
|---|---------|---------|-------|
| 1 | Ce qu'il se passe aujourd'hui | Vidéos, moments, activités | Q2-S2 |
| 2 | Histoire du quartier | Texte long + origine / évolution | Q2-S1 |
| 3 | Timeline | 1900 → 1945 → 1980 → Aujourd'hui (ex.) | Q2-S1 |
| 4 | Explorer le quartier | Lieux, partenaires, Passport | Q2-S2 |
| 5 | Vie locale | Tribus, discussions, créateurs | Q2-S2 |
| 6 | Pourquoi les Rémois aiment… | Témoignages validés, anecdotes | Q2-S3/S4 |

### Vidéos (règle C2-S5 réutilisée)

```txt
Hero → max 3 vidéos → thumbnail only → tap → /videos?video={id}
```

Pas de player inline sur la fiche quartier.

### Moods MVP (éditoriaux)

`Étudiant` · `Familial` · `Créatif` · `Festif` · `Calme` · `Gourmand` · `Patrimonial`

Max **3 moods** affichés par quartier au lancement.

## 5.2 États UI obligatoires

| État | Comportement |
|------|--------------|
| loading | Skeleton hero + sections |
| empty vidéos | Hero sans rail ; message discret |
| empty contributions | Section masquée ou copy « Soyez la première voix » |
| error | Message FR + retry |
| quartier inconnu | 404 éditorial |

## 5.3 Plateformes

| Plateforme | Priorité | Notes |
|------------|----------|-------|
| Web Next.js | **P0** | Pilote Reims |
| Admin | **P0** (S4) | Modération contributions |
| Mobile Expo | P1 | Parité post web pilote |

## 5.4 Maquettes

À produire en phase **DESIGN** — référencer `docs/ai/frontend-design-system.md` + skill impeccable.

---

# 6. Architecture Technique (orientations ADR)

> **ADR obligatoire avant BUILD** — ce § pose les hypothèses ; l'ADR tranche schéma final, cache, médias.

## 6.1 Vue d'ensemble

```txt
[Web /neighborhoods/{slug}]
    → GET /api/v1/neighborhoods/{slug}  (NeighborhoodDetailResponse — ADR-03)
        → NeighborhoodDetailService
            → neighborhoods + aliases + story + timeline + moods
            → local_videos feed filter (neighborhood_slug)
            → events / places / tribes / creators (agrégats existants)
            → contributions (approved only)
```

## 6.2 Modèle de données (proposition)

### Extension `neighborhoods`

| Colonne | Type | Notes |
|---------|------|-------|
| `long_description` | text | Histoire longue (sanitized) |
| `why_locals_love` | text | Section éditoriale Q2-S3 |
| `hero_image_url` | varchar | Asset Yunicity (remplace hotlink) |
| `official_label` | varchar | Ex. « Quartier officiel » |
| `mood_tags` | jsonb / table liaison | Moods éditoriaux |

### Nouvelle entité `neighborhood_aliases`

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | UUID PK | |
| `neighborhood_id` | UUID FK | |
| `alias` | varchar | Ex. « Halles du Boulingrin » |
| `is_primary` | bool | Alias principal affiché hero |

### Nouvelle entité `neighborhood_timeline_entries`

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | UUID PK | |
| `neighborhood_id` | UUID FK | |
| `year` | int | Tri principal |
| `title` | varchar | |
| `body` | text | |
| `sort_order` | int | |

### Nouvelle entité `neighborhood_contributions`

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | UUID PK | |
| `neighborhood_id` | UUID FK | |
| `author_user_id` | UUID FK | |
| `body` | text | Anecdote / souvenir |
| `status` | enum | `pending` / `approved` / `rejected` |
| `reviewed_by` | UUID nullable | |
| `reviewed_at` | timestamptz nullable | |

## 6.3 Endpoints (indicatif)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/neighborhoods/{slug}` | public | Détail enrichi V2 (`NeighborhoodDetailResponse`) |
| GET | `/neighborhoods` | public | Liste 12 quartiers + moods |
| POST | `/neighborhoods/{slug}/contributions` | user | Soumission anecdote |
| GET | `/admin/neighborhood-contributions` | admin | File modération |
| PATCH | `/admin/neighborhood-contributions/{id}` | admin | Approve / reject |

## 6.4 Images — règles

```txt
Interdit : Bing, iStock, hotlink presse
Obligatoire : assets hébergés Yunicity (CDN / bucket — voir ADR)
```

## 6.5 Quartiers — catalogue 12

**Seedés aujourd'hui (6) :** centre-ville, saint-remi, clairmarais, cernay, boulingrin, croix-rouge.

**Additionnels verrouillés ADR-02 (6) :**

| Slug | Display name |
|------|--------------|
| `murigny` | Murigny |
| `jean-jaures` | Jean-Jaurès |
| `la-neuvillette` | La Neuvillette |
| `orgeval` | Orgeval |
| `chemin-vert` | Chemin-Vert |
| `maison-blanche` | Maison-Blanche |

> Géolocalisation seed : Q2-S1-02 — voir `docs/architecture/ADR-QUARTIERS-V2.md`.

### Exemples alias (hybride Q1)

| Quartier officiel | Alias habitants |
|-------------------|-----------------|
| Centre-ville | Cathédrale, Place d'Erlon |
| Boulingrin | Halles du Boulingrin |

---

# 7. Sécurité & permissions

| Surface | Règle |
|---------|-------|
| Lecture fiche | Public (comme V1) |
| Contributions | Auth obligatoire ; rate limit |
| Modération | `MODERATOR` / `CITY_ADMIN` / `SUPER_ADMIN` |
| PII dans anecdotes | Modération + signalement ; pas de téléphone/email en clair |
| IDOR contributions | Auteur voit ses pending ; public voit approved only |
| XSS histoire longue | Sanitization serveur (HTML subset) |

Checklist : `docs/ai/security-checklist.md` avant merge BUILD.

---

# 8. KPIs

| Domaine | Métrique | Cible MVP |
|---------|----------|-----------|
| Découverte | Temps moyen fiche quartier | **> 2 min** |
| Action | CTR « Y aller » / lieux | **> 15 %** |
| Communauté | Users consultant ≥ 2 quartiers / semaine | **≥ 30 %** |
| Engagement | Users regardant une vidéo depuis fiche quartier | **≥ 20 %** |
| Contenu | Quartiers avec histoire + timeline complètes | **12/12** (rollout progressif OK) |
| Contributions | Anecdotes approuvées / mois pilote | Baseline MEASURE |

Instrumentation : aligner avec `FEATURE-PILOT-REIMS-MEASURE` — events à définir en ADR.

---

# 9. Tests

| Niveau | Couverture |
|--------|------------|
| API | detail V2, aliases, timeline, contributions CRUD + modération |
| Unit | présenter moods, ordre sections, filter vidéos |
| E2E | Boulingrin — hero vidéo, histoire, CTA lieu |
| Sécurité | IDOR, XSS, rate limit contributions |

---

# 10. Roadmap BUILD (tickets)

## Q2-S1 — Fondations

| Ticket | Livrable |
|--------|----------|
| Q2-S1-01 | Migration modèle + aliases + timeline |
| Q2-S1-02 | Seed 12 quartiers + contenu éditorial Boulingrin + Centre-ville |
| Q2-S1-03 | API detail enrichi + images hébergées |
| Q2-S1-04 | Admin seed / édition histoire (minimal) |

## Q2-S2 — Quartier vivant

| Ticket | Livrable |
|--------|----------|
| Q2-S2-01 | Hero vidéo-first (refactor `neighborhood-detail-screen`) |
| Q2-S2-02 | Section « Aujourd'hui » (vidéos + moments) |
| Q2-S2-03 | Sections explorer + vie locale (tribus, créateurs, discussions) |

## Q2-S3 — ADN Yunicity

| Ticket | Livrable |
|--------|----------|
| Q2-S3-01 | Moods éditoriaux UI |
| Q2-S3-02 | « Pourquoi les Rémois aiment… » |
| Q2-S3-03 | Pulse local / vie du moment (agrégats) |

## Q2-S4 — Contributions

| Ticket | Livrable |
|--------|----------|
| Q2-S4-01 | POST contribution + statuts |
| Q2-S4-02 | Admin modération file |
| Q2-S4-03 | Affichage anecdotes approuvées sur fiche |

---

# 11. Open questions (pour ADR / DESIGN)

| # | Question | Owner | Échéance |
|---|----------|-------|----------|
| 1 | CDN vs filesystem pour images quartiers | CTO | ADR |
| 2 | ~~Liste 6 quartiers additionnels~~ | — | **Résolu ADR-02** |
| 3 | Format histoire longue (MD vs HTML rich) | Design + CTO | DESIGN |
| 4 | Parité mobile Expo — sprint ou post-pilote ? | Founder | ADR |
| 5 | Analytics events quartiers V2 | CTO | ADR |

---

# 12. Historique

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-06-13 | Founder + CTO | DISCOVER validé — décisions Q1–Q6 verrouillées |
| 2026-06-13 | Cursor | PRD officielle rédigée |
| 2026-06-13 | CTO | Alignement ADR-02 (12 quartiers) + ADR-03 (endpoint enrichi) |

---

# 13. BMAD — gates BUILD

> **Ne pas coder avant cocher ADR + DESIGN + gates ci-dessous.**

## BUILD — gates (cocher avant premier commit code)

- [x] PRD validé (sections 1–6 complètes)
- [x] ADR architecture (`docs/architecture/ADR-QUARTIERS-V2.md`)
- [ ] DESIGN wireframes / DESIGN.md — `docs/quartiers/DESIGN-QUARTIERS-V2.md` (Founder T1–T5)
- [ ] Architecture identifiée (§6 figée par ADR)
- [ ] Risques identifiés (§2)
- [ ] Permissions / authZ définies (§7)
- [ ] Endpoints + contrats définis (§6.3)
- [ ] Modèle DB + migration planifiés (§6.2)
- [ ] Plan contenu éditorial 12 quartiers (Founder)

## MEASURE — métriques cibles

| Domaine | Métrique | Cible |
|---------|----------|-------|
| Produit | Temps fiche quartier | > 2 min |
| Produit | Multi-quartiers / semaine | ≥ 30 % users |
| Produit | CTR action locale | > 15 % |
| Produit | Vidéo depuis fiche | ≥ 20 % |
| Technique | p95 GET detail quartier | < 500 ms recette |
| Sécurité | Contributions rejetées / abus | monitor |

## ANALYZE → DECIDE (post-pilote quartiers)

- Comparer KPIs vs Local Video seul
- Décision : étendre contenu · accélérer mobile · ouvrir votes citoyens

---

## Verdict

```txt
FEATURE-QUARTIERS-V2
DISCOVER     ✅
PRD          ✅ VALIDÉE
ADR          ✅ APPROVED
DESIGN       🔜 NEXT
BUILD        🔒
```

**Prochaine action :** validation Founder T1–T5 sur `docs/quartiers/DESIGN-QUARTIERS-V2.md` — puis commit groupé PRD + ADR + DESIGN.
