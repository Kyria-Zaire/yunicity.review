# DESIGN-QUARTIERS-V2-Q2-S3 — Contributions citoyennes (mémoire collective)

> **Feature** : FEATURE-QUARTIERS-V2 / Q2-S3  
> **PRD** : `docs/prd/PRD-QUARTIERS-V2-Q2-S3-contributions-citoyennes.md`  
> **ADR** : `docs/architecture/ADR-Q2-S3-Contributions-Citoyennes.md`  
> **Parent design** : `docs/quartiers/DESIGN-QUARTIERS-V2.md` (DESIGN-06 **étendu et remplacé** par ce document)  
> **Phase** : DESIGN — Gate ouvert CTO 2026-06-13  
> **Codage** : 🔒 BUILD interdit jusqu'à validation Founder T1–T5 de ce document

---

## Statut gates

| Gate | Statut |
|------|--------|
| DISCOVER Q2-S3 | ✅ |
| PRD Q2-S3 | ✅ |
| ADR delta Q2-S3 | ✅ |
| **DESIGN Q2-S3** | ✅ **APPROVED** — Founder T1–T5 (5/5) 2026-06-13 |
| BUILD | 🟢 AUTORISÉ (Q2-S3-01) |
| COMMIT docs | ✅ |

---

## Question gate DESIGN

> Est-ce qu'un Rémois qui lit la section appartenance ou ouvre la modal ressent en **5 secondes** que ce sont des **souvenirs humains à transmettre** — pas des avis, pas un fil Facebook — et a **envie d'écrire** sans craindre une punition opaque ?

**Réponse visée :** oui — body-first, invitation persistante, refus pédagogique, zéro interaction sociale.

---

## Doctrine design Q2-S3 (non négociable)

```txt
mémoire → transmission → appartenance
```

**Pas :**

```txt
mémoire → engagement → réseau social → Facebook local
```

### Principes hérités (DESIGN-QUARTIERS-V2)

1. **Émotion sobre** — chaleur éditoriale, pas spectacle Instagram.
2. **Body-first** — le souvenir est le héros ; le titre est optionnel et secondaire.
3. **Une action primaire par zone** — CTA « Partager un souvenir » ; pas de barre d'actions sociales.
4. **Design system** — `docs/ai/frontend-design-system.md` : `yunicity-*`, pas de gradients, mobile-first 375px.
5. **Anti-réseau social** — ADR Q2-S3-ADR-07 : aucun like, commentaire, partage, fil, notif sociale.

### Ce qu'on évite

| ❌ | Pourquoi |
|----|----------|
| « Créer une contribution » | Ton formulaire SaaS, pas transmission |
| Section masquée si vide | Abandon S2-02 — choix produit ADR-04 |
| « Refusé. » sans explication | Frustration, pas pédagogie |
| Carte type post Facebook | Avatar + réactions + timestamp relatif « il y a 2 h » |
| Étoiles / « je recommande » | Dérive TripAdvisor |
| Édition post-approbation | Mémoire immuable (ADR-05) |

### Ce qu'on obtient

> Le premier endroit où un Rémois peut laisser une trace utile de son vécu — **pas pour des likes**, mais pour que quelqu'un comprenne un peu mieux sa ville.

---

# DESIGN-01 — Modal « Partager un souvenir »

## Objectif

Donner **envie d'écrire** (Test Founder **T2**) — pas l'impression de remplir un ticket admin.

## Titre modal (verrouillé)

```txt
Quel souvenir de ce quartier aimeriez-vous transmettre ?
```

**Interdit :** « Créer une contribution », « Nouvelle contribution », « Publier un avis ».

## Sous-titre contexte

```txt
Quartier : Boulingrin
```

Lecture seule — pré-rempli depuis la fiche ; pas de sélecteur de quartier dans la modal MVP.

## Structure formulaire (ordre strict)

```txt
1. Identité (choix radio)
2. Titre (optionnel)
3. Souvenir (obligatoire, 40–800 car.)
4. Rappel éditorial discret
5. Micro-copy transmission
6. Actions : Annuler · Transmettre
```

## Wireframe — Mobile (375px)

```
┌─────────────────────────────────────┐
│ ✕                                   │
│                                     │
│ Quel souvenir de ce quartier        │  ← h2, text-lg font-bold
│ aimeriez-vous transmettre ?         │
│                                     │
│ Quartier : Boulingrin               │  ← text-sm text-neutral-500
│                                     │
│ ─── Comment apparaître ? ───        │  ← label section
│                                     │
│ ○ Kyria                             │  ← pseudo résolu serveur
│ ○ Un Rémois                         │  ← ou Une Rémoise (sous-choix)
│ ○ Kyria • Citoyen vérifié           │  ← disabled + tooltip si non éligible
│                                     │
│ Titre (optionnel)                   │
│ ┌─────────────────────────────────┐ │
│ │ Ex. Les Halles le samedi        │ │  ← placeholder doux, pas obligatoire
│ └─────────────────────────────────┘ │
│                                     │
│ Votre souvenir *                    │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │                                 │ │  ← textarea min-h 120px
│ │                                 │ │
│ └─────────────────────────────────┘ │
│ 142 / 800 caractères                │  ← compteur live, warning < 40
│                                     │
│ ┌─ rappel éditorial ───────────────┐│
│ │ Un souvenir personnel lié à ce   ││  ← bg yunicity-primary-soft/50
│ │ quartier — pas un avis ni une    ││     text-xs text-neutral-600
│ │ publicité.                       ││
│ └──────────────────────────────────┘│
│                                     │
│ Les meilleurs souvenirs sont ceux   │  ← micro-copy CTO, italic
│ qui resteront vrais dans plusieurs  │     text-xs text-neutral-500
│ années.                             │
│                                     │
│ ┌─────────────┐ ┌─────────────────┐ │
│ │  Annuler    │ │   Transmettre   │ │  ← primaire yunicity-primary
│ └─────────────┘ └─────────────────┘ │
└─────────────────────────────────────┘
```

## Wireframe — Desktop

Modal centrée `max-w-lg` (`contentWidth: form`), fond overlay `neutral-950/40`, pas de blur décoratif.

Même ordre champs ; bouton **Transmettre** aligné à droite.

## Choix identité (UI)

| Option | Label affiché | Règle |
|--------|---------------|-------|
| `pseudo` | Prénom ou pseudo profil (ex. `Kyria`) | Défaut si profil renseigné |
| `anonymous` | `Un Rémois` **ou** `Une Rémoise` | Sous-radio ou toggle genre — snapshot serveur |
| `verified` | `{pseudo} • Citoyen vérifié` | Visible uniquement si Passport éligible à T ; sinon option masquée |

**Preview live** sous les radios (optionnel BUILD) : « Vous apparaîtrez comme : Kyria ».

## Validation & feedback

| Cas | Comportement |
|-----|--------------|
| Body < 40 ou > 800 | Erreur inline + bouton Transmettre disabled |
| Non connecté | CTA section → redirect login `?returnUrl=/neighborhoods/{slug}` |
| Soumission OK | Modal ferme → toast : « Merci — votre souvenir sera relu par l'équipe avant publication. » |
| Quota approved 30j | Toast erreur : « Vous avez déjà partagé un souvenir publié sur ce quartier ce mois-ci. » |
| Pending existant | Toast : « Vous avez déjà un souvenir en attente sur ce quartier. » |
| Verified non éligible | 422 → message inline Passport |

## États modal

| État | UI |
|------|-----|
| **idle** | Formulaire vide ou pré-rempli identité défaut |
| **submitting** | Transmettre disabled + spinner |
| **error** | Message inline ou toast — pas de perte du body saisi |
| **success** | Fermeture + toast — pas de redirect |

## Composant BUILD cible

```
frontend/apps/web/components/neighborhoods/v2/
└── neighborhood-v2-contribution-modal.tsx
```

Hook : `useNeighborhoodContributionSubmit(slug)`.

---

# DESIGN-02 — État vide persistant

## Objectif

Transformer le vide en **amorce de mémoire** (Test Founder **T5**) — écran le plus important de Q2-S3.

## Décision produit (ADR Q2-S3-ADR-04)

```txt
contributions.length === 0
≠
section absente
```

**Remplace** le comportement actuel `NeighborhoodV2BelongingSection` qui retourne `null` si vide.

## Wireframe — Section vide

```
┌─────────────────────────────────────┐
│ Pourquoi les Rémois aiment Boulingrin │  ← h2 inchangé
│                                     │
│ Aucun souvenir n'a encore été       │  ← text-sm text-neutral-700
│ partagé sur ce quartier.            │     leading-relaxed
│                                     │
│ Soyez la première voix à transmettre│  ← text-sm text-neutral-600
│ ce qui le rend unique.              │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │     Partager un souvenir        │ │  ← CTA primaire pleine largeur
│ └─────────────────────────────────┘ │     yunicity-primary, actif
│                                     │
│ (pas de badge « Bientôt »)          │
└─────────────────────────────────────┘
```

## Copy verrouillée

| Clé | Texte |
|-----|-------|
| `NEIGHBORHOOD_V2_CONTRIBUTIONS_EMPTY_BODY` | Aucun souvenir n'a encore été partagé sur ce quartier. |
| `NEIGHBORHOOD_V2_CONTRIBUTIONS_EMPTY_CTA` | Soyez la première voix à transmettre ce qui le rend unique. |
| `NEIGHBORHOOD_V2_SHARE_MEMORY_CTA` | **Partager un souvenir** |

> **Note BUILD :** remplacer la constante actuelle `Partager votre souvenir` et retirer `NEIGHBORHOOD_V2_SHARE_MEMORY_SOON` (« Bientôt »).

## Interdictions

```txt
❌ « Aucune donnée »
❌ « Aucun témoignage » (ton froid)
❌ Section masquée (return null)
❌ CTA disabled
❌ Illustration stock vide générique type SaaS
```

## Variante « première voix » vs « premier »

Copy neutre **« Soyez la première voix »** validée DISCOVER — acceptable genre-neutre en français oral rémois ; pas de variante A/B MVP.

---

# DESIGN-03 — Affichage des souvenirs (fiche quartier)

## Objectif

Lecture immédiate : **souvenirs humains**, pas posts (Test Founder **T1**, **T3**).

## Hiérarchie carte (body-first)

### Sans titre

```txt
Identité (author_label)
↓
Souvenir (body)
↓
Date (approved_at, format lisible)
```

### Avec titre

```txt
Identité
↓
Titre (font-semibold)
↓
Souvenir
↓
Date
```

**Jamais** titre vide affiché — si `title` null ou whitespace → branche sans titre.

## Wireframe — Carte souvenir

```
┌─────────────────────────────────────┐
│ Kyria                               │  ← text-xs font-medium text-neutral-500
│                                     │     badge « Citoyen vérifié » si snapshot
│ Les Halles le samedi                │  ← titre optionnel, text-sm font-bold
│                                     │
│ « Quand j'étais petit, mon grand-   │  ← body text-sm leading-relaxed
│   père m'emmenait aux Halles… »     │     guillemets optionnels présentateur
│                                     │
│ Partagé en juin 2026                │  ← text-xs text-neutral-400
└─────────────────────────────────────┘
```

## Style carte

| Token | Valeur |
|-------|--------|
| Fond | `bg-neutral-50/70` ou `yunicity-surface` |
| Bordure | `border-neutral-100` |
| Rayon | `rounded-xl` |
| Avatar | **Aucun** — pas de photo profil |
| Réactions | **Aucune** |
| Lien auteur | **Aucun** — `author_label` texte seul |

## Section complète — avec souvenirs (≤3)

```
Pourquoi les Rémois aiment Boulingrin

[Paragraphe éditorial staff — why_locals_love — futur / optionnel]

─── Souvenirs partagés ───          ← séparateur discret si ≥1 carte

┌ carte 1 ─┐  approved_at DESC
┌ carte 2 ─┐
┌ carte 3 ─┐

[ Partager un souvenir ]              ← CTA secondaire (outline) si cartes présentes
```

## Hiérarchie section (ADR Q2-S3-ADR-06)

```txt
1. Contenu éditorial Yunicity (why_locals_love si présent)
2. Contributions approuvées (max 3, approved_at DESC)
3. CTA « Partager un souvenir »
```

## Tri

```txt
ORDER BY approved_at DESC
```

**Interdit :** popularité, likes, score, random.

## Identité publique

Exposer uniquement `author_label` (snapshot) — jamais `author_user_id`, email, nom légal.

Exemples snapshot :

| Type | Label |
|------|-------|
| `pseudo` | `Kyria` |
| `anonymous` | `Un Rémois` / `Une Rémoise` |
| `verified` | `Kyria • Citoyen vérifié` |

---

# DESIGN-04 — Mon profil → Mes souvenirs

## Objectif

Suivi transparent — refus **compréhensible** (Test Founder **T4**).

## Emplacement

`/mon-profil` — nouvelle section ancrée **`#profile-memories`** dans la colonne principale du portail profil.

Navigation sidebar : entrée **« Mes souvenirs »** (icône `BookOpen` ou `ScrollText` — sobre).

```
ProfileInternalSidebar
└─ Mes souvenirs → scroll #profile-memories
```

## Wireframe — Liste

```
┌─────────────────────────────────────┐
│ Mes souvenirs                       │  ← h2 section
│                                     │
│ Vos fragments de mémoire partagés   │  ← sous-titre text-sm neutral-500
│ sur les quartiers de Reims.         │
│                                     │
│ ┌─ En attente ────────────────────┐ │
│ │ Boulingrin                        │ │
│ │ Soumis le 12 juin 2026            │ │
│ │ « Les Halles le samedi… »         │ │  ← extrait body tronqué 120 car.
│ │ En attente de validation.         │ │  ← badge ambre soft
│ └───────────────────────────────────┘ │
│                                     │
│ ┌─ Partagé ────────────────────────┐ │
│ │ Centre-ville                      │ │
│ │ Publié le 3 juin 2026             │ │
│ │ Partagé avec les habitants        │ │
│ │ de Reims.                         │ │  ← badge vert soft
│ │ [ Voir le quartier → ]            │ │
│ └───────────────────────────────────┘ │
│                                     │
│ ┌─ Non publié ─────────────────────┐ │
│ │ Boulingrin · 8 juin 2026          │ │
│ │ Ce souvenir ressemblait           │ │  ← copy pédagogique ADR-03
│ │ davantage à un avis qu'à une      │ │     PAS le mot « Refusé » seul
│ │ mémoire personnelle.              │ │
│ │ [ Proposer un autre souvenir → ]  │ │  ← lien vers fiche quartier + modal
│ └───────────────────────────────────┘ │
│                                     │
│ (empty state profil)                │
│ Vous n'avez pas encore transmis     │
│ de souvenir. Explorez un quartier   │
│ qui vous tient à cœur.              │
└─────────────────────────────────────┘
```

## États & copy (verrouillés)

| Statut | Badge | Copy principale |
|--------|-------|-----------------|
| `pending` | En attente | En attente de validation. |
| `approved` | Partagé | Partagé avec les habitants de Reims. |
| `rejected` | Non publié | Copy mappée depuis `rejection_reason_code` — **jamais** « Refusé » seul |

### Mapping copy rejet (profil)

| Code | Copy affichée |
|------|---------------|
| `NOT_A_MEMORY` | Ce souvenir ressemblait davantage à un avis qu'à une mémoire personnelle. |
| `COMMERCIAL_CONTENT` | Les recommandations commerciales ne font pas partie de la mémoire collective. |
| `TOO_SHORT` | Le texte était trop court ou trop long pour être publié. |
| `NOT_LOCAL` | Ce souvenir ne semble pas lié à ce quartier. |
| `INAPPROPRIATE` | Le contenu ne respectait pas nos règles de mémoire collective. |
| `DUPLICATE` | Un souvenir similaire existe déjà sur ce quartier. |
| `OTHER` | Notre équipe vous invite à proposer un autre souvenir. |

Préfixe optionnel uniforme : « Votre souvenir n'a pas été publié : » — **une seule phrase**, pas double négation.

## Actions auteur post-approbation

| Action | MVP |
|--------|-----|
| Éditer | ❌ |
| Demander retrait | ✅ lien discret « Demander le retrait » → confirmation → flag `retraction_requested_at` |
| Supprimer immédiat | ❌ |

## Composant BUILD cible

```
frontend/apps/web/components/profile/
└── profile-memories-section.tsx
```

---

# DESIGN-05 — Vue Admin modération

## Objectif

Décision staff **< 30 secondes** — contexte suffisant sans ouvrir la fiche quartier.

## Emplacement

Nouvelle entrée navigation admin :

```txt
Quartiers → Contributions en attente
```

Route proposée : `/neighborhood-contributions` (liste) + `/neighborhood-contributions/{id}` (détail).

Pattern : réutiliser structure **workspace + liste + détail** des modules admin existants (offers, creator-content, moderation).

## Wireframe — Liste (file pending first)

```
┌──────────────────────────────────────────────────────────────┐
│ Contributions quartiers                    [ 3 en attente ] │
├──────────────────────────────────────────────────────────────┤
│ Filtres : Statut · Quartier · Date                           │
├──────────────────────────────────────────────────────────────┤
│ Boulingrin · Kyria (pseudo) · 12 juin · pending    [ Ouvrir ]│
│ Centre-ville · Un Rémois · 11 juin · pending       [ Ouvrir ]│
└──────────────────────────────────────────────────────────────┘
```

## Wireframe — Détail modération

```
┌──────────────────────────────────────────────────────────────┐
│ ← Retour                                    pending · 12 juin │
├──────────────────────────────────────────────────────────────┤
│ SOUVENIR (lecture principale)                                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Titre : Les Halles le samedi                             │ │
│ │                                                          │ │
│ │ « Quand j'étais petit, mon grand-père m'emmenait aux     │ │
│ │   Halles tous les samedis. L'odeur du fromage… »        │ │
│ │                                                          │ │
│ │ 187 caractères                                           │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ CONTEXTE QUARTIER                                            │
│ Boulingrin · Alias Halles · [ Ouvrir fiche ↗ ]              │
│                                                              │
│ IDENTITÉ SNAPSHOT (soumission)                               │
│ Type : pseudo · Label : Kyria · Passport : non               │
│                                                              │
│ ─── Décision ───                                             │
│                                                              │
│ [ ✓ Approuver ]                                              │
│                                                              │
│ Rejeter avec motif :                                         │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ NOT_A_MEMORY          Pas un souvenir personnel      ▼  │ │
│ │ COMMERCIAL_CONTENT    Contenu commercial                │ │
│ │ TOO_SHORT             Hors bornes 40–800                │ │
│ │ NOT_LOCAL             Hors quartier                     │ │
│ │ INAPPROPRIATE         Contenu inadapté                   │ │
│ │ DUPLICATE             Doublon                           │ │
│ │ OTHER                 Autre                             │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ Note interne (optionnel)                                     │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Formulation type « meilleur café »                       │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ [ Confirmer le refus ]                                       │
└──────────────────────────────────────────────────────────────┘
```

## Flux décision rapide

| Action | Clics | Effet |
|--------|-------|-------|
| Approuver | 1 | `status=approved`, `approved_at=now`, audit |
| Rejeter | 2 | Sélection code + Confirmer ; note optionnelle |

**Pas** de champ texte libre obligatoire pour rejeter — le **code** suffit ; la note est pour l'audit interne.

## Règles admin UI

- Souvenir en **typo large** (`text-base leading-relaxed`) — c'est le focus.
- Quartier = lien externe nouvel onglet vers fiche publique.
- Snapshot identité = lecture seule — pas le profil live.
- Historique : si re-soumission même auteur, afficher « 1 rejet précédent » collapsed.

## Composants BUILD cible

```
frontend/apps/admin/
├── app/(protected)/neighborhood-contributions/
│   ├── page.tsx
│   └── [id]/page.tsx
└── components/neighborhood-contributions/
    ├── contributions-workspace.tsx
    ├── contributions-list.tsx
    └── contribution-detail-moderation.tsx
```

---

# DESIGN-06 — Tests Founder (validation avant BUILD)

Cocher lors review wireframes / maquette Boulingrin :

| ID | Test | Critère de succès | ☐ |
|----|------|-------------------|---|
| **T1** | Immédiat | « Ce sont des **souvenirs humains** » — pas des avis ni des notes | ✅ |
| **T2** | Modal ouverte | « J'ai **envie de raconter** quelque chose » — titre modal + micro-copy transmission | ✅ |
| **T3** | Section souvenirs | « Je ne me sens **pas sur Facebook** » — zéro like, commentaire, avatar, fil | ✅ |
| **T4** | Profil rejet | Un refus me paraît **juste et compréhensible** — copy pédagogique, pas « Refusé » sec | ✅ |
| **T5** | Après lecture | Je ressens **davantage l'identité du quartier** — invitation vide + cartes authentiques | ✅ |

### Protocole review Founder

1. Parcourir wireframes **état vide Boulingrin** → modal → carte souvenir → profil rejet → admin détail.
2. Cocher T1–T5.
3. Si **5/5** → **DESIGN APPROVED** → commit docs groupé (DISCOVER + PRD + ADR + DESIGN) → BUILD Q2-S3-01.

### Scénarios de recette design (Boulingrin)

| Scénario | Contenu reference |
|----------|-------------------|
| Empty state | 0 contribution — section visible + CTA |
| 1 carte | Body sans titre, auteur `Un Rémois`, date juin 2026 |
| 1 carte + titre | « Les Halles le samedi » + body rituel familial |
| Profil pending | Même body, badge attente |
| Profil rejected | Code `NOT_A_MEMORY` + copy pédagogique |
| Admin | Pending ci-dessus, snapshot pseudo |

---

# États transverses & edge cases

| Cas | Comportement design |
|-----|---------------------|
| Utilisateur non connecté clique CTA | Redirect login + returnUrl |
| Quota 30j atteint | CTA reste visible ; clic → toast explicatif (pas de modal vide) |
| Pending existant | CTA → toast « déjà en attente » ; profil montre le pending |
| Feature flag off | Section masquée **uniquement** par flag — pas par empty (prod rollout) |
| `why_locals_love` staff présent | Au-dessus des cartes — séparateur « Souvenirs partagés » |
| 4e souvenir approved | Non visible fiche (max 3) — reste visible profil auteur |

---

# Copy UI complète (clés BUILD)

| Clé | Texte FR |
|-----|----------|
| `NEIGHBORHOOD_V2_CONTRIBUTION_MODAL_TITLE` | Quel souvenir de ce quartier aimeriez-vous transmettre ? |
| `NEIGHBORHOOD_V2_CONTRIBUTION_MODAL_HOOD` | Quartier : {name} |
| `NEIGHBORHOOD_V2_CONTRIBUTION_IDENTITY_LABEL` | Comment apparaître ? |
| `NEIGHBORHOOD_V2_CONTRIBUTION_TITLE_LABEL` | Titre (optionnel) |
| `NEIGHBORHOOD_V2_CONTRIBUTION_BODY_LABEL` | Votre souvenir |
| `NEIGHBORHOOD_V2_CONTRIBUTION_EDITORIAL_REMINDER` | Un souvenir personnel lié à ce quartier — pas un avis ni une publicité. |
| `NEIGHBORHOOD_V2_CONTRIBUTION_TRANSMISSION_HINT` | Les meilleurs souvenirs sont ceux qui resteront vrais dans plusieurs années. |
| `NEIGHBORHOOD_V2_CONTRIBUTION_SUBMIT` | Transmettre |
| `NEIGHBORHOOD_V2_CONTRIBUTION_CANCEL` | Annuler |
| `NEIGHBORHOOD_V2_CONTRIBUTIONS_EMPTY_BODY` | Aucun souvenir n'a encore été partagé sur ce quartier. |
| `NEIGHBORHOOD_V2_CONTRIBUTIONS_EMPTY_CTA` | Soyez la première voix à transmettre ce qui le rend unique. |
| `NEIGHBORHOOD_V2_SHARE_MEMORY_CTA` | Partager un souvenir |
| `NEIGHBORHOOD_V2_CONTRIBUTION_SUCCESS` | Merci — votre souvenir sera relu par l'équipe avant publication. |
| `NEIGHBORHOOD_V2_CONTRIBUTION_RATE_LIMIT` | Vous avez déjà partagé un souvenir publié sur ce quartier ce mois-ci. |
| `NEIGHBORHOOD_V2_CONTRIBUTION_PENDING_EXISTS` | Vous avez déjà un souvenir en attente sur ce quartier. |
| `NEIGHBORHOOD_V2_CONTRIBUTION_SHARED_DATE` | Partagé en {month} {year} |
| `NEIGHBORHOOD_V2_CONTRIBUTIONS_DIVIDER` | Souvenirs partagés |
| `PROFILE_MY_MEMORIES_TITLE` | Mes souvenirs |
| `PROFILE_MY_MEMORIES_SUBTITLE` | Vos fragments de mémoire partagés sur les quartiers de Reims. |
| `PROFILE_MY_MEMORIES_EMPTY` | Vous n'avez pas encore transmis de souvenir. Explorez un quartier qui vous tient à cœur. |
| `PROFILE_MEMORY_STATUS_PENDING` | En attente de validation. |
| `PROFILE_MEMORY_STATUS_APPROVED` | Partagé avec les habitants de Reims. |
| `PROFILE_MEMORY_REJECTION_*` | Voir tableau DESIGN-04 |
| `PROFILE_MEMORY_RETRACTION_CTA` | Demander le retrait |
| `ADMIN_NEIGHBORHOOD_CONTRIBUTIONS_TITLE` | Contributions quartiers |

---

# Accessibilité & responsive

| Règle | Détail |
|-------|--------|
| Modal | Focus trap ; `aria-labelledby` sur titre ; fermeture Escape |
| Radios identité | `fieldset` + `legend` |
| Textarea | `aria-describedby` compteur + rappel éditorial |
| Touch | CTA min 44px hauteur |
| Contraste | Copy pédagogique rejet : AA sur fond ambre/rose soft |
| Reduced motion | Pas d'animation entrée modal agressive |

---

# Mapping PRD / ADR ↔ Design

| Réf | Section design |
|-----|----------------|
| PRD Story 1 Transmettre | DESIGN-01 |
| PRD Story 2 Identité | DESIGN-01 radios + DESIGN-03 label |
| PRD Story 3 Mes souvenirs | DESIGN-04 |
| PRD Story 4 Lire souvenirs | DESIGN-02, DESIGN-03 |
| PRD Story 5 Modération | DESIGN-05 |
| ADR Q2-S3-ADR-01 Quota | DESIGN-01 toasts |
| ADR Q2-S3-ADR-02 Snapshot | DESIGN-01, 03, 05 |
| ADR Q2-S3-ADR-03 Refus | DESIGN-04, 05 |
| ADR Q2-S3-ADR-04 Section vide | DESIGN-02 |
| ADR Q2-S3-ADR-05 Immutabilité | DESIGN-04 retrait |
| ADR Q2-S3-ADR-06 Tri | DESIGN-03 |
| ADR Q2-S3-ADR-07 Anti-social | Toute section — DESIGN-03 interdictions |

---

# Arborescence composants BUILD (cible Q2-S3)

```
frontend/apps/web/components/neighborhoods/v2/
├── neighborhood-v2-belonging-section.tsx    ← refactor empty + cartes + CTA
├── neighborhood-v2-contribution-modal.tsx   ← NEW
└── neighborhood-v2-contribution-card.tsx    ← NEW (optionnel)

frontend/apps/web/components/profile/
└── profile-memories-section.tsx           ← NEW

frontend/apps/admin/components/neighborhood-contributions/
├── contributions-workspace.tsx
├── contributions-list.tsx
└── contribution-detail-moderation.tsx

frontend/packages/utils/src/
└── neighborhood-contribution-presenter.ts   ← copy rejet, format date, truncate
```

---

# Tickets BUILD (rappel post-DESIGN)

| Ticket | Livrable design |
|--------|-----------------|
| Q2-S3-01 | Migration + POST — identité snapshot |
| Q2-S3-02 | GET me — états profil DESIGN-04 |
| Q2-S3-03 | Web modal DESIGN-01 + section DESIGN-02/03 |
| Q2-S3-04 | Admin DESIGN-05 |
| Q2-S3-05 | Profil Mes souvenirs DESIGN-04 |

**Feature flag :** `feature_neighborhood_contributions_enabled`

**Seed recette :** 2–3 souvenirs approved Boulingrin, 1–2 Centre-ville (open question PRD §11).

---

# Historique

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-06-13 | Founder + CTO | DESIGN Q2-S3 — 6 blocs + T1–T5 + micro-copy transmission |

---

## Verdict

```txt
DESIGN-QUARTIERS-V2-Q2-S3 : APPROVED ✅
Founder T1–T5 : 5/5 (2026-06-13)
BUILD : AUTORISÉ — Q2-S3-01
```
