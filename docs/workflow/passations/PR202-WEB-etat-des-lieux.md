# Passation — État des lieux PR202 WEB et préparation de la recette

> **Ticket CLOS** le 2026-10-20. Index :
> [`../TICKETS-INDEX.md`](../TICKETS-INDEX.md)
>
> Ticket actif désormais : **Recette fonctionnelle de la publication photo** —
> [`PR202-WEB-recette-publication-photo.md`](PR202-WEB-recette-publication-photo.md)

---

## 1. Objectif

Savoir précisément, pour le **Web** aux trois formats, ce qui est corrigé, ce
qui reste ouvert et ce qui va être testé à la main — puis fournir de quoi le
tester. Produire le bilan et la recette, **sans corriger de code**.

Ce ticket ne livre pas de fonctionnalité. Il convertit huit semaines de
correctifs en un état des lieux auditable et en scénarios jouables.

---

## 2. État Git

| Élément | Valeur |
|---------|--------|
| Branche locale | `fix/mobile-publishing-p0` |
| Branche distante suivie par Preview | `feat/c3-videos-refonte-final` |
| Distant | `bf008a87` |
| Local | voir §9 — commits de documentation non poussés |
| Base de fusion avec `main` | `3e0b27ba`, 2026-08-29 |
| Périmètre | **158 commits** |
| PR 202 | **Draft** — aucun merge, aucune promotion Production |

Arbre de travail propre. Aucun fichier de code produit modifié par ce ticket.

---

## 3. Documents importants

| Document | Rôle |
|----------|------|
| [`../../qa/PR202-WEB-bilan-consolide.md`](../../qa/PR202-WEB-bilan-consolide.md) | **Le bilan** : matrice par fonctionnalité, référentiel de preuve, dettes réconciliées |
| [`../../qa/PR202-WEB-recette-manuelle.md`](../../qa/PR202-WEB-recette-manuelle.md) | **La checklist** : 42 scénarios en dix blocs, adossés au bilan |
| [`../../ops/INFRA-04-web-image-docker.md`](../../ops/INFRA-04-web-image-docker.md) | Trace complète du chantier de déploiement, clos |
| [`../../audit/AUDIT-CSP-01-report-only-sans-report-to.md`](../../audit/AUDIT-CSP-01-report-only-sans-report-to.md) | Constat CSP inerte, différé vers un audit dédié |
| [`../../qa/PILOT-SMOKE-02-authenticated-smoke.md`](../../qa/PILOT-SMOKE-02-authenticated-smoke.md) | Dit que les identifiants du compte pilote sont **hors dépôt** |

---

## 4. Preuves acquises, avec leur environnement

Une preuve garde son SHA et son environnement. **Elle ne vaut pas validation du
déploiement actuel.**

| Réf | Ce qui est prouvé | SHA | Environnement |
|-----|-------------------|-----|---------------|
| **E1** | 44 specs Playwright vertes, 542 tests | `769c7c6e` | **QA locale**, build gelé `X3FL69EhNItJMOfS-7lkv` |
| **E2** | CI : backend 2012 passés / 19 ignorés, lint, typecheck, build, secrets | `bf008a87` | runners GitHub |
| **E3** | Smoke public Preview : pages, JS/CSS, `public/`, optimisation d'image, rendu serveur dynamique, en-têtes | `bf008a87` | **Preview**, image Docker |
| **E4** | Fil connecté avec contenu ; session après rechargement ; profil puis retour au fil | `bf008a87` | **Preview** — **validation manuelle de Kyria**, 20/10/2026, sur le parcours et le format déclarés |
| **E5** | 2377 tests front unitaires et d'intégration | `953246fc` | poste local |

**Mesure qui cadre la portée de E1** : entre `769c7c6e` et `bf008a87`, **aucun
fichier de code produit web ni backend n'a changé**. Les sources testées sont
donc les mêmes que celles déployées. Mais le build, le builder, l'image de base,
le mode standalone, la version de `sharp` et l'environnement diffèrent : E1 est
une **présomption forte, pas une validation**.

---

## 5. Erreurs de classement corrigées

Toutes corrigées **sur preuve**, pas sur impression.

| Erreur | Preuve de la correction |
|--------|--------------------------|
| Les liens d'en-tête public étaient classés **ouverts**, avec affirmation d'une violation WCAG 2.2 AA | `769c7c6e` a porté leur zone cliquable à 44 px — `public-home-header.tsx` lignes 40 et 47 portent `inline-flex min-h-11 items-center` dans `bf008a87`. Et une hauteur de 20 px n'établit pas à elle seule une violation de 2.5.8 : l'espacement et les exceptions entrent dans son évaluation, et aucun des deux n'a été mesuré. Reclassé **I**, affirmation retirée |
| Deux dettes étaient en passe d'être requalifiées en « limite consignée » faute de décision explicite | Lecture complète du code : `alembic/env.py` porte « revisit if PgBouncer lands », `map-city-defaults.ts` porte « à revisiter en multi-ville ». Ce sont des **différés avec déclencheur**. Classement **D** maintenu, déclencheur ajouté |
| La synthèse annonçait « 6 V, 34 I, 5 O, 9 D, 2 N » | Chiffres écrits à la main, faux. Décompte **mesuré sur le fichier** : V 5 · Vd 3 · I 49 · O 1 · D 1 · N 1, sur 60 lignes |
| La recette de Kyria risquait d'être lue comme une mesure automatisée | Code d'état **Vd** créé : « validé manuellement par Kyria, sur le parcours et le format déclarés ». Une première rédaction ajoutait « ne vaut pas V », ce qui dévalorisait une validation réelle au lieu d'en borner la portée — retiré. Les autres formats restent non vérifiés |
| « Aucune régression » affirmé après comparaison des statuts CI | Remplacé par « aucune régression **nouvelle détectée par ces contrôles** ». Vérifié : **la suite Playwright n'est exécutée par aucun workflow** |

---

## 6. Inconnues

- **Connexion sur Preview par un parcours mesuré.** Aucun compte de recette
  autorisé n'a été disponible ; les identifiants du compte pilote sont hors
  dépôt ; la création de compte sur Preview est exclue. E4 reste une
  déclaration.
- **Comportement navigateur sur Preview** au-delà du smoke public et de E4 :
  aucun des 44 scénarios n'a été rejoué sur Preview.
- **Vrai iPhone / Safari** : la spec 13 tourne sous WebKit en QA locale, ce qui
  n'est pas un appareil réel.
- **Médias vidéo d'exemple sur Preview** : absents. Les scénarios vidéo ne sont
  probablement pas jouables.
- **Version de la copie de braces embarquée dans Next** : indéterminée, et sa
  correspondance avec l'avis ne peut pas être établie.
- **Chargement de `braces` et `node-forge`** : non observés sur les chemins
  instrumentés. Les chemins non tracés et les limites du traceur empêchent
  d'affirmer une absence générale de chargement.
- **Config path du service public `yunicity.city`** : non lisible par les outils
  disponibles. C'est le gate bloquant avant tout merge vers `main`.

---

## 7. Décisions CTO prises

| Décision | Portée |
|----------|--------|
| **Mitigation de l'image, pas remédiation de l'arbre** | Les paquets installés vulnérables sont retirés de l'image servie ; le lockfile les conserve. Aucune exception OSV, **aucune acceptation de risque** |
| **Isolation des configurations Railway** | La config Docker vit dans `railway.web-docker.toml` ; `railway.toml` est RAILPACK, donc le site public ne peut plus changer de builder par héritage. Prouvé par mesure |
| **Domaines Preview sur 8080** | L'image honore `PORT` ; les domaines sont alignés. Le port figé du script `start` masquait le désalignement |
| **CSP : différée** | Vers un audit de sécurité dédié, hors boucle de recette |
| **Pas de merge, pas de promotion** | PR 202 reste en Draft tant que les réserves ne sont pas levées |
| **Ne pas relancer les 44 specs** | Le coût est élevé et elles ne mesurent pas Preview. La recette manuelle est le bon instrument |
| **Une preuve garde son environnement** | Règle de fond du bilan : rien ne devient validation du déploiement par simple report |

---

## 8. Tâches actives

| # | Tâche | État |
|---|-------|------|
| 1 | Bilan consolidé dans le dépôt | **fait** |
| 2 | Checklist de recette adossée au bilan | **fait** |
| 3 | Réconciliation des classements sur preuve | **fait** |
| 4 | Protocole d'index + passation installé | **fait** |
| 5 | Protocole d'index + passation **contrôlé par le linter** | **fait** — `15-passation` ajouté à `PARITY_PAIRS` |
| 6 | Jouer la recette manuelle, bloc par bloc | **transféré** au ticket de recette publication photo |
| 7 | Trancher les deux réserves avant promotion | **reste ouvert**, hors de ce ticket |

---

## 9. Commits de ce ticket, non poussés

| SHA | Objet |
|-----|-------|
| `0b8b70dd` | consigner le test décisif — isolation prouvée |
| `e07e809c` | consigner la CI et clôturer le chantier d'isolation |
| `07236fb0` | bilan consolidé et checklist de recette |
| *(ce commit)* | réconciliation du bilan et installation du protocole |

Aucun push n'a été autorisé pour ces commits.

---

## 10. Clôture

Ce ticket est **clos**. Ses livrables sont le bilan consolidé et la checklist de
recette, tous deux dans `docs/qa/`, plus le protocole d'index et de passation.

La suite appartient au ticket **Recette fonctionnelle de la publication photo**,
désormais actif. La connexion sur Preview ayant été **validée manuellement par
Kyria** le 20/10/2026, elle n'est pas à rejouer systématiquement : le ticket
suivant démarre directement sur la publication photo.
