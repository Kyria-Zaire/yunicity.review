# Revue app Next — VIDEO-REFONTE-L7-DESKTOP-GRILLE-01

**Date** : 15/11 · **Env** : `localhost:3002` + **API simulée** (Playwright `page.route`)  
**Code** : BUILD local non commité · **aucun commit/push/deploy**  
**Preuve JSON** : [`app-next-preuves.json`](app-next-preuves.json)

---

## Distinction des preuves

| Dossier / fichier | Nature |
|-------------------|--------|
| `captures/` + `_fixture-l7-grille.html` | Fixture HTML **hors** app Next |
| `captures-app/APP-*.png` | **App Next réelle** + API simulée |
| Preview / médias DB | **non** (L7 seul interdit ; groupé 7+8+9) |

---

## Captures app (1024 / 1280 / 1440)

| Fichier | Résultat |
|---------|----------|
| `APP-grille-1024x900.png` | Grille visible, 2+2 portrait/paysage, rails OK, **0** split sombre |
| `APP-grille-1280x800.png` | idem |
| `APP-grille-1440x900.png` | idem |
| `APP-frontiere-1023-medium.png` | Fil medium visible, grille desktop **masquée** |
| `APP-frontiere-1024-desktop.png` | Grille desktop, medium **absent** |

Comparaison REF : `captures/REF-planche-desktop-C-cadrage.jpg` — méta titre / auteur · quartier / durée, ratios mixtes, rails ; lecteur modal planche = **Lot 8** (hors validation).

---

## Contrôles fonctionnels (app)

| Contrôle | Résultat |
|----------|----------|
| Vide + Publier | ✅ `APP-etat-vide-1440.png` |
| Erreur + Réessayer | ✅ `APP-etat-erreur-1440.png` → retry ✅ |
| Loading marqueur | ⚠️ race (Next trop rapide) ; squelette codé `data-videos-desktop-grid-state=loading` |
| Charger plus ×3 clics | ✅ **1** requête `cursor=c1` ; **6** tuiles uniques |
| Erreur pagination | ✅ grille **4** conservée + bandeau local ; retry → **6** |
| Clavier Enter sur vignette | ✅ focus `A` → `/videos?video=p1` |
| Deep link `?video=p1` | ✅ URL OK — **lecteur Lot 8 non validé** |
| Frontière 1023/1024 | ✅ medium / desktop exclusifs |

**Bilan JSON** : `ok: true`, `failures: []`.

---

## Boucle de refetch (clarification)

| Origine | Verdict |
|---------|---------|
| Mock vitest `useYunicityApi: () => ({ listLocalVideos })` | **Oui** — nouvel objet `api` à chaque render → `fetchPage` se recrée → `useEffect([fetchPage])` boucle |
| Code produit `use-local-videos-feed.ts` | **Non modifié pour ça** — le `useEffect` sur `fetchPage` est le contrat normal ; correction = **mock stable** dans le test uniquement |

Le produit a bien reçu `loadMoreError` / conservation des items (Lot 7) ; ce n’est **pas** le correctif de la boucle.

---

## Diff

**Inchangé** depuis le BUILD — aucun correctif produit requis par cette revue.  
Voir [`VIDEO-REFONTE-L7-DESKTOP-GRILLE-01-precommit.diff`](VIDEO-REFONTE-L7-DESKTOP-GRILLE-01-precommit.diff).

Suites déjà vertes **non** relancées.

---

## Suite

Revue CTO → GO commit **local** (sans push Preview). Livraison Preview toujours **7+8+9**.
