# INFRA-04 — Image Docker du service web (candidat, non déployé)

> **Statut** : candidat validé localement, **mis en échec en Preview le
> 2026-10-17** par un désalignement de port (§6 bis), puis retour arrière
> appliqué. Aucune variable modifiée, aucune action sur Production ni sur
> l'admin. Ce document sert à la revue.

Service visé : `yunicity.review` du projet Railway `dazzling-wisdom`, domaine
`preview.yunicity.city`, branche `feat/c3-videos-refonte-final`, répertoire
racine `frontend`.

---

## 1. Traçabilité de la validation

| Élément | Valeur |
|---------|--------|
| SHA source | `953246fca70914f12124d689dd4c7ba0167c747e` |
| Arbre au moment du build | SHA + les 5 fichiers de ce candidat, non committés |
| Image testée (`Id`) | `sha256:13247a554191015067e8a0231948cc64b1840986036bbdf1e3dd76439acd057b` |
| Tag local | `yunicity-web:candidat2` — jamais poussée, donc **aucun `RepoDigest`** |
| Taille | 294 457 019 octets (base `node:20-bookworm-slim` : ~200 Mo) |
| `BUILD_ID` de l'artefact | `hwCWixfPvFUB5L9JMWug-` |
| Next | 15.5.25 — identique au lockfile |
| Node / pnpm | `v20.20.2` / `9.15.9` résolu depuis `packageManager` |

L'image n'ayant jamais été poussée dans un registre, elle n'a pas de digest de
dépôt : seul l'`Id` local l'identifie, et il ne survivra pas à un
`docker system prune`. Toute revue ultérieure doit reconstruire depuis le SHA
source ci-dessus.

---

## 2. Pourquoi

Le build RAILPACK conserve l'intégralité du workspace pnpm dans l'image servie,
dépendances de développement comprises. Deux paquets sans correctif amont y
figurent — `braces@3.0.3` et `node-forge@1.4.0` — alors qu'aucun n'est
nécessaire au service en production.

Le mode `standalone` de Next trace les modules réellement requis depuis le
`node_modules` déjà installé, donc **gelé**, et les recopie. L'image finale ne
contient que cet artefact : **20 paquets** sous `/app/node_modules`.

---

## 3. Changements proposés

| Fichier | Nature |
|---------|--------|
| `frontend/apps/web/next.config.ts` | `output: "standalone"` (1 ligne) |
| `frontend/Dockerfile.web` | nouveau — image multi-étapes |
| `frontend/.dockerignore` | nouveau — périmètre du contexte |
| `frontend/railway.toml` | `builder = "DOCKERFILE"`, `startCommand` réécrit |
| `docs/ops/INFRA-04-web-image-docker.md` | cette note |

### 3.1 Nom `Dockerfile.web`, et non `Dockerfile`

Railway détecte automatiquement un fichier nommé `Dockerfile` à la racine du
**répertoire source**. Tout service partageant `frontend/` comme racine
basculerait alors sur le builder Dockerfile et construirait l'app web. C'est la
classe de bug déjà documentée deux fois dans ce dépôt (`railway.api.toml`,
`railway.admin.toml`). `railway.toml` désigne donc le chemin explicitement.

**Résolution du chemin — VÉRIFIÉE par déploiement.** `dockerfilePath =
"Dockerfile.web"` est bien résolu relativement au répertoire racine du service.
Le journal de build du déploiement `67522420` le dit littéralement :

```
[internal] load build definition from frontend/Dockerfile.web
```

Le repli `RAILWAY_DOCKERFILE_PATH` n'est donc pas nécessaire.

### 3.2 `ARG RAILWAY_ENVIRONMENT` obligatoire

Railway n'expose aucune variable de service à un build Dockerfile sans `ARG`
explicite. Or `assertSiteUrlConfiguredForDeploy` ne se déclenche que si
`RAILWAY_ENVIRONMENT` est visible : sans cet `ARG`, le garde-fou issue #132 /
PROD-BUG-03 cesserait **silencieusement** de protéger les builds déployés.

### 3.3 `startCommand` déclaré, et non omis

Valeur effective lue en lecture seule sur le service :
`deploy.startCommand = "pnpm --filter web start"` (aucun changement en attente).
Elle ne peut pas fonctionner dans l'image finale : ni pnpm, ni les manifestes du
workspace n'y sont.

Règle rappelée dans `backend/railway.api.toml` : **un champ déclaré dans le
fichier de config écrase le réglage du dashboard, un champ omis le CONSERVE.**
L'omettre laisserait donc l'ancienne commande en place — échec de démarrage
certain. Le fichier déclare par conséquent :

```toml
startCommand = "node apps/web/server.js"
```

identique au `CMD` de `Dockerfile.web`. Les deux doivent rester synchronisés ;
chaque fichier porte le rappel.

### 3.4 pnpm : une seule source de vérité

`frontend/package.json` porte déjà `"packageManager": "pnpm@9.15.9"`. Le
Dockerfile se contente de `corepack enable` et laisse corepack lire ce champ —
vérifié dans le journal de build : `Done in 2m 26.6s using pnpm v9.15.9`.
Épingler une version dans le Dockerfile en ferait une seconde source, libre de
diverger en silence.

---

## 4. Variables publiques

Les cinq variables du service restent **inchangées**. Aucune n'est modifiée par
ce candidat.

### Obligatoires au déploiement — présentes

| Variable | Pourquoi obligatoire | Sur le service |
|----------|----------------------|----------------|
| `NEXT_PUBLIC_WEB_APP_URL` | `assertSiteUrlConfiguredForDeploy` **fait échouer le build** sans elle (ou sans `NEXT_PUBLIC_SITE_URL`) sur Railway. Sans elle, canonical, `og:url`, `og:image`, JSON-LD et `sitemap.xml` pointeraient sur localhost, inlinés et irréparables sans rebuild. | ✅ |
| `NEXT_PUBLIC_API_URL` | `resolveWebApiBaseUrl` renvoie `""` dans le navigateur quand elle est vide : les appels deviennent relatifs et tombent sur le proxy de développement, qui renvoie `null` dès `NODE_ENV === "production"`. Côté serveur, le repli est `http://127.0.0.1:8010`, soit le conteneur lui-même. **Vide = application sans API.** | ✅ |

### Facultatives — dégradation explicite, pas de panne

| Variable | Effet si absente | Sur le service |
|----------|------------------|----------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | carte Google indisponible, message dédié | ✅ |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | rendu vectoriel et Advanced Markers indisponibles | ✅ |
| `NEXT_PUBLIC_SITE_URL` | repli de `WEB_APP_URL`, inutile tant que celle-ci est posée | absente |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | aperçus Mapbox indisponibles, message dédié | absente |

`NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` existe comme **nom alias** lu en repli dans un
seul composant. Il n'est pas déclaré en `ARG` : si l'on retient un jour ce nom
plutôt que `NEXT_PUBLIC_MAPBOX_TOKEN`, il faudra l'ajouter.

`API_PROXY_TARGET` est une variable **serveur uniquement**, jamais `NEXT_PUBLIC_*`.
Elle n'est pas posée et ne doit pas l'être : elle ne sert qu'au proxy local.

### Inutilisée

`NEXT_PUBLIC_REGISTRATION_ENABLED` est configurée sur le service mais **lue par
aucun fichier du frontend** ; seul le backend possède un `REGISTRATION_ENABLED`
non public. Elle n'est donc pas déclarée en `ARG`. À trancher séparément :
retrait ou câblage.

### Aucun secret en argument de build

Les trois variables nécessaires au build sont deux URL et un identifiant de style
de carte. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` n'est pas un secret au sens
cryptographique — elle part nécessairement dans le bundle client et dans l'URL de
l'API Maps, quel que soit le builder — mais elle reste une **clé facturable** :
sa protection repose sur les restrictions côté Google Cloud (référents HTTP +
restriction d'API), non vérifiables depuis le dépôt. Le passage au Dockerfile ne
change rien à son exposition.

Le découpage en deux étapes garde ces valeurs **hors de l'image finale** —
vérifié : zéro `NEXT_PUBLIC_*` dans sa configuration comme dans son historique de
couches. Elles restent visibles dans les journaux du constructeur et son cache.
Aucun secret ne doit donc passer par un `ARG`.

---

## 5. Ce que l'image contient — mesuré, pas déduit

Inventaire du **système de fichiers**, pas des instructions `COPY` : répertoires,
tous les `package.json` présents, empreintes textuelles, et traçage des
chargements réels.

| Paquet | Répertoire dans l'image | Chargé à l'exécution |
|--------|-------------------------|----------------------|
| `node-forge` | **0** (3 empreintes textuelles à 0) | non observé |
| `braces` | **0** comme paquet | non observé |
| `micromatch` | **0** | non observé |
| `@vercel/nft` | bundlé dans un fichier de Next | non observé |
| outils de test (`playwright`, `vitest`, `jest`, `@testing-library`, `msw`, `turbo`, `eslint`, `prettier`, `tsx`, `pnpm`, `tailwindcss`) | **0**, aucun binaire de navigateur | — |
| `typescript@5.9.3` (8,8 Mo) | **présent** dans `/app/node_modules` | **oui — requis** |

`jest-worker`, `@mswjs/interceptors` et `edge-runtime` n'existent que comme
manifestes **vendorisés dans `next/dist/compiled`**, sans répertoire installé.

`typescript` n'est pas un résidu : le traceur montre qu'il est chargé par
`next/dist/build/next-config-ts/transpile-config.js`, parce que
`apps/web/next.config.ts` est en TypeScript. L'exclure casserait le démarrage.

### 5.1 La copie de braces embarquée dans Next — **version indéterminée**

`next/dist/compiled/@vercel/nft/index.js` contient une copie minifiée de
micromatch, donc de braces : on y lit `micromatch.braces(…)`, `braces.parse`,
`braces.compile`, `braces.expand`, `braces.create`, `braces.stringify`.

Ce qui a été vérifié :

- `next/dist/compiled/@vercel/nft/package.json` vaut
  `{"name":"@vercel/nft","main":"index.js","license":"MIT"}` — **aucun champ
  `version`**.
- Le répertoire ne contient que `LICENSE`, `index.js`, `package.json` : aucun
  manifeste de contenu, aucune liste des paquets inlinés et de leurs versions.
- La seule chaîne `"version":"x.y.z"` du fichier compilé est `1.0.5`, non
  attribuable à braces.
- La surface d'API exposée (`parse`/`compile`/`expand`/`create`/`stringify`) et
  la présence de `rangeLimit` et `maxLength` sont cohérentes avec **braces 3.x**,
  sans permettre d'isoler un correctif de version.
- `next/package.json` ne déclare ni `@vercel/nft`, ni `micromatch`, ni `braces`.

**Conclusion explicite : la version de la copie embarquée est indéterminée, et sa
correspondance éventuelle avec l'avis sur `braces@3.0.3` ne peut pas être
établie.** Le seul élément rassurant est négatif et mesuré : ce module n'a pas
été chargé sur les chemins instrumentés (§5.2). Déterminer la version exigerait
soit un manifeste amont que Next ne fournit pas, soit une comparaison de code
avec les publications successives de braces — hors périmètre de ce ticket.

### 5.2 Limites du traçage

Traceur de modules monté en lecture seule, surveillant le nom demandé **et** le
chemin résolu (une copie bundlée échappe à une recherche par nom). Contrôle
positif concluant, marqueur `START` présent sur le processus serveur. Après le
smoke complet et un parcours authentifié, une seule ligne au journal :
`typescript`.

> `node-forge` n'a pas été observé sur les chemins instrumentés. Les chemins non
> tracés et les limites du traceur empêchent d'affirmer une absence générale de
> chargement.

La même réserve s'applique mot pour mot à `braces` et à `@vercel/nft`.

---

## 6. Résultats de validation

- **Port dynamique** : `PORT=4123`, le serveur annonce `http://0.0.0.0:4123`,
  prêt en 391 ms ; `/proc/net/tcp` du conteneur confirme l'écoute sur 4123.
  L'image ne garde 3000 que comme repli.
- **Smoke** : `/`, `/login`, `/register`, `/neighborhoods`, `/places`, `/map`,
  `/sortir`, `/aide` → 200. Chunk JS → 200 `application/javascript`, CSS → 200
  `text/css`, `public/brand/yunicity-mascot.png` → 200 (112 802 o),
  `/_next/image?w=256` → 200 (9 943 o, donc `sharp` opère). Proxy de
  développement `/api/v1/health` → 404, inerte.
- **Connexion sur QA locale** : compte jetable créé (201), connexion → `/feed`,
  11 publications visibles, 17 appels `/api/` **tous** vers l'origine inlinée au
  build, aucun appel same-origin.
- Codes non-200 vérifiés et conformes au produit : `/events` → 307 vers
  `/sortir` ; `/legal` n'a pas de page d'index, `/legal/confidentialite` → 200.

---

## 6 bis. Déploiement Preview du 2026-10-17 — ÉCHEC, cause racine identifiée

Déploiement `67522420-ccc8-4b23-86c9-fc42086ba13f`, commit `b190529f`, poussé à
08:42:28Z.

### Ce qui a fonctionné

| Contrôle | Résultat |
|----------|----------|
| Builder utilisé | Dockerfile, chargé depuis `frontend/Dockerfile.web` |
| Sept étapes de l'étape `build` | présentes, dans l'ordre |
| Version de pnpm | `Done in 6.6s using pnpm v9.15.9`, résolue depuis `packageManager` |
| Garde `test -f server.js` | franchi — le standalone a bien été produit |
| Démarrage du conteneur | `▲ Next.js 15.5.25` · `✓ Ready in 117ms` |
| Statut du déploiement | SUCCESS |

### Ce qui a échoué

Le service a renvoyé **502 « Application failed to respond »**
(`x-railway-fallback: true`) de 08:44:52Z à 09:21:09Z, soit **36 minutes
d'indisponibilité de la Preview**. L'API Preview est restée saine (200) sur
toute la période.

### Cause racine — un couplage masqué entre le port et le domaine

Le journal d'exécution donne la réponse en une ligne :

```
- Network:      http://0.0.0.0:8080
```

Railway injecte `PORT=8080`. L'image honore `PORT`, donc elle écoute sur 8080.
Mais les deux domaines du service ciblent **le port 3000**
(`preview.yunicity.city → targetPort 3000`). Le bord route vers 3000, où plus
rien n'écoute.

Pourquoi RAILPACK ne montrait pas le problème : le script `start` de `apps/web`
**fige le port** —

```json
"start": "cross-env NEXT_BUILD_DIR=.next-build next start --port 3000"
```

L'application ignorait donc `PORT` et tombait toujours sur 3000, ce qui
correspondait par accident au `targetPort` du domaine. En rendant le port
dynamique, l'image n'a pas introduit le défaut : elle l'a **révélé**.

Le dépôt connaissait déjà ce piège, mais seulement pour l'admin —
`frontend/railway.admin.toml` :

> `exec next start` (pas le script `start` du package, qui fige `--port 3001`) :
> Next se cale sur $PORT injecté par Railway, aligné sur le domaine admin
> (port 8080).

Le service admin a donc un domaine sur 8080 et évite délibérément le script qui
fige le port. Le service web avait conservé **les deux** incohérences.

### Retour arrière appliqué

Rollback autorisé vers le build `8ad26ace` par réutilisation de son image
(`redeploy` du déploiement, sans reconstruction), déploiement
`efec096f-950e-4bce-b16a-11d043a7d51f`. Rétabli à 09:21:09Z. Vérifié après coup :

- `/`, `/login`, `/register`, `/neighborhoods`, `/sortir` → 200
- build servi `webpack-b55f57aca273e799.js`, **identique** à la référence d'avant push
- statut des inscriptions **octet pour octet identique** à la référence
  (`open=true`, `mode=pilot`, `closes_at=2026-10-19T16:46:25.405000Z`)
- API Preview 200

### Correctif à décider avant toute nouvelle tentative

Aucun n'est appliqué : chacun est une mutation Railway hors du périmètre.

1. **Aligner le domaine sur le port injecté** — porter le `targetPort` des deux
   domaines du service web de 3000 à 8080, comme c'est déjà le cas pour l'admin.
   C'est la convention interne, et elle laisse l'image dynamique.
2. **Déclarer `PORT=3000` en variable de service** — Railway injecte alors 3000,
   l'image écoute sur 3000, le domaine correspond. Une seule variable, aucun
   domaine touché, mais cela fige un port par configuration.

À écarter : faire ignorer `PORT` par l'image. Ce serait reproduire dans
l'artefact le défaut que ce déploiement vient de révéler.

### Risque résiduel immédiat

La branche `feat/c3-videos-refonte-final` porte toujours `b190529f`. Le rollback
a rétabli l'**image servie**, pas l'état de la branche : **toute nouvelle poussée
sur cette branche reconstruirait la configuration défaillante** et casserait de
nouveau la Preview. À traiter avant la prochaine poussée — correctif de port, ou
retour arrière du code.

---

## 7. Procédure de bascule

1. Revue et merge du diff. **Avant tout merge vers `main`**, vérifier le point
   de rayon d'impact du §9.
2. **GATE BLOQUANT — le port.** Railway injecte `PORT=8080` sur ce service,
   tandis que ses deux domaines ciblent 3000. Appliquer d'abord l'un des deux
   correctifs du §6 bis, sans quoi le déploiement renvoie 502 malgré un
   conteneur sain. C'est la cause de l'échec du 2026-10-17.
3. Sur le service `yunicity.review` de `dazzling-wisdom` : **aucune variable à
   modifier** pour le reste. Le `startCommand` est écrasé par `railway.toml`,
   donc rien à vider côté dashboard.
4. Déployer. Le journal de build doit montrer l'usage du Dockerfile puis les
   sept étapes de l'étape `build`, et `pnpm v9.15.9`.
5. Vérifier dans le journal d'exécution que le port annoncé par Next
   correspond au `targetPort` des domaines.
6. Rejouer les mesures du §6 contre `preview.yunicity.city`.

---

## 8. Retour arrière

### Niveau 1 — immédiat, sans reconstruction

Sur le dernier déploiement RAILPACK réussi du service
(`8ad26ace-14bb-4864-998f-b2a1b08c875f`, succès le 2026-10-15T20:36:25Z) :
**Rollback**. Railway réactive l'image déjà construite ; aucune reconstruction,
aucune variable touchée. Geste à faire en premier en cas d'incident.

### Niveau 2 — retour du code

```bash
git revert <sha du commit INFRA-04>
```

Le revert rétablit `builder = "RAILPACK"`, `buildCommand`, le `startCommand`
d'origine, retire `output: "standalone"` et supprime `Dockerfile.web` /
`.dockerignore`. Vérifier ensuite que `frontend/railway.toml` porte bien
`builder = "RAILPACK"`.

### Ce que le retour arrière ne touche pas

- Aucune migration de base de données.
- Aucune variable d'environnement, dans un sens comme dans l'autre.
- Les deux alertes `braces` / `node-forge` reviennent telles quelles : le retour
  arrière restaure l'exposition d'origine, il ne crée pas de risque nouveau.

---

## 9. Rayon d'impact : le second service enraciné sur `frontend/`

Un **autre** service du même dépôt est enraciné sur `frontend/` : `yunicity.review`
du projet `miraculous-patience`, branche `main`, domaines
`yunicityreview-production.up.railway.app` et **`yunicity.city`** — le site
public, pas la Preview.

### 9.1 Ce qui a été mesuré

Sa configuration de service renvoie `build.buildCommand = "pnpm --filter web build"`,
alors que `frontend/railway.toml` porte sur `main`, depuis le 2026-07-03,
`pnpm install --frozen-lockfile && pnpm --filter web build`.

Mais le **journal de build** de son dernier déploiement réussi
(`d1e93713-2e25-4e67-aaee-d3ecec7e59fe`, 2026-09-02) montre la commande
réellement exécutée :

```
pnpm install --frozen-lockfile && pnpm --filter web build
```

c'est-à-dire la valeur **du fichier**, pas celle de la configuration de service.
Le journal du service Preview, dont le config path pointe sur ce fichier, produit
une étiquette de vertex identique.

### 9.2 Conclusion précédente retirée

Une version antérieure de cette note concluait de l'écart de `buildCommand` que
ce service n'appliquait pas `/frontend/railway.toml`. **Cette conclusion est
retirée.** Un écart de configuration n'établit qu'une différence : l'API expose
le réglage du service, pas le fichier appliqué au build, et la règle rappelée
dans `backend/railway.api.toml` veut précisément qu'un champ déclaré dans le
fichier écrase celui du dashboard. L'écart était donc le symptôme attendu d'un
fichier appliqué, non d'un fichier ignoré.

La commande exécutée rend **probable** que ce service applique
`/frontend/railway.toml`. Ce n'est pas une preuve absolue : la valeur du
dashboard pouvait être identique à celle du fichier en septembre et avoir changé
depuis. Le réglage « config path » n'étant pas lisible par les outils
disponibles, l'incertitude subsiste et doit être levée par lecture directe.

### 9.3 Portée réelle, et le point de contrôle

| Action | Service touché | Risque |
|--------|----------------|--------|
| Pousser la branche `feat/c3-videos-refonte-final` | Preview (`preview.yunicity.city`) uniquement — c'est la branche que ce service suit | celui de ce candidat, avec retour arrière §8 |
| **Merger vers `main`** | Preview **et**, selon §9.1, le site public `yunicity.city` au prochain déploiement | **changement de builder non voulu sur le site public** |

**GATE BLOQUANT avant tout merge vers `main`** : lire, dans le dashboard Railway,
le config path du service `yunicity.review` de `miraculous-patience`.

- S'il ne pointe **pas** sur `/frontend/railway.toml` : le merge est sans effet
  sur `yunicity.city`.
- S'il pointe dessus : **ne pas merger en l'état.** Déplacer la configuration
  Dockerfile dans un fichier dédié — par exemple `frontend/railway.web-docker.toml`,
  avec le config path du service Preview pointé dessus — et laisser
  `frontend/railway.toml` inchangé en RAILPACK. C'est le patron que ce dépôt a
  déjà retenu deux fois (`railway.api.toml`, `railway.admin.toml`) contre
  exactement cette classe d'héritage implicite.

Ce second montage est, dans l'absolu, le plus sûr : il rend le site public
structurellement insensible au changement. Il n'a pas été retenu d'emblée parce
qu'il exige de modifier le config path du service Preview côté dashboard, soit
une mutation Railway hors du périmètre de ce ticket. Le choix revient à la revue.

### 9.4 Donnée annexe

Les images RAILPACK poussées par ces déploiements pèsent 452 Mo (site public,
2026-09-02) et 496 Mo (Preview, 2026-10-15). L'image candidate pèse **294 Mo**.

---

## 10. Limites et dette

1. **L'audit du lockfile reste rouge.** Ce candidat retire `braces` et
   `node-forge` de l'**image d'exécution**, pas de l'arbre de dépendances :
   `frontend/pnpm-lock.yaml` porte toujours `braces@3.0.3`, `micromatch@4.0.8` et
   `node-forge@1.4.0`. C'est une **mitigation de l'image runtime**, pas une
   remédiation. Elle n'appartient pas à la même classe que les deux précédents
   résolus dans `frontend/osv-scanner.toml`, qui ont retiré le paquet **de
   l'arbre**. Aucune exception OSV n'est demandée, aucune acceptation de risque
   n'est donnée, et `osv-scanner.toml` doit rester sans entrée ignorée.
2. Validé **localement** uniquement, jamais sur Railway.
3. Le relais TCP, le traceur de modules et `--add-host host.docker.internal`
   sont des dispositifs de test, montés ou passés au lancement : aucun n'entre
   dans l'image ni dans la configuration Railway.
4. La liste CORS de l'API QA n'autorise que `localhost:3000` et `localhost:3002` —
   mesuré : une origine `localhost:4123` reçoit 400 sans
   `access-control-allow-origin`. La connexion a donc été rejouée avec le
   conteneur écoutant sur `PORT=4123` publié sur le port hôte 3000, ce qui
   reproduit le modèle Railway (le bord traduit le port public vers le `PORT` du
   conteneur).
5. `output: "standalone"` s'applique aussi à `pnpm build`, exécuté par
   `frontend-ci.yml` : la CI matérialisera désormais l'arbre standalone
   (~95 Mo de sortie supplémentaire). Sans effet sur les scripts QA, qui ne
   lisent que `.next-build/BUILD_ID`.
6. Un seul `COPY` invalide la couche d'installation à chaque changement de
   source : ~2 min 30 de réinstallation à chaque build. Découper le `COPY`
   (manifestes puis sources) le supprimerait — **hors périmètre de ce ticket**,
   à ouvrir séparément.
7. La restriction de la clé Google Maps côté Google Cloud n'est pas vérifiable
   depuis le dépôt.
