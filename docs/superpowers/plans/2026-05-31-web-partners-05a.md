# WEB-PARTNERS-05A — Partner Event Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Link LocalEvents to partner organizations — expose `is_partner`/`partner_status` in event responses, add `organization_slug` filter, add `/partners/{slug}/events`, block `signed`/`paused` partners from creating events, seed 4 pilot events, add frontend types/utils.

**Architecture:** No DB migration — `organization_id FK` already exists on `local_events`. Enrich `LocalEventOrganizationSummary` schema with partner fields. Load `Organization.partner_profile` via chained `selectinload` in repository queries (2 SQL queries for lists, not N+1). Partner gate lives in `LocalEventService.create_for_organization`.

**Tech Stack:** FastAPI, SQLAlchemy 2 async (`selectinload` chaining), Pydantic v2, PyJWT not used here, TypeScript strict, vitest.

**Spec:** `docs/superpowers/specs/2026-05-31-web-partners-05a-design.md`

---

## File Map

### New files

| File | Purpose |
|------|---------|
| `backend/app/db/seeds/reims_partner_events.py` | 4 idempotent pilot partner events |
| `backend/tests/test_partner_events_api.py` | 10 integration tests |
| `frontend/packages/utils/src/partner-events-utils.ts` | eventOrganizerLabel, eventIsPartnerEvent, etc. |
| `frontend/packages/utils/src/partner-events-utils.test.ts` | utils tests |

### Modified files

| File | Change |
|------|--------|
| `backend/app/schemas/local_event.py` | Add `is_partner: bool` + `partner_status: str | None` to `LocalEventOrganizationSummary` |
| `backend/app/repositories/local_event_repository.py` | Chain `selectinload(Organization.partner_profile)` in all queries; add `organization_slug` filter to `list_public_for_city` |
| `backend/app/services/local_event_service.py` | Add partner gate to `create_for_organization`; enrich `_to_response`; add `list_for_partner` method |
| `backend/app/api/v1/events.py` | Add `organization_slug` query param |
| `backend/app/api/v1/partners.py` | Add `GET /{slug}/events` endpoint |
| `backend/app/db/seeds/__main__.py` | Import and call `seed_reims_partner_events` |
| `frontend/packages/types/src/local-event.ts` | Add `is_partner: boolean` + `partner_status: PartnerStatus | null` to `LocalEventOrganization` |
| `frontend/packages/types/src/index.ts` | Export new utils |
| `frontend/packages/utils/src/index.ts` | Re-export new utils |

---

## Task 1: Enrich LocalEventOrganizationSummary schema

**Files:**
- Modify: `backend/app/schemas/local_event.py`

- [ ] **Step 1: Add the two new fields**

Open `backend/app/schemas/local_event.py`. Find `LocalEventOrganizationSummary` and add the two new fields:

```python
class LocalEventOrganizationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    name: str
    city: str
    logo_url: str | None = None
    is_verified: bool = False
    created_at: datetime | None = None
    is_partner: bool = False               # new — True if org has active partner_profile
    partner_status: str | None = None      # new — PartnerStatus string value or None
```

Remove the unused `created_at` field if it was only there as a placeholder — but keep it if it's used by existing frontend code. Check `frontend/packages/types/src/local-event.ts` line 12: `created_at?: string | null` — it IS used. Keep it.

- [ ] **Step 2: Verify smoke test**

```powershell
Set-Location "C:\Users\kyria\yunicity\backend"
uv run python -c "from app.schemas.local_event import LocalEventOrganizationSummary; s = LocalEventOrganizationSummary(id='00000000-0000-0000-0000-000000000001', slug='x', name='x', city='x'); print('is_partner:', s.is_partner, 'partner_status:', s.partner_status)"
```

Expected: `is_partner: False partner_status: None`

- [ ] **Step 3: Commit**

```
git add backend/app/schemas/local_event.py
git commit -m "feat(events): add is_partner and partner_status to LocalEventOrganizationSummary"
```

---

## Task 2: Load partner_profile via chained selectinload in repository

**Files:**
- Modify: `backend/app/repositories/local_event_repository.py`

The `Organization` model has `partner_profile: Mapped[PartnerProfile | None]` relationship. We load it in 2 SQL queries (not N+1) by chaining `selectinload(LocalEvent.organization).selectinload(Organization.partner_profile)`.

- [ ] **Step 1: Add Organization import and update selectinload in get_by_id**

At the top of the file, add the import for Organization:

```python
from app.models.organization import Organization
```

Find `get_by_id` and update its `options`:

```python
async def get_by_id(self, event_id: uuid.UUID) -> LocalEvent | None:
    result = await self._session.execute(
        select(LocalEvent)
        .options(
            selectinload(LocalEvent.organization).selectinload(Organization.partner_profile),
            selectinload(LocalEvent.neighborhood),
        )
        .where(LocalEvent.id == event_id)
    )
    return result.scalar_one_or_none()
```

- [ ] **Step 2: Update list_public_for_city**

Find `list_public_for_city` and update its `options` AND add `organization_slug` parameter:

```python
async def list_public_for_city(
    self,
    *,
    city: str | None,
    limit: int,
    offset: int = 0,
    now: datetime | None = None,
    organization_slug: str | None = None,
) -> list[LocalEvent]:
    stmt = (
        select(LocalEvent)
        .options(
            selectinload(LocalEvent.organization).selectinload(Organization.partner_profile),
            selectinload(LocalEvent.neighborhood),
        )
        .where(
            LocalEvent.moderation_status == LocalEventModerationStatus.APPROVED.value,
            LocalEvent.is_cancelled.is_(False),
            LocalEvent.visibility == "public",
        )
        .order_by(LocalEvent.starts_at.asc())
        .limit(limit)
        .offset(offset)
    )
    if city:
        stmt = stmt.where(func.lower(LocalEvent.city) == city.strip().lower())
    if now is not None:
        stmt = stmt.where(LocalEvent.starts_at >= now)
    if organization_slug is not None:
        slug_lower = organization_slug.strip().lower()
        stmt = stmt.join(
            Organization, LocalEvent.organization_id == Organization.id
        ).where(func.lower(Organization.slug) == slug_lower)
    result = await self._session.execute(stmt)
    return list(result.scalars().all())
```

- [ ] **Step 3: Update list_saved_for_user selectinload**

Find `list_saved_for_user` and update its `options`:

```python
async def list_saved_for_user(self, user_id: uuid.UUID, *, limit: int) -> list[LocalEvent]:
    result = await self._session.execute(
        select(LocalEvent)
        .join(EventInterest, EventInterest.event_id == LocalEvent.id)
        .options(
            selectinload(LocalEvent.organization).selectinload(Organization.partner_profile),
            selectinload(LocalEvent.neighborhood),
        )
        .where(
            EventInterest.user_id == user_id,
            LocalEvent.moderation_status == LocalEventModerationStatus.APPROVED.value,
            LocalEvent.is_cancelled.is_(False),
        )
        .order_by(LocalEvent.starts_at.asc())
        .limit(limit)
    )
    return list(result.scalars().all())
```

- [ ] **Step 4: Add list_for_partner method**

Add this new method at the end of the class:

```python
async def list_for_partner(
    self,
    *,
    organization_id: uuid.UUID,
    upcoming_only: bool,
    limit: int,
    offset: int,
    now: datetime,
) -> list[LocalEvent]:
    stmt = (
        select(LocalEvent)
        .options(
            selectinload(LocalEvent.organization).selectinload(Organization.partner_profile),
            selectinload(LocalEvent.neighborhood),
        )
        .where(
            LocalEvent.organization_id == organization_id,
            LocalEvent.moderation_status == LocalEventModerationStatus.APPROVED.value,
            LocalEvent.is_cancelled.is_(False),
            LocalEvent.visibility == "public",
        )
        .order_by(LocalEvent.starts_at.asc())
        .limit(limit)
        .offset(offset)
    )
    if upcoming_only:
        stmt = stmt.where(LocalEvent.starts_at >= now)
    result = await self._session.execute(stmt)
    return list(result.scalars().all())
```

- [ ] **Step 5: Smoke test**

```powershell
Set-Location "C:\Users\kyria\yunicity\backend"
uv run python -c "from app.repositories.local_event_repository import LocalEventRepository; print('OK')"
```

Expected: `OK`

- [ ] **Step 6: Commit**

```
git add backend/app/repositories/local_event_repository.py
git commit -m "feat(events): load organization.partner_profile via chained selectinload; add organization_slug filter; add list_for_partner"
```

---

## Task 3: Service — partner gate + enriched _to_response + list_for_partner + organization_slug

**Files:**
- Modify: `backend/app/services/local_event_service.py`

- [ ] **Step 1: Add new imports**

Find the existing imports at the top of `backend/app/services/local_event_service.py` and add:

```python
from app.core.partner_constants import PUBLIC_PARTNER_STATUSES, PartnerStatus
from app.repositories.partner_repository import PartnerRepository
```

Also, add `PartnerProfile` to the model imports for type checking only:

```python
# In the if TYPE_CHECKING block (or at top):
from app.models.partner_profile import PartnerProfile
```

Actually, `PartnerProfile` is accessed via `org.partner_profile` (already loaded in memory). No direct import needed — but we need `PartnerStatus` and `PUBLIC_PARTNER_STATUSES`.

- [ ] **Step 2: Add PartnerRepository to __init__**

Find the `__init__` method and add `_partners`:

```python
def __init__(self, session: AsyncSession) -> None:
    self._session = session
    self._events = LocalEventRepository(session)
    self._orgs = OrganizationRepository(session)
    self._offers = PartnerOfferRepository(session)
    self._membership = OrganizationMembershipService(session)
    self._partners = PartnerRepository(session)   # new
```

- [ ] **Step 3: Add partner gate to create_for_organization**

Find `create_for_organization`. After the `require_offer_manager` call and before `_require_organization`, add:

```python
# Partner status gate — signed/paused cannot create partner events
profile = await self._partners.get_by_organization_id(payload.organization_id)
if profile is not None:
    p_status = (
        profile.partner_status
        if isinstance(profile.partner_status, PartnerStatus)
        else PartnerStatus(profile.partner_status)
    )
    if p_status not in PUBLIC_PARTNER_STATUSES:
        raise AppError(
            status_code=403,
            code="PARTNER_NOT_ACTIVE",
            detail="Ce partenaire n'est pas actif. Statut requis : active, premium ou founding_partner.",
        )
```

- [ ] **Step 4: Enrich _to_response to populate is_partner and partner_status**

Find `_to_response`. It already builds `org_summary` from `org`. Update the `if org is not None` block to also read `org.partner_profile` (which is already loaded in memory via selectinload):

```python
def _to_response(
    self,
    event: LocalEvent,
    *,
    interested_by_me: bool = False,
    interest_count: int = 0,
) -> LocalEventResponse:
    org = event.organization
    org_summary = None
    if org is not None:
        is_partner = False
        partner_status_val: str | None = None
        profile = getattr(org, "partner_profile", None)
        if profile is not None:
            p_status = (
                profile.partner_status
                if isinstance(profile.partner_status, PartnerStatus)
                else PartnerStatus(profile.partner_status)
            )
            is_partner = p_status in PUBLIC_PARTNER_STATUSES
            partner_status_val = p_status.value
        org_summary = LocalEventOrganizationSummary(
            id=org.id,
            slug=org.slug,
            name=org.name,
            city=org.city,
            logo_url=org.logo_url,
            is_verified=org.verified_at is not None,
            created_at=org.created_at,
            is_partner=is_partner,
            partner_status=partner_status_val,
        )
    return LocalEventResponse(
        id=event.id,
        organization_id=event.organization_id,
        title=event.title,
        description=event.description,
        event_type=event.event_type,
        city=event.city,
        district=event.district,
        starts_at=event.starts_at,
        ends_at=event.ends_at,
        timezone=event.timezone,
        location_name=event.location_name,
        address=event.address,
        latitude=float(event.latitude) if event.latitude is not None else None,
        longitude=float(event.longitude) if event.longitude is not None else None,
        cover_image_url=event.cover_image_url,
        moderation_status=event.moderation_status,
        is_cancelled=event.is_cancelled,
        interested_by_me=interested_by_me,
        interest_count=interest_count,
        organization=org_summary,
        neighborhood_summary=neighborhood_summary_from_event(event),
        created_at=event.created_at,
    )
```

- [ ] **Step 5: Add list_public organization_slug support**

Find `list_public` and update the `list_public_for_city` call to accept the new param. Also add `organization_slug` param to the method signature:

```python
async def list_public(
    self,
    user: User | None,
    *,
    city: str | None,
    page: int,
    page_size: int,
    organization_slug: str | None = None,
) -> LocalEventListResponse:
    page_size = min(max(page_size, 1), LOCAL_EVENT_LIST_PAGE_SIZE_MAX)
    offset = (max(page, 1) - 1) * page_size
    resolved_city = city or (user.city if user else None)
    now = datetime.now(UTC)
    rows = await self._events.list_public_for_city(
        city=resolved_city,
        limit=page_size,
        offset=offset,
        now=now,
        organization_slug=organization_slug,
    )
    interested_ids: set[uuid.UUID] = set()
    if user and rows:
        interested_ids = await self._events.interest_event_ids_for_user(
            user.id, [e.id for e in rows]
        )
    items = [self._to_response(e, interested_by_me=e.id in interested_ids) for e in rows]
    return LocalEventListResponse(
        items=items,
        total=len(items),
        page=page,
        page_size=page_size,
    )
```

- [ ] **Step 6: Add list_for_partner method**

Add this new method to the `LocalEventService` class (after `list_saved`):

```python
async def list_for_partner(
    self,
    organization_id: uuid.UUID,
    *,
    upcoming_only: bool,
    limit: int,
    offset: int,
) -> LocalEventListResponse:
    limit = min(max(limit, 1), LOCAL_EVENT_LIST_PAGE_SIZE_MAX)
    now = datetime.now(UTC)
    rows = await self._events.list_for_partner(
        organization_id=organization_id,
        upcoming_only=upcoming_only,
        limit=limit,
        offset=offset,
        now=now,
    )
    items = [self._to_response(e) for e in rows]
    return LocalEventListResponse(
        items=items,
        total=len(items),
        page=1,
        page_size=limit,
    )
```

- [ ] **Step 7: Smoke test**

```powershell
Set-Location "C:\Users\kyria\yunicity\backend"
uv run python -c "from app.services.local_event_service import LocalEventService; print('OK')"
```

Expected: `OK`

- [ ] **Step 8: Commit**

```
git add backend/app/services/local_event_service.py
git commit -m "feat(events): add partner gate, enrich event org with is_partner/partner_status, add list_for_partner"
```

---

## Task 4: Update events.py route — organization_slug filter

**Files:**
- Modify: `backend/app/api/v1/events.py`

- [ ] **Step 1: Add organization_slug to the list route**

Find the `list_local_events` handler and add `organization_slug` as an optional query param:

```python
@router.get("", response_model=LocalEventListResponse)
async def list_local_events(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
    city: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=LOCAL_EVENT_LIST_PAGE_SIZE_DEFAULT,
        ge=1,
        le=LOCAL_EVENT_LIST_PAGE_SIZE_MAX,
    ),
    organization_slug: str | None = Query(default=None, max_length=128),
) -> LocalEventListResponse:
    return await LocalEventService(session).list_public(
        current_user,
        city=city,
        page=page,
        page_size=page_size,
        organization_slug=organization_slug,
    )
```

- [ ] **Step 2: Smoke test — verify app starts**

```powershell
Set-Location "C:\Users\kyria\yunicity\backend"
uv run python -c "from app.main import create_app; app = create_app(); routes = [r.path for r in app.routes if hasattr(r, 'path')]; print([r for r in routes if '/events' in r])"
```

Expected: list includes `/api/v1/events`

- [ ] **Step 3: Commit**

```
git add backend/app/api/v1/events.py
git commit -m "feat(events): add organization_slug filter to GET /events"
```

---

## Task 5: Add GET /partners/{slug}/events endpoint

**Files:**
- Modify: `backend/app/api/v1/partners.py`

- [ ] **Step 1: Read the current imports in partners.py**

Open `backend/app/api/v1/partners.py`. The file already imports `PartnerService`, `PublicPartnerOfferService`, and has `require_authenticated_user`. Check existing imports to avoid duplicates.

- [ ] **Step 2: Add new imports**

Add to the existing imports (merge, don't duplicate):

```python
from app.core.partner_constants import PUBLIC_PARTNER_STATUSES, PartnerStatus
from app.schemas.local_event import LocalEventListResponse
from app.services.local_event_service import LocalEventService
```

- [ ] **Step 3: Add the route BEFORE the existing GET /{slug} route**

Add this route. Put it before `GET /{slug}` to avoid path conflicts:

```python
@router.get("/{slug}/events", response_model=LocalEventListResponse)
async def list_partner_events(
    slug: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(default="Reims", min_length=1, max_length=128),
    upcoming_only: bool = Query(default=True),
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
) -> LocalEventListResponse:
    profile = await PartnerService(session).get_public_profile_by_slug(city=city, slug=slug)
    if profile is None:
        from app.core.errors import AppError
        raise AppError(404, "PARTNER_NOT_FOUND", "Partenaire introuvable.")
    p_status = (
        profile.partner_status
        if isinstance(profile.partner_status, PartnerStatus)
        else PartnerStatus(profile.partner_status)
    )
    if p_status not in PUBLIC_PARTNER_STATUSES:
        from app.core.errors import AppError
        raise AppError(404, "PARTNER_NOT_FOUND", "Partenaire introuvable.")
    return await LocalEventService(session).list_for_partner(
        profile.organization_id,
        upcoming_only=upcoming_only,
        limit=limit,
        offset=offset,
    )
```

**Note:** `PartnerService` needs a `get_public_profile_by_slug` method OR we use `PartnerRepository` directly. Check the existing `PartnerService.get_public_by_slug` — it returns `PartnerPublicDetail` (a response schema), not the ORM profile. We need the raw `PartnerProfile` ORM object.

Use `PartnerRepository` directly in the route (follow the pattern already used in `partner_offers_public.py`):

```python
@router.get("/{slug}/events", response_model=LocalEventListResponse)
async def list_partner_events(
    slug: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(default="Reims", min_length=1, max_length=128),
    upcoming_only: bool = Query(default=True),
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
) -> LocalEventListResponse:
    from app.core.errors import AppError
    from app.repositories.partner_repository import PartnerRepository

    profile = await PartnerRepository(session).get_by_slug(city=city, slug=slug)
    if profile is None:
        raise AppError(404, "PARTNER_NOT_FOUND", "Partenaire introuvable.")
    p_status = (
        profile.partner_status
        if isinstance(profile.partner_status, PartnerStatus)
        else PartnerStatus(profile.partner_status)
    )
    if p_status not in PUBLIC_PARTNER_STATUSES:
        raise AppError(404, "PARTNER_NOT_FOUND", "Partenaire introuvable.")
    return await LocalEventService(session).list_for_partner(
        profile.organization_id,
        upcoming_only=upcoming_only,
        limit=limit,
        offset=offset,
    )
```

- [ ] **Step 4: Verify route registration**

```powershell
Set-Location "C:\Users\kyria\yunicity\backend"
uv run python -c "
from app.main import create_app
app = create_app()
routes = [r.path for r in app.routes if hasattr(r, 'path')]
partner_routes = [r for r in routes if '/partners/' in r]
print(partner_routes)
assert any('events' in r for r in partner_routes), 'partner events route missing'
print('OK')
"
```

Expected: list includes `/api/v1/partners/{slug}/events`, prints `OK`

- [ ] **Step 5: Commit**

```
git add backend/app/api/v1/partners.py
git commit -m "feat(partners): add GET /{slug}/events endpoint for upcoming partner events"
```

---

## Task 6: Seed — reims_partner_events.py

**Files:**
- Create: `backend/app/db/seeds/reims_partner_events.py`
- Modify: `backend/app/db/seeds/__main__.py`

Active partner UUIDs (from `reims_signed_partners.py`):
- Belga Queen: `d6040000-0000-4000-8000-000000000009`
- Pittaya: `d6040000-0000-4000-8000-000000000011`
- Centre des Ressources: `d6040000-0000-4000-8000-000000000012`
- Garçon Barbiers: `d6040000-0000-4000-8000-000000000014`

- [ ] **Step 1: Create the seed file**

```python
"""Reims pilot partner events seed (WEB-PARTNERS-05A) — idempotent."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.local_event_constants import (
    LocalEventModerationStatus,
    LocalEventVisibility,
)
from app.models.local_event import LocalEvent
from app.models.user import User

REIMS_CITY = "Reims"
_PILOT_DESCRIPTION = (
    "Un moment pilote proposé dans le cadre du réseau partenaire Yunicity."
)
_EVENT_TYPE = "partner_event"

REIMS_PARTNER_EVENTS_SEED: tuple[dict[str, Any], ...] = (
    {
        "id": uuid.UUID("d6050000-0000-4000-8000-000000000001"),
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000009"),
        "slug": "belga-queen-afterwork-decouverte",
        "title": "Afterwork découverte",
        "location_name": "Belga Queen, Reims",
    },
    {
        "id": uuid.UUID("d6050000-0000-4000-8000-000000000002"),
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000011"),
        "slug": "pittaya-decouverte-culinaire",
        "title": "Découverte culinaire",
        "location_name": "Pittaya, Reims",
    },
    {
        "id": uuid.UUID("d6050000-0000-4000-8000-000000000003"),
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000012"),
        "slug": "centre-des-ressources-atelier-ressources-locales",
        "title": "Atelier ressources locales",
        "location_name": "Centre des Ressources, Reims",
    },
    {
        "id": uuid.UUID("d6050000-0000-4000-8000-000000000004"),
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000014"),
        "slug": "garcon-barbiers-conseils-style",
        "title": "Conseils style & entretien",
        "location_name": "Garçon Barbiers, Reims",
    },
)

_SYNC_FIELDS = ("title", "location_name", "description", "event_type")


def _build_event(entry: dict[str, Any], created_by_user_id: uuid.UUID) -> LocalEvent:
    now = datetime.now(UTC)
    return LocalEvent(
        id=entry["id"],
        organization_id=entry["organization_id"],
        created_by_user_id=created_by_user_id,
        title=entry["title"],
        description=_PILOT_DESCRIPTION,
        event_type=_EVENT_TYPE,
        city=REIMS_CITY,
        location_name=entry["location_name"],
        starts_at=now + timedelta(days=14),
        moderation_status=LocalEventModerationStatus.APPROVED.value,
        visibility=LocalEventVisibility.PUBLIC.value,
    )


async def _get_or_skip_user(session: AsyncSession) -> uuid.UUID | None:
    """Return any existing user ID, or None if the table is empty."""
    result = await session.execute(
        select(User.id).limit(1)
    )
    row = result.scalar_one_or_none()
    return row


async def _upsert_event(
    session: AsyncSession, row: LocalEvent, *, update_starts_at: bool = False
) -> None:
    existing = await session.get(LocalEvent, row.id)
    if existing is None:
        session.add(row)
        return
    for field in _SYNC_FIELDS:
        setattr(existing, field, getattr(row, field))
    if update_starts_at and existing.starts_at < datetime.now(UTC):
        existing.starts_at = row.starts_at


async def seed_reims_partner_events(session: AsyncSession) -> None:
    user_id = await _get_or_skip_user(session)
    if user_id is None:
        return  # No users in DB — skip seed silently
    for entry in REIMS_PARTNER_EVENTS_SEED:
        event = _build_event(entry, user_id)
        await _upsert_event(session, event)
    await session.flush()
```

- [ ] **Step 2: Import and call in __main__.py**

Open `backend/app/db/seeds/__main__.py`. Find `from app.db.seeds.reims_partner_offers import seed_reims_partner_offers` and add below:

```python
from app.db.seeds.reims_partner_events import seed_reims_partner_events
```

In the `run` function, after `await seed_reims_partner_offers(session)`:

```python
await seed_reims_partner_events(session)
```

- [ ] **Step 3: Smoke test — import the seed**

```powershell
Set-Location "C:\Users\kyria\yunicity\backend"
uv run python -c "from app.db.seeds.reims_partner_events import seed_reims_partner_events, REIMS_PARTNER_EVENTS_SEED; print('events in seed:', len(REIMS_PARTNER_EVENTS_SEED))"
```

Expected: `events in seed: 4`

- [ ] **Step 4: Commit**

```
git add backend/app/db/seeds/reims_partner_events.py backend/app/db/seeds/__main__.py
git commit -m "feat(seeds): add 4 pilot partner events for Reims active partners"
```

---

## Task 7: Frontend types extension

**Files:**
- Modify: `frontend/packages/types/src/local-event.ts`
- Modify: `frontend/packages/types/src/index.ts`

- [ ] **Step 1: Read local-event.ts**

Open `frontend/packages/types/src/local-event.ts`. Find `LocalEventOrganization`.

- [ ] **Step 2: Add is_partner and partner_status**

Update `LocalEventOrganization`:

```typescript
export interface LocalEventOrganization {
  id: string;
  slug: string;
  name: string;
  city: string;
  logo_url: string | null;
  is_verified?: boolean;
  created_at?: string | null;
  is_partner?: boolean;                           // new
  partner_status?: string | null;                 // new — PartnerStatus value or null
}
```

Note: `PartnerStatus` is already exported from `@yunicity/types` via `./partner`. We use `string | null` instead of `PartnerStatus | null` here to avoid importing the partner type into the event file — `is_partner: boolean` is the primary discriminator.

- [ ] **Step 3: Verify index.ts already exports LocalEventOrganization**

Check `frontend/packages/types/src/index.ts` — `LocalEventOrganization` should be in the `./local-event` export block. If missing, add it.

- [ ] **Step 4: Run typecheck**

```powershell
Set-Location "C:\Users\kyria\yunicity\frontend"
pnpm --filter @yunicity/types build 2>&1 || pnpm --filter web typecheck 2>&1 | Select-Object -First 20
```

Expected: no errors about `LocalEventOrganization`.

- [ ] **Step 5: Commit**

```
git add frontend/packages/types/src/local-event.ts
git commit -m "feat(types): add is_partner and partner_status to LocalEventOrganization"
```

---

## Task 8: Frontend utils + tests

**Files:**
- Create: `frontend/packages/utils/src/partner-events-utils.ts`
- Create: `frontend/packages/utils/src/partner-events-utils.test.ts`
- Modify: `frontend/packages/utils/src/index.ts`

- [ ] **Step 1: Create the utils file**

```typescript
/** Partner event utilities (WEB-PARTNERS-05A). */

import type { LocalEvent } from "@yunicity/types";

export function eventOrganizerLabel(event: Pick<LocalEvent, "organization">): string {
  return event.organization?.name ?? "Événement citoyen";
}

export function eventIsPartnerEvent(event: Pick<LocalEvent, "organization">): boolean {
  return event.organization?.is_partner === true;
}

export function eventPartnerBadgeLabel(
  event: Pick<LocalEvent, "organization">,
): string | null {
  if (!eventIsPartnerEvent(event)) return null;
  const status = event.organization?.partner_status;
  const labels: Record<string, string> = {
    founding_partner: "Partenaire fondateur",
    premium: "Partenaire premium",
    active: "Partenaire actif",
  };
  return status ? (labels[status] ?? "Partenaire") : "Partenaire";
}

export function buildPartnerEventsUrl(slug: string, city?: string): string {
  const base = `/places/${encodeURIComponent(slug)}`;
  if (city) {
    return `${base}?city=${encodeURIComponent(city)}#events`;
  }
  return `${base}#events`;
}
```

- [ ] **Step 2: Create the test file**

```typescript
import { describe, expect, it } from "vitest";

import type { LocalEvent } from "@yunicity/types";

import {
  buildPartnerEventsUrl,
  eventIsPartnerEvent,
  eventOrganizerLabel,
  eventPartnerBadgeLabel,
} from "./partner-events-utils";

const BASE_ORG = {
  id: "org-1",
  slug: "belga-queen",
  name: "Belga Queen",
  city: "Reims",
  logo_url: null,
  is_verified: true,
  is_partner: true,
  partner_status: "active",
};

const PARTNER_EVENT: Pick<LocalEvent, "organization"> = {
  organization: BASE_ORG,
};

const CITIZEN_EVENT: Pick<LocalEvent, "organization"> = {
  organization: null,
};

const NON_PARTNER_EVENT: Pick<LocalEvent, "organization"> = {
  organization: { ...BASE_ORG, is_partner: false, partner_status: null },
};

describe("partner-events-utils", () => {
  describe("eventOrganizerLabel", () => {
    it("returns org name for partner event", () => {
      expect(eventOrganizerLabel(PARTNER_EVENT)).toBe("Belga Queen");
    });

    it("returns fallback for citizen event without org", () => {
      expect(eventOrganizerLabel(CITIZEN_EVENT)).toBe("Événement citoyen");
    });
  });

  describe("eventIsPartnerEvent", () => {
    it("returns true for active partner event", () => {
      expect(eventIsPartnerEvent(PARTNER_EVENT)).toBe(true);
    });

    it("returns false for citizen event (no org)", () => {
      expect(eventIsPartnerEvent(CITIZEN_EVENT)).toBe(false);
    });

    it("returns false for org event with is_partner: false", () => {
      expect(eventIsPartnerEvent(NON_PARTNER_EVENT)).toBe(false);
    });
  });

  describe("eventPartnerBadgeLabel", () => {
    it("returns badge for active partner", () => {
      expect(eventPartnerBadgeLabel(PARTNER_EVENT)).toBe("Partenaire actif");
    });

    it("returns badge for founding_partner", () => {
      const founding = { organization: { ...BASE_ORG, partner_status: "founding_partner" } };
      expect(eventPartnerBadgeLabel(founding)).toBe("Partenaire fondateur");
    });

    it("returns null for non-partner event", () => {
      expect(eventPartnerBadgeLabel(NON_PARTNER_EVENT)).toBeNull();
    });

    it("returns null for citizen event", () => {
      expect(eventPartnerBadgeLabel(CITIZEN_EVENT)).toBeNull();
    });
  });

  describe("buildPartnerEventsUrl", () => {
    it("builds URL with city", () => {
      expect(buildPartnerEventsUrl("belga-queen", "Reims")).toBe(
        "/places/belga-queen?city=Reims#events",
      );
    });

    it("builds URL without city", () => {
      expect(buildPartnerEventsUrl("belga-queen")).toBe("/places/belga-queen#events");
    });

    it("encodes slug with special characters", () => {
      const url = buildPartnerEventsUrl("garçon-barbiers");
      expect(url).toContain("/places/");
      expect(url).toContain("#events");
    });
  });
});
```

- [ ] **Step 3: Export from utils index**

Open `frontend/packages/utils/src/index.ts`. Find a suitable location (near other event/partner exports) and add:

```typescript
export {
  buildPartnerEventsUrl,
  eventIsPartnerEvent,
  eventOrganizerLabel,
  eventPartnerBadgeLabel,
} from "./partner-events-utils";
```

- [ ] **Step 4: Run tests**

```powershell
Set-Location "C:\Users\kyria\yunicity\frontend"
pnpm --filter @yunicity/utils test 2>&1 | Select-Object -Last 8
```

Expected: all tests pass including `partner-events-utils.test.ts` (11 new tests).

- [ ] **Step 5: Commit**

```
git add frontend/packages/utils/src/partner-events-utils.ts frontend/packages/utils/src/partner-events-utils.test.ts frontend/packages/utils/src/index.ts
git commit -m "feat(utils): add partner event utils and tests"
```

---

## Task 9: Backend integration tests

**Files:**
- Create: `backend/tests/test_partner_events_api.py`

- [ ] **Step 1: Create the test file**

```python
"""Partner events API integration tests (WEB-PARTNERS-05A)."""

from __future__ import annotations

import os
import uuid
from collections.abc import AsyncGenerator, Iterator
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from app.core.config import get_settings
from app.core.local_event_constants import LocalEventModerationStatus, LocalEventVisibility
from app.core.passport_constants import PassportStampSource
from app.db.seeds.reims_partner_events import REIMS_PARTNER_EVENTS_SEED, seed_reims_partner_events
from app.db.seeds.reims_signed_partners import seed_reims_signed_partners
from app.db.session import dispose_db, get_session_factory, init_db
from app.main import create_app
from app.models.local_event import LocalEvent
from app.models.organization import Organization
from app.models.partner_profile import PartnerProfile
from app.models.user import User
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select, func


def _database_url() -> str | None:
    return os.environ.get("DATABASE_URL")


@pytest.fixture
def partner_events_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    database_url = _database_url()
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip partner events integration tests")
    monkeypatch.setenv("DATABASE_URL", database_url)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
async def pe_client(partner_events_env: None) -> AsyncGenerator[AsyncClient, None]:
    settings = get_settings()
    init_db(settings)
    application = create_app()
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    await dispose_db()


@pytest.fixture
async def seeded(pe_client: AsyncClient) -> None:
    session_factory = get_session_factory()
    if session_factory is None:
        pytest.skip("Session factory not configured")
    async with session_factory() as session:
        await seed_reims_signed_partners(session)
        await seed_reims_partner_events(session)
        await session.commit()


async def _make_auth_user(session_factory: Any) -> tuple[User, str]:
    """Create a test user and return (user, auth_token)."""
    from app.core.security import create_access_token, hash_password

    async with session_factory() as session:
        user = User(
            id=uuid.uuid4(),
            email=f"test_{uuid.uuid4().hex[:8]}@example.com",
            hashed_password=hash_password("TestPassword123!"),
            is_active=True,
        )
        session.add(user)
        await session.commit()
        return user, create_access_token(user.id)


async def _make_org_member(
    session_factory: Any, organization_id: uuid.UUID
) -> tuple[User, str]:
    """Create a user who is a manager of the given organization."""
    from app.core.security import create_access_token, hash_password
    from app.models.organization import OrganizationMember

    async with session_factory() as session:
        user = User(
            id=uuid.uuid4(),
            email=f"member_{uuid.uuid4().hex[:8]}@example.com",
            hashed_password=hash_password("TestPassword123!"),
            is_active=True,
        )
        session.add(user)
        await session.flush()
        member = OrganizationMember(
            organization_id=organization_id,
            user_id=user.id,
            role="owner",
            status="active",
        )
        session.add(member)
        await session.commit()
        return user, create_access_token(user.id)


# Belga Queen = active partner: d6040000-0000-4000-8000-000000000009
BELGA_QUEEN_ORG_ID = uuid.UUID("d6040000-0000-4000-8000-000000000009")
# Daiboken = signed partner: d6040000-0000-4000-8000-000000000004
DAIBOKEN_ORG_ID = uuid.UUID("d6040000-0000-4000-8000-000000000004")


@pytest.mark.integration
@pytest.mark.anyio
async def test_non_partner_org_can_create_event(
    pe_client: AsyncClient,
    seeded: None,
) -> None:
    """An org WITHOUT a partner_profile can create events (no gate fires)."""
    session_factory = get_session_factory()
    assert session_factory is not None
    # Create a plain org (no partner_profile)
    async with session_factory() as session:
        org = Organization(
            id=uuid.uuid4(),
            name="Non-partner org",
            slug=f"test-org-{uuid.uuid4().hex[:6]}",
            city="Reims",
            type="commerce",
            visibility="public",
            verification_status="verified",
        )
        session.add(org)
        await session.commit()
        org_id = org.id
    _, auth_token = await _make_org_member(session_factory, org_id)
    response = await pe_client.post(
        "/api/v1/organizations/me/events",
        json={
            "organization_id": str(org_id),
            "title": "Test Event",
            "city": "Reims",
            "starts_at": (datetime.now(UTC) + timedelta(days=7)).isoformat(),
            "location_name": "Quelque part",
        },
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 201


@pytest.mark.integration
@pytest.mark.anyio
async def test_create_event_without_org_permission_returns_403(
    pe_client: AsyncClient,
    seeded: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None
    _, auth_token = await _make_auth_user(session_factory)
    response = await pe_client.post(
        "/api/v1/organizations/me/events",
        json={
            "organization_id": str(BELGA_QUEEN_ORG_ID),
            "title": "Test Event",
            "city": "Reims",
            "starts_at": (datetime.now(UTC) + timedelta(days=7)).isoformat(),
            "location_name": "Quelque part",
        },
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 403


@pytest.mark.integration
@pytest.mark.anyio
async def test_active_partner_member_can_create_event(
    pe_client: AsyncClient,
    seeded: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None
    _, auth_token = await _make_org_member(session_factory, BELGA_QUEEN_ORG_ID)
    response = await pe_client.post(
        "/api/v1/organizations/me/events",
        json={
            "organization_id": str(BELGA_QUEEN_ORG_ID),
            "title": "Afterwork test",
            "city": "Reims",
            "starts_at": (datetime.now(UTC) + timedelta(days=7)).isoformat(),
            "location_name": "Belga Queen",
        },
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 201


@pytest.mark.integration
@pytest.mark.anyio
async def test_signed_partner_cannot_create_event(
    pe_client: AsyncClient,
    seeded: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None
    _, auth_token = await _make_org_member(session_factory, DAIBOKEN_ORG_ID)
    response = await pe_client.post(
        "/api/v1/organizations/me/events",
        json={
            "organization_id": str(DAIBOKEN_ORG_ID),
            "title": "Test Event",
            "city": "Reims",
            "starts_at": (datetime.now(UTC) + timedelta(days=7)).isoformat(),
            "location_name": "Daiboken",
        },
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "PARTNER_NOT_ACTIVE"


@pytest.mark.integration
@pytest.mark.anyio
async def test_list_events_exposes_organization_is_partner(
    pe_client: AsyncClient,
    seeded: None,
) -> None:
    response = await pe_client.get(
        "/api/v1/events", params={"city": "Reims", "page_size": 50}
    )
    assert response.status_code == 200
    items = response.json()["items"]
    partner_events = [i for i in items if i.get("organization") and i["organization"].get("is_partner")]
    assert len(partner_events) >= 1
    for item in partner_events:
        assert item["organization"]["partner_status"] in ("active", "premium", "founding_partner")


@pytest.mark.integration
@pytest.mark.anyio
async def test_list_events_filter_by_organization_slug(
    pe_client: AsyncClient,
    seeded: None,
) -> None:
    response = await pe_client.get(
        "/api/v1/events",
        params={"city": "Reims", "organization_slug": "belga-queen", "page_size": 20},
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) >= 1
    for item in items:
        assert item["organization"]["slug"] == "belga-queen"


@pytest.mark.integration
@pytest.mark.anyio
async def test_partner_events_endpoint_returns_future_events(
    pe_client: AsyncClient,
    seeded: None,
) -> None:
    response = await pe_client.get(
        "/api/v1/partners/belga-queen/events",
        params={"city": "Reims"},
    )
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) >= 1
    for item in items:
        assert item["organization"]["slug"] == "belga-queen"


@pytest.mark.integration
@pytest.mark.anyio
async def test_partner_events_signed_partner_returns_404(
    pe_client: AsyncClient,
    seeded: None,
) -> None:
    response = await pe_client.get(
        "/api/v1/partners/daiboken/events",
        params={"city": "Reims"},
    )
    assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.anyio
async def test_event_response_does_not_expose_internal_partner_fields(
    pe_client: AsyncClient,
    seeded: None,
) -> None:
    response = await pe_client.get(
        "/api/v1/events",
        params={"city": "Reims", "organization_slug": "belga-queen", "page_size": 5},
    )
    assert response.status_code == 200
    for item in response.json()["items"]:
        org = item.get("organization") or {}
        for forbidden in ("contact_email", "contact_phone", "contract_reference", "notes_internal"):
            assert forbidden not in org, f"Internal field '{forbidden}' exposed"


@pytest.mark.integration
@pytest.mark.anyio
async def test_seed_partner_events_idempotent(
    partner_events_env: None,
) -> None:
    session_factory = get_session_factory()
    if session_factory is None:
        pytest.skip("Session factory not configured")
    async with session_factory() as session:
        await seed_reims_signed_partners(session)
        await seed_reims_partner_events(session)
        await session.commit()
        count_first = await session.scalar(
            select(func.count()).select_from(LocalEvent).where(
                LocalEvent.event_type == "partner_event"
            )
        )
    async with session_factory() as session:
        await seed_reims_partner_events(session)
        await session.commit()
        count_second = await session.scalar(
            select(func.count()).select_from(LocalEvent).where(
                LocalEvent.event_type == "partner_event"
            )
        )
    assert count_first == count_second
    assert count_second is not None
    assert count_second >= len(REIMS_PARTNER_EVENTS_SEED)
```

- [ ] **Step 2: Run tests (expect skip without DATABASE_URL)**

```powershell
Set-Location "C:\Users\kyria\yunicity\backend"
uv run pytest tests/test_partner_events_api.py -q -m integration
```

Expected: all 10 tests skip (no DATABASE_URL) or pass (if DATABASE_URL set).

- [ ] **Step 3: Commit**

```
git add backend/tests/test_partner_events_api.py
git commit -m "test(events): add 10 integration tests for partner events flow"
```

---

## Task 10: Backend quality

**Files:** all modified backend files

- [ ] **Step 1: Check no migration needed**

```powershell
Set-Location "C:\Users\kyria\yunicity\backend"
uv run alembic revision --autogenerate -m "no-op partner events check"
```

Open the generated file. If it has real DDL (CREATE TABLE, ALTER TABLE, ADD COLUMN), something is wrong — stop and investigate. The file body should be `pass` in both `upgrade()` and `downgrade()`, confirming no schema change needed.

Apply it:
```powershell
uv run alembic upgrade head
```

- [ ] **Step 2: Run ruff**

```powershell
uv run ruff check app/api/v1/events.py app/api/v1/partners.py app/services/local_event_service.py app/schemas/local_event.py app/repositories/local_event_repository.py app/db/seeds/reims_partner_events.py tests/test_partner_events_api.py
```

Expected: `All checks passed!` — fix any issues before continuing.

- [ ] **Step 3: Run mypy**

```powershell
uv run mypy app/api/v1/events.py app/api/v1/partners.py app/services/local_event_service.py app/schemas/local_event.py app/repositories/local_event_repository.py app/db/seeds/reims_partner_events.py tests/test_partner_events_api.py
```

Expected: `Success: no issues found`

- [ ] **Step 4: Commit fixes if any**

```
git add -p
git commit -m "fix(events): ruff/mypy cleanups for WEB-PARTNERS-05A backend"
```

---

## Task 11: Frontend quality

- [ ] **Step 1: Run utils tests**

```powershell
Set-Location "C:\Users\kyria\yunicity\frontend"
pnpm --filter @yunicity/utils test 2>&1 | Select-Object -Last 6
```

Expected: all tests pass (previous 344 + ~11 new from partner-events-utils).

- [ ] **Step 2: Run typecheck**

```powershell
pnpm --filter web typecheck
```

Expected: no errors.

- [ ] **Step 3: Run build**

```powershell
pnpm --filter web build 2>&1 | Select-Object -Last 10
```

Expected: successful build, 30+ routes.

- [ ] **Step 4: Commit quality fixes if any**

```
git add -p
git commit -m "fix(web): typecheck and build fixes for WEB-PARTNERS-05A frontend"
```

---

## Final checklist (acceptance criteria)

- [ ] `LocalEventOrganizationSummary` has `is_partner: bool` and `partner_status: str | None`
- [ ] `GET /events`, `GET /events/{id}`, `GET /map/events` all return `organization.is_partner` and `organization.partner_status`
- [ ] `GET /events?organization_slug=belga-queen` filters correctly
- [ ] `GET /partners/{slug}/events` returns upcoming approved events for active partners
- [ ] `GET /partners/{slug}/events` for `signed`/`paused` partner → 404
- [ ] Creating event as `signed` partner → 403 `PARTNER_NOT_ACTIVE`
- [ ] Creating event as org without partner_profile → allowed
- [ ] `organization.contact_email`, `.contract_reference`, `.notes_internal` never in response
- [ ] 4 pilot partner events seeded idempotently
- [ ] `event_type = "partner_event"` for all seeded events
- [ ] `starts_at = now + 14d` at seed run time
- [ ] Frontend `LocalEventOrganization` has `is_partner?` and `partner_status?`
- [ ] `eventIsPartnerEvent`, `eventOrganizerLabel`, `eventPartnerBadgeLabel`, `buildPartnerEventsUrl` work correctly
- [ ] All 10 backend tests pass or skip
- [ ] All utils tests pass
- [ ] `pnpm --filter web typecheck` clean
- [ ] `pnpm --filter web build` clean
