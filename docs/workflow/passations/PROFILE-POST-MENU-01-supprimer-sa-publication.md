# Passation — PROFILE-POST-MENU-01 · Supprimer sa propre publication · desktop + medium + mobile

> ## ✅ TICKET CLOS le 2026-11-02 — **sur validation de la recette par Kyria**
>
> **« Je valide la recette de `PROFILE-POST-MENU-01` réalisée avec ChatGPT.
> Consigne les résultats et les limites connues, puis clos le ticket. Aucun
> test supplémentaire, aucune suppression supplémentaire. »** — **Kyria,
> 2026-11-02.**
>
> **Ce qui est ACQUIS** : **le correctif est écrit, commité** *(`fcc63538`)*,
> **déployé sur Preview le 2026-11-01** *(SHA `2ebdbe96`, bascule confirmée au
> bord)*, **et VÉRIFIÉ À L'ÉCRAN le 2026-11-02** — **critère de sortie `R5` ET
> `R8` ATTEINT**, **y compris sur SAFARI iPHONE RÉEL**, **le palier où `E6`
> avait relevé le défaut** *(§8 bis)*.
>
> ⚠️ **CE QUE LA CLÔTURE NE DIT PAS** — **à lire avant toute reprise** :
>
> | ⛔ | Fait |
> |---|---|
> | **le correctif n'est PAS dans `main`** | **il vit sur `fix/mobile-publishing-p0` et sur la branche Preview.** **La PR 203 reste un BROUILLON**, **et AUCUN accord de fusion n'a été donné** |
> | **`R9` n'a PAS été joué** | **le profil public d'un tiers n'a pas été ouvert** — **la frontière y est tenue par le CODE** *(verrou statique 11 : six composants publics, zéro câblage)*, **pas par l'écran** |
> | **la suppression réelle au profil sur palier LARGE n'a PAS été jouée** | **confirmation et annulation vérifiées au desktop et au medium 768 px** ; **le RENDU du succès y reste non vu** *(§8 bis.b)* |
> | **les specs Playwright 21 et 33 ne sont PAS exécutées** | **aucun workflow ne les lance** — **la recette manuelle ne protège pas d'une régression FUTURE** |
> | **`C3` et `C5` restent OUVERTS** | **constats ACCEPTÉS, non corrigés** *(décision de Kyria)* — [revue §4.5](../../qa/PROFILE-POST-MENU-01-revue-correctif.md) |
> | **`Dependency audit` reste ROUGE** | **préexistant, prouvé étranger à ce diff** *(§6 ter.a)* — **réserve du dépôt, pas de ce ticket** |
>
> ✅ **CE QUE LA CLÔTURE DÉBLOQUE** : **un chemin de suppression EXISTE
> désormais à l'écran, sur les trois paliers.** **C'était le blocage du
> NETTOYAGE qui interdisait la phase d'ÉCRITURE de
> `MEDIA-MULTI-PHOTO-01`** *(son §4.5, option C)*. ⚠️ **Mais sur Preview
> seulement** — ⛔ **pas sur `main`**, **et la suppression reste DOUCE**.
>
> ⛔ **La suppression est DOUCE** : **la ligne reste en base**, **les fichiers
> restent stockés**, **l'auteur garde l'accès par URL directe.** ⛔ **Ne jamais
> l'écrire comme un effacement** — **y compris après clôture.**
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

### 6 bis.d ✅ LIGNE DE BASE AVANT POUSSÉE — **relevée le 2026-11-01, lecture seule**

**Relevé par `railway status --json`** *(aucune écriture)*. **C'est l'état À
COMPARER après déploiement** — **sans ce relevé, un redéploiement « réussi »
ne se distingue pas d'un service resté sur l'ancien build.**

| Service | Déploiement actif | SHA servi | Statut | Instances |
|---|---|---|---|---|
| **`yunicity.review`** *(web, `preview.yunicity.city`)* | **`14c4094a-adf6-404d-bfa7-f28097338dd7`** *(2026-10-19T16:46:04Z)* | **`bf008a87`** | `SUCCESS` | `RUNNING` |
| **`unified-media-preview`** *(API, `api-preview.yunicity.city`)* | **`53c0b1eb-9682-4888-8a6a-ef79ffa0d022`** *(2026-10-22T16:21:46Z)* | **`bf008a87`** | `SUCCESS` | `RUNNING` |
| `postgis-preview` · `redis-preview` | *(sans source Git)* | — | `SUCCESS` | `RUNNING` |

**Écart de dates examiné, puis écarté** : **le web est déployé le 19/10 et
l'API le 22/10, pour un MÊME SHA.** **Vérification** : **`bf008a87` est
commité le `2026-10-19T16:46:18+02:00`, soit `14:46:18Z`** — **DEUX HEURES
AVANT le déploiement web de `16:46:04Z`.** ✅ **L'ordre est cohérent** : **le
web a bien été construit depuis ce commit** ; **la date du 22/10 de l'API est
un déploiement postérieur du même SHA.** ⚠️ **Ce qui reste NON vérifié** :
**pourquoi l'API a été redéployée le 22/10** — **hors périmètre de ce
ticket.**

**Ce que la poussée vers la branche Preview emporterait** — **vérifié sur
l'intervalle `bf008a87..2ebdbe96`** :

| Fait | Valeur vérifiée |
|---|---|
| **nature de la poussée** | ✅ **FAST-FORWARD** — **`git merge-base --is-ancestor bf008a87 2ebdbe96` réussit** : **AUCUN `--force`**, **aucune réécriture d'historique** |
| **commits emportés** | **7** — **mes 2** *(`fcc63538`, `2ebdbe96`)* **et les 5 antérieurs** *(`8d2d4c9f`, `d70d6290`, `07236fb0`, `e07e809c`, `0b8b70dd`)* |
| **fichiers applicatifs** | **28** — **EXACTEMENT ceux de `fcc63538`** : **les 5 commits antérieurs ne touchent AUCUN fichier sous `frontend/` ni `backend/`** *(vérifié une seconde fois sur cet intervalle, et non reporté)* |
| **fichiers non applicatifs** | **14** — **documents, `CLAUDE.md`, règles 15, `scripts/lint-agent-rules.py`** : **aucun n'est lu à l'exécution par l'application** |
| **retour arrière PRÉFÉRÉ** | **redéploiement des deux déploiements ci-dessus par leur ID** *(`canRedeploy: true`)* — **sans reconstruction, sans toucher à l'historique Git** |
| **retour arrière Git** | ⚠️ **exigerait `--force`** *(revenir de `2ebdbe96` à `bf008a87` n'est pas un fast-forward)* — **à n'employer qu'après le redéploiement, jamais à la place** |

## 6 ter. CI de la PR 203 — **résultats et analyse**

**PR brouillon** : **https://github.com/Kyria-Zaire/yunicity.review/pull/203**
→ **`main`**. **Huit contrôles déclenchés.**

**CI TERMINÉE le 2026-10-31.** **Sept contrôles VERTS, un seul rouge** — **le
rouge préexistant et prouvé indépendant** *(§6 ter.a)*.

| Contrôle | Workflow | Résultat |
|---|---|---|
| **`lint · typecheck · build`** | `frontend-ci.yml` | ✅ **PASS** *(4 min 53 s)* — **il éprouve la CONSTRUCTION du code réellement déployé** — ⚠️ **pas son comportement à l'écran** |
| **`ruff · mypy · pytest`** | `backend-ci.yml` | ✅ **PASS** *(2 min 34 s)* |
| **`compose · health · pytest (disposable db)`** | `docker-ci.yml` | ✅ **PASS** *(18 min 18 s)* — **`2013 passed, 19 skipped`** |
| **`lint-agent-rules`** | `lint-agent-rules.yml` | ✅ **PASS** *(5 s)* |
| **`Forbidden paths & artifacts`** | `pr-checks.yml` | ✅ **PASS** *(10 s)* |
| **`Gitleaks`** | `pr-checks.yml` | ✅ **PASS** *(12 s)* |
| **`CodeRabbit`** | — | ✅ **PASS** *(revue sautée)* |
| **`Dependency audit`** | `pr-checks.yml` | ❌ **FAIL** *(26 s)* — **PRÉEXISTANT, analysé et PROUVÉ étranger à ce diff** *(§6 ter.a)* |

> ## ✅ LE TEST D'AUTORISATION A TOURNÉ EN CI — **déduction SERRÉE, non lecture du nom**
>
> ⚠️ **Formulation CORRIGÉE le 2026-11-01, sur remarque de Kyria** : **la
> version précédente de ce bloc écrivait « le `+1` est EXACTEMENT
> `test_soft_delete_post_rejects_other_citizen` ».** **C'était une déduction
> présentée comme une lecture.** **L'erreur de classement se consigne, elle ne
> s'efface pas** *(règle 15)*.
>
> **CE QUI EST LU** — **deux compteurs** : **`docker-ci` rend `2013 passed, 19
> skipped` à `2ebdbe96`** ; **`e07e809c` consignait `2012 passed, 19 skipped`
> à `bf008a87`.** **Soit `+1` passé et `0` ignoré en plus.**
>
> **CE QUI EST LU DANS LE DIFF** : **`git show fcc63538 -- backend/` n'ajoute
> QU'UNE SEULE fonction de test** — **`async def
> test_soft_delete_post_rejects_other_citizen`**, **`backend/tests/test_feed.py`,
> `+34` lignes, AUCUNE autre `def test_`** —, **ne touche AUCUNE source
> backend** *(un seul fichier backend au commit)*, **et les cinq autres
> fichiers de test du commit sont frontend** *(vitest, Playwright)*, **que
> `pytest` ne collecte pas.**
>
> ⚠️ **CE QUI N'EST PAS LU** : **le journal `docker-ci` ne NOMME aucun test**
> — **sa sortie n'est pas verbeuse.** **L'identification du `+1` est donc une
> DÉDUCTION, serrée mais INDIRECTE**, **et non l'observation du nom dans le
> journal.** **Le compteur seul ne dirait PAS quel test a tourné** ; **ce qui
> ferme l'alternative, c'est sa conjonction avec un diff qui n'ajoute qu'un
> test collecté par `pytest`, aucune source backend, et laisse les ignorés à
> l'identique.**
>
> ✅ **L'exécution NOMMÉE existe — mais SUR CE POSTE** : **Docker, base
> jetable, `test_soft_delete_post_rejects_other_citizen PASSED`** *(§6)*. **La
> CI apporte la base jetable neutre** ; **ce poste apporte le nom.** **Aucune
> des deux, seule, ne porte les deux.**
>
> ⚠️ **Ce que la CI ne couvre toujours PAS** : **la suite Playwright des 44
> specs** — **aucun workflow ne la lance** *(lacune consignée dans
> `e07e809c`)*. **Les deux specs modifiées par ce ticket restent donc NON
> EXÉCUTÉES**, **et le typecheck qui les compile ne les valide pas en
> navigateur.**
>
> ⚠️ **Et ce que le contrôle frontend ne prouve PAS** : **`lint · typecheck ·
> build` éprouve que le code COMPILE et SE CONSTRUIT** — **pas qu'il se
> COMPORTE correctement à l'écran.** **Le comportement n'est éprouvé que par
> les 54 tests de comportement montés en jsdom** *(§6)* **et, in fine, par la
> recette à l'écran sur les trois paliers** *(§8)*.

### 6 ter.a ❌ `Dependency audit` — **ÉCHEC PRÉEXISTANT, ÉTABLI, étranger à ce diff**

**Ce qui échoue exactement** : **l'étape `osv-scanner (frontend, gate on
High/Critical)`**, **qui scanne `frontend/pnpm-lock.yaml`**. ✅ **L'étape
`pip-audit (backend)` du même contrôle est VERTE** — **« No known
vulnerabilities found »**.

**Paquets signalés** *(tous TRANSITIFS)* : **`node-forge@1.4.0`**
*(GHSA-jc66-7q78-782g, CVSS 7.5)* · **`undici@6.28.1`, `7.29.1`, `8.10.2`**
*(GHSA-2m5v-pch6-74hx, -qrxm-fqhp-jwvm, -xjj6-f33q-929c, -4w7w-5xrc-9h26 ;
CVSS 7.4–7.5)* · **`vite@7.3.5`** *(GHSA-587h-7wmj-h5pm, CVSS 7.5)*.

**PREUVE que ce diff n'en est pas la cause** — **et non une inférence** :

```bash
git diff --name-only bf008a87..HEAD -- frontend/pnpm-lock.yaml        # 0
git diff --name-only bf008a87..HEAD -- frontend/osv-scanner.toml      # 0
git diff --name-only bf008a87..HEAD -- package.json frontend/package.json                                        frontend/apps/web/package.json  # 0
git show fcc63538 | grep -cE "node-forge|undici|vite@|pnpm-lock"      # 0
```

**L'ENTRÉE de l'audit est donc BYTE-POUR-BYTE identique à celle de
`bf008a87`** — **le SHA actuellement servi par la Preview** —, **et le commit
de code ne mentionne aucun des paquets signalés.** **Même entrée, même
verdict.**

✅ **Et cet échec était DÉJÀ CONSIGNÉ** : **le commit `e07e809c`**, **qui porte
la CI de `bf008a87`**, **écrit noir sur blanc** — **« cinq contrôles verts, un
échec connu »** et **« audit des dépendances rouge, mitigation de l'image
d'exécution sans remédiation de l'arbre »**.

> ⛔ **Ce que cela ne veut PAS dire** : **que l'échec est sans importance.**
> **C'est une RÉSERVE OUVERTE du dépôt** — **la remédiation de l'arbre de
> dépendances n'a pas été faite**, **seule l'image d'exécution a été mitigée**.
> ⛔ **Elle ne relève PAS de ce ticket**, **et ce ticket ne la referme pas.**
>
> ⚠️ **Conséquence sur la règle « CI verte avant déploiement »** : **la CI de
> cette PR ne peut PAS être « toute verte » tant que cette réserve est
> ouverte.** **Le critère applicable est donc** : ✅ **`frontend-ci` ET
> `backend-ci` ET `docker-ci` vertes**, **et `Dependency audit` rouge au MÊME
> titre et pour les MÊMES paquets qu'à `bf008a87`** — **ce qui est désormais
> prouvé.** ⛔ **Toute AUTRE couleur rouge est bloquante et demande une analyse
> avant toute suite.**

---

## 6 quater. Déploiement Preview — **EXÉCUTÉ le 2026-11-01**, sur autorisation

**Autorisation de Kyria** : **« Oui, j'autorise la poussée de `2ebdbe96` vers
`feat/c3-videos-refonte-final` et le redéploiement des deux services Preview.
J'accepte pour cette étape la réserve documentée sur l'audit des dépendances.
Aucun `--force`, aucune fusion vers `main`, aucune création ni suppression de
publication. »**

⚠️ **Ce déploiement N'A PAS eu lieu sur une CI verte** : **`PR Safety Checks`
reste ROUGE** *(§6 ter.a)*. **Il a lieu sous RÉSERVE EXPLICITEMENT ACCEPTÉE.**
**La formulation est de Kyria et elle est juste** — **une rédaction antérieure
de ma part parlait de « critère atteint », ce qui était un JUGEMENT présenté
comme un ÉTAT.**

### 6 quater.a La poussée — **fast-forward, sans `--force`**

```bash
git push origin 2ebdbe96:refs/heads/feat/c3-videos-refonte-final
#   bf008a87..2ebdbe96  2ebdbe96 -> feat/c3-videos-refonte-final
```

✅ **La sortie ne porte PAS de `+`** — **aucune mise à jour forcée, aucun
historique réécrit.** ✅ **Sommet distant relu après coup** :
**`2ebdbe96f84dfe303f15009bb63a20267339429d`**.

⚠️ **Aucun workflow CI ne s'est déclenché sur cette poussée** — **les workflows
ne réagissent qu'aux `pull_request` et aux poussées sur `main`** *(plus
`develop` pour `lint-agent-rules`)*. **La CI de ce code reste celle de la PR
203** *(§6 ter)*.

### 6 quater.b Les deux services — **`SUCCESS` sur `2ebdbe96`**

| Service | Déploiement actif | SHA actif | Empreinte d'image | Instances |
|---|---|---|---|---|
| **`yunicity.review`** *(web)* | **`66baa70a-7a01-4f61-b86c-ea236bd108d0`** | **`2ebdbe96`** | `sha256:3f54ac0c4238…` | `RUNNING` |
| **`unified-media-preview`** *(API)* | **`d270bbfc-b6bf-41a1-be5a-ee22b5b914c7`** | **`2ebdbe96`** | `sha256:aeb77d03e46c…` | `RUNNING` *(+1 `REMOVED` — l'ancienne instance)* |

✅ **L'isolation des configurations TIENT** : **le web est construit depuis
`/frontend/railway.web-docker.toml`** *(`meta.configFile`, racine `frontend`)*,
**l'API depuis la racine `/backend`** — **exactement le réglage éprouvé par le
chantier `INFRA-04`.**

✅ **Les anciens déploiements ne sont PLUS actifs** : **`activeDeployments` ne
contient plus que `2ebdbe96`.** **Ils restent redéployables par leur ID**
*(§6 quater.e)*.

### 6 quater.c Chronologie MESURÉE

| Horodatage *(UTC)* | Fait observé |
|---|---|
| **04:04:22** | **les DEUX déploiements sont créés** — **à la même seconde**, **déclenchés par la poussée** |
| **04:05:25** | **`preview.yunicity.city` sert ENCORE l'ancien build** — **ETag `"yy6a948g3y8py"`** *(ligne de base prise À DESSEIN pendant la construction)* |
| **≈ 04:07:11** | **web observé `SUCCESS`** *(sondage 4)* ; **API encore `BUILDING`, puis `DEPLOYING`** |
| **04:07:44** | **les DEUX observés `SUCCESS`** *(sondage 6)* — **soit ≈ 3 min 20 s après le déclenchement** |
| **04:08:09** | **le NOUVEAU build est servi au bord** — **ETag `"7u9snj31jp8py"`** |

### 6 quater.d ✅ PREUVE DE BASCULE AU BORD — **indépendante du statut Railway**

**Pourquoi ce contrôle** : **un `SUCCESS` côté Railway dit qu'une image est
construite et démarrée** — **il ne dit pas que le DOMAINE la sert.** **Sans
empreinte prise AVANT, un domaine resté sur l'ancienne image serait
indistinguable d'une bascule réussie.**

| Empreinte | Avant *(04:05:25)* | Après *(04:08:09)* |
|---|---|---|
| **ETag de la page d'accueil** | `"yy6a948g3y8py"` | **`"7u9snj31jp8py"`** — ✅ **CHANGÉ** |
| **Bundles `/_next/static/chunks/`** | **9** | **9** — ✅ **2 REMPLACÉS** |

**Les deux bundles remplacés** : **`3500-abf1bc04cea8898c.js` et
`7777-ec539f79b87de8ad.js`** → **`7777-01baeed1b802fec2.js` et
`8795-00d3c2bd8d15cf3b.js`** ; **7 sur 9 sont INCHANGÉS** — **cohérent avec un
correctif ciblé sur le fil et le profil**, **et non avec une reconstruction
totale.**

⚠️ **Ce que cette preuve ne dit PAS** : **que le code changé est celui du
correctif.** **Elle établit la BASCULE, pas le CONTENU.** **Le contenu ne sera
établi qu'à l'écran** *(§8)*.

**Santé de l'API après bascule** — **lectures seules** :

```
GET https://api-preview.yunicity.city/api/v1/health  → 200  {"status":"ok","service":"yunicity-api","environment":"prod"}
GET https://api-preview.yunicity.city/api/v1/ready   → 200  {"status":"ready","checks":{"database":"ok","redis":"ok","registration_config":[]}}
```

✅ **Base de données et Redis répondent.** ⚠️ **`/health` NU répond `404`** :
**le chemin canonique est `/api/v1/health`** — **à retenir pour les prochaines
vérifications.**

⚠️ **Observation HORS PÉRIMÈTRE, PRÉEXISTANTE, non traitée ici** : **l'API de
Preview se déclare `environment: "prod"`** — **l'environnement Railway
s'appelle `production`.** **Cela ne vient PAS de ce ticket** ; **mais si des
comportements dépendent de ce drapeau** *(journalisation, CORS, cookies)*, **la
recette se déroule sous un réglage « prod ».** → **à ouvrir comme ticket
distinct.**

### 6 quater.e Retour arrière — **disponible, non employé**

| Voie | Moyen |
|---|---|
| ✅ **PRÉFÉRÉE** | **redéployer `14c4094a-adf6-404d-bfa7-f28097338dd7`** *(web)* **et `53c0b1eb-9682-4888-8a6a-ef79ffa0d022`** *(API)* — **les deux déploiements `bf008a87`**, **`canRedeploy: true`**, **sans reconstruction ni modification de l'historique Git** |
| ⚠️ **Git** | **revenir de `2ebdbe96` à `bf008a87` sur la branche Preview EXIGERAIT `--force`** — ⛔ **à n'employer qu'APRÈS le redéploiement, jamais à la place** |

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

## 8 bis. Résultats de la recette — **rapportés par Kyria le 2026-11-02**

**Environnement** : **Preview, `preview.yunicity.city`**, **SHA
`2ebdbe96f84dfe303f15009bb63a20267339429d`** — **déployé le 2026-11-01 à
04:08 Z et vérifié au bord** *(§6 quater)*.

⚠️ **NATURE DE LA PREUVE — DEUX NIVEAUX, à ne pas confondre** *(précisé le
2026-11-02, captures fournies par Kyria)* :

| Niveau | Ce qui est couvert |
|---|---|
| ✅ **CAPTURÉ** *(4 captures, examinées)* | **`R1` et `R2`** — **le contrôle « … » sur SA PROPRE publication**, **et la confirmation** — **sur DEUX surfaces** : **aperçu du profil sur Safari iPhone** et **carte du fil au desktop** |
| ✅ **OBSERVÉ, confirmé manuellement par Kyria, NON capturé** | **`R4` et `R5`** — **la suppression réelle, le message de succès, et l'ABSENCE APRÈS RECHARGEMENT** |

⛔ **Les absences après rechargement ne sont PAS dans les captures** : **elles
reposent sur la confirmation manuelle de Kyria.** **C'est le critère de sortie
lui-même** — **la distinction se conserve.** ⛔ **Aucun geste n'est à
rejouer** *(consigne de Kyria)*.

**Ces résultats valent pour CE SHA et CET environnement** ; ⛔ **ils ne se
reportent pas à un autre déploiement** *(règle 15)*.

### 8 bis.0 Ce que les CAPTURES établissent — **et à quel composant elles se rattachent**

| Capture | Surface | Ce qu'elle montre |
|---|---|---|
| **1** *(iPhone, 09:06, `preview.yunicity.city`)* | **profil, APERÇU, palier mobile** | **« Publications récentes » + « Voir toutes → »**, **DEUX publications**, **et un contrôle « … » sur CHACUNE** — **sur ses propres publications** |
| **2** *(iPhone)* | **même écran, assombri** | **la confirmation** : **« Supprimer cette publication ? »** · **« Elle disparaîtra du fil et de votre profil. Vous ne pourrez pas la rétablir. »** · **« Supprimer » (rouge) AU-DESSUS de « Annuler »** |
| **3** *(desktop)* | **carte du FIL** | **publication propre** *(« Freeway · Reims · À l'instant »)* **portant le contrôle « ⋮ »** — ⚠️ **c'est l'inverse exact du défaut d'origine**, **où le menu n'était pas rendu sur sa propre publication** |
| **4** *(desktop)* | **la confirmation** | **MÊMES libellés** · **« Annuler » À GAUCHE, « Supprimer » (rouge) À DROITE** |

✅ **RATTACHEMENT AU CODE — vérifié, non supposé** :

- **Les deux libellés de la modale sont IDENTIQUES aux constantes partagées** :
  **`PUBLICATION_DELETE_CONFIRM_TITLE`** et **`PUBLICATION_DELETE_CONFIRM_BODY`**
  *(`packages/utils/src/publication-delete.ts:27` et `:30`)*. **La modale
  capturée est donc BIEN le composant de ce correctif**, **et non une boîte de
  dialogue du navigateur.**
- ✅ **La question du §8 bis.b point 3 est TRANCHÉE pour le MOBILE** : **le
  bloc capturé est l'APERÇU**, **pas l'onglet**. **Preuve** : **l'aperçu est le
  SEUL des deux montages à passer `seeAllHref` et `seeAllLabel`** — **le lien
  « Voir toutes → »** *(`profile-medium-overview.tsx:65`-`73`, câblé par
  `profile-compact-screen.tsx:92`)* —, **et il impose `maxItems={2}`** :
  **la capture montre EXACTEMENT deux publications.** **L'onglet, lui, monte
  `maxItems={12}` sans lien d'en-tête** *(`profile-compact-screen.tsx:106`)*.
- ⚠️ **Pour le MEDIUM 768 px, le montage manipulé reste indéterminé** —
  **mais les deux montages appellent le MÊME composant avec la MÊME fonction** :
  **l'ambiguïté est désormais sans conséquence.**

✅ **LA PORTÉE AFFICHÉE EST CONFORME À LA SUPPRESSION DOUCE** — **vérifié à
l'écran** : **le texte dit « elle disparaîtra du fil et de votre profil »** et
**« vous ne pourrez pas la rétablir »**. ⛔ **Il ne dit NI « effacée », NI
« définitivement supprimée ».** **C'est exactement la portée réelle** : **la
ligne reste en base, les fichiers restent stockés, et il n'existe aucun chemin
de rétablissement dans le produit.** **L'écran ne ment pas sur ce qu'il fait.**

⛔ **Je n'ai créé ni supprimé AUCUNE publication** : **les publications
utilisées, et le moment de leur suppression, relèvent de Kyria seule.** **`R0`
est donc hors de mon périmètre d'exécution.**

| # | Critère écrit | Résultat | Surface et palier |
|---|---|---|---|
| **R1** | **le menu s'ouvre, il contient « Supprimer »** | ✅ **OBSERVÉ** — **implicite dans un parcours mené jusqu'à la suppression** | **fil desktop** · **fil Safari iPhone** · **profil Safari iPhone** |
| **R2** | **la confirmation s'ouvre, rien ne disparaît encore** | ✅ **OBSERVÉ** | **fil desktop** · **fil + profil Safari iPhone** · ✅ **profil desktop** · ✅ **profil medium 768 px** |
| **R3** | **« Annuler », puis **Échap** : la publication est toujours là** | ⚠️ **PARTIEL** — **annulation VÉRIFIÉE** ; ⛔ **la touche Échap n'est PAS rapportée** | **profil desktop** · **profil medium 768 px** |
| **R4** | **la carte disparaît, un message apparaît** | ✅ **OBSERVÉ** — **suppression réelle ET message de succès** | **fil desktop** · **fil Safari iPhone** · **profil Safari iPhone** |
| **R5** | 🛑 **la carte est TOUJOURS absente après rechargement** | ✅ **OBSERVÉ** — **c'est LE contrôle qui prouve** | **fil desktop** · **fil Safari iPhone** · **profil Safari iPhone** |
| **R6** | **profil : le bouton « Options » répond, « Supprimer » y est** | ✅ **OBSERVÉ sur les TROIS paliers** — **mobile jusqu'à la suppression réelle** ; **desktop et medium jusqu'à la confirmation** | **profil Safari iPhone** *(complet)* · **profil desktop** · **profil medium 768 px** |
| **R7** | **rejouer `R1`–`R6` au MEDIUM** | ⚠️ **PARTIEL** — **profil : confirmation et annulation vérifiées** ; ⛔ **suppression réelle NON jouée** ; ⛔ **fil au medium NON rapporté** | **profil medium 768 px** |
| **R8** | 🛑 **rejouer `R1`–`R6` au MOBILE, sur SAFARI iPHONE RÉEL** | ✅ **OBSERVÉ, COMPLET** — **fil ET profil** : **suppression réelle, message de succès, absence après rechargement** | **Safari iPhone RÉEL** |
| **R9** | **profil PUBLIC d'un autre citoyen : aucun « Supprimer »** | ⛔ **NON JOUÉ** | — |

### 8 bis.a ✅ LE CRITÈRE DE SORTIE ÉCRIT EST ATTEINT

**Le critère de sortie du §8 est : `R5` ET `R8`** — **« la disparition
CONFIRMÉE APRÈS RECHARGEMENT, et le chemin EFFECTIF sur Safari iPhone
réel »**.

✅ **`R5` est observé** *(fil desktop, fil iPhone, profil iPhone)*. ✅ **`R8`
est observé et COMPLET** *(fil et profil sur Safari iPhone réel, jusqu'au
rechargement)*. **`E6` avait relevé le défaut précisément là** — **le palier
qui le portait est celui où la correction est désormais observée.**

⚠️ **Ce que cela ne rend PAS vrai** : **que `R1`–`R9` soient tous couverts.**
**Le critère de sortie était volontairement étroit** *(« le critère n'est PAS
le bouton existe »)* ; **il est atteint, et il reste des cases non jouées,
listées au §8 bis.b.** **Les deux énoncés tiennent ensemble** — **l'un ne doit
pas servir à effacer l'autre.**

### 8 bis.b Ce qui N'A PAS ÉTÉ JOUÉ — **limites ACCEPTÉES à la clôture**

⚠️ **Décision de Kyria, 2026-11-02** : **« Aucun test supplémentaire, aucune
suppression supplémentaire. »** **Le tableau ci-dessous décrivait ce qui
restait À JOUER** ; **il décrit désormais ce qui RESTE NON OBSERVÉ, et le
restera** — **à rouvrir seulement si un doute surgit sur l'une de ces
surfaces.** ⛔ **La colonne « Nécessité » conserve mon appréciation d'AVANT la
décision** : **elle n'est pas réécrite après coup.**

| # | Reste à jouer | Écriture ? | Nécessité |
|---|---|---|---|
| **1** | **`R9`** — **profil public d'un AUTRE citoyen : aucun « Supprimer »** | ⛔ **AUCUNE** — **lecture seule** ; **ne demande PAS de second compte** *(seule la vérification du `404` médias le demandait)* | 🛑 **NÉCESSAIRE** — **c'est la seule frontière de l'interface qui reste non vue à l'écran**, **et elle ne coûte rien** |
| **2** | **suppression RÉELLE depuis le PROFIL, sur un palier LARGE** *(desktop ou medium)* — **annonce de succès, déplacement du focus, carte retirée** | ⚠️ **une suppression** — **mais AUCUNE création** : **la publication du test d'annulation est restée en place, l'annulation ne supprimant rien** | ⚠️ **RECOMMANDÉE, non indispensable** — **voir la déduction ci-dessous** |
| **3** | ✅ **TRANCHÉ pour le MOBILE par la capture 1** : **c'est l'APERÇU** *(lien « Voir toutes → » et `maxItems={2}`, §8 bis.0)* — **`R7` posait explicitement la question : l'aperçu PORTE bien le menu.** ⚠️ **Indéterminé au medium 768 px**, **mais sans conséquence** *(mêmes composant et fonction)* | ⛔ **aucune** | ✅ **CLOS pour le mobile** |
| **4** | **`R3` seconde moitié** : **Échap sur la confirmation** | ⛔ **aucune** — **Échap ne supprime rien** | **mineure** — **couverte par 2 tests de comportement** |

**Pourquoi le point 2 n'est PAS indispensable** — **déduction, et elle est
bornée** : **le contrôle « Options » du profil n'est rendu QUE si
`onDeletePost` est câblé** — **sinon le bouton reste `disabled`**
*(`profile-desktop-publications.tsx`, verrou statique 12)*. **Or la
confirmation S'EST OUVERTE sur desktop ET sur medium** : **la chaîne de
transmission y est donc VIVANTE sur les deux paliers.** **La fonction appelée
est `ctx.deleteUserPost`, UNE SEULE fonction**, **dont le chemin de succès est
observé en réel sur iPhone** ; **le retrait de la carte passe par
`setFeedPosts`, la SOURCE**, **donc les trois paliers suivent.** **Et
l'annonce comme le focus vivent dans `ProfileDesktopPublications`, LE MÊME
fichier monté sur les trois paliers.**

⚠️ **Ce qui reste donc réellement non vu sur les paliers larges** : **le RENDU
du succès** — **que l'annonce soit VISIBLE et que le focus se POSE là où il
faut dans ces mises en page.** **C'est un risque de CSS et de mise en page**,
**pas de logique.** **Il ne se lève que par l'écran** — **mais il ne met en
jeu ni donnée ni autorisation.**

### 8 bis.c Ce que la recette ne referme PAS

⛔ **Les specs Playwright 21 et 33 restent NON EXÉCUTÉES** — **aucun workflow
ne les lance** *(§6 ter)*. **La recette manuelle ne les remplace pas** :
**elles protègent contre une RÉGRESSION FUTURE**, **ce qu'une observation
ponctuelle ne fait pas.**

⛔ **`C3` et `C5` restent des constats ACCEPTÉS**, **non corrigés** *(décision
de Kyria)*. ⛔ **Le `404` opposé aux TIERS sur les médias reste non vérifié**
*(second compte impossible, inscription fermée)*. ⛔ **La dette de menu
dupliquée reste posée** *(`TODO(debt)`, refactor à part)*.

---

## 9. État, inconnues et prochaine action

| | |
|---|---|
| **État** | ✅ **TICKET CLOS le 2026-11-02**, **sur validation de la recette par Kyria** · **correctif DÉPLOYÉ sur Preview** *(§6 quater)* · ✅ **VÉRIFIÉ À L'ÉCRAN** — **critère de sortie `R5` ET `R8` ATTEINT** *(§8 bis)* · ⚠️ **limites connues ACCEPTÉES** : **`R9` et suppression réelle au profil large NON joués**, **specs Playwright non exécutées**, **`C3`/`C5` ouverts** · ⛔ **le correctif n'est PAS dans `main`** · ✅ **défaut RECLASSÉ CORRIGÉ le 2026-11-02**, **sur validation de Kyria et sur preuve d'écran** — ⚠️ **corrigé sur PREVIEW**, **pas dans `main`** *(couverture §3.2 et §5 mises à jour)* |
| **État Git** | ✅ **COMMITÉ ET POUSSÉ le 2026-10-31**, **sur autorisation de Kyria** — **branche `fix/mobile-publishing-p0`**, **base `8d2d4c9f`** :<br>• **`fcc63538dd949daa8163d03c799a4104ff39346e`** — *`fix(feed,profile): supprimer sa propre publication depuis l'interface`* — **28 fichiers**, **1677 insertions, 60 suppressions**, **dont 8 nouveaux**<br>• **`2ebdbe96f84dfe303f15009bb63a20267339429d`** — *`docs(workflow): PROFILE-POST-MENU-01 — passation, revue et preparation`* — **3 fichiers, 1591 insertions**<br>**PR BROUILLON** : **https://github.com/Kyria-Zaire/yunicity.review/pull/203** → **`main`**<br>⛔ **AUCUNE fusion vers `main`** · ✅ **poussée vers la branche Preview EXÉCUTÉE le 2026-11-01, sur autorisation** — **fast-forward `bf008a87..2ebdbe96`, sans `--force`** *(§6 quater)* · ⛔ **aucune donnée manipulée**, ⛔ **`R0` NON joué** |
| **Contrôles de commit — tous passés** | **8 contrôles avant le commit 1** : **chemins IDENTIQUES à la liste de référence** *(`diff`, 28/28, pas un simple décompte)* · **0 document**, **0 artefact** · **0 fichier de la liste resté hors index** · **0 interdit dur ajouté** · **1 `TODO(debt)`** *(celui de `use-overflow-menu.ts`)* **et 0 autre TODO** · **0 `pnpm-lock` ni `vitest.config`** · **8 fichiers nouveaux** · **3 contrôles avant le commit 2** *(3 chemins, tous `PROFILE-POST-MENU-01`, tous sous `docs/`)* |
| **Modifications antérieures — PRÉSERVÉES, vérifié après les commits** | **les 4 documents suivis restent MODIFIÉS et NON commités** *(`TICKETS-INDEX.md`, `PR202-WEB-bilan-consolide.md`, `PR202-WEB-recette-manuelle.md`, `PR202-WEB-recette-publication-photo.md`)* · **32 documents non suivis d'autres tickets TOUJOURS là** · **0 fichier applicatif en attente** · **statut passé de 67 à 36 lignes** = **28 + 3 commités, et rien d'autre**. ⛔ **Aucun `stash`, aucun `reset`** ; **`next-env.d.ts` restauré après chaque build** |
| **⚠️ Deux incidents de procédure, consignés** | **1.** **`git commit -F /tmp/…` a ÉCHOUÉ** *(`could not read log file`)* : **sous Git Bash, le `/tmp` de `git` est le TEMP de Windows**, **alors qu'un `python` écrivant dans `"/tmp/…"` crée `C:	mp\…`**. ⛔ **Rien n'avait été commité, l'index était intact** — **refait avec un chemin absolu identique des deux côtés**, **et le piège est consigné au §4.4 du document d'ops**. **2.** **le sujet du commit 2 s'étalait sur DEUX lignes** *(le message commençait par un titre replié)* : **message AMENDÉ seul, avant toute poussée**, **contenu inchangé** *(3 fichiers)* — **le SHA du commit 2 est donc passé de `257a75b8` à `2ebdbe96`**, **et celui du commit 1 n'a PAS bougé** |
| **⚠️ Ce que la PR 203 N'EST PAS** | **une surface de revue pour CE changement** : **la branche a divergé de `main` depuis longtemps**, **et la PR compte une CENTAINE de commits**. **Elle sert UNIQUEMENT à obtenir la CI.** **Pour relire le correctif seul** : **les deux SHA ci-dessus**, **ou `git diff origin/feat/c3-videos-refonte-final..HEAD`** |
| **Preuve acquise** | ✅ **PREUVE D'ÉCRAN ACQUISE le 2026-11-02**, **sur Preview `2ebdbe96`**, *(§8 bis)* — **DEUX NIVEAUX** : ✅ **CAPTURÉ** *(4 captures)* : **le contrôle « … » sur sa propre publication et la CONFIRMATION**, **à l'aperçu du profil sur Safari iPhone ET à la carte du fil au desktop** — **libellés identiques aux constantes du code, rattachement vérifié** ; ✅ **OBSERVÉ et confirmé manuellement, NON capturé** : **la suppression réelle, le message de succès et l'ABSENCE APRÈS RECHARGEMENT** — **fil desktop**, **fil Safari iPhone RÉEL**, **profil Safari iPhone RÉEL** ; **confirmation et annulation au profil desktop et medium 768 px.** ⛔ **Non joué** : **`R9`** *(profil public d'un tiers)*, **suppression réelle au profil sur palier large**, **Échap sur la confirmation**, **fil au medium**.<br>**Avant cette recette, l'état était** : ⛔ **AUCUNE preuve d'écran.** ✅ **UNE preuve d'EXÉCUTION réelle, côté serveur** : **`tests/test_feed.py` — 17 passed**, **sous Docker**, **base jetable `yunicity_test_0367990d08e9` créée puis supprimée** *(§6.2)* — **dont le `403` opposé à un tiers et la SURVIE de la publication**. **Le reste est types, lint, tests unitaires et build** *(§6.1)* |
| **SHA Preview** | ✅ **`2ebdbe96f84dfe303f15009bb63a20267339429d`** — **RELEVÉ, non reporté** : **les DEUX services sont `SUCCESS` sur ce SHA** *(web `66baa70a…`, API `d270bbfc…`)*, **et la bascule est confirmée AU BORD** *(ETag et 2 bundles changés — §6 quater.d)*. **Précédent, redéployable** : **`bf008a87`** *(web `14c4094a…`, API `53c0b1eb…`)* |
| **Erreurs corrigées et CONSIGNÉES** | **1.** **`profile-mobile-post-card.tsx` n'est PAS une surface de production** *(§2)* · **2.** **une régression de SPÉCIFICATION introduite par ce diff** *(spec Playwright 21)*, **trouvée en revue et corrigée** *(§6.4.a)* · **3.** **ma vérification de session 1 était INCOMPLÈTE** — **le typecheck web ne couvrait pas les fichiers de test écrits après lui**, **et il a révélé DEUX erreurs réelles une fois relancé** *(§6.4.b)* · **4.** **la trace `M1`–`M2` de `MEDIA-MULTI-PHOTO-01`** — **« jamais joués » était FAUX**, **corrigé dans sa passation et dans l'index** |
| **Inconnues** | ✅ **LEVÉES par la recette du 2026-11-02** *(§8 bis — déplacées vers « Preuve acquise », non effacées)* : **le rendu réel du menu sur Safari iPhone**, **le parcours de suppression de bout en bout**, **la persistance après rechargement**. ⛔ **TOUJOURS INCONNUES** : **`R9`** · **le rendu du SUCCÈS au profil sur palier large** *(annonce visible, focus posé — risque de mise en page)* · **le fil au palier medium** *(même arbre DOM, encadré par desktop et mobile — déduction, non observation)* · **le `404` opposé aux TIERS sur les médias** *(second compte impossible : inscription fermée)* · **le comportement réel des specs Playwright 21 et 33** *(modifiées, typechecke, NON EXÉCUTÉES)* · **la cause racine de l'instabilité du pool de workers** *(§6.3 — supposée, non établie)* |
| **Constats de la dernière revue** | **5 constats, aucun bloquant, aucune donnée en risque** — détail et fichiers au §4.5 de la [revue](../../qa/PROFILE-POST-MENU-01-revue-correctif.md). ✅ **`C1`, `C2` et `C4` CORRIGÉS le 31/10** *(§4.6 de la revue)* : **annonce `role="status"` ajoutée au PROFIL avec le MÊME libellé que le fil**, **focus déplacé sur un ancrage STABLE des DEUX côtés** *(titre « Publications » au profil, région du flux au fil ; `tabIndex={-1}`, ordre de tabulation inchangé)*, **et `aria-describedby` de la modale CONCATÈNE désormais portée + erreur**. **Couverture : 4 tests de comportement et 4 verrous statiques ajoutés.** ⏸ **`C3`** *(minuterie de `deleteMessage` non annulée — `feed-data-controller.tsx`)* **et `C5`** *(état d'attente peu annoncé — `publication-delete-dialog.tsx`)* **restent DOCUMENTÉS et ACCEPTÉS pour cette livraison**, **décision de Kyria** : ⛔ **ils ne doivent pas disparaître d'ici** |
| **Autorisation — conclusion BORNÉE** | ⛔ **Le masquage du contrôle côté interface n'exclut PAS une IDOR** : **il empêche un parcours accidentel, pas un appel forgé sur `DELETE /posts/{id}`** *(console, client HTTP, script)*. **Son rôle est ERGONOMIQUE** — **ne pas proposer une action que le serveur refusera.** ✅ **La protection repose sur le CONTRÔLE SERVEUR** — **`_can_moderate_post` → `_is_author`** —, **ÉPROUVÉ par un test EXÉCUTÉ** : **`test_soft_delete_post_rejects_other_citizen`**, **`403` au tiers et publication CONSERVÉE** *(§6.2)*. ⚠️ **Une rédaction antérieure écrivait « aucune surface d'IDOR » : conclusion TROP LARGE, corrigée et consignée** |
| **Vérifié CONFORME en revue** | **prédicat d'AFFICHAGE identique sur les deux surfaces et dérivé de l'identité SERVEUR** *(`filterProfileUserFeedPosts` filtre sur `profile.user_id`)* — **le parcours nominal n'envoie que des identifiants renvoyés par le serveur** · **confirmation** *(rien d'écrit avant `confirm`, verrou anti double-envoi)* · **erreurs** *(4 cas, aucun détail serveur, modale maintenue, aucun `catch` silencieux)* · **retrait après succès** *(jamais avant le `204` ; fil via `items` → `displayedPosts` → flux ; profil via `feedPosts`, la SOURCE, donc les trois paliers et les statistiques suivent)* |
| **Dette signalée** | **`FeedPostOptionsMenu` porte sa propre mécanique de menu**, **que `useOverflowMenu` duplique désormais** — **`TODO(debt)` posé dans le hook** : **son alignement est un REFACTOR à part**, **le déclencheur du fil étant sous contrat E2E** *(règle 11 : un refactor par PR)* |
| **Prochaine action** | ✅ **AUCUNE au titre de ce ticket — il est CLOS.** **Ce qui subsiste relève de DÉCISIONS de Kyria, hors de ce ticket** : **1.** **la FUSION du correctif** — ⛔ **il n'est PAS dans `main`** : **il vit sur `fix/mobile-publishing-p0` et sur la branche Preview**, **la PR 203 est un BROUILLON**, **et aucun accord de fusion n'a été donné** · **2.** **le prochain ticket** — ⛔ **aucun n'est actif** *(règle 15)* ; **deux sont SUSPENDUS** : **`MEDIA-MULTI-PHOTO-01`**, ⚠️ **dont le blocage de NETTOYAGE est LEVÉ sur Preview par ce correctif**, **et `SOCIAL-COMMENT-01`** *(`M5` dû)* · **3.** **l'exécution des specs Playwright en CI** — **lacune du dépôt, consignée dans `e07e809c`** · **4.** **`C3` et `C5`**, **acceptés pour cette livraison** · **5.** **`Dependency audit`**, **réserve préexistante du dépôt** · **6.** **l'API de Preview se déclare `environment: "prod"`** *(§6 quater.d)* — **à ouvrir comme ticket distinct**. ⚠️ **Retour arrière Preview toujours disponible** : **redéploiement des deux ID `bf008a87`** *(§6 quater.e)* |

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
