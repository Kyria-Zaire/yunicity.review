# Passation — PASSPORT-QR-THIRD-PARTY-01 · Payload du QR Passport envoyé à un tiers

> **Ouvert le 2026-11-05 par Kyria**, seul ticket actif. ⛔ **ZONE ROUGE (jetons).**
> Issu du tableau « Sujets ouverts, hors recette » de l'index ; état des lieux
> `docs/qa/PASSPORT-etat-des-lieux-metier.md` §1.5.
> ⛔ Aucune action sur `main` ni sur la production. **Aucun jeton complet
> enregistré, aucun rejeu.** Correctif **proposé, non appliqué**.

## 1. État Git

Worktree `C:/Users/kyria/yunicity-wt-deps-next-preview`, branche
`fix/passport-qr-local` depuis `5a3e6f22` (Preview servie). Rien de modifié dans
le code. Les passations des tickets précédents (clôtures non commitées) sont
préservées dans l'arbre de travail.

## 2. Preuves — 2026-11-05

### 2.1 Code servi par la Preview (sans connexion)

`preview.yunicity.city` (`5a3e6f22`) — les morceaux JavaScript servis
contiennent la construction `https://api.qrserver.com/v1/create-qr-code/?size=…&data=` + `encodeURIComponent(payload)` :
`app/passport/page-d65ff906deec98fb.js` (1) et
`app/organizations/me/partner/passport/page-409cb3c8fa5f6f5f.js` (1).

### 2.2 Appel réseau observé — QA locale, même code (`5a3e6f22`, build `3Fjzme87wYLGRNmFfnIru`)

Chrome réel, compte `qa.citizen.b`, **requêtes vers `api.qrserver.com`
interceptées et ANNULÉES** par le script (rien n'est parti chez le tiers) ;
contenu `data` **expurgé** (préfixe, longueur, empreinte SHA-256 tronquée) :

| Palier | Requêtes au chargement de `/passport` | URL (expurgée) | Referer |
|---|---|---|---|
| mobile 390 | **2** (`<img>`) | `…/create-qr-code/?size=176x176&data=YNCP1:…[44 car., sha256:3da2b4be]` et `size=160x160`, même donnée | origine seule |
| desktop 1280 | **2** | idem | origine seule |

- Le **jeton Passport complet** (`YNCP1:<qr_token>`) figure dans l'URL —
  `backend/app/core/passport_qr.py` : « MVP **static token** ».
- **Même empreinte** d'une session à l'autre → jeton **statique**.
- Sur mobile, les requêtes viennent des **panneaux desktop / medium masqués en
  CSS** : une image en `display:none` est **quand même chargée**.
- La CSP de la Preview est en **`report-only`** et `img-src` autorise `https:`
  → **rien ne bloque** l'appel.

### 2.3 Non observé — établi par lecture de code seulement

- **Écran partenaire** (`partner-passport-qr-screen.tsx:114`, URL de
  réclamation contenant le **JWT de tampon 24 h**) : **aucun compte partenaire
  QA documenté** → non joué.
- `passport-offer-status-card.tsx:41` (détail d'offre) et
  `passport-mobile-hero-card.tsx:80` : non déclenchés pendant le relevé (la
  vue mobile qui porte la carte héros n'est pas rendue par `/passport`).
- **Relevé authentifié sur `preview.yunicity.city` lui-même : NON FAIT** —
  aucun identifiant Preview à disposition de l'agent (recette Passport faite
  avec le compte de Kyria). Procédure proposée au §4.

### 2.4 Production — lecture de code seulement, aucune action

`311a02e6` (servi sur `yunicity.city`) contient `api.qrserver.com` dans
`partner-passport-qr-screen.tsx` et `passport-mobile-hero-card.tsx`. Motif
présent dans l'historique depuis **`108e48e3` (2026-06-01)**. **Ce qui a
réellement été rendu en production n'est pas établi.**

## 3. Correctif proposé — NON appliqué

**Option A (recommandée) — QR généré sur l'appareil.**
- Composant partagé `PassportQrImage` : SVG produit **localement** par
  `qrcode` — **déjà résolu dans le lockfile** (`qrcode@1.5.4`, utilisé par
  l'app mobile via `react-native-qrcode-svg`) → ajout comme dépendance
  **directe** de `web`, sans nouvelle version. ⚠️ Typages : `@types/qrcode`
  serait une **nouvelle** dépendance de développement — ou déclaration locale
  minimale.
- Rendu en `data:` (autorisé par la CSP) ; états chargement / erreur.
- Remplace les **4** constructions d'URL.
- Tests : génération locale (contenu SVG, aucune URL externe) ; garde-fou
  « aucun `qrserver` dans le source » ; relevé navigateur : **0 requête
  externe** au chargement de `/passport`.

**Option B — QR généré par le backend** (`GET /passport/me/qr.svg`,
authentifié) : jeton jamais dans une URL tierce, mais nouvelle dépendance
Python, nouvelle route, cache à maîtriser. Plus lourd pour le même résultat.

**Écartée — route Next qui rend l'image** : le jeton passerait dans une URL de
notre serveur (journaux).

## 3 bis. ✅ Option A appliquée (décision de Kyria, 2026-11-05) — NON commitée

**Dépendances** (`frontend/apps/web/package.json`) : `qrcode` **`^1.5.4`**
(résolu `1.5.4`, déjà présent dans le lockfile via l'app mobile) ; typages
officiels **`@types/qrcode` `^1.5.6`** (résolu `1.5.6`, publié le 2025-10-24).
Lockfile : **+13 lignes**, uniquement ces deux paquets — une re-résolution sans
rapport (`yargs` 17.7.2 → 17.7.3 sous `@react-native/codegen`) a été **annulée** ;
`pnpm install --frozen-lockfile` vert.

**Code** :
- `lib/passport/passport-qr-image.ts` *(nouveau)* : `passportQrSvgDataUrl(value)`
  — SVG en `data:`, `errorCorrectionLevel: "M"`, `margin: 1`, valeur encodée
  **telle quelle**.
- `hooks/use-passport-qr-image.ts` *(nouveau)* : `{ src, generating, failed }` ;
  jamais l'image d'une valeur précédente ; **aucun repli externe**.
- 4 usages remplacés : `passport-rail-panels.tsx` (desktop / medium, + QR
  agrandi), `passport-mobile-hero-card.tsx`, `passport-offer-status-card.tsx`
  (+ dialogue), `partner-passport-qr-screen.tsx` (URL de réclamation encodée
  telle quelle ; états « Préparation du QR… » / « QR indisponible. Utilisez le
  lien ci-dessous. »). Chargement = chargement API **ou** génération ; erreur =
  état d'erreur existant de chaque écran.
- Au passage, `partner-passport-qr-screen.tsx` : import `useMemo` inutilisé
  retiré (avertissement lint **préexistant**, signalé).

**Contrôles** :
- Tests : `lib/passport/passport-qr-image.test.ts` (6 : `data:` SVG sans adresse
  tierce ni jeton en clair ; valeur exacte encodée ; matrice du SVG = matrice du
  QR ; garde-fou « aucune `https://api.qrserver.com` » dans
  components / hooks / lib / app) ; `lib/passport/use-passport-qr-image.test.tsx`
  (4 : sans valeur, génération, échec sans repli, pas d'image périmée).
  **Mutation** : une URL `api.qrserver.com` réintroduite → garde-fou rouge.
- `tsc` vert ; `eslint` des fichiers touchés vert.
- **Suite web complète** : **117 fichiers / 1 196 tests verts** avec
  `--maxWorkers=4`. ⚠️ Deux exécutions à parallélisme maximal (16) ont eu des
  échecs **différents à chaque fois** (`xcode-uuid-contract`,
  `cancel-deletion-screen`, `verify-email-invite-banner`, puis tests du fil),
  **tous en dépassement de délai**, avec un décompte réduit ; **non reproduits**
  seuls ni à 4 workers ; charge processeur de base 53 % (pile QA Docker active).
  Cause **probable** : saturation — **non établie formellement**.
- **Navigateur — QA locale, build `GXaMRPSE52jys4vmt2qOn`** : **0** morceau JS
  contenant `api.qrserver.com`. Réponse `/passport/me/qr` **remplacée par un
  jeton FICTIF** (`YNCP1:fictif-…`), décodage optique **jsQR 1.4.0** (outil
  installé dans `scratchpad/outils-jsqr`, hors dépôt) :
  - `/passport` 390 et 1280 px : **2/2 images décodées = jeton fictif**, **y
    compris le panneau masqué** ; QR agrandi : **3/3** ;
  - détail d'offre (dialogue QR) : **décodé = jeton fictif** ;
  - requêtes externes : **0 vers `qrserver`** ; seules les images éditoriales
    préexistantes (`upload.wikimedia.org`, `images.unsplash.com`).
- **Non vérifié en navigateur** : écran partenaire (aucun compte partenaire
  QA) — même hook, couvert par les tests unitaires.

**Rotation des jetons exposés** : documentée **séparément**, **non exécutée** —
`docs/workflow/tickets/PASSPORT-QR-TOKEN-ROTATION-01.md`.

## 4. Décisions attendues de Kyria

1. Option A ou B.
2. **Relevé Preview authentifié** — procédure : DevTools › Réseau, filtre
   `qrserver`, ouvrir `/passport` ; noter **nombre de requêtes, taille, préfixe
   `YNCP1:` et longueur** — **ne pas copier l'URL complète**.
3. **Remédiation, zone rouge, hors correctif** : jetons déjà transmis (Preview
   certainement, production possiblement depuis juin) → **rotation des
   `qr_token`** à décider ; les JWT de tampon expirent en 24 h.
4. Production : correctif à porter **uniquement sur demande explicite** (gel en
   vigueur).
