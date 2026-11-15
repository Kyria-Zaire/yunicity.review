# Passation — VIDEO-REFONTE-L2-PARTAGE-01

## Objectif

Lot 2 : partage H1 / H2 / H3. Préserver Safari `4be440af`.

## État Git

| | |
|--|--|
| Worktree | `yunicity-wt-video-lot1` |
| Branche | `feat/video-refonte-l3l4-mobile-v23` |
| Parent | **`4be440af`** |
| Working tree | GO livraison — commit L2 puis FF Preview |
| Production / `main` | gelés |

## Documents importants

- Plan : `docs/qa/controle-rendu/l2-partage/PLAN-L2-PARTAGE-H1-H2-H3.md`
- Rapport local : `docs/qa/controle-rendu/l2-partage/RAPPORT-L2-PARTAGE-LOCAL.md`
- Captures simulées H1–H3 dans le même dossier
- PRD Story 2 + annexe C ; maquettes `v2-Partage-*.dc.html`

## Preuves acquises

- Utils 5 résultats + `copyLocalVideoLink` ; tests **12/12**.
- Feedback centralisé (Provider + composant) ; montage unique `videos-screen`.
- Transitions H2→H1 / H2→H3 ; shared/cancelled silencieux ; tests **6/6** + UI **4/4**.
- **Régression fil accueil corrigée** : hors Provider, hint « Lien copié » 2,5 s ; sous Provider, `shareHint` null + H1 centralisé (pas de doublon). Test **`local-video-share-feed-fallback.test.tsx` 3/3**.
- Hints inline retirés (detail + desktop) sous `/videos` seulement.
- Safari SCROLL / immersive : **0 diff** vs `4be440af`.
- Captures simulées H1/H2/H3 (≠ natif iPhone).

## Erreurs de classement corrigées

- **15/11** — « retrait shareHint = OK partout » : **faux**. Le fil accueil hors Provider perdait le feedback « Lien copié ». Preuve : chemin hook sans Provider + test feed-fallback. Correctif : dual-path dans le hook, **sans** monter H1/H2/H3 sur l’accueil.

## Inconnues / réserves

- Notes canevas nH* absentes du dépôt.
- Recette partage natif réel iPhone : **obligatoire avant clôture**.
- Accueil : pas de H2/H3 (volontaire, hors lot).

## Décisions CTO

- GO implémentation locale (15/11).
- Vérification pré-GO accueil — faite.
- **GO commit / Preview** (15/11).

## Tâches actives

1. ~~Implémenter H1/H2/H3~~  
2. ~~Tests + captures simulées~~  
3. ~~Contrôle accueil + correctif dual-path~~  
4. ~~GO commit / FF Preview~~  
5. Attendre CI + Railway ; relever SHA servis  
6. Recette humaine Safari iPhone partage natif (V2-9)

## Prochaine action

Après livraison : recette Safari iPhone partage natif. Ticket **ouvert**.
