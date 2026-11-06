# Passation — PROFILE-POST-MENU-01 · Supprimer sa propre publication · desktop + medium + mobile

> ## ▶️ TICKET ACTIF depuis le 2026-10-31 — **CORRECTIF IMPLÉMENTÉ, NON PROUVÉ À L'ÉCRAN**
>
> **Demandé par Kyria le 2026-10-31** : **passer de la détection à la
> correction**, **un ticket à la fois**. **L'implémentation est AUTORISÉE.**
> ⛔ **Aucun commit**, ⛔ **aucun déploiement** à ce stade.
>
> **État exact du correctif** : **écrit dans l'arbre de travail**, **vérifié par
> types, lint et tests**, ⛔ **JAMAIS OUVERT DANS UN NAVIGATEUR** — ni en local,
> ni sur Preview. **Le défaut `PROFILE-POST-MENU-01` reste donc OUVERT** : une
> vérification automatisée n'est pas une observation d'écran *(règle 15)*.
>
> ⛔ **Ce document ne reclasse RIEN.** **La fiche de défaut garde son classement
> `O` et sa priorité haute** jusqu'à la recette à l'écran, **à faire avec
> Kyria** (§8).
>
> **Ticket précédent** : **`MEDIA-MULTI-PHOTO-01`** — ⏸ **SUSPENDU le 31/10**,
> **ses observations et ses limites conservées**
> ([`MEDIA-MULTI-PHOTO-01-publier-plusieurs-photos.md`](MEDIA-MULTI-PHOTO-01-publier-plusieurs-photos.md)).
> **Un seul ticket actif** *(règle 15)*. Index :
> [`../TICKETS-INDEX.md`](../TICKETS-INDEX.md), **qui fait foi**.
>
> **Cette passation est autoportante** : elle suppose **zéro mémoire** des
> sessions précédentes.

---

## 1. Objectif et pourquoi ce ticket passe en premier

**Rendre une publication supprimable par son auteur, depuis l'interface, sur les
trois paliers** — **ce qui débloque le NETTOYAGE des publications de recette.**

**Le blocage qu'il lève** : **`MEDIA-MULTI-PHOTO-01` ne pouvait pas entrer en
phase d'écriture** — publier deux photos aurait créé **une publication que
l'interface ne savait pas retirer**. **Trois options avaient été posées**
(§4.5 de sa passation) : **A — nettoyage par l'API**, **B — publication de test
permanente**, **C — câbler « Supprimer » d'abord**. ▶️ **Kyria a retenu C**, qui
referme aussi le défaut de fond.

| | Question |
|---|---|
| **Q1** | **L'auteur a-t-il un chemin de suppression VISIBLE sur les trois paliers ?** |
| **Q2** | **Une confirmation est-elle exigée avant toute écriture ?** |
| **Q3** | **Après confirmation, la carte disparaît-elle — et APRÈS RECHARGEMENT ?** |
| **Q4** | **Un refus serveur est-il montré à l'utilisateur, en français, sans détail technique ?** |

---

## 2. Le défaut, tel qu'il était établi AVANT le correctif

**Acquis, et NON reclassé** : **preuve `E6`**, **Preview**, **Safari iPhone
réel** — **le menu « … » d'une publication du profil est resté SANS EFFET**, ce
qui a **bloqué le nettoyage des publications de recette**. **Le bilan le classe
`O`, priorité haute**, avec la réserve **« les autres chemins n'ont pas été
vérifiés »**.

**Ce que la LECTURE DE CODE du 31/10 avait ajouté** *(arbre `8d2d4c9f`)* :

| Surface | État avant correctif |
|---|---|
| **Carte du fil** | ⛔ menu **PAS RENDU** sur sa propre publication — `if (viewerIsAuthor) return null` ; **et il ne contenait que « Signaler »** |
| **Profil, carte de publication** | ⛔ bouton « Options » **`disabled` DANS LE CODE** |
| **Détail d'une publication** | ⛔ **aucune route de détail** dans `app/` |
| **Mur d'une tribu** | ✅ « Supprimer » câblé — ⛔ **mais ce n'est PAS le fil** |

> ⚠️ **ERREUR DE LECTURE CORRIGÉE, à consigner** *(règle 15 : une correction se
> consigne, elle ne s'efface pas)*. **La passation de `MEDIA-MULTI-PHOTO-01`
> citait DEUX contrôles `disabled` du profil** —
> `profile-mobile-post-card.tsx:34`-`42` **et**
> `profile-desktop-publications.tsx:139`-`146`. **Les deux lignes existaient
> bien**, **mais la PREMIÈRE n'est PAS une surface de production** :
> **`ProfileMobilePostCard` n'est monté QUE par un harnais E2E**
> (`e2e/harness/media02-surfaces-mount.tsx:100`), **et
> `ProfileMobilePostsFeed` n'est monté NULLE PART**. **Vérifié par recherche sur
> tout `frontend/apps`.**
>
> **Ce que cela change** : **le profil propriétaire monte la MÊME carte aux
> trois paliers** — **`ProfileDesktopPublications`**, via
> **`ProfileDesktopOwnerScreen`** *(desktop)* et **`ProfileCompactScreen`**
> *(mobile ET medium)*. **Il n'y avait donc pas deux contrôles morts à réparer,
> mais UN SEUL**, **partagé**. **Le correctif porte sur celui-là.**
> ⛔ **`profile-mobile-post-card.tsx` n'est PAS câblé** — **c'est du code mort,
> et le câbler aurait donné une fausse impression de couverture.**

---

## 3. Périmètre du correctif — **ce qui est câblé, et ce qui ne l'est pas**

### 3.1 Deux surfaces, qui couvrent les trois paliers

| Surface | Comment les trois paliers sont couverts | Chemin |
|---|---|---|
| **Carte du fil** (`/feed`) | ✅ **UN SEUL arbre DOM pour desktop, medium et mobile** — seules des media queries les séparent *(C3-FEED-RESPONSIVE-SHELL-R4)*. Un câblage unique sert les trois | menu « Plus d'actions » → **« Supprimer »** |
| **Publications du profil** (`/profile/me`) | ✅ **`ProfileDesktopPublications` est montée par les trois paliers** *(desktop : `ProfileDesktopOwnerScreen` · mobile et medium : `ProfileCompactScreen`)* | bouton **« Options »** → **« Supprimer »** |

### 3.2 Ce que le correctif NE fait PAS — **limites à connaître avant la recette**

- ⛔ **Profil PUBLIC d'autrui : rien ne change.** **Le même composant y est
  monté**, **mais sans le rappel de suppression** : **le bouton « Options » y
  reste `disabled`, exactement comme avant.** **La frontière est portée par
  l'appelant, et tenue par le serveur** — **`DELETE /posts/{id}` n'est ouvert
  qu'à l'auteur ou à un modérateur.**
- ⛔ **Aperçu du profil DESKTOP** *(onglet « Vue d'ensemble »)* : **cette liste
  est rendue en mode `compact`**, **une liste de liens SANS aucun contrôle
  d'options** — **avant comme après**. **Au desktop, la suppression vit dans
  l'onglet « Publications ».** **Au medium et au mobile, elle est dans les
  DEUX** *(aperçu et onglet)*, **parce que ces paliers rendent la carte
  complète**.
- ⛔ **Familles ÉVÉNEMENT, OFFRE et ORGANISATION : aucune suppression offerte.**
  **Une carte d'événement n'est pas une publication personnelle** : y poser un
  `DELETE /posts/{id}` retirerait la carte **en laissant l'entité source en
  place**. **Seule la famille CITOYENNE** *(texte, photo, vidéo)* **est
  concernée** — **c'est exactement la famille des publications de recette.**
- ⛔ **Mur d'une tribu, Discussions, harnais E2E : inchangés.** **Le rappel de
  suppression n'y est pas fourni**, **donc l'auteur n'y voit TOUJOURS aucun menu
  sur sa propre publication** — **comportement d'avant, préservé
  délibérément** : **un menu vide reproduirait le défaut sous une autre forme.**
- ⛔ **Application mobile Expo (`apps/mobile`) : HORS PÉRIMÈTRE.** **« desktop,
  medium, mobile » désigne les trois paliers du WEB**, **le vocabulaire de
  toute la recette PR202-WEB.**
- ⛔ **Aucune MODIFICATION de publication.** **`PATCH /posts/{id}` existe et
  reste non câblé.**
- ⛔ **Les MÉDIAS ORPHELINS** *(fichiers envoyés par un composer interrompu,
  qu'aucune publication ne porte)* **ne sont atteints par AUCUNE route** —
  **ni avant, ni après ce correctif.**

### 3.3 ⚠️ Portée de la suppression — **DOUCE, et à ne jamais écrire autrement**

**`DELETE /api/v1/posts/{id}` pose `is_active = False`** et répond **`204`**
(`post_service.soft_delete_post`). **Ce qui change réellement :**

| Fait | Statut |
|---|---|
| **la publication quitte le fil et le profil** | ✅ **lectures en `active_only`** |
| **`GET /posts/{id}` répond `404`** | ✅ **vérifié par un test backend existant** |
| **la LIGNE reste en base** | ⛔ **ce n'est PAS un effacement** |
| **les FICHIERS médias restent stockés** | ⛔ **aucune tâche de purge n'existe** |
| **l'AUTEUR garde l'accès à son fichier par URL directe** | ⛔ **le propriétaire court-circuite le contrôle d'accès** |
| **un TIERS n'obtiendrait plus le média** *(plus aucune publication active ne le porte)* | ⚠️ **PRÉDICTION DE CODE**, **NON VÉRIFIABLE ICI** — **il faudrait un SECOND COMPTE, et l'inscription est fermée** |

**Le libellé utilisateur respecte cette portée** : **« Elle disparaîtra du fil
et de votre profil. Vous ne pourrez pas la rétablir. »** — **vrai de
l'interface**, **et aucune promesse d'effacement de données ni de fichiers.**
**La portée technique est écrite dans le code**
(`frontend/packages/utils/src/publication-delete.ts`), **pas seulement ici.**

---

## 4. Architecture du correctif — **où vit quoi, et pourquoi**

### 4.1 Fichiers NOUVEAUX

| Fichier | Rôle |
|---|---|
| `frontend/packages/utils/src/publication-delete.ts` | **libellés FR** + **`humanizePublicationDeleteFailure`** + **la portée de la suppression douce, documentée à la source** |
| `frontend/packages/utils/src/publication-delete.test.ts` | **6 tests** du message d'erreur *(403, 404, 401, 500, réseau, non-fuite du détail serveur)* |
| `frontend/apps/web/hooks/use-publication-deletion.ts` | **machine à états** : `request` → `confirm` → succès/échec. **SANS provider** *(voir 4.3)*. **Verrou anti double-envoi.** |
| `frontend/apps/web/hooks/use-overflow-menu.ts` | **mécanique d'un menu** : ouverture, clic extérieur, Échap, retour du focus |
| `frontend/apps/web/components/feed/publication-delete-dialog.tsx` | **confirmation PARTAGÉE** par les deux surfaces — **un seul libellé, un seul comportement** |
| `frontend/apps/web/components/profile/profile-publication-options-menu.tsx` | **menu « Options »** d'une de ses publications, sur le profil |
| `frontend/apps/web/lib/feed/publication-delete-flow.test.tsx` | **17 tests de COMPORTEMENT** — composants réellement montés et cliqués *(dont 3 d'accessibilité : focus initial, cycle de tabulation, retour au déclencheur)* |
| `frontend/apps/web/lib/feed/publication-delete-wiring.test.ts` | **12 verrous d'ARCHITECTURE** — **chaîne de transmission** *(5 composants, prop optionnel partout : un oubli ne produit AUCUNE erreur de type)*, **ordre « API puis retrait »**, **couture sans provider**, **frontière propriétaire / public** |

### 4.2 Fichiers MODIFIÉS

| Fichier | Changement |
|---|---|
| `packages/utils/src/feed-api.ts` | **`deletePost(postId)`** → `DELETE /posts/{id}` |
| `packages/utils/src/yunicity-api.ts` | **`deleteFeedPost(postId)`** |
| `packages/utils/src/index.ts` | **exports** des libellés et du helper |
| `components/feed/feed-post-options-menu.tsx` | **branche PROPRIÉTAIRE** : le menu est rendu sur sa propre publication **si et seulement si** la suppression est câblée |
| `components/feed/feed-author-header.tsx`, `citizen-post-card.tsx` | **transmission** du rappel |
| `components/feed/feed-card.tsx` | **`onDeletePost`** + **état de suppression** + **confirmation montée** |
| `components/feed/desktop/feed-desktop-stream.tsx`, `feed-editorial-stream-region.tsx`, `feed-editorial-main-column.tsx` | **transmission** + **annonce « Publication supprimée. »** *(`role="status"`)* |
| `hooks/use-feed.ts` | **`deletePost`** : appel API **puis** retrait local — **jamais l'inverse** |
| `components/feed/portal/feed-data-controller.tsx` | **`handleDeletePost`** — **le contrôleur reste seul propriétaire du réseau du fil** |
| `hooks/use-profile-portal-context.ts` | **`deleteUserPost`** : appel API **puis** retrait de `feedPosts`, **la source dont `userPosts` est dérivé** |
| `components/profile/desktop/profile-desktop-publications.tsx` | **menu réel** à la place du bouton mort, **confirmation montée** |
| `components/profile/desktop/profile-desktop-owner-screen.tsx`, `profile-compact-screen.tsx`, `medium/profile-medium-overview.tsx` | **câblage des surfaces PROPRIÉTAIRES** *(les trois paliers)* |
| `backend/tests/test_feed.py` | **test d'AUTORISATION ajouté** *(voir 4.4)* — ✅ **EXÉCUTÉ sous Docker** *(§6.2)* |
| `e2e/functional/21-mobile-feed-functional.spec.ts` | ⚠️ **assertion MISE À JOUR** — **elle exigeait l'ABSENCE du menu sur sa propre publication** *(§6.4.a)* |
| `e2e/functional/33-unified-publication-card.spec.ts` | **commentaire clarifié** — **assertion INCHANGÉE et toujours verte** *(harnais sans câblage)* |

### 4.3 Trois décisions d'architecture, et leur raison

1. **Le réseau reste chez le propriétaire de la liste** — **comme `onReport`**.
   **Le contrôleur du fil et le contexte du profil appellent l'API et retirent
   la carte** ; **la carte, elle, DEMANDE.** **Conséquence voulue** :
   **`FeedCardDependencies` n'a pas bougé** — **son contrat est verrouillé à
   CINQ membres par `lib/feed/feed-card-seam.test.ts`**, **et le harnais E2E
   n'a pas eu à changer.**
2. **`usePublicationDeletion` n'appelle NI `useAuth` NI `useYunicityApi`** :
   **la fonction de suppression est injectée.** **Sans cela, la vue
   `FeedCardWithDependencies` ne serait plus montable hors de l'arbre de
   contexte** — **ce que le verrou ci-dessus interdit.**
3. **Le retrait local SUIT le `204`.** ⛔ **Pas de suppression optimiste** :
   **elle masquerait une carte qu'un `403` laisse en ligne**, **et l'écran
   mentirait jusqu'au rechargement.** **L'attente est portée par la
   confirmation, qui reste ouverte pendant l'appel.**

### 4.4 Sécurité — **la frontière n'est pas le rendu client**

**`DELETE /posts/{id}` n'est ouvert qu'à l'auteur ou à un modérateur**
(`_can_moderate_post` → `_is_author`). **Le rendu client ne fait que cacher
l'action.**

- ✅ **DÉJÀ couvert** *(test existant)* : **auteur `204`**, **modérateur
  `204`**, **`404` à la relecture**.
- ✅ **AJOUTÉ** : **`test_soft_delete_post_rejects_other_citizen`** — **un tiers
  reçoit `403`**, **et la publication SURVIT** *(`200` à la relecture par son
  auteur)*. **C'est la branche exacte sur laquelle repose le message d'erreur
  de l'interface.**
- ✅ **Aucun détail serveur n'atteint l'écran** : **le message est choisi par
  code d'erreur**, **et un test le vérifie explicitement.**

---

## 5. États d'interface — **les quatre, explicitement**

| État | Ce que l'écran montre |
|---|---|
| **idle** | **menu fermé** ; **« Supprimer » en rouge** dans la section **« Ma publication »** |
| **confirmation** | **modale** : **« Supprimer cette publication ? »** + portée + **« Annuler » / « Supprimer »**. **Focus initial sur « Annuler »** *(action non destructrice)*. **Échap et clic extérieur annulent.** |
| **envoi** | **« Suppression… »** ; **les DEUX boutons désactivés** ; **ni Échap ni clic extérieur ne ferment** — **l'appel est déjà parti** |
| **échec** | **message FR dans la modale** *(`role="alert"`)*, **modale MAINTENUE OUVERTE** : **réessayer ou annuler** |
| **tabulation** | **le focus CYCLE entre « Annuler » et « Supprimer »** — **`aria-modal` annonce une modale mais ne RETIENT PAS la tabulation**, **et une action destructrice ne doit pas rester ouverte derrière un focus parti ailleurs** |
| **succès** | **la carte disparaît** ; **au fil, « Publication supprimée. »** *(`role="status"`, 4 s)* ; **le focus revient au déclencheur** |

**Accessibilité** : **`role="dialog"` + `aria-modal`**, **titre et corps liés**,
**`aria-haspopup` / `aria-expanded` / `aria-controls` sur les déclencheurs**,
**cibles ≥ 44 px**, **anneau de focus visible**.

---

## 6. Vérifications EXÉCUTÉES — **et ce qu'elles ne prouvent pas**

> **Revue du diff complète** *(comportement, fichiers, mesures, limites,
> verdict)* :
> [`../../qa/PROFILE-POST-MENU-01-revue-correctif.md`](../../qa/PROFILE-POST-MENU-01-revue-correctif.md).

### 6.1 Contrôles sur l'état FINAL — **codes de sortie relevés**

| Vérification | Commande | Résultat |
|---|---|---|
| **Types — paquet partagé** | `pnpm --filter @yunicity/utils typecheck` | ✅ **code 0** |
| **Types — web** | `pnpm --filter web typecheck` | ✅ **code 0** — **couvre AUSSI les 44 specs `e2e/functional`** *(vérifié par `--listFilesOnly`)*. ⛔ **Compiler n'est PAS s'exécuter : le typecheck ne valide AUCUNE spec Playwright en navigateur** |
| **Lint web** | `pnpm --filter web lint` | ✅ **code 0**, **aucun avertissement nouveau** |
| **Tests du correctif + verrous d'architecture** | `npx vitest run lib/feed/publication-delete-{flow,wiring}.test.* lib/feed/feed-card-seam.test.ts lib/feed/feed-stream-architecture.test.ts` | ✅ **54 / 54** *(**21** comportement + **16** plomberie + 10 couture + 7 flux)* — **+8 depuis la correction de `C1`, `C2` et `C4`** |
| **Tests du correctif, utils** | `npx vitest run src/publication-delete.test.ts` | ✅ **6 / 6** |
| **Suite utils complète** | `pnpm --filter @yunicity/utils test` | ✅ **1251 / 1251** · ⚠️ **1 erreur d'infrastructure** *(même phénomène qu'au §6.3)* |
| **Suite web complète** — **état FINAL** | `npx vitest run --testTimeout=30000 --hookTimeout=30000 --maxWorkers=3` *(dans `frontend/apps/web`)* | ✅ **93 / 93 fichiers**, **956 / 956 tests**, **0 échec, 0 erreur**, **321 s**. ⚠️ **Les TROIS paramètres sont nécessaires sur ce poste** : **sans `--maxWorkers=3`, 8 workers ne démarrent pas** *(mesure `D₁` : 843 passés, 0 échec, 85/93 collectés)*. ⛔ **`vitest.config.ts` INTACT** — **le défaut du dépôt reste 5 s et un pool `forks` non borné**, **et c'est ce défaut que la CI applique** |
| **Ruff backend** | `python -m ruff check tests/test_feed.py` | ✅ **vert** |
| **Mypy backend** | `python -m mypy tests/test_feed.py` | ✅ **vert** |
| **Build Next web** — **état FINAL** | `pnpm --filter web build` | ✅ **code 0**, **toutes les routes compilées** · **artefact `next-env.d.ts` restauré après coup** |

### 6.2 ✅ Pytest backend — **EXÉCUTÉ SOUS DOCKER le 2026-10-31**

**Chemin officiel du dépôt** : **`sh scripts/qa-backend-pytest-host.sh`** —
**garde `app.qa.guard`**, **base JETABLE `yunicity_test_*` uniquement**,
**créée puis SUPPRIMÉE**, ⛔ **jamais `yunicity_qa`** *(baseline Playwright)*,
⛔ **jamais dev**, ⛔ **jamais prod**.

```
postgres QA (hôte) : 127.0.0.1:5455     redis QA : redis://127.0.0.1:6399/1
base jetable : yunicity_test_0367990d08e9  → créée, utilisée, SUPPRIMÉE
tests/test_feed.py  →  17 passed in 109.80s
```

| Test | Ce qu'il ÉTABLIT |
|---|---|
| ✅ **`test_soft_delete_post_rejects_other_citizen`** *(AJOUTÉ par ce ticket)* | **un tiers reçoit `403`**, **et la publication SURVIT** — **`200` à la relecture par son auteur**. **C'est la frontière de sécurité du bouton câblé** |
| ✅ **`test_soft_delete_post_author_and_moderator`** *(existant)* | **auteur `204`**, **modérateur `204`**, **`404` à la relecture** — **non régressé** |
| ✅ **les 15 autres tests du fichier** | **aucune régression** sur le fil, les commentaires, la visibilité |

⛔ **La pile Docker locale a été ARRÊTÉE après la mesure** — **rien ne tourne en
fond**, **et aucune donnée de recette n'a été touchée** *(base jetable isolée)*.

### 6.3 Échecs des suites complètes — **ÉTABLI contre SUPPOSÉ**

**Trois mesures, ordre contrôlé, même poste** :

| Run | Arbre | Délai | Fichiers | Tests | Échecs |
|---|---|---|---|---|---|
| **A** | **mon arbre** | **5 s** *(défaut)* | **63 collectés** | 556 | **3 fichiers, 4 tests** · **29 erreurs** |
| **B** | ✅ **LIGNE DE BASE `8d2d4c9f`**, **arbre git SÉPARÉ, SANS mes modifications** | **5 s** | **77 collectés** | 760 | **13 fichiers, 17 tests** · **14 erreurs** |
| **C** | **mon arbre** | **30 s** *(`--testTimeout=30000 --hookTimeout=30000`, **ligne de commande**)* | **93 / 93** | **948** | ✅ **AUCUN** |

**ÉTABLI — quatre faits mesurés** :

1. **Le mode d'échec n'est PAS une assertion** : **12 occurrences, sur A comme
   sur B, de `[vitest-pool]: Failed to start forks worker … Timeout waiting for
   worker to respond`**, et **ZÉRO `Test timed out`**.
2. **Le même mode d'échec existe SANS mes modifications** : **la ligne de base
   échoue PLUS** *(13 fichiers / 17 tests contre 3 / 4)*. ⛔ **Pas une
   régression de ce diff.**
3. **Les runs à 5 s n'ont pas COLLECTÉ toute la suite** *(63 et 77 sur 93)* :
   **les fichiers dont le worker n'a jamais démarré comptent en « errors »**,
   **pas en tests échoués**. ⚠️ **Lire « 931 / 933 » comme « 2 régressions »
   était une ERREUR DE LECTURE** — **une partie de la suite n'avait pas tourné.**
4. **Avec des paramètres adaptés, l'arbre de travail est INTÉGRALEMENT vert.**
   ⚠️ **Les runs `A`–`C` PRÉCÈDENT la correction de `C1`, `C2` et `C4`**
   *(948 tests alors)*. **État FINAL** : **`D₁`** *(délai relevé seul, pool par
   défaut)* **= 843 passés, 0 ÉCHEC, mais 8 workers non démarrés, 85/93
   collectés** ; **`D₂`** *(`+ --maxWorkers=3`)* **= 93/93 fichiers, 956/956
   tests, 0 erreur, 321 s**. ⚠️ **`--poolOptions.forks.maxForks=3` a été essayé
   et REJETÉ par vitest 4** *(option inexistante en CLI)* : **aucune mesure
   produite, consigné**.

**SUPPOSÉ, et volontairement non affirmé** : **la cause racine**
*(hypothèse : contention d'E/S Windows — pool `forks`, antivirus, Docker actif ;
`transform` cumulé jusqu'à 1774 s sur le run B)*. ⛔ **Non prouvée**, **et non
nécessaire** : les faits 1 et 2 suffisent. ⛔ **Inscrire le relèvement dans
`vitest.config.ts` est HORS PÉRIMÈTRE et N'A PAS ÉTÉ FAIT** — **le fichier est
INTACT**, **le relèvement n'a existé qu'en ligne de commande** : **décision de
Kyria**, **et la CI Ubuntu reste l'autorité** *(délai par défaut 5 s)*.

> ⛔ **À NE PAS ÉCRIRE** : « ce sont des flakes ». **Ce qui est établi, c'est le
> MODE d'échec, sa PRÉSENCE À HEAD, et la verdeur complète dès que le délai
> suffit. La CAUSE reste ouverte.**

### 6.4 ⚠️ Deux problèmes RÉELS trouvés en revue, corrigés — **consignés**

**a) Régression de SPÉCIFICATION, introduite par ce diff.**
**`e2e/functional/21-mobile-feed-functional.spec.ts`** exigeait
**`toHaveCount(0)`** sur le déclencheur du menu de **SA PROPRE publication**,
**en application RÉELLE** → **mon correctif le rend présent**, **l'assertion
serait ROUGE**. **L'intention** *(« on ne signale pas sa propre publication »)*
**n'est pas violée** — **le menu propriétaire ne contient AUCUN motif** —,
**c'est l'assertion qui était un mauvais proxy**, écrite quand **aucune action
propriétaire n'existait**. **Assertion portée sur le CONTENU du menu**,
⛔ **sans jamais cliquer « Supprimer »** *(la publication de support sert à
d'autres tests du fichier)*. **La spec 33 reste verte sans changement
d'assertion** : **elle tourne contre le HARNAIS**, **qui ne câble pas
`onDeletePost`** — **commentaire clarifié pour que les deux ne paraissent pas se
contredire.**
⛔ **CES DEUX SPECS N'ONT PAS ÉTÉ EXÉCUTÉES**, **et le restent** : **aucun
Playwright en CI**, **et elles exigent une application servie et une session
authentifiée**. **Elles COMPILENT, et c'est tout** — ⛔ **le typecheck ne les
valide PAS en navigateur**, **il ne dit rien de ce que Playwright observerait.**

**b) Ma vérification précédente était INCOMPLÈTE.**
**Le `typecheck web` annoncé vert en session 1 avait été lancé AVANT l'écriture
des fichiers de test : il ne les couvrait pas.** **Relancé après, il a trouvé
DEUX ERREURS RÉELLES** — **réduction à `never` d'un `let … | null` affecté dans
un constructeur de promesse** *(remplacé par le motif `differe<T>()` du dépôt)*
**et fixture `EventInterestToggleResponse` incomplète, masquée par un `as`**
*(fixture complétée, **`as` SUPPRIMÉ**)*.
> **Leçon, au-delà de ce ticket** : **un gate lancé avant l'écriture ne vaut pas
> pour le code écrit après. L'ORDRE des vérifications fait partie de la preuve.**

**Deux renforcements ajoutés dans la même passe** : **cycle de focus dans la
confirmation destructive** *(`aria-modal` ne retient pas la tabulation)* **+ 3
tests** ; **12 verrous statiques sur la PLOMBERIE** *(cinq composants de
transmission, prop optionnel partout : un oubli ne produit AUCUNE erreur de
type et ferait silencieusement revenir le défaut)*.

> ⛔ **AUCUNE de ces vérifications n'est une preuve d'écran.** **Rien n'a été
> ouvert dans un navigateur** — **ni en local, ni sur Preview.** **Le critère de
> sortie du ticket est au §8**, **et il est VISUEL.**

---

## 6 bis. Préparation du commit et du déploiement — **état au 2026-10-31**

**Document** :
[`../../ops/PROFILE-POST-MENU-01-commit-et-deploiement-preview.md`](../../ops/PROFILE-POST-MENU-01-commit-et-deploiement-preview.md)
— ⛔ **rien n'est exécuté** : **aucun commit, aucune poussée, aucun
déploiement**.

### 6 bis.a ✅ Confirmé AUPRÈS DE RAILWAY — **lecture seule, 2026-10-31**

| Fait | Valeur confirmée |
|---|---|
| **projet / service** | **`dazzling-wisdom`** · **`yunicity.review`** · environnement **`production`** |
| **dépôt source** | **`Kyria-Zaire/yunicity.review`** — **l'`origin` de cet arbre** : **pousser sur `origin` alimente bien le service** |
| **branche suivie** | **`feat/c3-videos-refonte-final`** — **déclencheur GitHub ACTIF** : **le déploiement automatique sur poussée EXISTE** |
| **domaine de recette** | **`preview.yunicity.city`** |
| **⚠️ `checkSuites: false`** | **Railway N'ATTEND PAS LA CI** : **la poussée déploie immédiatement, CI rouge ou absente.** **L'ordre CI → déploiement repose sur la DISCIPLINE** |
| **⚠️ DEUX services** | **`yunicity.review`** *(web)* **et `unified-media-preview`** *(`python -m app.runtime.unified_process`)* **suivent la MÊME branche** : **la poussée les redéploie TOUS LES DEUX**. ⛔ **Ne pas pousser pendant une session de recette** |
| **retour arrière** | **`canRedeploy: true`** — **le redéploiement du précédent est DISPONIBLE** |

> ## ✅ RÉSERVE LEVÉE — **le SHA de la Preview n'est plus « attribué par continuité »**
>
> **Les passations portaient depuis le 27/10 la réserve : « SHA Preview
> `bf008a87`, attribué par CONTINUITÉ, NON RELU ».** **Railway le confirme
> désormais directement** : **`latestDeployment.meta.commitHash` =
> `bf008a87593d980900ee228801184d620722d8b7`**, **branche
> `feat/c3-videos-refonte-final`**, **statut `SUCCESS`**, **déploiement du
> `2026-10-19T16:46:04Z`** — **et ce SHA est EXACTEMENT le sommet de
> `origin/feat/c3-videos-refonte-final`**.
>
> **L'attribution par continuité était donc CORRECTE.** ✅ **La réserve se lève
> sur PREUVE** *(requête `railway status --json`, lecture seule)*, **et non par
> report.** ⛔ **Elle ne s'effaçait pas sans cette preuve** — **elle est levée,
> et le moyen de la relire est consigné** *(§7 du document d'ops)*.

### 6 bis.b ⚠️ Limite ASSUMÉE — **les documents MIXTES restent hors des commits**

**Quatre documents mêlent le travail de sessions antérieures et celui de ce
ticket**, **et ne se séparent donc pas par chemin** :

| Document | Antérieur | Ajout de ce ticket |
|---|---|---|
| `docs/workflow/TICKETS-INDEX.md` | **état de tous les tickets** | **section « Ticket actif »**, **lignes du correctif et de la fiche de défaut**, **correction de la trace `M1`–`M2`** |
| `docs/qa/PR202-WEB-bilan-consolide.md` | **registre de preuves** | **une cellule de la fiche `PROFILE-POST-MENU-01`** |
| `docs/qa/COUVERTURE-FONCTIONNELLE-01.md` *(non suivi)* | **créé en session antérieure** | **deux lignes** |
| `docs/workflow/passations/MEDIA-MULTI-PHOTO-01-…md` *(non suivi)* | **créé en session antérieure** | **suspension + correction `M1`–`M2`** |

**Décision retenue : les LAISSER HORS des deux commits de ce ticket.**
**Les commiter emporterait la documentation d'autres tickets**
*(`FAVORITES-SAVE-01`, `SOCIAL-COMMENT-01`, `SEARCH-RELEVANCE-01`,
`MEDIA-MULTI-PHOTO-01`…)*, **dont la mise au propre n'est pas l'objet ici.**

> ⛔ **CE QUE CETTE LIMITE COÛTE, et qui doit rester écrit ici** :
> **dans l'arbre COMMITÉ, l'index n'annoncera PAS ce ticket** — **la seule
> source qui « fait foi » reste donc l'arbre de travail** —, **et les liens de
> cette passation vers `MEDIA-MULTI-PHOTO-01-…md` et
> `COUVERTURE-FONCTIONNELLE-01.md` pointeront vers des fichiers NON SUIVIS**,
> **exactement comme une trentaine d'autres documents déjà dans cet état.**
> **La mise au propre documentaire est une DÉCISION SÉPARÉE, à prendre par
> Kyria** — ⛔ **et tant qu'elle n'est pas prise, cette limite ne doit pas être
> effacée de cette passation.**

### 6 bis.c Ordre imposé — **CI, PUIS déploiement**

**ORDRE RETENU par Kyria le 31/10** :

**Commit** → **poussée de la branche de TRAVAIL** *(ne déploie rien)* →
**PR vers `main`** → 🛑 **CI VERTE** *(`frontend-ci` ET `backend-ci`)* →
**poussée vers `feat/c3-videos-refonte-final`** → **DÉPLOIEMENT DES DEUX
SERVICES PREVIEW** *(`yunicity.review` ET `unified-media-preview` — ils suivent
la même branche, §6 bis.a)* → **relevé du SHA réellement servi** → **RECETTE**
*(desktop, medium, Safari iPhone réel)*.

⚠️ **Les deux services se déploient sur la même poussée** : **attendre qu'ils
soient TOUS LES DEUX en `SUCCESS` avant de commencer la recette** — **le second
porte l'API**.

⛔ **`docker-ci` SEUL NE SUFFIT PAS** : **il couvre `pytest` sur base jetable**,
**et RIEN du frontend** — **ni lint, ni typecheck, ni les 948 tests, ni le build
Next**. **Or le correctif est à l'écrasante majorité frontend** : **seul
`frontend-ci` éprouve ce qui part réellement sur la Preview.**

---

## 7. Écritures — **ce que le correctif rend possible, et ce qu'il a écrit**

| Moment | Écriture |
|---|---|
| **session du 31/10** | ✅ **AUCUNE** — **aucune publication créée, aucune supprimée**, **aucun commit, aucun déploiement** |
| **recette à venir** | ✍️ **UN `DELETE` par publication confirmée** — **et rien d'autre** |

> ⛔ **CONSIGNE DE KYRIA, À TENIR** : **ne supprimer AUCUNE publication
> préexistante sans autorisation.** **La recette (§8) ne porte que sur une
> publication de test créée pour elle**, ⚠️ **et créer cette publication est
> une ÉCRITURE qui reste à autoriser.**

---

## 8. Recette à l'écran — **à jouer AVEC Kyria, sur les trois paliers**

**Palier par palier. Une manipulation à la fois.** **Texte imposé pour la
publication de test : `Recette suppression — à supprimer.`**

| # | Manipulation | À relever |
|---|---|---|
| **R0** | ⚠️ **Créer UNE publication de test** *(écriture — à autoriser)* | **elle apparaît dans le fil ?** |
| **R1** | **Fil, DESKTOP** : ouvrir le menu « … » de SA publication | 🛑 **le menu s'ouvre-t-il ?** · **contient-il « Supprimer » ?** |
| **R2** | **Cliquer « Supprimer »** | 🛑 **la confirmation s'ouvre-t-elle ?** · ⛔ **rien ne doit disparaître encore** |
| **R3** | **« Annuler »**, puis **Échap** à la seconde ouverture | **la publication est-elle TOUJOURS là ?** |
| **R4** | **Confirmer** | 🛑 **la carte disparaît-elle ?** · **un message apparaît-il ?** |
| **R5** | **Recharger** *(`Ctrl + R`)* | 🛑 **la carte est-elle TOUJOURS absente ?** — **c'est LE contrôle qui prouve** |
| **R6** | **Profil `/profile/me`, onglet « Publications », DESKTOP** | **le bouton « Options » répond-il ?** · **« Supprimer » y est-il ?** |
| **R7** | **Rejouer `R1`–`R6` au MEDIUM** *(fenêtre 640–1023 px)* | **mêmes relevés** · **l'aperçu du profil porte-t-il aussi le menu ?** |
| **R8** | **Rejouer `R1`–`R6` au MOBILE** — ⚠️ **et sur SAFARI iPHONE RÉEL** | 🛑 **c'est là que `E6` a observé le défaut** : **sans ce palier, le défaut ne peut pas être refermé** |
| **R9** | **Profil PUBLIC d'un autre citoyen** | ✅ **aucun « Supprimer » ne doit apparaître** |

**Critère de sortie** : **`R5` ET `R8`** — **la disparition CONFIRMÉE APRÈS
RECHARGEMENT**, **et le chemin EFFECTIF sur Safari iPhone réel.**
⛔ **Le critère n'est PAS « le bouton existe ».**

---

## 9. État, inconnues et prochaine action

| | |
|---|---|
| **État** | ▶️ **correctif IMPLÉMENTÉ dans l'arbre de travail** · ⛔ **NON PROUVÉ À L'ÉCRAN** · ⛔ **défaut TOUJOURS OUVERT** |
| **État Git** | **branche `fix/mobile-publishing-p0`**, **base `8d2d4c9f`** · **20 fichiers de code modifiés** *(17 sources web et paquets · 2 specs Playwright · 1 test backend)* **et 8 nouveaux** · **6 documents** *(index, 2 passations, bilan, couverture, revue)* · ⛔ **aucun commit**, ⛔ **aucun déploiement** · ✅ **les modifications ANTÉRIEURES du dépôt sont préservées** *(aucun `stash`, aucun `reset` ; l'artefact de build `next-env.d.ts` a été restauré après chaque build)* |
| **Preuve acquise** | ⛔ **AUCUNE preuve d'écran.** ✅ **UNE preuve d'EXÉCUTION réelle, côté serveur** : **`tests/test_feed.py` — 17 passed**, **sous Docker**, **base jetable `yunicity_test_0367990d08e9` créée puis supprimée** *(§6.2)* — **dont le `403` opposé à un tiers et la SURVIE de la publication**. **Le reste est types, lint, tests unitaires et build** *(§6.1)* |
| **SHA Preview** | ⛔ **sans objet** — **rien n'est déployé** |
| **Erreurs corrigées et CONSIGNÉES** | **1.** **`profile-mobile-post-card.tsx` n'est PAS une surface de production** *(§2)* · **2.** **une régression de SPÉCIFICATION introduite par ce diff** *(spec Playwright 21)*, **trouvée en revue et corrigée** *(§6.4.a)* · **3.** **ma vérification de session 1 était INCOMPLÈTE** — **le typecheck web ne couvrait pas les fichiers de test écrits après lui**, **et il a révélé DEUX erreurs réelles une fois relancé** *(§6.4.b)* · **4.** **la trace `M1`–`M2` de `MEDIA-MULTI-PHOTO-01`** — **« jamais joués » était FAUX**, **corrigé dans sa passation et dans l'index** |
| **Inconnues** | **tout le §8** · **le rendu réel du menu sur Safari iPhone** · **le `404` opposé aux TIERS sur les médias** *(second compte impossible : inscription fermée)* · **le comportement réel des specs Playwright 21 et 33** *(modifiées, typechecke, NON EXÉCUTÉES)* · **la cause racine de l'instabilité du pool de workers** *(§6.3 — supposée, non établie)* |
| **Constats de la dernière revue** | **5 constats, aucun bloquant, aucune donnée en risque** — détail et fichiers au §4.5 de la [revue](../../qa/PROFILE-POST-MENU-01-revue-correctif.md). ✅ **`C1`, `C2` et `C4` CORRIGÉS le 31/10** *(§4.6 de la revue)* : **annonce `role="status"` ajoutée au PROFIL avec le MÊME libellé que le fil**, **focus déplacé sur un ancrage STABLE des DEUX côtés** *(titre « Publications » au profil, région du flux au fil ; `tabIndex={-1}`, ordre de tabulation inchangé)*, **et `aria-describedby` de la modale CONCATÈNE désormais portée + erreur**. **Couverture : 4 tests de comportement et 4 verrous statiques ajoutés.** ⏸ **`C3`** *(minuterie de `deleteMessage` non annulée — `feed-data-controller.tsx`)* **et `C5`** *(état d'attente peu annoncé — `publication-delete-dialog.tsx`)* **restent DOCUMENTÉS et ACCEPTÉS pour cette livraison**, **décision de Kyria** : ⛔ **ils ne doivent pas disparaître d'ici** |
| **Autorisation — conclusion BORNÉE** | ⛔ **Le masquage du contrôle côté interface n'exclut PAS une IDOR** : **il empêche un parcours accidentel, pas un appel forgé sur `DELETE /posts/{id}`** *(console, client HTTP, script)*. **Son rôle est ERGONOMIQUE** — **ne pas proposer une action que le serveur refusera.** ✅ **La protection repose sur le CONTRÔLE SERVEUR** — **`_can_moderate_post` → `_is_author`** —, **ÉPROUVÉ par un test EXÉCUTÉ** : **`test_soft_delete_post_rejects_other_citizen`**, **`403` au tiers et publication CONSERVÉE** *(§6.2)*. ⚠️ **Une rédaction antérieure écrivait « aucune surface d'IDOR » : conclusion TROP LARGE, corrigée et consignée** |
| **Vérifié CONFORME en revue** | **prédicat d'AFFICHAGE identique sur les deux surfaces et dérivé de l'identité SERVEUR** *(`filterProfileUserFeedPosts` filtre sur `profile.user_id`)* — **le parcours nominal n'envoie que des identifiants renvoyés par le serveur** · **confirmation** *(rien d'écrit avant `confirm`, verrou anti double-envoi)* · **erreurs** *(4 cas, aucun détail serveur, modale maintenue, aucun `catch` silencieux)* · **retrait après succès** *(jamais avant le `204` ; fil via `items` → `displayedPosts` → flux ; profil via `feedPosts`, la SOURCE, donc les trois paliers et les statistiques suivent)* |
| **Dette signalée** | **`FeedPostOptionsMenu` porte sa propre mécanique de menu**, **que `useOverflowMenu` duplique désormais** — **`TODO(debt)` posé dans le hook** : **son alignement est un REFACTOR à part**, **le déclencheur du fil étant sous contrat E2E** *(règle 11 : un refactor par PR)* |
| **Prochaine action** | **1.** **lire la REVUE DU DIFF** — [`../../qa/PROFILE-POST-MENU-01-revue-correctif.md`](../../qa/PROFILE-POST-MENU-01-revue-correctif.md) *(verdict proposé : **REQUEST CHANGES — non bloquant sur le code, bloquant sur la PREUVE**)* · **1 bis.** **suivre la PRÉPARATION de commit et de déploiement Preview** — [`../../ops/PROFILE-POST-MENU-01-commit-et-deploiement-preview.md`](../../ops/PROFILE-POST-MENU-01-commit-et-deploiement-preview.md) *(listes exactes, séparation des modifications antérieures, commandes, retour arrière)* · ⚠️ **la Preview suit `feat/c3-videos-refonte-final`, PAS `fix/mobile-publishing-p0`** : **commiter sur ma branche ne déploie RIEN** · **2.** **DÉCISION DE KYRIA** : **autoriser `R0`** *(créer UNE publication de test — c'est une écriture)* · **3.** **jouer `R1`–`R9` ENSEMBLE**, ⚠️ **dont SAFARI iPHONE RÉEL** · **4.** **seulement ensuite** : **classement du défaut**, **commit**, **déploiement** |

---

## 10. Ce que ce ticket ne referme PAS

- ⛔ **`MEDIA-MULTI-PHOTO-01`** — ⏸ **SUSPENDU**. **Le correctif lève son
  blocage de NETTOYAGE**, **mais seulement quand la suppression sera PROUVÉE à
  l'écran** : **tant que `R5` n'est pas observé, publier reste créer un contenu
  qu'on ne sait pas retirer.**
- ⛔ **`SOCIAL-COMMENT-01`** — ⏸ **SUSPENDU**, **`M5` reste dû**. **Sans
  rapport : les commentaires ont leur propre chemin de suppression, déjà
  câblé.**
- ⛔ **`MEDIA-RESPONSIVE-CI-01`** — **sujet d'OUTILLAGE**, **nommé dans
  `8f98c219`**, **inexistant dans le dépôt**. **Son ouverture est une décision
  de Kyria.**
- ⛔ **La MODIFICATION d'une publication** — **non demandée, non câblée.**
