# ADR-MAP-V2-A — Activation interface territoriale

| Champ | Valeur |
|-------|--------|
| Statut | **APPROVED** |
| Date | 2026-06-13 |
| PRD | `docs/prd/PRD-MAP-V2-A-activation.md` |
| DISCOVER | Audit MAP-V2 (2026-06-13) |
| Décision | Révéler l'existant — zéro backend, 4 tickets frontend |

---

## Contexte

DISCOVER MAP-V2 a établi que la carte web (`event-map-screen.tsx`) possède déjà ~80 % de l'interface territoriale cible : pins quartiers, lieux, événements, partenaires, carousel « autour de vous », géoloc opt-in, panneaux vers expériences Cycle 1.

Le trou n'est pas technique — il est **produit** : auth gate, rail mort, itinéraires centraux, filtres dupliqués.

Cycle 2 pilote Reims actif : MAP-V2.A est une **opération de révélation**, pas une feature factory.

---

## Synthèse des décisions

| ADR | Sujet | Décision |
|-----|-------|----------|
| ADR-A1 | Accès `/map` | **Public** — retirer `ProtectedRoute` |
| ADR-A2 | MapRightRail | **Monter** dans `EventMapScreen` |
| ADR-A3 | Itinéraires | **Masquer UI MVP** — code Mapbox conservé, non exposé |
| ADR-A4 | Filtres | **Grammaire unifiée** 6 entrées |
| ADR-A5 | Backend | **Aucun** endpoint ni migration |
| ADR-A6 | Vidéos / Souvenirs | **Gelés** MAP-V2.B/C — signaux pilote |

---

## ADR-A1 — Carte publique

### Décision

Retirer `ProtectedRoute` de `frontend/apps/web/app/map/page.tsx`.

### Justification

- `GET /api/v1/map/events` et `GET /api/v1/map/cultural-places` utilisent déjà `get_current_user_optional`
- Liste quartiers, partenaires, offres publiques : endpoints publics ou déjà consommables visiteur
- Alignement cycle Découvrir → Comprendre → Participer : la carte est porte d'entrée territoriale

### Conséquences

- Visiteur voit pins et panneaux ; actions compte (favoris, contribution, etc.) redirigent login si nécessaire
- `useMapPageContext` : `getProfileMe` échoue gracieusement (déjà géré)
- Pas de fuite PII : uniquement données catalogue public

### Alternatives rejetées

| Option | Raison rejet |
|--------|--------------|
| Carte semi-publique (aperçu flou) | Friction artificielle |
| Nouveau endpoint map public | Backend inutile |

---

## ADR-A2 — MapRightRail

### Décision

Intégrer `MapRightRail` dans `EventMapScreen` via `MapAppShell.rightRail` lorsqu'aucun panneau détail sélectionné.

### Layout

```txt
2xl+ : [FilterRail] [Carte] [MapRightRail]
       sélection lieu/event/partenaire → remplace rail par detailRail (comportement actuel)
```

### Données

Réutiliser `useMapPageContext()` déjà instancié indirectement — ajouter contexte partagé ou passer `mapContext` à `MapRightRail`.

`onStartRoute` : no-op ou retiré si ADR-A3 masque itinéraires.

### Alternatives rejetées

| Option | Raison rejet |
|--------|--------------|
| Réécrire rail | Code mort `map-right-rail.tsx` suffit |
| Rail mobile bottom sheet | Hors scope A — desktop 2xl d'abord |

---

## ADR-A3 — Itinéraires

### Décision

**Masquer tous les CTA « Itinéraire »** dans l'UI carte MVP MAP-V2.A.

Conserver en codebase (non supprimé) : `MapCulturalRoutePanel`, handlers Mapbox — désactivés via absence de déclencheurs UI.

### Fichiers impactés

- `map-selected-panel.tsx` — retirer liens/boutons route
- `map-place-detail-panel.tsx` — retirer `MAP_PORTAL_DETAIL_ROUTE`
- `map-partner-detail-panel.tsx` — retirer `onStartRoute`
- `map-cultural-places-rail.tsx` — retirer `onRoute`
- `event-map-screen.tsx` — ne plus passer `?route=true` ; optionnel : dead-code handlers commentés ou guard `MAP_ROUTES_ENABLED=false`

### Justification

Identité Yunicity = interface territoriale, pas Google Maps. DISCOVER + CTO : confusion identitaire G3.

### Alternative future

Réintroduire en lien externe « Ouvrir dans Maps » (post-pilote) — hors MAP-V2.A.

---

## ADR-A4 — Filtres unifiés

### Décision

**Source de vérité unique :** `MapPortalCategoryId` réduit à :

```txt
all | neighborhoods | places | events | partners | more
```

Mapping interne :

| Filtre UI | Layer visibility |
|-----------|------------------|
| Tout | all layers |
| Quartiers | neighborhoods only |
| Lieux | places + culture + nature |
| Événements | events only |
| Passport | partners only |
| Plus | lien `/search` (inchangé) |

### Masqués MVP (non supprimés code)

`tribes`, `transit`, `culture`, `nature` comme filtres top-level — accessibles via « Lieux » ou « Plus ».

### Implémentation

- `map-search-chips.tsx` et `map-left-filter-rail.tsx` partagent la même liste `MAP_V2_A_CATEGORIES`
- Constantes labels dans `@yunicity/utils` (`map-portal-labels.ts`)

---

## ADR-A5 — Zéro backend

Aucun nouveau endpoint, migration, service.

Extension future MAP-V2.B (`contributions_count` sur liste quartiers) : **hors MAP-V2.A**.

---

## ADR-A6 — Gel MAP-V2.B / C

| Phase | Déclencheur |
|-------|-------------|
| MAP-V2.B Vidéos | Verbatim pilote récurrent |
| MAP-V2.C Souvenirs | Verbatim pilote récurrent |

---

## Fichiers impactés (BUILD)

```txt
frontend/apps/web/app/map/page.tsx
frontend/apps/web/components/map/event-map-screen.tsx
frontend/apps/web/components/map/map-search-chips.tsx
frontend/apps/web/components/map/map-left-filter-rail.tsx
frontend/apps/web/components/map/map-selected-panel.tsx
frontend/apps/web/components/map/map-place-detail-panel.tsx
frontend/apps/web/components/map/map-partner-detail-panel.tsx
frontend/apps/web/components/map/map-cultural-places-rail.tsx
frontend/packages/utils/src/map-portal.ts (types filtres)
frontend/packages/utils/src/map-portal-labels.ts (labels)
```

---

## Sécurité

| Zone | Évaluation |
|------|------------|
| Carte publique | Données catalogue déjà exposées ailleurs (explorer, quartiers) |
| Rate limits map | Conservés (`MAP_RATE_LIMIT`) |
| Géoloc | Opt-in utilisateur — pas de tracking serveur |
| PII | Aucune sur pins carte |

---

## Statut gates

```txt
ADR     ✅ APPROVED
DESIGN  🔜
BUILD   🔒 en attente GO BUILD MAP-V2.A
```
