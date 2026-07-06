# WEB-PARTNERS-08 — Pilot Readiness Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` or `subagent-driven-development` task-by-task. Checkboxes track progress.  
> **Spec:** [`docs/superpowers/specs/2026-06-01-web-partners-08-pilot-readiness-design.md`](../specs/2026-06-01-web-partners-08-pilot-readiness-design.md)  
> **Audit:** [`docs/product-review/WEB-PARTNERS-REVIEW-01.md`](../../product-review/WEB-PARTNERS-REVIEW-01.md)

**Goal:** Rendre les 4 partenaires pilotes Reims exploitables bout-en-bout (données, Passport, self-service web, recette Belga).

**Architecture:** Extension seeds idempotents + routes API alignées + portail partenaire web sous `/organizations/me/partner` + modération admin creator content. Pas de migration schéma sauf si découverte bloquante en BUILD.

**Tech stack:** FastAPI, SQLAlchemy 2 async, Alembic (si besoin), Next.js web, admin app, `@yunicity/types` + `@yunicity/utils`, pytest, vitest.

---

## Ordre d’exécution & dépendances

```text
08A (data + seeds + feed sync + comptes)
  ↓
08B (offers seed + API catalog + QR UI + passport visibility)  ← dépend 08A memberships pour QR
  ↓
08C (self-service web + admin modération creator)                 ← dépend 08A + 08B QR/offers patterns
  ↓
08D (checklist recette + smoke QA + doc)                          ← validation transverse
```

| Phase | Peut démarrer sans | Bloque |
|-------|-------------------|--------|
| **08A** | — | 08B, 08C, 08D |
| **08B** | 08A merge (memberships pour QR E2E) | 08D scénario tampon/offres |
| **08C** | 08A merge ; 08B recommandé (hub Passport) | 08D scénario création contenu |
| **08D** | BUILD 08A–C en recette | Clôture sprint 08 |

---

## Stratégie PR

| PR | Branche suggérée | Contenu | Estimation review |
|----|------------------|---------|-------------------|
| **PR-1 — 08A** | `feature/web-partners-08a-pilot-data` | Seeds données + memberships + feed sync events | M |
| **PR-2 — 08B** | `feature/web-partners-08b-passport-readiness` | `reims_partner_offers`, router catalog, fix fetchPublic, QR web UI | M |
| **PR-3 — 08C** | `feature/web-partners-08c-partner-self-service` | Portail web + APIs TS + admin modération creator | L |
| **PR-4 — 08D** | `docs/web-partners-08d-pilot-checklist` | Checklist recette + ajustements QA mineurs | S |

**Base de chaque PR :** `main` à jour après merge précédente.

**CI attendue par PR :** backend pytest ciblé + frontend typecheck ; ne pas élargir chore mypy global hors fichiers touchés.

---

# Phase 08A — Partner Data Completion

## File map

| File | Action |
|------|--------|
| `backend/app/db/seeds/reims_signed_partners.py` | Enrichir 4 pilotes : address, postal_code, lat, lon, phone, website, social_links, logo_url, banner_url |
| `backend/app/db/seeds/reims_pilot_partner_memberships.py` | **New** — users + OrganizationMember OWNER |
| `backend/app/db/seeds/reims_partner_events.py` | Appeler `FeedEventSyncService` après upsert |
| `backend/app/db/seeds/__main__.py` | `--pilot` flag + call memberships |
| `docs/recette/partner-pilot-accounts.md` | **New** — comptes recette |
| `backend/tests/test_pilot_partner_seed.py` | **New** — smoke seed : coords, membership |

## Task 08A-1 : Matrice données pilotes

- [ ] Obtenir validation métier des 4 adresses + URLs (ticket ou commentaire PR).
- [ ] Renseigner tableau dans PR description (slug → address, lat, lon, phone, website, instagram).

## Task 08A-2 : Enrichir `reims_signed_partners.py`

- [ ] Ajouter champs optionnels aux entrées UUID `...000009` (Belga), `...011` (Pittaya), `...012` (CDR), `...014` (Garçon).
- [ ] `_SYNC_ORG_FIELDS` inclut déjà les champs — vérifier upsert sync logo/banner/coords.
- [ ] Test : `GET /api/v1/partners/belga-queen?city=Reims` → lat/lon non null.

## Task 08A-3 : Seed memberships `--pilot`

- [ ] Créer `reims_pilot_partner_memberships.py` avec UUID stables users.
- [ ] Emails : `belga-queen@partner.yunicity.dev`, `pittaya@partner.yunicity.dev`, etc.
- [ ] `_assert_pilot_seed_allowed(settings)` — même garde que `--demo` (dev/recette only).
- [ ] Mot de passe : documenter dans `docs/recette/partner-pilot-accounts.md` (ex. rotation recette) — **ne pas** committer mot de passe en clair si politique repo l’interdit ; utiliser variable `PILOT_PARTNER_PASSWORD` en recette.

## Task 08A-4 : Feed sync events seed

- [ ] Importer `FeedEventSyncService` dans `reims_partner_events.py`.
- [ ] Après create/update event : `await FeedEventSyncService(session).upsert_event_post(event, org)`.
- [ ] Test intégration : après seed, feed contient post type `event` lié org Belga (ou count ≥ 1).

## Task 08A-5 : Tests & doc

- [ ] `test_pilot_partner_seed.py` : seed partners + pilot → membership exists.
- [ ] Mettre à jour `backend/README.md` section seeds (`--pilot`).

### Critères d’acceptation 08A

- [ ] `python -m app.db.seeds` puis `--pilot` sur DB recette : 4 pins map, 4 adresses API.
- [ ] Login Belga → `GET /organizations/me` inclut org Belga Queen.
- [ ] PR review : tableau adresses validé.

### Risques 08A

| Risque | Mitigation |
|--------|------------|
| Coords fausses | Source métier dans PR |
| Fuite credentials | Env recette + doc |

---

# Phase 08B — Passport Readiness

## File map

| File | Action |
|------|--------|
| `backend/app/db/seeds/reims_partner_offers.py` | **New** — offres published (slugs tests) |
| `backend/app/db/seeds/__main__.py` | `seed_reims_partner_offers` après signed partners |
| `backend/app/api/v1/partner_offers_public.py` | **New ou restore** — `GET ""` prefix `/partner-offers` |
| `backend/app/api/v1/router.py` | `include_router(partner_offers_public.router)` |
| `frontend/packages/utils/src/partners-api.ts` | Fix `fetchPublicPartnerOffers` URL |
| `frontend/apps/web/app/organizations/me/partner/passport/page.tsx` | **New** — QR UI |
| `frontend/packages/utils/src/partner-passport-api.ts` | **New** |
| `backend/tests/test_partner_offers_api.py` | Vert après seed file |

## Task 08B-1 : Seed `reims_partner_offers.py`

- [ ] UUID stables alignés tests (`d6043000-...` si déjà référencés).
- [ ] Minimum :
  - `belga-queen-accueil-passport` — published, active
  - `pittaya-avantage-passport` — published, active
  - Offres CDR + Garçon (1 chacun)
- [ ] `organization_id` = UUIDs seed partners.
- [ ] Idempotent comme `reims_partner_events.py`.

## Task 08B-2 : Route catalogue public

- [ ] Implémenter `PublicPartnerOfferService.list_catalog` sur router `/partner-offers`.
- [ ] Vérifier filtres : `city`, `partner_slug`, `featured`, expiry, `is_active`.
- [ ] Monter dans `router.py`.

## Task 08B-3 : Alignement frontend

- [ ] `fetchPublicPartnerOffers` → `/api/v1/partner-offers?...`
- [ ] Vérifier `partner-detail-screen` : offres filtrées OK.
- [ ] Vérifier ancres `buildPartnerOfferHref` sur fiche.

## Task 08B-4 : UI QR tampon (web)

- [ ] Page `/organizations/me/partner/passport` :
  - Sélecteur org (si plusieurs)
  - CTA « Générer un QR tampon »
  - Appel `POST /api/v1/partners/{slug}/passport-qr`
  - Affichage QR (lib existante ou `qrcode.react` si déjà en deps — vérifier bundle)
  - Copier lien `/passport/stamp/claim?token=...`
  - Afficher `expires_at`
- [ ] Copy FR : tampon vs scan offre (lien vers doc ou mobile scan).

## Task 08B-5 : Tests

- [ ] `test_partner_offers_api.py` — full green.
- [ ] `test_passport_stamp_qr.py` — non-régression.
- [ ] Test manuel recette : claim page web.

### Critères d’acceptation 08B

- [ ] Catalogue offres non vide pour Reims après seed.
- [ ] Belga : QR généré par compte pilote ; citoyen claim → tampon.
- [ ] Passport dashboard : offres pilotes visibles.

### Risques 08B

| Risque | Mitigation |
|--------|------------|
| Router duplicate offers | Un seul catalogue public |
| QR lib bundle | Lazy load composant |

---

# Phase 08C — Self-Service Partner

## File map

### Backend (minimal)

| File | Action |
|------|--------|
| — | Aucune route nouvelle attendue ; vérifier gates ACTIVE |

### Frontend web

| File | Action |
|------|--------|
| `frontend/apps/web/app/organizations/me/partner/page.tsx` | Hub |
| `frontend/apps/web/app/organizations/me/partner/offers/...` | Liste + new + [id] — adapter depuis admin |
| `frontend/apps/web/app/organizations/me/partner/events/...` | Liste + new + [id] |
| `frontend/apps/web/app/organizations/me/partner/creator-content/...` | Liste + new + [id] |
| `frontend/packages/utils/src/organization-events-api.ts` | **New** |
| `frontend/packages/utils/src/organization-creator-content-api.ts` | **New** |
| `frontend/packages/utils/src/yunicity-api.ts` | Wire APIs |

### Admin

| File | Action |
|------|--------|
| `frontend/apps/admin/app/(protected)/partner-creator-content/page.tsx` | **New** liste |
| `frontend/apps/admin/app/(protected)/partner-creator-content/[id]/page.tsx` | **New** détail + approve/reject |
| `frontend/apps/admin/lib/hooks/use-partner-creator-content.ts` | **New** |

## Task 08C-1 : API clients TS

- [ ] `organization-events-api.ts` : list, create, update, submit.
- [ ] `organization-creator-content-api.ts` : list, create, update, submit.
- [ ] Tests vitest mocks (pattern `partner-offers-api`).

## Task 08C-2 : Hub partenaire web

- [ ] `/organizations/me/partner` :
  - Carte org (nom, slug, lien fiche publique)
  - Checklist readiness : données complètes / offre publiée / contenu publié / QR testé
  - Liens vers sous-sections
- [ ] Lien depuis `/organizations/me` existant.

## Task 08C-3 : Offres web (parity admin)

- [ ] Réutiliser composants admin : `PartnerFlashFields`, labels `partner-portal-labels`.
- [ ] Flow : create → optional submit → statut humain.
- [ ] Empty state chaleureux.

## Task 08C-4 : Événements web

- [ ] Liste `GET /organizations/me/events?organization_id=`
- [ ] Formulaire création : title, description, dates, location (champs `LocalEventCreateRequest`)
- [ ] Submit for review → badge « En revue »
- [ ] Message si partner `signed` bloqué (403) — copy clair.

## Task 08C-5 : Creator content web

- [ ] Liste + filtres statut
- [ ] Create/edit : title, body, media_url (URL pour 08 — pas upload fichier sauf scope élargi)
- [ ] Submit → pending

## Task 08C-6 : Admin modération creator

- [ ] Liste pending (staff permission)
- [ ] Approve → vérifie feed sync (post `partner_creator` actif)
- [ ] Reject avec raison

## Task 08C-7 : Tests

- [ ] Vitest utils + smoke composants critiques.
- [ ] Backend : réutiliser `test_partner_creator_content_api.py` — non-régression.

### Critères d’acceptation 08C

- [ ] Belga : créer creator → admin approve → visible feed + fiche sans curl.
- [ ] Belga : créer event → admin approve → visible agenda + fiche.
- [ ] Belga : créer offre → admin approve → Passport + fiche.
- [ ] Hub : statuts cohérents.

### Risques 08C

| Risque | Mitigation |
|--------|------------|
| Scope UI trop large | MVP champs minimum ; pas upload |
| Duplication admin/web | Extraire composants partagés `packages/ui` si temps — sinon copy contrôlée |

---

# Phase 08D — Pilot Verification

## File map

| File | Action |
|------|--------|
| `docs/recette/web-partners-08-pilot-checklist.md` | **New** — checklist QA |
| `docs/recette/partner-pilot-accounts.md` | Compléter si 08A incomplet |

## Task 08D-1 : Checklist recette

- [ ] Section par pilote (smoke).
- [ ] Section scénario Belga E2E (table spec §08D).
- [ ] Prérequis : `alembic upgrade head`, `python -m app.db.seeds`, `--pilot`.
- [ ] Comptes : citoyen démo + 4 partenaires + staff admin.

## Task 08D-2 : Exécution recette

- [ ] Exécuter checklist sur env recette.
- [ ] Logger écarts dans issue ou section « Known gaps » du checklist.

## Task 08D-3 : Critères sortie sprint

- [ ] Tous P0 checklist cochés pour Belga.
- [ ] Smoke 3 autres pilotes.
- [ ] REVIEW-01 P0 items fermés ou explicitement reportés avec ticket.

### Checklist QA (extrait — détail dans doc recette)

**Belga Queen E2E**

- [ ] Login partenaire Belga
- [ ] Fiche `/places/belga-queen` : adresse, image, pas d’alerte carte
- [ ] Map : pin Belga
- [ ] Créer creator content → submit
- [ ] Admin approve creator
- [ ] Feed : post partenaire visible
- [ ] Offre Passport visible (seed ou créée)
- [ ] Générer QR tampon
- [ ] Citoyen claim → tampon sur `/passport`
- [ ] Événement visible (seed ou créé)

**Smoke Pittaya / CDR / Garçon**

- [ ] Fiche + pin + offre + QR claim OK

---

## Risques transverses

| ID | Risque | Probabilité | Impact | Mitigation |
|----|--------|-------------|--------|------------|
| R1 | PR-3 trop volumineuse | Haute | Review lente | Découper 08C en PR-3a events+creator API, PR-3b UI si nécessaire |
| R2 | Assets indisponibles | Moyenne | Fiches fades | Fallback `resolvePartnerImage` + ticket assets |
| R3 | CI backend rouge | Haute | Merge bloqué | Fix minimal fichiers touchés ; chore séparée |
| R4 | Staff absent en recette | Moyenne | 08D bloqué | Compte staff seed documenté |

---

## Critères d’acceptation globaux (sprint 08)

1. **Exister** — org ACTIVE, données contact/geo, comptes membres.
2. **Être visible** — `/places`, `/map` pins, featured si applicable.
3. **Publier** — self-service web events + creator + offres avec modération.
4. **Tampons** — QR généré + claim citoyen.
5. **Offres Passport** — catalogue seed + redemption path documenté.
6. **Écosystème** — feed + fiche + Passport cohérents pour Belga E2E.

---

## Estimation relative

| Phase | Effort |
|-------|--------|
| 08A | S–M |
| 08B | M |
| 08C | L |
| 08D | S |

---

## Conclusion CTO — découpage PR

### **B) WEB-PARTNERS-08 doit être découpé en 08A → 08D (4 PRs)**

**Justification :**

1. **Surfaces disjointes** — seeds/backend (08A), Passport/API/QR (08B), gros portail web + admin (08C), QA/docs (08D) : une PR unique mélange zones rouges (comptes, QR, modération) et rend la review impraticable.
2. **Valeur incrémentale** — après PR-1, les pilotes sont **déjà visibles** sur carte et fiche ; PR-2 débloque Passport ; PR-3 le self-service ; PR-4 valide sans bloquer le merge technique.
3. **Alignement REVIEW-01** — la dette était structurée en P0 data → P1 UI → 07 distribution ; le découpage PR suit cette priorité.
4. **CI & rollback** — un échec sur le portail web (08C) ne doit pas rollback les seeds données (08A) déjà en recette.
5. **Option de fusion** — **08A + 08B** peuvent être fusionnées en une seule PR **si** l’équipe veut 3 PRs au lieu de 4 ; **ne pas** fusionner 08C avec le reste.

**Une seule PR (option A)** n’est recommandée que si contrainte process forte (freeze branches) **et** équipe 2+ reviewers dédiés pendant 2–3 jours.

---

## Prochaines étapes après 08

1. Exécuter PR-1 → PR-4 sur `main`.
2. Recette checklist 08D sur environnement Reims.
3. **MEASURE** : métriques spec §9.
4. **DECIDE** : rouvrir WEB-PARTNERS-07 uniquement si critères sortie 08 validés.

---

*Plan DESIGN uniquement — aucun code dans ce ticket.*
