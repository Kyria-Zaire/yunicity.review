# Frontend — Yunicity

Monorepo **pnpm** + **Turborepo** : Next.js (web + admin), Expo (mobile), packages partagés.

## Stack

- TypeScript strict
- Next.js 15 (App Router) + Tailwind CSS
- Expo 54 + Expo Router 6 (mobile) — web/admin restent React 18
- `@yunicity/types` · `@yunicity/utils` · `@yunicity/ui` (tokens)

## Auth (TICKET-105)

### Architecture

| Couche | Rôle |
|--------|------|
| `@yunicity/types` | `AuthUser`, `LoginRequest`, `RegisterRequest`, … |
| `@yunicity/utils` | `AuthClient`, `RefreshManager`, `MemoryTokenStorage` |
| Apps | `AuthProvider`, pages login/register, `ProtectedRoute` |

### Web / Admin (cookie refresh)

1. `POST /auth/login` avec `credentials: "include"`
2. Le backend pose le cookie httpOnly `refresh_token` (path `/api/v1/auth`)
3. L’**access token** reste en **mémoire** (`MemoryTokenStorage`) — jamais de refresh en `localStorage`
4. Au chargement : `POST /auth/refresh` (cookie) puis `GET /auth/me`
5. Sur **401** : refresh automatique (max 1 tentative) puis retry ou déconnexion

### Mobile (body refresh + SecureStore)

1. `POST /auth/login` avec header `X-Client-Platform: mobile`
2. Réponse JSON : `access_token` + `refresh_token`
3. Stockage **expo-secure-store** uniquement (pas AsyncStorage)
4. `POST /auth/refresh` envoie `{ refresh_token }` et met à jour les deux tokens (rotation)

### Erreurs

| HTTP | Comportement frontend |
|------|------------------------|
| 401 | Session expirée / non connecté → redirect login |
| 403 | Permission insuffisante (message API) |

### Pages

| App | Routes |
|-----|--------|
| Web | `/login`, `/register`, `/feed`, `/profile/me`, `/organizations/me`, `/organizations/request` |
| Admin | `/login`, `/partner-scan`, `/partner-offers`, `/partner-leads`, `/passport-offers`, `/unauthorized`, `/protected-admin` |
| Mobile | `/login`, `/register`, `/(protected)/(tabs)/feed`, `/(protected)/(tabs)/profile`, `/(protected)/(tabs)/organizations` |

## Profil & organizations (TICKET-206)

### Routes

| App | Route | Description |
|-----|-------|-------------|
| Web | `/profile/me` | Édition profil, intérêts, visibilité, onboarding |
| Web | `/profile/[username]` | Profil public (404 si privé) |
| Web | `/organizations/me` | Lieux dont tu es membre |
| Web | `/organizations/request` | Demande partenaire MVP |
| Mobile | `/(tabs)/profile` | Équivalent profil |
| Mobile | `/(tabs)/passport` | Passport citoyen (identité, tampons, offres) |
| Mobile | `/(tabs)/organizations` | Liste lieux |
| Mobile | `/organizations/request` | Demande partenaire |
| Web | `/passport` | Passport minimal (activation, carte, offres) |

Admin : cockpit CRM partenaires (TICKET-207, voir ci-dessous).

### API clients (`@yunicity/utils`)

| Module | Rôle |
|--------|------|
| `profile-api.ts` | `getProfileMe`, `updateProfileMe`, `completeProfileOnboarding`, `fetchPublicProfileAnonymous` |
| `organization-api.ts` | `listMyOrganizations`, `createOrganizationRequest`, `filterPublicOrganizations` |
| `YunicityApi` | Façade utilisée par les `AuthProvider` |
| `passport-api.ts` | `getPassportMe`, `activatePassport`, `listPassportStamps`, `listPassportOffers`, `redeemOffer` |
| `feed-api.ts` | `listFeed`, `getPost`, `createPost`, like/unlike, comments, `reportPost` |

Types : `UserProfile`, `PassportMe`, `PartnerOffer`, `OrganizationSummary`, `OrganizationRequestPayload`, `ProfileVisibility`.

## Citizen Feed — fil local (TICKET-403)

Intention UX : [`docs/ux/citizen-feed-ui-intent.md`](../docs/ux/citizen-feed-ui-intent.md)

### Routes

| App | Route | Description |
|-----|-------|-------------|
| Web | `/feed` | `WebAppShell` + `contentWidth="feed"` + rail contextuel |
| Mobile | `/(protected)/(tabs)/feed` | Onglet principal — référence UX |

### Composants

| Web | Mobile |
|-----|--------|
| `apps/web/components/feed/*` | `apps/mobile/components/feed/feed-screen.tsx` |

Cartes : post citoyen, post organisation, offre Passport (sobre). Composer citoyen MVP. Like discret, commentaires inline, signalement léger.

### API (`feed-api.ts` + types `feed.ts`)

Aligné backend TICKET-402 : `GET /feed`, `POST /posts`, like/unlike, comments, `POST /posts/{id}/report`.

### Exclusions MVP frontend feed

Hashtags, mentions, repost, stories, vidéo, temps réel, notifications likes/comments, upload média avancé, ranking algorithmique, dark patterns.

### Tests

`packages/utils/src/feed-labels.test.ts`

## Offres flash locales (TICKET-501)

Intention UX : [`docs/ux/flash-offers-intent.md`](../docs/ux/flash-offers-intent.md)

| Zone | Détail |
|------|--------|
| Labels | `packages/utils/src/flash-labels.ts` + `flash-labels.test.ts` |
| Feed web | `FlashOfferBadge` + `OfferFeedCard` |
| Feed mobile | `components/flash-offer-badge.tsx` + `feed-screen.tsx` |
| Passport | web `passport-screen.tsx`, mobile `offer-card.tsx` |
| Partenaire | admin `partner-offers/new` + `[id]`, mobile `partner-offers/new` + `[id]` |

Timer discret (« Encore 2h », « Disponible encore aujourd'hui ») — **pas** de secondes, rouge agressif, ni section « FLASH OFFERS ».

### Exclusions MVP frontend

Countdown animé, websocket, notifications push auto, popups intrusifs.

## Niveaux Passport & réputation (TICKET-502)

Intention UX : [`docs/ux/passport-levels-intent.md`](../docs/ux/passport-levels-intent.md) · Produit : [`docs/product/passport-levels.md`](../docs/product/passport-levels.md)

| Zone | Détail |
|------|--------|
| Labels | `packages/utils/src/passport-level-labels.ts` |
| Web | `PassportLevelAbout` + carte Passport |
| Mobile | `passport-level-about.tsx` + `PassportTierBadge` |

Pas de jauge XP agressive — progression via texte discret (`progression.hint` API).

### Exclusions MVP frontend

Leaderboard, animations level-up, affichage score type jeu.

## Notifications sociales (TICKET-503)

Intention UX : [`docs/ux/social-notifications-intent.md`](../docs/ux/social-notifications-intent.md) · Produit : [`docs/product/social-notifications.md`](../docs/product/social-notifications.md)

| Zone | Détail |
|------|--------|
| API | `notifications-api.ts` — inbox + préférences |
| Labels | `social-notification-labels.ts` |
| Web | `/notifications` |
| Mobile | `/(protected)/notifications` |

Pas de browser push web MVP — inbox calme, point non lu discret (#2A2FFF).

## Passport — identité citoyenne (TICKET-304)

### Écran mobile (`/(tabs)/passport`)

- **Activation** : onboarding émotionnel si pas de passport actif → `POST /passport/activate`
- **Carte premium** : photo, nom, ville, tier, numéro, QR placeholder (pas de scan réel), stats
- **Tampons locaux** : souvenirs territoriaux (`GET /passport/stamps` — visites + mémoires, récents d’abord)
- **Offres** : partenaires vérifiés (`GET /passport/offers`) + CTA « Utiliser » → redemption MVP

### Web (`/passport`)

Version minimaliste : même flux activation + carte + listes.

### Composants mobile (`apps/mobile/components/passport/`)

`passport-card`, `passport-tier-badge`, `passport-qr-placeholder`, `stamp-card`, `offer-card`, `empty-passport-state`

Labels : `packages/utils/src/stamp-labels.ts` · Intention : [`docs/ux/local-stamps-intent.md`](../docs/ux/local-stamps-intent.md)

### Hooks

| App | Fichiers |
|-----|----------|
| Mobile | `hooks/use-passport.ts`, `use-passport-stamps.ts`, `use-passport-offers.ts` |
| Web | idem sous `apps/web/hooks/` |

### Exclusions MVP frontend

- Scan QR live, géoloc, wallet, paiements, creator economy, animations lourdes
- Rate limit redemption : no-op si Redis absent côté API (surveiller avant pilote public)

Pas de React Query — hooks `useState` + `useEffect` (fetch simple).

### Onboarding

Si `onboarding_completed === false` : bandeau discret sur `/profile/me` (ville + ≥1 intérêt) — **pas de blocage** du reste de l’app.

### Demande organization

Champs : nom, type, ville, adresse, site, Instagram, description.

Après envoi :

> Votre demande est en cours de vérification par l'équipe Yunicity.

Pas d’auto-vérification ni publication publique.

### Sécurité frontend

- Refresh token jamais en `localStorage` (web cookie httpOnly, mobile SecureStore)
- 401 → refresh puis logout si échec
- Profil privé → UX 404 (le backend est source de vérité)
- UI hide ≠ authZ (admin non exposé)

## Partner leads admin (TICKET-207)

### Routes (app `admin`, port 3001)

| Route | Description |
|-------|-------------|
| `/partner-leads` | Liste CRM — filtres statut/source/ville, recherche nom/ville (client, max 100 lignes) |
| `/partner-leads/[id]` | Fiche lead — notes, tags, suivi, conversion |
| `/unauthorized` | Compte connecté sans droits staff |
| `/protected-admin` | Zone staff (même garde que CRM) |

### Permissions requises (TICKET-207B)

- **`moderation.manage`** ou **`system.admin`** — helpers `isStaffUser()` / `hasAnyPermission()` dans `apps/admin/lib/auth/staff-permissions.ts`
- Toutes les routes sous `(protected)/` : `ProtectedRoute` (session) puis `StaffRoute` (permissions)
- Non connecté → `/login` · connecté sans staff → `/unauthorized`
- Navigation CRM masquée si non-staff (`AdminShell`)
- `/protected-admin` et `/partner-leads` : **staff-only** (plus accessible au simple USER)

### API client

`packages/utils/src/partner-leads-api.ts` — `listPartnerLeads`, `getPartnerLead`, `updatePartnerLead`, `convertPartnerLead`.

Types : `PartnerLead`, `PartnerLeadStatus`, `PartnerLeadSource`, `ConvertLeadPayload`, `PartnerLeadUpdatePayload`.

### Workflow conversion

1. Ouvrir une fiche lead non convertie → **Convertir en organization**
2. Choisir **créer** (sans `organization_id`) ou **lier** (UUID organization existante)
3. Renseigner **`owner_user_id`** (UUID propriétaire — prérempli avec l’utilisateur connecté)
4. Rappel UI : l’organization reste **`pending`** / **`private`** jusqu’à validation modération

Import terrain : script backend `backend/scripts/import_partner_leads.py` (hors UI).

## Partner offers admin — Passport (TICKET-305)

### Routes (app `admin`)

| Route | Description |
|-------|-------------|
| `/passport-offers` | Liste — filtres statut, type, org ; recherche titre/org |
| `/passport-offers/new` | Création offre (org verified uniquement) |
| `/passport-offers/[id]` | Fiche — édition, activer / mettre en pause |

Même garde staff que CRM : `moderation.manage` ou `system.admin`.

### API client

`packages/utils/src/partner-offers-admin-api.ts` — `listVerifiedOrganizations`, `listOffers`, `getOffer`, `createOffer`, `updateOffer`, `activateOffer`, `deactivateOffer`.

Types : `PartnerOfferAdmin`, `PartnerOfferAdminCreatePayload`, `PartnerOfferAdminUpdatePayload` (`packages/types/src/admin_partner_offer.ts`).

### Workflow pilote

1. Organization **verified** (via conversion lead + modération)
2. Créer offre en brouillon → vérifier dates et limite redemption
3. **Activer** : offre `active` + organisation `public` → visible dans le Passport citoyen
4. Citoyens : `GET /passport/offers` + redemption MVP (TICKET-304)

### Exclusions MVP UI

- Upload image, pricing, coupons, QR scan staff, analytics
- Pas de React Query — hooks locaux

### Style & technique

- UI type Linear/Notion (badges, cartes, pas de CRUD gris)
- Pas de React Query — `useState` + `useEffect`
- États loading / error / empty obligatoires

## Structure

```
frontend/
├── apps/web/
├── apps/admin/
├── apps/mobile/
├── packages/types/     # auth, profile, organization, partner_lead
├── packages/utils/     # auth-client, profile-api, organization-api, partner-leads-api, partner-offers-admin-api
└── packages/ui/
```

## Prérequis

- Node.js ≥ 20
- pnpm 9
- Backend http://localhost:8000 (`docker compose up` à la racine)
- CORS backend : origines `3000`, `3001`, `19006` avec `credentials`

## Installation

```bash
cd frontend
pnpm install
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
cp apps/mobile/.env.example apps/mobile/.env
```

Variables publiques :

- `NEXT_PUBLIC_API_URL` (web + admin)
- `EXPO_PUBLIC_API_URL` (mobile)

## Commandes

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm test          # vitest — refresh-manager (@yunicity/utils)
pnpm build
pnpm validate
```

Par app :

```bash
pnpm --filter web dev
pnpm --filter admin dev
pnpm --filter mobile start
```

## URLs dev

| App | URL |
|-----|-----|
| Web | http://localhost:3000 |
| Admin | http://localhost:3001 |
| API | http://localhost:8000 |

## Tests

- **Unitaires** : `packages/utils` — `RefreshManager` (pas de boucle infinie, déduplication)
- **E2E** : TODO — Playwright web + Detox mobile (hors scope TICKET-105)

## Mobile / émulateur

### Expo SDK 54 (TICKET-306B — QA iPhone)

L’app `apps/mobile` cible **Expo SDK 54** pour être compatible avec **Expo Go** sur iPhone (SDK 54+ uniquement).

| Package | Version cible |
|---------|----------------|
| `expo` | ~54.0.34 |
| `react` / `react-dom` | 19.1.0 (mobile uniquement) |
| `react-native` | 0.81.5 |
| `expo-router` | ~6.0.23 |
| `expo-camera` | ~17.0.10 |
| `react-native-svg` | 15.12.1 |

**Monorepo** : overrides pnpm dans `frontend/package.json` — React 18 pour `web` / `admin`, React 19 pour `mobile`.

**Vérifications locales** :

```bash
cd frontend/apps/mobile
npx expo-doctor          # 1 avertissement Metro monorepo attendu (watchFolders)
pnpm --filter mobile typecheck
pnpm --filter mobile build
pnpm --filter mobile start   # scanner QR avec Expo Go iPhone
```

**Note** : `metro.config.js` inclut `watchFolders` vers la racine `frontend/` pour `@yunicity/types` et `@yunicity/utils` — expo-doctor peut signaler un écart vs le défaut Expo ; ne pas supprimer sans casser le monorepo.

`EXPO_PUBLIC_API_URL` : souvent `http://10.0.2.2:8000` (Android) ou **IP LAN du PC** pour iPhone physique (pas `localhost`).

## Partner offers self-service (TICKET-305B)

Espace partenaire autonome (workflow modéré 305A) :

| Surface | Routes |
|---------|--------|
| Mobile | `/(protected)/partner-offers` (hub, création, détail) |
| Admin web | `/partner-offers` (même UX, auth sans rôle staff) |
| Staff modération | `/passport-offers` (approve / reject / archive) |

API client : `yunicityApi.partnerOffers` / `PartnerOffersApi` → `/api/v1/organizations/me/offers`.

**Exclusions MVP** : analytics, QR, payouts, paiements, géoloc, CRM avancé.

### Push notifications mobile (TICKET-307)

| Élément | Détail |
|---------|--------|
| Packages | `expo-notifications`, `expo-device` |
| Code | `apps/mobile/lib/notifications.ts`, `hooks/use-push-notifications.ts` |
| UX | Section « Notifications Yunicity » sur l’onglet Profil (après login) |
| API | `yunicityApi.registerPushDevice` → `POST /api/v1/notifications/register-device` |

**Limitations MVP** : pas de Web Push ; permission demandée via CTA explicite (pas au cold start) ; Expo Go sur iPhone pour tester l’enregistrement du token (push réel souvent limité sans dev build).

**Test iPhone Expo Go** : profil → « Activer les notifications » → vérifier l’appel API et l’état « Activées » ; refus de permission → état « Permission refusée » sans crash.

Intention UX : [`docs/ux/partner-offers-intention.md`](../docs/ux/partner-offers-intention.md) (canon CTO) · [`docs/ai/ticket-305b-ux-intent.md`](../docs/ai/ticket-305b-ux-intent.md).

## Passport scan & redemption (TICKET-306)

| Surface | Routes | Rôle |
|---------|--------|------|
| Mobile citoyen | `/(protected)/passport/present` | QR plein écran (`getPassportQr`) |
| Mobile partenaire | `/(protected)/partner-scan/*` | Scan caméra (`expo-camera`) ou code manuel → offres → résultat |
| Admin web | `/partner-scan` | Fallback saisie manuelle (pas de caméra desktop avancée) |

API : `createScanApi` → `POST /scan/resolve`, `POST /scan/redeem` ; `getPassportQr` sur `passport-api.ts`. Messages humains : `scan-labels.ts` (`humanizeScanError`).

**Exclusions MVP** : offline, NFC, wallet, analytics scan, multi-batch, AI fraud, géofencing, POS — QR rotatif = V2.

Intention UX : [`docs/ux/passport-scan-redemption-intent.md`](../docs/ux/passport-scan-redemption-intent.md).

## Design system (agents IA — TICKET-3050)

Avant toute UI frontend importante (ex. **TICKET-305B** Partner Offers self-service) :

1. Lire [`docs/ai/frontend-design-system.md`](../docs/ai/frontend-design-system.md)
2. Rules Cursor/Claude : `14-frontend-design-system` (+ `07`, `08`)
3. Skills locaux (`.agents/skills/`) : `emil-design-eng`, `impeccable`, `design-taste-frontend` — voir [`docs/ai/skills.md`](../docs/ai/skills.md)

Positionnement : mobile-first, premium chaleureux, territorial — **pas** dashboard SaaS froid ni template marketing générique.

## Prochaines étapes

- TICKET métier (feed, orgs, …)
- E2E auth
- CI frontend
