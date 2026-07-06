# DESIGN-CREATORS-V2 — Local Video

> **Feature** : FEATURE-CREATORS-V2  
> **PRD** : `docs/prd/PRD-CREATORS-V2-local-video.md`  
> **ADR** : `docs/architecture/ADR-CREATORS-V2-local-video-media.md`  
> **Phase** : DESIGN (Gate ouvert CTO 2026-06-12)  
> **Codage** : 🔒 BUILD interdit jusqu'à validation Founder de ce document

---

## Statut gates

| Gate | Statut |
|------|--------|
| DISCOVER | ✅ |
| PRD | ✅ |
| ADR | ✅ |
| **DESIGN** | 🟢 **EN REVIEW Founder** |
| BUILD | 🔒 |

---

## Question gate DESIGN

> Est-ce qu'un Rémois qui ouvre Yunicity Vidéos comprend **immédiatement** pourquoi cette expérience est différente de TikTok ?

**Réponse visée par ce design :** oui — dès la première frame, le bandeau territorial (distance + quartier + temporalité) et le CTA « Y aller » placent la vidéo **dans Reims**, pas dans un scroll global anonyme.

---

## Principes design (non négociables)

1. **La vidéo domine** — UI chrome minimal, pas de header lourd.
2. **Le territoire avant le vanity** — distance/quartier/temps **au-dessus** des compteurs likes.
3. **Une action locale par écran** — CTA « Y aller » = primaire visuel (bleu Yunicity).
4. **Pas TikTok clone** — pas de sidebar trends, pas de sons trending, pas de filtres AR.
5. **Mobile-first 375px** — safe areas, touch ≥ 44px, gestures natifs.
6. **Design system** — tokens `yunicity-*`, Lucide icons, copy FR ; pas de gradients décoratifs (scrim vidéo : bandeau basse opaque autorisé pour lisibilité).

---

# DESIGN-01 — Player vertical (`/videos`)

## Wireframe — Mobile (375 × 812)

```
┌─────────────────────────────────────┐
│ ◀ Retour          Vidéos      ···   │  ← barre légère, disparaît au scroll immobile (auto-hide 3s)
├─────────────────────────────────────┤
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░░░░░░  VIDÉO PLEIN ÉCRAN  ░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│                                     │
│  ┌─ Contexte territorial ────────┐  │  ← P2, coin supérieur gauche (safe area)
│  │ 📍 À 800 m de chez toi        │  │
│  │ Boulingrin · Reims            │  │
│  │ Tourné il y a 32 min          │  │  ← temporal P1
│  └───────────────────────────────┘  │
│                                     │
│                                     │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← bandeau bas opaque neutral-900/75 (pas gradient décoratif)
│ Kyria                               │
│ ☕ Café du Forum                    │  ← titre lieu ou titre vidéo
│ Bon plan                            │  ← badge type
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  Y aller · 12 min à pied        │ │  ← CTA primaire pleine largeur
│ └─────────────────────────────────┘ │
│                                     │
│                          ♥ 124    │  │  ← colonne actions droite
│                          💬 18     │  │
│                          ↗ Partager│  │
│                          🗺 Carte  │  │  ← P1 V2.1 ; masqué MVP si pas lieu
└─────────────────────────────────────┘
     ↑ swipe vertical = vidéo suivante
     ↑ double-tap centre = like
     ↑ tap centre = pause/play
     ↑ tap hauteur son = unmute
```

## Hiérarchie visuelle (ordre de lecture)

| Priorité | Élément | Placement | Style |
|----------|---------|-----------|-------|
| **P1** | Vidéo | Full bleed | `<video playsInline>` |
| **P2** | Contexte territorial | Top-left overlay | text-sm white, icône MapPin |
| **P3** | Action locale | Bottom band, au-dessus meta | Bouton `yunicityBtnPrimary` |
| **P4** | Meta auteur + type | Bottom band | title sm bold, badge type |
| **P5** | Engagement | Colonne droite verticale | Icônes 44×44, compteurs tabular-nums |

## Composants prévus (BUILD — pas implémentés)

```
LocalVideoFeedScreen
├── LocalVideoFeedViewport (snap scroll vertical, 1 item = 100dvh)
│   └── LocalVideoSlide (×N)
│       ├── LocalVideoPlayer (video element)
│       ├── LocalVideoTerritoryBadge (distance, quartier, temporal)
│       ├── LocalVideoMetaStrip (auteur, lieu, type badge)
│       ├── LocalVideoGoCta (Y aller / Réserver / Voir l'offre)
│       └── LocalVideoActionRail (like, comment, share, map?)
├── LocalVideoCommentSheet (DESIGN-04)
└── LocalVideoFeedEmpty / Error / Loading
```

## Interactions player

| Geste | Action | Feedback |
|-------|--------|----------|
| Swipe up | Vidéo suivante | Snap + preload metadata next |
| Swipe down | Vidéo précédente | Idem |
| Double tap | Toggle like | Cœur scale animation 300ms |
| Tap centre | Pause / play | Icône pause fade 500ms |
| Tap rail ♥ | Toggle like | Même que double-tap |
| Tap rail 💬 | Ouvre comment sheet | Sheet 60% hauteur |
| Tap rail ↗ | Share sheet / copy link | Toast « Lien copié » |
| Tap **Y aller** | Navigate `/places/{slug}` ou `/events/{id}` ou Map | — |
| Tap 🔇 (coin) | Unmute / mute | État persiste session |

**Autoplay :** oui, **muted** par défaut. Indicateur discret « Appuyez pour le son » 2s puis fade.

## Variantes CTA (selon métadonnées)

| Contexte | Label CTA | Destination |
|----------|-----------|-------------|
| Lieu culturel | Y aller · {durée} | `/places/{slug}` |
| Événement | Y aller · Ce soir | `/events/{id}` |
| Partenaire / offre | Voir l'offre Passport | `/passport` ou fiche partenaire |
| Quartier seul | Explorer le quartier | `/neighborhoods/{slug}` |
| Aucun lien | *(CTA masqué)* | — |

## Desktop (≥ xl) — comportement

Colonne centrée **max-w-[430px]**, fond `surface` (#F7F8FA) autour — pas de player étiré 4K. Mêmes overlays.

## Copy UI — Player (français)

| Clé | Texte |
|-----|-------|
| `LOCAL_VIDEO_DISTANCE` | À {distance} de chez toi |
| `LOCAL_VIDEO_DISTANCE_FAR` | À Reims |
| `LOCAL_VIDEO_PUBLISHED_AGO` | Tourné il y a {time} |
| `LOCAL_VIDEO_EVENT_TONIGHT` | Ça se passe ce soir |
| `LOCAL_VIDEO_GO_WALK` | Y aller · {minutes} min à pied |
| `LOCAL_VIDEO_GO_OFFER` | Voir l'offre Passport |
| `LOCAL_VIDEO_MUTE_HINT` | Appuyez pour activer le son |
| `LOCAL_VIDEO_TYPE_BON_PLAN` | Bon plan |
| `LOCAL_VIDEO_TYPE_MOMENT` | Moment |
| `LOCAL_VIDEO_TYPE_QUARTIER` | Quartier |
| `LOCAL_VIDEO_TYPE_LIEU` | Lieu |
| `LOCAL_VIDEO_TYPE_TRIBU` | Tribu |

---

# DESIGN-02 — Upload (`/videos/new`)

## Parcours en 4 écrans (stepper discret en haut)

### Étape 1 — Choisir (`/videos/new`)

```
┌─────────────────────────────────────┐
│ ◀ Annuler      Publier une vidéo    │
├─────────────────────────────────────┤
│                                     │
│   ┌─────────────────────────────┐   │
│   │                             │   │
│   │     📁 Choisir une vidéo    │   │  ← zone drop / file picker
│   │     MP4 ou MOV · max 90 s   │   │
│   │                             │   │
│   └─────────────────────────────┘   │
│                                     │
│   [  Ouvrir la galerie  ]           │  ← primaire
│   [  Filmer (bientôt)   ]           │  ← disabled web MVP, hint Expo
│                                     │
│   En publiant, vous acceptez que     │
│   votre vidéo soit visible à Reims.│
└─────────────────────────────────────┘
```

### Étape 2 — Prévisualisation

```
┌─────────────────────────────────────┐
│ ◀ Retour       Aperçu         2/4   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │      [ thumbnail / preview ]    │ │
│ │            ▶ 0:42 / 1:00        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Durée : 42 s          ✓ OK          │
│ Format : MP4                        │
│                                     │
│ ⚠ Recadrage automatique appliqué    │  ← si transcode ; sinon masqué
│                                     │
│              [ Continuer ]          │
└─────────────────────────────────────┘
```

**MVP :** pas de trim manuel — durée affichée seulement. Reject si > 90s avec message clair.

### Étape 3 — Contexte (formulaire)

```
┌─────────────────────────────────────┐
│ ◀ Retour      Contexte        3/4   │
├─────────────────────────────────────┤
│ Quartier *                          │
│ [ Boulingrin              ▼ ]       │
│                                     │
│ Type *                              │
│ ( ) Bon plan  ( ) Moment            │
│ ( ) Quartier  ( ) Lieu  ( ) Tribu   │
│                                     │
│ Titre (recommandé)                  │
│ [ Café du Forum — terrasse... ]     │
│                                     │
│ Lieu (optionnel)                    │
│ [ Rechercher un lieu à Reims... ]   │
│                                     │
│ Événement (optionnel)               │
│ [ Aucun                    ▼ ]      │
│                                     │
│ Description (optionnel)             │
│ [ ... ]                             │
│                                     │
│ ⚠ Sans quartier, impossible de      │
│   publier.                          │
│                                     │
│              [ Continuer ]          │
└─────────────────────────────────────┘
```

**Hard gate :** bouton Continuer disabled tant que quartier + type absents.

**Soft gate :** si titre ET lieu absents → modal :

> « Ajouter un titre ou un lieu aide les Reims à vous trouver. »  
> [ Publier quand même ] · [ Compléter ]

### Étape 4 — Récap + Publier

```
┌─────────────────────────────────────┐
│ ◀ Retour      Publication     4/4   │
├─────────────────────────────────────┤
│ ┌──────────┐  Boulingrin           │
│ │ thumb    │  Bon plan              │
│ │          │  Café du Forum         │
│ └──────────┘                        │
│                                     │
│ Ville : Reims (pilote)              │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │         Publier                 │ │  ← primaire
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

Post-submit → états DESIGN-03 → redirect `/videos?id={uuid}` sur sa vidéo.

## Composants upload prévus

```
LocalVideoUploadScreen
├── LocalVideoFilePickerStep
├── LocalVideoPreviewStep
├── LocalVideoContextFormStep
│   ├── NeighborhoodSelect (API neighborhoods)
│   ├── VideoTypeRadio
│   ├── PlaceSearchCombobox (cultural places / partners)
│   └── EventSelect (optional)
├── LocalVideoPublishSummaryStep
└── LocalVideoUploadProgress (overlay full-screen during upload/processing)
```

---

# DESIGN-03 — États système

## Upload / publish (overlay plein écran)

| État | UI | Copy |
|------|-----|------|
| **Uploading** | Barre progression % | « Téléchargement… {n} % » |
| **Processing** | Spinner + illustration mascot optionnelle | « Nous préparons votre vidéo. » + « Cela peut prendre quelques secondes. » |
| **Success** | Check | « Publiée ! » → auto redirect 1s |
| **Failed** | Erreur rouge doux | « Impossible de publier. » + **[ Réessayer ]** |

## Feed (`/videos`)

| État | UI | Copy + CTA |
|------|-----|------------|
| **Loading** | Skeleton slide 100dvh pulse | — |
| **Empty** | Illustration calme | « Aucune vidéo autour de vous pour le moment. » + **[ Découvrir les événements ]** → `/sortir` + **[ Explorer les quartiers ]** → `/neighborhoods` |
| **Error** | Bandeau | « Impossible de charger les vidéos. » + **[ Réessayer ]** |
| **Session expirée** | Panel (pattern WEB-AUDIT-09) | « Reconnectez-vous pour regarder les vidéos locales. » |
| **Single video end** | Hint swipe | « Swipez pour découvrir d'autres moments à Reims » |

## Player item

| État | UI |
|------|-----|
| Video loading | Spinner centre, thumb en fond flou optional |
| Video error | « Vidéo indisponible » + skip auto next après 2s |
| Hidden by admin | Slide skipped silently in feed |

---

# DESIGN-04 — Commentaires (sheet)

## Wireframe sheet (60% viewport)

```
┌─────────────────────────────────────┐
│░░░░░░░░ vidéo visible 40% ░░░░░░░░░░│
├─────────────────────────────────────┤
│ ─── (handle drag)                   │
│ Commentaires · 18                   │
├─────────────────────────────────────┤
│ Marie · Boulingrin · il y a 2 h     │
│ Super terrasse, merci pour le bon    │
│ plan !                              │
│                                     │
│ Lucas · Centre-ville · hier         │
│ J'y vais ce week-end.               │
│                                     │
│ ...                                 │
├─────────────────────────────────────┤
│ [ Ajouter un commentaire...    ➤ ] │
└─────────────────────────────────────┘
```

**Règles :**

- Pas de navigation route — sheet modal over player.
- Fermeture : swipe down handle, tap backdrop, bouton close.
- Retour player : instantané, vidéo reprend autoplay (muted si était muted).
- Keyboard mobile : input sticky bottom, liste scrollable.
- Empty comments : « Soyez le premier à réagir. »

---

# DESIGN-05 — Wow Yunicity (checklist visuelle)

Chaque slide **doit** afficher au minimum :

| Wow | Présent MVP | Emplacement |
|-----|-------------|-------------|
| Distance | ✅ P0 | Territory badge top |
| Quartier + ville | ✅ P0 | Territory badge |
| Temporalité | ✅ P1 | « Tourné il y a… » ou « Ce soir » |
| CTA action | ✅ P0 | Bouton Y aller |
| Type contenu | ✅ P0 | Badge « Bon plan » etc. |
| Preuve sociale locale | ⏳ V2.1 | Sous CTA : « 12 Rémois ont vu » |
| Carte vivante | ⏳ V2.1 | Rail action carte |

**Anti-patterns interdits :**

- Hashtag trending
- « Pour toi » algorithm opaque
- Compteur followers mis en avant
- Son trending / lip sync prompt

---

# DESIGN-06 — Critères d'acceptation design

Validation Founder requise sur les 4 tests :

| Test | Critère observable | Pass ? |
|------|-------------------|--------|
| **T1 — Local** | Bandeau distance + quartier visible **sans scroll** dans les 2 premières secondes | ☐ |
| **T2 — Action** | CTA « Y aller » visible sans interaction, libellé inclut durée ou temporalité | ☐ |
| **T3 — Pas TikTok** | Aucun élément trending ; territoire avant compteur likes | ☐ |
| **T4 — Pourquoi Yunicity** | Combinaison distance + action + Reims communicate « réseau social **de ma ville** » | ☐ |

**Test utilisateur recommandé (5 min) :** montrer wireframe/prototype statique à 1 non-dev Reims — poser « C'est quoi ? » / « Tu irais où ? » / « C'est TikTok ? »

---

# Navigation & entrées produit

| Entrée | Comportement MVP |
|--------|------------------|
| Nav principale | Item **Vidéos** (icône Play ou Film) — badge none |
| Deep link | `/videos/{id}` → ouvre feed à l'index |
| Profil (futur) | « Mes vidéos » post-V2.1 |
| Feed teaser (V2.1) | Card verticale → `/videos?id=` |

**Coexistence Stories :** label distinct « Stories » (éphémère) vs « Vidéos » (fil local permanent).

---

# Accessibilité & motion

- Touch targets rail : 44×44px minimum.
- Focus trap dans comment sheet ; Esc ferme (desktop).
- `prefers-reduced-motion` : désactiver animations cœur ; snap scroll conservé.
- Contraste texte sur bandeau bas : white on neutral-900/75 — ratio AA.
- Pas d'autoplay sonore.

---

# Mapping PRD ↔ Design

| PRD Story | Design section |
|-----------|----------------|
| Story 1 Publish | DESIGN-02, DESIGN-03 |
| Story 2 Feed | DESIGN-01 |
| Story 3 Wow | DESIGN-05 |
| Story 4 Interactions | DESIGN-01 rail, DESIGN-04 |
| Story 5 Modération | Signalement via menu « ··· » slide (report) — wireframe détaillé BUILD S3 |

---

# Prochaines étapes

```txt
DESIGN doc (ce fichier)     🟢 EN REVIEW Founder
↓
Validation Founder T1–T4    ☐
↓
BUILD gate ouvert
↓
C2-S1 (R2 + FFmpeg + DB + API)
↓
C2-S2 (Player + fil — implémenter DESIGN-01/03/04)
```

---

# Historique

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-06-12 | CTO + Cursor | Wireframes DESIGN-01 à DESIGN-06 |
| 2026-06-12 | CTO | **DESIGN APPROVED** — T1–T4 GO ; notes V2.1 ci-dessous |

---

# Notes DESIGN V2.1 (non bloquantes BUILD)

## Note 1 — Micro-copy au-dessus du CTA

Renforcer le FOMO local avec une ligne contextuelle **immédiatement au-dessus** du bouton « Y aller » :

| Contexte | Micro-copy | CTA |
|----------|------------|-----|
| Proximité | « Découvert près de chez vous » | Y aller · 12 min |
| Événement | « Ça se passe ce soir » | Y aller · Ce soir |
| Récent | « Tourné il y a 32 min » | Y aller · 12 min |

Implémentation : **C2-S4** (player overlay), pas C2-S1.

## Note 2 — Hiérarchie badge distance (évolution)

Ordre de priorité d'affichage territorial :

```txt
1. 800 m (distance)
2. 12 min à pied (durée trajet)
3. Boulingrin (quartier)
4. Il y a 32 min (temporalité)
```

Fallback si distance indisponible ou non pertinente (> 5 km) :

```txt
Boulingrin
Ce soir
```

Implémentation : **C2-S4** (wow P0/P1).

## Note 3 — Comment sheet + clavier

Sheet par défaut : **60 %** viewport.

Quand le clavier mobile apparaît : expansion à **90 %** pour garder input + liste visibles.

Implémentation : **C2-S3** (commentaires sheet).
