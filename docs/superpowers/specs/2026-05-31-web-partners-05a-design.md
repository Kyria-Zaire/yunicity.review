# WEB-PARTNERS-05A — Partner Event Foundation

**Date**: 2026-05-31
**Sprint**: WEB PARTNERS ECOSYSTEM
**Phase**: DESIGN → BUILD
**Status**: APPROVED

---

## Context

WEB-PARTNERS-01/02/03/04A are complete. The next step is linking LocalEvents to partner organizations so events can be attributed to Belga Queen, Pittaya, Centre des Ressources, or Garçon Barbiers.

This ticket is the **backend/data foundation only**. UI integration across /events, /map, /places comes in WEB-PARTNERS-05B.

---

## Key Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Partner org fields on event schema | Nested in `LocalEventOrganizationSummary` (Option A) | Consistent with existing `event.organization` pattern; cleaner than flat root fields |
| Partner creation enforcement | Blocage total 403 pour `signed`/`paused` (Option A) | Pas d'events orphelins en pending; activation partenaire = prérequis business |
| Architecture | Extension minimale du système existant (Approach 1) | `organization_id` FK déjà présent; pas de service dédié inutile |

---

## Scope

### In scope

- Enrich `LocalEventOrganizationSummary` with `is_partner` and `partner_status`
- Add partner status gate in `LocalEventService.create_for_organization`
- Add `organization_slug` filter to `GET /events`
- New endpoint `GET /api/v1/partners/{slug}/events`
- New service method `LocalEventService.list_for_partner`
- Seed `reims_partner_events.py` — 4 pilot partner events
- Frontend types extension (`LocalEventOrganization`)
- Frontend utils: `eventOrganizerLabel`, `eventIsPartnerEvent`, `eventPartnerBadgeLabel`, `buildPartnerEventsUrl`
- Backend tests `test_partner_events_api.py` — 10 tests

### Explicitly excluded

- UI refactoring of /events, /map, /places (→ WEB-PARTNERS-05B)
- Passport notifications on partner events
- Event recommendations in Passport
- Feed promotion
- Ticket sales / fake popularity
- `partner_profile_id` on `LocalEvent` (org → partner_profile via existing relation)

---

## Data Model

**No migration needed.** `organization_id FK nullable`, `ix_local_events_organization_id` index, and `organization: Mapped[Organization | None]` relationship already exist in `backend/app/models/local_event.py`.

The only code change is enriching the Pydantic schema and adding a `partner_profiles` join when building the org summary.

---

## Schema changes

### `LocalEventOrganizationSummary` (in `backend/app/schemas/local_event.py`)

Add two fields:

```python
class LocalEventOrganizationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    slug: str
    name: str
    city: str
    logo_url: str | None = None
    is_verified: bool = False
    is_partner: bool = False              # new — True if org has active partner_profile
    partner_status: str | None = None     # new — PartnerStatus value or None
    # NEVER exposed: contact_email, contact_phone, contract_reference, notes_internal
```

### `_to_response` in `LocalEventService`

Update to load `PartnerProfile` via `PartnerRepository.get_by_organization_id()` when building the org summary:

```python
is_partner = False
partner_status_val = None
if org is not None:
    profile = await self._partners.get_by_organization_id(org.id)
    if profile is not None:
        status = (
            profile.partner_status
            if isinstance(profile.partner_status, PartnerStatus)
            else PartnerStatus(profile.partner_status)
        )
        is_partner = status in PUBLIC_PARTNER_STATUSES
        partner_status_val = status.value
```

This adds one query per event response. Acceptable for MVP — batch loading optimization goes in a future ticket if N+1 becomes a concern.

---

## Partner Status Gate

### In `LocalEventService.create_for_organization`

After `require_offer_manager`, before creating the event:

```python
profile = await PartnerRepository(self._session).get_by_organization_id(payload.organization_id)
if profile is not None:
    status = (
        profile.partner_status
        if isinstance(profile.partner_status, PartnerStatus)
        else PartnerStatus(profile.partner_status)
    )
    if status not in PUBLIC_PARTNER_STATUSES:
        raise AppError(
            status_code=403,
            code="PARTNER_NOT_ACTIVE",
            detail="Ce partenaire n'est pas actif. Statut requis : active, premium ou founding_partner.",
        )
```

`PUBLIC_PARTNER_STATUSES = {active, premium, founding_partner}` is already defined in `app.core.partner_constants`.

Organizations without a `partner_profile` are unaffected — the check only fires when a profile exists.

---

## Endpoints

### `GET /api/v1/events` — add `organization_slug` filter

Add optional query parameter `organization_slug`. When provided, joins `local_events.organization_id = organizations.id WHERE organizations.slug = :slug`.

If the org slug is unknown, returns `[]` (not 404 — the endpoint is a list, not a resource).

Existing parameters (`city`, `page`, `page_size`) are unchanged.

### `GET /api/v1/events/{id}` — no route changes

`_to_response` enrichment propagates automatically.

### `GET /api/v1/partners/{slug}/events` — new endpoint

Added to `backend/app/api/v1/partners.py`.

**Flow:**
1. Load partner profile by slug + city — if not found or `partner_status ∈ {signed, paused}` → 404
2. Call `LocalEventService.list_for_partner(organization_id, upcoming_only, limit, offset)`
3. Return `LocalEventListResponse`

**Parameters:**
- `city: str` (default "Reims")
- `upcoming_only: bool` (default True)
- `limit: int` (default 20, max 50)
- `offset: int` (default 0)

**Responses:**
- `200 []` if partner has no events
- `200 [...]` with public-safe event data
- `404` if partner not found or signed/paused

### `LocalEventService.list_for_partner`

New method on `LocalEventService`:

```python
async def list_for_partner(
    self,
    organization_id: UUID,
    *,
    upcoming_only: bool,
    limit: int,
    offset: int,
) -> LocalEventListResponse:
```

Delegates to `LocalEventRepository.list_for_organization(...)` with upcoming filter if `upcoming_only=True`.

---

## Seed — `backend/app/db/seeds/reims_partner_events.py`

4 pilot events, one per active partner. All idempotent (upsert by fixed UUID).

**Common properties:**
- `event_type = "partner_event"` (canonical value from `LocalEventType.PARTNER_EVENT`)
- `starts_at = datetime.now(UTC) + timedelta(days=14)` — computed at seed run time
- `moderation_status = "approved"` — partner orgs are verified, auto-approved
- `visibility = "public"`
- Description template: `"Un événement pilote organisé dans le cadre du réseau partenaire Yunicity. Modalités confirmées sur place."` — honest, no fake details
- No fake participant count, no fake ticket price, no fake artist

| Partner org slug | Event title | location_name |
|-----------------|-------------|---------------|
| `belga-queen` | "Afterwork découverte" | "Belga Queen · Reims" |
| `pittaya` | "Découverte culinaire" | "Pittaya · Reims" |
| `centre-des-ressources` | "Atelier ressources locales" | "Centre des Ressources · Reims" |
| `garcon-barbiers` | "Conseils style & entretien" | "Garçon Barbiers · Reims" |

`location_name` = `organization.name + " · " + city` if no real address available. No invented coordinates.

The seed looks up `organization_id` by slug at runtime to avoid hardcoded UUIDs (organizations table has stable slugs).

Seed integrated in `backend/app/db/seeds/__main__.py`.

---

## Frontend

### Type extension (`frontend/packages/types/src/local-event.ts`)

Add to `LocalEventOrganization` type:

```typescript
export type LocalEventOrganization = {
  id: string;
  slug: string;
  name: string;
  city: string;
  logo_url: string | null;
  is_verified: boolean;
  is_partner: boolean;               // new
  partner_status: PartnerStatus | null; // new — from @yunicity/types partner
};
```

Update `LocalEvent` type if `organization` field references this type.

### Utils (`frontend/packages/utils/src/partner-events-utils.ts`)

```typescript
eventOrganizerLabel(event: LocalEvent): string
// → event.organization?.name ?? "Événement citoyen"

eventIsPartnerEvent(event: LocalEvent): boolean
// → event.organization?.is_partner === true

eventPartnerBadgeLabel(event: LocalEvent): string | null
// → null if not partner, else badge string from partner_status

buildPartnerEventsUrl(slug: string, city: string): string
// → `/places/${slug}?city=${encodeURIComponent(city)}#events`
```

### Utils tests

- `eventOrganizerLabel` with org → org name
- `eventOrganizerLabel` without org → "Événement citoyen"
- `eventIsPartnerEvent` with `is_partner: true` → true
- `eventIsPartnerEvent` with `is_partner: false` → false
- `eventIsPartnerEvent` without org → false
- `eventPartnerBadgeLabel` for active partner → non-null string
- `buildPartnerEventsUrl` → correct URL

---

## Backend Tests — `backend/tests/test_partner_events_api.py`

10 integration tests, skip when `DATABASE_URL` not set:

1. `test_create_event_non_partner_org_creates_without_status_check` — an org without `partner_profile` can create events (no partner gate fires)
2. `test_create_event_without_org_permission_returns_403`
3. `test_create_event_as_active_partner_returns_201`
4. `test_create_event_as_signed_partner_returns_403` — `PARTNER_NOT_ACTIVE`
5. `test_list_events_includes_organization_is_partner_field`
6. `test_list_events_filter_by_organization_slug`
7. `test_partner_events_endpoint_returns_future_events`
8. `test_partner_events_endpoint_signed_partner_returns_404`
9. `test_event_response_does_not_expose_internal_partner_fields` — no `contact_email`, `contract_reference`, `notes_internal`
10. `test_seed_partner_events_idempotent`

---

## Quality Gates

```bash
# Backend
uv run alembic revision --autogenerate -m "no-op partner events check"
# If autogenerate produces empty migration: that confirms no schema changes needed
uv run alembic upgrade head
uv run pytest tests/test_partner_events_api.py -q
uv run ruff check app/api/v1/partners.py app/api/v1/events.py app/services/local_event_service.py app/schemas/local_event.py app/db/seeds/reims_partner_events.py tests/test_partner_events_api.py
uv run mypy app tests

# Frontend
pnpm --filter @yunicity/utils test
pnpm --filter web typecheck
pnpm --filter web build
```

---

## Risks & Deferred Items

| Risk | Mitigation |
|------|------------|
| N+1 on `_to_response` (one PartnerProfile query per event) | Acceptable for MVP list sizes. Batch loading via `WHERE id IN (...)` deferred to 05B or a perf ticket. |
| `starts_at` on seed events expires over time | Seed is idempotent by UUID — re-seeding does not update `starts_at`. Events will eventually be in the past. Acceptable for dev/recette; prod seed will use real dates. |
| `LocalEventCreateRequest.organization_id` is currently required (not nullable) | The ticket says "comportement actuel inchangé si organization_id absent". Existing schema makes it required. No change needed — the check is about PARTNER status, not about making org_id optional. |

---

## Accepted Non-Changes

- `LocalEventCreateRequest.organization_id` remains **required** — all events are created via an org. No citizen-event-without-org flow change in this ticket.
- `_initial_moderation_status` logic unchanged — partner status check is separate from moderation.
- `GET /map/events` inherits `_to_response` enrichment automatically — no separate changes needed.
