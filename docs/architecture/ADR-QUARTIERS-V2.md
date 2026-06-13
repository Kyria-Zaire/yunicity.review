# ADR-QUARTIERS-V2 — Mémoire vivante des quartiers

| Champ | Valeur |
|-------|--------|
| Statut | **APPROVED** — aligné PRD-QUARTIERS-V2 |
| Date | 2026-06-13 |
| PRD | `docs/prd/PRD-QUARTIERS-V2-neighborhoods-living-memory.md` |
| Décision | Tables dédiées + endpoint detail enrichi + R2 médias + contributions modérées |
| Conséquence | Extension domaine `neighborhoods` — pas de microservice, pas de `/v2` API |

---

## Contexte

Quartiers V2 (PRD-QUARTIERS-V2) transforme la fiche quartier en **mémoire vivante** : histoire, timeline, moods éditoriaux, vidéos hero, contributions citoyennes modérées, appartenance.

**État actuel (V1 — PRD-601 / TICKET-602) :**

| Composant | Implémentation |
|-----------|----------------|
| Modèle | `Neighborhood` — slug, display_name, short_description, ambiance, cover, géo |
| Seed | 6 quartiers Reims (`reims_neighborhoods.py`) |
| API | `GET /neighborhoods`, `GET /neighborhoods/{slug}`, `GET /neighborhoods/{slug}/context` |
| Web | `neighborhood-detail-screen.tsx` — tabs, lieux, moments, rail vidéo (C2-S5) |
| Vidéos | `LocalVideoTeaserSection` — max 3, thumbnail → `/videos?video=` |

**Contraintes :**

- Pilote Reims MEASURE actif — pas de régression perf fiche quartier
- Local Video DONE — règles teasers non négociables (C2-S5)
- Multi-ville future — schéma Reims-first mais extensible
- Pas de BUILD avant DESIGN + gates PRD §13

---

## Synthèse des décisions

| ADR | Sujet | Décision |
|-----|-------|----------|
| ADR-01 | Modèle de données | **Tables dédiées** (pas JSONB blob) |
| ADR-02 | Catalogue Reims | **12 quartiers** — 6 existants + 6 verrouillés |
| ADR-03 | API | **Évolution `GET /neighborhoods/{slug}`** — pas de route `/v2` |
| ADR-04 | Contributions | Flux **PENDING → admin → APPROVED/REJECTED** |
| ADR-05 | Médias | **R2 + CDN Yunicity** — interdiction hotlinks |
| ADR-06 | Moods | **7 tags éditoriaux** MVP — dynamiques post-pilote |
| ADR-07 | Local Video | **Teasers only** — max 3, pas de player inline |

---

## ADR-01 — Modèle de données

### Décision

**Tables relationnelles dédiées** pour tout contenu structuré V2. Pas de JSONB monolithique sur `neighborhoods`.

### Alternatives considérées

| Option | Pour | Contre |
|--------|------|--------|
| JSONB `editorial_payload` | Migration rapide | Non requêtable, admin difficile, dette multi-ville |
| **Tables dédiées** | Requêtes, index, modération, évolution | Plus de migrations initiales |

### Schéma cible

#### Extension table `neighborhoods`

| Colonne | Type | Notes |
|---------|------|-------|
| `long_story` | `TEXT` | Histoire longue (markdown/HTML subset sanitizé) |
| `why_locals_love` | `TEXT` | Section « Pourquoi les Rémois aiment… » |
| `featured_quote` | `VARCHAR(512)` | Citation éditoriale hero (optionnel) |
| `official_label` | `VARCHAR(64)` | Défaut : « Quartier officiel » |
| `hero_image_storage_key` | `VARCHAR(512)` | Clé R2 — URL CDN dérivée |
| `editorial_updated_at` | `TIMESTAMPTZ` | Dernière revue contenu staff |
| `editorial_updated_by` | `UUID FK users` | Nullable — audit staff |

**Conservation V1 :** `short_description`, `ambiance`, `cover_image_url` restent ; migration progressive `cover_image_url` → R2.

#### Table `neighborhood_aliases`

| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | UUID PK | |
| `neighborhood_id` | UUID FK | `ON DELETE CASCADE` |
| `alias` | VARCHAR(120) | NOT NULL |
| `is_primary` | BOOLEAN | Un seul `true` par quartier |
| `sort_order` | INT | Affichage hero |

Index : `(neighborhood_id)`, unique partiel `(neighborhood_id) WHERE is_primary`.

#### Table `neighborhood_moods`

Catalogue referential des 7 moods MVP + liaison M:N.

**`neighborhood_mood_tags`** (referential)

| Colonne | Type |
|---------|------|
| `slug` | VARCHAR(32) PK — ex. `gourmand` |
| `label` | VARCHAR(64) — ex. « Gourmand » |

**`neighborhood_mood_assignments`**

| Colonne | Type |
|---------|------|
| `neighborhood_id` | UUID FK |
| `mood_slug` | VARCHAR(32) FK |
| `sort_order` | INT |

Unique `(neighborhood_id, mood_slug)`. Max **3 moods** par quartier (contrainte service).

#### Table `neighborhood_timeline_entries`

| Colonne | Type |
|---------|------|
| `id` | UUID PK |
| `neighborhood_id` | UUID FK |
| `year` | INT NOT NULL |
| `title` | VARCHAR(200) |
| `body` | TEXT |
| `sort_order` | INT |
| `created_at` | TIMESTAMPTZ |

Index : `(neighborhood_id, year, sort_order)`.

#### Table `neighborhood_contributions`

| Colonne | Type |
|---------|------|
| `id` | UUID PK |
| `neighborhood_id` | UUID FK |
| `author_user_id` | UUID FK users |
| `body` | TEXT NOT NULL |
| `status` | VARCHAR(16) — `pending`, `approved`, `rejected` |
| `reviewed_by` | UUID FK users NULL |
| `reviewed_at` | TIMESTAMPTZ NULL |
| `rejection_reason` | VARCHAR(500) NULL |
| `created_at` | TIMESTAMPTZ |

Index : `(neighborhood_id, status)`, `(status, created_at)` pour file admin.

**`editorial_metadata`** : pas de table séparée — champs audit sur `neighborhoods` + timestamps contributions.

### Relations ORM

```txt
Neighborhood 1—* NeighborhoodAlias
Neighborhood *—* NeighborhoodMoodTag (via assignments)
Neighborhood 1—* NeighborhoodTimelineEntry
Neighborhood 1—* NeighborhoodContribution
```

---

## ADR-02 — Catalogue 12 quartiers Reims

### Décision

Extension du seed Reims de **6 → 12 quartiers administratifs**, avec alias habitants éditoriaux.

### Quartiers existants (6)

| Slug | Display name |
|------|--------------|
| `centre-ville` | Centre-ville |
| `saint-remi` | Saint-Remi |
| `boulingrin` | Boulingrin |
| `clairmarais` | Clairmarais |
| `cernay` | Cernay |
| `croix-rouge` | Croix-Rouge |

### Quartiers additionnels verrouillés (6)

| Slug | Display name | UUID seed (à assigner Q2-S1-02) |
|------|--------------|----------------------------------|
| `murigny` | Murigny | `d6010000-0000-4000-8000-000000000007` |
| `jean-jaures` | Jean-Jaurès | `d6010000-0000-4000-8000-000000000008` |
| `la-neuvillette` | La Neuvillette | `d6010000-0000-4000-8000-000000000009` |
| `orgeval` | Orgeval | `d6010000-0000-4000-8000-000000000010` |
| `chemin-vert` | Chemin-Vert | `d6010000-0000-4000-8000-000000000011` |
| `maison-blanche` | Maison-Blanche | `d6010000-0000-4000-8000-000000000012` |

Géolocalisation (`latitude`, `longitude`, `radius_meters`) : définie en seed Q2-S1-02 avec validation éditoriale — **pas bloquant ADR**.

### Alias habitants (exemples Q2-S1)

| Quartier | Alias principal | Alias secondaires |
|----------|-----------------|-------------------|
| `centre-ville` | Cathédrale | Place d'Erlon |
| `boulingrin` | Halles du Boulingrin | — |
| `jean-jaures` | Jean-Jaurès | — |
| `la-neuvillette` | Neuvillette | — |

### Reference implementations contenu

Priorité rédaction complète (histoire + timeline + moods + hero) :

1. **Boulingrin** — quartier signature produit
2. **Centre-ville** — trafic maximal pilote

Les 10 autres : contenu minimum viable Q2-S1 (hero image + short + 1 entrée timeline).

---

## ADR-03 — Contrat API

### Décision

**Enrichir l'endpoint existant** `GET /api/v1/neighborhoods/{slug}` — **pas** de `GET /neighborhoods/{slug}/v2`.

### Alternatives considérées

| Option | Verdict |
|--------|---------|
| Route `/v2` parallèle | ❌ double maintenance, duplication clients |
| Header `Accept-Version` | ❌ complexité disproportionnée MVP |
| **Response enrichie même route** | ✅ un contrat, migration front unique |

### Stratégie de compatibilité

1. Introduire schema **`NeighborhoodDetailResponse`** (superset de `NeighborhoodResponse`).
2. Changer `response_model` de `GET /{slug}` → `NeighborhoodDetailResponse`.
3. Champs V2 **optionnels** (`null` si contenu absent) — clients V1 ignorent les champs inconnus.
4. `GET /neighborhoods` (liste) reste **léger** — pas de long_story ni timeline.
5. `GET /{slug}/context` **conservé** phase transition ; web V2 bascule sur detail unifié puis dépréciation documentée post-pilote.

### Payload `NeighborhoodDetailResponse` (contrat)

```json
{
  "id": "uuid",
  "city": "Reims",
  "slug": "boulingrin",
  "display_name": "Boulingrin",
  "short_description": "...",
  "official_label": "Quartier officiel",
  "aliases": [
    { "alias": "Halles du Boulingrin", "is_primary": true }
  ],
  "moods": [
    { "slug": "gourmand", "label": "Gourmand" }
  ],
  "featured_quote": "...",
  "hero": {
    "image_url": "https://cdn.yunicity.../neighborhoods/.../hero.jpg",
    "accent_color": "#EEF0FF"
  },
  "history": {
    "long_story": "...",
    "why_locals_love": "..."
  },
  "timeline": [
    { "id": "uuid", "year": 1900, "title": "...", "body": "..." }
  ],
  "videos": [],
  "places": [],
  "events": [],
  "tribes": [],
  "creators": [],
  "passport_offers": [],
  "contributions": [],
  "stats": {
    "events_count": 0,
    "organizations_count": 0,
    "offers_count": 0
  },
  "latitude": 49.2565,
  "longitude": 4.0285,
  "is_featured": true,
  "is_active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

### Agrégats (sections)

| Clé | Source | Notes |
|-----|--------|-------|
| `videos` | `LocalVideoFeedService` filter `neighborhood_slug` | Max **3** items — ADR-07 |
| `places` | `CulturalPlace` par quartier | Existant |
| `events` | `LocalEvent` upcoming | Existant context |
| `tribes` | Tribus liées quartier | Existant hook |
| `creators` | Auteurs vidéos / orgs créateurs | Agrégat léger |
| `passport_offers` | `PartnerOffer` quartier | Existant |
| `contributions` | `neighborhood_contributions` WHERE `approved` | Public read only |

### Nouveaux endpoints (hors detail)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/neighborhoods/{slug}/contributions` | user | Soumission anecdote → `pending` |
| GET | `/admin/neighborhood-contributions` | staff | File modération |
| PATCH | `/admin/neighborhood-contributions/{id}` | staff | Approve / reject |
| PUT/PATCH | `/admin/neighborhoods/{id}/editorial` | staff | Histoire, timeline, moods, aliases |

Rate limit soumission : **3 contributions / user / quartier / 24h**.

### Service layer

```txt
NeighborhoodDetailService
  ├─ NeighborhoodRepository (core + joins aliases/moods/timeline)
  ├─ LocalVideoFeedService (teasers)
  ├─ CulturalPlaceService (places)
  ├─ NeighborhoodContextService (events, offers — refactor partiel)
  └─ NeighborhoodContributionRepository (approved public / admin all)
```

**Perf :** une requête detail = 1 transaction ; agrégats en requêtes ciblées parallélisables (async gather) — objectif p95 < 500 ms recette.

---

## ADR-04 — Contributions habitantes

### Décision

Flux **modération obligatoire**. Aucune publication automatique. Pas de votes MVP.

### Flux

```txt
Habitant connecté
  → POST /neighborhoods/{slug}/contributions { body }
  → status = pending
  → Admin review (ADMIN-V1 permissions)
  → approved | rejected (+ motif optionnel)
  → Si approved : visible dans detail.contributions
```

### Règles métier

| Règle | Détail |
|-------|--------|
| Longueur body | 40–800 caractères |
| PII | Interdit email/téléphone — validation regex + modération |
| XSS | Sanitize texte plain only MVP |
| Public | Uniquement `approved` |
| Auteur | Voit ses `pending` / `rejected` dans « Mes contributions » (Q2-S4 UI) |
| Commentaires | **Hors scope** — pas de thread sur anecdote |

### Permissions

| Action | Rôle |
|--------|------|
| Soumettre | `USER` authentifié |
| Lister pending | `MODERATOR`, `CITY_ADMIN`, `SUPER_ADMIN` |
| Approve/reject | idem |

---

## ADR-05 — Médias quartiers

### Décision

**Cloudflare R2 + CDN Yunicity** — même philosophie que Local Video (`ADR-CREATORS-V2-local-video-media.md`).

### Interdictions

```txt
✗ Bing / iStock / hotlinks presse
✗ Unsplash aléatoire non contrôlé en prod
✗ URLs externes non auditées en hero quartier
```

Seed dev / rédaction : assets uploadés manuellement staff → R2 avant publication prod.

### Structure clés R2

```
neighborhoods/{env}/{city_slug}/{neighborhood_slug}/hero.jpg
neighborhoods/{env}/{city_slug}/{neighborhood_slug}/gallery/{n}.jpg
```

### URLs publiques

- Pattern CDN : `{CDN_BASE}/neighborhoods/...`
- DB stocke `hero_image_storage_key` — URL construite par service (comme local video `media_url`)

### Fallback dev

Filesystem `media_upload_dir/neighborhoods/` via adapter `NeighborhoodMediaStorage` — **dev/CI only**.

### Static Next.js

Le dossier `frontend/apps/web/public/neighborhoods/` peut servir **placeholders dev** uniquement — pas source prod.

---

## ADR-06 — Moods éditoriaux

### Décision

**7 moods referential MVP** — assignation staff, max 3 par quartier.

| Slug | Label FR |
|------|----------|
| `etudiant` | Étudiant |
| `familial` | Familial |
| `creatif` | Créatif |
| `festif` | Festif |
| `calme` | Calme |
| `gourmand` | Gourmand |
| `patrimonial` | Patrimonial |

### Évolution post-pilote (hors MVP)

```txt
Moods dynamiques
  ← signaux pilote (vidéos, events, heures)
  ← couche analytics MEASURE
```

Pas de table `mood_signals` MVP — extension ADR future.

### Distinction `ambiance` V1

Le champ `neighborhoods.ambiance` (enum V1 : lively, calm, cultural…) **reste** pour compat feed/badge. Les **moods V2** sont la couche éditoriale hero — les deux coexistent phase transition ; dépréciation `ambiance` documentée post-pilote si redondant.

---

## ADR-07 — Compatibilité Local Video

### Décision

Réutilisation stricte du contrat **C2-S5** — aucune exception quartier.

| Règle | Valeur |
|-------|--------|
| Format hero | **Thumbnail only** |
| Max vidéos | **3** |
| Clic | `/videos?video={id}` |
| Player inline | **Interdit** |
| Autoplay | **Interdit** |
| Fetch | `LocalVideoFeedService` + filter client `neighborhood_slug` |

### Placement UI

Vidéos dans **hero** (Q2-S2) — plus rail secondaire bas de page.

Composants réutilisés :

- `LocalVideoTeaserSection` / `LocalVideoTeaserRail`
- `filterLocalVideoTeasers` (`@yunicity/utils`)

---

## Migration & rollout

| Étape | Action |
|-------|--------|
| 1 | Migration Alembic tables ADR-01 |
| 2 | Seed 6 quartiers + aliases + moods tags referential |
| 3 | Contenu éditorial Boulingrin + Centre-ville |
| 4 | Deploy API detail enrichi (champs null OK) |
| 5 | Front Q2-S2 consomme detail unifié |
| 6 | Contributions Q2-S4 + admin file |

Feature flag optionnel : `neighborhoods_v2_detail_enabled` — défaut `true` recette, `false` prod jusqu'à DESIGN validé.

---

## Sécurité

| Surface | Mesure |
|---------|--------|
| Detail public | Read-only, pas de draft leak |
| Contributions | Rate limit, auth, modération |
| long_story HTML | Bleach / subset tags whitelist |
| IDOR admin | Staff RBAC existant |
| R2 upload staff | Presigned PUT staff-only |

Checklist : `docs/ai/security-checklist.md` avant merge BUILD.

---

## Conséquences

### Positives

- Schéma évolutif multi-ville
- Admin requêtable (timeline, contributions, moods)
- Un seul endpoint detail — simplicité client
- Alignement médias Local Video

### Négatives / coûts

- Migration + seed contenu éditorial lourd (12 quartiers)
- Detail API plus riche → vigilance perf (gather async)
- Double champ ambiance/moods temporaire

### Ne pas faire

- JSONB fourre-tout
- Route `/v2` parallèle
- Publication contributions sans modération
- Player vidéo inline fiche quartier

---

## Tickets dérivés (BUILD)

Alignés PRD §10 :

```txt
Q2-S1-01  Migration Alembic (ADR-01)
Q2-S1-02  Seed 12 quartiers + aliases (ADR-02)
Q2-S1-03  NeighborhoodDetailService + GET /{slug} enrichi (ADR-03)
Q2-S1-04  NeighborhoodMediaStorage R2 (ADR-05)
Q2-S2-01  Hero vidéo-first (ADR-07)
Q2-S4-01  Contributions + admin (ADR-04)
```

---

## Historique

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-06-13 | Founder + CTO | Décisions ADR-01 → ADR-07 verrouillées |
| 2026-06-13 | Cursor | Rédaction ADR officielle |

---

## Verdict

```txt
FEATURE-QUARTIERS-V2
DISCOVER     ✅
PRD          ✅
ADR          ✅ APPROVED
DESIGN       🟢 EN REVIEW (`docs/quartiers/DESIGN-QUARTIERS-V2.md`)
BUILD        🔒
COMMIT       ⏸ après validation Founder T1–T5
```

**Prochaine action :** validation Founder T1–T5 — `docs/quartiers/DESIGN-QUARTIERS-V2.md`
