# DESIGN — MAP-V2.A Activation

| Champ | Valeur |
|-------|--------|
| Feature | `FEATURE-MAP-V2.A` |
| PRD | `docs/prd/PRD-MAP-V2-A-activation.md` |
| ADR | `docs/architecture/ADR-MAP-V2-A-activation.md` |
| Phase | DESIGN ✅ |
| Gate TICKET-305B | Doctrine calme — `docs/ai/frontend-design-system.md` |

---

## 1. Intention UX

**Révéler**, pas réinventer.

La carte doit passer de « module événements » à **vue territoire Yunicity** en 3 secondes :

1. Je vois ma ville sur la carte
2. Je comprends les types de points (filtres)
3. Je clique → j'atterris sur une expérience déjà construite

Copy north star (inchangée) :

> « Qu'est-ce qu'il y a autour de moi ? »

---

## 2. Parcours visiteur (Ticket A)

```txt
Arrivée /map (sans login)
↓
Carte Reims + chips filtres
↓
Clic pin → panneau « Voir le quartier / lieu / moment »
↓
Destination Cycle 1 (/neighborhoods, /places, /events)
↓
Action compte (ex. favori) → login si nécessaire
```

**Interdit :** redirect login à l'entrée `/map`.

---

## 3. Layout (Ticket B)

### Desktop 2xl+

```txt
┌──────────┬─────────────────────────────┬──────────────┐
│ Filtres  │  Carte + chips + carousel   │ MapRightRail │
│ (rail L) │                             │ (live,       │
│          │                             │  quartiers,  │
│          │                             │  passport)   │
└──────────┴─────────────────────────────┴──────────────┘
```

### Sélection active

Rail droit remplacé par `MapPlaceDetailPanel` / `MapPartnerDetailPanel` (comportement actuel).

### Mobile

- Pas de `MapRightRail` (hidden 2xl)
- Carousel « Autour de vous » conservé
- Filtres via chips uniquement

---

## 4. Grammaire filtres (Ticket D)

### Chips carte (mobile + desktop)

| Chip | ID | Couleur sémantique |
|------|-----|-------------------|
| Tout | `all` | primary actif |
| Quartiers | `neighborhoods` | 🟣 |
| Lieux | `places` | 🟢 |
| Événements | `events` | 🟠 |
| Passport | `partners` | 🔵 |
| Plus | `more` | lien `/search` |

### Rail gauche (xl+)

**Même liste**, même ordre, mêmes labels — pas de catégories supplémentaires visibles MVP.

Supprimé du rail visible :

- Tribus, Transports, Culture, Nature (sous-ensembles de « Lieux » ou « Plus »)

### Filtres secondaires (conservés)

- Ambiances quartiers (rail gauche)
- Distance / ouvert maintenant — si origine géoloc active

---

## 5. Itinéraires (Ticket C)

### Avant

Panneau flottant : **[Voir le lieu]** + **[Itinéraire]** (co-primaires)

### Après MAP-V2.A

```txt
CTA primaire unique : « Voir le quartier / le lieu / le moment »
```

**Supprimé de l'UI :**

- Boutons « Itinéraire » (`MAP_PANEL_*_ROUTE`, `MAP_PORTAL_DETAIL_ROUTE`)
- Panneau route Mapbox non déclenchable
- Lien `?route=true` ignoré ou retiré

**Conservé en code** (ADR-A3) — pas de suppression fichier.

---

## 6. MapRightRail — contenu (Ticket B)

Sections existantes, ordre :

1. **À découvrir** (`MAP_RAIL_LIVE_TITLE`) — events, culture, passport, quartier
2. **Ambiances** — 3 quartiers + lien « Tous les quartiers »
3. **Transports** — `MapTransitNearby` (conservé)
4. **Lieux culturels** — rail existant
5. **Passport autour** — offres → `/passport`

Empty states : copy existants (`MAP_RAIL_*_EMPTY`) — pas de nouveau texte.

---

## 7. États vides (inchangés)

| État | Copy existant |
|------|---------------|
| Carte vide | `MAP_EMPTY` + `MAP_EMPTY_HINT` |
| Autour de vous | `MAP_PORTAL_AROUND_EMPTY` |
| Rail live | `MAP_RAIL_LIVE_EMPTY` |
| Passport | `MAP_RAIL_PASSPORT_AROUND_EMPTY` |

---

## 8. Accessibilité

- Filtres : boutons avec état `aria-pressed` sur chip actif
- Panneau sélection : `role="dialog"` conservé
- Carte publique : loader session retiré à l'entrée (plus de `ProtectedRoute`)

---

## 9. Non-objectifs design

```txt
❌ Nouvelle légende 6 couleurs MAP-V2 complète (B/C)
❌ Refonte Mapbox style
❌ Animation carte
❌ Onboarding carte
```

---

## 10. Critères design DONE

- [ ] Wire mental : 1 grammaire filtres
- [ ] Visiteur atterrit sur carte sans login
- [ ] Rail droit visible desktop sans mock
- [ ] Zéro CTA « Itinéraire » visible
- [ ] Clic pin → destination Cycle 1 identifiable

---

## 11. Prochaine étape

```txt
GO BUILD MAP-V2.A
Tickets A → B → C → D (ordre strict)
```
