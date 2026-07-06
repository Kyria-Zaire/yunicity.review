# Event Detail Review — SPRINT-UX-01

| Champ | Valeur |
|-------|--------|
| Section | §3 — Event Detail Review |
| Référence | [ux-hardening-audit.md](./ux-hardening-audit.md) |
| Web | `components/events/event-detail-screen.tsx` |
| Mobile | `app/(protected)/events/[id].tsx` |
| Types | `packages/types/src/local-event.ts` |

---

## 1. Objectif

Analyser pages **détail moment local** : respiration, contexte territorial, CTAs, micro-améliorations **sans** surcharge type Facebook/Eventbrite.

---

## 2. Parité web / mobile

### 2.1 Champs affichés

| Champ | Web | Mobile |
|-------|-----|--------|
| `title` | h1 | Oui |
| `starts_at` / `ends_at` | `formatEventDateRange` | Oui |
| Lieu / quartier | `formatTerritorialLine` + badge | Texte, pas badge |
| `description` | Si présent | Si présent |
| `cover_image_url` | Image max-h-72 | **Non** |
| `event_type` | Label type | **Non** |
| `organization.name` | « Organisé par » | **Non** |
| `neighborhood_summary` | `NeighborhoodBadge` | **Non** |
| `interested_by_me` | CTA toggle | Oui |

### 2.2 Champs modèle non exposés (volontairement OK)

- `latitude` / `longitude` (carte séparée — bon)
- `moderation_status`, `is_cancelled` (admin — bon)
- `timezone` (interne)

---

## 3. Respiration & layout

### Web

- Structure : cover optionnelle → type → titre → dates → lieu → quartier → org → description → CTA.
- Espacement : shell `readable` / carte blanche — **aéré**, professionnel.
- **Manque de respiration** seulement si pas de cover (bloc texte dense en haut).

### Mobile

- `ScrollView`, `padding: 16`, `gap: 12`.
- Pas d’image → **mur de texte** sur événements longs.
- CTA pill en bas — bon thumb zone.

---

## 4. Contexte territorial (gaps)

| Contexte | Présent ? | Recommandation |
|----------|-----------|----------------|
| Quartier nommé | Web badge | Mobile : ajouter badge |
| Organisateur | Web | Mobile : ligne texte + lien org si route existe |
| Carte emplacement | Non | **P2** mini-map statique (pin fixe, pas interaction) |
| Autres moments proches | Non | **P1** bloc 2–3 cartes même quartier / bbox serrée |
| Lien vers carte | Non | **P1** « Voir sur la carte » → `/map` centré event |

**Principe :** contexte = **curiosité locale**, pas fil social.

---

## 5. CTAs

| CTA | Label | Comportement |
|-----|-------|--------------|
| Intérêt | « Je suis intéressé » / « Moment sauvegardé » | Toggle API |

### Améliorations micro (P1)

1. Feedback visuel immédiat (toast mobile « Moment sauvegardé »).
2. Sous-texte CTA : « Retrouvez-le dans vos moments » (si page liste filtre intérêt — vérifier API).
3. État désactivé si événement passé (copy « Ce moment est terminé »).

**Non recommandé :** partage viral, inviter amis Facebook, billetterie externe lourde.

---

## 6. Liste événements (entrée vers détail)

| | Web | Mobile |
|---|-----|--------|
| Titre page | Moments locaux | Moments locaux |
| Carte liste | `EventListCard` (type, org, quartier) | `EventRow` (minimal) |
| Lien carte | « Voir la carte » | **Absent** |
| Empty | Texte simple | Idem |

**Recommandation :** enrichir `EventRow` mobile avec **date courte + quartier** (1 ligne), pas tout le modèle.

---

## 7. Flux depuis carte

| Étape | Web | Mobile |
|-------|-----|--------|
| Clic marqueur | Popup Mapbox | Callout bas |
| CTA | Voir l’événement | Idem |
| Détail | `/events/[id]` | `/(protected)/events/[id]` |

**Retour carte :** pas de breadcrumb — acceptable ; **back** natif suffit.

---

## 8. Micro-améliorations priorisées

| ID | Amélioration | P | Effort |
|----|--------------|---|--------|
| E1 | Mobile : cover si URL | P1 | S |
| E2 | Mobile : event_type + org | P1 | S |
| E3 | Mobile : NeighborhoodBadge | P1 | S |
| E4 | Bloc « Près d’ici » (3 events max) | P1 | M |
| E5 | Lien « Sur la carte » (deep link coords) | P1 | M |
| E6 | Mini-map statique web + mobile | P2 | M |
| E7 | Metadata légère : durée, gratuit/payant (si champ futur) | P2 | — |

---

## 9. Anti-patterns à éviter

- Fil de commentaires public illimité sur détail (garder commentaires au feed si besoin).
- Liste participants type Eventbrite.
- Countdown anxiogène « Plus que 2 places ».
- Carte temps réel affluence.

---

## 10. Critères beta

| Question observateur | Bon signal |
|---------------------|------------|
| Où ? Quand ? Qui organise ? | Répondu en < 10s |
| Envie d’y aller | CTA intérêt compris |
| Sait revenir à la carte | Lien explicite compris |

---

*Carte : voir §4 dans [ux-hardening-audit.md](./ux-hardening-audit.md)*
