# DESIGN-QUARTIERS-V2 — Mémoire vivante des quartiers

> **Feature** : FEATURE-QUARTIERS-V2  
> **PRD** : `docs/prd/PRD-QUARTIERS-V2-neighborhoods-living-memory.md`  
> **ADR** : `docs/architecture/ADR-QUARTIERS-V2.md`  
> **Phase** : DESIGN (Gate ouvert CTO 2026-06-13)  
> **Codage** : 🔒 BUILD interdit jusqu'à validation Founder T1–T5 de ce document

---

## Statut gates

| Gate | Statut |
|------|--------|
| DISCOVER | ✅ |
| PRD | ✅ |
| ADR | ✅ |
| **DESIGN** | ✅ **APPROVED** — Founder T1–T5 (5/5) 2026-06-13 |
| BUILD | 🟢 AUTORISÉ (Q2-S1-01) |
| COMMIT docs | ⏸ après validation DESIGN |

---

## Question gate DESIGN

> Est-ce qu'un Rémois qui ouvre `/neighborhoods/boulingrin` ressent en **3 secondes** que ce quartier **vit**, comprend **pourquoi il existe**, et a **envie d'y aller** — sans confondre Yunicity avec Wikipédia, Maps ou TikTok ?

**Réponse visée :** oui — hero vidéo-first + moods + CTA « Explorer Boulingrin » placent l'identité territoriale **avant** l'encyclopédie.

---

## Positionnement page

```txt
Feed      → consommation
Videos    → découverte
Passport  → fidélisation
Quartiers → identité   ← page la plus importante de Yunicity
```

Cette page répond à : **« Pourquoi Yunicity existe ? »**

---

## Principes design (non négociables)

1. **Vivant avant encyclopédique** — vidéos et « aujourd'hui » au-dessus de l'histoire longue.
2. **Émotion sobre** — chaleur éditoriale, pas spectacle Instagram ; premium Yunicity (`yunicity-*`).
3. **Une action primaire par hero** — « Explorer {quartier} » (scroll vers explorer / carte).
4. **Pas clone Wikipédia / TripAdvisor / Facebook** — pas de mur de texte, pas d'étoiles, pas de fil commentaires public.
5. **Local Video strict** — teasers thumbnail only, max 3, tap → `/videos?video=` (ADR-07).
6. **Mobile-first 375px** — desktop = colonne éditoriale + rail contexte ; touch ≥ 44px.
7. **Design system** — `docs/ai/frontend-design-system.md` : pas de gradients décoratifs ; scrim `neutral-950/75` sur hero image autorisé pour lisibilité texte (comme lieux culturels).

### Ce qu'on évite

| ❌ | Pourquoi |
|----|----------|
| Page Wikipédia froide | Mur de texte sans respiration |
| Page Instagram | Grille vanity, likes dominants |
| Page TripAdvisor | Étoiles, rankings, promo |
| Page Facebook | Fil commentaires, chaos social |
| Player vidéo inline | Perf + casse ADR-07 |

### Ce qu'on obtient

> Une page qui donne envie de **lever les yeux du téléphone** et redécouvrir sa ville.

---

# DESIGN-01 — Hero vidéo-first

## Objectif

En **< 3 secondes** : « C'est un quartier **vivant**. » (Test Founder **T1**)

## Wireframe — Mobile (375px) — Référence Boulingrin

```
┌─────────────────────────────────────┐
│ ← Quartiers              Partager   │  ← CitizenTopNav (existant)
├─────────────────────────────────────┤
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓  IMAGE HERO (R2, cover)          ▓▓│  ← min-h 240px, object-cover
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓ scrim bas neutral-950/75 (texte)  ▓▓│
│▓                                   ▓▓│
│▓ [Quartier officiel]              ▓▓│  ← badge pill primary soft
│▓ BOULINGRIN                        ▓▓│  ← h1 text-3xl bold white
│▓ Alias · Halles du Boulingrin      ▓▓│  ← text-sm white/80
│▓ Gourmand · Convivial · Vivant     ▓▓│  ← moods, text-xs, séparateur ·
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
├─────────────────────────────────────┤
│ Ce qu'il se passe aujourd'hui       │  ← h2 section, dans hero stack
│ ┌────┐ ┌────┐ ┌────┐               │
│ │thumb│ │thumb│ │thumb│  → scroll   │  ← LocalVideoTeaserRail horizontal
│ │ 3s │ │ 3s │ │ 3s │               │     tap → /videos?video=
│ └────┘ └────┘ └────┘               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │   Explorer Boulingrin           │ │  ← CTA primaire pleine largeur
│ └─────────────────────────────────┘ │
│                                     │
│ « Les halles retrouvent leur        │  ← featured_quote (optionnel, italic)
│   rythme du matin. »                │
└─────────────────────────────────────┘
```

## Wireframe — Desktop (≥ lg, max-w ~1100px)

```
┌──────────────────────────────────────────────────────────────┐
│ Nav horizontale Yunicity                                      │
├───────────────────────────────┬──────────────────────────────┤
│ COLONNE PRINCIPALE (~65%)     │ RAIL DROIT (~35%)            │
│                               │                              │
│ [Hero image 16:9 + overlay]   │ Carte mini quartier          │
│ Titre + alias + moods         │ Stats légères                │
│ Teasers vidéo (3 col grid)    │ CTA Explorer (sticky)        │
│ CTA Explorer                  │ Météo / transports (exist.) │
│                               │ Passport autour              │
├───────────────────────────────┴──────────────────────────────┤
│ Sections DESIGN-02 → 06 (colonne principale full scroll)      │
└──────────────────────────────────────────────────────────────┘
```

## Hiérarchie hero (ordre de lecture)

| Priorité | Élément | Style |
|----------|---------|-------|
| **P1** | Nom quartier | `text-3xl sm:text-4xl font-bold text-white` |
| **P2** | Teasers vidéo | Rail horizontal, badge durée, quartier |
| **P3** | Moods | 2–3 tags max, `text-white/90` |
| **P4** | Alias | Sous-titre « Alias · … » |
| **P5** | CTA Explorer | `yunicityBtnPrimary` |
| **P6** | Citation | `featured_quote`, optionnel |

## Composants prévus (BUILD Q2-S2-01)

```
NeighborhoodDetailScreenV2
├── NeighborhoodV2Hero
│   ├── NeighborhoodV2HeroImage
│   ├── NeighborhoodV2HeroMeta (badge, title, alias, moods)
│   ├── LocalVideoTeaserRail (filter neighborhood, max 3, title custom)
│   ├── NeighborhoodV2ExploreCta
│   └── NeighborhoodV2FeaturedQuote
└── … sections 02–06
```

## Règles vidéo hero

| Règle | Valeur |
|-------|--------|
| Composant | Réutiliser `LocalVideoTeaserRail` + `useLocalVideoTeasers` |
| Max items | 3 |
| Player | **Interdit** |
| Autoplay | **Interdit** |
| Lien | `/videos?video={id}` |
| Si 0 vidéo | Section masquée — hero reste image + moods + CTA |

## Copy UI — Hero

| Clé | Texte |
|-----|-------|
| `NEIGHBORHOOD_V2_OFFICIAL_BADGE` | Quartier officiel |
| `NEIGHBORHOOD_V2_ALIAS_PREFIX` | Alias · {alias} |
| `NEIGHBORHOOD_V2_TODAY_TITLE` | Ce qu'il se passe aujourd'hui |
| `NEIGHBORHOOD_V2_EXPLORE_CTA` | Explorer {name} |
| `NEIGHBORHOOD_V2_SHARE` | Partager |

---

# DESIGN-02 — Histoire

## Objectif

En **~10 secondes** : « Je comprends **son histoire**. » (Test **T2**)

## Wireframe — Mobile

```
┌─────────────────────────────────────┐
│ Histoire du quartier                  │  ← h2, tracking-tight
│ ─────────────────────────────────    │  ← hairline border-neutral-200
│                                     │
│ Des halles au cœur du quotidien       │  ← h3 éditorial (titre chapitre)
│                                     │
│ Depuis le début du XXe siècle,       │  ← long_story, prose readable
│ Boulingrin rassemble marchés,         │     max-w-prose, text-neutral-700
│ terrasses et passages couverts…       │     line-height relaxed
│ (3–5 paragraphes max affichés)        │
│                                     │
│ ┌─ Anecdote mise en avant ─────────┐ │
│ │ 💬 « On venait le dimanche       │ │  ← featured_quote ou pull-quote
│ │    pour le marché aux fleurs. »   │ │     bg-yunicity-primary-soft
│ └───────────────────────────────────┘ │
│                                     │
│ Lire la suite ↓                       │  ← si > 600 caractères (optionnel Q2-S1)
└─────────────────────────────────────┘
```

## Principes typo

- **Pas** de colonne étroite type Wikipédia infobox-first.
- Titre chapitre = une ligne émotionnelle, pas « Présentation ».
- Pull-quote = **une** anecdote max — pas un fil.

## États

| État | UI |
|------|-----|
| loading | Skeleton 4 lignes + bloc quote |
| empty | Section masquée (quartier sans histoire seed) |
| error | Inline retry dans section |

---

# DESIGN-03 — Timeline

## Objectif

**Voir l'évolution** — scan rapide, pas lecture longue.

## Wireframe — Mobile (vertical)

```
┌─────────────────────────────────────┐
│ Frise du quartier                     │
│                                     │
│  ● 1900                             │
│  │  Naissance des Halles            │
│  │  Le marché couvert structure…    │
│  │                                  │
│  ● 1945                             │
│  │  Reconstruction                  │
│  │  …                               │
│  │                                  │
│  ● 1980                             │
│  │  Rénovation et terrasses         │
│  │                                  │
│  ● Aujourd'hui                      │
│     Boulingrin, lieu de rencontre   │
│                                     │
└─────────────────────────────────────┘
```

## Wireframe — Desktop

Timeline verticale **même structure** (pas horizontal carousel — accessibilité clavier).

## Style

| Élément | Token |
|---------|-------|
| Ligne | `border-l-2 border-yunicity-primary/30` |
| Point actif | `bg-yunicity-primary` cercle 10px |
| Année | `font-semibold text-neutral-900` |
| Corps | `text-sm text-neutral-600` |

## Interactions

- Pas de expand/collapse MVP — entrées courtes (title + 2 lignes body max).
- Tap année : scroll doux vers section « Explorer » si entrée liée à un lieu (V2.1 — hors MVP).

## États

| État | UI |
|------|-----|
| empty | « L'histoire détaillée arrive bientôt. » + lien explorer lieux |
| 1 entrée | Afficher quand même (pas masquer) |

---

# DESIGN-04 — Explorer le quartier

## Objectif

En **~20 secondes** cumulées : « Je sais **quoi faire**. » (Test **T3**)

## Structure (3 sous-blocs)

```
┌─────────────────────────────────────┐
│ Explorer Boulingrin                   │  ← ancre CTA hero
│                                     │
│ Lieux emblématiques                   │
│ ┌────────┐ ┌────────┐ → scroll      │  ← réutiliser places rail pattern
│ │ thumb  │ │ thumb  │               │
│ │ Halles │ │ Café X │               │
│ └────────┘ └────────┘               │
│ Voir tous les lieux →               │
│                                     │
│ Partenaires du quartier               │
│ [Partner card compact × 2]            │
│                                     │
│ Avantages Passport                    │
│ [Offer card × 2]                    │
│ Ouvrir mon Passport →               │
└─────────────────────────────────────┘
```

## Principes

- **Action claire** : chaque carte → fiche lieu / partenaire / offre.
- Pas de score, pas de « #1 à Reims ».
- Passport = incitation douce, pas couponing criard.

## Réutilisation V1

- `NeighborhoodDetailPlacesRail` — enrichir titres
- Blocs partenaires / Passport — extraire du right rail mobile vers section principale V2

---

# DESIGN-05 — Vie locale

## Objectif

« Je vois **qui anime** mon quartier. »

## Wireframe

```
┌─────────────────────────────────────┐
│ Vie locale                            │
│                                     │
│ Tribus                                │
│ [Chip tribu] [Chip tribu] →           │
│                                     │
│ Discussions                           │
│ ┌─────────────────────────────────┐ │
│ │ Sujet récent du quartier…       │ │  ← 1–2 cartes max preview
│ │ 12 réponses · il y a 2 h        │ │
│ └─────────────────────────────────┘ │
│ Voir les discussions →              │
│                                     │
│ Créateurs du quartier                 │
│ ┌────┐ ┌────┐                        │
│ │avatar│ │avatar│ + nom              │  ← auteurs vidéos / orgs créateurs
│ └────┘ └────┘                        │
└─────────────────────────────────────┘
```

## Principes

- **Calme** — pas de compteurs vanity agressifs.
- Tribus = invitation rejoindre, pas compétition.
- Si vide : copy invitant (« Le quartier s'éveille — soyez parmi les premiers »).

---

# DESIGN-06 — Pourquoi les Rémois aiment…

## Objectif

En quittant la page : « Je fais **un peu partie** de cet endroit. » (Test **T4**)

## Wireframe

```
┌─────────────────────────────────────┐
│ Pourquoi les Rémois aiment Boulingrin │
│                                     │
│ (Paragraphe éditorial staff —        │
│  why_locals_love, ton chaleureux)   │
│                                     │
│ ─── Témoignages ───                 │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ « J'y retrouve mes voisins       │ │  ← contribution approved
│ │    au marché du samedi. »         │ │     prénom + initiale
│ │  — Camille, habitante             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [ Proposer un souvenir ]            │  ← secondaire, Q2-S4
└─────────────────────────────────────┘
```

## Contributions (Q2-S4)

- Carte témoignage : fond `surface`, pas fil Facebook.
- **Pas** de likes, **pas** de commentaires publics MVP.
- Bouton « Proposer un souvenir » → modal formulaire 40–800 car. → toast « Merci — en revue par l'équipe ».

---

# Navigation & structure page complète

## Ordre sections (scroll unique mobile)

| # | Section | Design | Phase BUILD |
|---|---------|--------|-------------|
| 0 | Hero vidéo-first | DESIGN-01 | Q2-S2 |
| 1 | Histoire | DESIGN-02 | Q2-S1 |
| 2 | Timeline | DESIGN-03 | Q2-S1 |
| 3 | Explorer | DESIGN-04 | Q2-S2 |
| 4 | Vie locale | DESIGN-05 | Q2-S2 |
| 5 | Pourquoi les Rémois aiment… | DESIGN-06 | Q2-S3/S4 |
| — | Localisation / carte | V1 conservé | — |
| — | Infos pratiques | V1 conservé | — |

## Tabs V1 → V2

**Décision design :** supprimer tabs « À propos / À voir / … » au profit d'un **scroll éditorial unique** avec ancres optionnelles sticky sous-nav desktop.

Mobile : pas de tab bar secondaire — scroll naturel.

---

# États globaux page

| État | Comportement |
|------|--------------|
| **loading** | Skeleton hero + 3 sections skeleton |
| **error** | Message FR + Réessayer + Retour quartiers |
| **404** | Quartier introuvable — illustration sobre |
| **partial** | Sections vides masquées individuellement (pas de « vide » global) |

---

# Tests Founder (validation avant BUILD)

Cocher lors review :

| ID | Test | Critère | ☐ |
|----|------|---------|---|
| **T1** | 3 secondes | « C'est un quartier **vivant** » — vidéos ou moods + CTA visibles sans scroll | ✅ |
| **T2** | 10 secondes | « Je comprends **son histoire** » — titre + début histoire ou timeline lisibles | ✅ |
| **T3** | 20 secondes | « J'ai **envie d'y aller** » — lieux / moments / Passport identifiables | ✅ |
| **T4** | En quittant | « Je fais **un peu partie** de cet endroit » — section appartenance ressentie | ✅ |
| **T5** | Sans explication | « Ce n'est **ni** Wikipédia, **ni** Maps, **ni** TikTok » | ✅ |

### Protocole review Founder

1. Ouvrir wireframes Boulingrin (mobile 375px) — ce document.
2. Parcourir mentally hero → histoire → explorer → appartenance.
3. Cocher T1–T5.
4. Si 5/5 → **DESIGN APPROVED** → commit docs groupé → BUILD Q2-S1-01.

---

# Boulingrin — contenu reference design

Contenu éditorial à utiliser pour maquettes haute-fidélité / BUILD seed :

| Champ | Valeur design |
|-------|---------------|
| Nom | Boulingrin |
| Alias | Halles du Boulingrin |
| Moods | Gourmand · Convivial · Vivant |
| Citation hero | « Les halles retrouvent leur rythme du matin. » |
| Titre histoire | Des halles au cœur du quotidien |
| Timeline | 1900 Halles · 1945 Reconstruction · 1980 Terrasses · Aujourd'hui |
| why_locals_love | « On s'y retrouve sans rendez-vous — un café, un marché, un sourire. » |

---

# Accessibilité & responsive

| Règle | Détail |
|-------|--------|
| Contraste hero | Texte blanc sur scrim `neutral-950/75` — AA |
| Focus | Ordre logique : CTA → teasers → sections |
| Touch | Teasers min 44px hauteur tap |
| Reduced motion | Pas d'auto-scroll timeline |
| Desktop | `places-shell-grid` ou équivalent — colonne + rail |

---

# Mapping PRD / ADR ↔ Design

| Réf | Section design |
|-----|----------------|
| PRD Story 1 Découvrir | DESIGN-01, 02, 03 |
| PRD Story 2 Vivant | DESIGN-01, 05 |
| PRD Story 3 Explorer | DESIGN-04 |
| PRD Story 4 Appartenir | DESIGN-06 |
| PRD Story 5–6 Contributions | DESIGN-06 modal Q2-S4 |
| ADR-03 Detail API | Toutes sections = clés JSON |
| ADR-07 Local Video | DESIGN-01 teasers |

---

# Arborescence composants BUILD (cible)

```
frontend/apps/web/components/neighborhoods/v2/
├── neighborhood-v2-hero.tsx
├── neighborhood-v2-history-section.tsx
├── neighborhood-v2-timeline-section.tsx
├── neighborhood-v2-explore-section.tsx
├── neighborhood-v2-local-life-section.tsx
├── neighborhood-v2-belonging-section.tsx
├── neighborhood-v2-contribution-modal.tsx      (Q2-S4)
└── neighborhood-detail-screen-v2.tsx           (orchestrateur)

frontend/packages/utils/src/
└── neighborhood-v2-presenter.ts                (moods, copy, section order)
```

Hook : `useNeighborhoodDetailV2(slug)` → `GET /neighborhoods/{slug}` enrichi.

---

# Prochaines étapes

```txt
DESIGN doc (ce fichier)        🟢 EN REVIEW Founder
↓
Validation Founder T1–T5       ☐
↓
COMMIT groupé PRD + ADR + DESIGN
↓
BUILD gate ouvert
↓
Q2-S1-01 (migration + seed)
↓
Q2-S2-01 (hero + sections — implémenter DESIGN-01 à 06)
```

### Commit prévu post-validation

```bash
git add docs/prd/PRD-QUARTIERS-V2-neighborhoods-living-memory.md \
        docs/architecture/ADR-QUARTIERS-V2.md \
        docs/architecture/README.md \
        docs/quartiers/DESIGN-QUARTIERS-V2.md

git commit -m "docs(neighborhoods): define Quartiers V2 product and architecture"
git push origin main
```

---

# Historique

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-06-13 | Founder + CTO | Brief DESIGN-01 à 06 + tests T1–T5 |
| 2026-06-13 | Cursor | Wireframes mobile/desktop, états, Boulingrin ref, composants BUILD |

---

# Verdict (à compléter Founder)

```txt
FEATURE-QUARTIERS-V2
DISCOVER     ✅
PRD          ✅
ADR          ✅
DESIGN       ✅ APPROVED (Founder 2026-06-13, T1–T5 5/5)
BUILD        🟢 Q2-S1-01
```

**Signature Founder :** Kyria — **Date :** 2026-06-13
