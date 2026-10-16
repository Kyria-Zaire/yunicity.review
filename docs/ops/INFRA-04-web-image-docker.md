# INFRA-04 — Image Docker du service web (candidat, non déployé)

> **Statut** : candidat validé **localement**. Aucun déploiement, aucune mutation
> Railway, aucune modification de variable. Ce document sert à la revue.

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

**Résolution du chemin.** `dockerfilePath = "Dockerfile.web"` est relatif au
répertoire racine du service, soit `frontend/Dockerfile.web`. Appuis :
la documentation Railway indique que la détection se fait « in the root
directory » et que le renommage se déclare par un nom nu
(`RAILWAY_DOCKERFILE_PATH=Dockerfile.origin`), la forme absolue
(`/build/Dockerfile`) étant réservée à un autre répertoire ; et le dépôt
applique déjà ce patron avec `backend/Dockerfile` sous un répertoire racine
`backend/`. **Non vérifié par déploiement** : si Railway refusait le chemin, le
repli documenté est la variable de service `RAILWAY_DOCKERFILE_PATH`.

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

## 7. Procédure de bascule

1. Revue et merge du diff. **Avant tout merge vers `main`**, vérifier le point
   de rayon d'impact du §9.
2. Sur le service `yunicity.review` de `dazzling-wisdom` : **aucune variable à
   modifier**. Le `startCommand` est écrasé par `railway.toml`, donc rien à
   vider côté dashboard.
3. Déployer. Le journal de build doit montrer l'usage du Dockerfile puis les
   sept étapes de l'étape `build`, et `pnpm v9.15.9`.
4. Rejouer les mesures du §6 contre `preview.yunicity.city`.

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
`yunicityreview-production.up.railway.app` et **`yunicity.city`**.

Mesure en lecture seule : sa `buildCommand` vivante est `pnpm --filter web build`,
alors que `frontend/railway.toml` porte, sur `main` depuis le 2026-07-03,
`pnpm install --frozen-lockfile && pnpm --filter web build`. Son dernier
déploiement réussi date du **2026-09-02**, donc **postérieur** à l'apparition du
fichier. Les deux valeurs diffèrent : **ce service n'applique pas
`/frontend/railway.toml`**, et le présent changement ne l'atteint pas.

Le réglage « config path » d'un service n'est pas lisible par les outils
disponibles : la cause exacte n'est donc pas démontrée, seul l'écart l'est.
**Avant tout merge vers `main`, vérifier dans le dashboard que le config path de
ce service n'est pas `/frontend/railway.toml`.** S'il l'était, le prochain
déploiement de `yunicity.city` basculerait sur le builder Dockerfile. Avec le
`startCommand` déclaré et le nom `Dockerfile.web`, il construirait et démarrerait
la même image — mais ce serait un changement de builder **non voulu** sur le site
public.

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
