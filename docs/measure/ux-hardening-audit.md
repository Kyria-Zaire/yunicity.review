# Audit UX Hardening — SPRINT-UX-01

| Champ | Valeur |
|-------|--------|
| Phase | **MEASURE** → UX HARDENING |
| Sprint | SPRINT-UX-01 — Product Coherence & Experience Density |
| Statut | DISCOVER + DESIGN — **aucun refactor livré** |
| Date | 2026-05-25 |
| Périmètre | Web citoyen, mobile Expo, surfaces post-FEATURE-D |

---

## 1. Contexte et posture

Yunicity est passé d’un produit « en construction » à un **produit fonctionnel et territorialement crédible** :

- Fil local, quartiers, tribus, recherche, événements, carte web/mobile, Passport, offres locales.

Le risque dominant n’est plus l’absence de features, mais :

- surcharge de navigation ;
- fatigue cognitive (surtout mobile) ;
- densité émotionnelle insuffisante ;
- perte de hiérarchie produit ;
- multiplication des surfaces au même niveau visuel.

**Ce sprint :**

- clarifier, respirer, densifier intelligemment, hiérarchiser ;
- rendre l’expérience plus **vivante** sans devenir bruyante ;
- **pas** de grosses features, pas de nouvelles couches sociales, pas de viralité, pas de redesign complet.

---

## 2. Méthodologie

| Source | Usage |
|--------|--------|
| Revue code | `frontend/apps/web`, `frontend/apps/mobile`, `packages/utils` (labels, layout) |
| Parité web/mobile | Écarts documentés (feed event, détail événement) |
| Doctrine produit | Carte calme, pas de géoloc user, mantra territorial |
| BMAD | Phase MEASURE — observations avant ANALYZE/DECIDE |

Documents détaillés :

| Document | Focus |
|----------|--------|
| [navigation-review.md](./navigation-review.md) | Nav web + tabs mobile |
| [feed-density-review.md](./feed-density-review.md) | Rythme, vide, hiérarchie fil |
| [event-detail-review.md](./event-detail-review.md) | Détail moment local |
| [mobile-fatigue-review.md](./mobile-fatigue-review.md) | Taps, scroll, tabs |
| [beta-observation-script.md](./beta-observation-script.md) | Protocole terrain 5–10 users |
| [product-coherence-report.md](./product-coherence-report.md) | Synthèse maturité & readiness beta |

---

## 3. Synthèse exécutive (findings transverses)

### Forces

1. **Territoire explicite** — ville, quartiers, tribus, carte Reims-centrée cohérente avec la vision.
2. **Carte non anxiogène** — pas de géoloc, pas de clustering agressif, marqueurs sobres `#2A2FFF`.
3. **Architecture nav maintenable** — `WEB_CITIZEN_NAV` (web), tabs Expo (mobile), hub `events/[id]`.
4. **Micro-copy centralisée** — `feed-labels`, `map-labels`, `event-labels` (FR utilisateur).
5. **Fil web modulaire** — cartes typées (citoyen, lieu, offre, événement).

### Risques P0–P1

| ID | Risque | Plateforme |
|----|--------|------------|
| R1 | **11 entrées nav web** dont « Proposer un lieu » au même niveau que Fil | Web |
| R2 | **8 onglets mobile** — barre saturée, Passport/Lieux en concurrence | Mobile |
| R3 | **Parité feed** — posts `event` non traités sur mobile | Mobile |
| R4 | **Incohérence libellés** — nav « Événements » vs titre « Moments locaux » | Web + mobile |
| R5 | **Recherche hors tab mobile** — 2e entrée depuis Fil + Profil | Mobile |
| R6 | **Détail événement mobile** — sous-ensemble métadonnées vs web | Mobile |

### Ce qui ne doit pas bouger (architecture)

- Routes API et `/map/events` ;
- Pas de géoloc utilisateur sur la carte ;
- Hub unique `events/[id]` ;
- `WebAppShell` + `WEB_CITIZEN_NAV` comme source unique web.

---

## 4. Carte — revue expérience (§4)

Référence code : `event-map-screen.tsx`, `event-map.tsx` (web + mobile), `map-labels.ts`.

### Lisibilité & calme

| Critère | Web | Mobile | Verdict |
|---------|-----|--------|---------|
| Style carte | Mapbox Light | Mapbox Light | OK — calme |
| Marqueurs | Pin #2A2FFF, popup Mapbox | Pin 12px, callout bas | OK — sobre |
| Géoloc user | Absent | Absent | OK — doctrine |
| Clustering | Absent | Absent | OK |
| Recentrage ville | Bouton `MAP_RECENTER` | Idem | OK |

### Densité marqueurs & fatigue

- Limite API 100 + hint `MAP_TRUNCATED_HINT` : bon filet, évite surcharge visuelle.
- Risque **moyen** : trop de pins au zoom ville entière (Reims) → bruit modéré, pas heatmap.
- **Recommandation P1** : conserver le hint ; envisager zoom minimum suggéré (copy, pas algo) si tests beta montrent confusion.

### Équilibre carte / liste

| Surface | Lien carte ↔ liste |
|---------|-------------------|
| Web events | CTA « Voir la carte » présent (`events-screen`) |
| Mobile events | **Absent** — pas de lien vers onglet Carte |
| Carte → détail | CTA `MAP_VIEW_EVENT` des deux côtés | OK |

### Sidebar / chrome

- Web : pas de sidebar carte dédiée — carte pleine colonne + header page. OK pour MVP.
- Mobile : header + callout bas — **bon** pour une main (pas popup flottant sur pin).

### Non-anxiogénité (checklist)

- [x] Pas de position temps réel utilisateur
- [x] Pas de « X personnes ici »
- [x] Sous-titre carte explicite (calme, pas fil live)
- [x] États vide / erreur / token documentés
- [ ] **P2** : lien depuis liste Moments mobile vers Carte

**Verdict carte :** alignée doctrine « voir sa ville, pas surveiller ses voisins ». Hardening = polish liens + parité mobile, pas refonte Mapbox.

---

## 5. Émotion produit (§6)

### Question centrale

> *Qu’est-ce que ça fait de vivre dans Yunicity aujourd’hui ?*

**Réponse actuelle (honnête) :** on se sent dans une **ville organisée** — calendrier local, quartiers nommés, tribus, Passport — plus qu’ dans un flux addictif. La **curiosité** est présente (recherche, carte, tribus) ; la **chaleur** dépend du contenu seed / beta, pas encore du rythme UI.

### Comparaisons implicites (à éviter)

| Plateforme | Piège pour Yunicity |
|------------|---------------------|
| TikTok | Scroll infini, dopamine |
| Facebook | Mur générique, réactions performatives |
| Snapchat | Urgence, streaks |
| Discord | Canaux illimités, bruit |

### Ce qui rend Yunicity unique (à protéger)

1. **Ancrage Reims / ville** — pas « le monde ».
2. **Moments locaux** — temporalité événementielle vs posts éternels.
3. **Passport & offres** — relation citoyen ↔ commerce local (pas pub display).
4. **Carte territoriale calme** — exploration, pas tracking.
5. **Tribus & quartiers** — appartenance légère, pas groupes massifs.

### Écarts émotionnels

| Zone | Sensation actuelle | Cible hardening |
|------|-------------------|-----------------|
| Fil | Informatif, parfois uniforme | Plus de **respiration** entre types de cartes |
| Onglets mobile | Utilitaire, « app admin » | **3–4 piliers** visibles, reste secondaire |
| Détail événement | Fiche propre, peu de **contexte lieu** | Micro-contexte quartier / proximité |
| Empty states | Corrects mais neutres | Ton **local chaleureux** (copy, pas illustrations lourdes) |

---

## 6. Matrice priorités (§8)

| ID | Item | Priorité | Type | Effort | Impact |
|----|------|----------|------|--------|--------|
| P0-1 | Réduire entrées **primaires** nav (web : regrouper Lieux/Proposer ; mobile : ≤5 tabs visibles) | P0 | Hiérarchie | M | Élevé |
| P0-2 | Traiter posts `event` dans feed mobile (`EventFeedCard` équivalent) | P0 | Parité | S | Élevé |
| P1-1 | Aligner libellés Événements / Moments locaux partout | P1 | Cohérence | S | Moyen |
| P1-2 | Lien Carte depuis liste Moments (mobile) | P1 | Découverte | S | Moyen |
| P1-3 | Détail événement mobile : type, org, badge quartier (sans surcharge) | P1 | Contexte | M | Élevé |
| P1-4 | Recherche : une entrée primaire mobile (retirer doublon Profil ou Fil) | P1 | Fatigue | S | Moyen |
| P1-5 | Feed web : rythme type-offre vs type-event (espacement / repère visuel) | P1 | Densité | S | Moyen |
| P1-6 | Micro-contexte détail : « Autres moments ce week-end » (3 max, même quartier) | P1 | Curiosité | M | Élevé |
| P2-1 | Mini-map statique détail événement (aperçu, pas interactive lourde) | P2 | Contexte | M | Moyen |
| P2-2 | Rail contextuel web : prioriser 2 liens selon page | P2 | Nav secondaire | S | Faible |
| P2-3 | Transitions légères stack mobile (shared element optionnel) | P2 | Polish | M | Faible |
| P2-4 | Empty states illustrés légers (icône quartier) | P2 | Émotion | S | Faible |

**Légende type :** *problème* = friction mesurable en beta ; *préférence* = esthétique sans preuve usage.

---

## 7. Recommandations hardening (§9)

Principe : **petites, ciblées, fort impact** — patches UX, pas refonte design system.

### Navigation

1. **Web** — Tier nav : Tier A (Fil, Recherche, Moments, Carte, Quartiers, Tribus) ; Tier B (Passport, Profil) ; Tier C (Lieux, Proposer un lieu → menu Profil ou Lieux).
2. **Mobile** — Tier A tabs : Fil, Moments, Carte, Quartiers, Tribus ; déplacer Passport + Lieux vers Profil ou menu « Plus ».
3. **Notifications** — Hors nav primaire web si peu utilisées en beta ; badge depuis Fil/Profil.

### Feed

4. Séparateur visuel renforcé pour cartes **événement** et **offre** (web déjà partiel ; mobile à ajouter).
5. Ligne meta ville/quartier plus visible sur cartes citoyennes (ancrage territorial).
6. Composer feed : placeholder orienté **moment local** pas « statut générique ».

### Événements

7. Bloc « Organisé par » + lien org (web existe ; mobile à ajouter).
8. Section « Près de ce lieu » — 2–3 événements API bbox serrée (read-only).
9. CTA intérêt : clarifier état sauvegardé vs engagement (copy existante, renforcer feedback haptique mobile).

### Carte

10. Lien retour liste depuis header carte (mobile).
11. Ne pas ajouter clustering ; surveiller truncated hint en beta.

### Global

12. **Empty states** — une phrase « locale » par surface (Reims, ton calme).
13. **Accessibilité** — contrastes marqueurs carte déjà OK ; vérifier tap targets mobile ≥ 44px sur CTA callout.

---

## 8. Prochaines étapes BMAD

| Phase | Action |
|-------|--------|
| **MEASURE** | Exécuter [beta-observation-script.md](./beta-observation-script.md) (5–10 users Reims) |
| **ANALYZE** | Consolider notes beta vs matrice P0/P1 |
| **DECIDE** | Ticketiser uniquement P0/P1 validés ; repousser P2 sans preuve |
| **BUILD** | Micro-PRs (< 200 lignes) par thème : nav, feed mobile event, détail contexte |

---

## 9. Validation requise

- [ ] Product / CTO valide matrice P0–P2
- [ ] Pas de commit code avant validation explicite des tickets UX
- [ ] Calendrier beta Reims fixé

---

*Document vivant — mettre à jour après sessions beta.*
