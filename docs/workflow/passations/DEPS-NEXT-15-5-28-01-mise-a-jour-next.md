# Passation — DEPS-NEXT-15-5-28-01 · Mise à jour corrective de Next.js 15.5.28

> **Ouvert le 2026-11-04 par Kyria.** ⛔ **Zone rouge** : dépendance du serveur
> web de production. **Index** : [`../TICKETS-INDEX.md`](../TICKETS-INDEX.md).
> Ticket précédent : `FEED-NEW-UX-01`, livré au stade Preview.

## 1. Objectif

Corriger la faille critique de Next.js signalée par l'audit des dépendances,
par une **montée de correctif**, sans toucher aux fonctionnalités livrées.

## 2. Avis officiels — vérifiés le 2026-11-04

| Avis | Sévérité | Versions affectées | Corrigé | Conditions | Nous concerne ? |
|---|---|---|---|---|---|
| **GHSA-2464-fhr4-w9xw** (CVE-2026-96889) | **critique**, CVSS 9.5 | `next` 10.0.0 – 15.5.27 ; 16.0.0 – 16.4.0 | **15.5.28** / 16.4.1 | RCE via une faille mémoire de **`sharp`** (optimisation d'images), sur **Linux glibc** ; contournement : `sharp ≥ 0.35.5` | **oui** — optimiseur actif (`next/image`, images distantes) |
| **GHSA-p3m5-59mp-jv5r** | haute, CVSS 8.2 | `next` 13.0.0 – 15.5.27 ; 16.0.0 – 16.4.0 | **15.5.28** / 16.4.1 | App Router **avec au moins une Server Action** | **non** — 0 `"use server"` |

## 3. Exposition mesurée

| Ligne | `next` | `sharp` | Verdict |
|---|---|---|---|
| `main` (`3e0b27ba`) | 15.5.22 | **0.35.3** (figé par `pnpm.overrides`) | **exposé** |
| Preview `feat/c3-videos-refonte-final` (`1b2dd7f3`) | 15.5.25 | 0.35.5 | contournement déjà atteint ; audit rouge sur la version de `next` |

Service web : Railpack → **glibc ÉTABLI pour le web de production** par son
journal de build (déploiement `d1e93713…` : Node `20.20.2` binaire
`linux-x64`, image `railpack-runtime` à paquets `apt`) — voir §5 quater.
*(Mention antérieure « glibc probable, non vérifié » : dépassée.)*

### Nuances — ce que l'exposition N'ÉTABLIT PAS

- **Exploitabilité non démontrée chez nous** : l'avis décrit une faille
  mémoire « pouvant mener à une RCE », sans publier le vecteur. Nous n'avons
  ni reproduit, ni observé d'exploitation ; « exposé » signifie **dans la plage
  vulnérable, avec les conditions déclarées vraisemblablement réunies**.
- **Condition glibc** : ✅ **établie** pour le web de production (journal de
  build, §5 quater) ; non relevée pour l'admin ni la Preview.
- **Surface réelle** : l'optimiseur traite les images locales et les hôtes
  distants autorisés (`remotePatterns`) ; l'influence d'un attaquant sur ces
  sources n'a pas été évaluée.
- **Quel environnement sert `main` ?** non établi dans cette session : `main`
  n'est exposé **en ligne** que si un service est déployé depuis `main`.
- **Preview** : `sharp 0.35.5` = contournement officiel **déjà en place** ; la
  montée y ferme l'alerte d'audit et aligne `next`, elle ne ferme pas une
  exposition ouverte.

⚠️ **Piège relevé** : sur `main`, monter `next` **seul** ne corrigeait rien —
la surcharge `sharp: 0.35.3` aurait maintenu la version vulnérable.

## 4. Réalisé — **commits locaux, NON poussés**

| Worktree | Branche | Base | Commit | Changement |
|---|---|---|---|---|
| `../yunicity-wt-deps-next` | `fix/deps-next-15-5-28` | `origin/main` `3e0b27ba` | **`08b25edf`** | `next` → **15.5.28** (web, admin) · surcharge `sharp` → **0.35.5** |
| `../yunicity-wt-deps-next-preview` | `integration/preview-deps-next-15-5-28` | `origin/feat/c3-videos-refonte-final` `1b2dd7f3` | **`983a592c`** | `next` → **15.5.28** (web, admin) — `sharp` déjà 0.35.5 |

**Décisions de mise en œuvre** :
- **version exacte `15.5.28`** — `^15.5.28` re-résolvait **15.5.29** (publiée le
  03/11, correctifs *modérés* supplémentaires, un jour de recul), hors de la
  version corrective confirmée ;
- `pnpm update` **rejeté** : il remontait **84 paquets** sans rapport ;
- lockfiles **minimaux** : `main` → `next`, `sharp`, `semver` (dépendance de
  l'ancien `sharp`) ; Preview → `next` et un doublon `caniuse-lite`.

## 5. Preuves — poste Windows de Kyria, worktrees non poussés

| Contrôle | `main` + correctif | Preview + correctif |
|---|---|---|
| `pnpm install --frozen-lockfile` | ✅ | ✅ |
| typecheck `web` / `admin` | ✅ / ✅ | ✅ / ✅ |
| lint `web` | ✅ 0 erreur (29 avert. préexistants) | ✅ 0 erreur (38 avert. préexistants) |
| tests `web` (vitest, sérialisé) | ✅ 39 fichiers, **395** tests | ✅ 111 fichiers, **1167** tests |
| build `web` / `admin` | ✅ « Next.js 15.5.28 » | ✅ « Next.js 15.5.28 » |
| `sharp` chargé par `next` à l'exécution | **0.35.5** (libvips 8.18.7) | **0.35.5** |

⛔ **Non fait avant poussée** : CI GitHub, déploiement, recette Preview,
`pnpm audit`/OSV local (l'audit CI sera relu après poussée).

**Décision de Kyria (2026-11-04)** : version **exacte 15.5.28** conservée pour
ce lot ; poussée autorisée — PR vers `main` **sans fusion**, puis intégration
Preview en avance rapide, références explicites, sans `--force`.

## 5 bis. ✅ POUSSÉE, CI, AUDIT, PREVIEW — *2026-11-04*

**Poussées** (références explicites, sans `--force`) :
- `fix/deps-next-15-5-28` → nouvelle branche distante, **PR #204 vers `main`,
  NON fusionnée** — tête `60393fa8` (correctif `08b25edf` + passation).
- `integration/preview-deps-next-15-5-28:feat/c3-videos-refonte-final` —
  distante vérifiée inchangée (`1b2dd7f3`) avant poussée → **avance rapide
  `1b2dd7f3..983a592c`**. `main` intouchée (`3e0b27ba`).

**CI** : PR #204 → lint · typecheck · build ✅, Gitleaks ✅, chemins interdits
✅, règles agents ✅ (backend / Docker CI non déclenchés : chemins front
seulement). PR #202 (`983a592c`) → front ✅, backend ✅, **Docker CI ✅**,
Railway ✅ ×2. **Audit des dépendances : rouge sur les deux**, voir ci-dessous.

| Audit | Ligne Preview `983a592c` | Ligne `main` `60393fa8` |
|---|---|---|
| alertes `next` / `sharp` | **0 / 0** ✅ | **0 / 0** ✅ |
| Critiques | **0** (1 avant) | **1** : `shell-quote` 9.2 |
| Hautes | **19** (20 avant) | **44** |
| Total hautes + critiques | **19** (21 avant) | **45** = 44 hautes + 1 critique |
| Restant | `node-forge`, `decode-uri-component`, `undici`, `vite` | idem + `@xmldom/xmldom`, `image-size`, `source-map-js`, `shell-quote`, `brace-expansion`, `browserslist`, `js-yaml`, `uuid`, `compression`… |

⚠️ **Exposition du serveur web aux alertes restantes : NON ÉTABLIE.**
Un premier `pnpm why` rattache `node-forge` et `decode-uri-component` à
l'app mobile (Expo), `undici` et `vite` à `vitest` — **indice, pas preuve** :
ces chemins n'ont pas été tracés exhaustivement, et le contenu de l'**image
déployée** (dépendances présentes au runtime web) n'a pas été vérifié.
L'absence d'exposition du serveur web ne sera tenue pour établie que si les
chemins de dépendances **et** l'image déployée le démontrent → ticket
`DEPS-AUDIT-TRIAGE-01`.

⚠️ **`main` porte nettement plus d'alertes que la Preview** : ses surcharges
`pnpm.overrides` sont plus anciennes (ex. `shell-quote >=1.9.0` sur `main`,
`>=1.11.0` sur la Preview). **Préexistant** — ce lot ne change que `next`,
`sharp`, `semver`. La critique `shell-quote` (injection via `quote()`,
corrigée en 1.11.0) est rattachée par `pnpm why` à **`expo`** (app mobile) ;
son absence du runtime web **reste à démontrer**.

**Preview servie** — `railway status --json` : `yunicity.review` et
`unified-media-preview` **SUCCESS sur `983a592c`** (déploiements
`ee41d6d5-1eb8-4be8-a3b9-d6ac7e216be9`, `e158b94f-9e31-4829-85d6-174fd0fc6da2`),
HTTP 200 sur `/`, `/feed`, `/api/v1/health`.

**Recette courte des images** (Chrome réel, Preview, sans interception) :
accueil 1280 px → **9** requêtes à l'optimiseur, accueil 390 px → **3**,
inscription 1280 px → **1** ; **toutes `200 image/webp`**, **0 image cassée**,
**0 erreur JS**. L'optimiseur traite des images **locales** et **distantes**
(Unsplash, Wikimedia Commons — source contributive : surface tierce à garder
en tête pour l'exposition).

## 5 ter. 🔎 PRÉPARATION DE LA FUSION DE #204 — *2026-11-04, non fusionnée*

**Contrôles et SHA** : tête `60393fa8` = local ; **tous les check-runs portent
sur `60393fa8`** — lint · typecheck · build ✅, Gitleaks ✅, chemins
interdits ✅, règles agents ✅, **audit ❌**. État GitHub `MERGEABLE` /
`UNSTABLE` ; **aucun contrôle requis sur `main`** → la fusion n'est pas
bloquée techniquement.

**Diff** : 5 fichiers — `frontend/apps/web/package.json`,
`frontend/apps/admin/package.json`, `frontend/package.json`,
`frontend/pnpm-lock.yaml`, la passation. 2 commits (`08b25edf`, `60393fa8`).

**Déclenchements d'une fusion dans `main`** :
- **GitHub** : `backend-ci`, `frontend-ci`, `docker-ci`, `pr-checks`,
  `lint-agent-rules` (sur `push: main`, filtres de chemins) — **CI seule,
  aucune étape de déploiement**.
- **Railway** — services dont le déclencheur suit **`main` de
  `Kyria-Zaire/yunicity.review`**, option « attendre la CI » (`checkSuites`)
  **désactivée** partout → **un audit rouge ne bloque rien** :

| Projet | Service | Rôle / domaine | Racine | Dernier déploiement |
|---|---|---|---|---|
| **`miraculous-patience`** (**PRODUCTION**) | `yunicity.review` | web — **`yunicity.city`** | `frontend` | SUCCESS `1f444540` (02/09, *redeploy*) |
| idem | `wonderful-wholeness` | admin — **`admin.yunicity.city`** | `/frontend` | SUCCESS `1f444540` |
| idem | `powerful-abundance` | API — **`api.yunicity.city`** | `/backend` | SUCCESS `3e0b27ba` (04/09) |
| idem | `creative-commitment` | (sans domaine) | `/backend` | SUCCESS `1f444540` |
| `pacific-heart` | `yunicity.review` | aucun domaine | `/` | **FAILED** `3e0b27ba` |

Aucun service n'a de motifs de chemins (`watchPatterns`). ⚠️ **Mécanisme de
déclenchement NON ÉTABLI** : lors du passage de `main` à `3e0b27ba`, l'API a
été redéployée, **le web et l'admin non**. On ne peut donc pas affirmer qu'une
fusion redéploiera le web de production — **ni l'exclure**. La projet
`cozy-reverence` suit un **autre dépôt** (`yunicity.mobile`) : non concerné.

⛔ **CONSTAT MAJEUR** :
1. **La production web est exposée aujourd'hui** : `yunicity.city` et
   `admin.yunicity.city` servent `1f444540` → **`next` 15.5.22 + `sharp`
   0.35.3** (plage vulnérable ; nuances glibc / exploitabilité inchangées).
2. **Fusionner #204 ne livrerait pas qu'un correctif** : si le web de
   production se redéploie, il recevra tout l'écart `1f444540..main` —
   **43 commits, dont 30 sur `frontend/`, 223 fichiers, +23 528 lignes**,
   jamais servis en production web.
3. Une fusion pourrait aussi relancer `pacific-heart` (échec probable, sans
   domaine) et les services backend de production (pas de nouvelle
   migration dans #204 ; `alembic upgrade head` sans effet attendu).

**Options à arbitrer par Kyria** *(aucune exécutée)* :
- **A.** Fusionner #204 tel quel : correctif + mise en production possible
  de l'écart `1f444540..main` — **release non recettée en production**.
- **B.** Correctif **ciblé sur la production** : branche depuis `1f444540`
  avec la seule montée `next`/`sharp`, déployée sur les services de
  production **par une procédure explicite** (le déclencheur suit `main`) —
  zone rouge, procédure à définir.
- **C.** Suspendre le déclenchement automatique des services de production
  avant toute fusion, puis décider séparément de la release.

## 5 quater. 🛠️ OPTION B — correctif ciblé de la production *(préparé, NON poussé, NON déployé)*

**Décision de Kyria (2026-11-04)** : préparer l'option B **uniquement**, sans
déploiement ni modification des réglages Railway ; #204 **non fusionnée**.

### Branche et SHA

Worktree isolé `../yunicity-wt-hotfix-prod`, branche
**`hotfix/prod-next-15-5-28`**, base **`1f444540`** (SHA servi par
`yunicity.city` et `admin.yunicity.city`), **sans amont** :

| Commit | Contenu | Rôle |
|---|---|---|
| **`f405d435`** | surcharge `sharp` 0.35.3 → **0.35.5** (contournement officiel) ; `next` reste 15.5.22 | **REPLI protégé** |
| **`311a02e6`** | `next` → **15.5.28** (web, admin) | **CIBLE** |

Diff total `1f444540..311a02e6` : 3 lignes de `package.json` + lockfile
(`next`, `sharp`, `semver` seulement).

### Preuves locales (Windows, Node 24)

| Contrôle | `f405d435` (repli) | `311a02e6` (cible) |
|---|---|---|
| `install --frozen-lockfile` | ✅ | ✅ |
| typecheck web / admin | ✅ / ✅ | ✅ / ✅ |
| lint web / admin | — | ✅ 0 erreur (28 / 7 avert. préexistants) |
| tests web | — | ✅ 10 fichiers, **86** tests |
| build web / admin | ✅ Next.js 15.5.22 | ✅ Next.js 15.5.28 |
| `sharp` chargé par `next` | **0.35.5** | **0.35.5** |

**Production relevée** (journal de build du déploiement actif `d1e93713…`) :
Railpack 0.38.0, **Node 20.20.2**, binaire `node-v20.20.2-linux-x64` dans
l'image `railpack-runtime` (paquets `apt`) → **Linux glibc ÉTABLI** pour le web
de production. ⚠️ Mes contrôles locaux tournent en Node 24 : **écart avec la
CI et la production (Node 20)**.

### Validation CI — pas de voie GitHub non trompeuse

- `workflow_dispatch` : **seul `docker-ci.yml`** (backend, pytest) — ne
  valide pas le build Next.js. `frontend-ci.yml` et `pr-checks.yml` : non.
- `pull_request` : **filtré sur `main`** pour les trois workflows → une PR
  vers une autre base ne déclenche rien ; une PR vers `main` serait
  trompeuse (son diff montrerait l'annulation des 43 commits). **Écartée.**
- **Proposition** : rejouer **à l'identique** les étapes de `frontend-ci`
  et la porte d'audit de `pr-checks`, sur le **SHA exact `311a02e6`**
  (`git archive`, sans `node_modules` local), dans un conteneur
  **`node:20-bookworm`** (Linux glibc, Node 20 comme CI et production) :
  `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` →
  `pnpm test` → `pnpm clean:next` → `pnpm build` ; puis `osv-scanner`
  **v2.4.0** sur `frontend/pnpm-lock.yaml` avec `frontend/osv-scanner.toml`
  et `.github/scripts/osv_gate_high.py`. Aucun workflow ni règle de
  déploiement modifié. *(Non exécuté — à valider.)*

### Déploiements automatiques — vérifiés avant toute poussée

- Pousser `hotfix/prod-next-15-5-28` : **aucun service Railway** ne suit
  `hotfix/*` (déclencheurs relevés sur les 6 projets) ; **aucun workflow
  GitHub** (tous `push: main`). ⇒ la poussée ne déploie rien.
- ⛔ **RISQUE D'ORDRE** : les services de production suivent `main`
  (`checkSuites` désactivé). **Tant que `main` ne contient pas le correctif
  (#204), toute poussée sur `main` redéploierait la production en `next`
  15.5.22 / `sharp` 0.35.3 — RÉINTRODUCTION de la faille.** Après le
  déploiement du hotfix, **aucune poussée sur `main`** avant la fusion de #204
  (qui, elle, livrerait l'écart de 43 commits — décision séparée).

### Procédure de déploiement proposée *(à valider, non exécutée)*

**Périmètre** : projet `miraculous-patience` (`885784ae-20cf-4ce1-b8af-94f0c99480a4`),
environnement `production` (`e8718d1c-3360-4905-8ec8-f4ead0454671`) :

| Service | ID | Domaine | Actif avant | Cible |
|---|---|---|---|---|
| admin `wonderful-wholeness` | `0e81fd5b-b3bf-42ac-b510-193e78c4aeb5` | `admin.yunicity.city` | `7be00f8c…` · `1f444540` | `311a02e6` |
| web `yunicity.review` | `9e7c351e-4922-4279-b35a-86b840bf940a` | `yunicity.city` | `d1e93713…` · `1f444540` | `311a02e6` |

**Hors périmètre** : API `powerful-abundance`, `creative-commitment` (backend),
`pacific-heart`, Preview.

0. **Prérequis** : validation de Kyria ; validation CI (ci-dessus) verte ;
   pousser `hotfix/prod-next-15-5-28` (aucun déploiement déclenché) ; relire
   que le SHA distant est `311a02e6`.
1. **Relevé avant** : `railway status` du projet ; HTTP de `yunicity.city`,
   `admin.yunicity.city`, `/login`, `/register`.
2. **Admin d'abord** (trafic moindre) — mutation **`serviceInstanceDeployV2`**
   (`commitSha` = SHA complet de `311a02e6`, `environmentId`, `serviceId`) :
   déploie ce commit **sans modifier les réglages** du service. Attendre
   **SUCCESS** du déploiement **renvoyé** (pas d'un autre).
3. **Contrôles admin** : SHA actif = `311a02e6` ; journal de build « Next.js
   15.5.28 » et `sharp@0.35.5` ; `admin.yunicity.city` en 200 ; page de
   connexion rendue ; journaux sans erreur pendant 10 min.
4. **Web ensuite** — même mutation, service web ; mêmes contrôles + **recette
   images** (navigateur réel : accueil 1280 / 390 px, inscription →
   requêtes `/_next/image` en `200 image/webp`, aucune image cassée, aucune
   erreur JS) ; `/login`, `/register`, `/feed`.

### Repli — sans réintroduire la faille

- ⛔ **Jamais** `deploymentRollback` vers `d1e93713…` / `7be00f8c…` ni
  redéploiement de `1f444540` : ce sont des états **vulnérables**.
- **Échec de build** : Railway garde le déploiement actif (statu quo, pas
  pire) → analyser, puis tenter le repli ci-dessous.
- **Régression liée à `next` 15.5.28** : déployer **`f405d435`** (même
  mutation) = `next` 15.5.22 + **`sharp` 0.35.5**, **contournement officiel**
  de l'avis → protégé.
- **Si `f405d435` régresse aussi** : décision de Kyria (statu quo vulnérable
  temporaire vs mise en maintenance) — aucune action automatique.

## 5 quinquies. 🧪 VALIDATION CONTENEUR + TEST RAILWAY HORS BRANCHE — *2026-11-04*

### Validation conteneur de `311a02e6` *(poste de Kyria, Docker local)*

Copie propre (`git archive 311a02e6`, aucun montage, aucun `node_modules`
local) dans un conteneur jetable `node:20.20.2-bookworm-slim` (Debian, glibc
2.36). QA (Postgres, Redis) non touchée, Docker non redémarré.

- **Exécution 1 : ÉCHEC à `pnpm test`** — `@yunicity/ui`,
  `overlay-nested.test.tsx` › « déroule ouverture A → ouverture B → fermeture
  B → fermeture A » : **expiration 5 541 ms > 5 000 ms** (148/149 ; `utils`
  883/883). `install`, `lint`, `typecheck` verts.
- **Exécution 2, à l'identique : TOUT VERT** — lint, typecheck, tests (`ui`
  149/149 — ce test en 2 972 ms —, `utils` 883/883, `admin` 27/27, `web`
  86/86), build `web` + `admin` en **Next.js 15.5.28** ; au runtime des deux
  apps : **`sharp` 0.35.5** (libvips 8.18.7).
- **Classement de l'échec 1** : **expiration intermittente, non reproduite,
  cause non établie.** Indices (pas preuve) : le diff ne touche ni
  `packages/ui` ni ses dépendances (`@yunicity/ui` ne dépend ni de `next` ni
  de `sharp`), fichier de test identique à la base ; phase `environment`
  jsdom très lente lors de l'exécution 1.

### Audit (`osv-scanner` v2.4.0, config + porte du dépôt)

| | Base servie `1f444540` | Cible `311a02e6` |
|---|---|---|
| Alertes graves ou critiques (CVSS ≥ 7) | **51**, dont 4 critiques | **45**, dont **1 critique** (`shell-quote`) — soit 44 hautes + 1 critique |
| Porte d'audit | rouge | rouge |

- **Disparaissent** : `next` 15.5.22 (GHSA-2464-fhr4-w9xw 9,5 ;
  GHSA-2xp9-vwfh-vxw4 9,5 ; GHSA-p293-qw3h-jr36 9,0 ; GHSA-p3m5-59mp-jv5r 8,2 ;
  + deux moyennes 6,3) et `sharp` 0.35.3 (GHSA-rgj7-g3m4-5g8c 8,9 ;
  GHSA-wq5f-xc86-pv6w 8,9).
- **Nouvelles** : **aucune**, toutes sévérités. **Aucun avis `next` / `sharp`**
  dans la cible.
- Les 45 restantes sont **toutes préexistantes** ; exposition **non établie**
  → `DEPS-AUDIT-TRIAGE-01`.

### Test Railway — déploiement d'un SHA hors branche suivie *(web Preview uniquement)*

- **Schéma** : `serviceInstanceDeployV2(commitSha, environmentId, serviceId)`
  ne documente pas le cas hors branche ; aucune source officielle ; aucun
  précédent dans l'historique (prod : 40 derniers déploiements web/admin sur
  `main`).
- **Sonde 1** : commit **vide** `6c95b3b1` (arbre = `983a592c`) sur la branche
  `test/railway-offbranch-983a592c`, poussée avec référence explicite.
  Vérifié : **aucun workflow GitHub, aucun déploiement** déclenché par la
  poussée ; déclencheurs Railway : `main` (prod) et
  `feat/c3-videos-refonte-final` (Preview) seulement ; `prDeploys` désactivé
  partout.
- **Déploiement explicite** sur le web Preview `8ce52277` → **accepté**,
  déploiement `6508a8ce` **SUCCESS**, `commitHash = 6c95b3b1`, l'ancien
  `ee41d6d5` (`983a592c`) **REMOVED**. Déclencheurs inchangés. API Preview et
  production intactes.
- ⚠️ **`meta.branch` affiche `feat/c3-videos-refonte-final`** même pour un
  commit hors branche : lire **`commitHash`**, jamais `branch`.
- **Limite** : image **réutilisée** (empreinte identique
  `sha256:1da686e6…`, même `buildId` `izqJBDiszaqaBOyBzGrfk`) → la sonde 1
  prouve l'**acceptation** du SHA, **pas** que le contenu servi en provient.
  → Sonde 2 (fichier témoin) autorisée par Kyria.
- **1ᵉʳ rétablissement de `983a592c` : REFUSÉ par le contrôle des
  permissions** de l'environnement de l'agent (pas par Railway). Le web
  Preview a servi `6508a8ce` / `6c95b3b1` dans l'intervalle — **contenu
  identique** à la Preview validée (même arbre, même image).
- **Sonde 2** (autorisée par Kyria) : commit `2b567436` (enfant de
  `6c95b3b1`, poussé en avance rapide, sans `--force`) ajoutant
  `frontend/apps/web/public/railway-probe.txt` (texte + nonce aléatoire, aucune
  donnée sensible). Poussée : aucun workflow, aucun déploiement. Avant :
  `/railway-probe.txt` → 404.
  - `serviceInstanceDeployV2` (web Preview) → **accepté**, `38e3b047`
    **SUCCESS**, `commitHash = 2b567436`, **vrai build**.
  - **HTTP** : `https://preview.yunicity.city/railway-probe.txt` → **200**,
    contenu = nonce attendu `b929386cdcd11f09` ; `buildId` changé
    (`-9HkyN5Q-nK9jNKHzAyZS`) ; `/`, `/login`, `/feed` → 200.
  - ✅ **ÉTABLI (Preview, 2026-11-04)** : Railway **construit et sert** un
    commit **hors de la branche suivie** via `serviceInstanceDeployV2`, **sans
    modifier les réglages** (déclencheurs relus inchangés avant/après). Preuve
    valable pour ce mécanisme ; elle ne vaut pas validation d'un déploiement
    de production.
- **Rétablissement de `983a592c`** : `69695dab` **SUCCESS**,
  `commitHash = 983a592c` ; `/railway-probe.txt` → **404** ; `buildId` revenu
  à `izqJBDiszaqaBOyBzGrfk` ; `/login`, `/feed` → 200.
- **Non touchés** (relus après) : API Preview `e158b94f` (`983a592c`) ; web
  prod `d1e93713` et admin prod `7be00f8c` (`1f444540`).
- **Reste** : branche distante `test/railway-offbranch-983a592c`
  (`2b567436`) à supprimer sur décision de Kyria — **jamais à fusionner**.
- **Pour la procédure prod** : contrôler le SHA actif par
  **`meta.commitHash`** (pas `meta.branch`), et prévoir un build réel
  (~5 min) puisque l'arbre de `311a02e6` n'a jamais été construit sur ces
  services.

## 5 sexies. 🚦 MISE EN PRODUCTION — *2026-11-04, BLOQUÉE avant l'admin*

- **Go de Kyria** : pousser le hotfix, déployer `311a02e6` admin puis web
  (procédure §5 quater).
- **Étape 0 ✅** : `hotfix/prod-next-15-5-28` poussée → distant =
  `311a02e6011d9bd55fb477a59a3ecfbc1d0f4f7b` ; `main` inchangé (`3e0b27ba`) ;
  **aucun workflow, aucun déploiement** déclenché.
- **Étape 1 ✅ — relevé avant** :
  - admin `0e81fd5b` : `7be00f8c` SUCCESS `1f444540` ; `admin.yunicity.city`
    200, `/login` 200 ; `buildId` `Vy4eZOUGaf5Ap4H7R4B_B` ;
  - web `9e7c351e` : `d1e93713` SUCCESS `1f444540` ; `yunicity.city`,
    `/login`, `/register` 200 ; `buildId` `7b8MMVUX-HG90HSraG3i6` ;
  - API `powerful-abundance` `3554d735` (`3e0b27ba`), `creative-commitment`
    `5b3e5aa3` (`1f444540`), Postgres, PostGIS, Redis : SUCCESS.
- **Étape 2 ⛔ — `serviceInstanceDeployV2` admin → REFUSÉ par le contrôle
  des permissions de l'agent** (motif « Production Deploy »), **avant tout
  appel à Railway**. Aucun contournement tenté. **Aucun déploiement de
  production n'a eu lieu** : admin et web servent toujours `1f444540` —
  **exposés à GHSA-2464-fhr4-w9xw**.
- **Origine du refus** : classificateur du **mode auto** de Claude Code (aucune
  règle `deny`/`ask` locale). Kyria a quitté le mode auto pour une
  **confirmation ponctuelle**, sans créer de permission générale.
- ✅ **ADMIN DÉPLOYÉ (production, 2026-11-04)** — même commande, confirmée
  ponctuellement : déploiement **`e8609584`** **SUCCESS**,
  **`meta.commitHash = 311a02e6011d9bd55fb477a59a3ecfbc1d0f4f7b`** ; ancien
  `7be00f8c` (`1f444540`) **REMOVED**.
  - Journal de build : `pnpm install --frozen-lockfile`, Node 20.20.2
    `linux-x64`, **Next.js 15.5.28**. `sharp` **non affiché** au journal :
    0.35.5 **déduit** du lockfile figé de `311a02e6` (vérifié chargé à
    l'exécution en conteneur Node 20 glibc), **non observé dans l'image de
    production** (pas d'accès SSH).
  - HTTP : `/` et `/login` 200 ; formulaire de connexion rendu (e-mail, mot
    de passe) ; `buildId` `Vy4eZOUGaf5Ap4H7R4B_B` → `szaW7pEB5khyFHcafBiR_`.
  - Journal d'exécution : « Next.js 15.5.28 … Ready in 809ms » ; **aucune
    erreur** sur ~18 min après création (relevé 20:25 UTC) ; `/login` 200 ×3.
  - ⚠️ **Connexion réelle NON testée** (aucun identifiant utilisé par
    l'agent) → **à faire par Kyria**.
  - `/_next/image` sur `favicon.ico` → 400 : test **non significatif** (format
    refusé par Next.js) ; l'admin n'affiche pas d'image sur `/login`.
- ✅ **Connexion réelle à l'admin validée par Kyria** : tableau de bord
  accessible, données affichées.
- ✅ **WEB DÉPLOYÉ (production, 2026-11-04)** — seconde confirmation
  ponctuelle : déploiement **`6a97f4a8`** **SUCCESS**,
  **`meta.commitHash = 311a02e6011d9bd55fb477a59a3ecfbc1d0f4f7b`** ; ancien
  `d1e93713` (`1f444540`) **REMOVED**.
  - Build : Node 20.20.2 `linux-x64`, **Next.js 15.5.28** ; démarrage « Ready
    in 927ms ». `sharp` 0.35.5 : **déduit** du lockfile figé, non observé
    dans l'image (même réserve que l'admin).
  - HTTP : `/`, `/login`, `/register`, `/feed` 200 ; `buildId`
    `7b8MMVUX-HG90HSraG3i6` → `iYQqqmwoSh89qUDG_NaiO`.
  - **Recette images** (vrai Chrome, lecture seule, aucune interception) :
    accueil 1280 / 390, inscription 1280 / 390, connexion 1280, `/feed` 1280
    → **10 requêtes `/_next/image`, toutes `200 image/webp`**, **0 image
    cassée, 0 erreur JS**. ⚠️ `/feed` **redirige vers `/login`** sans
    session : **contenu du fil et ses images NON vérifiés**.
  - Journal d'exécution : **aucune erreur** sur ~18 min après création
    (relevé 20:48 UTC) ; `/`, `/login`, `/register` 200.
- **Non touchés** (relus après) : API `powerful-abundance` `3554d735`
  (`3e0b27ba`), `creative-commitment` `5b3e5aa3` (`1f444540`), Postgres,
  PostGIS, Redis ; Preview web `69695dab` / API `e158b94f` (`983a592c`) ;
  `main` = `3e0b27ba`, Preview = `983a592c`.
- ✅ **GHSA-2464-fhr4-w9xw corrigé en production** sur web et admin
  (`next` 15.5.28) — **mitigation par version, établie par le SHA servi et
  le journal de build**.
- **Branche de test** `test/railway-offbranch-983a592c` **supprimée** (distante
  et locale).
- ⛔ **Rappel — risque d'ordre** : tant que la production n'est pas corrigée et
  que #204 n'est pas fusionnée, **aucune poussée sur `main`**.

**Prochaine action** *(production corrigée — plus aucun déploiement en attente)* :

1. **Fusion de #204** (`main` ← `next` 15.5.28 + `sharp` 0.35.5) : décision
   séparée — elle livrerait en production les 43 commits jamais servis
   (§5 ter). D'ici là, ⛔ **aucune poussée sur `main`**.
2. Vérifier le **contenu du fil** (`/feed` connecté) et ses images en
   production — non couvert par la recette sans session.
3. `DEPS-AUDIT-TRIAGE-01` (45 alertes graves ou critiques, dont 1 critique,
   préexistantes) ; `next` 15.5.29 à arbitrer.
4. Pousser `3ebbcd9c` (passation de #204) et les commits documentaires
   locaux, sur décision.

*Historique : `serviceInstanceDeployV2` a été refusé une première fois par le
mode auto, puis exécutée sur confirmation ponctuelle de Kyria — admin
(`0e81fd5b…`) puis web (`9e7c351e…`), `commitSha` = `311a02e6…`.*

## 5 septies. ⏸ SUSPENSION — *2026-11-04, recentrage Preview*

- **Hotfix production LIVRÉ** : admin `e8609584` et web `6a97f4a8` sur
  `311a02e6` (§5 sexies). Ticket **suspendu**, non clos : reste la fusion de
  #204 (décision séparée).
- ⛔ **GEL** : aucune action sur `yunicity.city`, l'admin de production ou
  `main` **sans demande explicite de Kyria**.
- ⚠️ **RISQUE NOTÉ — réglages Railway NON modifiés (décision de Kyria)** : les
  services web et admin de production suivent **`main`** (`checkSuites`
  désactivé). **Tout déploiement depuis `main`** — poussée, fusion, ou
  redéploiement du dernier commit de `main` — **remplacerait le hotfix** par
  `3e0b27ba`+ (`next` 15.5.22 / `sharp` 0.35.3, **vulnérable**), tant que
  `main` ne contient pas #204. Contrôle du SHA servi : `meta.commitHash`.

## 6. Ce qui reste

1. **Décision de Kyria** : pousser `fix/deps-next-15-5-28` (PR vers `main`) et
   `integration/preview-deps-next-15-5-28` → `feat/c3-videos-refonte-final`
   (avance rapide d'**un** commit).
2. Après poussée : relire l'audit CI — attendu : **les deux avis `next`
   disparaissent** ; restent les alertes de la chaîne mobile (Expo :
   `node-forge`, `decode-uri-component`) et des outils de test (`undici`,
   `vite`) → **ticket de tri à ouvrir**.
3. Recette Preview courte : pages à images (`next/image`).
4. **À arbitrer** : `next` 15.5.29 (correctifs modérés, dont un contournement du
   rejet SVG dans l'optimisation d'images).
5. La branche `fix/mobile-publishing-p0` porte **2 commits documentaires
   locaux** (`f03a242c`, `c8a8f8db`) ; après poussée de l'intégration, elle
   devra être rebasée sur la Preview avant d'être poussée.

## 7. Retour arrière — nuancé

- **Mécanique** : revenir au commit parent (`3e0b27ba` sur `main`, `1b2dd7f3`
  sur la Preview) par un **commit de revert**, jamais par réécriture
  d'historique ; ou, sur Railway, **réactiver le déploiement précédent**
  (immédiat, sans build). Aucune migration, aucune donnée touchée.
- ⚠️ **Revenir en arrière RÉINTRODUIT la faille** : sur `main`, `sharp` repasse
  en 0.35.3 (exposé). Sur la Preview, le contournement `sharp 0.35.5` reste en
  place — le retour arrière n'y rouvre que l'alerte d'audit.
- **Préférer un correctif en avant** si un défaut est lié à la montée : rester
  sur 15.5.28 et corriger, plutôt que revenir sur une version vulnérable.
- **Critère de retour arrière** : régression fonctionnelle **bloquante** sur la
  Preview, non contournable, et seulement sur décision de Kyria.
