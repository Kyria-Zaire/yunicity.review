# Revue du correctif — PROFILE-POST-MENU-01 · Supprimer sa propre publication

> **Forme** : rule [`05-code-review`](../../.claude/rules/05-code-review.md).
>
> **État du diff** : **arbre de travail**, **branche `fix/mobile-publishing-p0`**,
> **base `8d2d4c9f`**. ⛔ **Aucun commit**, ⛔ **aucun déploiement**, ⛔ **aucune
> publication créée ni supprimée sur Preview**.
>
> **Passation du ticket** :
> [`../workflow/passations/PROFILE-POST-MENU-01-supprimer-sa-publication.md`](../workflow/passations/PROFILE-POST-MENU-01-supprimer-sa-publication.md).

---

## 1. Comportement final

### 1.1 Ce que l'utilisateur peut faire, et où

| Surface | Palier | Chemin | Couverture |
|---|---|---|---|
| **Carte du fil** (`/feed`) | **desktop + medium + mobile** | menu **« Plus d'actions »** → section **« Ma publication »** → **« Supprimer »** | **un seul arbre DOM** pour les trois paliers *(seules des media queries les séparent)* — **un câblage unique les sert tous** |
| **Publications du profil** (`/profile/me`) | **desktop** | onglet **« Publications »** → bouton **« Options »** → **« Supprimer »** | `ProfileDesktopPublications` |
| **Publications du profil** | **medium + mobile** | **aperçu** *(« Vue d'ensemble »)* **et** onglet **« Publications »** | même composant, monté par `ProfileCompactScreen` |

**Vérifié** : le profil monte **les trois paliers simultanément** dans le DOM,
mais les paliers inactifs sont en **`display: none`** *(`globals.css`)* — **ils
sortent donc de l'ordre de tabulation et de l'arbre d'accessibilité**. **Un seul
bouton « Options » est atteignable à une largeur donnée** : transformer un
contrôle `disabled` en contrôle actif n'a pas ajouté deux pièges clavier.

### 1.2 Le cycle, étape par étape

1. **Ouvrir le menu** — aucune écriture.
2. **Cliquer « Supprimer »** — **aucune écriture** : la confirmation s'ouvre.
   **Le focus part sur « Annuler »**, l'action non destructrice.
3. **Annuler**, **Échap** ou **clic sur le fond** — **rien n'est supprimé**.
4. **Confirmer** — **`DELETE /api/v1/posts/{id}`**. **Pendant l'appel** :
   **« Suppression… »**, **les deux boutons désactivés**, **ni Échap ni le fond
   ne ferment**. **Un second clic dans le même tick est ignoré** *(verrou)*.
5. **Succès** — **la carte disparaît** *(retrait local APRÈS le `204`)*, **le
   focus revient au déclencheur**, et le fil annonce **« Publication
   supprimée. »** *(`role="status"`)*.
6. **Échec** — **la confirmation RESTE OUVERTE** avec un **message français**
   *(`role="alert"`)* : **réessayer ou annuler**. **`403`**, **`404`**, **`401`**
   et **panne réseau** ont chacun leur message, et **aucun détail serveur
   n'atteint l'écran**.

### 1.3 Décisions d'architecture

| Décision | Raison |
|---|---|
| **Le réseau reste chez le propriétaire de la liste** *(contrôleur du fil, contexte du profil)*, **comme `onReport`** | **lui seul sait retirer la carte de sa liste**. **Conséquence voulue** : **`FeedCardDependencies` n'a PAS bougé** — **son contrat est verrouillé à cinq membres** *(`feed-card-seam.test.ts`)*, **et le harnais E2E n'a pas eu à changer** |
| **`usePublicationDeletion` n'appelle NI `useAuth` NI `useYunicityApi`** — la fonction est **injectée** | **la vue `FeedCardWithDependencies` doit rester montable hors de l'arbre de providers** *(même verrou)* |
| **Retrait local APRÈS le `204`** — ⛔ **pas de suppression optimiste** | **un `403` laisse la publication EN LIGNE** : masquer la carte ferait **mentir l'écran** jusqu'au rechargement |
| **Famille CITOYENNE seulement** | **une carte événement ou offre n'est pas une publication personnelle** : `DELETE /posts/{id}` **retirerait la carte en laissant l'entité source** |
| **Le prop est fourni par l'APPELANT** | **le profil public monte le même composant** : **la frontière est portée par l'appelant, et tenue par le serveur** |

---

## 2. Fichiers

### 2.1 Nouveaux — 8

| Fichier | Rôle |
|---|---|
| `frontend/packages/utils/src/publication-delete.ts` | **libellés FR**, **`humanizePublicationDeleteFailure`**, **et la portée de la suppression douce documentée à la source** |
| `frontend/packages/utils/src/publication-delete.test.ts` | **6 tests** du message d'erreur |
| `frontend/apps/web/hooks/use-publication-deletion.ts` | **machine à états** `request → confirm`, **verrou anti double-envoi**, **sans provider** |
| `frontend/apps/web/hooks/use-overflow-menu.ts` | **mécanique d'un menu** : clic extérieur, Échap, retour du focus |
| `frontend/apps/web/components/feed/publication-delete-dialog.tsx` | **confirmation PARTAGÉE** par les deux surfaces |
| `frontend/apps/web/components/profile/profile-publication-options-menu.tsx` | **menu « Options »** du profil |
| `frontend/apps/web/lib/feed/publication-delete-flow.test.tsx` | **17 tests de comportement** *(composants montés et cliqués)* |
| `frontend/apps/web/lib/feed/publication-delete-wiring.test.ts` | **12 verrous d'architecture** *(chaîne de props, ordre des effets, couture, frontière)* |

### 2.2 Modifiés — **20 fichiers de code** *(17 sources web et paquets · 2 specs Playwright · 1 test backend)*

| Fichier | Changement |
|---|---|
| `packages/utils/src/feed-api.ts` · `yunicity-api.ts` · `index.ts` | **`deletePost` / `deleteFeedPost`**, **exports** |
| `components/feed/feed-post-options-menu.tsx` | **branche propriétaire** : menu rendu **si et seulement si** la suppression est câblée |
| `components/feed/feed-author-header.tsx` · `citizen-post-card.tsx` | **transmission** |
| `components/feed/feed-card.tsx` | **`onDeletePost`**, **état de suppression**, **confirmation montée** |
| `components/feed/feed-editorial-main-column.tsx` · `feed-editorial-stream-region.tsx` · `desktop/feed-desktop-stream.tsx` | **transmission** + **annonce de succès** |
| `hooks/use-feed.ts` · `hooks/use-profile-portal-context.ts` | **`deletePost` / `deleteUserPost`** : **API puis retrait local** |
| `components/feed/portal/feed-data-controller.tsx` | **`handleDeletePost`** |
| `components/profile/desktop/profile-desktop-publications.tsx` | **menu réel** à la place du bouton mort, **confirmation montée** |
| `components/profile/desktop/profile-desktop-owner-screen.tsx` · `profile-compact-screen.tsx` · `medium/profile-medium-overview.tsx` | **câblage des surfaces propriétaires** *(trois paliers)* |
| `e2e/functional/21-mobile-feed-functional.spec.ts` | ⚠️ **assertion mise à jour** *(voir §4.1)* |
| `e2e/functional/33-unified-publication-card.spec.ts` | **commentaire clarifié** — **assertion inchangée** |
| `backend/tests/test_feed.py` | **test d'autorisation ajouté** |
| `docs/…` *(5 fichiers)* | **index, passations, bilan, couverture** — **annotations, aucun reclassement** |

---

## 3. Résultats des tests

### 3.1 Contrôles exécutés sur l'état final

| Contrôle | Code de sortie | Résultat |
|---|---|---|
| **`pnpm --filter @yunicity/utils typecheck`** | **0** | ✅ |
| **`pnpm --filter web typecheck`** | **0** | ✅ — **couvre aussi les 44 specs `e2e/functional`** *(vérifié par `--listFilesOnly`)*. ⛔ **Compiler n'est PAS s'exécuter** : **le typecheck ne valide AUCUNE spec Playwright en navigateur** |
| **`pnpm --filter web lint`** | **0** | ✅ **0 erreur**, **aucun avertissement nouveau** |
| **Tests du correctif + verrous d'architecture** | **0** | ✅ **54 / 54** *(**21** comportement + **16** plomberie + 10 couture + 7 flux)* — **+8 depuis la correction de `C1`, `C2` et `C4`** |
| **Suite `@yunicity/utils`** | — | ✅ **1251 / 1251** *(dont les 6 nouveaux)* · ⚠️ **1 erreur d'infrastructure** sur un fichier sans rapport *(voir §3.3)* |
| **Suite web complète** — **état FINAL**, **paramètres exacts** : **`npx vitest run --testTimeout=30000 --hookTimeout=30000 --maxWorkers=3`** *(dans `frontend/apps/web`)* | **0** | ✅ **93 / 93 fichiers**, **956 / 956 tests**, **0 échec, 0 erreur** — **321 s**. ⛔ **`vitest.config.ts` N'A PAS ÉTÉ MODIFIÉ** : **le défaut du dépôt reste 5 s et un pool `forks` non borné**, **et c'est ce défaut que la CI applique** — **les trois paramètres sont un réglage d'EXÉCUTION LOCALE** |
| **Build Next** — **état FINAL** | **0** | ✅ **toutes les routes compilées** · **l'artefact de build `next-env.d.ts` a été restauré après coup** |
| **`pnpm --filter web build`** *(premier passage, état antérieur)* | **0** | ✅ **toutes les routes compilées** |

### 3.2 Backend — exécuté **sous Docker**

**Chemin officiel du dépôt** : `sh scripts/qa-backend-pytest-host.sh`, **garde
`app.qa.guard`** — **base JETABLE `yunicity_test_*` uniquement**, **créée puis
supprimée**, ⛔ **jamais `yunicity_qa`, jamais dev, jamais prod**.

```
postgres QA (hôte) : 127.0.0.1:5455      redis QA : redis://127.0.0.1:6399/1
base jetable : yunicity_test_0367990d08e9  → créée, utilisée, SUPPRIMÉE
tests/test_feed.py  →  17 passed in 109.80s
```

| Test | Ce qu'il établit |
|---|---|
| ✅ **`test_soft_delete_post_rejects_other_citizen`** *(AJOUTÉ)* | **un tiers reçoit `403`**, **et la publication SURVIT** — **`200` à la relecture par son auteur**. **C'est la frontière de sécurité du bouton** |
| ✅ **`test_soft_delete_post_author_and_moderator`** *(existant)* | **auteur `204`**, **modérateur `204`**, **`404` à la relecture** — **non régressé** |
| ✅ **les 15 autres tests du fichier** | **aucune régression sur le fil, les commentaires, la visibilité** |

### 3.3 Échecs des suites complètes — **ce qui est ÉTABLI, ce qui est SUPPOSÉ**

**Trois mesures, dans un ordre contrôlé, sur le même poste** :

| Run | Arbre | Délai | Fichiers | Tests | Échecs |
|---|---|---|---|---|---|
| **A** | **mon arbre** | **5 s** *(défaut)* | **63 collectés** | 556 | **3 fichiers, 4 tests** · **29 erreurs** |
| **B** | ✅ **LIGNE DE BASE `8d2d4c9f`**, **arbre séparé, SANS mes modifications** | **5 s** | **77 collectés** | 760 | **13 fichiers, 17 tests** · **14 erreurs** |
| **C** | **mon arbre** | **30 s** *(`--testTimeout=30000 --hookTimeout=30000`, **en ligne de commande**)* | **93 / 93** | **948** | ✅ **AUCUN** |

**Méthode de la ligne de base**, pour qu'elle soit auditable : **`git worktree
add --detach 8d2d4c9f`** dans un répertoire hors du dépôt, **`node_modules`
rattaché par JONCTIONS** *(dépendances tierces identiques, même `pnpm-lock`)*,
**les alias `@yunicity/*` et `@/*` de `vitest.config.ts` résolvant vers l'arbre
de la LIGNE DE BASE** — **vérifié : mes fichiers de test y sont ABSENTS**.
⛔ **Aucun `stash`, aucun `reset`** : **l'arbre de travail n'a jamais été
touché**. **L'arbre de mesure a été supprimé après coup** *(jonctions retirées
d'abord, pour qu'aucune suppression ne suive vers le vrai `node_modules` —
contrôlé après)*.

**ÉTABLI — quatre faits, chacun mesuré** :

1. **Le mode d'échec n'est PAS une assertion.** **Sur A comme sur B** :
   **12 occurrences de `[vitest-pool]: Failed to start forks worker … Timeout
   waiting for worker to respond`**, et **ZÉRO occurrence de
   `Test timed out`**. **Aucun test n'a échoué sur ce qu'il vérifie.**
2. **Le même mode d'échec se produit SANS mes modifications.** **La ligne de
   base `8d2d4c9f`** *(arbre git séparé, mes fichiers absents — vérifié)*
   **échoue PLUS** : **13 fichiers et 17 tests**, **contre 3 et 4 sur mon
   arbre**. ⛔ **Ce n'est donc pas une régression de ce diff.**
3. **Les runs à 5 s n'ont même pas COLLECTÉ la suite** : **63 et 77 fichiers sur
   93**. **Les fichiers dont le worker n'a jamais démarré sont comptés en
   « errors », pas en tests échoués.** ⚠️ **Lire « 931 / 933 » comme
   « 2 régressions » serait donc une erreur de lecture** — **une partie de la
   suite n'avait pas tourné du tout.**
4. **Avec des paramètres adaptés à ce poste, l'arbre de travail est
   INTÉGRALEMENT vert.** ⚠️ **Les runs `A`, `B` et `C` ci-dessus PRÉCÈDENT la
   correction de `C1`, `C2` et `C4`** *(948 tests à l'époque)*. **La mesure de
   l'ÉTAT FINAL est le run `D`** :

| Run | État | Paramètres | Résultat |
|---|---|---|---|
| **D₁** | **final** | **`--testTimeout=30000 --hookTimeout=30000`** *(pool `forks` par DÉFAUT, non borné)* | ⚠️ **843 tests passés, 0 ÉCHEC**, **mais 8 fichiers dont le worker n'a jamais DÉMARRÉ** *(85 / 93 collectés)* — **la preuve que relever le DÉLAI ne traite pas le DÉMARRAGE des workers** |
| **D₂** | **final** | **`--testTimeout=30000 --hookTimeout=30000 --maxWorkers=3`** | ✅ **93 / 93 fichiers**, **956 / 956 tests**, **0 échec, 0 erreur**, **321 s** |

> **Ce que `D₁` → `D₂` ajoute au diagnostic** : **borner la CONCURRENCE
> (`--maxWorkers=3`) suffit à rendre la suite complète**, **là où relever le
> seul délai ne suffisait pas**. **Le goulot est donc le DÉMARRAGE simultané
> des processus de travail**, **pas la durée des tests** — ⚠️ **ce qui reste
> une INFÉRENCE de deux mesures, et non une cause prouvée.**
>
> ⚠️ **Tentative intermédiaire consignée** : **`--poolOptions.forks.maxForks=3`
> a été essayé et REJETÉ par vitest 4** *(`CACError: Unknown option
> --poolOptions`)* — **l'option n'existe pas en ligne de commande**, **et ce
> passage n'a donc produit AUCUNE mesure.**

**SUPPOSÉ — et volontairement non affirmé** :

- **la CAUSE RACINE** du démarrage lent des workers. **Hypothèse plausible** :
  **contention d'E/S sur ce poste Windows** *(pool `forks`, analyse antivirus,
  Docker Desktop actif pendant les mesures, `transform` cumulé jusqu'à 1774 s
  sur le run B)*. ⛔ **Non prouvée** — **et non nécessaire** : les faits 1 et 2
  suffisent à écarter la régression.
- **la conduite à tenir** : **inscrire le relèvement dans `vitest.config.ts`**
  rendrait la suite exploitable sur ce poste, **mais masquerait une lenteur
  réelle**. ⛔ **Non fait** : **le fichier de configuration est INTACT**, **le
  relèvement n'a existé qu'en LIGNE DE COMMANDE** *(`--testTimeout=30000
  --hookTimeout=30000`)*. ⛔ **Hors périmètre de ce ticket** — **décision de
  Kyria**, et **la CI Ubuntu reste l'autorité** *(elle lance `pnpm test` avec le
  délai par défaut de 5 s)*.

> ⛔ **À ne pas écrire** : « ces échecs sont des flakes ». **Ce qui est établi**,
> c'est **le mode d'échec**, **sa présence à HEAD**, et **la verdeur complète de
> la suite dès que le délai est suffisant**. **La cause reste ouverte.**

---

## 4. Problèmes trouvés PENDANT cette revue, et corrigés

### 4.1 ⚠️ Régression de SPÉCIFICATION — **réelle, et introduite par ce diff**

**`e2e/functional/21-mobile-feed-functional.spec.ts`** exigeait
**`toHaveCount(0)`** sur **`[data-feed-publication-overflow]`** de **SA PROPRE
publication**, **dans l'application RÉELLE**. **Mon correctif rend ce
déclencheur présent** → **l'assertion serait ROUGE**.

**L'intention verrouillée** — **« on ne signale pas sa propre publication »** —
**n'est PAS violée** : **le menu propriétaire ne contient AUCUN motif de
signalement**. **C'est l'assertion qui était devenue un mauvais proxy de
l'intention**, parce qu'à l'époque **aucune action propriétaire n'existait**.

**Correction** : **l'assertion porte désormais sur le CONTENU du menu** —
**déclencheur présent**, **« Ma publication » et « Supprimer » présents**,
**aucun des trois motifs**, **aucun titre « Signaler »** —, **puis Échap**.
⛔ **Aucun clic sur « Supprimer »** : **la publication de support est la matière
de plusieurs autres tests du fichier**, **et la suppression est douce**.

**`e2e/functional/33-unified-publication-card.spec.ts`** **reste VERTE sans
changement d'assertion** : **elle tourne contre le HARNAIS**, **qui ne câble pas
`onDeletePost`** — **c'est exactement la garde `viewerIsAuthor && !onDelete`
qu'elle éprouve**. **Son commentaire a été clarifié** pour que les deux specs ne
paraissent pas se contredire : **elles verrouillent les deux branches**.

> ⛔ **CES DEUX SPECS N'ONT PAS ÉTÉ EXÉCUTÉES.** **Aucun Playwright ne tourne en
> CI** *(`frontend-ci.yml` n'en lance aucun)*, **et elles exigent une
> application servie et une session authentifiée**. ✅ **Elles TYPECHECKENT**
> *(le typecheck web couvre `e2e/functional`)* — **ce qui prouve la compilation,
> pas le comportement.**

### 4.2 ⚠️ Ma vérification précédente était INCOMPLÈTE — **consigné**

**Le `pnpm --filter web typecheck` annoncé vert la session précédente avait été
lancé AVANT l'écriture des fichiers de test** : **il ne les couvrait pas.**
**Relancé après, il a trouvé DEUX ERREURS RÉELLES**, toutes deux dans
`publication-delete-flow.test.tsx` :

1. **`let libere: (() => void) | null`** affecté dans le constructeur d'une
   promesse : **au point d'appel, TypeScript avait réduit la variable à `null`**,
   **et l'appel optionnel ne laissait plus que `never`**. **Remplacé par le
   motif `differe<T>()` déjà utilisé dans le dépôt** *(assertion d'affectation
   définie)*.
2. **Fixture `EventInterestToggleResponse` incomplète** *(`event_id` et
   `interest_count` manquants)*, **masquée par un `as FeedCardDependencies` en
   fin d'objet**. **Fixture complétée**, **et le `as` SUPPRIMÉ** — **pas de cast
   de complaisance**.

> **Leçon retenue, et applicable au-delà de ce ticket** : **un gate lancé avant
> l'écriture du code ne vaut pas pour le code écrit après.** **L'ordre des
> vérifications fait partie de la preuve.**

### 4.3 Accessibilité de la confirmation destructive

**`aria-modal` annonce une surface modale, mais ne retient PAS la
tabulation** : **Tab emmenait derrière la modale**, **action destructrice
toujours ouverte**. **Ajout d'un cycle de focus** entre « Annuler » et
« Supprimer », **et 3 tests** *(focus initial, cycle dans les deux sens, retour
au déclencheur)*.

### 4.4 Plomberie non couverte

**Le chemin du fil traverse CINQ composants de transmission**, **et
`onDeletePost` est optionnel partout** : **un prop oublié ne produit AUCUNE
erreur de type** — **le menu redeviendrait muet sur sa propre publication, soit
le défaut d'origine, sans que rien ne le signale.** **Ajout de 12 verrous
statiques** : **chaîne de transmission**, **ordre « API puis retrait »**,
**absence de provider dans le hook**, **frontière propriétaire / public**.

---

### 4.5 Dernière revue ciblée du 2026-10-31 — **cinq constats, aucun bloquant**

**Axes demandés** : **autorisation**, **confirmation**, **gestion des erreurs**,
**focus**, **retrait des cartes après succès**.

#### ✅ Ce qui est VÉRIFIÉ CONFORME

| Axe | Constat |
|---|---|
| **Autorisation** *(conclusion BORNÉE — voir l'encadré sous ce tableau)* | **le prédicat d'AFFICHAGE est IDENTIQUE sur les deux surfaces**, **et dérivé de l'identité SERVEUR** : le fil exige **`post.author.type === "citizen" && post.author.id === currentUserId`** *(`currentUserId` vient de `useAuth`)* ; le profil n'affiche que **`filterProfileUserFeedPosts`**, qui filtre sur **`post.author.id === profile.user_id`** *(`profile` vient de `getProfileMe()`)* — **`profile-mobile-presenter.ts:37`-`51`**. **Le parcours NOMINAL n'envoie donc que des identifiants que le serveur a lui-même renvoyés** |
| **Confirmation** | ⛔ **rien n'est écrit avant `confirm`** · **« Annuler », Échap et clic extérieur annulent** · **pendant l'appel, les deux boutons sont désactivés et ni Échap ni le fond ne ferment** · **un second `confirm` dans le même tick est ignoré** *(verrou par `ref`)* |
| **Erreurs** | **quatre cas distingués** *(`403`, `404`, `401`, le reste)*, ⛔ **aucun détail serveur à l'écran**, **la confirmation RESTE OUVERTE pour réessayer**. **Le rejet remonte proprement** : `use-feed.deletePost` → `handleDeletePost` → `usePublicationDeletion.confirm` → modale. ⛔ **Aucun `catch` silencieux** |
| **Retrait après succès** | **jamais avant le `204`.** **Fil** : `items` filtré → **`displayedPosts` (memo)** → `buildFeedStream` → carte retirée *(chaîne vérifiée)*. **Profil** : `feedPosts` filtré — **la SOURCE, pas la projection** —, donc `userPosts` recalculé **et les trois paliers mis à jour ensemble** ; **les statistiques et la frise d'activité suivent**, car elles dérivent du même `feedPosts` |
| **Frontière** | **menu TOUJOURS absent** là où la suppression n'est pas câblée *(mur de Tribu, Discussions, harnais)* **et sur les profils publics** — **12 verrous statiques le tiennent** |

> ## 🛑 Conclusion BORNÉE sur l'autorisation — **le masquage du contrôle n'exclut PAS une IDOR**
>
> **Ce qui précède décrit le RENDU**, **et le rendu n'est pas une frontière de
> sécurité.** ⛔ **Une première rédaction de cette revue écrivait « aucune
> surface d'IDOR ». C'était une conclusion TROP LARGE** : **cacher le bouton
> empêche un parcours accidentel**, **pas un appel forgé.**
>
> **Ce qu'un attaquant peut faire quoi qu'on affiche** : **appeler
> `DELETE /api/v1/posts/{id}` directement**, **avec l'identifiant d'une
> publication qui n'est pas la sienne** — **console du navigateur, client HTTP,
> script**. **Aucune condition d'affichage n'y change quoi que ce soit.**
>
> ✅ **CE QUI PROTÈGE RÉELLEMENT, et c'est le SEUL argument qui compte** :
> **le contrôle SERVEUR** — **`_can_moderate_post` → `_is_author`**
> (`post_service.py`) —, **ÉPROUVÉ par un test EXÉCUTÉ** :
> **`test_soft_delete_post_rejects_other_citizen`** → **un tiers reçoit `403`**
> **et la publication SURVIT** *(§3.2, sous Docker, base jetable)*.
>
> **Le rôle du masquage est donc UNIQUEMENT ergonomique** : **ne pas proposer
> une action que le serveur refusera.** **La sécurité, elle, tient au `403` —
> et à son test.**

#### ⚠️ Les cinq constats

| # | Constat | Fichier(s) | Décision |
|---|---|---|---|
| **C1** | **Sur le PROFIL, le succès n'était NI annoncé NI refocalisé.** **Le fil posait une annonce `role="status"` ; le profil n'en avait AUCUNE.** **Et le déclencheur « Options » disparaissant AVEC la carte**, **le focus retombait sur `<body>`** | `components/profile/desktop/profile-desktop-publications.tsx` | ✅ **CORRIGÉ** *(§4.6)* |
| **C2** | **Sur le FIL, le focus était perdu de la même façon** après succès | `components/feed/feed-editorial-stream-region.tsx` | ✅ **CORRIGÉ** *(§4.6)* |
| **C3** | **La minuterie de `deleteMessage` n'est pas annulée.** **Deux suppressions rapprochées** : **le message de la seconde s'effacera au reliquat de la première** *(< 4 s)*. **Reproduit à l'identique le motif préexistant de `reportMessage`**, **juste au-dessus dans le même fichier** | `components/feed/portal/feed-data-controller.tsx` | ⏸ **DOCUMENTÉ, accepté pour cette livraison** *(décision de Kyria)* — **cosmétique, aucune donnée en jeu** ; **le corriger isolément créerait une incohérence avec `reportMessage`, qu'il faudrait traiter ensemble** |
| **C4** | **`aria-describedby` basculait du corps vers l'erreur** : **une fois l'erreur affichée, la phrase de PORTÉE n'était plus annoncée** | `components/feed/publication-delete-dialog.tsx` | ✅ **CORRIGÉ** *(§4.6)* |
| **C5** | **L'état d'attente est peu annoncé** : **le bouton focalisé devient `disabled` et change de libellé** *(« Suppression… »)* — **plusieurs lecteurs d'écran n'annoncent pas ce changement sur un élément qui perd son interactivité** | `components/feed/publication-delete-dialog.tsx` | ⏸ **DOCUMENTÉ, accepté pour cette livraison** *(décision de Kyria)* — **l'issue, elle, EST annoncée** *(succès par `role="status"`, échec par `role="alert"`)* : **seule l'attente est muette** |

> ⛔ **Aucun des cinq ne mettait de DONNÉE en risque** : **ni perte, ni
> suppression non voulue, ni contournement d'autorisation.** **C'est pourquoi
> aucun n'était classé bloquant.**

### 4.6 ✅ C1, C2 et C4 — **corrigés, et couverts par des tests**

**Principe retenu, identique sur les deux surfaces** : **l'ANNONCE et le FOCUS
sont traités SÉPARÉMENT.**

| Mécanisme | Pourquoi séparé |
|---|---|
| **Annonce** — zone **`role="status"`** portant **`PUBLICATION_DELETE_DONE`** *(la MÊME constante des deux côtés)* | **une zone « polie » est restituée par les technologies d'assistance SANS avoir besoin du focus** |
| **Focus** — déplacé sur un **ancrage STABLE**, **`tabIndex={-1}`** *(focalisable par PROGRAMME seulement : l'ordre de tabulation de la page est inchangé)* | **le message s'efface au bout de quelques secondes** : **l'y poser aurait reperdu le focus à son retrait**. **L'ancrage, lui, survit** |

| Surface | Ancrage de focus | Annonce |
|---|---|---|
| **Profil** | **le TITRE « Publications »** — **il situe le lecteur là où la publication se trouvait** | ✅ **AJOUTÉE** — **et sa minuterie est NETTOYÉE au démontage**, **le composant étant monté une fois PAR PALIER** |
| **Fil** | **la RÉGION DU FLUX** — **elle contient les publications restantes** | **déjà présente** *(`role="status"`)* |

**C4** : **`aria-describedby` CONCATÈNE désormais les deux identifiants** —
**la portée D'ABORD, l'erreur ENSUITE** — **et `role="alert"` assure en plus
l'annonce immédiate du message.**

**Couverture — 4 tests de comportement ajoutés** *(`publication-delete-flow.test.tsx`)* :
**`18`** l'annonce du profil et son libellé · **`19`** le focus sur le titre de
section *(et `tabindex="-1"`)* · **`20`** le focus sur la région du flux quand
l'annonce apparaît · **`21`** les DEUX descriptions présentes, **dans l'ordre**,
**avec vérification du TEXTE de chacune**.
**Et 4 verrous statiques** *(`publication-delete-wiring.test.ts`)* : **libellé
partagé**, **ancrages `tabIndex={-1}` des deux côtés**, **nettoyage de la
minuterie**, **concaténation de `aria-describedby`**.

---

## 5. Limites restantes

| Limite | Statut |
|---|---|
| ⛔ **AUCUNE preuve d'écran** | **rien n'a été ouvert dans un navigateur** — **recette `R1`–`R9`**, ⚠️ **dont SAFARI iPHONE RÉEL**, **le palier où `E6` a observé le défaut** |
| ⛔ **Specs Playwright 21 et 33 NON EXÉCUTÉES** | §4.1 — **elles COMPILENT**, **et c'est tout** : ⛔ **le typecheck ne les valide PAS en navigateur**, **il ne dit rien de ce que Playwright observerait**. **Aucun workflow ne les lance** |
| ⚠️ **Suppression DOUCE** | **la ligne reste en base**, **les fichiers restent stockés**, **l'auteur garde l'accès par URL directe**. ⛔ **Ne jamais l'écrire comme un effacement** |
| ⚠️ **Le `404` opposé aux TIERS sur les médias** | **PRÉDICTION DE CODE** — **non vérifiable : il faudrait un SECOND COMPTE, et l'inscription est fermée** |
| ⛔ **Familles événement / offre / organisation** | **aucune suppression offerte** *(décision, §1.3)* |
| ⛔ **Aperçu du profil DESKTOP** | **liste `compact` SANS contrôle d'options**, **avant comme après** : au desktop, la suppression vit dans l'onglet « Publications » |
| ⛔ **Profil PUBLIC, mur de Tribu, Discussions, harnais** | **inchangés** — **aucun rappel câblé** |
| ⛔ **`apps/mobile` (Expo)** | **hors périmètre** : « desktop, medium, mobile » désigne les **trois paliers du WEB** |
| ⛔ **Modifier une publication** | **`PATCH /posts/{id}` existe, non câblé** |
| ⚠️ **Le fond de la modale n'est pas `inert`** | **le cycle de focus suffit à retenir la tabulation** ; **aucune autre modale du dépôt ne fait mieux** — **non régressif, non parfait** |
| ⏸ **`C3` — minuterie de `deleteMessage` non annulée** | **DOCUMENTÉ, accepté pour cette livraison** *(§4.5)* — **cosmétique** ; **à traiter avec `reportMessage`, qui porte le même motif** |
| ⏸ **`C5` — état d'attente peu annoncé** | **DOCUMENTÉ, accepté pour cette livraison** *(§4.5)* — **l'ISSUE est annoncée** *(succès `role="status"`, échec `role="alert"`)*, **seule l'attente est muette** |
| ⚠️ **Dette signalée** | **`FeedPostOptionsMenu` porte sa propre mécanique de menu, que `useOverflowMenu` duplique** — **`TODO(debt)` posé** : **refactor à part**, **son déclencheur étant sous contrat E2E** *(règle 11)* |
| ⚠️ **`profile-mobile-post-card.tsx`** | **code mort** *(monté par un seul harnais E2E)* — ⛔ **volontairement NON câblé** |

---

## 6. Verdict proposé

```
Verdict : REQUEST CHANGES — non bloquant sur le CODE, bloquant sur la PREUVE

Blocking :
  • aucune preuve d'écran : le critère de sortie du ticket est VISUEL
    (carte absente APRÈS RECHARGEMENT, sur les trois paliers, dont
    Safari iPhone réel). Zone rouge : mutation de données utilisateur
    → validation humaine requise avant fusion.
  • specs Playwright 21/33 modifiées mais non exécutées.

Non-blocking :
  • dette : mécanique de menu dupliquée (TODO(debt) posé, refactor à part).
  • `vitest.config.ts` : délai de 5 s inexploitable sur ce poste — décision
    de Kyria, hors périmètre.
  • aperçu desktop en mode compact sans contrôle d'options.

Security :
  • la frontière est le CONTRÔLE SERVEUR, et lui seul : `_can_moderate_post`
    → `_is_author`. TESTÉ et EXÉCUTÉ : `403` à un tiers + SURVIE de la
    publication (sous Docker, base jetable).
  • ⛔ le masquage du bouton côté interface N'EXCLUT PAS une IDOR : il
    empêche un parcours accidentel, pas un appel forgé sur
    `DELETE /posts/{id}`. Son rôle est ERGONOMIQUE — ne pas proposer une
    action que le serveur refusera. Conclusion bornée en conséquence (§4.5).
  • aucun détail serveur n'atteint l'écran (message choisi par code d'erreur,
    test dédié).
  • aucune suppression optimiste : l'écran ne peut pas mentir sur un refus.
  • aucun secret dans le diff. Aucune route nouvelle. Aucune migration.
  • confirmation obligatoire avant toute écriture.

Test gaps :
  • le rendu réel des deux surfaces, sur les trois paliers (seul l'écran peut
    le dire).
  • le comportement sur Safari iPhone réel.
  • le `404` opposé aux tiers sur les médias (second compte impossible).
```

**Prochaine action** : **valider ce diff**, **puis suivre la préparation de
commit et de déploiement** —
[`../ops/PROFILE-POST-MENU-01-commit-et-deploiement-preview.md`](../ops/PROFILE-POST-MENU-01-commit-et-deploiement-preview.md)
*(listes exactes, séparation des modifications antérieures, commandes,
procédure de retour arrière)*. **Puis** : **autoriser `R0`** *(créer UNE
publication de test — c'est une écriture)* **et jouer `R1`–`R9` ensemble**,
**sur desktop, medium et SAFARI iPHONE RÉEL**. ⛔ **Le ticket reste ACTIF et NON
CLOS**, **et le défaut reste classé `O`**, **jusqu'à cette recette.**
⛔ **Déployer n'est pas prouver.**
