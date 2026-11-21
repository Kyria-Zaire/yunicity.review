# FEED-NEW-UX-01 — Reconstruction de `/feed/new` · spec

> **Statut** : proposée le 2026-11-03, **en attente de validation de Kyria**.
> ⛔ **Aucun code applicatif modifié.** Aucun commit, aucun déploiement.
> **Référence visuelle** : les deux planches fournies par Kyria le 2026-11-03
> (« Une composition unique, adaptée aux trois formats » et « Créer une
> publication — états complémentaires »). Elles **remplacent** la première
> proposition de maquettes.

---

## 1. Objectif et idée directrice

Reconstruire **l'écran de composition d'une publication** sur les trois
paliers — mobile, medium, desktop — de sorte que l'écran ne propose **que ce
qui fonctionne réellement de bout en bout**, et que rien de ce que
l'utilisateur choisit ne disparaisse en silence.

> **Idée directrice** *(rule 14, §4 anti-slop)* :
> « **Je raconte quelque chose de ma ville, et je vois exactement ce qui part.** »

**Critère de succès** : sur les trois paliers, une publication texte seule et
une publication de plusieurs médias partent, et tout refus — fichier écarté,
envoi échoué, limite atteinte — est **nommé, attribué à son fichier, et
rattrapable** sans perdre le brouillon.

---

## 2. Choix actés avec Kyria — ne pas rouvrir sans décision explicite

| # | Choix acté | Conséquence |
|---|---|---|
| 1 | **Composeur unique**, pas d'étapes | L'état `mobileStep` (`compose` / `media` / `options`) disparaît |
| 2 | **Aucun onglet de format** | `post_format` est **déduit du contenu**, jamais choisi |
| 3 | **Mention non cliquable « Publication publique »** | Le sélecteur d'audience disparaît ; `visibility` reste `public` |
| 4 | **Médias ordonnés**, retrait **et réordonnancement accessible** | Nouveau : le réordonnancement n'existe pas aujourd'hui |
| 5 | **Rejets nommés**, un par fichier | Remplace la chaîne d'erreur unique écrasée |
| 6 | **Reprise des envois échoués**, sans réenvoyer ce qui est passé | Nouveau |
| 7 | **Les options différées restent hors interface** | Elles ne sont ni affichées, ni désactivées, ni annoncées |
| 8 | **`Publier` actif dès que le texte seul est valide** | *Correction de la planche, actée par Kyria* |
| 9 | **Compteurs calculés**, cibles tactiles accessibles | Les détails des planches sont illustratifs, pas des mesures |
| 10 | **Chrome réel conservé** | Navigation desktop, rail medium, en-tête + barre basse mobile |
| 11 | **Idempotence de la création** *(acté le 2026-11-03)* | Le ticket **inclut un changement backend** : clé par tentative, migration, tests — voir §8 |

### Hors interface, en tickets de suivi

| Option retirée | Pourquoi | Ticket de suivi |
|---|---|---|
| Autoriser les commentaires | Appliqué serveur (403 `COMMENTS_DISABLED`) mais **le fil ne transporte pas l'information** : `to_feed_item` n'expose pas `composer` | `FEED-COMMENTS-OFF-01` — porter `allow_comments` dans le contrat de lecture + masquer le champ sur les trois cartes |
| Programmer la publication | Publication automatique prouvée (cron ARQ, 5 tests) mais **l'auteure ne voit jamais sa publication programmée** : tous les chemins de lecture filtrent `is_active = True`, aucun endpoint ne liste les programmées, aucune annulation | `FEED-SCHEDULE-UI-01` — liste des publications programmées, annulation, puis seulement l'UI de programmation |
| Audiences restreintes | **Aucun graphe d'abonnement n'existe** ; `followers` / `close_friends` / `custom` échouent fermé : seule l'auteure voit sa publication | `FEED-AUDIENCE-01` — après le graphe d'abonnement |
| Identifier des personnes / un lieu / une activité / une tribu | Stockés, **sans aucun effet** : ni notification, ni affichage au fil, ni routage vers la tribu | `FEED-TAGS-01`, `FEED-PLACE-01`, `FEED-TRIBE-POST-01` |
| Republication Instagram / TikTok / Facebook / X | **Aucune intégration sortante**, et les cases étaient **cochées par défaut** | `FEED-CROSSPOST-01` — zone rouge : OAuth tiers, jetons, quotas |
| Légende depuis le média · Autoriser les partages | Stockés, sans effet au rendu ni application serveur | `FEED-SHARE-OFF-01` |
| Format **Sondage** | Question et options stockées mais **absentes du contrat de lecture du fil** — un sondage publié n'est jamais restitué | `FEED-POLL-01` — contrat de lecture, votes, rendu, états UI |
| Format **Lieu** | `canPublish` exige un `locationLabel` qu'**aucun champ ne permet de saisir** | couvert par `FEED-PLACE-01` |

**Comportement conservé pour les nouvelles publications** : commentaires
autorisés (`allow_comments: true`, valeur par défaut actuelle).
⛔ **Les publications existantes ne sont pas touchées**, et celles dont les
commentaires sont désactivés ne sont pas réactivées.

---

## 3. Preuves du relevé REA — ce sur quoi la spec s'appuie

*(lecture de code au 2026-11-03, branche `fix/mobile-publishing-p0` = `dd7c22e1`)*

**Sain, à préserver** :

- Types acceptés **alignés** client ↔ serveur : `image/jpeg`, `image/png`,
  `image/webp`, `video/mp4`, `video/webm` —
  `story_media_service.py:20-22` ↔ `ACCEPTED_TYPES` du brouillon.
- **20 Mo par fichier**, **10 médias par publication**, **2200 caractères** —
  mêmes valeurs des deux côtés (`post_composer_constants.py:7-8`,
  `post-composer-labels.ts:3-4`).
- **HEIC refusé explicitement** (MIME ou extension) — cas courant du partage iOS.
- **Table de correspondance des erreurs complète** : 429, 413, 401, 403, 5xx,
  timeout, réseau (`composer-media.ts:224-254`).
- **Budget de temps par fichier proportionnel à sa taille**, un
  `AbortController` par tentative, nettoyage au démontage.
- **Verrou synchrone anti double-publication**, couvert par des tests
  comportementaux (`composer-publication-lock.test.tsx`).

**Défauts mesurés, que la reconstruction doit corriger** :

| Défaut | Preuve |
|---|---|
| Le palier **medium n'est pas dessiné** : une seule bascule à 640 px, et la grille desktop ne se scinde qu'à `lg` (1024) | `globals.css:5111-5153`, `new-post-desktop-view.tsx:72` |
| Les onglets **jettent silencieusement** un fichier qui ne correspond pas au format actif | `use-new-post-draft.ts:200-201` |
| **Un seul message** pour tout un lot de refus, réécrit à chaque fichier | `uploadError: string \| null` |
| Le plafond de 10 **coupe en silence** les fichiers suivants | `use-new-post-draft.ts:174-177` |
| Un échec au n-ième envoi **abandonne les médias déjà transférés** ; le réessai renvoie tout | `new-post-screen.tsx`, boucle `for … of draft.selectedMedia` |
| « Identifier un lieu » **ouvre le sélecteur de fichiers** | `new-post-options-panel.tsx:68` |
| **Deux boutons Publier** au desktop | en-tête + bas de colonne droite |

**Contraintes de débit à connaître** : `60 envois/heure et par compte`,
`120/heure et par IP` (`posts.py:54-62`) — soit **6 publications de 10 médias
par heure**, nouvelles tentatives comprises. Le message 429 existe déjà.

**Portée réelle d'une publication « publique »**, vérifiée :
lecture réservée aux membres connectés dans le fil, **toutes villes
confondues** (la ville n'est qu'une priorité de tri, jamais un filtre —
`post_repository.py:124-141`) ; **et accessible sans compte** depuis
`/profile/{username}` quand le profil de l'auteur est public
(`profile.py:152` via `get_current_user_optional`, `profile_service.py:367`),
page non exclue de l'indexation. ⛔ **Ne jamais écrire « visible par tout
Reims »** : faux dans les deux sens.

---

## 4. Paliers et chrome réutilisé

**Breakpoints canoniques** — `lib/layout/feed-breakpoints.ts` fait foi :

| Palier | Largeur | Chrome monté |
|---|---|---|
| **mobile** | ≤ 639 px | `WebMobileHeader` + `WebMobileStrategicBottomNav` |
| **medium** | 640 – 1023,98 px | rail citoyen (`CitizenMediumRail`, monté par `WebSidebar`) + en-tête medium |
| **desktop** | ≥ 1024 px | `CitizenTopNav` + `WebSidebar` déployée |

⚠️ **Incohérence consignée, à ne pas propager** : la docstring de
`CitizenAuthenticatedShell` annonce encore « medium 640–1279,98 · desktop
≥1280 », antérieure à la révision R4B de `feed-breakpoints.ts`. **C'est le
module qui fait foi** ; la docstring sera corrigée au passage, sans changer de
comportement.

**Composition retenue** : le shell de création d'événement
(`EventCreateAppShell`, 31 lignes) est **le patron existant d'un écran de
création citoyen** sur les trois paliers. `/feed/new` monte un shell de même
forme plutôt qu'une grille ad hoc, ce qui supprime les classes
`feed-new-mobile-shell`, `web-mobile-feed-new-only` et
`web-desktop-feed-new-only` et leurs 40 lignes de CSS dédiées.

---

## 5. Structure de l'écran — identique sur les trois paliers

```
[ chrome du palier ]
┌──────────────────────────────────────────┐
│ ←  Créer une publication      [ Publier ]│  en-tête du composeur
├──────────────────────────────────────────┤
│ (avatar) Auteur                          │
│          🌐 Publication publique          │  mention, non cliquable
├──────────────────────────────────────────┤
│ ┌──────────────────────────────────────┐ │
│ │ Quoi de neuf à Reims ?                │ │  zone de texte
│ │                            35 / 2200  │ │  compteur CALCULÉ
│ └──────────────────────────────────────┘ │
├──────────────────────────────────────────┤
│ [1]•••  [2]•••  [3]•••                   │  grille de médias ordonnée
│ [4]•••  [5]•••  [ + ]                    │  ••• = menu accessible
│ 5 médias sur 10 · La première photo      │
│ ouvrira la publication                   │  compteur CALCULÉ
├──────────────────────────────────────────┤
│ [ Ajouter des photos ou vidéos ]         │
│ (desktop : « Glissez vos fichiers ici ») │
└──────────────────────────────────────────┘
[ barre basse mobile ]
```

**Une seule action primaire** : `Publier`, dans l'en-tête du composeur, sur
les trois paliers. ⛔ **Pas de second bouton Publier.**

**Grille de médias** : 3 colonnes desktop et medium, 2 colonnes mobile —
conforme aux planches.

**Pourquoi une colonne unique au desktop** : les options retirées, il ne reste
rien à placer dans la seconde colonne. La grille deux colonnes actuelle
n'existait que pour héberger des commandes inertes.

### `Publier` — condition d'activation *(correction actée)*

```
publiable = (texte.trim() ≠ ""  ET  texte.length ≤ 2200)
            OU  (au moins un média sélectionné non rejeté)
```

Désactivé pendant un envoi en cours. **Un texte seul valide suffit.**

### Le clavier mobile

**Exigence** : le clavier ouvert ne doit masquer **ni la saisie, ni les
commandes**.

- L'en-tête du composeur (donc `Publier`) reste **collé en haut** et visible.
- Le corps devient la seule zone défilante ; la commande « Ajouter des photos
  ou vidéos » reste atteignable par défilement, juste au-dessus du clavier.
- La **barre basse de navigation est retirée du flux** quand le clavier est
  ouvert — c'est le clavier qui occupe cette bande (conforme à la planche).
- ⚠️ **Contrainte mesurée** : l'application **ne déclare aucun `viewport`
  Next**, donc aucune directive `interactive-widget`. Par défaut, Android
  Chrome redimensionne le *visual viewport* seulement : `dvh` ne rétrécit pas
  et une barre `position: fixed` passe **sous** le clavier.
  → `/feed/new/page.tsx` redevient un **composant serveur** exportant
  `viewport: { interactiveWidget: "resizes-content" }`, et rend un composant
  client. La portée reste la seule route `/feed/new`.
  → ⛔ **À vérifier sur appareil réel** avant de clore : un `export const
  viewport` est interdit dans un fichier `"use client"`.

### Réordonnancement **accessible** — et pourquoi pas seulement le glisser-déposer

Le glisser-déposer seul n'est pas atteignable au clavier ni au lecteur
d'écran. Le menu `•••` de chaque vignette — déjà présent sur les planches —
porte donc les actions, et le glisser-déposer n'est qu'un **raccourci** :

- **Avancer** / **Reculer** (déplacent le média d'un rang)
- **Mettre en premier** (le média qui ouvrira la publication)
- **Retirer**

Chaque vignette annonce son rang (`aria-label` « Média 3 sur 5 »), et un
`aria-live="polite"` confirme le déplacement (« Média déplacé en position 2 »).
⛔ **Le rang affiché est calculé**, jamais figé dans le balisage.

### Cibles tactiles

Les pastilles `•••` et `✕` des planches sont **illustratives**. Chaque
commande expose une **zone d'interaction d'au moins 44 × 44 px**, quel que
soit le diamètre dessiné — via le remplissage du bouton, pas un
agrandissement du visuel.

---

## 6. Modèle du brouillon

```ts
type MediaDraftStatus =
  | { kind: "selected" }                       // choisi, pas encore envoyé
  | { kind: "uploading" }                      // envoi en cours
  | { kind: "uploaded"; url: string; mediaType: "image" | "video" }
  | { kind: "failed"; reason: string };        // envoi tenté, échoué, rejouable

type MediaDraft = {
  id: string;            // identité stable : survit au retrait, au remplacement
  file: File;            //                   et au réordonnancement
  previewUrl: string;    // object URL, révoqué au démontage
  mediaType: "image" | "video";
  status: MediaDraftStatus;
};

type RejectedFile = {    // refusé À LA SÉLECTION — jamais envoyé
  name: string;          // nommé, c'est tout l'intérêt
  reason: string;        // « format HEIC non pris en charge », « 28 Mo, max 20 Mo »…
};
```

**L'identité (`id`) est le pivot de toute la reprise** : c'est elle qui lie un
résultat d'envoi à **son** fichier, condition posée par Kyria pour que retrait,
remplacement et réordonnancement restent corrects pendant qu'un envoi est en
cours.

**`post_format` déduit**, jamais choisi :

```
aucun média → "text"
au moins une vidéo → "video"
sinon → "photo"
```

**Lot mixte photo + vidéo** : le serveur l'accepte (`media_type` par élément).
⚠️ La **restitution** d'un lot mixte au fil reste sous l'arbitrage produit
ouvert `MEDIA-05-PHOTO-LETTERBOX` — hors de ce ticket, mentionné pour mémoire.

---

## 7. Machine d'états

```
                    ┌──────────────┐
                    │  brouillon   │◀────────────────────┐
                    └──────┬───────┘                     │
                 Publier   │                             │ Réessayer
                           ▼                             │ (n'envoie que
                    ┌──────────────┐                     │  ce qui manque)
                    │   envoi      │  « Envoi 3 sur 5 »  │
                    └──┬────────┬──┘                     │
               échec   │        │   tous envoyés         │
                       ▼        ▼                        │
            ┌────────────────┐  ┌──────────────┐         │
            │ échec partiel  │──┘              │         │
            │ (médias OK     │   création de   │         │
            │  conservés)    │   la publication│         │
            └───────┬────────┘  └───┬──────┬───┘         │
                    └───────────────┘      │             │
                                    échec  │             │
                                           ├─────────────┘
                                   succès  │
                                           ▼
                                    ┌──────────────┐
                                    │   succès     │ → /feed
                                    └──────────────┘
```

### Les quatre états demandés

**1. Envoi** — `Publier` devient inerte et annonce la progression réelle,
« Envoi 3 sur 5 ». Chaque vignette porte son propre état. Quitter l'écran
annule la tentative (`AbortController`), comportement déjà en place.

**2. Erreur** — deux familles **distinctes**, jamais confondues :

| Famille | Quand | Rendu | Action |
|---|---|---|---|
| **Refus à la sélection** | avant tout envoi : type, taille, plafond | encart **ambre**, **liste nominative** des fichiers et de leur motif | « Choisir d'autres fichiers » · « Continuer sans eux » |
| **Échec d'envoi** | pendant l'envoi : réseau, 5xx, 429, délai, contenu refusé | encart **rouge**, vignette marquée **Échec** | « Réessayer l'envoi » |

⛔ **Aucun fichier n'est retiré du brouillon par un refus** : l'utilisateur
tranche, jamais le code.

**3. Échec partiel** — l'état central de ce ticket :

- les médias déjà transférés **gardent leur `url`** et **ne repartent pas** ;
- le média en échec est **nommé**, et lui seul est rejoué ;
- **si tous les médias sont passés mais que la création de la publication
  échoue**, les `url` sont **conservées** : le réessai ne renvoie aucun
  fichier et ne crée **qu'une** publication (voir §8) ;
- message explicite, repris des planches : « *Vos 5 médias et votre texte sont
  conservés* » et « *Les photos déjà envoyées ne seront pas renvoyées* ».

> **Portée de la reprise, à écrire dans l'interface** *(exigence de Kyria)* :
> elle vaut **tant que cet écran reste ouvert**. ⛔ **Aucune récupération après
> rechargement n'est promise** — elle n'est ni implémentée ni vérifiée. Un
> rechargement perd le brouillon.

**4. Succès** — redirection vers `/feed` + `router.refresh()`, comportement
actuel conservé.

**5. Abandon du brouillon** — quitter (`←`, retour navigateur) avec du texte ou
des médias ouvre une confirmation : « **Abandonner cette publication ?** » ·
« Abandonner » / « Continuer la rédaction ». Les aperçus (`objectURL`) sont
révoqués.
⚠️ **Limite assumée et consignée** : les médias **déjà transférés** lors d'un
abandon restent **orphelins** côté serveur. Aucun ménage n'existe aujourd'hui,
et ce ticket n'en crée pas → `MEDIA-ORPHANS-01`.

---

## 8. Le verrou anti double-clic **n'est pas** une protection contre une réponse perdue

Ce sont **deux risques différents**, qui appellent **deux mécanismes
différents**. Les confondre laisserait le second à découvert.

### a) Double-clic — **couvert aujourd'hui, à conserver tel quel**

Deux clics dans le **même tick** arrivent avant que `setState` n'ait pris
effet. Une **ref synchrone** (`publishingRef`) les bloque. Déjà en place, déjà
testé par un test comportemental qui rend les composants et clique vraiment.
**Portée exacte : un seul onglet, un seul montage, un seul tick.**

### b) Réponse serveur perdue — ⛔ **non couvert**

`POST /api/v1/posts` **n'a aucune idempotence** : aucune clé, aucun
`client_request_id`, aucune déduplication. Si la requête atteint le serveur,
que la publication est créée, et que la réponse se perd (coupure, 504 d'un
intermédiaire, bascule réseau), le client **ne peut pas savoir** si elle
existe. Un réessai **crée un doublon**, et le verrou du (a) n'y change rien :
il a été relâché.

### ✅ DÉCISION PRISE PAR KYRIA le 2026-11-03 — **clé d'idempotence, dans ce périmètre**

**La protection entre au périmètre et au plan, avant tout code.** Le verrou
du (a) **reste**, en complément : il couvre le double-clic, elle couvre la
réponse perdue.

**Règles arrêtées** :

1. **Une tentative logique = une clé.** Le client génère la clé **une fois**
   et la **conserve à travers les réessais**. ⛔ **Jamais une clé par clic.**
   Elle n'est régénérée qu'après un **succès** ou un **abandon** du brouillon.
2. **La clé est liée à l'utilisateur authentifié.** Unicité garantie sur
   `(author_id, client_request_id)`, **y compris en cas de requêtes
   simultanées** — l'unicité est tenue par un **index unique en base**, pas
   par un test applicatif préalable qui laisserait une fenêtre de course.
3. **Même clé, même contenu** → la publication **existante** est renvoyée.
   **200**, pas de seconde création.
4. **Même clé, contenu différent** → **refus explicite**. **409** avec le code
   stable `POST_REQUEST_CONFLICT`. ⛔ **Ne jamais créer, ni écraser.**
5. **Isolation** : la même clé employée par deux comptes donne **deux
   publications distinctes**.
6. **Migration compatible avec l'existant** : colonne **nullable**, **aucun
   remplissage rétroactif**, et l'index unique tolère plusieurs `NULL`
   (PostgreSQL traite chaque `NULL` comme distinct). Les publications déjà en
   base **ne sont pas touchées**.

**Définition de « même contenu »** : une **empreinte** calculée **côté
serveur** sur **l'intégralité du payload validé, à l'exception de la clé
elle-même**, stockée à côté de la clé. Le client ne calcule rien. La
comparaison est une égalité, pas une heuristique.

> ⚠️ **Corrigé le 2026-11-03, avant implémentation.** La première rédaction
> limitait l'empreinte à `body`, `media_urls`, `post_format` et `visibility`.
> **Elle était plus étroite que le payload** : une clé rejouée avec un
> `audience_user_ids`, un `scheduled_at` ou un `poll` modifié aurait renvoyé
> **200 et la première publication, en abandonnant la modification en
> silence** — au lieu du 409. Le cas `audience_user_ids` en visibilité
> `custom` touche à la confidentialité. **Une empreinte doit couvrir tout ce
> qui définit la publication**, sans liste à maintenir : toute colonne ajoutée
> plus tard y entre d'office.

**Conséquence côté écran** : un 409 n'est **pas** une erreur à réessayer.
L'écran dit que la publication **est déjà partie** et invite à ouvrir le fil —
cas réel : l'utilisateur modifie son texte après une réponse perdue, puis
republie.

### ⛔ L'issue indéterminée — **abandonner la clé ne retire rien du serveur**

*(posé par Kyria le 2026-11-03 ; détail opérationnel au §3.4 bis du contrat)*

Quand la requête est partie **sans qu'aucune réponse ne revienne**, le client
ne sait pas si la publication existe. ⛔ **Il n'annonce pas un échec**, et
⛔ **il ne renouvelle pas la clé** — la renouveler jetterait la seule
protection contre le doublon pendant que la publication, elle, peut exister.

**La clé en attente survit à la fermeture de l'écran** (`sessionStorage`),
**seule** : ⛔ ni texte, ni médias. *La promesse « aucune récupération du
brouillon après rechargement » reste entière.*

**À la tentative suivante, c'est le serveur qui tranche** — et les trois
branches lèvent l'incertitude sans endpoint supplémentaire : **200** elle
avait atterri *(aucun doublon)* · **201** elle n'avait pas atterri *(créée une
seule fois)* · **409** elle avait atterri avec un autre contenu *(on le dit,
puis on libère la clé)*.

**Limite assumée** : la protection est **technique** sur le réessai,
**informative** sur l'abandon. Qui quitte, ignore l'avertissement et retape le
même texte dans une tentative neuve peut créer un doublon.

---

## 9. Architecture des fichiers *(rule 11 — anti-spaghetti)*

```
app/feed/new/page.tsx                  composant SERVEUR : export viewport + <NewPostScreen/>
components/feed/post-composer/
  new-post-shell.tsx                   chrome des 3 paliers (patron EventCreateAppShell)
  new-post-screen.tsx                  orchestration : assemble le shell et les sections
  new-post-header.tsx                  ← · titre · Publier (action primaire unique)
  new-post-author-line.tsx             avatar · auteur · « Publication publique »
  new-post-body-field.tsx              zone de texte + compteur calculé
  new-post-media-grid.tsx              grille, rangs, menu ••• , bouton +
  new-post-media-item-menu.tsx         avancer / reculer / mettre en premier / retirer
  new-post-rejected-files.tsx          encart ambre, liste nominative
  new-post-upload-failure.tsx          encart rouge, réessai
  new-post-discard-dialog.tsx          abandon du brouillon
hooks/
  use-new-post-draft.ts                état du brouillon : texte, médias, rangs, rejets
  use-new-post-publication.ts          envoi, reprise, création, verrou — extrait de l'écran
```

**Ce que cette découpe corrige** : aujourd'hui l'orchestration d'envoi vit
dans le composant d'écran (`new-post-screen.tsx`, 197 lignes dont ~90 de
logique d'envoi) et la vue mobile fait 269 lignes — au-delà du seuil de 200
lignes de `frontend-next-expo`. Chaque fichier ci-dessus reste sous ce seuil.

**Sens des dépendances** : `page → shell → écran → sections` ; `écran → hooks →
lib/api`. ⛔ Aucune logique d'envoi dans le JSX.

**À supprimer** : `new-post-desktop-view.tsx`, `new-post-mobile-view.tsx`,
`new-post-options-panel.tsx`, et les règles CSS `feed-new-*` de `globals.css`
(≈ 40 lignes).

---

## 10. Tests exigés *(rule 03 — pyramide)*

**Unitaires — `use-new-post-draft`**

1. Format déduit : texte seul → `text` ; avec image → `photo` ; avec vidéo → `video`.
2. Un fichier refusé **n'écrase pas** les autres motifs : 3 refus → 3 entrées nommées.
3. Le plafond de 10 **nomme** les fichiers non ajoutés au lieu de les ignorer.
4. Un refus **ne retire aucun** média valide déjà sélectionné.
5. Réordonnancement : avancer / reculer / mettre en premier recalculent les rangs ; l'`id` reste stable.
6. Retirer un média **pendant** un envoi ne décale pas le résultat d'un autre fichier *(c'est le rôle de l'`id`)*.

**Unitaires — `use-new-post-publication`**

7. Reprise : sur 5 médias dont 2 déjà `uploaded`, un réessai **n'appelle `uploadPostMedia` que 3 fois**.
8. Tous médias envoyés + création en échec → le réessai **n'appelle aucun envoi** et **une seule** création.
9. Le verrou synchrone tient : deux clics dans le même tick → **une** tentative *(test existant à conserver)*.
10. Démontage pendant l'envoi : requête annulée, minuteurs désarmés, aucun `setState` après démontage.

**Intégration — rendu réel (Testing Library)**

11. Texte seul valide → `Publier` **actif** *(correction actée)*.
12. Texte vide et aucun média → `Publier` **inactif**.
13. 2201 caractères → `Publier` inactif + motif affiché.
14. Échec partiel : le fichier en échec est **nommé**, « Réessayer » présent, et la phrase de portée de session visible.
15. Abandon : quitter avec du contenu ouvre la confirmation ; « Continuer la rédaction » ne perd rien.

**Accessibilité**

16. Chaque commande de vignette expose une cible ≥ 44 px et un nom accessible.
17. Le réordonnancement est atteignable **au clavier seul**, et annoncé en `aria-live`.

**Navigateur (Playwright, local — ⚠️ hors CI)**

18. Les trois paliers rendent **une seule** action primaire `Publier`.
19. Mobile, clavier ouvert : la zone de saisie **et** `Publier` restent visibles.
20. Sélection multiple : 5 aperçus présents sur les trois paliers *(non-régression `MEDIA-MULTI-PHOTO-01`)*.

⚠️ **Playwright n'est pas en CI** : ces trois tests se rejouent **à la main**,
et la passation doit le consigner.

---

## 11. Ce qui n'est **pas** promis

- ⛔ Aucune **récupération du brouillon après rechargement**.
- ⛔ Aucun **ménage des médias orphelins** (`MEDIA-ORPHANS-01`).
- ⚠️ La protection contre une **réponse serveur perdue** couvre la **création**
  de la publication, **pas l'envoi des médias** : un média envoyé deux fois
  produit deux fichiers stockés. Le gaspillage est réel, la publication reste
  juste. Hors périmètre → `MEDIA-ORPHANS-01`.
- ⛔ Aucune mesure chiffrée de performance ; la fluidité du carrousel reste
  **non chiffrée** depuis `MEDIA-MULTI-PHOTO-01`.
- ⛔ L'audit des dépendances reste **ROUGE** (21 High/Critical, `next` en CVSS
  9.5) — **zone rouge, sujet séparé**, assumé sur Preview, jamais levé.

---

## 12. Gates

| Gate | État |
|---|---|
| **Périmètre défini** *(rule 12, bloquant depuis le 2026-10-31)* | ✅ levé — recueilli avec Kyria le 2026-11-03, écart par écart |
| **Référence visuelle** *(rule 14 §5)* | ✅ les deux planches de Kyria |
| **Idée directrice écrite avant le code** *(rule 14 §4)* | ✅ §1 |
| **États UI obligatoires** *(rule 07)* | ✅ §7 — envoi, erreur, échec partiel, succès, abandon |
| **Anti-spaghetti** *(rule 11)* | ✅ §9 — découpe sous le seuil de 200 lignes |
| **Review sécurité** *(rule 04)* | ⚠️ **requise** — l'idempotence est actée : migration, contrat d'écriture, isolation entre comptes |
| **Validation humaine** | ⛔ **en attente** — ce document |
