# Sprint 4.5 — Audit produit & stabilisation

**Date** : 2026-05-19  
**Périmètre** : Feed, mobile, web, Passport, partenaire, notifications  
**Méthode** : Revue code + parcours UX cible (checklist ticket) + correctifs polish autorisés

---

## 1. Impression produit générale

Yunicity donne une **base crédible** de réseau local : le feed respire, le Passport a une identité premium claire, et le web desktop est structuré (shell + rail). La **fracture mobile** entre onglets clairs (Fil / Passport) et flows partenaire encore « dark legacy » était le principal signal de produit immature — partiellement corrigé dans ce sprint.

**Sensation cible atteinte à ~75 %** : calme et utilité plutôt que dopamine. Le feed vide reste le risque n°1 en usage réel (Reims peu dense).

---

## 2. Problèmes détectés

| ID | Axe | Problème | Sévérité | Statut |
|----|-----|----------|----------|--------|
| P1 | Visuel mobile | Flows partenaire (scan, offres new/detail, offers list) en thème sombre `#0c0a09` / or `#d4a574` vs brand blanc/`#2A2FFF` | **Haute** | Partiel — hub scan, manual, result, scan permission, offers index migrés |
| P2 | Feed web | Carte feed : footer détaché (`-mt-2`, bordures incohérentes) | Moyenne | **Corrigé** — `FeedCardShell` |
| P3 | Feed | Compteur commentaires UI non mis à jour après ajout/suppression | Moyenne | **Corrigé** |
| P4 | Navigation | Post-login web/mobile → profil au lieu du Fil (surface principale) | Moyenne | **Corrigé** → `/feed` et onglet Fil |
| P5 | Feed web | Champ URL image toujours visible → composer intimidant | Faible | **Corrigé** — repliable |
| P6 | Feed | Pas d’indicateur visuel « ville-first » (ordre API seulement) | Faible | Reporté Sprint 5 |
| P7 | Feed | `media_url` : pas d’upload, URL cassée = image brisée | Moyenne | Reporté |
| P8 | Mobile | Profil : boutons/chips noir `#171717` hors brand | Moyenne | **Corrigé** |
| P9 | Mobile | Safe area bas onglet Fil | Faible | **Corrigé** — `SafeAreaView` |
| P10 | Web mobile | Nav header : 4+ liens en pills → wrap serré sur petit écran | Faible | Reporté |
| P11 | Notifications | Pas de deep link post-tap vers écran métier | Moyenne | Reporté Sprint 5 |
| P12 | Accessibilité | Report menu web : pas de fermeture Escape / click-outside | Faible | Reporté |
| P13 | Performance | `FeedCard` recharge commentaires à chaque delete (2 appels) | Faible | Accepté MVP |
| P14 | Passport QR | Contraste QR dark sur fond clair — OK pour scan | Info | — |

---

## 3. Correctifs appliqués (cette session)

- `FeedCardShell` + refactor cartes feed web (unité visuelle).
- Sync `comment_count` local après commentaire.
- Redirections login/register → **`/feed`** (web) et **`/(tabs)/feed`** (mobile).
- Composer web : image URL **repliable**.
- `screen-theme.ts` + migration thème clair : partner-scan (hub, manual, result, permission), partner-offers index.
- Profil mobile : accent brand sur chips/boutons.
- Feed mobile : `SafeAreaView` onglet.
- Accueil web : lien « Fil local ».

---

## 4. Fixes reportés (Sprint 5+)

1. **Thème partenaire restant** : `partner-offers/new.tsx`, `[id].tsx`, `partner-scan/offers.tsx`, `organizations.tsx` (CTA texte).
2. **Badge ville-first** sur posts hors ville utilisateur (ex. « Ailleurs en France »).
3. **Upload image** feed (storage signé) ou masquer URL jusqu’à infra prête.
4. **Deep links** notifications Expo → feed / passport / offre.
5. **Web nav mobile** : menu hamburger ou scroll horizontal pour 5 entrées.
6. **Commentaire supprimé** : placeholder « Commentaire supprimé » si API renvoie entrées vides vs filtrage.
7. **Tests E2E manuels** Reims : scénario 5 citoyens + 2 partenaires + modération.

---

## 5. Observations UX par axe

### Feed
- **Respiration** : bonne (espacement 32px entre cartes web).
- **Vie du feed** : dépend du contenu réel ; empty state chaleureux mais nécessite 1ère publication.
- **Offres** : distinction Passport OK ; pas sensation « pub ».
- **Likes** : discrets — conforme intention.

### Mobile
- Onglet Fil en premier : bon réflexe produit.
- Pull-to-refresh + charger plus : adapté (pas d’infinite scroll agressif).
- Clavier commentaires : peut masquer le champ sur petits écrans — surveiller en device réel.

### Web
- Shell + rail utile (ville, règles, Passport) — pas dashboard KPI.
- Grand écran : colonne feed ~672px lisible ; rail ne compresse pas le contenu.

### Passport
- Carte claire premium ; QR présentable.
- Flow scan partenaire : wording humain, étapes encore nombreuses pour un non-tech.

### Notifications
- Wording MVP correct ; activation sur profil — peu visible pour nouveaux users.

---

## 6. Recommandations Sprint 5

| Priorité | Recommandation |
|----------|----------------|
| P0 | Finir **unification thème mobile** partenaire |
| P0 | **Seed contenu Reims** (10 posts + 5 offres) pour beta interne |
| P1 | **Onboarding** : ville obligatoire avant feed utile |
| P1 | Deep links notifications |
| P2 | Indicateur léger ville-first |
| P2 | Amélioration upload média feed |

---

## 7. Qualité / build

| Commande | Résultat |
|----------|----------|
| `pnpm lint` | OK |
| `pnpm typecheck` | OK après fix `Href` mobile |
| `pnpm --filter web build` | OK |
| `pnpm --filter mobile build` | OK |
| Backend | Non modifié |

---

## 8. Commit suggéré (après validation)

```
chore(qa): sprint 4.5 product polish and audit (feed, theme, navigation)
```

**Ne pas committer** sans validation explicite.
