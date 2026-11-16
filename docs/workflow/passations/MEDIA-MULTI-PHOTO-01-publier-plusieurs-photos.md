# Passation — MEDIA-MULTI-PHOTO-01 · Publier plusieurs photos depuis `/feed/new` · desktop

> ## ✅ RECETTE ET CLÔTURE SUR PREVIEW — **2026-11-03**
>
> ### Nature de la preuve — **à ne pas surclasser**
>
> **Recette conduite avec ChatGPT, et CONFIRMATIONS MANUELLES de Kyria.**
> ⚠️ **Je n'ai rien observé moi-même** : ce qui suit est consigné sur la foi
> des confirmations de Kyria, pas d'un relevé que j'aurais produit.
>
> ⛔ **AUCUNE MESURE CHRONOMÉTRÉE.** **La fluidité est appréciée À L'USAGE.**
> **Le relevé `PerformanceResourceTiming` préparé**
> *(`docs/qa/MEDIA-MULTI-PHOTO-01-releve-preview.md`)* **n'a PAS été joué** :
> **ni tailles transférées, ni durées, ni comptes de requêtes.** **Les ~3 s
> qui motivaient la reprise n'ont donc jamais été mesurées APRÈS correction** —
> **seulement ressenties comme résorbées.** ⛔ **Ne pas écrire que le gain est
> chiffré.**
>
> ### Ce qui est CONFIRMÉ
>
> | Fait | Classe de preuve |
> |---|---|
> | **La fluidité est satisfaisante à l'usage** | **appréciation**, confirmée manuellement — ⛔ **non mesurée** |
> | **L'attente initiale en visionneuse s'est RÉSORBÉE pendant l'essai** | **observation** de Kyria, au fil de la session |
>
> ### ⚠️ L'attente initiale — **une explication PLAUSIBLE, pas établie**
>
> **Le comportement décrit est cohérent avec la conception** : **la variante
> est dérivée À LA DEMANDE, une seule fois**, puis **lue depuis l'espace
> `derived/`** ; **et le blob est conservé dans la session autorisée.** **La
> PREMIÈRE consultation d'un média paie donc la dérivation, les suivantes
> non.** ⚠️ **Mais rien ne l'ÉTABLIT ici** : **aucune requête n'a été relevée,
> aucun journal serveur consulté.** **Une mise en cache côté navigateur, une
> variation de réseau ou un simple préchauffage d'instance expliqueraient le
> même ressenti.** ⛔ **Hypothèse consignée comme telle, à confirmer par le
> relevé si le sujet revient.**
>
> ### 📍 CLÔTURE — **sur PREVIEW, et sur Preview seulement**
>
> **`MEDIA-MULTI-PHOTO-01` est CLOS au stade PREVIEW le 2026-11-03.**
>
> | | |
> |---|---|
> | **Preview** | ✅ **`dd7c22e1`** — les deux services SUCCESS, SHA relu, domaines en **HTTP 200** |
> | **fusion vers `main`** | ⛔ **AUCUNE** — **`main` reste à `3e0b27ba`** |
> | **PR #203** | **toujours en BROUILLON** — la clôture du ticket **ne vaut pas** décision de fusion |
> | **commits du ticket** | `6aa7cbc9` · `2d32fb77` · `120f784a` · `2b44b656` · `dd7c22e1` |
> | **publication de test** | ✅ **CONSERVÉE** — « Test multi-photo à supprimer » |
>
> ### ⛔ RÉSERVES CONSERVÉES — **la clôture ne les lève pas**
>
> **Aucune de ces réserves n'est levée par la recette. Elles passent au
> ticket suivant ou restent ouvertes en l'état.**
>
> | Réserve | État |
> |---|---|
> | **Audit des dépendances ROUGE** — 21 vulnérabilités High/Critical, dont `next` en CVSS 9.5 | ⛔ **OUVERTE**, **zone rouge**, **sujet séparé** · **assumée** pour la Preview, **jamais levée** |
> | **La fluidité n'est pas CHIFFRÉE** | ⛔ **OUVERTE** — relevé préparé, non joué |
> | **Le « +N » de tuile n'est rendu que dans la branche « média prêt »** | ⛔ **OUVERTE** — **défaut PRÉEXISTANT**, non corrigé |
> | **Le mono-photo ne demande aucune variante** — il reçoit l'original, jusqu'à 20 Mo, sur le cas le plus fréquent du fil | ⛔ **OUVERTE** — **optimisation restante**, délibérément hors passe |
> | **`MEDIA-05-PHOTO-LETTERBOX`** | ⛔ **OUVERT** — **arbitrage produit**, désormais circonscrit aux lots **mixtes** |
> | **Dédoublonnage des dérivations : portée PROCESSUS, pas déploiement** | ⚠️ **documenté**, conséquence bornée *(CPU gaspillé, jamais de variante corrompue)* |
> | **Playwright n'est pas en CI** | ⚠️ **les 30 tests de navigateur sont LOCAUX** — aucun job ne les rejoue |
> | **`ios-form-zoom` : délai propre posé** | ⚠️ **son indépendance au diff n'est PAS démontrée** |
> | **Indépendance des commits** | ⚠️ **déduite par lecture**, jamais par construction isolée |
> | **Gestes Safari iPhone sur le CARROUSEL** | ⚠️ **le balayage du carrousel repose sur le défilement NATIF** — **confirmé à l'usage, non éprouvé geste par geste** |
>
> ### ▶️ SUITE
>
> **Ticket suivant** : **`FEED-NEW-UX-01` · reconstruction de `/feed/new` sur
> les trois formats** — [`FEED-NEW-UX-01-reconstruction-feed-new.md`](FEED-NEW-UX-01-reconstruction-feed-new.md).
>
> ⛔ **Décisions NON prises, qui ne relèvent pas du ticket suivant** :
> **fusion vers `main`**, **sortie du brouillon de la PR #203**, **traitement
> de l'audit des dépendances**, **suppression de la publication de test**.

---

> ## ▶️ TICKET RÉACTIVÉ le 2026-11-02 — **MODE CORRECTION**
>
> **Décision de Kyria, 2026-11-02** : **« Prochain ticket unique :
> `MEDIA-MULTI-PHOTO-01`, repris en mode correction. Objectif : sélectionner
> plusieurs photos, conserver leurs aperçus, publier et retrouver TOUTES les
> photos après rechargement, sur desktop, medium et mobile. »**
>
> **Ticket précédent** : **`PROFILE-POST-MENU-01`** — ✅ **CLOS le 2026-11-02**
> *(recette validée, Preview `2ebdbe96`)*. **Un seul ticket actif** *(règle
> 15)*. **Index** : [`../TICKETS-INDEX.md`](../TICKETS-INDEX.md), **qui fait
> foi**.
>
> ### Ce qui est AUTORISÉ, et ce qui ne l'est pas
>
> | | |
> |---|---|
> | ✅ **AUTORISÉ** | **implémentation** et **tests LOCAUX** |
> | ⛔ **INTERDIT à cette étape** | **tout commit** · **tout déploiement** · **toute NOUVELLE PUBLICATION sur Preview** |
> | ⛔ **À PRÉSERVER** | **les modifications documentaires existantes** — **6 documents suivis modifiés et non commités**, **plus les non suivis** *(§ÉTAT ci-dessous)* |
>
> ⚠️ **Le déblocage du nettoyage ne vaut que sur PREVIEW** : **`PROFILE-POST-MENU-01`
> n'est PAS fusionné dans `main`.** **Un chemin de suppression existe
> désormais à l'écran sur les trois paliers** — **c'était l'option C du §4.5 de
> ce document**, **et c'est ce qui rend la phase d'écriture `M3`–`M9`
> rejouable** — ⛔ **mais pas à cette étape** *(aucune nouvelle publication
> autorisée)*.

---

> ## 🔬 DIAGNOSTIC CONFIRMÉ PAR LECTURE DE CODE — **2026-11-02**
>
> **Le §4 de ce document posait une PRÉDICTION** : **« la carte n'afficherait
> QU'UNE photo, la première ».** ✅ **La lecture de code la CONFIRME, et la
> localise.** ⛔ **Elle reste NON OBSERVÉE à l'écran** — **aucune publication
> multi-photo n'a été créée** *(la phase d'écriture n'a jamais été jouée)*.
>
> ### ✅ Le chemin d'ÉCRITURE est COMPLET — **ne pas le « réparer »**
>
> **Tout fonctionne déjà, du sélecteur jusqu'à la base** :
>
> | Maillon | Fichier | État |
> |---|---|---|
> | **sélection multiple** | `components/feed/post-composer/new-post-screen.tsx:188` | ✅ **`multiple` sur l'`input`** |
> | **liste + APERÇUS** | `hooks/use-new-post-draft.ts:60` *(`selectedMedia: SelectedMediaDraft[]`)*, `:170` *(`handleSelectedFiles`)* | ✅ **une entrée par fichier**, **chacune avec son `previewUrl`** *(`URL.createObjectURL`, révoqué au démontage)* ; **plafond `POST_MEDIA_MAX_COUNT = 10`** ; **filtres taille, HEIC, type** |
> | **rendu des aperçus** | `post-composer/desktop/new-post-desktop-view.tsx:119` · `post-composer/mobile/new-post-mobile-view.tsx:174` | ✅ **`draft.selectedMedia.map(...)`** — **les DEUX vues rendent TOUS les aperçus**, **pas seulement le premier** |
> | **envoi** | `new-post-screen.tsx:101`-`112` | ✅ **boucle sur `draft.selectedMedia`**, **un `uploadPostMedia` par fichier**, **échéance proportionnelle à la taille** |
> | **charge utile** | `hooks/use-new-post-draft.ts:248`-`249` | ✅ **`media_urls: uploadedMedia`** *(la LISTE)* **et `media_url: uploadedMedia[0]`** |
> | **stockage** | `backend/app/services/post_composer_mapper.py:119`-`127` | ✅ **`post.media_urls`** *(JSONB, la LISTE)* **et `post.media_url = media_items[0].url`** |
> | **colonnes** | `backend/app/models/post.py:54` et `:122` | ✅ **`media_url: str`** **ET** **`media_urls: list[dict]`** |
>
> **Conclusion** : ⛔ **les photos ne sont PAS perdues à l'écriture.** **Elles
> sont en base, dans `media_urls`.**
>
> ### ❌ La rupture est en LECTURE — **et elle a DEUX maillons, pas un**
>
> | # | Rupture | Fichier | Fait |
> |---|---|---|---|
> | **1** | **l'API ne RENVOIE qu'une photo** | `backend/app/schemas/feed.py:60` · `backend/app/services/feed_post_mapper.py:90` et `:117` | **`FeedItem` n'expose QUE `media_url`** ; **le mapper écrit `media_url=post.media_url`** — ⛔ **`media_urls` ne quitte JAMAIS le serveur par le fil.** **Les autres photos sont inatteignables côté client** |
> | **2** | **les cartes ne PASSENT pas la liste** | `components/feed/citizen-post-card.tsx:66` · `components/feed/organization-post-card.tsx:33` · `components/events/event-feed-card.tsx:52` | **les TROIS cartes de production passent `mediaUrl={post.media_url}`**, ⛔ **jamais `mediaUrls`** |
>
> ### ✅ Fait NEUF, et il change l'estimation : **la grille EXISTE DÉJÀ**
>
> **`FeedPublicationMedia`** *(`components/feed/feed-publication-media.tsx:261`-`300`)*
> **accepte DÉJÀ `mediaUrls?: string[] | null`**, **bascule sur une grille
> au-delà d'une photo**, **découpe par `slicePublicationMediaForGrid`** et
> **affiche un compteur de débordement « +N »** *(`publication-media-grid`)*.
> ⛔ **Aucun appelant de production ne l'atteint** — **seul le harnais E2E
> `e2e/harness/media02-interaction-mount.tsx` passe `mediaUrls`.**
>
> ⚠️ **Écart de forme à traiter dans le mapping** : **la grille attend des
> CHAÎNES** *(`string[]`)*, **la base stocke des OBJETS** *(`{url,
> media_type}`)*. **La projection doit être explicite** — ⛔ **et elle ne doit
> pas perdre `media_type`** : **une VIDÉO dans la liste ne se rend pas comme
> une image** *(`SinglePublicationVideo` existe, le cas mixte est à décider)*.
>
> ### 📐 PÉRIMÈTRE — **correctif fonctionnel VS refonte à cadrer**
>
> **Kyria demande explicitement cette distinction.** **Elle est nette** :
>
> | | Sujet | Statut |
> |---|---|---|
> | ✅ **CORRECTIF — ce ticket** | **exposer `media_urls` dans le contrat du fil**, **le projeter**, **et le passer aux cartes** — **pour que TOUTES les photos reviennent après rechargement, sur les trois paliers** | **périmètre DÉFINI**, **cause LOCALISÉE**, **grille déjà écrite** |
> | ⛔ **REFONTE — PAS ce ticket** | **`FEED-NEW-UX-01`** · **« ajustements `/feed/new` demandés par Kyria »** | ⛔ **PÉRIMÈTRE NON DÉFINI** : **ni les écarts, ni le format, ni le comportement attendu ne sont consignés** — **deux sources concordantes** : [bilan §5.1.b](../../qa/PR202-WEB-bilan-consolide.md) et [recette photo §6.2](PR202-WEB-recette-publication-photo.md). **Première étape : RECUEILLIR L'ÉNONCÉ DE KYRIA, écart par écart.** ⛔ **Rien ne peut être estimé ni codé avant** |
> | ⛔ **ARBITRAGE PRODUIT — PAS ce ticket** | **`MEDIA-05-PHOTO-LETTERBOX`** · **bandes gris/blanc aux extrémités des photos** | **« jamais rognée » CONTRE « pas de bande »** — **non simultanément tenables à ratio fixe** *(recette photo §6.1)*. ⚠️ **CORRECTION du 2026-11-02, CONSIGNÉE** *(règle 15 — une erreur de classement ne s'efface pas)* : **une première rédaction de ce tableau affirmait qu'« une tuile de grille recadre par nature ».** ⛔ **C'est FAUX**, **et la lecture de code le démontre** : **les tuiles passent `variant="feed"`** *(`feed-publication-media.tsx:177` et `:209`)*, **et `feedObjectFitForKind` ne rend `cover` que pour la variante `thumbnail`** *(`publication-media-frame.ts:34` et `:112`)* — **une tuile est donc en `contain`, comme le cadre mono.** ✅ **Conséquence** : **la photo n'est PAS rognée dans la grille**, **et la contrainte « conserver les fichiers originaux et permettre leur consultation entière » est tenue sans rien changer.** ⚠️ **Mais le sujet s'ÉTEND au lieu de se réduire** : **plus de cellules à ratio fixe en `contain`, donc PLUS de bandes, pas moins.** ⛔ **Ne pas le trancher en douce dans ce correctif** |
>
> ### 🧭 CHANGEMENT MINIMAL PROPOSÉ — **à valider avant d'écrire**
>
> **Trois points de couture, dans cet ordre** :
>
> 1. **`backend/app/schemas/feed.py`** — **ajouter `media_urls: list[...] = []`
>    à `FeedItem`** *(champ ADDITIF : aucun client existant ne casse)*.
> 2. **`backend/app/services/feed_post_mapper.py:90` et `:117`** — **projeter
>    `post.media_urls`**, **en conservant l'ordre** et **en gardant
>    `media_url` inchangé** *(compatibilité ascendante)*.
> 3. **`frontend/packages/types/src/feed.ts:61`** — **ajouter le champ au type**
>    —, **puis `citizen-post-card.tsx:66`** *(et, à décider, les cartes
>    ORGANISATION et ÉVÉNEMENT)* — **passer `mediaUrls`**.
>
> ⚠️ **Décisions à prendre AVANT de coder** :
>
> - **les familles ÉVÉNEMENT et OFFRE reçoivent-elles la grille ?** *(elles ont
>   leur propre source d'image — risque de régression visuelle)*
> - **cas MIXTE image + vidéo dans une même publication** : **que rend-on ?**
> - **le plafond d'affichage de la grille** *(le compositeur plafonne à 10 ;
>   `slicePublicationMediaForGrid` a son propre seuil de débordement)*
> - **l'accès AUTORISÉ aux médias** : **chaque tuile passe-t-elle par
>   `useAuthorizedMediaSource` ?** *(une publication à 10 médias déclencherait
>   10 résolutions — à mesurer, pas à supposer)*
>
> ### 🧪 PREUVES À PRODUIRE — **et leur ordre**
>
> 1. **Test backend** : **une publication à 2 médias → `GET /feed` renvoie les
>    DEUX** *(c'est la rupture n°1, et elle se teste sans navigateur)*.
> 2. **Tests de comportement web** : **la carte monte la GRILLE à 2 médias**,
>    **l'image seule à 1**, **rien à 0**.
> 3. **Verrou statique** : **les cartes de production passent `mediaUrls`** —
>    **même procédé que `publication-delete-wiring.test.ts`**, **qui a prouvé
>    son utilité** *(un prop oublié ne produit AUCUNE erreur de type)*.
> 4. ⛔ **Recette à l'écran** : **elle EXIGE une publication multi-photo**,
>    **donc une ÉCRITURE** — ⛔ **NON AUTORISÉE à cette étape.**
>
> ### ⚠️ CE QUI RESTE INCONNU — **à ne pas combler par déduction**
>
> - ⛔ **l'URL EXACTE de l'écran de création** *(route ou modale)* — **`M2`
>   partiel : seule l'OUVERTURE du sélecteur a été confirmée** ; **la
>   SÉLECTION MULTIPLE n'a JAMAIS été observée.** 🛑 **Ces gestes ne se
>   rejouent pas** *(consigne de Kyria)*.
> - ⛔ **le rendu réel de la grille** : **jamais vu hors harnais, sur aucun
>   palier.**
> - ⛔ **le comportement des MÉDIAS ORPHELINS** d'un envoi interrompu —
>   **aucune route ne les atteint.**
> - ⛔ **`media_urls` des publications ANCIENNES** : **celles créées avant le
>   mapper actuel portent-elles la liste ?** *(à vérifier en base, pas à
>   supposer)*
>
> ### 📍 ÉTAT au 2026-11-02 — **avant toute écriture de ce ticket**
>
> | | |
> |---|---|
> | **branche** | **`fix/mobile-publishing-p0`** — **`2ebdbe96`**, **identique à `origin`** |
> | **Preview** | **`2ebdbe96`** — **les DEUX services `SUCCESS`** *(déployé le 01/11 pour `PROFILE-POST-MENU-01`)* |
> | **`main`** | **`3e0b27ba`** — ⛔ **ne contient PAS le correctif de suppression** |
> | **PR 203** | **BROUILLON**, **aucune fusion autorisée** |
> | **documents à PRÉSERVER** | **6 suivis modifiés** : `TICKETS-INDEX.md`, `COUVERTURE-FONCTIONNELLE-01.md` *(non suivi)*, `PR202-WEB-bilan-consolide.md`, `PR202-WEB-recette-manuelle.md`, `PR202-WEB-recette-publication-photo.md`, les passations `PROFILE-POST-MENU-01` et celle-ci, **plus la revue du correctif** — ⛔ **ne RIEN commiter, ne RIEN désindexer en masse** |
> | **aucun fichier applicatif modifié** | ✅ **vérifié** — **l'arbre est propre côté `frontend/` et `backend/`** |
>
> ### ▶️ PROCHAINE ACTION
>
> **1.** **Valider les quatre décisions ci-dessus** *(familles concernées, cas
> mixte, plafond, accès autorisé)* — **ou les trancher et les CONSIGNER.**
> **2.** **Écrire le test backend d'abord** *(la rupture n°1 se prouve sans
> navigateur)*. **3.** **Puis la couture frontend et ses verrous.**
> **4.** ⛔ **S'ARRÊTER avant tout commit, déploiement ou publication.**
> **5.** **La recette à l'écran — et donc `M3`–`M9` — reste une décision de
> Kyria**, **et exigera une publication de test.**

---

> ## 🛠️ CORRECTIF ÉCRIT le 2026-11-02 — **arbitrages de Kyria appliqués**
>
> **Arbitrages reçus le 2026-11-02**, **et appliqués tels quels** :
> **périmètre = publications CITOYENNES, fil ET profil** ; ⛔ **ne PAS étendre
> aux événements ni aux offres** ; **plafond visible de la grille CONSERVÉ** ;
> **image + vidéo : comportement existant PRÉSERVÉ, limite DOCUMENTÉE** ;
> **mécanisme d'autorisation conservé sur chaque média affiché** ; **aucun
> changement global de présentation mono-photo**.
>
> ### Ce qui a été écrit
>
> | Fichier | Changement |
> |---|---|
> | `backend/app/schemas/feed.py` | **`FeedMediaItem`** *(url + `media_type`)* **et `media_urls: list[FeedMediaItem]` sur `FeedPostItem`** — **champ ADDITIF** : **`media_url` reste exposé, inchangé** |
> | `backend/app/services/feed_post_mapper.py` | **`_media_items(post)`** — **projette la colonne JSONB en CONSERVANT l'ordre**, **écarte les entrées sans URL et les DOUBLONS**, ⛔ **n'invente AUCUN repli depuis `media_url`** |
> | `frontend/packages/types/src/feed.ts` | **`FeedMedia`** et **`media_urls?: FeedMedia[]`** sur `FeedPost` — **optionnel**, **les fixtures antérieures restent valides** |
> | `frontend/apps/web/components/feed/citizen-post-card.tsx` | **passe `mediaUrls`** à la grille existante, **`mediaUrl` restant le repli** |
> | `frontend/apps/web/components/profile/desktop/profile-desktop-publications.tsx` | **grille SEULEMENT si plus d'un média** ; **à une seule photo, la vignette carrée et le cadre compact d'origine sont intacts** |
> | `frontend/apps/web/lib/feed/publication-media-multi.test.tsx` | **10 tests de comportement** *(nouveau)* |
> | `frontend/apps/web/lib/feed/publication-media-multi-wiring.test.ts` | **4 verrous de périmètre et de contrat** *(nouveau)* |
> | `backend/tests/test_feed.py` | **3 tests** *(ordre · vidéo et doublons · liste vide)* |
>
> ⛔ **La grille N'A PAS ÉTÉ ÉCRITE** : **elle existait déjà et n'est pas
> modifiée.** **Le correctif est une COUTURE, pas une construction.**
>
> ### ✅ PREUVES EXÉCUTÉES — **2026-11-02, sur ce poste**
>
> | Contrôle | Résultat |
> |---|---|
> | **`pytest tests/test_feed.py`** — **Docker, base JETABLE** | ✅ **20 passed** *(17 avant, soit EXACTEMENT les 3 ajoutés)* — **base `yunicity_test_7e4792abb322` créée puis SUPPRIMÉE**, **pile arrêtée sans `-v`** *(volumes QA préservés)* |
> | **vitest `lib/feed/publication-media*`** | ✅ **4 fichiers, 41 tests** |
> | **vitest `lib/feed`** *(suite du fil)* | ✅ **28 fichiers, 404 tests** — **aucune régression** |
> | **`tsc --noEmit` web** | ✅ **0 erreur** |
> | **`ruff check app tests`** | ✅ **All checks passed** |
> | **`mypy app`** | ✅ **mon erreur CORRIGÉE** ; ⚠️ **8 erreurs PRÉEXISTANTES subsistent** *(2 fichiers : `volume_bootstrap` — `chown`/`getpwnam` absents sous Windows — et `observability` — `sentry_sdk` non installé localement)* — ⛔ **étrangères à ce diff** |
>
> ⚠️ **TROIS DÉFAUTS DE MA PART, trouvés par ces contrôles et corrigés** :
> **1.** **le test montait `CitizenPostCard` sans `currentUserId`**, **prop
> REQUISE** — **vu par le typecheck, pas par vitest** ; **2.** **mon import
> `FeedMediaItem` cassait le tri du bloc** *(ruff `I001`)* ; **3.** **le
> `media_type` du mapper était un `str` là où le schéma attend un
> `Literal`** *(mypy)*. ⚠️ **Les trois ont échappé aux tests qui passaient
> déjà** : **la leçon de `PROFILE-POST-MENU-01` tient** — **des tests verts ne
> remplacent ni le typecheck ni les linters.**
>
> ### ⚠️ RELEVÉ POUR LA REVUE — **trois limites, aucune corrigée ici**
>
> **1. Au-delà de QUATRE photos, les suivantes ne sont pas ATTEIGNABLES.**
> **Le plafond est conservé, comme demandé** ; **mais le badge « +N » est un
> `<span aria-hidden>` en `pointer-events: none`**, **placé DANS le bouton de
> la quatrième tuile** *(`globals.css:5876`-`5888`)* — **le toucher ouvre la
> QUATRIÈME image, pas la cinquième.** **Et la visionneuse plein écran ne tient
> qu'UN média** *(`feed-media-viewer-session.ts` — ni liste ni navigation)*.
> ⛔ **Rendre les photos 5 à 10 atteignables demanderait une visionneuse EN
> LISTE** : **c'est une ÉVOLUTION à décider**, **pas un effet de bord à
> glisser dans un correctif.** ✅ **Jusqu'à quatre photos — le cas courant —
> chaque tuile ouvre la sienne, dans l'ordre.**
>
> **2. Une VIDÉO est rendue avec l'URL BRUTE**, **sans passer par la
> résolution autorisée** *(`feed-publication-media.tsx:174`-`190`)*. **C'est
> le comportement EXISTANT**, **identique en mono** — ⛔ **rien n'est introduit
> ici.** ⚠️ **Sa limite** : **si cette URL pointe vers
> `/api/v1/story-media/...`, qui exige un porteur** *(`story_media.py:86`-`92`,
> `require_authenticated_user`)*, **elle ne peut pas se charger.** ✅ **Un test
> FIGE cet état** — **sa correction sera une décision, pas un accident.**
>
> **3. Le LETTERBOX s'étend.** **Les tuiles sont en `contain`, pas en
> `cover`** *(voir la CORRECTION consignée au tableau de périmètre)* : ✅ **la
> photo n'est jamais rognée**, ⚠️ **mais chaque cellule à ratio fixe ajoute ses
> bandes.** **`MEDIA-05-PHOTO-LETTERBOX` devient donc PLUS visible, pas
> moins** — **arbitrage produit, toujours hors de ce ticket.**
>
> ### ⛔ CE QUI N'EST PAS PROUVÉ — **et ne peut pas l'être à cette étape**
>
> **Le rendu à l'écran, sur AUCUN palier.** **Le vérifier exige une
> publication multi-photo** — **une ÉCRITURE**, ⛔ **non autorisée à cette
> étape.** **Ce qui est établi SANS écran** : **le fil est un arbre DOM
> unique**, **`ProfileDesktopPublications` est montée par les trois paliers**,
> **et la grille porte DÉJÀ ses trois seuils** *(`globals.css:5823`-`5843` —
> `max-height` distinct en mobile, en 640–1023,98 px et au-delà de 1024 px)*.
> ⚠️ **C'est une déduction de structure, pas une observation.**
>
> ### 📍 ÉTAT après implémentation — **2026-11-02**
>
> | | |
> |---|---|
> | **fichiers applicatifs modifiés** | **5** *(2 backend, 3 frontend)* · **3 fichiers de test** *(2 nouveaux web, 1 étendu backend)* |
> | **commits** | ⛔ **AUCUN** — **consigne tenue** |
> | **déploiement** | ⛔ **AUCUN** · **Preview toujours sur `2ebdbe96`** |
> | **publications** | ⛔ **AUCUNE créée, AUCUNE supprimée** |
> | **documents antérieurs** | ✅ **PRÉSERVÉS** — **aucun commit, aucune désindexation** |
>
> ### ▶️ PROCHAINE ACTION
>
> **1.** **Décision de Kyria sur la limite n°1** *(photos au-delà de la
> quatrième)* : **laisser en l'état et le consigner**, **ou ouvrir une
> évolution « visionneuse en liste »** — ⛔ **hors de ce correctif.**
> **2.** **Revue du diff** *(5 fichiers applicatifs, 3 de test)*.
> **3.** **Recette à l'écran** — **exige une publication multi-photo** :
> ⛔ **à AUTORISER explicitement**, **et le nettoyage est désormais possible**
> *(`PROFILE-POST-MENU-01` clos)*. **4.** **Puis seulement** : **commit,
> déploiement, et décision de fusion** — ⛔ **aucune n'est autorisée à ce
> jour.**

---

> ## 🔭 EXTENSION — **parcours de la visionneuse**, écrit le 2026-11-02
>
> **Demandé par Kyria après le relevé de la limite n°1** : **« À l'ouverture,
> utilise une visionneuse permettant de parcourir toutes les photos dans leur
> ordre, en partant de celle touchée. Prévois précédent/suivant, compteur
> "n / total", commandes tactiles et clavier, fermeture et retour du focus.
> Résous les médias protégés à mesure de leur consultation, sans charger
> inutilement les dix fichiers. »**
>
> ✅ **Le plafond de QUATRE tuiles et le badge « +N » sont INCHANGÉS** :
> **le parcours vit dans la visionneuse, pas dans la grille** — **c'est ce qui
> permet de garder le plafond intact tout en rendant les photos atteignables.**
>
> ### Ce qui a été écrit
>
> | Fichier | Changement |
> |---|---|
> | `lib/feed/feed-media-viewer-session.ts` | **`items` ORDONNÉS + `index`** sur la session · **`goToFeedMediaViewerIndex`** — **borne sans boucler** · **le blob d'ouverture est RELÂCHÉ au premier déplacement** : **il n'appartient qu'à la tuile touchée** |
> | `components/feed/mobile/feed-mobile-media-viewer.tsx` | **précédent / suivant** *(44 px, désactivés aux bornes)* · **compteur « n / total »** en **`role="status"` `aria-live="polite"`** · **flèches clavier** · **balayage tactile** *(seuil 48 px, horizontal strict)* |
> | `components/feed/feed-media-viewer-host.tsx` | **branche le parcours** — **le rang est RELU dans le magasin, jamais capturé** *(pas de fermeture obsolète)* |
> | `components/feed/feed-publication-media.tsx` | **les tuiles ouvrent la LISTE à l'index touché** · ⛔ **les VIDÉOS en sont EXCLUES** |
>
> ⛔ **Échap, le piège de focus et le RETOUR du focus ne sont PAS réécrits** :
> **ils appartiennent au dialogue** *(`OverlayPanel`, `restoreFocus`)*. **Les
> redoubler aurait créé deux pièges concurrents.** ✅ **L'hôte est monté dans
> `app/layout.tsx`** — **à la racine** : **les tuiles du PROFIL ouvrent la
> même visionneuse, sans montage supplémentaire.**
>
> ### ✅ PREUVES — **10 tests, dont le lot de DIX photos**
>
> | # | Ce qui est prouvé |
> |---|---|
> | **1** | **quatre tuiles, badge « +6 », et SIX photos jamais chargées** — **le plafond tient ET rien d'invisible n'est payé** |
> | **2** | **la CINQUIÈME est atteinte depuis la quatrième tuile**, **et résolue À CET INSTANT** — **pas à l'ouverture de la grille** |
> | **3** | **la DERNIÈRE est atteinte au clavier** ; **les six photos cachées sont résolues DANS L'ORDRE, une seule fois chacune** |
> | **4** | **retour en arrière** · **bornes respectées** *(« précédent » désactivé au rang 1, la flèche ne déborde pas)* |
> | **5** | **le compteur est ANNONCÉ sans voler le focus** *(`role="status"`)* |
> | **6** | **UNE seule photo : aucune commande, aucun compteur** — **non-régression mono** |
> | **7** | **la VIDÉO n'entre PAS dans le parcours** — **« 1 / 2 » sur une publication photo+vidéo+photo** |
> | **8** | **la fermeture REND le focus à la tuile touchée** |
> | **9** | **un ÉCHEC de chargement s'affiche** *(état `error` + réessai)*, **le rang reste juste, et la photo suivante se charge** |
> | **10** | **une réponse EN RETARD ne s'affiche PAS à la place de la courante** — **trois déplacements enchaînés, la 5e répond alors qu'on est sur la 7e** |
>
> **Pourquoi mesurer par les APPELS RÉSEAU** : **un média protégé n'atteint
> l'écran qu'après sa résolution authentifiée.** **Compter les appels, et leur
> ORDRE, prouve à la fois le parcours et la règle « résoudre à mesure » —
> ce qu'aucune assertion de DOM ne montrerait.**
>
> ### ✅ CONTRÔLES — **2026-11-02**
>
> | Contrôle | Résultat |
> |---|---|
> | **`tsc --noEmit` web** | ✅ **0 erreur** *(tests 9 et 10 inclus)* |
> | **lint frontend** | ✅ **0 erreur** |
> | **vitest `lib/feed`** | ✅ **29 fichiers, 414 tests** |
> | **`next build`** | ✅ **réussi** |
> | **`mypy app tests` — DANS LE CONTENEUR DU DÉPÔT** | ✅ **`Success: no issues found in 713 source files`** |
> | **`ruff check .` — même conteneur** | ✅ **All checks passed** |
> | **`pytest tests/test_feed.py` — Docker, base jetable** | ✅ **20 passed** *(mesuré plus haut, inchangé depuis)* |
>
> > ### ⚠️ CORRECTION CONSIGNÉE — **les « 8 erreurs mypy préexistantes » n'existent PAS dans l'environnement du dépôt**
> >
> > **Une rédaction antérieure de cette passation et de l'index notait :
> > « mypy → mon erreur corrigée, 8 préexistantes subsistent ».** **C'était un
> > relevé fait SOUS WINDOWS, hors de l'environnement prévu.**
> >
> > ✅ **Vérifié le 2026-11-02 dans le conteneur `backend-qa`, avec
> > l'invocation EXACTE de la CI** *(`mypy app tests`, `backend-ci.yml:56`)* :
> > **`Success: no issues found in 713 source files`.**
> >
> > **Les 8 messages venaient donc de la PLATEFORME, et non du code** :
> > **`os.chown` / `pwd.getpwnam` n'existent pas sous Windows**, **et
> > `sentry_sdk` n'est pas installé sur ce poste.** ⛔ **Ils ne doivent plus
> > être consignés comme une dette du dépôt** — **l'ancienne lecture est
> > conservée ici, corrigée, et non effacée** *(règle 15)*.
>
> ### ⚠️ LIMITES — **mesurées, assumées, non corrigées**
>
> **1. Une photo qui est AUSSI une tuile visible est résolue une SECONDE fois**
> **quand on la consulte dans la visionneuse** *(test 7 : `[photo-1, photo-2,
> photo-2]`)*. **Le blob d'une tuile lui appartient** ; **seul celui du média
> TOUCHÉ est partagé à l'ouverture.** ✅ **Le coût est d'UN appel par
> déplacement** — ⛔ **jamais d'un préchargement des dix, qui est la dépense
> que la consigne écarte.** **Un cache partagé par URL de média toucherait la
> PROPRIÉTÉ des blobs** *(MEDIA-01B, registre à compteur de références)* :
> **c'est une décision à part, non prise ici.**
>
> **2. La VIDÉO reste HORS du parcours**, **et son rendu garde sa limite
> documentée** — **URL brute, hors résolution autorisée, donc impossible à
> charger si elle pointe vers la route authentifiée.** ⛔ **Rien n'a été
> retouché côté vidéo** *(consigne de Kyria)*, **et son fonctionnement n'est
> PAS présenté comme validé.**
>
> **3. Le LETTERBOX est INCHANGÉ** — **aucun cadre n'a été modifié.**
>
> **4. ⛔ Le rendu à l'écran n'est TOUJOURS pas prouvé**, **sur aucun palier** :
> **il exige une publication multi-photo**, **donc une ÉCRITURE non autorisée.**
> **Le balayage tactile, en particulier, n'a été éprouvé qu'en jsdom** —
> ⚠️ **un `touchend` simulé n'est pas un doigt sur Safari iPhone.**
>
> ### 📍 ÉTAT — **2026-11-02, après extension**
>
> | | |
> |---|---|
> | **fichiers applicatifs modifiés** | **9** — **2 backend** *(`schemas/feed.py`, `feed_post_mapper.py`)* **et 7 frontend** *(types, carte citoyenne, publications du profil, média de publication, visionneuse, hôte, session)* |
> | **fichiers de test** | **3 nouveaux web** *(comportement, verrous, parcours)* **et 1 backend étendu** |
> | **commits · déploiement · publications** | ⛔ **AUCUN, AUCUN, AUCUNE** |
> | **documents antérieurs** | ✅ **PRÉSERVÉS** |
>
> ### ▶️ PROCHAINE ACTION
>
> **1.** **Revue du diff** — **9 fichiers applicatifs, 4 de test.**
> **2.** ⛔ **Recette à l'écran** : **exige une publication multi-photo** —
> **à AUTORISER explicitement** ; **le nettoyage est désormais possible**
> *(`PROFILE-POST-MENU-01` clos)*. ⚠️ **Y éprouver EN PRIORITÉ le BALAYAGE
> TACTILE sur Safari iPhone réel** — **c'est le geste que jsdom ne prouve
> pas.** **3.** **Puis seulement** : **commit, déploiement, décision de
> fusion** — ⛔ **aucune n'est autorisée à ce jour.**

---

> ## 🔍 REVUE DU DIFF ET CORRECTIONS — **2026-11-02**
>
> **Revue menée au format `05-code-review`**, **puis corrections demandées par
> Kyria et appliquées.** ⛔ **Toujours AUCUN commit, AUCUNE poussée, AUCUN
> déploiement, AUCUNE publication.** ✅ **Documents antérieurs PRÉSERVÉS.**
>
> ### Ce que la revue a trouvé — **aucun défaut de sécurité, aucune perte de données**
>
> **Deux points vérifiés là où une erreur se serait cachée**, **et tous deux
> JUSTES** : **le chemin d'écriture pose bien `media_url = media_items[0].url`**
> *(`post_composer_mapper.py:124`)*, **donc le seuil du profil ne peut pas
> laisser une photo sans rendu** ; **et le compte retain/release des blobs
> reste ÉQUILIBRÉ à la navigation** *(l'ouvreur relâche le sien, l'effet de la
> visionneuse le sien, celui de la tuile survit)*.
>
> ### ✅ Corrections APPLIQUÉES
>
> | # | Ce qui a changé | Pourquoi |
> |---|---|---|
> | **1** | **Le verrou de périmètre ne lit PLUS de source backend** — **le bloc `contrat du fil` est SUPPRIMÉ** | **Il lisait `feed_post_mapper.py` et `schemas/feed.py` depuis la suite vitest**, **qui ne tourne qu'au déclencheur `frontend/**`** : **un changement BACKEND seul l'aurait cassé sans qu'AUCUN job du dépôt ne le joue** — **rouge sur `main`, sans PR rouge.** ✅ **Zéro perte** : **les 3 pytest prouvent déjà ces propriétés PAR LE COMPORTEMENT** |
> | **2** | **Identifiants neufs en ANGLAIS** *(11 déclarations applicatives + l'outillage des tests)* | **Convention du dépôt et rule 00** : **commentaires en français, code en anglais.** **Les commentaires n'ont pas bougé** |
> | **3** | **Le rang d'une tuile est pris à sa POSITION**, **plus par `indexOf(url)`** | **Deux tuiles d'un même fichier partageaient le rang de la PREMIÈRE occurrence**, **et la seconde ouvrait le parcours au mauvais endroit.** **Inatteignable par l'API** *(le mapper dédoublonne)*, **atteignable par le harnais E2E** |
> | **4** | **Aux bornes : `aria-disabled`, et NON `disabled`** | **`disabled` retire le bouton de l'ordre de tabulation** : **atteindre la première ou la dernière photo au clavier faisait retomber le focus sur `<body>`.** ⚠️ **L'action est RÉELLEMENT empêchée** — **par la garde unique du déplacement**, **qui refuse l'appel quelle que soit l'origine du geste** *(clic, flèche, balayage)*, **et non par l'attribut** |
> | **5** | **Au profil, la grille est réservée aux lots de PHOTOS SEULES** | **La présentation d'origine du profil ne rendait JAMAIS de vidéo.** **Un lot MIXTE y aurait introduit une tuile `<video src={URL brute}>`** — **hors résolution autorisée** : **la limite vidéo aurait gagné une surface.** **Un lot mixte garde donc le comportement ANTÉRIEUR.** **Le `media_type` est le signal premier, l'URL est contrôlée en second** |
>
> **Tests ajoutés pour ces changements** : **lot mixte au profil** · **`media_type`
> contredisant son fichier** · **deux tuiles d'un même fichier** · **borne haute**
> *(en plus de la borne basse, réécrite)*. **Bilan vitest du ticket** :
> **12 tests de comportement**, **11 de parcours**, **2 verrous de périmètre.**
>
> ### ✅ CONTRÔLES — **2026-11-02, APRÈS corrections**
>
> | Contrôle | Résultat |
> |---|---|
> | **vitest `lib/feed`** | ✅ **29 fichiers, 415 tests** |
> | **`tsc --noEmit` web** | ✅ **0 erreur** |
> | **lint frontend** *(`turbo run lint --filter=web`)* | ✅ **0 erreur** — ⚠️ **avertissements PRÉEXISTANTS subsistent**, **AUCUN sur un fichier de ce diff** |
> | **`pnpm build`** *(invocation de la CI)* | ✅ **6 tâches réussies** |
> | **pytest · mypy · ruff** | ⛔ **NON rejoués** — ✅ **et leurs preuves TIENNENT** : **le backend n'a pas changé d'une ligne depuis leur exécution** *(vérifié : `git diff --stat -- backend/` = les 170 insertions d'origine, à l'identique)* |
>
> ⚠️ **UN défaut de ma part, trouvé par ces contrôles** : **un identifiant
> renommé à moitié** *(`fireEvent.click(tuile)` laissé derrière un `const tile`)*
> — **vu par vitest.** ⚠️ **Et un test qui mesurait une COURSE plutôt qu'un
> comportement** : **le dialogue prend son focus initial dans une frame
> d'animation**, **et le reprenait au milieu du scénario de borne.** **Le test
> attend désormais ce focus initial avant de déplacer le focus lui-même** —
> ⛔ **ce n'était PAS un défaut du correctif**, **et le code n'a pas été
> changé pour faire passer le test.**
>
> ### ⚠️ Relevé, NON corrigé — **et pourquoi**
>
> **Une seule ligne vide sépare le dernier test préexistant du premier test
> ajouté dans `backend/tests/test_feed.py`**, **là où PEP 8 en attend deux**
> *(ruff ne l'applique pas ; le reste du fichier si)*. ⛔ **Non corrigé
> DÉLIBÉRÉMENT** : **toucher au backend invaliderait les preuves pytest, mypy
> et ruff**, **qui exigent Docker pour être rejouées.** **Le coût dépasse le
> gain** — **à reprendre avec la prochaine modification backend.**
>
> ### ⚠️ CORRECTION CONSIGNÉE — **l'indépendance des deux commits est DÉDUITE, pas VÉRIFIÉE**
>
> **Une rédaction antérieure de ce bilan affirmait : « chacun est vert
> isolément ».** ⛔ **C'était trop fort.** **Aucun des deux commits n'a été
> construit ni éprouvé SÉPARÉMENT** : **les contrôles ci-dessus portent tous
> sur l'arbre de travail COMPLET.**
>
> **Ce qui est réellement établi est une DÉDUCTION par lecture des
> dépendances** : **la prop `mediaUrls` et la grille PRÉEXISTAIENT au diff**
> *(donc le commit 1 ne dépend de rien du commit 2)*, **et les quatre fichiers
> du parcours bougent ENSEMBLE** *(donc le commit 2 est cohérent)*. ⚠️ **Une
> déduction de structure, exactement comme pour le rendu à l'écran.** **La
> vérifier demanderait de construire chaque commit et de jouer les contrôles
> sur chacun** — **non fait.**
>
> ### ⛔ CE QUI N'EST TOUJOURS PAS PROUVÉ
>
> **Le rendu à l'écran, sur AUCUN palier** — **inchangé par cette revue.**
> ⚠️ **Le BALAYAGE TACTILE en particulier n'est éprouvé qu'en jsdom.**
>
> ### 📍 ÉTAT — **2026-11-02, après revue**
>
> | | |
> |---|---|
> | **fichiers applicatifs modifiés** | **9** *(2 backend, 7 frontend)* · **4 de test** *(3 nouveaux web, 1 backend étendu)* |
> | **commits · poussée · déploiement · publications** | ⛔ **AUCUN, AUCUNE, AUCUN, AUCUNE** · **Preview toujours sur `2ebdbe96`** |
> | **index Git** | ✅ **VIDE** — **rien n'est indexé** |
> | **documents antérieurs** | ✅ **PRÉSERVÉS** — **6 suivis modifiés et les non suivis, intacts et non indexés** |
> | **commits préparés** | **2**, **dans un script NON EXÉCUTÉ** *(chemin au bilan de session)* |
>
> ### ▶️ PROCHAINE ACTION
>
> **1.** **Décision de Kyria sur le périmètre à commiter** *(2 commits code
> seul)* **et sur le sort de CE document**, **toujours NON SUIVI** —
> **le commit `2ebdbe96` l'avait écarté comme « document mélangeant des
> sessions antérieures »**, **et ce choix est reconduit par défaut** :
> ⚠️ **l'index commité n'annoncera donc pas ce ticket.**
> **2.** ⛔ **Recette à l'écran** : **exige une publication multi-photo** —
> **à AUTORISER explicitement**. ⚠️ **Y éprouver EN PRIORITÉ le BALAYAGE
> TACTILE sur Safari iPhone réel.**
> **3.** **Puis seulement** : **commit, déploiement, décision de fusion.**

---

> ## ✅ COMMITS, POUSSÉE ET CI — **2026-11-02**
>
> **Autorisé par Kyria le 2026-11-02** : **les deux commits de code avec les
> chemins listés**, **puis la poussée de la branche de travail.**
> ⛔ **Explicitement EXCLUS, et tenus** : **aucune fusion vers `main`**,
> **aucune poussée vers la branche Preview**, **aucun déploiement**, **aucune
> publication de test.**
>
> ### Commits
>
> | SHA | Message | Fichiers |
> |---|---|---|
> | **`6aa7cbc9`** | `fix(feed,profile): restituer toutes les photos d'une publication` | **8** — **3 backend** *(schéma, mapper, tests)* · **5 frontend** *(types, carte citoyenne, publications du profil, 2 tests)* |
> | **`2d32fb77`** | `feat(feed): parcourir toutes les photos dans la visionneuse` | **5** — **session, hôte, visionneuse, média de publication, 1 test** |
>
> **Branche** : **`fix/mobile-publishing-p0`** — **poussée en avance rapide**
> *(`2ebdbe96..2d32fb77`)*. ✅ **Les chemins commités sont EXACTEMENT ceux
> autorisés** *(vérifié par `git show --stat` sur chaque commit)*.
>
> ### PR
>
> **PR #203**, **DÉJÀ existante et toujours en BROUILLON** —
> **`fix/mobile-publishing-p0` → `main`** :
> https://github.com/Kyria-Zaire/yunicity.review/pull/203
> ✅ **Aucun doublon créé** *(vérifié : une seule PR sur cette branche, tous
> états confondus)*. **Description ACTUALISÉE** : **le correctif multi-photo
> est ajouté**, **et les vérifications de `PROFILE-POST-MENU-01` sont
> CONSERVÉES telles quelles**, **datées de leur SHA `fcc63538`.**
> ⚠️ **Le TITRE de la PR ne nomme que le premier ticket** — **conservé tel
> quel pour ne pas rompre les références ; à trancher si cela gêne.**
>
> ### ✅ CI sur `2d32fb77` — **quatre contrôles verts, UN rouge**
>
> | Contrôle | Résultat | Détail mesuré dans le journal |
> |---|---|---|
> | **Backend CI** | ✅ **success** *(1 min 36)* | **ruff : All checks passed** · **mypy : Success, 713 fichiers** · **pytest : 926 passed, 1109 skipped** |
> | **Frontend CI** | ✅ **success** *(4 min 51)* | **lint, typecheck, test, build tous verts** · **web : 96 fichiers, 981 tests** — **soit +3 fichiers et +25 tests par rapport aux 93 / 956 de `fcc63538`**, **exactement les trois fichiers ajoutés** *(12 + 11 + 2)* |
> | **Docker CI** | ✅ **success** *(15 min 32)* | — |
> | **Lint agent rules** | ✅ **success** *(31 s)* | — |
> | **PR Safety Checks** | ❌ **failure** *(40 s)* | **`Gitleaks` ✅** · **`Forbidden paths & artifacts` ✅** · ❌ **`Dependency audit`** |
>
> > ### ⛔ L'AUDIT DES DÉPENDANCES EST ROUGE — **et ce n'est PAS une CI entièrement verte**
> >
> > **Un seul job échoue**, **à une seule étape** : **`osv-scanner (frontend,
> > gate on High/Critical)`** — **21 vulnérabilités High/Critical (CVSS ≥ 7)**
> > dans les dépendances frontend : **`next@15.5.25`** *(CVSS 9.5 et 8.2)*,
> > **`node-forge@1.4.0`** *(6 avis)*, **`undici`** *(3 versions)*,
> > **`vite@7.3.5`**, **`decode-uri-component@0.2.2`**.
> >
> > ✅ **PRÉEXISTANT et INCHANGÉ** : **le SHA précédent `2ebdbe96`**
> > *(2026-10-31)* **échouait au MÊME job, à la MÊME étape, avec le MÊME
> > compte de 21** *(vérifié journal contre journal)*. ⛔ **Et ces deux
> > commits ne touchent AUCUN fichier de dépendances** — **ni `package.json`,
> > ni lockfile** *(visible dans les listes de fichiers ci-dessus)*.
> >
> > ⛔ **Cet échec n'est donc ni causé ni résolu par ce ticket**, **et il ne
> > doit PAS être présenté comme réglé.** **C'est un sujet SÉPARÉ, à ouvrir
> > comme tel** *(mise à jour de dépendances — zone rouge : `next` est le
> > cadre de l'application entière)*.
>
> ### 📍 ÉTAT — **2026-11-02, après poussée**
>
> | | |
> |---|---|
> | **commits** | **2** · **`6aa7cbc9`** et **`2d32fb77`** |
> | **branche distante** | ✅ **à jour** — **`origin/fix/mobile-publishing-p0` = `2d32fb77`** |
> | **fusion vers `main`** | ⛔ **AUCUNE** |
> | **Preview** | ⛔ **AUCUNE poussée, AUCUN déploiement** — **toujours sur `2ebdbe96`** |
> | **publications de test** | ⛔ **AUCUNE créée, AUCUNE supprimée** |
> | **documents antérieurs** | ✅ **PRÉSERVÉS** — **38 modifications documentaires** *(6 suivies, 32 non suivies)*, **intactes et NON indexées** |
> | **ce document** | ⚠️ **TOUJOURS NON SUIVI** — **conservé localement**, **sa mise en historique est traitée SÉPARÉMENT** *(décision de Kyria)* |
>
> ### ▶️ PROCHAINE ACTION
>
> **1.** ⛔ **Recette à l'écran** — **le seul vrai manque** : **exige une
> publication multi-photo**, **donc une écriture à AUTORISER explicitement.**
> ⚠️ **Y éprouver EN PRIORITÉ le BALAYAGE TACTILE sur Safari iPhone réel** —
> **c'est le geste que jsdom ne prouve pas.**
> **2.** **Décision sur l'audit des dépendances** — **sujet séparé**, **zone
> rouge** *(`next` 9.5)*.
> **3.** **Puis seulement** : **sortie du brouillon, décision de fusion.**
> ⛔ **Aucune n'est autorisée à ce jour.**

---

> ## 🚀 DÉPLOIEMENT PREVIEW — **2026-11-02**, **`2d32fb77` EN LIGNE**
>
> **Autorisé par Kyria le 2026-11-02** : **déploiement Preview de
> `2d32fb77f46be970d7919c166872a8ebef1f36a1`**, **en ACCEPTANT POUR CETTE
> ÉTAPE la réserve documentée sur l'audit des dépendances** *(§CI ci-dessus —
> ⛔ **la réserve n'est pas levée, elle est assumée**)*.
> ⛔ **Toujours EXCLUS, et tenus** : **aucune fusion vers `main`**, **aucune
> publication de test.**
>
> ### Poussée — **avance rapide VÉRIFIÉE AVANT, sans `--force`**
>
> **Contrôle préalable** : **`git merge-base --is-ancestor
> origin/feat/c3-videos-refonte-final 2d32fb77`** → ✅ **la cible était à
> `2ebdbe96`**, **ancêtre direct.** **La poussée n'ajoute donc QUE les deux
> commits du ticket** — ⛔ **aucune réécriture d'historique, aucun `--force`.**
>
> **Résultat** : **`2ebdbe96..2d32fb77` → `feat/c3-videos-refonte-final`**
> *(avance rapide, sans préfixe `+`)*.
>
> | Ref distante | SHA |
> |---|---|
> | **`feat/c3-videos-refonte-final`** *(Preview)* | **`2d32fb77`** |
> | **`fix/mobile-publishing-p0`** *(travail)* | **`2d32fb77`** |
> | **`main`** | **`3e0b27ba`** — ⛔ **AUCUNE fusion** *(vérifié par `merge-base --is-ancestor`)* |
>
> ### ✅ Les DEUX services Preview en SUCCESS — **SHA actif RELU**
>
> **Projet Railway `dazzling-wisdom`**, **environnement `production`.**
> **Relevé par `railway status --json`**, **APRÈS l'attente** — **et non par
> continuité** :
>
> | Service | Statut | SHA ACTIF | `deploymentStopped` | Déploiement |
> |---|---|---|---|---|
> | **`yunicity.review`** | ✅ **SUCCESS** | **`2d32fb77`** | **False** | `d43fe4ce-0466-4b57-b19b-1cff6059c8a0` |
> | **`unified-media-preview`** | ✅ **SUCCESS** | **`2d32fb77`** | **False** | `d74db860-8a8f-4b82-a442-1bd0cd3d48d4` |
> | `postgis-preview` · `redis-preview` | ✅ SUCCESS | *(sans branche)* | False | inchangés |
>
> ✅ **Les anciens déploiements sur `2ebdbe96` ont QUITTÉ la liste active** :
> **chaque service ne porte plus qu'UN déploiement actif, sur `2d32fb77`.**
>
> ### ✅ CONFIRMATION — **relevé À NOUVEAU, et les domaines VÉRIFIÉS**
>
> **Demandé par Kyria le 2026-11-02**, **qui observait encore le web en
> attente.** **Nouveau relevé `railway status --json`** : ✅ **les DEUX
> services TOUJOURS en SUCCESS, actifs sur `2d32fb77`**, **mêmes
> identifiants de déploiement** — ⛔ **aucun nouveau déploiement n'est
> parti depuis.**
>
> | Service | Domaine *(champ `customDomains`)* | Rôle | Statut |
> |---|---|---|---|
> | **`yunicity.review`** | **`preview.yunicity.city`** | **web** | ✅ **SUCCESS** · `2d32fb77` |
> | **`unified-media-preview`** | **`api-preview.yunicity.city`** | **API** | ✅ **SUCCESS** · `2d32fb77` |
>
> **Domaines de service** : `yunicityreview-production-97c7.up.railway.app`
> *(web)* · `unified-media-preview-production.up.railway.app` *(API)*.
>
> > ⚠️ **CORRECTION CONSIGNÉE** : **une rédaction antérieure de cette section
> > annonçait `preview.yunicity.city` comme le web et
> > `api-preview.yunicity.city` comme l'API**, **mais ces noms avaient été
> > extraits par expression régulière sur la réponse ENTIÈRE** — ⛔ **la
> > correspondance domaine → service n'était PAS établie.** ✅ **Elle l'est
> > désormais**, **lue dans le champ `customDomains` de chaque service.**
> > **L'attribution était correcte** ; **c'est sa PREUVE qui manquait.**
>
> ### ✅ Les deux surfaces RÉPONDENT — **et c'est distinct de « SUCCESS »**
>
> **Un déploiement SUCCESS dit que la construction et le démarrage ont
> abouti** ; **il ne dit pas que la page répond.** **Contrôle en lecture
> seule, `2026-11-02`** :
>
> | Requête | Résultat |
> |---|---|
> | `GET https://preview.yunicity.city/` | ✅ **HTTP 200** *(0,38 s)* |
> | `GET https://api-preview.yunicity.city/api/v1/health` | ✅ **HTTP 200** *(0,52 s)* |
>
> **Le web était donc bien EN LIGNE** : **son déploiement a terminé à
> 12:44:17** *(observé BUILDING à 12:43:16)*, **et l'attente constatée côté
> Kyria portait sur un état antérieur à cette bascule.**
>
> > ### ⚠️ DÉFAUT D'OUTILLAGE CONSIGNÉ — **une fenêtre de surveillance SANS RELEVÉ**
> >
> > **Mon premier script d'attente n'a RIEN surveillé.** **Il appelait
> > `railway` par son nom** ; **sous Windows, npm pose un shim SANS extension
> > que `CreateProcess` ne sait pas exécuter.** **Le script est mort à la
> > première seconde sur `FileNotFoundError`**, **et le code de sortie 0
> > rapporté venait de l'`echo` qui suivait, pas de lui.**
> >
> > ✅ **Corrigé** *(`railway.cmd`, chemin complet)*, **et éprouvé sur trois
> > relevés successifs avant d'être relancé.**
> >
> > ⚠️ **Conséquence FACTUELLE, à ne pas combler par déduction** : **aucun
> > relevé n'existe pour l'intervalle 11:38 → 12:40.** ⛔ **On ne peut donc
> > PAS dire à quel moment `unified-media-preview` est passé en SUCCESS** —
> > **seulement qu'il l'était à 12:40:39.** **`yunicity.review` est, lui,
> > observé BUILDING à 12:43:16 puis SUCCESS à 12:44:17.** **Les builds
> > tournaient pendant la panne du script** : **rien n'est perdu, mais la
> > chronologie du premier service est INCONNUE.**
>
> ### 📍 ÉTAT — **2026-11-02, après déploiement**
>
> | | |
> |---|---|
> | **Preview** | ✅ **`2d32fb77`** — **les DEUX services SUCCESS**, **SHA relu** |
> | **fusion vers `main`** | ⛔ **AUCUNE** — **`main` reste à `3e0b27ba`** |
> | **publications de test** | ⛔ **AUCUNE créée, AUCUNE supprimée** |
> | **PR #203** | **toujours en BROUILLON** |
> | **audit des dépendances** | ⚠️ **TOUJOURS ROUGE** — **réserve ASSUMÉE pour cette étape, NON levée** |
> | **documents antérieurs** | ✅ **PRÉSERVÉS** — **38 modifications, intactes et non indexées** |
> | **ce document** | ⚠️ **TOUJOURS NON SUIVI**, **conservé localement** |
>
> ### ▶️ PROCHAINE ACTION — **la recette, À FAIRE AVEC KYRIA**
>
> ⛔ **ARRÊT AVANT LA RECETTE** — **consigne tenue.** **Kyria a annoncé la
> mener ENSEMBLE, EN COMMENÇANT AU DESKTOP.**
>
> **Ce que la recette doit établir, et qu'AUCUNE preuve ne couvre à ce jour** :
> **1.** **Publier une publication MULTI-PHOTO** — **l'écriture n'a jamais été
> jouée** *(`M3`–`M9`)*. **2.** **Vérifier que TOUTES les photos reviennent
> APRÈS RECHARGEMENT**, **sur desktop, medium et mobile.** **3.** ⚠️ **Le
> BALAYAGE TACTILE sur Safari iPhone RÉEL** — **le seul geste que jsdom ne
> prouve pas**, **et donc la PRIORITÉ du palier mobile.** **4.** **Le
> parcours au-delà de la quatrième tuile** *(badge « +N » → cinquième photo)*.
> **5.** **Le lot MIXTE au profil** — **doit garder la vignette d'origine**,
> ⛔ **sans tuile vidéo.**
>
> **Nettoyage** : **désormais POSSIBLE à l'écran sur les trois paliers**
> *(`PROFILE-POST-MENU-01`, en ligne sur cette Preview)*.

---

> ## ✅ RECETTE ACQUISE — **2026-11-02**, **le rendu à l'écran n'est PLUS une déduction**
>
> **Menée par Kyria sur la Preview `2d32fb77`.** ⛔ **La réserve « aucune
> preuve d'écran, sur aucun palier », portée depuis l'ouverture du ticket,
> est LEVÉE sur les points ci-dessous** — **et sur ceux-là seulement.**
>
> | Ce qui est PROUVÉ À L'ÉCRAN | Palier |
> |---|---|
> | **Les CINQ photos sont accessibles** — **au fil ET au profil** | **desktop et medium** |
> | **Les cinq sont retrouvées APRÈS RECHARGEMENT** | **fil desktop** |
> | **Le BALAYAGE tactile fonctionne** — **le geste que jsdom ne prouvait pas** | **fil, Safari iPhone RÉEL** |
>
> ✅ **L'objectif énoncé du ticket est donc atteint** : **sélectionner
> plusieurs photos, publier, et les RETROUVER après rechargement.**
> ⚠️ **Le ticket reste OUVERT** : **deux reprises demandées par Kyria**
> *(fluidité, présentation)*, **et la publication « Test multi-photo à
> supprimer » est CONSERVÉE pour la prochaine recette** — ⛔ **ne pas la
> supprimer.**
>
> ### ❌ DEUX DÉFAUTS OBSERVÉS — **une SEULE cause, trouvée dans le code**
>
> **Observés par Kyria sur les DEUX surfaces** : **un voile gris couvrant
> TOUTE la mosaïque**, **et un « +1 » affiché EN DOUBLE.**
>
> **Cause unique** : **DEUX éléments portent la classe
> `.publication-media-grid__overflow`** —
> **1.** **un badge rendu par `PublicationMediaGrid` comme enfant DIRECT du
> conteneur de grille** *(`publication-media-grid.tsx`)* ;
> **2.** **un second rendu DANS la quatrième tuile**
> *(`feed-publication-media.tsx`)*.
>
> **Or cette classe est `position: absolute; inset: 0` avec
> `background: rgb(0 0 0 / 0.45)`** *(`globals.css:5876`-`5888`)*, **et
> `.publication-media-grid` est `position: relative`** *(`:5823`)*. **Le
> badge de NIVEAU GRILLE couvre donc l'intégralité de la mosaïque d'un voile
> à 45 %**, **et y centre son « +1 »** — **pendant que la quatrième tuile
> affiche le sien.** ✅ **Les deux symptômes s'expliquent par ce seul
> élément**, **et disparaissent avec le remplacement de la mosaïque par le
> carrousel** — ⛔ **pas par un masquage.**
>
> ⚠️ **Ces deux défauts PRÉEXISTAIENT au ticket** : **les deux badges
> existaient avant `6aa7cbc9`.** **Ils n'étaient simplement atteints par
> AUCUNE surface de production** — **seul le harnais E2E voyait la grille.**
> **Le ticket ne les a pas créés : il les a RÉVÉLÉS.**
>
> ### ⏱️ MESURE DES TROIS PHASES — **banc local, 2026-11-02**
>
> **Chromium réel**, **vraies photos JPEG aux dimensions d'un téléphone**,
> **servies avec les en-têtes EXACTS de la production**
> *(`Cache-Control: private, no-store`)*, **en reproduisant la séquence du
> client** : **`GET` porteur → `response.blob()` → `createObjectURL` →
> `img.decode()`**. **Banc conservé hors dépôt** *(scratchpad de session)*.
>
> | Photo | Taille | Attente serveur | Transfert | **Décodage** | Total | Cache |
> |---|---|---|---|---|---|---|
> | 1280×960 | 0,72 Mo | 2,4 ms | 2,6 ms | **29 ms** | 45 ms | **non** |
> | 3024×4032 | 6,39 Mo | 6,2 ms | 13,5 ms | **148 ms** | 171 ms | **non** |
> | 4032×3024 | 11,57 Mo | 9,8 ms | 23 ms | **201 ms** | 243 ms | **non** |
>
> **Chaque photo est mesurée DEUX fois** : ✅ **la seconde passe ne vient
> JAMAIS du cache** — **`no-store` est honoré, le fichier est retéléchargé
> en entier.** **Mesuré, pas supposé.**
>
> ⛔ **CE QUE CE BANC NE PROUVE PAS** : **le transfert est en LOCALHOST.**
> **Il ne vaut RIEN comme preuve du réseau de la Preview.** **La TAILLE,
> elle, est mesurée** — **et 6 Mo sur un lien mobile à 5–20 Mbit/s donnent
> 2,4 à 9,6 s.** ⚠️ **C'est un MODÈLE arithmétique, pas une mesure** ;
> **c'est seulement le seul terme de l'ordre de grandeur observé (~3 s).**
> **Le décodage, lui, ne l'explique pas** *(150–200 ms)*.
>
> > ### ⚠️ CORRECTION CONSIGNÉE — **mon premier diagnostic CONFONDAIT poids et réutilisation**
> >
> > **J'avais écrit : « trois mécanismes indépendants empêchent toute
> > réutilisation »**, **en rangeant parmi eux « aucun redimensionnement ».**
> > ⛔ **C'est FAUX, et Kyria l'a corrigé.**
> >
> > **Servir l'original ALOURDIT le transfert** — **il ne l'empêche pas
> > d'être réutilisé.** **Ce sont deux axes DISTINCTS** :
> >
> > | Axe | Ce qui le détermine |
> > |---|---|
> > | **POIDS de chaque transfert** | **l'absence de variante redimensionnée** — **l'originale du téléphone, jusqu'à 20 Mo** |
> > | **RÉUTILISATION d'un transfert déjà payé** | **`no-store`** *(cache HTTP)* **et le RELÂCHEMENT du blob au déplacement** *(mémoire client)* |
> >
> > ✅ **Il n'y a donc que DEUX mécanismes de non-réutilisation**, **pas
> > trois.** **Le troisième fait est réel mais répond à une AUTRE question.**
> > **La confusion aurait mené à traiter la taille comme un problème de
> > cache** — **l'ancienne lecture est conservée ici, corrigée, non
> > effacée** *(règle 15)*.
>
> ### 📐 PÉRIMÈTRE ÉLARGI — **décision de Kyria, 2026-11-02**
>
> **Trois chantiers entrent dans `MEDIA-MULTI-PHOTO-01`** :
>
> | # | Chantier | Contrainte énoncée |
> |---|---|---|
> | **1** | **Variantes d'image CÔTÉ SERVEUR** | **conserver les originaux ET les autorisations existantes** · **une variante pour la publication, une pour la visionneuse** · **compatibles avec les publications DÉJÀ présentes** · ⛔ **aucun changement aux vidéos** |
> | **2** | **Réutilisation TEMPORAIRE des médias** | ⛔ **NE PAS toucher globalement à `no-store`** — **distinguer le cache HTTP de la conservation temporaire des blobs dans une session autorisée** · **priorité au média COURANT, préchargement voisin BORNÉ ensuite** |
> | **3** | **CARROUSEL dans la publication** | **fil ET profil** · **desktop, medium, mobile** · **une photo visible, compteur en haut à droite, indicateurs dessous, balayage, flèches, clavier** · **l'agrandissement conserve le RANG et poursuit le parcours** · **mono-photo INCHANGÉ** · ⛔ **ne pas étendre aux vidéos** |
>
> **Hors de ce ticket, et explicitement séquencé après** : **la
> reconstruction de `/feed/new`.**
>
> ### ⚠️ FAIT À ÉTABLIR AVANT D'IMPLÉMENTER — **le backend n'a AUCUNE bibliothèque d'image**
>
> **Vérifié dans `backend/pyproject.toml`** : ⛔ **ni Pillow, ni pyvips, ni
> rien.** **`ffmpeg` n'est invoqué que par les SEEDS QA**
> *(`db/seeds/qa_video_media.py`)*, **jamais dans le chemin d'une requête.**
> **Les variantes ajouteront donc une DÉPENDANCE D'EXÉCUTION à l'API** —
> ⚠️ **et décoder une image téléversée est une surface d'attaque classique**
> *(bombe de décompression)* : **le garde-fou de dimensions est obligatoire,
> et la dérivation doit se faire APRÈS l'autorisation, jamais avant.**

---

> ## 🛠️ REPRISE ÉCRITE — **2026-11-02** · **variantes · cache de session · carrousel**
>
> ### Ce qui a été écrit
>
> | Fichier | Changement |
> |---|---|
> | `backend/pyproject.toml` · `uv.lock` | **`pillow>=10.3.0`** *(13.0.0 au lock)* — **seule dépendance d'image de l'API**. ⚠️ **`uv lock` a AUSSI ajouté `sentry-sdk 2.73.0`** : déclaré dans `pyproject.toml` mais **ABSENT du lock**. **Dérive PRÉEXISTANTE, réparée au passage** — elle explique un diff de lock plus large que « juste Pillow » |
> | `services/story_media/image_variants.py` *(nouveau)* | **Dérivation JPEG/WebP**, orientation EXIF avant cadrage, **jamais d'agrandissement**, garde-fou **bombe de décompression à 80 Mpx** *(REFUS, pas avertissement)*, aucune exception Pillow ne remonte au client |
> | `services/story_media/variant_service.py` *(nouveau)* | **Single-flight** par clé dérivée · **sémaphore pris DANS la tâche** · `asyncio.shield` · **délai borné 8 s** · dégradation vers l'original |
> | `services/story_media/storage_keys.py` | **Espace de noms `derived/…`** et son garde-fou ; extension déduite de la SOURCE, donc **sans décoder** |
> | `filesystem_storage.py` · `r2_storage.py` | **Lecture/écriture de l'espace dérivé** sur les DEUX stockages |
> | `api/v1/story_media.py` | **Paramètre `variant`**, appliqué **APRÈS** l'autorisation. ⛔ **`Range` et `variant` ne se combinent pas** |
> | `utils/src/authorized-media-cache.ts` *(nouveau)* | **Cache de session** · clé `(mediaUrl, variante)` · **borné en octets** et en nombre · **LRU** · **epoch comparée à CHAQUE lecture** |
> | `authorized-media-fetch.ts` · `yunicity-api.ts` · `index.ts` | **Variante apposée APRÈS `resolveAuthorizedApiMediaUrl`** — ⛔ **jamais à travers** : cette fonction retire la query pour empêcher l'injection d'un jeton |
> | `authorized-media-object-url.ts` | `__resetAuthorizedMediaSessionForTests` **prévient les abonnés** de la purge |
> | `hooks/use-authorized-media-source.ts` | **Consulte et alimente le cache** ; **évince** sur échec de décodage et sur réessai |
> | `components/feed/feed-publication-carousel.tsx` *(nouveau)* | **Carrousel**, défilement **NATIF** `scroll-snap` |
> | `components/feed/feed-publication-media.tsx` | **Remplace la mosaïque** pour les lots de **photos seules** — **point unique**, donc fil ET profil |
> | `mobile/feed-mobile-media-viewer.tsx` | Variante **`viewer`** en repli |
> | `app/globals.css` | **CSS du carrousel** — **hauteur de cadre FIXE par palier** |
>
> ### ⚠️ TROIS DÉFAUTS DE MA PART, trouvés par les contrôles
>
> **1. Le sémaphore ne bornait PAS le travail réel** — **signalé par Kyria.**
> `asyncio.to_thread` **ne peut pas annuler un thread déjà parti** : prendre la
> place autour de **l'attente de l'appelant** la rendait au délai dépassé
> **pendant que la transformation continuait**. ✅ **Corrigé** *(sémaphore pris
> ET rendu DANS la tâche)*, **et le test a des dents** : en réintroduisant
> l'ancien placement il échoue — **« 4 transformations actives de front,
> plafond annoncé 2 »**. ⚠️ **Scénario en DEUX VAGUES** : en une seule,
> l'ancien code aurait paru correct.
>
> **2. J'avais changé l'ARITÉ pour tous les appelants** *(3ᵉ argument
> `undefined`)*. **Trouvé par un test PRÉEXISTANT**, que je n'ai pas ajusté :
> **il avait raison.** ✅ **L'appel sans variante garde exactement sa forme.**
>
> **3. Le réessai devenait DÉCORATIF** : un blob déclaré image mais indécodable
> restait conservé, et « réessayer » resservait le même échec indéfiniment.
> ✅ **`markDecodeFailed` et `retry` évincent l'entrée.**
>
> ### ⚠️ COMPORTEMENT CHANGÉ, assumé et consigné
>
> **Le démontage d'un composant ne RÉVOQUE plus le blob à lui seul** : la
> session le conserve pour le resservir. **Le composant relâche sa part, le
> cache garde la sienne** ; la **purge** *(déconnexion, changement de compte,
> 401)* révoque. ⚠️ **Deux tests `lib/stories` l'ont attrapé** — ils ne
> réinitialisaient pas la session média entre tests. **Leur intention est
> PRÉSERVÉE** *(pas de fuite)* ; **leur formulation est mise à jour** : la
> révocation est vérifiée **à la purge**, non au démontage.
>
> ### 📏 LES 48 Mo — **ce qu'ils bornent, et ce qu'ils NE bornent PAS**
>
> ✅ **Ils bornent les BLOBS CONSERVÉS** — les octets **compressés** que la
> session garde pour les resservir.
>
> ⛔ **Ils NE bornent PAS la mémoire des images DÉCODÉES.** Une photo de 227 Ko
> en JPEG occupe plusieurs mégaoctets une fois décodée en bitmap
> *(960 × 1280 × 4 ≈ 4,9 Mo)*, **et cette mémoire appartient au navigateur** :
> elle n'est ni comptée ici, ni libérable depuis le code applicatif.
> ⚠️ **Ne pas lire « 48 Mo » comme un plafond de mémoire de l'onglet.** C'est
> un plafond sur **ce que nous retenons** ; c'est la variante `card` qui agit
> sur l'autre terme, en réduisant les **dimensions**.
>
> ### ✅ CONTRÔLES — **2026-11-02**
>
> | Contrôle | Résultat |
> |---|---|
> | `pytest tests/test_story_media_variants.py` | ✅ **18 passed** |
> | `pytest tests/test_story_media_variant_service.py` | ✅ **8 passed** |
> | `pytest tests/test_story_media_variant_route.py` — base jetable | ✅ **9 passed** *(filesystem ET R2)* |
> | `mypy` · `ruff` backend | ✅ **Success** · **All checks passed** |
> | **vitest web COMPLET** | ✅ **97 fichiers · 992 tests** |
> | `tsc --noEmit` web · lint frontend | ✅ **0 · 0** |
>
> ⚠️ **UN test INSTABLE rencontré** : `lib/mobile/ios-form-zoom.test.ts` a
> échoué **une fois** en suite complète, puis passé seul et aux exécutions
> suivantes. ⛔ **Sans rapport avec ce diff** *(il balaie `app/` et
> `components/` à la recherche de `user-scalable=no`)* — **consigné comme
> INSTABLE, pas comme corrigé.**
>
> ### ⛔ DÉFAUTS COUVERTS PAR LES TESTS ≠ CORRECTION OBSERVÉE À L'ÉCRAN
>
> | Défaut | Couvert par un test | Observé corrigé À L'ÉCRAN |
> |---|---|---|
> | Voile gris sur toute la mosaïque | ✅ *(aucun badge ni voile rendu)* | ⛔ **NON** |
> | « +N » en double | ✅ | ⛔ **NON** |
> | Photos au-delà de la 4ᵉ inatteignables | ✅ *(10 diapositives, « n / 10 »)* | ⛔ **NON** |
> | ~3 s par changement de photo | ⚠️ **PARTIELLEMENT** — les tests prouvent le **compte** et l'**ordre** des requêtes, **jamais une DURÉE** | ⛔ **NON** |
> | Saut vertical entre photos | ⚠️ **structurellement** *(hauteur fixe en CSS)* — ⛔ **jsdom ne calcule aucune mise en page** | ⛔ **NON** |
> | Gestes Safari iPhone | ⛔ **NON** — le défilement est **natif**, et c'est précisément ce que jsdom ne joue pas | ⛔ **NON** |
>
> ✅ **Ce que les tests établissent** : le comportement, le câblage, les bornes,
> l'isolation entre comptes, la non-régression.
> ⛔ **Ce qu'ils n'établissent pas** : qu'À L'ÉCRAN, sur un vrai téléphone,
> l'attente a disparu et rien ne saute. **Cela exige le DÉPLOIEMENT — non
> autorisé — puis une recette sur la publication conservée.**
>
> ### 📄 Relevé Preview préparé
>
> **`docs/qa/MEDIA-MULTI-PHOTO-01-releve-preview.md`** — script à coller en
> console. ⛔ **Ne lit ni n'affiche AUCUN jeton** *(`PerformanceResourceTiming`
> seul)* · **ignore les `blob:`** *(qui mesurent la lecture locale, pas le
> téléchargement d'origine)* · **DISTINGUE « indisponible » de « zéro »** : les
> deux origines diffèrent et **la route n'envoie pas `Timing-Allow-Origin`**,
> donc **les tailles seront vraisemblablement masquées**. ⚠️ **Il mesure l'état
> D'AVANT** tant que le déploiement n'est pas autorisé.
>
> ### ▶️ PROCHAINE ACTION
>
> **1.** **Revue du diff.**
> **2.** **Décision sur le déploiement Preview** — **seul chemin vers la preuve
> d'écran.**
> **3.** **Recette** sur « Test multi-photo à supprimer », **CONSERVÉE** :
> gestes Safari, focus, rang conservé à l'agrandissement, absence de saut
> vertical, et le relevé.
> **4.** ⛔ **Puis seulement** : commit, poussée, déploiement.
>
> ⚠️ **Décision OUVERTE, non prise** : ajouter **`Timing-Allow-Origin`**
> restreint à l'origine web rendrait les tailles mesurables.
> **La reconstruction de `/feed/new` reste le chantier SUIVANT.**

---

> ## ⏸ TICKET SUSPENDU le 2026-10-31 — **rien n'est perdu, rien n'est reclassé**
>
> **Décision de Kyria du 2026-10-31** : **suspendre ce ticket** pour traiter
> d'abord **`PROFILE-POST-MENU-01` · supprimer sa propre publication**, **qui
> est la cause de son blocage** *(§4)* — **c'est l'option C du §4.5**.
> **Un seul ticket actif** *(règle 15)* : **le ticket actif est désormais**
> [`PROFILE-POST-MENU-01-supprimer-sa-publication.md`](PROFILE-POST-MENU-01-supprimer-sa-publication.md).
>
> ### Ce qui est CONSERVÉ en l'état
>
> - **`M1`–`M2` restent ACTIVÉS** *(décision du 31/10)*, **en LECTURE SEULE** ;
> - ⛔ **`M3`–`M9` restent BLOQUÉS** ;
> - **tout le §3 et tout le §4 restent une LECTURE DE CODE** de l'arbre
>   `8d2d4c9f` — **leurs limites sont inchangées** ;
> - **la procédure de nettoyage par l'API (§4.6) reste PRÉPARÉE, NON EXÉCUTÉE,
>   NON RETENUE**, **et aucun jeton n'est à copier où que ce soit**.
>
> ### ⚠️ ERREUR DE CLASSEMENT CORRIGÉE le 2026-10-31 — **`M1`–`M2` ONT ÉTÉ JOUÉS**
>
> ⛔ **Une première rédaction de cet encadré affirmait « aucune observation à
> conserver », « zéro manipulation, zéro capture ». C'ÉTAIT FAUX**, et c'est
> **Kyria qui l'a relevé.** **La correction se consigne, elle ne s'efface pas**
> *(règle 15)*.
>
> **CE QUI A ÉTÉ OBSERVÉ** *(relevé de Kyria, 2026-10-31)* :
>
> | Manipulation | Statut | Ce qui est établi |
> |---|---|---|
> | **`M1`** — ouvrir la surface de création, **sans rien joindre** | ✅ **OBSERVÉ** | **l'écran de création est ATTEINT et CAPTURÉ** — **deux captures fournies** |
> | **`M2`** — saisir le texte, **ouvrir le sélecteur de fichiers** | ⚠️ **PARTIELLEMENT OBSERVÉ** | **le sélecteur de fichiers S'OUVRE** — **confirmé** |
>
> **CE QUI RESTE NON VÉRIFIÉ, et ne doit pas être écrit comme acquis** :
>
> - ⛔ **l'URL EXACTE atteinte** — **le relevé central de `M1`** : **on ne sait
>   donc TOUJOURS PAS si la création est la route `/feed/new` ou une MODALE** ;
> - ⛔ **la SÉLECTION MULTIPLE** — **le relevé central de `M2`** : **que le
>   sélecteur accepte PLUSIEURS fichiers reste une LECTURE DE CODE**
>   *(`new-post-screen.tsx:184`-`194` porte `multiple`)*, **pas une
>   observation** ;
> - ⛔ **les types annoncés comme acceptés** par le sélecteur ;
> - ⛔ **le libellé exact du contrôle d'ajout**.
>
> ⚠️ **STATUT DE CETTE PREUVE** : ⛔ **AUCUN SHA attribué** · ⛔ **environnement
> non consigné autrement que « la session de Kyria »** · ⛔ **elle ne vaut donc
> la validation d'AUCUN déploiement** *(règle 15 : une preuve garde son SHA et
> son environnement)*. **Aucun identifiant de preuve `E…` n'est attribué ici** —
> **cette attribution appartient au registre du bilan, et à Kyria.**
>
> 🛑 **CES GESTES NE SE REJOUENT PAS** — **consigne explicite de Kyria du
> 31/10.** **Ce qui manque de `M1`–`M2` sera relevé, s'il doit l'être, à la
> REPRISE du ticket** — **pas en rejouant ce qui a déjà été fait.**
>
> ### Ce que le correctif en cours changera — **et seulement une fois PROUVÉ**
>
> **`PROFILE-POST-MENU-01` câble « Supprimer » dans l'interface.** ⛔ **Cela ne
> débloque PAS encore la phase d'écriture de ce ticket** : **tant que la
> suppression n'est pas OBSERVÉE À L'ÉCRAN** *(recette §8 de sa passation)*,
> **publier reviendrait toujours à créer un contenu qu'on ne sait pas
> retirer**. **La réactivation de `M3`–`M9` est une décision de Kyria, APRÈS
> cette preuve.**

> ## ▶️ PHASE LECTURE SEULE (`M1`–`M2`) **ACTIVÉE** le 2026-10-31 — **phase d'écriture TOUJOURS BLOQUÉE**
>
> **Décision de Kyria du 2026-10-31** : **activer UNIQUEMENT la phase SANS
> ÉCRITURE SERVEUR** — **`M1` et `M2`**. **Elles sont en lecture seule** :
> **ouvrir `/feed/new`, saisir le texte, ouvrir le sélecteur de fichiers** —
> ⛔ **sans joindre**, ⛔ **sans publier**.
>
> ⛔ **`M3` à `M9` RESTENT BLOQUÉS.** **`M3` joint les photos et prépare
> l'écriture** ; **`M4` écrit.** **Leur activation attend une décision sur le
> nettoyage** (§4.5).
>
> ✅ **Valeur propre de cette phase** : **`/feed/new` n'a JAMAIS été relevée en
> recette** — **son URL réelle, ses libellés, et le fait que son sélecteur
> accepte PLUSIEURS fichiers sont tous INCONNUS à l'écran**.
>
> **Identifiant PROPOSÉ** : `MEDIA-MULTI-PHOTO-01`. **Aucune fiche de défaut
> n'existait sur ce sujet** — **il n'était suivi nulle part avant ce jour**.
>
> **Préparé et activé en phase lecture seule le 2026-10-31**, **à la demande de
> Kyria**. ⛔ **Aucun correctif**, ⛔ **aucune publication**, ⛔ **aucune
> suppression exécutée**.
>
> ## ⛔ PHASE D'ÉCRITURE BLOQUÉE — **le nettoyage n'est pas DISPONIBLE dans l'interface**
>
> **Condition posée par Kyria, et tenue AVANT la préparation** : **vérifier le
> chemin de suppression**, **parce que `PROFILE-POST-MENU-01` a déjà EMPÊCHÉ un
> nettoyage**. **Résultat au §4** — **il n'y a AUCUN chemin de suppression dans
> l'interface**, **sur AUCUN palier** :
>
> - **le menu de débordement de la carte du fil n'est PAS RENDU sur sa propre
>   publication**, **et ne contient que « Signaler »**
>   (`feed-post-options-menu.tsx:98`-`101`) ;
> - **les boutons « Options » du profil sont `disabled` DANS LE CODE**, **au
>   mobile comme au desktop** (`profile-mobile-post-card.tsx:34`-`42`,
>   `profile-desktop-publications.tsx:139`-`146`) ;
> - **le seul `DELETE` câblé côté client concerne le MUR D'UNE TRIBU**, **pas le
>   fil** (`use-tribe-wall.ts:165`).
>
> **La phase d'écriture CRÉERAIT donc une publication que l'interface ne sait
> pas retirer** — **exactement le piège de `PROFILE-POST-MENU-01`**. **Elle ne
> doit pas être activée avant qu'un chemin de nettoyage soit DÉCIDÉ** (§4.5).
>
> ✅ **Le nettoyage par l'API — option A — est désormais PRÉPARÉ** (§4.6) :
> **identification certaine de l'ID**, **suppression avec la session de
> l'auteur**, **trois contrôles de disparition**, **devenir des fichiers
> médias**. ⛔ **AUCUNE suppression n'a été exécutée**, **et sa préparation NE
> VAUT PAS son autorisation** : **l'option A reste à retenir par Kyria.**
> ⛔ **Aucun jeton n'est à copier où que ce soit** — **la procédure est conçue
> pour qu'aucun ne soit lu, affiché ni transmis.**
>
> ⚠️ **TOUT LE §3 ET TOUT LE §4 SONT UNE LECTURE DE CODE** du **2026-10-31**,
> **arbre `8d2d4c9f`**. **Rien n'a été observé à l'écran.** **Si l'écran
> contredit ces sections, c'est l'écran qui a raison.**
>
> **Ticket actif au moment de la préparation** : **AUCUN**. Index :
> [`../TICKETS-INDEX.md`](../TICKETS-INDEX.md), **qui fait foi**.
>
> **Cette passation est autoportante** : elle suppose **zéro mémoire** des
> sessions précédentes.

---

## 1. Objectif

**Établir ce que fait l'application quand on publie PLUSIEURS photos en une
seule publication, depuis la VRAIE route `/feed/new`** — **la seule surface
multi-capable**.

| | Question |
|---|---|
| **Q1** | **Peut-on joindre DEUX photos valides en une sélection**, **et les DEUX aperçus restent-ils affichés** ? |
| **Q2** | **La publication part-elle**, **et avec quoi** — **une photo, ou deux** ? |
| **Q3** | **Après rechargement, la carte du fil montre-t-elle LES DEUX photos**, **ou une seule** ? |
| **Q4** | **Chaque photo s'ouvre-t-elle** *(visionneuse)*, **et la seconde est-elle atteignable** ? |
| **Q5** | **La seconde photo est-elle PERDUE, ou seulement NON AFFICHÉE** ? |

---

## 2. Ce qui est DÉJÀ établi — **et qu'il ne faut PAS rejouer**

| Preuve | Ce qu'elle établit | Environnement |
|---|---|---|
| **E6** — 20–22/10 | **le parcours MONO-PHOTO** : ajout et aperçu, remplacement, retrait, règle de texte, publication **photo entière**, nom de l'auteur, **persistance après rechargement** | **Preview**, **Safari iPhone réel**, **desktop**, **medium** |
| **E5** | **cinq scénarios de sélection mixte** sur `/feed/new` — dont **« deux valides + une trop lourde : exactement DEUX médias publiés »** (`new-post-screen-media.test.tsx:472`-`492`) | **poste local**, **unitaire** · **passe en CI** (`pnpm test`) |
| **`479892e3`** | **un défaut de LIBELLÉ sur sélection multiple, CORRIGÉ** : « Continuer sans image » annonçait l'inverse du comportement ; **le comportement est conservé, le texte devient vrai** | **tests + navigateur local sur page de HARNAIS** |
| **`8f98c219`** | **un défaut d'APERÇU, CORRIGÉ** : **ajouter un second média cassait l'aperçu du premier** *(object URL libéré deux fois)* | **tests + harnais local** |

> ⛔ **E6 NE COUVRE PAS CE SCÉNARIO**, **et ne doit pas être invoquée ici.**
> **Son registre** ([`../../qa/PR202-WEB-bilan-consolide.md`](../../qa/PR202-WEB-bilan-consolide.md),
> **ligne `E6`**) **n'énumère aucun item de lot** : **ses scripts `C-1`, `C-3`
> et `C-9` joignent UNE photo**. **Le chemin de code est différent** —
> `handleSelectedFiles` sur un `FileList`, **envois séquentiels**, **contrôleur
> de lot**, **arbitrage de refus** —, **et la surface aussi** : **seul
> `/feed/new` porte `multiple`**, **les quatre autres composers lisent
> `files?.[0]`**.

**Ce qui reste entier** : **le lot n'a JAMAIS été joué sur un environnement
déployé**, **et son rendu dans le fil n'a JAMAIS été observé.**

---

## 3. Le mécanisme — **lecture de code, à confirmer par l'écran**

### 3.1 Les routes, et ce qu'elles écrivent

| Route | Rôle | Écrit ? |
|---|---|---|
| **`POST /api/v1/posts/media`** | **envoie UN fichier**, **appelée une fois PAR photo** (`posts.py:45`-`51`) | ✍️ **OUI** — **un média stocké par appel** |
| **`POST /api/v1/posts`** | **crée la publication**, **avec `media_urls` (≤ 10)** (`schemas/post.py:95`-`97`) | ✍️ **OUI** |
| **`DELETE /api/v1/posts/{id}`** | **suppression DOUCE** — **`is_active = False`**, **`204`** (`posts.py:114`-`120`) | ✍️ **OUI** |

**Limite de lot** : **`POST_MEDIA_MAX_COUNT = 10`** — **côté composer**
(`use-new-post-draft.ts:177`-`179`, message **« Maximum 10 médias. »**) **et
côté schéma API** (`max_length`). **Limite de taille** : **20 Mo par fichier**.
**Rate limit** : **60 envois de média par heure et par compte**
(`posts.py:53`-`58`) — **deux photos n'en approchent pas**.

### 3.2 Le lot, côté composer — **ce qui devrait bien se passer**

- **`/feed/new` porte `multiple`** sur son entrée fichier
  (`new-post-screen.tsx:184`-`194`) ; **les aperçus sont une LISTE**
  (`selectedMedia.map` — `new-post-desktop-view.tsx:119`,
  `new-post-mobile-view.tsx:174`) ;
- **la publication envoie les fichiers UN PAR UN**, **séquentiellement**, **sous
  UN SEUL contrôleur d'abandon**, **puis crée la publication avec la liste
  obtenue** (`new-post-screen.tsx:98`-`131`) ;
- **chaque fichier a son propre budget de temps, proportionnel à sa taille**.

### 3.3 ⚠️ PRÉDICTION FORTE — **la chaîne d'AFFICHAGE est ROMPUE**

**Trois constats de code qui se tiennent** :

1. **le flux n'expose QU'UN média** : **`FeedItem` n'a que `media_url`**,
   **aucun `media_urls`** (`schemas/feed.py:60`, `feed_post_mapper.py:90`
   et `117`) ;
2. **c'est la PREMIÈRE photo qui devient ce média** :
   **`post.media_url = media_items[0].url`** (`post_composer_mapper.py:124`) ;
3. **AUCUN appelant de production ne passe la liste** : **les trois cartes
   appellent `FeedPublicationMedia` avec `mediaUrl` SEUL**
   (`citizen-post-card.tsx:59`, `organization-post-card.tsx:33`,
   `event-feed-card.tsx:52`) — **`mediaUrls` n'est passé QUE par un harnais de
   test** (`e2e/harness/media02-interaction-mount.tsx:49`).

> **Conséquence prédite** : **publier deux photos afficherait UNE SEULE photo —
> la PREMIÈRE** —, **et la grille multi-médias** *(`PublicationMediaGrid`,
> pastille « +N », livrée par `f7b5f817`)* **ne serait atteignable que par le
> harnais**. **La seconde photo serait STOCKÉE** *(`post.media_urls`, renvoyée
> dans `PostResponse.composer`)* **mais JAMAIS SERVIE par le fil.**
>
> ⚠️ **Ceci est une PRÉDICTION, pas un défaut établi.** **C'est précisément ce
> que `M5` et `M6` vont trancher.** **Si l'écran montre deux photos, cette
> section est FAUSSE — et c'est l'écran qui a raison.**

### 3.4 Effets de bord cherchés, et ce qui a été trouvé

| Sujet | Résultat de la lecture |
|---|---|
| **Notification** | **aucune** — **publier ne notifie personne par soi-même** |
| **Hook PASSPORT** | ⚠️ **NON VÉRIFIÉ** — **une publication pourrait compter dans la progression**. **À trancher avant activation si cela compte pour Kyria** |
| **Média orphelin** | ⚠️ **OUI** — **un échec APRÈS envoi conserve le média distant** *(`8f98c219` : « la reprise ne renvoie rien »)*. **Des fichiers peuvent rester sans publication qui les porte**, **et aucune interface ne les retire** |

---

## 4. ⛔ Nettoyage — **PRÉCONDITION BLOQUANTE**

### 4.1 Aucun chemin de suppression dans l'interface

| Surface | Contrôle | État dans le code |
|---|---|---|
| **Carte du fil** | menu de débordement | ⛔ **PAS RENDU sur sa propre publication** — `if (viewerIsAuthor) return null` (`feed-post-options-menu.tsx:98`-`101`). **Et il ne contient que « Signaler »** |
| **Profil, mobile** | bouton « Options » | ⛔ **`disabled`** (`profile-mobile-post-card.tsx:34`-`42`) |
| **Profil, desktop** | bouton « Options » | ⛔ **`disabled`** (`profile-desktop-publications.tsx:139`-`146`) |
| **Détail d'une publication** | — | ⛔ **aucune route de détail** dans `app/` — **`feed/page.tsx`, `feed/new/page.tsx` et `feed/layout.tsx` SEULEMENT** |
| **Mur d'une tribu** | « Supprimer » | ✅ **câblé** (`use-tribe-wall.ts:165`) — ⛔ **mais ce n'est PAS le fil** |

**Le commentaire du code le dit lui-même** : **« Aucune action n'étant
aujourd'hui câblée pour le propriétaire, le menu n'est pas rendu du tout sur sa
propre publication… `PATCH` et `DELETE /posts/{id}` existent et restent
disponibles pour une extension Modifier/Supprimer »**
(`feed-post-options-menu.tsx:24`-`28`).

### 4.2 Ce que `PROFILE-POST-MENU-01` établit — **et ce que le code AJOUTE**

**Acquis, et NON reclassé** : **`E6`**, **Preview**, **Safari iPhone réel** —
**le menu « … » d'une publication du profil est resté SANS EFFET**, **ce qui a
BLOQUÉ le nettoyage des publications de recette**. **Le bilan le classe `O`**,
**priorité haute**, **avec la réserve « les autres chemins n'ont pas été
vérifiés »**.

⚠️ **FAIT NEUF, issu du CODE le 31/10, à confronter à l'écran** : **le contrôle
du profil est `disabled` par CONSTRUCTION**, **au mobile comme au desktop**.
**Si l'écran le confirme**, **le défaut n'est pas propre à Safari** : **il est
GÉNÉRAL**, **et la réserve « autres chemins non vérifiés » se refermerait dans
le sens DÉFAVORABLE**.

> ⛔ **Ne RIEN reclasser sur cette base.** **Une lecture de code n'est pas une
> observation** *(règle 15)*. **`PROFILE-POST-MENU-01` garde son classement et
> son périmètre jusqu'à preuve d'écran.**

### 4.3 Le seul chemin restant : **l'API**

**`DELETE /api/v1/posts/{id}`** — **`204`**, **suppression DOUCE**
(`is_active = False`, `post_service.py:131`-`146`), **autorisée à l'AUTEUR**
(`_can_moderate_post` → `_is_author`, `post_service.py:217`-`219` et
`231`-`235`).

⚠️ **Ce n'est pas un chemin d'interface** : **il exige un jeton de session et un
appel manuel** *(console du navigateur ou client HTTP)*. **C'est une
manipulation d'OUTILLAGE, pas un parcours utilisateur** — **et elle n'a jamais
été employée en recette.**

⚠️ **Et elle ne retire PAS les fichiers** : **la suppression est DOUCE**, **la
ligne et les médias restent en base et en stockage**. **Comme pour
`SOCIAL-COMMENT-01`, la restauration serait VISIBLE, pas une restauration des
données.**

### 4.4 Ce qui resterait en place si le scénario était interrompu

| Moment de l'interruption | Ce qui reste |
|---|---|
| **après `M3`** *(photos jointes, rien publié)* | ✅ **RIEN côté serveur** — **les aperçus sont LOCAUX** *(object URL)* |
| **pendant `M4`** *(envois en cours)* | ⚠️ **un ou deux MÉDIAS distants**, **sans publication qui les porte**. **Aucune interface ne les retire** |
| **après `M4`** *(publication créée)* | ⛔ **une publication PUBLIQUE avec ses deux médias**, **et AUCUN chemin d'interface pour la retirer** |

### 4.5 Les trois options — **décision de Kyria, AUCUNE n'est prise**

| Option | Ce qu'elle coûte | Ce qu'elle vaut |
|---|---|---|
| **A — autoriser le nettoyage par l'API** *(`DELETE /posts/{id}` à la main)* — ✅ **PROCÉDURE PRÉPARÉE au §4.6**, ⛔ **NON EXÉCUTÉE**, ⛔ **non retenue** | **une manipulation d'outillage** *(console, fenêtre privée)* · **suppression DOUCE seulement** · ⚠️ **une rotation de jeton de rafraîchissement**, **confinée à une session jetable** (§4.6.b) | **le scénario devient jouable SANS rien laisser à l'écran**, **et SANS qu'aucun jeton soit lu ni copié** |
| **B — accepter une publication de test PERMANENTE** | ⛔ **un contenu public non retirable**, **sur un environnement partagé** | **le scénario est jouable tout de suite** — **au prix d'une trace définitive** |
| **C — câbler « Supprimer » AVANT de jouer** | ⛔ **c'est un CORRECTIF** — **hors du périmètre accordé aujourd'hui** | **refermerait aussi `PROFILE-POST-MENU-01`**, **le vrai blocage de fond** |

> **Recommandation de cette préparation : A**, **et seulement après que Kyria ait
> validé la manipulation d'outillage.** ⛔ **B est à écarter sauf décision
> explicite** : **la doctrine héritée de `FAVORITES-SAVE-01` interdit de créer
> du contenu qu'on ne peut pas retirer.**
>
> ⛔ **Tant qu'aucune option n'est retenue, `M3` à `M9` NE SE JOUENT PAS.**

### 4.6 Option A, PRÉPARÉE le 2026-10-31 — **nettoyage API, NON EXÉCUTÉ**

> **Préparée à la demande de Kyria.** ⛔ **AUCUNE suppression n'a été exécutée**,
> ⛔ **rien n'a été publié**, ⛔ **et l'option A n'est PAS pour autant retenue** :
> **sa préparation ne vaut pas son autorisation**.
>
> **Règle absolue** : ⛔ **AUCUN jeton n'est à copier — ni dans la conversation,
> ni dans un fichier, ni dans un ticket.** **Le jeton est obtenu et consommé
> DANS la même exécution**, **et n'est JAMAIS affiché.** **Les extraits
> ci-dessous respectent cette règle par construction** : **aucun `console.log`
> ne porte sur le jeton.**

#### 4.6.a Pourquoi c'est faisable sans manipuler de jeton

| Constat de code | Conséquence |
|---|---|
| **le web stocke le jeton d'accès EN MÉMOIRE SEULEMENT** — `new MemoryTokenStorage()` (`auth-provider.tsx:59`) | ⛔ **rien à lire dans `localStorage`** : **le jeton n'est pas récupérable par un détour de stockage** |
| **le backend n'accepte le jeton QUE par l'en-tête** — `HTTPBearer` (`dependencies.py:21`, `34`) | ⛔ **un `fetch` avec les seuls cookies renverrait `401`** |
| **le jeton de rafraîchissement est un COOKIE `httpOnly`** — **le web envoie `POST /auth/refresh` SANS corps**, **`credentials: "include"`** (`auth-client.ts:204`-`224`, `251`-`259`) | ✅ **une page de l'application peut obtenir un jeton d'accès frais SANS que personne ne le voie ni ne le saisisse** |

#### 4.6.b ⚠️ Le risque, et comment il est neutralisé

**`POST /auth/refresh` FAIT TOURNER le jeton de rafraîchissement**
(`auth_service.py:179`-`219`). **Un rejeu récent est toléré** *(fenêtre de
grâce, `refresh_rotation_grace`)*, **mais la réutilisation d'un jeton déjà
remplacé RÉVOQUE TOUTE LA FAMILLE** — **`REFRESH_TOKEN_REUSE`**, **donc une
DÉCONNEXION**.

> ✅ **Neutralisation : tout se fait dans une FENÊTRE PRIVÉE**, **CONNECTÉE
> normalement par l'interface, sous le compte AUTEUR**. **Une connexion
> distincte ouvre une FAMILLE DE JETONS distincte** : **une rotation y est donc
> sans effet sur la session de recette.**
>
> ⚠️ **CORRECTION CONSIGNÉE — 2026-10-31, relevée par Kyria.** **Une première
> rédaction de ce §4.6.b invoquait `H-2` comme PRÉCÉDENT. C'était FAUX.**
> **`H-2` est passé par une fenêtre privée SANS AUCUNE CONNEXION** — **la page
> d'accueil publique redirige les visiteurs authentifiés vers `/feed`**, **et
> la fenêtre privée servait précisément à l'atteindre en VISITEUR ANONYME sans
> traverser `A-3`**
> ([`PR202-WEB-recette-H2-liens-entete-public.md`](PR202-WEB-recette-H2-liens-entete-public.md)
> **§11.b** et **§5.e**). ⛔ **Ce n'est PAS le même procédé** : **ici la fenêtre
> privée doit être CONNECTÉE**, **ce que `H-2` a justement évité de faire.**
>
> **Conséquence à assumer** : **la présente procédure est NOUVELLE**, **et
> SANS PRÉCÉDENT dans le projet**. **Le confinement de la rotation repose sur une
> LECTURE DE CODE** *(familles de jetons, `auth_service.py`)*, **pas sur une
> observation.** **Si Kyria veut une garantie observée, un premier passage peut
> se faire sur une publication SANS valeur de preuve** — ⛔ **ce qui serait une
> ÉCRITURE, donc soumis à la même autorisation.**
>
> ⛔ **Ne PAS lancer ces extraits dans l'onglet de recette.** ⛔ **Ne pas saisir
> de mot de passe dans une console** — **la connexion se fait par le formulaire
> de l'application**, **comme d'habitude**.

#### 4.6.c `N1` — **identification CERTAINE de l'ID**

**Trois sources, dont deux indépendantes** — **l'ID n'est PAS lisible dans le
DOM de la carte** *(vérifié : aucune donnée d'identifiant sur
`citizen-post-card.tsx`)* :

| Source | Comment | Valeur |
|---|---|---|
| **S1 — la réponse de création** | **DevTools → Réseau → la requête `POST /api/v1/posts` de `M4` → onglet Réponse → champ `id`** | **la plus directe : l'ID vient de l'acte qui l'a créé** |
| **S2 — le flux, en lecture seule** | **`GET /api/v1/feed`**, **repérer l'entrée dont le `body` est EXACTEMENT le texte imposé** | **indépendante de S1** |
| **S3 — relecture avant écriture** | **`GET /api/v1/posts/{ID}`** — **compare `body`, `author.id`, `created_at`, **et** `composer.media_urls.length`** | ✅ **c'est elle qui rend l'identification CERTAINE** |

⛔ **Si S1 et S2 ne donnent pas le MÊME `id`, ou si S3 ne rend pas exactement le
texte imposé : NE RIEN SUPPRIMER.** **Consigner et s'arrêter.**

#### 4.6.d `N2` — **suppression, avec la session de l'AUTEUR**

**Un seul extrait, dans la console de la FENÊTRE PRIVÉE, onglet de
l'application** *(l'origine doit être celle du site, pour les règles CORS)*.
**La garde est DANS le code** : **le texte attendu et le nombre de médias sont
comparés AVANT la suppression**, **et un écart interrompt tout.**

```js
// MEDIA-MULTI-PHOTO-01 · nettoyage ciblé — fenêtre privée, compte auteur.
// Aucun jeton n'est affiché, ni copié, ni conservé.
const API = "<origine de l'API Preview, visible dans DevTools → Réseau>";
const ID = "<uuid relevé en N1>";
const ATTENDU = "Recette multi-photos — à supprimer.";

const jeton = async () => {
  const r = await fetch(`${API}/api/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
  });
  if (!r.ok) throw new Error(`refresh ${r.status}`);
  return (await r.json()).access_token; // jamais journalisé
};

const t = await jeton(); // un seul jeton, une seule rotation
const entete = { Authorization: `Bearer ${t}`, Accept: "application/json" };

// N1/S3 — relecture AVANT écriture
const avant = await fetch(`${API}/api/v1/posts/${ID}`, { credentials: "include", headers: entete });
if (!avant.ok) throw new Error(`relecture ${avant.status} — ne rien supprimer`);
const post = await avant.json();
console.log({
  corps: post.body,
  auteur: post.author?.display_name,
  medias: post.composer?.media_urls?.length ?? 0,
  cree_le: post.created_at,
});
if (post.body !== ATTENDU) throw new Error("CORPS DIFFÉRENT — suppression annulée");

// N2 — suppression
const sup = await fetch(`${API}/api/v1/posts/${ID}`, {
  method: "DELETE",
  credentials: "include",
  headers: entete,
});
console.log({ suppression: sup.status }); // 204 attendu

// N3 — vérification de la disparition
const apres = await fetch(`${API}/api/v1/posts/${ID}`, { credentials: "include", headers: entete });
console.log({ relecture: apres.status }); // 404 attendu
```

**Autorisation côté serveur** : **`DELETE /posts/{id}` n'est ouvert qu'à
l'AUTEUR** *(ou à un modérateur)* — `_can_moderate_post` → `_is_author`
(`post_service.py:231`-`235`, `217`-`219`). **Une autre session recevrait
`403`.**

#### 4.6.e `N3` — **vérification de la disparition : TROIS contrôles**

| # | Contrôle | Attendu | Pourquoi il compte |
|---|---|---|---|
| **V1** | **la réponse du `DELETE`** | **`204`** | **l'API déclare avoir agi** |
| **V2** | **`GET /api/v1/posts/{ID}` APRÈS** | **`404`** | **`get_post` lit en `active_only=True`** (`post_service.py:149`) — **le `404` est la preuve côté serveur** |
| **V3** | **recharger `/feed` dans l'onglet de recette** | **la carte a DISPARU** | ✅ **c'est le seul contrôle À L'ÉCRAN**, **et le seul qui prouve le nettoyage pour un lecteur** |

⛔ **`V1` seul ne prouve rien d'observable.** **Comme pour
`SOCIAL-COMMENT-01`, le nettoyage n'est PROUVÉ qu'après rechargement.**

#### 4.6.f `N4` — **devenir des fichiers médias : ce que dit le code**

**La suppression est DOUCE** : **`is_active = False`**, **la ligne reste**, **et
les fichiers ne sont PAS supprimés** — **ni du disque, ni de R2**. **Aucune
tâche de purge n'a été trouvée.** **Mais l'ACCÈS change**, et c'est le point
utile :

**Les médias de publication sont servis par
`GET /api/v1/story-media/{user_id}/{filename}`**, **route AUTHENTIFIÉE**
(`story_media.py:86`-`108`) :

| Qui lit | Pendant que la publication est ACTIVE | APRÈS la suppression douce |
|---|---|---|
| **l'AUTEUR** *(`viewer.id == user_id`)* | ✅ **accès**, **sans condition** — **le propriétaire lit son média même avant publication** | ✅ **ACCÈS CONSERVÉ** — **par URL directe** |
| **un TIERS** | ✅ **accès**, **si une publication ACTIVE porte cette URL** — **et la recherche résout `media_url` SCALAIRE **et** `media_urls` JSONB** (`post_repository.py:58`-`63`) | ⛔ **`404`** — **plus aucune ligne active ne porte le média** · ⚠️ **PRÉDICTION NON VÉRIFIABLE ICI** : **il faudrait un second compte, et l'inscription est fermée** |

> **Conclusion, et son statut** : **le nettoyage retire la publication** —
> **cela, `N3`/`V3` l'OBSERVE** —, **et il retirerait aussi l'accès des tiers aux
> DEUX fichiers**, **y compris celui de la seconde photo dont l'autorisation
> résout bien la liste JSONB** — ⚠️ **mais cette seconde moitié est une
> PRÉDICTION DE CODE que rien ne pourra vérifier ici** *(voir ci-dessous)*.
> ⚠️ **Et les fichiers RESTENT stockés**, **l'auteur y gardant accès par URL
> directe**. **Ce n'est donc pas un effacement** — **à ne pas écrire comme tel.**
>
> ⚠️ **Tout ce §4.6.f est une LECTURE DE CODE.**
>
> ⚠️ **CORRECTION CONSIGNÉE — 2026-10-31, relevée par Kyria.** **Une première
> rédaction proposait de vérifier le `404` des tiers « depuis une fenêtre privée
> NON connectée ». C'était FAUX** : **la route EXIGE une authentification**
> (`require_authenticated_user`, `story_media.py:91`), **donc une fenêtre non
> connectée ne rendrait qu'un `401`** — **la GARDE D'AUTHENTIFICATION, et rien
> de plus**. **Elle ne dit RIEN de l'accès d'un TIERS AUTHENTIFIÉ**, **qui est
> précisément la branche à éprouver.**
>
> ⛔ **Et cette branche n'est PAS ÉPROUVABLE dans l'environnement actuel** :
> **elle exige un SECOND COMPTE authentifié**, **or l'INSCRIPTION EST FERMÉE** —
> **ce qui « bloque tout parcours à deux acteurs »**
> ([`../../qa/COUVERTURE-FONCTIONNELLE-01.md`](../../qa/COUVERTURE-FONCTIONNELLE-01.md)
> **§3.2** et **§5**). **Le même empêchement ferme déjà la réception d'une
> notification sociale.**
>
> **Ce qu'il reste donc d'observable, et c'est tout** : **`N5` — relever une URL
> de média en `M7`**, **puis la rouvrir APRÈS la suppression DEPUIS LA SESSION
> DE L'AUTEUR** *(attendu : elle répond encore — le propriétaire court-circuite
> le contrôle)*. **Cela établit UNIQUEMENT que le fichier n'a pas été effacé.**
> ⛔ **`N5` est FACULTATIF et reste à autoriser.**
>
> ⛔ **Le `404` opposé aux TIERS reste donc une PRÉDICTION DE CODE, non
> vérifiable ici** — **à ne jamais écrire comme observée**, **et à ne pas
> présenter comme la preuve que les médias deviennent inaccessibles.**

#### 4.6.g Ce que ce nettoyage ne fait PAS

- ⛔ **il n'efface AUCUN fichier** — **suppression douce**, **stockage intact** ;
- ⛔ **il ne retire pas les MÉDIAS ORPHELINS** d'un `M4` interrompu : **aucune
  publication ne les porte**, **donc `DELETE /posts/{id}` ne les atteint pas**,
  **et aucune route ne les supprime** ;
- ⛔ **il ne referme PAS `PROFILE-POST-MENU-01`** : **c'est un contournement par
  l'outillage**, **pas un chemin d'interface** ;
- ⛔ **il ne vaut pas pour les publications des recettes PASSÉES** — **son
  périmètre est LA publication de test de ce scénario**, **et elle seule**.

---

## 5. Écritures — **exactement quoi**

| Étape | Écrit ? | Quoi |
|---|---|---|
| **M1, M2** | ✅ **NON** — **lecture seule** | **ouvrir `/feed/new`**, **relever l'état initial** |
| **M3** | ✅ **NON côté serveur** | **joindre deux photos** — **aperçus LOCAUX**, **aucun envoi avant « Publier »** |
| **M4** | ✍️ **OUI — TROIS requêtes** | **2 × `POST /posts/media`** *(une par photo)* **puis 1 × `POST /posts`** |
| **M5 à M8** | ✅ **NON** — **`GET`** | **recharger**, **observer**, **ouvrir les photos** |
| **M9** *(nettoyage)* | ✍️ **OUI** | **selon l'option retenue au §4.5** |

⚠️ **La publication sera PUBLIQUEMENT VISIBLE** pendant toute la durée du test.
**Texte imposé** : **`Recette multi-photos — à supprimer.`**

---

## 6. Protocole — **une manipulation à la fois**

**Palier : desktop — un seul.** ⚠️ **Le medium et le mobile ne sont pas
couverts**, **et `/feed/new` a ses propres vues par palier.**

| # | Manipulation | À relever |
|---|---|---|
| **M1** | ✅ **JOUÉ le 31/10** — **ouvrir la surface de création**, **sans rien joindre** | ✅ **écran ATTEINT et CAPTURÉ** *(deux captures)* · ⛔ **URL EXACTE NON RELEVÉE** · ⛔ **route ou modale : TOUJOURS INCONNU** · ⛔ **libellé du contrôle d'ajout non consigné**. 🛑 **NE PAS REJOUER** |
| **M2** | ⚠️ **PARTIELLEMENT JOUÉ le 31/10** — **ouverture du sélecteur de fichiers** | ✅ **le sélecteur S'OUVRE** *(confirmé)* · ⛔ **SÉLECTION MULTIPLE NON VÉRIFIÉE** — **le `multiple` du code reste NON OBSERVÉ** · ⛔ **types acceptés non relevés**. 🛑 **NE PAS REJOUER** |
| **M3** | **Joindre DEUX photos valides EN UNE SEULE sélection** *(deux JPEG < 20 Mo)*. **Ne pas publier.** | 🛑 **COMBIEN d'aperçus sont affichés — UN ou DEUX ?** · **les deux sont-ils intacts ?** · **un message d'erreur ?** · **le bouton « Publier » est-il actif ?** |
| **M4** | ✍️ **PUBLIER. Un seul clic.** | **une progression ?** · **un échec ?** · **vers où est-on renvoyé ?** *(le code dit `/feed`)* |
| **M5** | **Observer la carte dans le fil, SANS recharger.** | 🛑 **COMBIEN de photos la carte montre-t-elle ?** · **une grille, ou une seule image ?** · **une pastille « +1 » ?** |
| **M6** | **Recharger** *(`Ctrl + R`)*, **retrouver la carte.** | 🛑 **COMBIEN de photos APRÈS rechargement ?** · **est-ce la MÊME que celle de `M5` ?** · **laquelle des deux — la première jointe ?** |
| **M7** | **Cliquer la photo visible.** | **une visionneuse s'ouvre-t-elle ?** · **permet-elle de passer à la SECONDE photo** *(flèche, glissement, pastille)* ? |
| **M8** | **Si une seconde photo est atteignable : l'ouvrir.** **Sinon, le consigner comme tel.** | **la seconde photo est-elle ATTEIGNABLE par un chemin quelconque ?** |
| **M9** | **NETTOYAGE — selon l'option du §4.5**, **et seulement si elle est décidée.** | **la publication disparaît-elle ?** · **et APRÈS rechargement ?** |

---

## 7. Règles d'arrêt

| Signal | Conduite |
|---|---|
| 🛑 **Aucune option de nettoyage décidée** | ⛔ **NE PAS DÉPASSER `M2`.** **`M1` et `M2` sont en lecture seule et gardent une valeur propre** — **`/feed/new` n'a JAMAIS été relevée en recette** |
| 🛑 **`M3` n'affiche qu'UN aperçu** | **ARRÊTER LES ÉCRITURES.** **Consigner** : **le lot ne tient pas au composer**, **inutile de publier pour l'apprendre**. **`M4` à `M8` deviennent sans objet** |
| 🛑 **`M4` échoue après un envoi partiel** | ⛔ **un média orphelin peut rester** (§3.4). **Le consigner**, **et NE PAS réessayer en boucle** : **chaque tentative ajoute un fichier** |
| ⚠️ **Le sélecteur refuse la sélection multiple** | **consigner et s'arrêter** : **le code dit le contraire**, **l'écran aurait raison** |
| ✅ **Recharger reste PERMIS** | **c'est le seul moyen de savoir ce qui est réellement côté serveur** |

---

## 8. Attendu, écrit **AVANT** la manipulation

| # | Prédiction | Si elle tombe |
|---|---|---|
| **P1** | **la sélection multiple est possible**, **DEUX aperçus s'affichent** | **le lot ne tient pas au composer — DÉFAUT à consigner**, **et `M4` devient sans objet** |
| **P2** | **la publication part**, **trois requêtes**, **retour sur `/feed`** | **à consigner tel quel** |
| **P3** | ⚠️ **la carte ne montre QU'UNE photo — la PREMIÈRE jointe** *(§3.3)* | **si DEUX photos s'affichent : le §3.3 est FAUX**, **la chaîne n'est pas rompue** — **bonne nouvelle, à consigner** |
| **P4** | ⚠️ **aucune grille, aucune pastille « +1 »** | idem |
| **P5** | ⚠️ **la seconde photo n'est atteignable par AUCUN chemin d'interface** | **si elle l'est : par LEQUEL ?** |
| **P6** | **la seconde photo est STOCKÉE, pas perdue** — **`PostResponse.composer.media_urls`** | ⚠️ **NON OBSERVABLE sans relevé réseau** — **à ne pas conclure depuis l'écran seul** |

---

## 9. Critère de sortie

**`Q3` TRANCHÉ** : **le nombre EXACT de photos rendues par la carte APRÈS
rechargement**, **relevé à l'écran**, **capture à l'appui**.

⛔ **Le critère n'est PAS « la publication a réussi ».** **Deux photos envoyées
et une seule affichée serait un ÉCHEC FONCTIONNEL**, **à consigner comme
défaut** — **avec un identifiant PROPOSÉ, sans fiche, sans correctif.**

---

## 10. Ce que ce scénario n'établira PAS

- **le medium et le mobile** — **un seul palier**, **et `/feed/new` a des vues
  distinctes par palier** ;
- **les lots de 3 à 10** — **deux photos seulement** ; **les grilles « 3 »,
  « 4 » et « 5+ » restent non éprouvées** ;
- **le mélange photo + vidéo** — **le format choisi filtre déjà la nature des
  fichiers** (`use-new-post-draft.ts:199`-`200`) ;
- **l'arbitrage d'un média REFUSÉ dans un lot** — **c'est le sujet de
  `479892e3`**, **et il exigerait un fichier invalide : un AUTRE scénario** ;
- **la persistance EN BASE de la seconde photo** — **non observable sans relevé
  réseau** ;
- ⛔ **`PROFILE-POST-MENU-01`** — **ce scénario le RENCONTRE, il ne le referme
  pas.**

---

## 11. Hors périmètre — **le sujet CI, qui reste SÉPARÉ**

⛔ **Ce scénario est FONCTIONNEL.** **Il ne traite pas, et ne doit PAS servir à
traiter, le sujet d'outillage suivant** — **gardé distinct à la demande de
Kyria** :

> **La seule preuve NAVIGATEUR du lot** —
> `e2e/responsive/media01-composers-responsive.spec.ts:393`-`405` — **tourne
> contre une page de HARNAIS**, **via une configuration Playwright séparée**
> (`playwright.media01.config.ts`), **et n'est PAS câblée en CI** : **aucun
> workflow ne la lance**, **et `frontend-ci.yml` n'exécute AUCUN Playwright**.
> **Le commit `8f98c219` nomme ce report `MEDIA-RESPONSIVE-CI-01`** —
> **identifiant qui n'existe NULLE PART dans le dépôt** : **ni ticket, ni doc.**

**Ce sujet mérite sa propre fiche.** ⛔ **Elle n'est PAS créée ici**, **et son
ouverture est une décision de Kyria.** **Une CI verte ne vaudrait de toute façon
pas une observation sur Preview** — **les deux sujets ne se remplacent pas.**

---

## 12. État et prochaine action

| | |
|---|---|
| **État** | ⏸ **TICKET SUSPENDU le 2026-10-31** *(voir l'encadré en tête)* · **PHASE LECTURE SEULE JOUÉE** : **`M1` OBSERVÉ** *(deux captures)*, **`M2` PARTIEL** *(le sélecteur s'ouvre)* — ⛔ **URL exacte et sélection multiple NON VÉRIFIÉES** · 🛑 **ces gestes NE SE REJOUENT PAS** · ⛔ **PHASE D'ÉCRITURE (`M3`–`M9`) BLOQUÉE** |
| **Nettoyage** | ✅ **procédure API PRÉPARÉE** (§4.6) — **identification certaine, suppression par la session de l'auteur, trois contrôles, devenir des médias** · ⛔ **NON EXÉCUTÉE**, ⛔ **option A non retenue** · ⛔ **aucun jeton à copier, nulle part** |
| **État Git** | **branche `fix/mobile-publishing-p0`**, **arbre `8d2d4c9f`** · ⛔ **aucun correctif**, **aucun commit** |
| **Preuve acquise** | ⚠️ **PARTIELLE, et SANS SHA NI ENVIRONNEMENT CONSIGNÉ** : **`M1` observé** *(écran de création atteint, deux captures)* et **`M2` partiel** *(ouverture du sélecteur)*, **relevés de Kyria le 31/10**. ⛔ **Elle ne vaut la validation d'AUCUN déploiement.** **Tout le §3 et tout le §4 restent une LECTURE DE CODE** |
| **SHA Preview** | **`bf008a87`**, **attribué par continuité**, ⚠️ **NON RELU**. **Les quatre commits du sujet** *(`2558cbc5`, `f7b5f817`, `8f98c219`, `479892e3`)* **sont ses ANCÊTRES** — **le code est dans l'arbre servi**, **ce qui n'est PAS une observation du déployé** |
| **Blocage** | ⛔ **le NETTOYAGE** (§4) — **aucun chemin d'interface**, **trois options au §4.5**, **aucune retenue** |
| **Inconnues** | **tout le §1** *(`Q1` à `Q5` : aucune n'est tranchée)* · ⛔ **l'URL EXACTE de la surface de création** *(route ou modale)* · ⛔ **la SÉLECTION MULTIPLE à l'écran** · ⛔ **les types acceptés par le sélecteur** · **le hook PASSPORT d'une publication** *(non vérifié)* · **le medium et le mobile** |
| **Ligne de couverture** | **§3.2 de** [`../../qa/COUVERTURE-FONCTIONNELLE-01.md`](../../qa/COUVERTURE-FONCTIONNELLE-01.md) — **« Publier plusieurs photos »**, **ouverte en `N` le 31/10** |
| **Prochaine action** | ⏸ **AUCUNE sur ce ticket tant qu'il est suspendu.** **Le travail est passé à `PROFILE-POST-MENU-01`** *(option C du §4.5)* : [`PROFILE-POST-MENU-01-supprimer-sa-publication.md`](PROFILE-POST-MENU-01-supprimer-sa-publication.md). **À la REPRISE** : **jouer `M1` et `M2`** *(lecture seule, déjà activées)*, **puis DÉCISION DE KYRIA sur l'écriture** — **recevable seulement après que la suppression aura été PROUVÉE À L'ÉCRAN** |
