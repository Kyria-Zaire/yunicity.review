# Mobile Fatigue Review — SPRINT-UX-01

| Champ | Valeur |
|-------|--------|
| Section | §5 — Mobile Fatigue Review |
| Référence | [ux-hardening-audit.md](./ux-hardening-audit.md), [navigation-review.md](./navigation-review.md) |
| App | `frontend/apps/mobile` |

---

## 1. Objectif

Mesurer **charge cognitive mobile** : taps, scroll, compréhension immédiate, écrans vides vs lourds — sans redesign complet.

---

## 2. Inventaire surfaces

| Catégorie | Count | Notes |
|-----------|-------|-------|
| Tabs | 8 | Seuil confort iOS ~5 |
| Stack routes | 14+ | Partner scan = 5 niveaux |
| Modals | 1 | `passport/present` |
| Fichiers routes `app/` | ~30 | |

---

## 3. Vitesse mentale & taps

### 3.1 Tâches courantes (estimation taps)

| Tâche | Chemin actuel | Taps min |
|-------|---------------|----------|
| Voir fil | Tab Fil | 1 |
| Détail événement depuis carte | Carte → pin → callout → CTA | 3 |
| Détail depuis liste | Moments → row | 2 |
| Recherche lieu | Fil → recherche **ou** Profil → recherche | 2 |
| Scanner Passport partenaire | Lieux → partner-scan hub → scan | 3+ |
| Notifications | Profil → notifications | 2 |
| Rejoindre tribu (invitation) | Lien → invitation → tribu | 2–3 |

### 3.2 Points de friction

| Friction | Sévérité |
|----------|----------|
| 8 tabs — décision « où je vais » | **Haute** |
| Recherche non tab mais essentielle | Moyenne |
| Partner scan 5 écrans | Haute (audience restreinte) |
| `tribes/[slug].tsx` monolithique ~555 lignes | Haute maintenance + scroll long |
| Feed event non distingué | Moyenne — re-scan visuel |

---

## 4. Compréhension immédiate

### 4.1 Premier lancement (post-login)

1. Redirect → `/(tabs)/feed` — **bon** (pilier clair).
2. Tab bar 8 labels — **mauvais** (choix paralysants).
3. Header Fil : titre + sous-titre + actions — compréhension OK, hauteur **élevée**.

### 4.2 Labels

| Label | Clarté | Risque |
|-------|--------|--------|
| Fil | Bon | — |
| Moments | Bon (si cohérent web) | vs « Événements » ailleurs |
| Carte | Bon | — |
| Quartiers | Bon | — |
| Tribus | Bon | contenu vide si pas membre |
| Passport | Moyen | jargon produit |
| Profil | Bon | — |
| Lieux | Ambigu citoyen | « C’est mes commerces ? » |

---

## 5. Fatigue scroll

| Écran | Scroll | Verdict |
|-------|--------|---------|
| Fil | FlatList long + commentaires inline | **Lourd** si threads |
| Tribu détail | Mur + membres + modération | **Très lourd** |
| Carte | Peu scroll (callout fixe bas) | **Léger** — bon |
| Passport | Moyen | OK |
| Event détail | Court | **Léger** — bon |
| Partner scan | Multi-étapes | **Lourd** mais rare |

---

## 6. Densité écran

### Trop vides

| Écran | Cause |
|-------|-------|
| Fil (peu de posts) | Empty state + header large |
| Quartiers (liste courte) | Peu de contenu seed |
| Carte sans events bbox | `MAP_EMPTY` — OK avec hint |

### Trop lourds

| Écran | Cause |
|-------|-------|
| Tribu `[slug]` | Tout-en-un |
| Partner scan flow | 5 steps |
| Feed avec commentaires ouverts | Inline expansion |

---

## 7. Tabs — recommandation fatigue

### État actuel

```
[ Fil | Moments | Carte | Quartiers | Tribus | Passport | Profil | Lieux ]
```

### État cible (UX hardening)

```
[ Fil | Moments | Carte | Quartiers | Tribus ]  +  [ Profil (hub) ]
```

Profil hub contient :

- Passport  
- Lieux / scan (si rôle partenaire)  
- Notifications  
- Recherche (optionnel si retirée du header Fil)  
- Paramètres / déconnexion  

**Gain :** −3 icônes tab bar, −40% largeur label par slot.

---

## 8. Flows trop longs

| Flow | Action |
|------|--------|
| Partner scan | Garder mais **entrée uniquement** depuis Lieux ; pas tab ; indicateur progression (step 2/5) |
| Tribu invitation | OK ; vérifier replace vers tab tribes |
| Offre partenaire create | `replace` après create — OK |

---

## 9. Parité web → fatigue

| Web confort | Mobile gap |
|-------------|------------|
| Sidebar stable | Tab bar changeante |
| Event card feed riche | Event = post générique |
| Event detail riche | Minimal |

La fatigue mobile est **plus haute** que web pour découverte événements.

---

## 10. Recommandations priorisées

| ID | Action | P |
|----|--------|---|
| MF1 | Réduire tabs à 5 + hub Profil | P0 |
| MF2 | Event card dans feed mobile | P0 |
| MF3 | Lien Moments → Carte | P1 |
| MF4 | Header Fil compact | P1 |
| MF5 | Tribu : sections repliables (mur / membres) | P2 |
| MF6 | Partner scan : barre progression | P2 |
| MF7 | Tap targets callout carte ≥ 44px | P1 |

---

## 11. Métriques terrain

| Métrique | Méthode |
|----------|---------|
| Taps to complete scenario | Beta script |
| SUS simplifié (optionnel) | Post-test 10 questions |
| Verbatim fatigue | « C’est trop » / « Je ne sais pas où cliquer » |

---

*Voir [beta-observation-script.md](./beta-observation-script.md)*
