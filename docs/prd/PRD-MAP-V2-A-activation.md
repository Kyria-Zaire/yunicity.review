# PRD-MAP-V2-A — Activation interface territoriale

| Champ | Valeur |
|-------|--------|
| ID | PRD-MAP-V2-A |
| Feature | `FEATURE-MAP-V2.A` |
| Statut | **PRD VALIDÉ** |
| Phase BMAD | DESIGN → BUILD (activation) |
| Priorité | P0 pilote Reims |
| Date | 2026-06-13 |
| DISCOVER | Audit BMAD MAP-V2 (session 2026-06-13) |
| ADR | `docs/architecture/ADR-MAP-V2-A-activation.md` |
| DESIGN | `docs/ux/DESIGN-MAP-V2-A-activation.md` |

---

## 1. Positionnement

**Ce n'est pas :** construire une nouvelle carte.

**C'est :** révéler l'interface territoriale déjà présente dans Yunicity.

DISCOVER a démontré que ~80 % du socle carte existe (`event-map-screen`, APIs bbox, pins quartiers/lieux/événements/partenaires, carousel proximité, panneaux détail).

---

## 2. Problème

La carte existe, est puissante et riche, mais donne l'impression d'un « module événements avec quelques pins ».

Gaps bloquants identifiés :

| ID | Problème |
|----|----------|
| G1 | `/map` protégé par `ProtectedRoute` — connexion avant découverte |
| G2 | `MapRightRail` codé mais jamais monté (Passport, live discovery, ambiances) |
| G3 | Itinéraires Mapbox au centre — confusion identitaire Google Maps |
| G4 | Double grammaire filtres (chips + rail) |

---

## 3. Objectif

Permettre à un Rémois d'ouvrir la carte et de répondre immédiatement à :

> **« Qu'est-ce qu'il y a autour de moi ? »**

sans apprendre une nouvelle interface.

---

## 4. Question north star

> Quand un Rémois ouvre la carte, comprend-il instantanément ce qu'il y a autour de lui et ce qu'il peut faire ensuite ?

---

## 5. Scope MAP-V2.A (4 tickets)

### Ticket A — Déprotéger `/map`

- **Avant :** `/map` → connexion obligatoire
- **Après :** découverte immédiate ; login uniquement sur actions compte
- **Backend :** aucun (`GET /map/events` et `/map/cultural-places` déjà `optional` auth)

**AC :**

- [ ] `/map` accessible sans authentification
- [ ] Aucune régression usages connectés
- [ ] CTA login uniquement si action nécessite compte

### Ticket B — Réactiver `MapRightRail`

Monter le composant existant : Passport, Live Discovery, Ambiances quartiers.

**AC :**

- [ ] Rail visible desktop (2xl) sans mock
- [ ] Données `useMapPageContext` existantes uniquement
- [ ] Responsive conservé ; mobile inchangé si rail masqué

### Ticket C — Sortir les itinéraires du cœur produit

Itinéraires Mapbox → secondaires ou masqués MVP.

**AC :**

- [ ] Plus de CTA dominant « Itinéraire » sur panneaux carte
- [ ] Pas de confusion Google Maps / Citymapper
- [ ] Code route conservé derrière flag ou suppression UI (décision ADR)

### Ticket D — Unifier les filtres

Une grammaire : **Tout · Quartiers · Lieux · Événements · Passport · Plus**

**AC :**

- [ ] Chips et rail alignés sur le même modèle
- [ ] Mobile et desktop cohérents
- [ ] Doublons supprimés (tribus/transports/nature → « Plus » ou masqués MVP)

---

## 6. Hors scope (gelé)

```txt
❌ Pins vidéos (MAP-V2.B)
❌ Badges souvenirs (MAP-V2.C)
❌ Heatmaps · GPS live · Navigation turn-by-turn
❌ Nouveau backend carte
❌ IA carte · Refonte Mapbox · Clustering avancé
```

### MAP-V2.B — Vidéos

**Condition :** signal pilote S1–S2 — *« Je voudrais voir les vidéos autour de moi. »*

### MAP-V2.C — Souvenirs

**Condition :** signal pilote S1–S2 — *« Je voudrais voir les souvenirs liés aux quartiers. »*

---

## 7. Risques

| Risque | Mitigation |
|--------|------------|
| Carte publique expose données déjà publiques | APIs map déjà sans auth obligatoire |
| Scope creep vers vidéos/souvenirs | Hors scope PRD ; gates pilote |
| Régression itinéraires pour power users | Masquage UI, pas suppression backend Mapbox |

---

## 8. Tests VERIFY

```bash
# Frontend
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web build

# Manuel
- Visiteur non connecté : /map charge, pins visibles
- Connecté : filtres, rail, panneaux inchangés
- Pas de CTA « Itinéraire » dominant
```

---

## 9. Gates §13 (BUILD)

| Gate | Statut |
|------|--------|
| PRD validé | ✅ |
| ADR | 🔜 |
| DESIGN | 🔜 |
| Permissions | N/A (lecture publique carte) |
| Endpoints | Aucun nouveau |
| Modèle DB | Aucune migration |
| Tests | Lint + typecheck + build + recette manuelle |
| Sécurité | Review : carte publique = données déjà publiques |

---

## 10. BMAD

```txt
DISCOVER   ✅
PRD        ✅
ADR        🔜
DESIGN     🔜
BUILD      🔒 (GO explicite A→D)
VERIFY     🔒
```

**Décision CTO :** MAP-V2.A = dernier chantier activation avant GO-LIVE Reims. Pas reconstruction.
