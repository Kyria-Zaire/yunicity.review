# Passation — FEED-NEW-UX-01 · Reconstruction de `/feed/new` · desktop + medium + mobile

> ## ▶️ TICKET OUVERT le 2026-11-03 par Kyria
>
> **Énoncé reçu** : **« Reconstruction de `/feed/new` sur les trois
> formats. »**
>
> **Ticket précédent** : **`MEDIA-MULTI-PHOTO-01`** — ✅ **CLOS SUR PREVIEW le
> 2026-11-03** *(recette conduite avec ChatGPT, confirmations manuelles de
> Kyria)*. ⛔ **Non fusionné dans `main`.** **Un seul ticket actif**
> *(règle 15)*. **L'index fait foi** : [`../TICKETS-INDEX.md`](../TICKETS-INDEX.md).

---

## 1. Objectif — **et ce qu'il a changé**

**Reconstruire `/feed/new`**, **l'écran de composition d'une publication**,
**sur les trois paliers : desktop, medium, mobile.**

> ### ⚠️ L'ÉNONCÉ A CHANGÉ DE NATURE — à ne pas fondre dans l'ancien
>
> **Jusqu'au 2026-11-02, ce ticket portait « ajustements `/feed/new` »** —
> **des écarts visuels à corriger, jamais listés.** **Le 2026-11-03, Kyria
> demande une RECONSTRUCTION.**
>
> ⛔ **Ce n'est pas la même tâche**, **et la seconde n'est pas une version
> plus large de la première** : **un ajustement part de l'existant, une
> reconstruction peut le remplacer.** **Les deux formulations sont conservées
> ici** ; ⛔ **ne pas écrire que le périmètre « a été précisé ».**

---

## 2. ✅ LE PÉRIMÈTRE EST DÉSORMAIS DÉFINI — **recueilli le 2026-11-03**

> **Levée du blocage ouvert depuis le 2026-10-31.**
> **Preuve** : **recueil conduit avec Kyria le 2026-11-03**, **une question à
> la fois**, **chaque réponse consignée**. ⛔ **Aucune déduction** : ce qui
> suit est ce que Kyria a énoncé, pas ce qui a été supposé.

**Trois sources disaient « périmètre non défini »** *(recette photo §6.2,
bilan §5.1.b, et l'index)*. **Elles sont désormais périmées sur ce point
précis** — ⛔ **et sur ce point seul.**

### Ce que Kyria a acté

| # | Décision | Formulation retenue |
|---|---|---|
| 1 | **Nouvel écran cohérent**, pas un relookage | « Les options inertes ne doivent pas rester affichées telles quelles. » |
| 2 | **Références** : **Facebook** guide le **parcours**, **Instagram** la **gestion des médias** | ⛔ **sans réintroduire un parcours « médias d'abord » obligatoire** |
| 3 | **Composeur unique**, **aucun onglet de format** | Le format est **déduit du contenu compatible serveur** |
| 4 | **Mention non cliquable « Publication publique »** | ⛔ **Proscrire « visible par tout Reims »** — *voir §4* |
| 5 | **Uniquement des options fonctionnelles** | Les inertes sont **retirées** et **consignées en tickets de suivi** |
| 6 | **Rien d'ignoré silencieusement** | Rejets **nommés**, brouillon **conservé** ; **vérifier aussi validation ET envoi** |
| 7 | **Échec partiel** : fichier en échec affiché + **« Réessayer »**, **sans renvoyer** ce qui est passé | Chaque résultat **lié à son fichier** — retrait, remplacement, réordonnancement |
| 8 | **Création en échec après envois réussis** : médias **conservés**, **doublons de publication prévenus** | |
| 9 | **Portée de la reprise à dire dans l'interface** | ⛔ **Ne pas promettre de récupération après rechargement** sans l'avoir implémentée **et vérifiée** |
| 10 | **Chrome réel conservé** | navigation desktop · rail medium · en-tête **et** barre basse mobile |
| 11 | **Clavier ouvert** : adapter l'espace **sans masquer** la saisie ni les commandes | |
| 12 | **`Publier` actif dès qu'un texte seul est valide** | **correction de planche actée par Kyria** |
| 13 | **Compteurs calculés**, **cibles tactiles accessibles** | **Les détails des planches sont illustratifs, pas des mesures** |

### Référence visuelle

**Les deux planches fournies par Kyria le 2026-11-03** —
« *Une composition unique, adaptée aux trois formats* » et
« *Créer une publication — états complémentaires* ».
⚠️ **Elles REMPLACENT la première proposition de maquettes de l'agent**
*(canevas `https://claude.ai/artifact/UT31jtaFG8sCszVpRLGWx6`, conservé pour
mémoire, **sans valeur de référence**)*.

---

## 3. ✅ Ce qui est DÉJÀ ÉTABLI sur `/feed/new` — **et qu'il ne faut PAS casser**

**Acquis de `MEDIA-MULTI-PHOTO-01`, par lecture de code ET par recette.**

| Acquis | Preuve |
|---|---|
| **Le chemin d'ÉCRITURE est COMPLET** : `multiple`, **aperçus de TOUS les fichiers**, **envoi en boucle**, **`media_urls` envoyé ET stocké** *(plafond 10)* | **lecture de code**, 2026-11-02 · **reconfirmée** 2026-11-03 |
| **Les photos sélectionnées ne sont PAS perdues** | **recette**, 2026-11-02 |
| **Les cinq photos sont retrouvées après rechargement**, au fil et au profil | **recette**, desktop et medium |
| **Le verrou anti double-publication** *(`composer-publication-lock`)* | tests `lib/feed` |

---

## 4. 🔬 RELEVÉ REA du 2026-11-03 — **lecture de code, `dd7c22e1`**

> ⚠️ **Lecture de code, pas recette.** ⛔ **Aucune preuve d'exécution sur
> Preview n'a été produite ce jour** : **aucune publication n'a été faite.**

### Options retirées — **chacune avec le motif mesuré**

| Option | Ce qu'elle fait réellement | Ticket de suivi |
|---|---|---|
| **Autoriser les commentaires** | ✅ **appliqué serveur** (403 `COMMENTS_DISABLED`, testé) ❌ **mais le fil ne transporte pas l'information** : `to_feed_item` n'expose pas `composer` — **le lecteur voit le champ et se prend une erreur** | `FEED-COMMENTS-OFF-01` |
| **Programmer la publication** | ✅ **publication automatique prouvée** (cron ARQ `run_at_startup`, worker embarqué dans le service unifié Railway, **5 tests**) ❌ **mais l'auteure ne voit JAMAIS sa publication programmée** : **tous** les chemins de lecture filtrent `is_active = True`, **aucun endpoint ne liste les programmées**, **aucune annulation** | `FEED-SCHEDULE-UI-01` |
| **Audiences restreintes** | ❌ **aucun graphe d'abonnement n'existe** ; `followers`/`close_friends`/`custom` **échouent fermé** — seule l'auteure voit sa publication | `FEED-AUDIENCE-01` |
| **Identifier personnes / lieu / activité / tribu** | ❌ **stockés, sans aucun effet** : ni notification, ni affichage, ni routage | `FEED-TAGS-01` · `FEED-PLACE-01` · `FEED-TRIBE-POST-01` |
| **Republication Instagram / TikTok / Facebook / X** | ❌ **aucune intégration sortante**, **et cases cochées par défaut** | `FEED-CROSSPOST-01` — ⛔ **zone rouge** (OAuth tiers) |
| **Légende depuis le média · Autoriser les partages** | ❌ stockés, sans effet ni application serveur | `FEED-SHARE-OFF-01` |
| **Format Sondage** | ❌ question et options stockées **mais absentes du contrat de lecture du fil** — **un sondage publié n'est jamais restitué** | `FEED-POLL-01` |
| **Format Lieu** | ❌ `canPublish` exige un `locationLabel` **qu'aucun champ ne permet de saisir** | couvert par `FEED-PLACE-01` |

**Comportement conservé** : commentaires **autorisés** par défaut pour les
nouvelles publications. ⛔ **Les publications existantes ne sont pas touchées**
et leurs commentaires désactivés **ne sont pas réactivés**.

### Défauts mesurés que la reconstruction corrige

- **Le palier medium n'est pas dessiné** : une seule bascule à **640 px**, et la
  grille desktop ne se scinde qu'à **1024**. Le medium hérite d'une vue desktop
  **empilée que personne n'a dessinée**.
- **Les onglets jettent silencieusement un fichier** qui ne correspond pas au
  format actif *(`use-new-post-draft.ts:200-201`)*.
- **Un seul message pour tout un lot** de refus, **réécrit** à chaque fichier.
- **Le plafond de 10 coupe en silence** les fichiers suivants.
- **Un échec au n-ième envoi abandonne les médias déjà transférés** ; le réessai
  **renvoie tout**.
- **« Identifier un lieu » ouvre le sélecteur de fichiers.**
- **Deux boutons Publier** au desktop.

### ⚠️ Portée réelle d'une publication « publique » — **mesurée**

1. **Dans le fil** : **membres connectés**, **toutes villes confondues** — la
   ville n'est qu'une **priorité de tri**, **jamais un filtre**
   *(`post_repository.py:124-141`)*.
2. **Hors connexion** : `GET /profile/{username}/posts` utilise
   `get_current_user_optional` et **sert les publications publiques à un
   visiteur SANS COMPTE** quand le profil de l'auteur est public ; la page
   **n'est pas exclue de l'indexation** *(`robots.ts` n'écarte que
   `/profile/me`)*.

⛔ **« Visible par tout Reims » est faux DEUX FOIS** : la limite géographique
n'existe pas, et l'accès hors connexion n'est pas dit. **Mention retenue :
« Publication publique », sans explication.**

### Contraintes de débit

**60 envois/heure et par compte**, **120/heure et par IP** — soit **6
publications de 10 médias par heure**, nouvelles tentatives comprises.

---

## 5. 📍 ÉTAT au 2026-11-03 — **fin de session de cadrage**

### Git

| | |
|---|---|
| **branche de travail** | **`fix/mobile-publishing-p0`** = **`dd7c22e1`** |
| **Preview** | **`feat/c3-videos-refonte-final`** = **`dd7c22e1`** |
| **`main`** | **`3e0b27ba`** — ⛔ **aucune fusion** |
| **PR #203** | **BROUILLON** |
| **arbre de travail** | ⛔ **code applicatif NON MODIFIÉ** · **documents non commités préservés**, **+2 créés ce jour** *(spec, plan)*, **+2 modifiés** *(cette passation, l'index)* |

### Livrables de cette session

| Document | Rôle |
|---|---|
| [`../../superpowers/specs/2026-11-03-feed-new-reconstruction-design.md`](../../superpowers/specs/2026-11-03-feed-new-reconstruction-design.md) | **Spec** — ✅ **validée par Kyria** |
| [`../../superpowers/plans/2026-11-03-feed-new-ux-01.md`](../../superpowers/plans/2026-11-03-feed-new-ux-01.md) | **Plan** — ✅ **validé**, 12 tâches, exécution par sous-agents |
| `.superpowers/sdd/2026-11-03-feed-new-ux-01/CONTRAT-backend-frontend.md` | **Contrat** backend ↔ frontend — fait autorité sur les briefs |
| `.superpowers/sdd/2026-11-03-feed-new-ux-01/progress.md` | **Ledger** — rulings, revues, carte de reprise |

### ✅ EXÉCUTION DU PÉRIMÈTRE — **terminée**, revue finale en cours

⛔ **AUCUN COMMIT. `HEAD` TOUJOURS `dd7c22e1`, index vide.** *(consigne de Kyria.)*

**Deux agents à périmètres disjoints** *(écart assumé au protocole sous-agents,
demandé par Kyria)* — ⛔ **aucun agent neuf créé**, les mêmes repris à chaque
interruption.

| Agent | Périmètre | Résultat |
|---|---|---|
| **backend** | `backend/**` | **tâche 0 — idempotence** · **2059 passés / 19 sautés / 0 échec EN CONTENEUR LINUX** · `ruff` propre · `mypy app tests` → *Success, 720 fichiers* |
| **frontend** | `frontend/**` | **tâches 1 à 9 et 11** · **1118 passés / 0 échec** *(sérialisé)* · `typecheck` 0 · `lint` 0 |

**Tous les chiffres ci-dessus ont été REJOUÉS par le contrôleur**, ⛔ jamais
repris sur parole.

#### ⚡ L'idempotence est RÉELLE depuis la bascule

`new-post-screen.tsx:48` → `useNewPostPublication(draft, user?.id ?? null)`.
Tant que l'écran gardait son `publish` interne, la clé **ne protégeait rien**
en production. ⇒ **La réserve est levée.**

#### 🔬 Isolation de la suite backend — **constatée dans le journal**

Commande confirmée **avant** lancement, base `yunicity_test_e74681a4f5e9`
**créée puis supprimée**, Redis **db 1**, et ⛔ **`yunicity_qa` : 0 occurrence**.
**Piège trouvé par l'agent** : `./backend:/app` est un **bind mount**, donc le
conteneur exécute le code de l'arbre, pas l'image figée — vérifié de l'intérieur.

#### ⚠️ Trois défauts de plan attrapés par les exécutants — **à consigner**

1. **`buildCreatePayload` lisait l'état** au lieu de recevoir les médias en
   argument → la publication serait partie avec **`media_urls: []`**, la rupture
   même que `MEDIA-MULTI-PHOTO-01` venait de réparer. *(Attrapé au scan pré-vol.)*
2. **`moveMedia` renvoyait toujours `0`** : React n'exécute pas la fonction de
   mise à jour avant le retour. **J'avais écrit l'inverse en commentaire.**
3. **La suppression conditionnelle de `feed-desktop-composer-contract.test.ts`**
   reposait sur une condition **fausse** : ce fichier ne couvre pas `/feed/new`,
   il contrôle **les quatre autres composers**.

#### ⚠️ Le risque de la bascule s'est MATÉRIALISÉ — et a été rattrapé

L'implémenteur a dû **restaurer deux acquis que l'assemblage naïf perdait** :
le refus de média qui bloque « Publier », et l'effacement de l'annonce à une
nouvelle sélection. **Les 31 tests de `new-post-screen-media.test.tsx` sont tous
conservés** *(0 supprimé)*. Un seul comportement change **volontairement** — le
réessai ne renvoie que ce qui manque — et le test le dit.

#### ⚠️ Ce que le test par mutation a révélé — **défaut réel, encore ouvert**

**Après `session.rollback()`, SQLAlchemy expire les objets de la session.**
`user` ayant été chargé dans **cette même** session, l'utiliser ensuite dans la
branche `IntegrityError` déclencherait un rafraîchissement implicite — qui, en
async, **lève au lieu de répondre**. ⇒ **500 sous charge réelle**, là où le test
`asyncio.gather` restait **vert**.

**C'est précisément ce que la preuve exigée devait débusquer** : la branche de
course n'était pas seulement non testée, elle était **cassée**. ⛔ **Aucun
`refresh` n'existe aujourd'hui dans ce chemin.**

---

## 6. ✅ DÉCISION PRISE le 2026-11-03 — **idempotence au périmètre**

**Le verrou anti double-clic N'EST PAS une protection contre une réponse
serveur perdue.** Ce sont **deux risques distincts** :

- **Double-clic** — ✅ **couvert** : ref **synchrone**, testée par un test
  comportemental. **Portée : un onglet, un montage, un tick.**
- **Réponse serveur perdue** — ⛔ **NON COUVERT** : `POST /api/v1/posts`
  **n'a aucune idempotence** — ni clé, ni `client_request_id`, ni
  déduplication. Si la publication est créée et que la réponse se perd, **un
  réessai crée un doublon**, et le verrou n'y change rien : il est relâché.

**Kyria a tranché : la protection ENTRE AU PÉRIMÈTRE**, en **tâche 0** du plan
— **avant tout code d'écran**. **Règles arrêtées** *(détail au §8 de la spec)* :

1. **Une tentative logique = une clé**, conservée **à travers les réessais** —
   ⛔ **jamais une clé par clic** ; renouvelée seulement après succès ou abandon.
2. **Clé liée à l'utilisateur authentifié**, unicité tenue par un **index
   unique en base** — ⛔ **pas par un test applicatif préalable**, qui
   laisserait une fenêtre de course.
3. **Même clé, même contenu** → **200**, la publication existante est renvoyée.
4. **Même clé, contenu différent** → **409 `POST_REQUEST_CONFLICT`**, refus
   explicite. ⛔ **Ni création, ni écrasement.**
5. **Tests exigés** : réponse perdue · **concurrence** · **isolation entre
   comptes** · migration **compatible avec les publications existantes**.
6. **Le verrou anti double-clic reste**, en complément.

⚠️ **Portée** : la protection couvre la **création de la publication**, **pas
l'envoi des médias** — un média renvoyé produit un fichier de plus
*(`MEDIA-ORPHANS-01`)*.

---

## 7. ⛔ RÉSERVES HÉRITÉES — **ouvertes, et qui ne sont pas de ce ticket**

| Réserve | Nature |
|---|---|
| **Audit des dépendances ROUGE** — 21 High/Critical, **`next` en CVSS 9.5** | ⛔ **ZONE ROUGE** · **sujet SÉPARÉ** · **assumé sur Preview, jamais levé** |
| **La fluidité du carrousel n'est pas CHIFFRÉE** | relevé préparé, **non joué** |
| **Le mono-photo ne demande aucune variante** | ⚠️ touche le **FIL**, pas `/feed/new` |
| **« +N » de tuile rendu seulement si le média est prêt** | **défaut PRÉEXISTANT** |
| **`MEDIA-05-PHOTO-LETTERBOX`** | **arbitrage produit**, lots **mixtes** |
| **Playwright n'est pas en CI** | **tests de navigateur LOCAUX** — ⚠️ **à rejouer à la main** |
| **Publication de test CONSERVÉE** | ⛔ **ne pas supprimer sans décision** |
| **Médias orphelins après abandon** | **aucun ménage n'existe** → `MEDIA-ORPHANS-01` |

---

## 8. ⚠️ INCONNUES — **à ne pas combler par déduction**

- **L'état réel de `/feed/new` sur Preview `dd7c22e1`** : ⛔ **jamais relevé
  écran par écran.** **Tout le relevé du §4 est de la LECTURE DE CODE.**
- **Le comportement du clavier mobile** : ⛔ **non vérifié sur appareil réel.**
  L'application **ne déclare aucun `viewport` Next**, donc aucune directive
  `interactive-widget` — **hypothèse à tester, pas un fait acquis**.
- **Le coût réel de la tâche 11** tant que la décision du §6 n'est pas prise.
- **Les quatre specs Playwright du composeur** ciblent l'ancienne structure :
  ⛔ **à lire avant de les toucher**, elles couvrent un acquis
  `MEDIA-MULTI-PHOTO-01`.

---

## 8 bis. 📍 SESSION du 2026-11-03 → 04 — **revue finale traitée, planches comparées**

> **Méthode REA × Loop, sans sous-agent, sans installation.** ⛔ **Aucun commit,
> push ni déploiement.** `HEAD` toujours **`dd7c22e1`**, index vide.

### Décisions de Kyria reçues en séance

1. **Disque** : nettoyer le **seul cache npm** (fait : **+1 155 Mo**, C: était à
   **0 octet**) ; `docker system df` autorisé pour bilan ; ⛔ **aucun nettoyage
   Docker**.
2. **Les deux planches font référence** pour `/feed/new`. **Rétablir le rail
   medium, son « Créer » et le « + » mobile**, en réutilisant le shell existant.
3. **La navigation protège le brouillon modifié**, y compris depuis le rail et
   la barre basse, en **annonçant la perte**, ⛔ **sans promettre d'annuler** un
   envoi incertain.
4. **I1–I8 et écarts visuels : deux listes distinctes.**

### ⚠️ EXCEPTION À C3-CITIZEN-MEDIUM-SHELL-R1E — **consignée**

`/feed/new` **sort** de `PREFIXES_PARCOURS_CREATION`
(`citizen-medium-shell-contract.ts`) et de `CREATE_HUB_HIDDEN_PATH_PREFIXES`
(`create-hub-routes.ts`) : **rail medium présent, Accueil actif, « Créer » au
rail, « + » en barre basse mobile.** **Preuve** : décision n°10 + planches +
consigne de Kyria du 2026-11-03. **Les autres parcours de création gardent R1E.**
**Bornage** : la top nav **desktop** ne pose **pas** « Créer » sur cette route
(planche desktop sans ce bouton) → surface explicite **`citizen-top-nav`**.
Spec e2e `29-citizen-medium-shell` **mise à jour** (`/feed/new` retiré des
listes « sans rail ») — ⚠️ **non rejouée** : elle exige la pile QA.

### Garde de sortie — `lib/navigation/leave-guard.ts` + `hooks/use-leave-guard.ts`

Un seul intercepteur couvre **les liens du chrome** (capture document, avant
`next/link`), **les actions du Create Hub** (`navigateFromCreateHub` →
`guardNavigation`) et **rechargement / fermeture** (`beforeunload`).
Deux variantes : **brouillon** (« Quitter sans publier ? » · « Votre texte et vos
médias seront perdus. » · « Quitter et perdre le brouillon ») et **envoi
incertain** (« Quitter n'annule pas cet envoi. » · « Le brouillon affiché ici
sera perdu. »). ⛔ **Limite assumée** : le bouton **« précédent » du
navigateur n'est PAS intercepté** (le routeur Next pilote `history`).

### Liste A — **revue finale, I1 à I8**

| # | Statut | Correction · preuve |
|---|---|---|
| **I1** | ✅ corrigé | `issueInconnueSousCleRef` : la clé ne repart sur 422/429 **que si aucune issue indéterminée** n'a eu lieu sous elle ; une clé **retrouvée** compte comme indéterminée. Tests : 503→429→succès = **même clé ×3** ; clé retrouvée + 429 = **conservée**. |
| **I2** | ✅ corrigé | Le dialogue « envoi incertain » **existe et est rendu** (`creating` / `undetermined`). Test d'**écran** : `←` après issue indéterminée → `alertdialog` sans « Abandonner ». |
| **I3** | ✅ corrigé | `createFeedPost(payload, signal)` + échéance **30 s** (`POST_CREATE_TIMEOUT_MS`) → issue **indéterminée**, clé conservée. Test à horloge simulée. |
| **I4** | ✅ corrigé | Échec de **création** = famille distincte : « La publication n'a pas pu être créée. » — jamais le nom de l'auteur. Tests composant **et** écran (429). |
| **I5** | ⚠️ **écrit, NON EXÉCUTÉ** | `tests/test_post_client_request_migration.py` : Alembic réel 0065→0066→0065, NULL existants, index scopé auteur, multi-NULL, même clé refusée / autre auteur acceptée, aucune publication perdue au downgrade. `ruff` ✅ `mypy` ✅ **sur le poste**. ⛔ **Exécution bloquée : Docker ne répond plus** (voir inconnues). |
| **I6** | 🔁 **RECLASSÉ — erreur de classement de la revue** | La revue n'a lu que `backend-ci.yml`. **`docker-ci.yml` exécute TOUTE la suite, intégration comprise, sur base jetable**, à chaque PR vers `main` touchant `backend/**`. **Preuve** : run **`41535435679`** (branche `fix/mobile-publishing-p0`, 2026-11-02) → **2051 passed, 19 skipped**, base `yunicity_test_ba6173a8e292` créée puis supprimée, `test_passport_migration.py` exécuté. ⚠️ **Ce run porte un SHA ANTÉRIEUR** : il ne valide **pas** le présent diff. **Trou réel restant** : `main` n'a **aucun contrôle requis** (`GET …/protection/required_status_checks` → **404 « not enabled »**) — réglage du dépôt, **décision de Kyria**. Aucun workflow modifié. |
| **I7** | ✅ corrigé | `overflow-hidden` déplacé sur le **cadre de l'image** ; menu au-dessus des tuiles (`z-20`) ; **pastille ✕** de retrait direct (44 px) ; Échap ferme le menu. Test : aucun ancêtre du menu ne rogne. |
| **I8** | ✅ corrigé | Le lot est **relu** avant chaque envoi et à la composition (`mediaIdsNow`) : un média retiré **n'est ni envoyé ni publié**, et **l'ordre publié suit l'ordre visible** (défaut latent découvert : après reprise + réordonnancement, l'ordre publié suivait l'ordre d'envoi). Ajout inerte pendant l'envoi. 3 tests. |

### Liste B — **écarts visuels aux planches**

| # | Écart relevé (captures `dd7c22e1` + arbre) | Statut |
|---|---|---|
| V1 | Medium : ni rail, ni barre de contenu | ✅ rail réel + `FeedMediumHeader` réutilisé **sans « Filtrer »** (prop rendue optionnelle, fil inchangé) |
| V2 | « + » mobile et « Créer » rail absents | ✅ (exception R1E ci-dessus) |
| V3 | Fond blanc, pas de carte | ✅ carte blanche sur `--yunicity-surface` |
| V4 | Vide : simple bouton | ✅ zone en pointillés « Jusqu'à 10 médias » + « Glissez-déposer vos fichiers ici » (desktop) |
| V5 | Tuile « + » et mention de dépôt absentes | ✅ ; **glisser-déposer RÉELLEMENT implémenté** (`NewPostDropCard`, mêmes contrôles que le sélecteur) |
| V6 | ✕ absent | ✅ (= I7) |
| V7 | Échec : pas d'état par vignette, titre au nom de fichier, deux actions | ✅ Envoyée / Envoi… / Échec / En attente, cadre rouge, « photo 3 », réessai en contour, **Publier inerte** ; nom de fichier en complément |
| V8 | Avatar en initiales | ✅ `avatar_url` du profil transmis — ⚠️ **non vu avec une vraie photo** (bouchon sans avatar) |
| V9 | Compteur aligné à gauche | ✅ centré |
| — | **Non reproduits, volontairement** | ① bande compacte de 5 vignettes en état d'échec : la grille est conservée pour garder ✕ / ••• (retirer le média fautif) ; ② **avatar dans l'en-tête mobile** : le `WebMobileHeader` partagé n'en a sur **aucune** route — chrome réel conservé (décision n°10), **à arbitrer par Kyria** ; ③ Accueil actif au rail medium : conséquence du rattachement à `/feed`. |

### Preuves acquises — **environnement : poste Windows de Kyria, arbre de travail sur `dd7c22e1`, non commité**

- **vitest web**, sérialisé : `lib/feed lib/create-hub lib/layout lib/navigation lib/shell` → **70 fichiers, 869 tests, 0 échec** (rejoué après la dernière retouche).
- **vitest utils** : `post-composer-labels` + `feed-api` → **15/15**.
- **typecheck web** `tsc -p tsconfig.typecheck.json` → **0** · **utils** → **0**.
- **lint web** → **0 erreur**, 38 avertissements **tous préexistants** (aucun dans un fichier touché).
- **Captures** `next dev` + API **entièrement interceptée** (aucune donnée réelle), 1280 / 820 / 390 : vide, 5 médias, sortie depuis le chrome (top nav, rail, barre basse), échec partiel mobile.
- **Débordement horizontal, application réelle** (`next dev`, API interceptée) : **0 px** à 390 · 480 · 640 · 720 · 820 · 900 · 1023 · 1024 · 1280.
- **Harnais Playwright `media01`** (local, hors CI, Chrome installé) → **60 passés, 12 sautés, 0 échec**.
  ⚠️ **Défaut PRÉEXISTANT révélé, consigné** : depuis le lot UI (shell non suivi
  `new-post-shell.tsx`), la page du harnais **ne rendait plus AUCUN composer** —
  `CitizenYunicityMenu` (dans `WebMobileHeader`) exige un provider absent. Aucun
  passage du harnais n'était tracé au ledger depuis : la panne était **muette**.
  Corrigé en bouchonnant `NewPostShell` et `FeedMediumHeader` (chrome, comme
  `CitizenTopNav` / `WebSidebar` déjà bouchonnés). Deux attentes du harnais
  portaient l'**ancien contrat** (refus en `role="alert"`, « Ignorer les médias
  refusés ») : **alignées sur la spec validée** (`section[role="status"]`,
  « Continuer sans eux », fichier refusé nommé). ⚠️ Avant correction, les tests
  `/feed/new` étaient **SAUTÉS** à 390 et 1440 px (`estRendu` lisait un premier
  enfant masqué) — ils tournent désormais aux trois largeurs.
- ⛔ **Non rejoué** : suite backend, test de migration, specs Playwright QA, clavier sur appareil réel.

### ⚠️ Inconnues et incidents de session

- **Docker Desktop ne répond plus** : `docker system df` et `docker ps` bloquent
  (> 10 min) depuis la saturation du disque. **Bilan Docker NON établi.**
  ⛔ **Aucun redémarrage sans accord de Kyria** (porte la pile QA).
- **Disque C:** : **~1,1 Go libres** — marge faible pour un `next build` ou la
  suite conteneur.
- **Défaut latent repéré, NON corrigé** : le texte modifié **pendant** l'envoi
  n'est pas celui publié (`buildCreatePayload` lit le texte du rendu du clic).


## 8 ter. 📍 SESSION du 2026-11-04 — **décisions de Kyria appliquées**

### Décisions reçues

1. **Docker Desktop : redémarrage autorisé** (aucun nettoyage, aucun volume).
2. **Avatar mobile** : shell existant conservé — ⛔ pas d'avatar propre à cette page.
3. **Échec partiel** : **grille acceptée**, états et retrait accessibles.
4. **Rail medium** : « Accueil » **non actif** sur `/feed/new`, « Créer » actif.
5. **Contrôles requis sur `main`** : **sujet séparé**, rien modifié.
6. **Contenu figé** pendant une tentative en cours ou indéterminée ; ⛔ **une
   même clé ne sert jamais un contenu modifié**.
7. **« Précédent » du navigateur couvert** — sortie courante, pas marginale.

### Docker — **redémarré, preuves**

- Vérification préalable : seuls deux clients CLI **de cette session** étaient
  bloqués (`system df`, `ps`) ; deux `docker stats` d'un outil de supervision ;
  **aucun `compose run`**. ⇒ aucune tâche utile.
- `docker desktop restart` sans réponse (240 s) → arrêt des processus Docker
  Desktop + `wsl -t docker-desktop` (⛔ **pas** `wsl --shutdown`) → relance.
  Démon **29.3.0** rétabli. **Aucun volume touché.**
- **Bilan `docker system df`** *(constat, aucune action)* : images 15,6 Go dont
  11,2 récupérables · cache de build 13,6 Go dont 7,9 · volumes 4,9 Go dont 3,9.

### ✅ I5 — **FERMÉ** *(conteneur QA, arbre non commité sur `dd7c22e1`)*

`run_backend_tests tests/test_post_client_request_migration.py tests/test_post_idempotency.py`
→ **9 passed**, base `yunicity_test_3c1ca9730764` **créée puis supprimée**.
**Test par mutation** : `unique=True` retiré de la migration → **1 failed**,
`assert 'UNIQUE' in 'CREATE INDEX uq_posts_author_client_request …'` ; fichier
**restauré à l'identique** (`cmp`). ⇒ le test **sait échouer** sur la propriété
qu'il protège.

### Contenu figé et clé liée au contenu

- **Interface** : texte `readOnly` + mention « Le contenu est figé tant que
  l'envoi n'est pas confirmé. » ; ajout, ✕, menu, dépôt **inertes** — pendant
  `uploading`, `creating`, `undetermined`, **et** `failed` sous une clé dont
  une issue est restée inconnue.
- **Hook** (défense indépendante de l'écran) : la clé est liée à une
  **empreinte** (texte normalisé + médias ordonnés). Contenu modifié sans
  incertitude → **clé neuve** ; contenu modifié sous clé incertaine →
  **rien ne part**. 6 tests.
- ⚠️ **Cas assumé, conforme au contrat §3.4 bis d** : une clé **retrouvée
  après rechargement** est reprise avec le contenu nouvellement saisi — son
  contenu d'origine est inconnu ; le serveur répond **409** si la tentative
  perdue avait abouti avec un autre contenu.

### « Précédent » du navigateur

Entrée **sentinelle** (même URL, **état Next conservé** + marqueur) ;
`popstate` → sentinelle réarmée + confirmation ; confirmer → `history.go(-2)`.
**Preuve en Chrome réel, routeur Next réel** (`next dev`, API interceptée) :
retour retenu, URL inchangée, **aucun rechargement** (marqueur JS conservé),
« Continuer » garde le texte, second retour de nouveau retenu, « Quitter » sort
réellement, brouillon vide = sortie directe — **10/10**.
⚠️ **Limite** : la garde levée (brouillon vidé), la sentinelle reste — un
« Précédent » de plus revient sur la même page.

### Rail medium

`resolveCitizenMediumRoute("/feed/new")` → `{ presentation: "rail", createActive: true }` :
**aucune destination `aria-current`** (vérifié en Chrome : 0), « Créer » actif.
⚠️ **Non traité, à signaler** : la **barre basse mobile** marque encore
« Accueil » actif sur `/feed/new` (décision reçue limitée au rail).

### Preuves de fin de session *(poste Windows, arbre non commité sur `dd7c22e1`)*

- vitest web `lib/feed lib/create-hub lib/layout lib/navigation lib/shell` →
  **70 fichiers, 878 tests, 0 échec** · utils **15/15** · typecheck web **0** ·
  utils **0** · lint **0 erreur** (38 avertissements préexistants, aucun dans
  un fichier touché) · harnais Playwright `media01` **60 passés, 12 sautés,
  0 échec** (rejoué après le gel du contenu).
- **Page de recette** (planches et captures côte à côte, privée) :
  `https://claude.ai/artifact/MdWUTthkg5Wy3aGy1TudjR`.

## 8 quater. 📍 SESSION du 2026-11-04 (suite) — **barre basse, QA, présentation**

### Barre basse mobile — **alignée sur le rail**

Règle unique `isCreationRouteWithChrome` (`citizen-medium-shell-contract.ts`),
consommée par le rail **et** la barre basse : sur `/feed/new`, **aucune
destination `aria-current`**, « + » marqué actif (anneau de marque + « Page
actuelle : créer » pour les lecteurs d'écran). `/feed` inchangé (Accueil actif).
Tests : `lib/layout/mobile-bottom-nav-creation.test.tsx`.

### ✅ QA Playwright — **15 specs, 289 tests, 0 échec**

**Environnement** : pile QA locale (4 services sains), `pnpm build` de l'arbre
non commité sur `dd7c22e1`, serveur production-like `scripts/qa-web-server.sh`
(build servi == disque, 41 chunks), protocole `scripts/qa-spec-run.sh` — **une
baseline dédiée par spec**, un worker, aucun retry, projet `functional-mobile`.

| Spec | Résultat | Lien avec le changement |
|---|---|---|
| 09-page-landmarks | 13 ✅ | `/feed/new` |
| 29-citizen-medium-shell | 52 ✅ | **modifiée** (exception R1E) |
| 30-medium-feed-publication-cards | 36 ✅ | `/feed/new` |
| 22-medium-feed-shell-rail | 25 ✅ | rail medium |
| 23-medium-feed-header · 32-medium-feed-filter | 32 · 21 ✅ | `FeedMediumHeader` (filtre rendu optionnel) |
| 08 · 10 · 20 · 21 | 6 · 26 · 11 · 24 ✅ | barre basse, Create Hub |
| 12-desktop-header-geometry | 16 ✅ | top nav (surface `citizen-top-nav`) |
| 16 · 17 · 18 · 27 *(composeurs du fil)* | 1 · 2 · 6 · 18 ✅ | acquis MEDIA-MULTI-PHOTO |

**Non rejouées, volontairement** : les autres specs qui citent un composant
touché (06, 13, 14, 19, 24, 31, 36, 37, 42, 43) — mes changements y sont
**bornés à `/feed/new`** et couverts en unitaire sur les autres routes.
⚠️ **Constat de build, hors ticket** : `pnpm build` journalise
`fetch failed ECONNREFUSED 127.0.0.1:8010` au prérendu quand l'API n'est pas
démarrée — sortie 0, préexistant.
⚠️ **Aucune spec QA ne couvre encore** la garde de sortie, le gel du contenu ni
« Précédent » : prouvés en **Chrome réel** (10/10), pas en suite QA.

### Présentation

Page de recette mise à jour (v2) : **paire desktop 1280 px · 5 médias en tête**,
captures `v5` postérieures à toutes les corrections.

### Consignes de Kyria — 2026-11-04 (fin)

- **Recette visuelle humaine** : desktop → medium → mobile, puis **clavier sur
  téléphone réel**. ⛔ **La comparaison faite par l'agent ne vaut pas
  validation.** Commits **en attente de cette recette**.
- **Amélioration consignée** : spec QA automatisée pour la **sortie confirmée**,
  le **contenu figé** et **« Précédent »** (aujourd'hui prouvés hors suite).
- **Incident ouvert — `yunicity-video-worker-qa` « unhealthy »** après la
  campagne QA : `Health check exceeded timeout (10s)` répété. ⚠️ **Origine NON
  établie** — la charge machine est une **hypothèse**, pas un diagnostic.
  Aucun redémarrage effectué.
- **Recette desktop (Kyria)** : structure validée. **Correction demandée et
  faite** : vignettes et tuile « + » en **5:4** (`aspect-[5/4]`, cadre d'aperçu
  seulement, `object-cover`, fichiers intacts) — test ajouté. Logo et
  navigation : écarts **acceptés** (shell Yunicity). Cadrage réel des photos :
  **non jugeable** avec les images factices.
- **Recette desktop 1280 px · 5 médias : VALIDÉE VISUELLEMENT par Kyria**
  (sur capture, données factices).
- **Recette medium** : surlignage « Créer » et différences du shell
  **acceptés**. **Correction demandée et faite** : la carte touchait le rail
  **et** le bord droit (la grille du shell rail ne pose aucune marge latérale).
  Gouttière `--feed-medium-content-gutter` posée sur `.new-post-content` de
  640 à 1023 px → marges **égales** : 16/16 px à 640, 20/20 à 820, 21/21 à
  900 ; **débordement 0** ; desktop ≥ 1024 inchangé. Paire corrigée
  présentée.
- **Recette medium 820 px · 5 médias : VALIDÉE VISUELLEMENT par Kyria**
  (marges équilibrées, « Créer » actif accepté).
- **Recette mobile 390 px** : trois paires présentées (5 médias, vide, échec
  partiel), captures **à l'écran 390 × 844**, pas en page entière. **Trois
  constats soumis à Kyria, rien corrigé** :
  1. **Échec partiel** : avec la grille (acceptée), l'encart d'échec est
     **sous la ligne de flottaison** — invisible sans défilement.
  2. **« Publier » sort de l'écran au défilement** : l'en-tête du composeur
     n'est pas collant, alors que la spec (§ clavier) l'exige.
  3. **5 médias** : le bouton d'ajout passe sous la barre basse ; la maquette
     tient en un écran (zone de texte plus basse).
- **Mobile vide : VALIDÉ VISUELLEMENT par Kyria.** Grille en échec maintenue.
- **Corrections décidées et faites** *(Chrome réel 390 × 844, mesures)* :
  1. **Échec révélé UNE fois** à l'apparition : `scrollIntoView` + focus sur
     l'encart, marges de défilement = barres **mesurées**
     (`useMobileChromeInsets`) → encart **entier** 521→779 dans la zone utile
     138→791, focus ✅. Tests : appel unique, focus, pas de redéclenchement.
  2. **En-tête du composeur collant** sous l'en-tête Yunicity (mobile
     seulement) → « Publier » visible en fin de défilement ✅. ⚠️ **À vérifier
     clavier réel.**
  3. **Espace au-dessus de la barre basse** : **3 px → 24 px**, zone de texte
     inchangée.
- 🐞 **DÉFAUT PARTAGÉ découvert — TICKET SÉPARÉ À OUVRIR, non corrigé ici** :
  `CITIZEN_MOBILE_BOTTOM_NAV_PADDING` (`lib/layout/feed-mobile-refonte.ts`)
  assemble sa classe Tailwind par interpolation → **jamais générée**
  (**0 occurrence** dans le CSS de production `.next-build`) : la réserve de
  barre basse est **inopérante** dans **16 autres shells** (discussions,
  événements, sortir, quartiers, notifications, organisation, passport, lieux,
  profil, réglages, shell citoyen, création de tribu, tribus, vidéos…).
  `/feed/new` a sa propre réserve (CSS, hauteur mesurée) avec `TODO(debt)`.
  ⚠️ Impact réel sur ces écrans **non mesuré**.

### Test sur iPhone — **revue LAN préparée, sans déploiement** *(2026-11-04)*

- **Build de production** de l'arbre non commité (`dd7c22e1` + corrections
  5:4, marges medium, en-tête collant, révélation d'échec), servi par
  `scripts/qa-web-server.sh` avec **`E2E_PROXY_HOST=0.0.0.0`** (« revue LAN »
  prévue par C3-QA-SEC-01). **Seule la façade 3002 écoute sur le réseau** ;
  `next start` (3003) et l'API (8010) restent en boucle locale.
- **Pare-feu** : aucune règle modifiée — processus lancés avec le binaire Node
  déjà autorisé (`AppData/Local/nvm/v24.18.1/node.exe`) ; le chemin
  `C:/nvm4w/nodejs/node.exe` n'a pas de règle. Profil réseau Wi-Fi : **Public**.
- **Preuve (WebKit, profil iPhone 13, par `192.168.1.11:3002`)** : connexion,
  redirection vers `/feed/new`, en-tête `sticky`, « Publier » actif, **aucune
  erreur de page**. `next dev` en LAN **écarté** : il bloque des ressources de
  développement hors `localhost` (redirection post-connexion cassée).
- **Lien** : `http://192.168.1.11:3002/feed/new` · compte **`qa.citizen.b`**
  (`qa.citizen.a` a consommé son quota : 5 connexions / 15 min par e-mail).
- ⚠️ **Docker de nouveau dégradé** : CLI et `docker exec` sans réponse, alors
  que conteneurs et API répondent. Remise à zéro des quotas **impossible**.
  Cause **non établie** — disque à ~560 Mo libres = **hypothèse**.
- ⛔ **À arrêter après le test** : `sh scripts/qa-web-server.sh --stop`.

## 9. ▶️ PROCHAINE ACTION — *mise à jour le 2026-11-04*

> ⚠️ **La version précédente de cette section est PÉRIMÉE** : elle annonçait
> la « revue indépendante finale EN COURS » et une tâche 10 que « aucun agent »
> ne pouvait conduire faute d'avoir vu les planches. La revue a rendu
> **REQUEST CHANGES** (`revue-finale-verdict.md`) et la session du §8 bis l'a
> traitée **planches en main** (retrouvées dans le transcript de la session de
> cadrage). Restent, de l'ancienne tâche 10 : le **clavier sur appareil réel**
> et les **specs Playwright QA**.

**1.** **Recette visuelle de Kyria** sur la page de comparaison
(`https://claude.ai/artifact/MdWUTthkg5Wy3aGy1TudjR`) et en navigateur réel.

**2.** ⛔ **Toujours manuel** : **clavier sur appareil réel** (Android Chrome
**et** iOS Safari, 390 px).

**3.** *(Recommandé)* une spec QA pour la garde de sortie, le gel et
« Précédent », aujourd'hui prouvés hors suite.

**4.** **Puis**, et **sur décision de Kyria seule** : commits, PR, promotion.

*(Sujet séparé, hors ce ticket : contrôles requis sur `main` — I6.)*

⛔ **Aucun commit. Aucune fusion vers `main`. Aucun déploiement.**
**La publication de test reste conservée.**

### 🧹 Effet de bord à nettoyer en fin de ticket

**Pile Docker QA créée sur la machine de Kyria et laissée démarrée** :
`yunicity-postgres-qa`, `yunicity-redis-qa`. **Chaque passage de tests a créé
puis supprimé sa propre base `yunicity_test_<uuid>`** ; ⛔ **`yunicity_qa` n'a
jamais été visée.** **Laissée debout volontairement** : l'agent backend en a
besoin pour son tour de correction.

⛔ **Aucun commit. Aucune fusion vers `main`. Aucun déploiement.**
**La publication de test reste conservée.**

---

## 10. Portée de ce document

**Complète le workflow officiel
([`../YUNICITY-OFFICIAL-WORKFLOW.md`](../YUNICITY-OFFICIAL-WORKFLOW.md)) et le
sous-cycle BMAD ([`../../bmad/BMAD.md`](../../bmad/BMAD.md)).** **Il conserve
l'état ENTRE les sessions** *(règle 15)*, **et se met à jour à CHAQUE fin de
session** — **pas seulement à la clôture.**
