# PR202-WEB — Bilan consolidé avant recette manuelle

> **Périmètre** : Yunicity **Web** uniquement, aux trois formats desktop, medium
> et mobile. Mobile natif, admin et backend hors périmètre, sauf là où le
> backend conditionne un comportement web.
>
> **Date du bilan** : 2026-10-20 · **Branche** : `feat/c3-videos-refonte-final`
> · **Déployé sur Preview** : `bf008a87` · **PR 202 en Draft**, aucun merge.
>
> Checklist de recette associée :
> [`PR202-WEB-recette-manuelle.md`](PR202-WEB-recette-manuelle.md)

---

## 1. Périmètre réel du chantier

| Mesure | Valeur |
|--------|--------|
| Base de fusion avec `main` | `3e0b27ba`, 2026-08-29 |
| Dernier commit | `e07e809c`, 2026-10-20 |
| Commits | **158** |

Le chantier est donc nettement plus large que la dernière campagne de recette :
il couvre huit semaines de correctifs, dont la majorité **précède** la campagne
des 44 specs.

---

## 2. Référentiel de preuve — ce que chaque source établit

Une preuve conserve le SHA et l'environnement où elle a été obtenue. **Elle ne
devient pas une validation du déploiement actuel.**

| Réf | Source | SHA mesuré | Environnement | Ce qu'elle établit | Ce qu'elle n'établit pas |
|-----|--------|-----------|---------------|--------------------|--------------------------|
| **E1** | Campagne 44 specs Playwright, 44/44 vertes, 542 tests | `769c7c6e` | **QA locale**, build gelé `X3FL69EhNItJMOfS-7lkv` | le comportement navigateur des trois paliers sur ce build | rien sur Preview, ni sur l'image Docker |
| **E2** | CI GitHub Actions | `bf008a87` | runners GitHub | backend 2012 passés / 19 ignorés ; lint, typecheck, build, secrets | **la surface navigateur** — la suite Playwright n'est exécutée par aucun workflow |
| **E3** | Smoke public Preview | `bf008a87` | **Preview**, image Docker | pages publiques, JS/CSS, fichier de `public/`, optimisation d'image, rendu serveur d'une route dynamique, en-têtes | tout ce qui exige une session |
| **E4** | **Validation manuelle déclarée par Kyria, 20/10/2026** | `bf008a87` | **Preview** | fil connecté avec contenu affiché ; session conservée après rechargement ; accès au profil puis retour au fil | **déclaration d'usage** — ni mesure automatisée, ni relevé réseau, ni capture. Porte le code **Vd**, jamais **V** |
| **E5** | Tests unitaires et d'intégration front | `953246fc` | poste local | utils 1258 · web 919 · ui 163 · admin 37 = **2377** | le rendu réel en navigateur |

### 2.1 Portée de E1 sur le déploiement actuel

Mesuré : entre `769c7c6e` (campagne) et `bf008a87` (déployé), **aucun fichier de
code produit web ni backend n'a changé**. Les seuls écarts sont un test backend,
une spec e2e, la documentation, les fichiers de déploiement, `next.config.ts`
(+1 ligne `output: "standalone"`) et quatre relèvements de dépendances
(`shell-quote`, `sharp`, `source-map-js`, `compression`).

E1 porte donc sur **les mêmes sources produit** que ce qui est déployé. Cela en
fait une présomption forte, **et non une validation** : le build, le builder,
l'image de base, le mode standalone, les versions de `sharp` — qui sert
l'optimisation d'image à l'exécution — et l'environnement diffèrent tous.

### 2.2 Preuve manquante, signalée

La **matrice de clôture des 44 specs n'existe pas dans le dépôt**. Les 44
fichiers de specs sont présents dans `frontend/apps/web/e2e/functional/`, mais
le relevé détaillé par spec n'a jamais été committé. Le présent document est le
premier à en consigner la synthèse ; le détail par spec reste hors dépôt.

---

## 3. Codes d'état

| Code | Signification |
|------|---------------|
| **V** | Corrigé **et vérifié par mesure** — correction livrée, validation mesurée, source de preuve citée |
| **Vd** | Corrigé **et vérifié par déclaration d'usage** — un usage réel l'atteste, sans mesure ni relevé. Ne vaut pas **V** et n'en tient pas lieu |
| **I** | Implémenté, **validation incomplète** — code livré, preuve partielle, d'un autre SHA ou d'un autre environnement |
| **O** | **Ouvert** — défaut connu, non corrigé |
| **D** | **Différé** explicitement — décision prise de ne pas traiter maintenant |
| **N** | **Non établi** — aucune preuve dans un sens ni dans l'autre |

Colonne « Présent sur Preview ? » : `code` signifie que le commit est contenu
dans `bf008a87`, donc déployé ; `vérifié` signifie qu'une preuve a été obtenue
**sur Preview**.

---

## 4. Matrice par fonctionnalité

### 4.1 Publication photo et composer du fil

| Problème initial | Correction réalisée | Commit | Validation et environnement | Présent sur Preview ? | État |
|---|---|---|---|---|---|
| Les cartes de publication perdaient l'identité de l'auteur et la destination | Identité et destinations rétablies sur la carte | `a6ce6084` | E1 (specs 30, 33) — QA locale `769c7c6e` | code oui · vérifié non | **I** |
| Le composer bloquait en silence quand la règle de texte n'était pas respectée | Message explicatif au lieu d'un blocage muet | `44922bc5` | E1 (specs 16, 27) — QA locale | code oui · vérifié non | **I** |
| Impossible de remplacer la photo attachée sans tout recommencer | Remplacement offert depuis l'aperçu du composer | `a79533ea` | E1 (specs 16–18) — QA locale | code oui · vérifié non | **I** |
| La photo d'une publication était recadrée, le sujet pouvait être coupé | Photo affichée en entier, jamais recadrée ; une seule source décide du cadrage | `125ba4ff`, `7a990e66` | E1 (specs 18, 19, 30) — QA locale | code oui · vérifié non | **I** |
| Cycle de vie de l'envoi d'image fragile ; média rejeté sans explication | Cycle de vie durci ; résolution du rejet clarifiée | `8f98c219`, `479892e3` | E1 + E5 | code oui · vérifié non | **I** |
| Décalage pleine largeur de la carte événement incohérent avec son padding | Décalage aligné sur le padding réel | `5fd3389b` | E1 (spec 19) — QA locale | code oui · vérifié non | **I** |

### 4.2 Médias authentifiés et rendu

| Problème initial | Correction réalisée | Commit | Validation et environnement | Présent sur Preview ? | État |
|---|---|---|---|---|---|
| Les images de publication étaient chargées hors session, donc absentes ou cassées | Chargement via l'API authentifiée, rendu autorisé durci | `16348b35`, `c8656b9d` | E1 + E5 | code oui · vérifié non | **I** |
| Les blobs autorisés survivaient à un changement de session | Purge des blobs au changement de session ; contexte client préservé | `679ca85d`, `ff42072e` | E5 (tests unitaires) | code oui · vérifié non | **I** |
| Surfaces média hétérogènes entre paliers ; cadres instables | Surfaces unifiées, cadres adaptatifs stabilisés, cartes mobiles compactées | `808673e0`, `8d661210`, `f7b5f817`, `c6b08e3d` | E1 (specs 30, 33) + E5 | code oui · vérifié non | **I** |
| Avatars et bannières en URL relative à l'API ne se résolvaient pas | Résolution contre l'origine de l'API, étendue aux médias d'auteur et bannières | `f71f5143`, `2c843f72` | E5 | code oui · **partiellement vérifié** par E4 (profil accessible) | **I** |
| Interaction de la grille média et accessibilité du visionneur non prouvées | Tests d'interaction et d'accessibilité ajoutés | `7227c4cd`, `437a2416` | E5 | code oui · vérifié non | **I** |

### 4.3 Stories

| Problème initial | Correction réalisée | Commit | Validation et environnement | Présent sur Preview ? | État |
|---|---|---|---|---|---|
| Les médias de Stories n'empruntaient pas la livraison authentifiée canonique | Livraison canonique adoptée | `bce9c2c1` | E1 (specs 25, 26) — QA locale | code oui · vérifié non | **I** |
| Le rail d'accueil ne se rafraîchissait pas après publication d'une Story | Rafraîchissement du rail après publication | `b5efb476` | E1 (spec 25) — QA locale | code oui · vérifié non | **I** |

### 4.4 Vidéo locale

| Problème initial | Correction réalisée | Commit | Validation et environnement | Présent sur Preview ? | État |
|---|---|---|---|---|---|
| Pas d'expérience vidéo responsive | Expérience vidéo responsive livrée, puis UX et accessibilité finalisées | `4bbb245e`, `676438cb` | E1 (specs 28, 35-videos) — QA locale | code oui · vérifié non | **I** |
| Dimensions mal lues sur vidéos pivotées (iPhone) | Lecture ffprobe tenant compte de la rotation | `e24175b7` | tests backend (E2) | code oui · vérifié non | **I** |
| Limite de durée incohérente avec le pilote | Limite alignée à 90 s, puis paliers par rôle créateur | `1892e679`, `3f93a4d8` | tests backend (E2) | code oui · vérifié non | **I** |
| Rôle « créateur vérifié » absent en base | Rôle provisionné par migration | `bd9452d0` | E2 | code oui · vérifié non | **I** |
| Le fil vidéo ne reflétait pas la pertinence territoriale, sans l'expliquer | Classement territorial, puis explication affichée là où le fil est rendu | `94ad114c`, `fa4a4cf9`, `0fa886df` | E1 + E2 | code oui · vérifié non | **I** |
| Teasers vidéo territoriaux absents ; teasers chargés pour un panneau non affiché | Teasers exposés, chargement inutile supprimé | `716e8bc9`, `4e387040` | E1 + E5 | code oui · vérifié non | **I** |
| Envoi mobile incomplet ; progression et annulation non prouvées | Cycle de vie mobile complété ; progression et annulation couvertes par une spec dédiée | `caee2891`, `b80b4e5a` | E1 (spec 44) — QA locale | code oui · vérifié non | **I** |
| **Médias vidéo d'exemple absents sur Preview** | — | — | constat de la campagne : environnement Preview non seedé | — | **N** |

### 4.5 Protections du stockage

| Problème initial | Correction réalisée | Commit | Validation et environnement | Présent sur Preview ? | État |
|---|---|---|---|---|---|
| Stockage média non persistant entre déploiements | Volume Railway unifié et persistant | `47ecffcb` | smoke médias documenté (`docs/qa/MEDIA-INFRA-V1-smoke-test.md`) | code oui · vérifié non sur `bf008a87` | **I** |
| Configuration de déploiement média non durcie ; volume monté avec privilèges | Configuration durcie ; volume initialisé **puis** privilèges abandonnés | `356bd1d7`, `cdfe8cb9` | E2 | code oui · vérifié non | **I** |
| Envois écrits sans borne, risque de saturation du disque | Envois diffusés en flux et bornés ; capacité du système de fichiers gardée | `fd2b9434`, `bed927b8` | tests backend (E2) | code oui · vérifié non | **I** |

### 4.6 Fil et architecture responsive

| Problème initial | Correction réalisée | Commit | Validation et environnement | Présent sur Preview ? | État |
|---|---|---|---|---|---|
| Fondations responsive dispersées ; surfaces incohérentes entre paliers | Fondations partagées établies, puis surfaces publiques, découverte, événements et partenaires reprises | `b2eabed7`, `5bab0484`, `8ecf70e1`, `05fc2f33`, `f3ebbec3` | E1 (specs 36, 37, 40, 42) — QA locale | code oui · vérifié non | **I** |
| Agenda dupliqué dans le rail droit du fil | Passport en tête de rail, agenda dupliqué retiré | `6918d289` | E1 — QA locale | code oui · vérifié non | **I** |
| **Les modules de contexte n'étaient rendus à aucune largeur** | Modules rendus, puis masqués au seul palier desktop par CSS | `bf71e017` | E1 (specs 31, 34) — QA locale | code oui · vérifié non | **I** |
| Contrats du flux désalignés, onglets fantômes attendus par les tests | Contrats alignés sur la règle tranchée, attentes périmées retirées | `65b5ca49`, `427ebcda`, `8f810024` | E1 — QA locale | code oui · vérifié non | **I** |
| Pages fil et vidéos sans titre sous 1024 px | Titre ajouté sous 1024 px | `35ef6427` | E1 (spec 09) — QA locale | code oui · vérifié non | **I** |
| **Fil connecté et affichage du contenu** | — | — | **E4 — déclaration de Kyria, Preview, 20/10/2026** | **vérifié par déclaration** | **Vd** |

### 4.7 Cartes et quartiers

| Problème initial | Correction réalisée | Commit | Validation et environnement | Présent sur Preview ? | État |
|---|---|---|---|---|---|
| Composition de carte non responsive | Composition responsive adoptée | `1c4af315` | E1 (specs 03, 43) — QA locale | code oui · vérifié non | **I** |
| Au palier medium, coquille cassée et canevas de carte invisible | Coquille medium rétablie, canevas visible | `dec73f4b` | E1 (spec 43) — QA locale | code oui · vérifié non | **I** |
| La carte affichait d'autres entités que les 12 secteurs officiels de Reims | Exactement 12 secteurs sur la carte et dans le portail | `c201ecf6`, `3821fd27` | E1 — QA locale | code oui · vérifié non | **I** |
| Crédits d'images éditoriales non conformes ; illustration erronée pour Châtillons | Crédits Wikimedia conformes et accessibles ; Tour des Argonautes pour Châtillons | `e0a0c7d7`, `aa355a8d`, `a00bd8ae` | revue manuelle documentée (PRD-601) | code oui · vérifié non | **I** |
| Pas d'explorateur des secteurs officiels | Explorateur responsive des secteurs ajouté | `aa00ba67` | E1 — QA locale | code oui · vérifié non | **I** |

### 4.8 Tribus

| Problème initial | Correction réalisée | Commit | Validation et environnement | Présent sur Preview ? | État |
|---|---|---|---|---|---|
| Un membre mobile ne pouvait pas quitter une tribu publique | Action de sortie offerte au palier mobile | `40a55872` | E1 (spec 06) — QA locale | code oui · vérifié non | **I** |
| **Après un 409 d'adhésion puis un rechargement, l'UI ne montre pas « en attente » : le bouton « Demander à rejoindre » revient alors que le serveur connaît la demande** | **aucune** | constat relevé dans `05c05a7c` | sonde instrumentée, essais 2 à 5 — QA locale | défaut présent | **O** |

### 4.9 Navigation et Explorer

| Problème initial | Correction réalisée | Commit | Validation et environnement | Présent sur Preview ? | État |
|---|---|---|---|---|---|
| Le rail medium n'offrait aucun accès à Explorer | Accès Explorer ajouté au rail medium, libellé issu d'une source unique | `805fd8e3`, `671cbf92` | E1 (specs 11, 22, 29) — QA locale | code oui · vérifié non | **I** |
| Un changement de largeur fermait le Menu en laissant le focus nulle part | Focus remis à un contrôle visible ; raison de fermeture alignée sur la règle | `cfb5fbaa`, `bd1d8667` | E1 (specs 10, 20) + E5 | code oui · vérifié non | **I** |
| Seuil d'apparition de la navigation haute confondu avec des largeurs de géométrie | Seuil et géométrie séparés ; largeur propre de la barre assertée | `760066cc`, `3e15101b` | E1 (spec 12) — QA locale | code oui · vérifié non | **I** |
| **Accès au profil puis retour au fil** | — | — | **E4 — déclaration de Kyria, Preview, 20/10/2026** | **vérifié par déclaration** | **Vd** |

### 4.10 Passport

| Problème initial | Correction réalisée | Commit | Validation et environnement | Présent sur Preview ? | État |
|---|---|---|---|---|---|
| Le héros Passport n'avait pas la surface premium canonique, et portait un gradient interdit | Surface premium canonique posée, gradient retiré | `1e9c00fb` | E1 (spec 35) — QA locale | code oui · vérifié non | **I** |
| Dix identifiants HTML dupliqués ; le CTA QR et les ancres menaient à des panneaux masqués | Une seule identité par élément ; ancres et CTA résolus vers le panneau visible | `12c1d5f7`, `769c7c6e` | E1 (spec 35) — QA locale | code oui · vérifié non | **I** |

### 4.11 Accessibilité et cibles tactiles

| Problème initial | Correction réalisée | Commit | Validation et environnement | Présent sur Preview ? | État |
|---|---|---|---|---|---|
| Cibles tactiles sous 44 px (déclencheur de création, liens d'en-tête public) | Cibles portées à 44 px | `769c7c6e` | E1 — QA locale | code oui · vérifié non | **I** |
| Le focus d'un champ provoquait un zoom involontaire sur iOS | Zoom au focus neutralisé | `60ee3ae8` | E1 (spec 13, WebKit) — QA locale | code oui · **vérifié non, et non vérifiable hors vrai iPhone** | **I** |
| À 1366 px, les liens d'en-tête « Découvrir Reims » et « Comment ça marche » mesuraient 20 px de haut | **Zone cliquable portée à 44 px** : les deux liens reçoivent `inline-flex min-h-11 items-center` | `769c7c6e` | lecture du code — `public-home-header.tsx` lignes 40 et 47 portent `min-h-11` dans `bf008a87` | code oui · vérifié non | **I** |

> **Reconciliation du 2026-10-20.** Une version antérieure de ce bilan classait
> les liens d'en-tête en **O** (ouvert) et affirmait une violation de WCAG 2.2
> AA. Les deux points étaient faux.
>
> D'une part la correction a été livrée **dans le commit même qui relevait le
> constat**, `769c7c6e` : les deux liens portent `inline-flex min-h-11
> items-center`, et `bf008a87` le conserve. D'autre part une hauteur de 20 px
> n'établit pas à elle seule une violation de 2.5.8 — l'espacement entre cibles
> et les exceptions de la règle entrent dans son évaluation, et ni l'un ni
> l'autre n'a été mesuré. La ligne est donc reclassée en **I** sur preuve de
> code, et l'affirmation de violation est retirée.

### 4.12 Déploiement

| Problème initial | Correction réalisée | Commit | Validation et environnement | Présent sur Preview ? | État |
|---|---|---|---|---|---|
| L'image servie embarquait tout le workspace, dont des paquets vulnérables inutiles au service | Image Docker multi-étapes ne contenant que l'artefact `standalone` | `2d63c2af` … `bf008a87` | E3 — **Preview**, `bf008a87` | **vérifié** | **V** |
| Le port de l'app était figé à 3000 par le script `start`, masquant le désalignement avec les domaines | Image honorant `PORT` ; domaines Preview alignés sur 8080 | `2d63c2af` + réglage domaines | E3 — Preview ; journal `Ready in 68ms`, écoute `0.0.0.0:8080` | **vérifié** | **V** |
| Un changement de builder écrit dans `railway.toml` pouvait atteindre le site public par héritage | Configuration Docker isolée dans `railway.web-docker.toml` ; `railway.toml` restauré en RAILPACK | `42dc6bf1`, `bf008a87` | E3 — Preview ; `load build definition from frontend/Dockerfile.web` alors que `railway.toml` est RAILPACK | **vérifié** | **V** |
| Aucun en-tête de sécurité émis | En-têtes de sécurité servis par l'app web | `a8c306e8` | E3 — Preview : HSTS, `X-Frame-Options`, `X-Content-Type-Options`, Referrer-Policy, Permissions-Policy | **vérifié** | **V** |
| **La Content-Security-Policy est servie en report-only sans point de collecte : elle ne bloque rien et ne rapporte rien** | **aucune** — constat consigné | `5da59929`, `docs/audit/AUDIT-CSP-01` | `curl -D -` sur `/login` ; zéro `report-to`/`report-uri` | défaut présent | **D — audit de sécurité dédié** |

### 4.13 Authentification et inscriptions — hors liste énumérée, mais dans PR202

Ce bloc n'est pas dans la liste de la mission ; il est conservé pour qu'aucun
correctif du chantier ne disparaisse du bilan. Tous ces commits sont dans
`bf008a87`.

| Sujet | Commits | État |
|-------|---------|------|
| Vérification d'adresse e-mail sans verrouiller les comptes existants | `8bd66766` | **I** |
| Divulgation d'URL de réinitialisation de mot de passe supprimée | `20a9e132` | **I** |
| Protection de l'inscription par couches plutôt qu'un compteur d'IP ; dimension IP ne bloquant plus les réseaux partagés ; Turnstile monté, plafond global sans course | `c67ac40c`, `c22ea21d`, `39e77023` | **I** |
| Statut d'inscription autoritatif côté backend | `48b1a92e` | **I** |
| Suppression de compte avec délai de grâce ; piège de suppression fermé ; comptes en attente masqués ; annulation exigeant un clic | `dd8af18b`, `95f86c9c`, `773e1171` | **I** |
| Échéance du pilote d'inscription appliquée | `2ef42bba`, `c1ab2a08` | **V** — le pilote s'est fermé à son échéance le 2026-10-19 à 16:46:25Z, observé sur Preview |
| Plans payants retirés tant que le paiement est coupé | `a80d052a` | **I** |
| Changement de nom d'utilisateur tous les 14 jours | `4a2eb911`, `56300b93` | **I** |
| **Session conservée après rechargement** | — | **Vd** — E4, Preview, 20/10/2026 |

---

## 5. Dettes réconciliées

Chaque dette signalée pendant le chantier, dédoublonnée, avec son état actuel.
**Une mitigation n'est pas une résolution.**

| Dette | Impact utilisateur | Priorité | Bloque la livraison ? | État |
|-------|--------------------|----------|-----------------------|------|
| **Audit des dépendances rouge** — `braces@3.0.3`, `micromatch@4.0.8`, `node-forge@1.4.0` dans `pnpm-lock.yaml`, sans correctif amont | aucun effet observable par l'utilisateur | haute (sécurité) | **non bloquant pour la recette** ; à trancher avant promotion Production | **ouverte**. L'image servie ne contient **plus les paquets installés** ; une copie **embarquée** de braces, de **version indéterminée**, subsiste dans `next/dist/compiled/@vercel/nft/index.js` et n'a pas été observée chargée sur les chemins instrumentés. **Mitigation de l'image d'exécution, pas remédiation de l'arbre.** Aucune exception OSV, aucune acceptation de risque |
| **Adhésion à une tribu : état « en attente » perdu après rechargement** | l'utilisateur croit pouvoir redemander ; confusion, double demande | moyenne | non bloquant | **ouverte** (§4.8). Non-correction vérifiée : aucun commit postérieur à `05c05a7c` ne touche `tribe_service.py` ni `components/tribes` |
| **CSP inerte** — report-only sans `report-to` | aucune protection réelle là où elle paraît exister | haute (sécurité) | non bloquant pour la recette | **différée** vers un audit de sécurité dédié (`AUDIT-CSP-01`) |
| **Dimensions intrinsèques des médias non servies par l'API** — `MEDIA-METADATA-01` et `MEDIA-03-INTRINSIC-DIMENSIONS` | décalage de mise en page possible avant chargement de l'image | moyenne | non bloquant | **ouverte**. **Doublon réconcilié** : les deux identifiants, introduits par `808673e0` et `8d661210` le même jour, désignent le même sujet — les dimensions servies par l'API. À fusionner en un seul ticket |
| **`LOCAL-VIDEO-ORG-AUTHZ-P1`** — appartenance organisationnelle non vérifiée pour les paliers de durée vidéo | toute identité absente, inconnue ou non canonique retombe sur le palier pilote 90 s | moyenne | non bloquant | **ouverte**, repli sûr en place (`3f93a4d8`) |
| **Archivage de tribu à sens unique** — aucun désarchivage, ni propriétaire ni staff | une tribu archivée par erreur n'est pas récupérable en autonomie | moyenne | non bloquant | **différée** explicitement (`tribe_service.py:253`) |
| **Pas de délai d'attente après un refus d'adhésion** | un utilisateur refusé peut redemander immédiatement | basse | non bloquant | **différée** — assumée à ~15 utilisateurs, à reprendre « si un pattern » apparaît (`tribe_service.py:631`) |
| **Fan-out de notifications synchrone** | lenteur si une tribu devient volumineuse | basse aujourd'hui | non bloquant | **différée** — assumée à ~15 utilisateurs (`social_notification_service.py:122`) |
| **Ville codée en dur** (`WEB-PARTNERS-05A`) | aucun impact mono-ville ; bloquant au passage multi-ville | basse aujourd'hui | non bloquant | **différée** (`local_event_service.py:430`) |
| **Fenêtre de carte fixe** | une ville plus étendue que ~0,4° serait tronquée | basse aujourd'hui | non bloquant | **différée** avec déclencheur explicite : « à revisiter en multi-ville / gros volumes » (`map-city-defaults.ts:12`) |
| **Passport : `/passport/me` + QR hérités** | aucun impact visible ; niveau et XP non migrés en V2 | basse | non bloquant | **différée** en R2 (`use-passport-mobile-extras.ts:8`) |
| **Règle CSS globale restant un piège pour d'autres routes** | risque de régression visuelle sur une route future | basse | non bloquant | **ouverte** (`globals.css:88`) |
| **Verrous consultatifs Alembic au niveau session** | migrations concurrentes mal sérialisées | basse | non bloquant | **différée** avec déclencheur explicite : « revisit if PgBouncer lands » (`alembic/env.py:30`) |
| **Bouton du design system non injectable pour la navigation client** | aucun impact utilisateur | basse | non bloquant | **différée** (`button.tsx:181`) |
| **Divergence SQLAlchemy entre environnements** — conteneur QA en 2.1.1, manifeste `>=2.0.36,<2.1`, CI en 2.0.54 | aucun impact utilisateur ; faussait 50 des 70 erreurs mypy locales | moyenne (fiabilité des mesures) | non bloquant | **ouverte** — constat de la campagne, non traité |
| **Suite Playwright non exécutée par la CI** | aucune régression navigateur ne peut être détectée automatiquement | **haute (fiabilité)** | non bloquant, mais c'est la cause structurelle du besoin de recette manuelle | **ouverte** — vérifié : aucune mention de Playwright dans `.github/workflows/` |
| **Médias vidéo d'exemple absents sur Preview** | les scénarios vidéo ne sont pas jouables en recette sur Preview | moyenne | **bloque les scénarios vidéo de la recette** | **ouverte** — environnement non seedé |
| **Matrice des 44 specs hors dépôt** | la preuve détaillée n'est pas auditable | moyenne | non bloquant | **ouverte** — synthèse consignée ici, détail par spec non committé |

---

## 6. Ce qui n'est pas établi

- **Connexion sur Preview par un parcours mesuré.** E4 est une **déclaration
  d'usage** de Kyria, précieuse et retenue comme telle. Aucun relevé réseau,
  aucune capture, aucune mesure automatisée ne l'accompagne. Aucun compte de
  recette autorisé n'a été disponible pendant le chantier ; les identifiants du
  compte pilote sont hors dépôt (`docs/qa/PILOT-SMOKE-02`), et la création de
  compte sur Preview a été exclue.
- **Comportement navigateur sur Preview**, au-delà du smoke public et de E4 :
  aucun des 44 scénarios n'a été rejoué sur Preview.
- **Comportement sur un vrai iPhone / Safari.** La spec 13 tourne sous WebKit en
  QA locale, ce qui n'est pas un appareil réel.
- **Absence générale de chargement de `braces` et `node-forge`.** `node-forge`
  n'a pas été observé sur les chemins instrumentés. Les chemins non tracés et
  les limites du traceur empêchent d'affirmer une absence générale de
  chargement. La même réserve s'applique à `braces`.
- **Version de la copie de braces embarquée dans Next** : indéterminée, et sa
  correspondance avec l'avis ne peut pas être établie.

---

## 7. Synthèse

Décompte **mesuré sur le fichier**, et non estimé — 60 lignes dans la matrice §4.

| Code | Lignes | Lecture |
|------|--------|---------|
| **V** — vérifié par mesure | 5 | les quatre lignes de déploiement, vérifiées **sur Preview**, plus l'échéance du pilote d'inscription |
| **Vd** — vérifié par déclaration | 3 | les trois points de la recette manuelle de Kyria du 20/10/2026 |
| **I** — implémenté, validation incomplète | 49 | code déployé, preuve obtenue sur un **autre environnement** (QA locale) ou par tests unitaires |
| **O** — ouvert | 1 | l'état « en attente » d'une adhésion, perdu après rechargement |
| **D** — différé explicitement | 1 | la CSP inerte, vers un audit de sécurité dédié |
| **N** — non établi | 1 | les médias vidéo d'exemple, absents de Preview |

Les dettes du §5 ont leur propre colonne d'état et ne sont pas recomptées ici.

La masse du chantier est en **I** : le code est déployé, et la preuve existe —
mais sur un autre environnement que celui qui sera livré. C'est exactement ce
que la recette manuelle doit convertir en **V**.

Une version antérieure de cette synthèse annonçait « 6 V dont 3 déclaratifs,
34 I, 5 O, 9 D, 2 N ». Ces chiffres étaient écrits à la main et faux ; ils sont
remplacés par le décompte ci-dessus.
