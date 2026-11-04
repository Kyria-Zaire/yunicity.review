# PROFILE-POST-MENU-01 — commit ciblé et déploiement Preview · **PRÉPARATION**

> ## ⛔ RIEN N'EST EXÉCUTÉ PAR CE DOCUMENT
>
> **Aucun commit**, **aucune poussée**, **aucun déploiement**, **aucune
> publication créée ni supprimée.** **Tout ce qui suit est à exécuter par
> Kyria**, **dans l'ordre du §7**, **après sa validation.**
>
> **Préparé le 2026-10-31.** **Arbre de travail**, **branche
> `fix/mobile-publishing-p0`**, **base `8d2d4c9f`**.
>
> **Revue du diff** :
> [`../qa/PROFILE-POST-MENU-01-revue-correctif.md`](../qa/PROFILE-POST-MENU-01-revue-correctif.md)
> · **Passation** :
> [`../workflow/passations/PROFILE-POST-MENU-01-supprimer-sa-publication.md`](../workflow/passations/PROFILE-POST-MENU-01-supprimer-sa-publication.md)

---

## 1. Ce que la Preview déploie, et ce qu'elle ne déploie pas

| Fait | Source |
|---|---|
| **Service Railway `yunicity.review`**, **projet `dazzling-wisdom`**, **domaine `preview.yunicity.city`**, **root directory `frontend`**, **config path `/frontend/railway.toml`** | [`INFRA-04-web-image-docker.md`](INFRA-04-web-image-docker.md) · `frontend/railway.toml` |
| **Le service suit la branche `feat/c3-videos-refonte-final`** — ⛔ **PAS `fix/mobile-publishing-p0`** | idem |
| **Son SHA déployé est `bf008a87`**, **qui est EXACTEMENT le sommet de `origin/feat/c3-videos-refonte-final`** | `git log -1 origin/feat/c3-videos-refonte-final` |
| **Build** : `pnpm install --frozen-lockfile && pnpm --filter web build` · **Start** : `pnpm --filter web start` | `frontend/railway.toml` |

### 1.1 ✅ CONFIRMÉ AUPRÈS DE RAILWAY le 2026-10-31 — **lecture seule**

**Interrogé avec le CLI `railway` authentifié sous le compte de Kyria**,
**par des requêtes SANS EFFET** *(`railway status --json`, puis la requête
`deploymentTriggers` de l'API publique)*. ⛔ **Aucune mutation**, ⛔ **aucun
déploiement déclenché**.

| Ce qui était supposé | Ce que Railway répond | Statut |
|---|---|---|
| **projet `dazzling-wisdom`** | **`9e19425b-a3c7-4a01-a4ba-debb5207ff19`**, **service `yunicity.review`** *(`8ce52277…`)*, **environnement `production`** *(`fe15407b…`)* | ✅ **CONFIRMÉ** |
| **dépôt source** | **`Kyria-Zaire/yunicity.review`** — **EXACTEMENT l'`origin` de cet arbre de travail** *(`git remote -v`)* | ✅ **CONFIRMÉ** — **pousser sur `origin` alimente bien ce service** |
| **branche suivie** | **déclencheur `github` actif sur la branche `feat/c3-videos-refonte-final`** *(trigger `dddf8bde…`)* | ✅ **CONFIRMÉ** — **le déploiement automatique sur poussée EXISTE** |
| **SHA servi** | **`bf008a87593d980900ee228801184d620722d8b7`**, **branche `feat/c3-videos-refonte-final`**, **déploiement `SUCCESS` du 2026-10-19T16:46:04Z** | ✅ **CONFIRMÉ** — ⚠️ **ce qui LÈVE la réserve « SHA attribué par continuité, NON RELU »** des passations : **l'attribution était CORRECTE** |
| **domaine** | **`preview.yunicity.city`** *(port 8080)* · **et `yunicityreview-production-97c7.up.railway.app`** | ✅ **CONFIRMÉ** — **c'est l'URL de la recette** |
| **retour arrière par redéploiement** | **`canRedeploy: true`** sur le déploiement courant | ✅ **CONFIRMÉ disponible** *(§6, R-a)* |

### 1.2 🛑 FAIT DÉCISIF — **Railway N'ATTEND PAS LA CI**

**Le déclencheur porte `checkSuites: false`.** **Traduction** : **une poussée sur
`feat/c3-videos-refonte-final` lance le déploiement IMMÉDIATEMENT**, ⛔ **sans
attendre le moindre contrôle GitHub** — **même si la CI est rouge, même si elle
n'a pas démarré.**

> **Conséquence sur l'ordre des opérations** : **la CI doit être OBTENUE AVANT
> la poussée vers la branche Preview**, **et cet ordre repose sur la DISCIPLINE,
> pas sur un garde-fou de la plateforme** *(§7)*. ⛔ **Il n'y a pas de filet.**

### 1.3 ⚠️ FAIT NEUF — **la poussée redéploie DEUX services, pas un**

**Deux déclencheurs GitHub visent la MÊME branche**, **tous deux avec
`checkSuites: false`** :

| Service | Démarrage | Déployé sur `bf008a87` |
|---|---|---|
| **`yunicity.review`** *(`8ce52277…`)* | `pnpm --filter web start` | ✅ **SUCCESS** |
| **`unified-media-preview`** *(`8c799b6b…`)* | `python -m app.runtime.unified_process` | ✅ **SUCCESS** |

**Ce que cela implique** : **la poussée fait REDÉMARRER aussi le service
applicatif Python**, **pas seulement le web**. ⚠️ **Le seul fichier `backend/`
de ce commit est un fichier de TEST** *(`tests/test_feed.py`)* — **le runtime
Python est donc inchangé**, **mais son image est reconstruite et le service
redémarre**. **À prévoir** : **une brève indisponibilité de l'API pendant la
recette si la poussée est faite juste avant.** ⛔ **Ne pas pousser pendant une
session de recette en cours.**

**Conséquence directe de tout ceci** : **le correctif n'atteindra la Preview que
si le code arrive sur `feat/c3-videos-refonte-final`.** **Commiter — et même
pousser — sur `fix/mobile-publishing-p0` ne déploie RIEN** *(aucun déclencheur
ne surveille cette branche)*.

✅ **Vérifié** : **la branche de travail est 5 commits DEVANT la branche Preview
et 0 DERRIÈRE** — **l'avance rapide est possible**, ⛔ **aucun `--force` n'est
nécessaire nulle part**.

---

## 2. Périmètre du commit — **listes EXACTES**

### 2.1 ✅ À INCLURE — **28 fichiers de code**

**Aucun de ces fichiers ne portait de modification antérieure** : **ils sont
intégralement le fait de ce ticket.**

**Base de cette affirmation** : **au démarrage du ticket, `git status` ne
listait AUCUN fichier `frontend/` ni `backend/` modifié** — **les quatre seuls
fichiers suivis modifiés étaient des documents** *(§2.3.a)*. **Contrôle
reproductible** :

```bash
git status --porcelain | grep -cE '^( M|\?\?) (frontend|backend)'   # 28 attendu
git status --porcelain | grep -E '^ M (frontend|backend)' | wc -l    # 20 attendu
git status --porcelain | grep -E '^\?\? (frontend|backend)' | wc -l  # 8 attendu
```

**Frontend — paquet partagé (5)**

```
frontend/packages/utils/src/feed-api.ts                       (M)
frontend/packages/utils/src/index.ts                          (M)
frontend/packages/utils/src/yunicity-api.ts                   (M)
frontend/packages/utils/src/publication-delete.ts             (N)
frontend/packages/utils/src/publication-delete.test.ts        (N)
```

**Frontend — fil (9)**

```
frontend/apps/web/components/feed/citizen-post-card.tsx                 (M)
frontend/apps/web/components/feed/feed-author-header.tsx                (M)
frontend/apps/web/components/feed/feed-card.tsx                         (M)
frontend/apps/web/components/feed/feed-editorial-main-column.tsx        (M)
frontend/apps/web/components/feed/feed-editorial-stream-region.tsx      (M)
frontend/apps/web/components/feed/feed-post-options-menu.tsx            (M)
frontend/apps/web/components/feed/desktop/feed-desktop-stream.tsx       (M)
frontend/apps/web/components/feed/portal/feed-data-controller.tsx       (M)
frontend/apps/web/components/feed/publication-delete-dialog.tsx         (N)
```

**Frontend — profil (5)**

```
frontend/apps/web/components/profile/desktop/profile-desktop-owner-screen.tsx   (M)
frontend/apps/web/components/profile/desktop/profile-desktop-publications.tsx   (M)
frontend/apps/web/components/profile/medium/profile-medium-overview.tsx         (M)
frontend/apps/web/components/profile/profile-compact-screen.tsx                 (M)
frontend/apps/web/components/profile/profile-publication-options-menu.tsx       (N)
```

**Frontend — hooks (4)**

```
frontend/apps/web/hooks/use-feed.ts                    (M)
frontend/apps/web/hooks/use-profile-portal-context.ts  (M)
frontend/apps/web/hooks/use-overflow-menu.ts           (N)
frontend/apps/web/hooks/use-publication-deletion.ts    (N)
```

**Tests (5)**

```
frontend/apps/web/lib/feed/publication-delete-flow.test.tsx       (N)
frontend/apps/web/lib/feed/publication-delete-wiring.test.ts      (N)
frontend/apps/web/e2e/functional/21-mobile-feed-functional.spec.ts    (M) ⚠️ NON EXÉCUTÉE
frontend/apps/web/e2e/functional/33-unified-publication-card.spec.ts  (M) ⚠️ NON EXÉCUTÉE
backend/tests/test_feed.py                                        (M) ✅ exécutée sous Docker
```

**Total : 20 modifiés (`M`) + 8 nouveaux (`N`) = 28.** **Ce nombre est le
CONTRÔLE du §4 : si la mise en scène n'en compte pas exactement 28, on
s'arrête.**

### 2.2 ✅ Documents de ce ticket — **2 fichiers NEUFS, commit SÉPARÉ**

```
docs/workflow/passations/PROFILE-POST-MENU-01-supprimer-sa-publication.md   (N)
docs/qa/PROFILE-POST-MENU-01-revue-correctif.md                             (N)
docs/ops/PROFILE-POST-MENU-01-commit-et-deploiement-preview.md              (N)  ← ce document
```

**Ils sont intégralement de ce ticket**, **et ne contiennent le travail
d'aucune session antérieure.**

### 2.3 ⛔ À NE PAS INCLURE — **séparation des modifications antérieures**

**a) Documents SUIVIS déjà modifiés AVANT ce ticket — 4 fichiers**

| Fichier | Touché par ce ticket ? |
|---|---|
| `docs/qa/PR202-WEB-recette-manuelle.md` | ⛔ **NON** — **modification antérieure PURE** |
| `docs/workflow/passations/PR202-WEB-recette-publication-photo.md` | ⛔ **NON** — **modification antérieure PURE** |
| `docs/workflow/TICKETS-INDEX.md` | ⚠️ **OUI, par-dessus une modification antérieure** → **MIXTE** (§2.4) |
| `docs/qa/PR202-WEB-bilan-consolide.md` | ⚠️ **OUI, par-dessus une modification antérieure** → **MIXTE** (§2.4) |

**b) Documents NON SUIVIS antérieurs — 29 fichiers + 1 dossier**

**Décompte vérifié** : **`git status` liste 35 entrées `?? docs/`** —
**3 sont de ce ticket** *(§2.2)*, **2 sont MIXTES** *(§2.4)*, **et les 30
autres sont ANTÉRIEURES PURES** : **29 fichiers + le dossier
`docs/workflow/tickets/`** *(14 fiches)*.

**Elles datent de sessions précédentes**, ⛔ **aucune n'appartient à ce
ticket** : **`docs/qa/PASSPORT-etat-des-lieux-metier.md`**, **19 passations
`PR202-WEB-recette-*`**, **et les passations `FAVORITES-SAVE-01`,
`NOTIF-INBOX-01`, `PASSPORT-METIER-00`, `PASSPORT-METIER-01`,
`SEARCH-RELEVANCE-01`, `SOCIAL-COMMENT-01`, `SOCIAL-LIKE-01`,
`TRIBES-OPEN-01`, `COUVERTURE-FONCTIONNELLE-01-etat-des-lieux`**.

**Deux d'entre eux sont MIXTES** *(non suivis, mais annotés par ce ticket)* :
**`docs/qa/COUVERTURE-FONCTIONNELLE-01.md`** et
**`docs/workflow/passations/MEDIA-MULTI-PHOTO-01-publier-plusieurs-photos.md`**
→ §2.4.

### 2.4 ⚠️ Les QUATRE fichiers MIXTES — **pourquoi ils ne se séparent pas par chemin**

| Fichier | Contenu antérieur | Ce que ce ticket y a ajouté |
|---|---|---|
| `docs/workflow/TICKETS-INDEX.md` | **état de tous les tickets**, modifié en session antérieure | **section « Ticket actif »**, **ligne du correctif**, **ligne de la fiche de défaut**, **correction de la trace `M1`–`M2`** |
| `docs/qa/PR202-WEB-bilan-consolide.md` | **registre de preuves**, modifié en session antérieure | **une cellule** de la fiche `PROFILE-POST-MENU-01` |
| `docs/qa/COUVERTURE-FONCTIONNELLE-01.md` | **fichier NON SUIVI créé en session antérieure** | **deux lignes** *(suppression depuis le profil · publier dans le fil)* |
| `docs/workflow/passations/MEDIA-MULTI-PHOTO-01-…md` | **fichier NON SUIVI créé en session antérieure** | **suspension du ticket**, **correction de la trace `M1`–`M2`** |

> **Recommandation : les LAISSER HORS DE CES COMMITS.** **Les commiter emporte
> le travail documentaire d'autres tickets** *(`FAVORITES-SAVE-01`,
> `SOCIAL-COMMENT-01`, `SEARCH-RELEVANCE-01`, `MEDIA-MULTI-PHOTO-01`…)*, **dont
> la mise au propre n'est pas l'objet de ce ticket.**
>
> **Séparer PLUS FINEMENT est possible mais déconseillé** : **`git add -p`
> permettrait de ne retenir que mes sections** *(et `git add -N` d'abord pour
> les deux fichiers non suivis)*. ⛔ **Déconseillé** : **mes annotations de
> l'index sont ADJACENTES aux modifications antérieures de la même section** —
> **le découpage par morceaux produirait un index incohérent**, **et le risque
> d'en emporter une partie par inadvertance est réel.**
>
> **Conséquence ASSUMÉE du choix recommandé** : **dans l'arbre COMMITÉ, l'index
> n'annoncera pas le ticket**, **et les liens de ma passation vers
> `MEDIA-MULTI-PHOTO-01-…md` et `COUVERTURE-FONCTIONNELLE-01.md` pointeront
> vers des fichiers non suivis** — **exactement comme les ~30 autres documents
> déjà dans cet état**. **La mise au propre documentaire est une décision
> SÉPARÉE, à prendre par Kyria.**

---

## 3. Message de commit — **prêt à copier**

### 3.1 Commit 1 — le code *(c'est lui que la Preview déploie)*

```
fix(feed,profile): supprimer sa propre publication depuis l'interface

PROFILE-POST-MENU-01. Aucun chemin de suppression n'existait dans
l'interface : le menu de la carte du fil n'etait pas rendu sur sa propre
publication, et le bouton « Options » des publications du profil etait
`disabled` dans le code. Le nettoyage des publications de recette etait
donc impossible, ce qui bloquait la phase d'ecriture de
MEDIA-MULTI-PHOTO-01.

Deux surfaces cablees, qui couvrent les trois paliers : le menu de
debordement de la carte du fil (arbre DOM unique pour desktop, medium et
mobile) et le bouton « Options » des publications du profil proprietaire
(ProfileDesktopPublications, montee par les trois paliers).

Confirmation obligatoire avant toute ecriture. Message francais sur refus
403/404/401, sans detail serveur. Retrait de la carte APRES le 204
seulement : une suppression optimiste masquerait une publication qu'un 403
laisse en ligne, et l'ecran mentirait jusqu'au rechargement.

La suppression est DOUCE cote serveur (is_active = False) : la ligne reste
en base, les fichiers medias restent stockes, et l'auteur garde l'acces par
URL directe. Le libelle utilisateur ne promet donc aucun effacement.

Le reseau reste chez le proprietaire de la liste, comme onReport :
FeedCardDependencies n'a pas bouge, et le harnais E2E n'a pas change.

Spec Playwright 21 : son assertion exigeait l'ABSENCE du menu sur sa propre
publication, ce que ce correctif rend faux. L'intention — pas de
self-signalement — est preservee et portee desormais sur le CONTENU du
menu. Spec 33 inchangee : elle eprouve la branche sans cablage (harnais).
Ces deux specs NE SONT PAS EXECUTEES : aucun Playwright en CI, et le
typecheck ne les valide pas en navigateur.

Backend : test d'autorisation ajoute — 403 a un tiers et publication
CONSERVEE. Execute sous Docker sur base jetable : tests/test_feed.py,
17 passed.

Aucune preuve d'ecran : le defaut reste classe O jusqu'a la recette sur
desktop, medium et Safari iPhone reel.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
```

### 3.2 Commit 2 — les documents du ticket

```
docs(workflow): passation, revue de diff et preparation de deploiement
  PROFILE-POST-MENU-01

Passation du ticket (autoportante, zero memoire requise), revue du diff au
format rule 05 (verdict propose : REQUEST CHANGES, non bloquant sur le
code, bloquant sur la PREUVE), et preparation du commit cible et du
deploiement Preview avec sa procedure de retour arriere.

Les documents qui MELANGENT le travail de sessions anterieures restent hors
de ce commit : TICKETS-INDEX.md, PR202-WEB-bilan-consolide.md,
COUVERTURE-FONCTIONNELLE-01.md et la passation MEDIA-MULTI-PHOTO-01. Leur
mise au propre est une decision separee.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
```

---

## 4. Commandes — **commit, avec contrôles de CHEMINS et de CONTENU**

> ⛔ **`git restore --staged .` est PROSCRIT dans cette procédure.** **Il
> désindexerait aussi un travail préexistant qu'une autre session aurait mis en
> scène** *(la zone d'index est partagée par tous les arbres de travail de ce
> dépôt)*. **On ne désindexe QUE le delta de l'opération** — §4.3.

### 4.1 Référence : les 28 chemins attendus

**À créer HORS du dépôt** *(aucun fichier de liste n'est committé)* :

```bash
cd /c/Users/kyria/yunicity-wt-pr202-ci

cat > /tmp/stage-attendu.txt <<'EOF'
backend/tests/test_feed.py
frontend/apps/web/components/feed/citizen-post-card.tsx
frontend/apps/web/components/feed/desktop/feed-desktop-stream.tsx
frontend/apps/web/components/feed/feed-author-header.tsx
frontend/apps/web/components/feed/feed-card.tsx
frontend/apps/web/components/feed/feed-editorial-main-column.tsx
frontend/apps/web/components/feed/feed-editorial-stream-region.tsx
frontend/apps/web/components/feed/feed-post-options-menu.tsx
frontend/apps/web/components/feed/portal/feed-data-controller.tsx
frontend/apps/web/components/feed/publication-delete-dialog.tsx
frontend/apps/web/components/profile/desktop/profile-desktop-owner-screen.tsx
frontend/apps/web/components/profile/desktop/profile-desktop-publications.tsx
frontend/apps/web/components/profile/medium/profile-medium-overview.tsx
frontend/apps/web/components/profile/profile-compact-screen.tsx
frontend/apps/web/components/profile/profile-publication-options-menu.tsx
frontend/apps/web/e2e/functional/21-mobile-feed-functional.spec.ts
frontend/apps/web/e2e/functional/33-unified-publication-card.spec.ts
frontend/apps/web/hooks/use-feed.ts
frontend/apps/web/hooks/use-overflow-menu.ts
frontend/apps/web/hooks/use-profile-portal-context.ts
frontend/apps/web/hooks/use-publication-deletion.ts
frontend/apps/web/lib/feed/publication-delete-flow.test.tsx
frontend/apps/web/lib/feed/publication-delete-wiring.test.ts
frontend/packages/utils/src/feed-api.ts
frontend/packages/utils/src/index.ts
frontend/packages/utils/src/publication-delete.test.ts
frontend/packages/utils/src/publication-delete.ts
frontend/packages/utils/src/yunicity-api.ts
EOF
sort -o /tmp/stage-attendu.txt /tmp/stage-attendu.txt
wc -l < /tmp/stage-attendu.txt        # 28
```

### 4.2 Mise en scène, **en mémorisant l'état antérieur de l'index**

```bash
# Ce qui etait DEJA mis en scene avant mon intervention (peut etre non vide !)
git diff --cached --name-only | sort > /tmp/stage-avant.txt
wc -l < /tmp/stage-avant.txt

git add frontend backend

git diff --cached --name-only | sort > /tmp/stage-apres.txt
# Le DELTA : exactement ce que CETTE operation a ajoute a l'index
comm -13 /tmp/stage-avant.txt /tmp/stage-apres.txt > /tmp/stage-delta.txt
```

### 4.3 Contrôles BLOQUANTS — **chemins, puis contenu**

```bash
# (1) CHEMINS : le delta doit etre EXACTEMENT la liste de reference.
#     `diff` compare chemin par chemin — pas seulement le nombre.
diff /tmp/stage-attendu.txt /tmp/stage-delta.txt && echo "CHEMINS OK (28/28)"

# (2) AUCUN document, AUCUN artefact : doit afficher 0 a chaque fois
grep -c '^docs/' /tmp/stage-delta.txt
grep -cE 'next-env\.d\.ts|\.next|node_modules|pnpm-lock' /tmp/stage-delta.txt

# (3) CONTENU : rien de ces 28 chemins ne doit rester HORS de l'index
#     (sinon le commit serait partiel). Doit afficher 0.
git diff --name-only -- $(tr '
' ' ' < /tmp/stage-attendu.txt) | wc -l

# (4) CONTENU : volumetrie et nature du diff mis en scene, a LIRE
git diff --cached --stat
git diff --cached --diff-filter=A --name-only   # les 8 fichiers NOUVEAUX, et eux seuls

# (5a) CONTENU : interdits DURS dans les lignes AJOUTEES. Doit afficher 0.
#      (mesure faite sur les 28 fichiers le 31/10 : 0)
git diff --cached | grep -cE '^\+.*(console\.log|: any|@ts-ignore|as unknown as)'

# (5b) CONTENU : dette declaree. Doit afficher 1 — le TODO(debt) de
#      hooks/use-overflow-menu.ts — et AUCUN autre TODO.
git diff --cached | grep -E '^\+' | grep -c 'TODO(debt)'                       # 1
git diff --cached | grep -E '^\+' | grep 'TODO' | grep -vc 'TODO(debt)'        # 0
#      NB : `grep -E` ne connait PAS les lookaheads — `TODO(?!\(debt\))` ne
#      filtrerait RIEN et donnerait un faux 0. D'ou les deux passes.

# (6) CONTENU : le lockfile et la configuration de test sont INTACTS
git diff --cached --name-only | grep -cE 'pnpm-lock\.yaml|vitest\.config'
```

> 🛑 **Au MOINDRE écart — chemin inattendu, contrôle non nul, contenu
> surprenant — ON NE COMMITE PAS**, **et on désindexe UNIQUEMENT le delta** :
>
> ```bash
> git restore --staged --pathspec-from-file=/tmp/stage-delta.txt
> # Verification : l'index est revenu EXACTEMENT a son etat anterieur
> git diff --cached --name-only | sort > /tmp/stage-verif.txt
> diff /tmp/stage-avant.txt /tmp/stage-verif.txt && echo "INDEX RESTAURE A L'IDENTIQUE"
> ```
>
> *(`--pathspec-from-file` est disponible : `git version 2.49.0` sur ce poste.)*
> ⛔ **Ni `git restore --staged .`**, ⛔ **ni `git reset`** *(qui, sans chemin,
> emporterait tout l'index)*.

### 4.4 Commit 1 — le code

> ⚠️ **PIÈGE DE CHEMIN, rencontré le 31/10 — à ne pas refaire.** **Sous Git
> Bash sur Windows, `/tmp` de `git` est le TEMP de Windows**, **tandis qu'un
> `python` qui écrit dans `"/tmp/…"` crée `C:	mp\…`** : **le
> `git commit -F /tmp/…` a échoué sur `could not read log file`.** ⛔ **Rien
> n'avait été commité, et l'index était intact** — **mais il faut un CHEMIN
> ABSOLU IDENTIQUE des deux côtés.** **Écrire le message dans le répertoire de
> travail temporaire de la session, et le passer en chemin absolu `C:/…`.**

```bash
# Message du §3.1, place hors du depot, en CHEMIN ABSOLU
git commit -F "C:/chemin/absolu/vers/message-commit-1.txt" --cleanup=whitespace
git log --oneline -1          # ← NOTER CE SHA : c'est la preuve du deploiement
git show --stat HEAD | tail -5   # contre-controle : 28 fichiers dans le commit
```

### 4.5 Commit 2 — les documents de ce ticket

```bash
git diff --cached --name-only | sort > /tmp/stage-avant-2.txt   # doit etre vide
git add docs/workflow/passations/PROFILE-POST-MENU-01-supprimer-sa-publication.md         docs/qa/PROFILE-POST-MENU-01-revue-correctif.md         docs/ops/PROFILE-POST-MENU-01-commit-et-deploiement-preview.md

# CONTROLE BLOQUANT : exactement ces 3 chemins, et rien d'autre
git diff --cached --name-only | sort
git diff --cached --name-only | wc -l            # 3
git diff --cached --name-only | grep -cv 'PROFILE-POST-MENU-01'   # 0

git commit -F /tmp/message-commit-2.txt
```

### 4.6 Contrôle final — **les modifications antérieures sont INTACTES**

```bash
# Les 4 documents MIXTES et antérieurs purs : toujours modifies, NON commites
git status --porcelain | grep -E '^ M docs/'
# Les ~30 documents non suivis d'autres tickets : toujours la
git status --porcelain | grep -cE '^\?\? docs/'
# Et AUCUN fichier applicatif ne reste en attente
git status --porcelain | grep -cE '^( M|\?\?) (frontend|backend)'   # 0 attendu
```

⛔ **Jamais `git add -A`**, ⛔ **jamais `git add .`**, ⛔ **jamais `git commit -a`**,
⛔ **jamais `git stash`** *(pile partagée entre arbres de travail)*.

---

## 5. Déploiement Preview

```bash
# ── 1. Voir EXACTEMENT ce que la poussee emporterait
git log --oneline origin/feat/c3-videos-refonte-final..HEAD
```

⚠️ **Elle emporte 5 commits ANTÉRIEURS en plus du mien** — **`0b8b70dd`,
`e07e809c`, `07236fb0`, `d70d6290`, `8d2d4c9f`**, **tous de Kyria, déjà faits**.
⛔ **Une avance rapide ne peut pas n'emporter qu'un seul commit** : **c'est à
assumer**, **ou à traiter par un `cherry-pick` sur une branche partant de
`origin/feat/c3-videos-refonte-final`**, **ce qui ferait diverger les deux
branches.**

**✅ CONTRÔLE FAIT — ces 5 commits NE MODIFIENT PAS L'APPLICATION.**
⚠️ **Correction d'une affirmation antérieure de ce document** : **j'avais écrit
« ils ne touchent QUE `docs/` ». C'était INEXACT.** **Mesure réelle : 11
fichiers.**

```bash
# Contrôle reproductible — doit afficher 0
git diff --name-only origin/feat/c3-videos-refonte-final..HEAD -- frontend backend | wc -l
# Vue d'ensemble des 11 fichiers
git diff --stat origin/feat/c3-videos-refonte-final..HEAD
```

| Fichiers | Nature | Effet sur l'artefact servi |
|---|---|---|
| **7 sous `docs/`** *(`README`, `INFRA-04`, bilan, recette-manuelle, index, 2 passations)* | **documentation** | ⛔ **aucun** |
| **`.claude/rules/15-passation.md`** *(+46)* · **`.cursor/rules/15-passation.mdc`** *(+51)* · **`CLAUDE.md`** *(+1)* | **instructions d'agent** — **le protocole de passation** | ⛔ **aucun** : **jamais construit, jamais servi** |
| **`scripts/lint-agent-rules.py`** *(+1)* | **outillage de dépôt** — **le linter de règles, utilisé par `lint-agent-rules.yml`** | ⛔ **aucun sur l'app** · ⚠️ **mais il change le comportement de CE workflow de CI** |

> ✅ **Ce qui est ÉTABLI, et c'est le point qui compte** : **ZÉRO fichier sous
> `frontend/` ou `backend/`.** **Le root directory du service Railway est
> `frontend`** : **l'artefact déployé ne change donc que par le commit de
> code.** ⛔ **« docs seulement » serait faux ; « aucun fichier applicatif » est
> vrai.**

```bash
# ── 2. Poussee en AVANCE RAPIDE (aucun --force : ni necessaire, ni autorise)
git push origin HEAD:feat/c3-videos-refonte-final

# ── 3. Verifier le nouveau sommet distant
git log --oneline -1 origin/feat/c3-videos-refonte-final
```

**Puis, dans le tableau de bord Railway** *(projet `dazzling-wisdom`, service
`yunicity.review`)* : **vérifier qu'un déploiement a démarré sur le SHA noté au
§4.3**, **ou le déclencher**. **Enfin, relever le SHA RÉELLEMENT servi** —
⛔ **ne pas l'attribuer « par continuité »** : **c'est précisément la réserve
que la passation `MEDIA-MULTI-PHOTO-01` traîne depuis le 31/10.**

### 5.1 ⚠️ Ce que la poussée NE déclenche PAS : **la CI**

**Établi en lisant les cinq workflows** : **`frontend-ci`, `backend-ci`,
`pr-checks` et `docker-ci` ne se déclenchent que sur `pull_request` vers `main`
ou `push` vers `main`** *(`lint-agent-rules` ajoute `develop`)*. **Une poussée
sur `feat/c3-videos-refonte-final` n'exécute AUCUN contrôle** — **et Railway,
lui, déploie quand même** *(`checkSuites: false`, §1.2)*.

### 5.2 🛑 `docker-ci` SEUL NE SUFFIT PAS — **ce que chaque workflow couvre**

| Workflow | Couvre | Ne couvre PAS |
|---|---|---|
| **`docker-ci`** *(déclenchable à la main)* | **compose validé**, **santé API**, **`pytest` sur base jetable** → **le test d'autorisation de ce ticket** | ⛔ **TOUT le frontend** : **ni lint, ni typecheck, ni vitest, ni build Next** |
| **`frontend-ci`** | **`pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`** — **les 948 tests web et le build servi par la Preview** | ⛔ **aucun Playwright** |
| **`backend-ci`** | **`ruff` · `mypy app tests` · `pytest`** | — |
| **`pr-checks`** | **contrôles de PR** | — |
| **`lint-agent-rules`** | **cohérence PRD / BMAD / rules** | — |

> ⛔ **Le correctif est à 93 % frontend** : **lancer `docker-ci` seul laisserait
> le code réellement déployé — celui du `frontend` — SANS AUCUN contrôle de
> CI.** **Seul `frontend-ci` éprouve ce qui part sur la Preview.**

### 5.3 ✅ Obtenir la CI — **la PR vers `main` est le seul chemin complet**

```bash
# 1. Pousser la branche de TRAVAIL : aucun declencheur Railway ne la surveille,
#    donc cette poussee ne deploie RIEN.
git push -u origin fix/mobile-publishing-p0

# 2. Ouvrir la PR vers main — en brouillon : la CI tourne, la fusion non.
gh pr create --base main --head fix/mobile-publishing-p0 --draft   --title "fix(feed,profile): supprimer sa propre publication depuis l'interface"   --body-file /tmp/corps-pr.txt

# 3. Suivre les contrôles jusqu'au vert
gh pr checks --watch

# 4. Facultatif, en complement : la suite backend sur base jetable
gh workflow run docker-ci.yml --ref fix/mobile-publishing-p0
```

⚠️ **Dans TOUS les cas, la suite Playwright reste NON EXÉCUTÉE** : **aucun
workflow ne la lance** — **lacune connue, consignée dans `e07e809c`** —, **et le
typecheck qui l'a compilée ne la valide PAS en navigateur.**

## 6. Retour arrière

### 6.1 Trois niveaux, du plus rapide au plus lourd

| # | Moyen | Effet | Réserve |
|---|---|---|---|
| **R-a** | **Railway → redéployer le déploiement précédent** *(SHA `bf008a87`)* | **la Preview resert l'ancien artefact en quelques minutes**, **sans aucune opération Git** | ✅ **DISPONIBILITÉ CONFIRMÉE** : **`canRedeploy: true`** sur le déploiement courant *(lu le 31/10)*. ⚠️ **À faire pour les DEUX services** si les deux ont été redéployés *(§1.3)*. **C'est la voie la plus rapide, à privilégier en urgence** |
| **R-b** | **`git revert`** | **annule le correctif par un NOUVEAU commit** : **l'historique est préservé**, **et la Preview redéploie** | ✅ **recommandé** pour un retour durable |
| **R-c** | **remettre la branche Preview exactement sur `bf008a87`** | **réécrit l'historique distant** | ⛔ **exige `--force`** — **DÉCISION EXPLICITE DE KYRIA**, **non recommandé** : d'autres arbres de travail suivent cette branche |

```bash
# R-b — retour arriere par revert
git revert --no-edit <SHA-du-commit-1>
git push origin HEAD:feat/c3-videos-refonte-final
# puis verifier dans Railway qu'un deploiement a demarre
```

### 6.2 ⛔ Ce qu'AUCUN retour arrière ne défait

| Effet | Pourquoi |
|---|---|
| ⛔ **une publication SUPPRIMÉE pendant la recette** | **`is_active = False` reste posé en base**. **Aucune interface, aucune route API ne la rétablit** — **seule une écriture directe en base le ferait**. **Revenir au code d'avant ne la fait PAS réapparaître** |
| ⛔ **les fichiers médias** | **ils n'ont jamais été effacés** *(suppression douce)* : **rien à restaurer**, **mais rien n'est perdu non plus** |

> 🛑 **Garde-fou qui en découle, et qui est la consigne de Kyria** :
> **ne supprimer, pendant la recette, QUE la publication de test créée pour
> elle** *(`R0`)*. ⛔ **Aucune publication préexistante**, **sous aucun
> prétexte** — **un retour arrière ne la rendrait pas.**

### 6.3 Ce qu'il n'y a PAS à défaire

- ⛔ **aucune migration Alembic** — **le schéma n'est pas touché** ;
- ⛔ **aucune variable d'environnement** ajoutée ou modifiée ;
- ⛔ **aucune route API nouvelle** — **`DELETE /api/v1/posts/{id}` existait
  déjà**, **et son autorisation n'a pas changé** ;
- ⛔ **aucun secret**, **aucune dépendance** ajoutée *(`pnpm-lock.yaml`
  inchangé)*.

---

## 7. Ordre des opérations — **CI VERTE → déploiement des DEUX services → recette**

> **Ordre RETENU par Kyria le 2026-10-31.**

> 🛑 **Cet ordre repose sur la DISCIPLINE, pas sur un garde-fou** : **le
> déclencheur Railway porte `checkSuites: false`** *(§1.2)* — **il déploie dès
> la poussée, CI rouge ou CI absente.** **Rien ne rattrapera une inversion.**

| # | Étape | Déploie ? | Garde |
|---|---|---|---|
| **1** | **Validation du diff par Kyria** — [revue](../qa/PROFILE-POST-MENU-01-revue-correctif.md) · **et arbitrage des constats de revue** | — | **les constats de revue sont-ils à corriger AVANT ?** |
| **2** | **Commit 1** *(code, 28 fichiers)* et **Commit 2** *(3 documents)* — §4 | ⛔ **non** | **les 6 contrôles bloquants du §4.3** |
| **3** | **Pousser la branche de TRAVAIL** `fix/mobile-publishing-p0` | ⛔ **non** — **aucun déclencheur ne la surveille** | — |
| **4** | **PR vers `main`** *(brouillon)* → **CI** | ⛔ **non** | 🛑 **`frontend-ci` VERTE** *(lint · typecheck · 948 tests · build)* **et `backend-ci` VERTE** — ⛔ **`docker-ci` seul ne suffit pas** *(§5.2)* |
| **5** | ✍️ **Pousser vers `feat/c3-videos-refonte-final`** | ✅ **OUI, immédiatement** — **et pour les DEUX services** *(`yunicity.review` ET `unified-media-preview`, §1.3)* | ⛔ **ne franchir cette étape qu'avec l'étape 4 au vert** · 🛑 **attendre que les DEUX soient en `SUCCESS` avant la recette** — **le second porte l'API** |
| **6** | **Relever le SHA RÉELLEMENT servi** | — | **`railway status --json`** → **`latestDeployment.meta.commitHash`** ⛔ **plus jamais d'attribution « par continuité »** : **la commande le dit** |
| **7** | **Recette à l'écran, AVEC Kyria** — **`R1`–`R9`** du §8 de la passation : **desktop**, **medium**, **SAFARI iPHONE RÉEL** | — | ⚠️ **`R0` crée UNE publication de test : écriture à AUTORISER** · ⛔ **ne supprimer AUCUNE publication préexistante** *(§6.2)* |
| **8** | **Classement du défaut**, **sortie du brouillon de PR**, **fusion** | — | **seulement après l'étape 7** |

**Commande de l'étape 6, prête à l'emploi** :

```bash
railway status --json | python -c "import json,sys; d=json.load(sys.stdin); [print(n['node']['serviceName'], '→', n['node']['latestDeployment']['meta']['commitHash'], n['node']['latestDeployment']['meta']['branch'], n['node']['latestDeployment']['status']) for e in d['environments']['edges'] for n in e['node']['serviceInstances']['edges'] if n['node'].get('latestDeployment')]"
```

> ⛔ **Le ticket reste OUVERT jusqu'à l'étape 7**, **et le défaut reste classé
> `O`**. **Déployer n'est pas prouver.**

---

## 8. Ce qui reste NON EXÉCUTÉ à l'heure de cette préparation

| Élément | Statut |
|---|---|
| **Les deux specs Playwright** *(`21` et `33`)* | ⛔ **NON EXÉCUTÉES.** **Elles compilent** *(le typecheck web inclut les 44 specs `e2e/functional`)*, ⛔ **mais compiler n'est pas s'exécuter dans un navigateur** : **le typecheck ne dit RIEN de ce que Playwright observerait**. **Aucun workflow ne les lance** |
| **La recette à l'écran** | ⛔ **non jouée** — **critère de sortie du ticket** |
| **Le SHA servi par la Preview** | ⛔ **inexistant** : **rien n'est poussé** |

### 8.1 Paramètre exact du run « 30 secondes »

**La suite web complète n'est verte sur ce poste qu'avec un délai relevé en
LIGNE DE COMMANDE** :

```bash
cd frontend/apps/web
npx vitest run --testTimeout=30000 --hookTimeout=30000 --maxWorkers=3
# → 93 / 93 fichiers, 956 / 956 tests, 0 echec, 0 erreur, 321 s
```

**Les TROIS paramètres sont nécessaires sur ce poste.** **Sans `--maxWorkers=3`**
*(pool `forks` par défaut, non borné)* : **843 tests passés, 0 ÉCHEC, mais 8
fichiers dont le worker n'a jamais démarré** — **85 / 93 collectés**. ⚠️ **Et
`--poolOptions.forks.maxForks=3` n'existe PAS en ligne de commande sous
vitest 4** *(`CACError: Unknown option --poolOptions`)*.

⛔ **`vitest.config.ts` n'a PAS été modifié** : **le délai par défaut du dépôt
reste 5 s**, **et c'est ce délai que la CI Ubuntu applique.** **Le relèvement
est un paramètre d'exécution LOCAL**, **pas un changement de configuration** —
**et la question de le rendre permanent reste une décision de Kyria**
*(hors périmètre de ce ticket)*.
