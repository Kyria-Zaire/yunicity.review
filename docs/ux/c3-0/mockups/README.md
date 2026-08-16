# C3.0 — Maquettes canoniques (sources visuelles validées)

**Maquettes de refonte validées** par le CTO/DA — sources visuelles **canoniques** C3.0
(ce ne sont plus de simples « baseline T0 »). Spécification autoritaire :
[`../c3-0-design-contract.md`](../c3-0-design-contract.md).

## Jeu canonique (5 planches)

| Fichier | Rôle | Statut |
|---------|------|--------|
| `yunicity-design-foundation-v1.png` | Fondation visuelle globale (surfaces, densité, responsive 390/900/1366) | **présent** |
| `yunicity-passport-responsive-v1.png` | Passport × 390/900/1366 | **présent** |
| `yunicity-event-detail-responsive-v1.png` | Détail événement × 390/900/1366 | **présent** |
| `yunicity-feed-responsive-v2.png` | **Source de vérité du Fil** (contenu + responsive, Stories incluses) | **présent** |
| `yunicity-navigation-architecture-v3.png` | **Source de vérité du chrome global & navigation** | **présent** |

> Jeu canonique **complet** (5 planches). Toute nouvelle version suit la convention
> `-vN` et supersede explicitement la précédente : la planche remplacée est **retirée
> du dépôt** (conservée hors dépôt), afin qu'aucune source concurrente ne subsiste.

## Précédence (autorité)

- **Feed V2** = source de vérité du **contenu et du responsive du Fil**.
- **Navbar V3** = source de vérité du **chrome global et de la navigation**.
- En cas de divergence avec une ancienne planche, **Feed V2 et Navbar V3 prévalent**.

## Stories (règle)

- La section **Stories est obligatoire** sur **390, 900 et 1366**.
- Stories est un **module du Fil**, **pas** une cinquième destination principale.
- La création d'une Story est accessible depuis **« Votre story »** et **« + Créer »**.

## Navigation (rappel — contrat §2)

- 4 destinations principales : **Fil local · Vidéos · Carte · Sortir**.
- **Explorer Reims** porte la recherche globale.
- **Menu Yunicity** reste explicitement visible (mobile « Menu », medium « Menu » drawer, desktop « Menu Yunicity »).
- **« Créer »** persistant (jamais un 5ᵉ onglet).

## Historique

- `yunicity-feed-responsive-v1.png` (baseline Feed T0-R1) est **SUPERSEDED** par Feed V2.
  Jamais versionnée, elle est conservée **hors dépôt** : le dépôt ne référence que Feed V2.
  Ne pas la réintroduire comme source concurrente.
