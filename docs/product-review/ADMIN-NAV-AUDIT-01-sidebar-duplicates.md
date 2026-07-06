# ADMIN-NAV-AUDIT-01 — Sidebar Duplicate Partner/Staff Entries

**Phase BMAD :** ADMIN NAVIGATION AUDIT  
**Feature :** FEATURE-ADMIN-V1  
**Date :** 2026-06-09  
**Statut :** Audit uniquement — aucune modification produit

---

# Résumé

La sidebar admin (`admin-sidebar.tsx`, livrée avec ADMIN-UX-COCKPIT-02B) expose **deux incohérences de navigation** pour un utilisateur **staff** :

| Entrée sidebar | Href | Entrée « doublon » | Href | Nature du doublon |
|----------------|------|-------------------|------|-------------------|
| Valider un Passport | `/partner-scan` | Scanner Passport | `/partner-scan` | **Doublon strict** — même route, deux libellés |
| Mes offres pour la ville | `/partner-offers` | Offres | `/passport-offers` | **Ambiguïté** — routes différentes, rôles produit différents |

**Verdict court :**

1. **« Valider un Passport »** est un ancien libellé partenaire pointant vers la **même page** que « Scanner Passport ». Suppression sidebar recommandée pour les comptes staff ; conserver une seule entrée « Scanner Passport » (Terrain).
2. **« Mes offres pour la ville »** n’est **pas** un doublon technique de « Offres » : ce sont **deux produits distincts** (espace partenaire vs modération staff). En revanche, afficher les deux dans la sidebar **staff** crée une confusion UX. Masquer le bloc Partenaire pour `staff === true` est cohérent.

---

# Routes analysées

| Libellé sidebar | Route Next.js | Layout / garde | API principale |
|-----------------|---------------|----------------|----------------|
| Valider un Passport | `/partner-scan` | `(protected)` → `ProtectedRoute` (auth seule) | `POST /api/v1/scan/resolve`, `POST /api/v1/scan/redeem` |
| Scanner Passport | `/partner-scan` | idem | idem |
| Mes offres pour la ville | `/partner-offers` (+ `/new`, `/[id]`) | `(protected)` → auth seule | `GET /organizations/me/offers`, CRUD org offers |
| Offres | `/passport-offers` (+ `/new`, `/[id]`) | `(protected)/passport-offers` → **`StaffRoute`** | `GET /api/v1/admin/partner-offers`, actions staff |

---

# Valider un Passport

## Identification

| Champ | Valeur |
|-------|--------|
| **Href** | `/partner-scan` |
| **Fichier page** | `frontend/apps/admin/app/(protected)/partner-scan/page.tsx` |
| **Composant** | `AdminPartnerScanPage` (inline, client) |
| **Titre H2 page** | « Valider un Passport » |
| **API** | `scanApi.resolvePassport({ qr_secret })`, `scanApi.redeemOffer({ offer_id, qr_secret })` |
| **Backend** | `ScanRedemptionService.resolve_for_partner` / `redeem_for_partner` |
| **Permissions API** | Utilisateur authentifié + appartenance org avec lieux gérés (`list_managed_organization_ids`) ; sinon `403 SCAN_PARTNER_FORBIDDEN` |
| **StaffRoute** | Non — accessible à tout utilisateur authentifié |

## Rôle métier réel

Flow **terrain partenaire** : saisie manuelle du code QR Passport, résolution citoyen, validation (redemption) d’une offre publiée du partenaire.

Copy page : *« Saisie manuelle du code — pour le scan caméra, utilise l'app mobile partenaire. »*

## Réponses aux questions

| Question | Réponse |
|----------|---------|
| Ancien nom de « Scanner Passport » ? | **Oui, fonctionnellement.** Même route, même page. Le libellé « Valider un Passport » est le titre historique de la page ; « Scanner Passport » est le libellé staff introduit dans la refonte sidebar 02B (groupe Terrain) et dans le cockpit (actions rapides). |
| Page différente ? | **Non.** |
| Encore utile ? | **La page oui** ; **l’entrée sidebar dupliquée non** pour un staff. |
| Utilisée ailleurs ? | Oui : cockpit `cockpit-quick-actions` → `/partner-scan` (« Scanner Passport »), `passport-ops-header` → lien « Scanner Passport », `cockpit-passport-snapshot` (orphelin) → `/partner-scan`. Mobile : hub `partner-scan/*` (scan caméra + manuel). |

---

# Scanner Passport

## Identification

| Champ | Valeur |
|-------|--------|
| **Href** | `/partner-scan` (identique) |
| **Page / composant** | Identiques à ci-dessus |
| **Titre shell** | `admin-shell.tsx` → « Scanner Passport » quand `pathname.startsWith("/partner-scan")` |
| **Groupe sidebar** | TERRAIN (staff uniquement) |
| **Icône** | `QrCode` (lucide) |

## Rôle métier réel

Entrée **staff / terrain** pour accéder au scan QR / validation Passport depuis le backoffice (saisie manuelle web). Alignée avec QA-04 (lien depuis Passport Ops).

## Réponses aux questions

| Question | Réponse |
|----------|---------|
| Route officielle staff pour scan ? | **Oui**, pour la surface **admin web** (saisie manuelle). Le scan caméra officiel reste **mobile** (`apps/mobile/.../partner-scan/scan`). |
| Suffisante pour remplacer « Valider un Passport » ? | **Oui** — même destination ; le libellé « Scanner Passport » est plus cohérent avec Passport Ops, le cockpit et le titre shell. |

---

# Mes offres pour la ville

## Identification

| Champ | Valeur |
|-------|--------|
| **Href** | `/partner-offers` |
| **Fichier page** | `frontend/apps/admin/app/(protected)/partner-offers/page.tsx` |
| **Composant** | `PartnerOffersHubPage` |
| **Hooks** | `usePartnerOrganizations`, `usePartnerOffersList` |
| **API** | `organizationApi.listMyOrganizations()`, `partnerOffersApi.listOffers()` → `/organizations/me/offers` |
| **Permissions** | Auth + rôle org `owner`/`admin` + org `verified` (`listOfferManageableOrganizations`) |
| **StaffRoute** | Non |
| **Titre page** | « Tes offres pour la ville » (ton 2e personne partenaire) |

## Rôle métier réel

**Hub partenaire** : créer, lister et soumettre **ses** offres en tant que membre d’organisation. Flow émotionnel « contribution locale » (cf. `docs/ux/partner-offers-intention.md`).

Surfaces prévues :

- Mobile : `apps/mobile/.../partner-offers/*`
- Web partenaire admin : `apps/admin/.../partner-offers/*`
- Web citoyen partenaire (parallèle) : `apps/web/.../organizations/me/partner/offers`

## Réponses aux questions

| Question | Réponse |
|----------|---------|
| Page partenaire ? | **Oui.** |
| Ancienne page admin staff ? | **Non.** Ce n’est pas la file de modération. |
| Cohérent dans backoffice staff ? | **Partiellement.** Architecture **dual-host** volontaire (admin héberge aussi le portail partenaire), mais **copy et placement sidebar** ne sont pas adaptés à un opérateur staff. |
| Utilisée ailleurs ? | `/unauthorized` → lien « Espace partenaire » → `/partner-offers` ; login non-staff redirige vers `/unauthorized` (pas cockpit). |

---

# Offres

## Identification

| Champ | Valeur |
|-------|--------|
| **Href** | `/passport-offers` |
| **Fichier page** | `frontend/apps/admin/app/(protected)/passport-offers/page.tsx` |
| **Composant** | `PassportOffersWorkspace` |
| **Hooks** | `useAdminOffersList` → `partnerOffersAdminApi` |
| **API** | `GET /api/v1/admin/partner-offers`, approve/reject/archive, redemptions, actions audit |
| **Permissions** | **`StaffRoute`** : `moderation.manage` ou `system.admin` |
| **Titre** | « Passport Offers » — Gestion et modération des offres partenaires |
| **Groupe sidebar** | MODÉRATION |

## Rôle métier réel

**File staff** : modération globale des offres partenaires (toutes orgs, filtres statut, création staff, audit). C’est la surface référencée par le cockpit (attention, actions rapides, Signal).

## Réponses aux questions

| Question | Réponse |
|----------|---------|
| Vraie file staff modération ? | **Oui.** |
| Page à conserver dans sidebar admin staff ? | **Oui** — entrée canonique « Offres » sous Modération. |

---

# Permissions

| Zone | Garde frontend | Permission effective |
|------|----------------|----------------------|
| `(protected)/*` parent | `ProtectedRoute` | Session authentifiée |
| `/passport-offers/*` | `StaffRoute` | `moderation.manage` \| `system.admin` |
| `/partner-scan` | Aucun `StaffRoute` | Auth + **membership partenaire** côté API scan |
| `/partner-offers` | Aucun `StaffRoute` | Auth + **org owner/admin verified** pour créer/lister ses offres |

**Login admin** (`login/page.tsx`) : staff → `/` ; non-staff → `/unauthorized`.

**Conséquence :** un compte staff **sans** membership partenaire peut ouvrir `/partner-scan` et `/partner-offers` dans l’UI, mais l’API scan renverra 403 ; partner-offers affichera empty / panneau accès sans orgs gérables.

---

# Usage produit

## Architecture dual-host (admin)

Documenté dans `docs/ux/partner-offers-intention.md` :

| Surface | Route admin |
|---------|-------------|
| Web partenaire | `/partner-offers` |
| Modération staff | `/passport-offers` |

L’app admin sert **à la fois** de backoffice staff et d’hôte léger du portail partenaire web (en parallèle du portail `apps/web/organizations/me/partner`).

## Sidebar actuelle (staff connecté)

```
PARTENAIRE          ← visible pour TOUS les utilisateurs authentifiés dans la sidebar
  Valider un Passport    → /partner-scan
  Mes offres pour la ville → /partner-offers

PILOTAGE
  Cockpit, Partenaires, Passport Ops

MODÉRATION
  Offres                 → /passport-offers   ← file staff
  Événements, Contenus, Modération

TERRAIN
  Scanner Passport       → /partner-scan      ← DOUBLON href avec Partenaire
  Staff
```

## Risque UX actuel

1. **Double entrée scan** : l’utilisateur staff croit à deux fonctions ; c’est la même page.
2. **Offres vs Mes offres** : confusion entre « mes offres en tant que partenaire » et « toutes les offres à modérer ».
3. **Groupe Partenaire visible pour staff** : brouille la frontière « centre de pilotage territorial » vs « espace commerçant ».
4. **Mobile nav** : en `< md`, tous les liens (partenaire + staff) sont aplatis en chips — doublons encore plus visibles.

---

# Risques

| Risque | Si on supprime seulement « Valider un Passport » | Si on supprime aussi « Mes offres pour la ville » (staff) |
|--------|--------------------------------------------------|----------------------------------------------------------|
| Staff perd accès scan | Faible — « Scanner Passport » reste | N/A |
| Staff partenaire dual-role perd hub offres perso | N/A | Moyen — accès direct `/partner-offers` ou portail web/mobile toujours possible |
| Partenaire non-staff perd navigation | N/A si masquage conditionnel `staff` | **Critique** si masquage global — ne pas retirer PARTNER_NAV pour `!staff` |
| Régression liens internes | Faible | Faible — cockpit / unauthorized inchangés |
| Dette nommage page scan | Le H2 reste « Valider un Passport » alors que nav dit « Scanner Passport » | Hors scope sidebar — microcopy page optionnel |

---

# Recommandation CTO

## Décision : **Option B adaptée**

> Retirer le **groupe Partenaire entier de la sidebar lorsque `staff === true`**  
> (équivaut à retirer « Valider un Passport » **et** « Mes offres pour la ville » pour les opérateurs staff).

**Conserver** le groupe Partenaire **uniquement** pour les utilisateurs **non-staff** authentifiés (parcours `/unauthorized` → espace partenaire).

### Justification

| Entrée | Action staff | Raison |
|--------|--------------|--------|
| Valider un Passport | **Retirer** (si staff) | Doublon strict de `/partner-scan` |
| Scanner Passport | **Conserver** (Terrain) | Entrée canonique staff + cockpit |
| Mes offres pour la ville | **Retirer** (si staff) | Page partenaire, pas modération ; « Offres » suffit |
| Offres | **Conserver** (Modération) | File staff officielle |

### Options écartées

| Option | Verdict |
|--------|---------|
| **A** — Retirer seulement « Valider un Passport » | Insuffisant : ambiguïté Offres / Mes offres persiste pour staff |
| **C** — Renommer / déplacer | Utile en phase 2 (aligner H2 page scan sur « Scanner Passport ») mais ne résout pas le dual-host sidebar |
| **D** — Tout conserver | Rejeté — incohérence validée par le CTO, fatigue navigation |

### Groupe Partenaire — légitimité

- **Légitime** dans l’app admin pour les **comptes partenaires** (non-staff) qui n’ont pas accès au cockpit.
- **Non légitime en sidebar staff** au même niveau que Pilotage / Modération : ces flows vivent plutôt dans le **portail partenaire** (web `organizations/me/partner` ou mobile), l’admin staff devant rester un **centre de commandement**.

---

# Plan de correction proposé

**Ticket suggéré :** `ADMIN-NAV-FIX-01` (BUILD, scope minimal)

1. **`admin-sidebar.tsx`**
   - Rendre le bloc `PARTENAIRE` conditionnel : `{!staff && (...)}` 
   - Ou : `{staff ? null : <PartnerNavBlock />}`
   - Vérifier variante **mobile** (`variant="mobile"`) : ne pas dupliquer `/partner-scan` pour staff.

2. **`admin-shell.tsx`**
   - Aucun changement obligatoire (titres déjà cohérents).

3. **Optionnel (microcopy, ticket séparé)**
   - Harmoniser H2 `partner-scan/page.tsx` : « Scanner Passport » vs « Valider un Passport ».
   - Carte ville cockpit : « Gérer les partenaires en attendant → » (feedback CTO 02B).

4. **Tests**
   - Test unitaire ou snapshot : sidebar staff ne contient pas `PARTNER_NAV` labels.
   - Test : utilisateur non-staff voit toujours `PARTNER_NAV`.

5. **Non régression**
   - Ne pas toucher au cockpit validé (sauf si lien explicite vers `/partner-offers` partenaire — aucun aujourd’hui).
   - Ne pas fusionner `/partner-offers` et `/passport-offers` (routes et APIs distinctes).

---

# Références code

- `frontend/apps/admin/components/admin-sidebar.tsx` — `PARTNER_NAV`, `STAFF_NAV_GROUPS`
- `frontend/apps/admin/components/admin-shell.tsx` — `homeHref`, `staffPageTitle`
- `frontend/apps/admin/app/(protected)/partner-scan/page.tsx`
- `frontend/apps/admin/app/(protected)/partner-offers/page.tsx`
- `frontend/apps/admin/app/(protected)/passport-offers/layout.tsx`
- `docs/ux/partner-offers-intention.md` — séparation surfaces partenaire / staff
- `backend/app/api/v1/scan.py` — API scan partenaire
- `backend/app/api/v1/admin_partner_offers.py` — API modération staff

---

*Audit réalisé sans modification de code produit. Aucun commit associé.*
