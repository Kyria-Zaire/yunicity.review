# WEB-PARTNERS-04A — Signed QR Passport Stamp Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a user-claim QR stamp flow where a partner generates a signed JWT QR URL; when a user opens it, the backend verifies the signature and creates one Passport stamp per organization per passport for life.

**Architecture:** JWT-only HS256, no new DB tables, no new constraints. Extends `PassportStampSource` enum with `QR`. Reuses `add_stamp_if_missing()` for idempotent creation. Two new endpoints: `POST /api/v1/partners/{slug}/passport-qr` (partner) and `POST /api/v1/passport/stamps/claim` (user). DO NOT touch `scan.py` or `scan_redemption_service.py` — that flow stays `ORGANIZATION`.

**Tech Stack:** FastAPI, SQLAlchemy 2 async, PyJWT (`PyJWT` package already in deps), Pydantic v2, Next.js 15 App Router, TypeScript strict.

**Spec:** `docs/superpowers/specs/2026-05-30-web-partners-04a-design.md`

---

## File Map

### New files

| File | Purpose |
|------|---------|
| `backend/app/core/passport_stamp_qr.py` | JWT generation + verification for partner QR tokens |
| `backend/app/schemas/passport_stamp_claim.py` | Pydantic schemas: QR generate request/response, claim request/response |
| `backend/app/services/passport_stamp_claim_service.py` | Claim business logic: verify JWT → validate partner/offer → call `add_stamp_if_missing` |
| `backend/tests/test_passport_stamp_qr.py` | 11 integration tests |
| `frontend/apps/web/app/passport/stamp/claim/page.tsx` | Claim page: auto-fires claim on load, renders 5 states |
| `frontend/apps/web/components/passport/passport-stamps-section.tsx` | Stamp history section for Passport dashboard |
| `frontend/packages/utils/src/passport-stamp-claim.ts` | Claim utils: API calls, labels, URL builder |
| `frontend/packages/utils/src/passport-stamp-claim.test.ts` | Utils tests |

### Modified files

| File | Change |
|------|--------|
| `backend/app/core/passport_constants.py` | Add `QR = "qr"` to `PassportStampSource` |
| `backend/app/repositories/passport_repository.py` | Add `stamp_source` + `metadata` params to `add_stamp_if_missing()` (with defaults); add `get_stamp_with_org()` |
| `backend/app/repositories/partner_repository.py` | Add `get_by_partner_profile_id()` method |
| `backend/app/api/v1/partners.py` | Add `POST /{slug}/passport-qr` endpoint |
| `backend/app/api/v1/passport.py` | Add `POST /stamps/claim` endpoint |
| `frontend/packages/types/src/passport.ts` | Update `PassportStampSource` type; add `PassportStampClaimResult`, `PassportQrTokenResponse` |
| `frontend/packages/utils/src/index.ts` | Re-export new stamp claim utils |
| `frontend/apps/web/hooks/use-passport-stamps.ts` | Already exists — verify it fetches from `GET /passport/stamps` |
| `frontend/apps/web/components/passport/passport-dashboard-screen.tsx` | Add `PassportStampsSection` to overview tab |

---

## Task 1: Extend PassportStampSource enum

**Files:**
- Modify: `backend/app/core/passport_constants.py`

- [ ] **Step 1: Add QR value to the enum**

In `backend/app/core/passport_constants.py`, find `PassportStampSource` and add `QR`:

```python
class PassportStampSource(StrEnum):
    """MVP: ORGANIZATION = partner scanned user QR; QR = user claimed partner QR."""

    ORGANIZATION = "organization"
    QR = "qr"
```

- [ ] **Step 2: Generate an informational migration**

The column stores `String(32)`, not a PostgreSQL enum type — no schema change is needed. Create the migration for tracking purposes:

```bash
cd backend
uv run alembic revision -m "add qr to passport_stamp_source"
```

Open the generated file in `backend/alembic/versions/` and fill it like this (replace the existing `pass` stubs):

```python
def upgrade() -> None:
    # PassportStampSource is stored as String(32) — no DDL change needed.
    # This migration documents the addition of the 'qr' source value.
    pass


def downgrade() -> None:
    pass
```

- [ ] **Step 3: Apply migration**

```bash
uv run alembic upgrade head
```

Expected: `Running upgrade <prev> -> <new>, add qr to passport_stamp_source`

- [ ] **Step 4: Commit**

```bash
git add backend/app/core/passport_constants.py backend/alembic/versions/
git commit -m "feat(passport): add QR value to PassportStampSource enum"
```

---

## Task 2: JWT helper — passport_stamp_qr.py

**Files:**
- Create: `backend/app/core/passport_stamp_qr.py`

The JWT secret key and algorithm already exist in `Settings` (`jwt_secret_key`, `jwt_algorithm`). PyJWT is already installed (used in `security.py`). This file is separate from `passport_qr.py` which handles user-facing QR token payloads.

- [ ] **Step 1: Create the file**

```python
"""Partner Passport stamp QR token helpers — JWT-only MVP (WEB-PARTNERS-04A).

Separate from passport_qr.py which handles user-facing Passport QR tokens.
"""

from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt

from app.core.config import Settings, get_settings
from app.core.errors import AppError

STAMP_QR_TOKEN_TYPE = "passport_stamp"
STAMP_QR_DEFAULT_EXPIRES_MINUTES = 1440  # 24h
STAMP_QR_MAX_EXPIRES_MINUTES = 1440


def generate_stamp_qr_token(
    *,
    organization_id: str,
    partner_profile_id: str,
    partner_offer_id: str | None = None,
    expires_in_minutes: int = STAMP_QR_DEFAULT_EXPIRES_MINUTES,
    settings: Settings | None = None,
) -> tuple[str, datetime]:
    """Return (signed_jwt, expires_at). Nonce is embedded for log traceability only."""
    settings = settings or get_settings()
    now = datetime.now(UTC)
    minutes = min(max(expires_in_minutes, 1), STAMP_QR_MAX_EXPIRES_MINUTES)
    expires_at = now + timedelta(minutes=minutes)
    payload: dict[str, Any] = {
        "typ": STAMP_QR_TOKEN_TYPE,
        "organization_id": organization_id,
        "partner_profile_id": partner_profile_id,
        "nonce": secrets.token_urlsafe(16),
        "iat": now,
        "exp": expires_at,
    }
    if partner_offer_id is not None:
        payload["partner_offer_id"] = partner_offer_id
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, expires_at


def decode_stamp_qr_token(
    token: str,
    *,
    settings: Settings | None = None,
) -> dict[str, Any]:
    """Decode and validate a partner stamp QR token. Raises AppError on failure."""
    settings = settings or get_settings()
    try:
        payload: dict[str, Any] = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.ExpiredSignatureError as exc:
        raise AppError(
            status_code=410,
            code="STAMP_TOKEN_EXPIRED",
            detail="Ce QR a expiré.",
        ) from exc
    except jwt.PyJWTError as exc:
        raise AppError(
            status_code=400,
            code="STAMP_TOKEN_INVALID",
            detail="Ce QR n'est pas valide.",
        ) from exc
    if payload.get("typ") != STAMP_QR_TOKEN_TYPE:
        raise AppError(
            status_code=400,
            code="STAMP_TOKEN_INVALID",
            detail="Ce QR n'est pas valide.",
        )
    for required in ("organization_id", "partner_profile_id", "nonce"):
        if not payload.get(required):
            raise AppError(
                status_code=400,
                code="STAMP_TOKEN_INVALID",
                detail="Ce QR n'est pas valide.",
            )
    return payload
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/core/passport_stamp_qr.py
git commit -m "feat(passport): add partner stamp QR JWT helper"
```

---

## Task 3: Claim schemas

**Files:**
- Create: `backend/app/schemas/passport_stamp_claim.py`

- [ ] **Step 1: Create the file**

```python
"""Passport stamp QR claim API schemas (WEB-PARTNERS-04A)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class StampQrGenerateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    partner_offer_id: UUID | None = None
    expires_in_minutes: int = Field(default=1440, ge=1, le=1440)


class StampQrGenerateResponse(BaseModel):
    qr_url: str
    expires_at: datetime


class StampClaimRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: str = Field(min_length=16, max_length=2048)


class StampClaimOrganizationItem(BaseModel):
    id: UUID
    slug: str
    name: str
    city: str
    logo_url: str | None = None


class StampClaimItem(BaseModel):
    id: UUID
    organization_id: UUID
    organization: StampClaimOrganizationItem
    stamp_source: str
    stamped_at: datetime


class StampClaimPassportSummary(BaseModel):
    stamps_count: int
    tier_code: str


class StampClaimResponse(BaseModel):
    """Unified response for both 201 (created) and 200 (already_claimed)."""

    status: str  # "created" | "already_claimed"
    already_claimed: bool
    stamp: StampClaimItem
    passport: StampClaimPassportSummary
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/schemas/passport_stamp_claim.py
git commit -m "feat(passport): add stamp QR claim request/response schemas"
```

---

## Task 4: Repository additions

**Files:**
- Modify: `backend/app/repositories/passport_repository.py`
- Modify: `backend/app/repositories/partner_repository.py`

### 4A — PassportRepository

Add `stamp_source` and `metadata` params to `add_stamp_if_missing()`. Add `get_stamp_with_org()` to load a stamp with its organization for claim response.

- [ ] **Step 1: Update `add_stamp_if_missing` signature**

Find the current implementation (around line 118) and replace it:

```python
async def add_stamp_if_missing(
    self,
    *,
    passport_id: uuid.UUID,
    organization_id: uuid.UUID,
    stamped_at: datetime,
    stamp_source: PassportStampSource = PassportStampSource.ORGANIZATION,
    metadata: dict[str, object] | None = None,
) -> bool:
    existing = await self._session.execute(
        select(PassportStamp.id).where(
            PassportStamp.passport_id == passport_id,
            PassportStamp.organization_id == organization_id,
        )
    )
    if existing.scalar_one_or_none() is not None:
        return False

    passport = await self._session.get(Passport, passport_id)
    if passport is None:
        return False

    stamp = PassportStamp(
        passport_id=passport_id,
        organization_id=organization_id,
        stamp_source=stamp_source,
        stamped_at=stamped_at,
        metadata_=metadata or {},
    )
    self._session.add(stamp)
    passport.stamps_count = passport.stamps_count + 1
    passport.last_stamp_at = stamped_at
    await self._session.flush()
    return True
```

**Important:** The existing call in `scan_redemption_service.py` does not pass `stamp_source` or `metadata`. Since both have defaults (`ORGANIZATION` and `None`), that call is unchanged. Do NOT modify `scan_redemption_service.py`.

- [ ] **Step 2: Add `get_stamp_with_org` method**

After `add_stamp_if_missing`, add:

```python
async def get_stamp_with_org(
    self,
    *,
    passport_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> PassportStamp | None:
    result = await self._session.execute(
        select(PassportStamp)
        .options(selectinload(PassportStamp.organization))
        .where(
            PassportStamp.passport_id == passport_id,
            PassportStamp.organization_id == organization_id,
        )
    )
    return result.scalar_one_or_none()
```

### 4B — PartnerRepository

Add `get_by_partner_profile_id()` — needed by the claim service to validate partner status from the JWT's `partner_profile_id`.

- [ ] **Step 3: Add `get_by_partner_profile_id` to PartnerRepository**

After the existing `get_by_organization_id` method:

```python
async def get_by_partner_profile_id(self, profile_id: UUID) -> PartnerProfile | None:
    stmt = (
        select(PartnerProfile)
        .options(joinedload(PartnerProfile.organization))
        .where(PartnerProfile.id == profile_id)
        .limit(1)
    )
    result = await self._session.execute(stmt)
    return result.scalars().unique().one_or_none()
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/repositories/passport_repository.py backend/app/repositories/partner_repository.py
git commit -m "feat(passport): extend add_stamp_if_missing with source/metadata; add stamp/partner repo lookups"
```

---

## Task 5: Claim service

**Files:**
- Create: `backend/app/services/passport_stamp_claim_service.py`

- [ ] **Step 1: Create the file**

```python
"""Passport stamp QR claim service — MVP (WEB-PARTNERS-04A)."""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.partner_constants import PUBLIC_PARTNER_STATUSES, PartnerStatus
from app.core.passport_constants import PassportStampSource
from app.core.passport_stamp_qr import decode_stamp_qr_token
from app.models.user import User
from app.repositories.partner_offer_repository import PartnerOfferRepository
from app.repositories.partner_repository import PartnerRepository
from app.repositories.passport_repository import PassportRepository
from app.schemas.passport_stamp_claim import (
    StampClaimItem,
    StampClaimOrganizationItem,
    StampClaimPassportSummary,
    StampClaimResponse,
)
from app.services.passport_level_hooks import evaluate_passport_level_after_activity

logger = logging.getLogger(__name__)


class PassportStampClaimService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._passports = PassportRepository(session)
        self._partners = PartnerRepository(session)
        self._offers = PartnerOfferRepository(session)

    async def claim(self, user: User, token: str) -> tuple[StampClaimResponse, bool]:
        """Return (response, created). `created` is True for 201, False for 200."""
        # 1. Verify JWT — raises 400 STAMP_TOKEN_INVALID or 410 STAMP_TOKEN_EXPIRED
        payload = decode_stamp_qr_token(token)

        organization_id = uuid.UUID(payload["organization_id"])
        partner_profile_id = uuid.UUID(payload["partner_profile_id"])
        partner_offer_id_str: str | None = payload.get("partner_offer_id")
        nonce: str = payload.get("nonce", "")
        now = datetime.now(UTC)

        # 2. Validate partner is active (active/premium/founding_partner)
        profile = await self._partners.get_by_partner_profile_id(partner_profile_id)
        if profile is None:
            raise AppError(400, "STAMP_TOKEN_INVALID", "Ce QR n'est pas valide.")
        status = (
            profile.partner_status
            if isinstance(profile.partner_status, PartnerStatus)
            else PartnerStatus(profile.partner_status)
        )
        if status not in PUBLIC_PARTNER_STATUSES:
            raise AppError(403, "PARTNER_NOT_ACTIVE", "Ce partenaire n'est pas actif pour le moment.")

        # 3. Validate offer if present
        partner_offer_id: uuid.UUID | None = None
        if partner_offer_id_str is not None:
            partner_offer_id = uuid.UUID(partner_offer_id_str)
            offer = await self._offers.get_by_id(partner_offer_id)
            if offer is None or not offer.is_active:
                raise AppError(410, "OFFER_NOT_ACTIVE_OR_EXPIRED", "Cette offre n'est plus disponible.")
            if offer.valid_until and offer.valid_until < now:
                raise AppError(410, "OFFER_NOT_ACTIVE_OR_EXPIRED", "Cette offre a expiré.")

        # 4. Load user passport
        passport = await self._passports.get_active_for_user(user.id)
        if passport is None:
            raise AppError(404, "PASSPORT_NOT_FOUND", "Passport actif introuvable.")

        # 5. Attempt stamp — idempotent via unique(passport_id, organization_id)
        metadata: dict[str, object] = {"nonce": nonce, "qr_version": 1}
        if partner_offer_id is not None:
            metadata["partner_offer_id"] = str(partner_offer_id)

        created = await self._passports.add_stamp_if_missing(
            passport_id=passport.id,
            organization_id=organization_id,
            stamped_at=now,
            stamp_source=PassportStampSource.QR,
            metadata=metadata,
        )

        logger.info(
            "stamp_qr_claim",
            extra={
                "user_id": str(user.id),
                "organization_id": str(organization_id),
                "partner_profile_id": str(partner_profile_id),
                "created": created,
                "nonce": nonce,
            },
        )

        if created:
            await self._session.commit()
            await self._session.refresh(passport)
            await evaluate_passport_level_after_activity(self._session, passport.id)
        else:
            # Stamp already exists — no DB write, no commit needed.
            await self._session.refresh(passport)

        # 6. Build response — load stamp with org for display
        stamp = await self._passports.get_stamp_with_org(
            passport_id=passport.id,
            organization_id=organization_id,
        )
        if stamp is None:
            raise AppError(500, "STAMP_LOAD_ERROR", "Erreur interne lors du chargement du tampon.")

        org = stamp.organization
        tier_code = passport.tier.code if passport.tier else "basic"
        stamp_source_val = (
            stamp.stamp_source
            if isinstance(stamp.stamp_source, str)
            else stamp.stamp_source.value
        )

        response = StampClaimResponse(
            status="created" if created else "already_claimed",
            already_claimed=not created,
            stamp=StampClaimItem(
                id=stamp.id,
                organization_id=stamp.organization_id,
                organization=StampClaimOrganizationItem(
                    id=org.id,
                    slug=org.slug,
                    name=org.name,
                    city=org.city,
                    logo_url=org.logo_url,
                ) if org else StampClaimOrganizationItem(
                    id=organization_id,
                    slug="",
                    name="Partenaire",
                    city="",
                ),
                stamp_source=stamp_source_val,
                stamped_at=stamp.stamped_at,
            ),
            passport=StampClaimPassportSummary(
                stamps_count=passport.stamps_count,
                tier_code=tier_code,
            ),
        )
        return response, created
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/services/passport_stamp_claim_service.py
git commit -m "feat(passport): add PassportStampClaimService for QR stamp claim flow"
```

---

## Task 6: QR generation endpoint

**Files:**
- Modify: `backend/app/api/v1/partners.py`

Add `POST /{slug}/passport-qr`. Permission: org owner/staff via `OrganizationMembershipService`. Partner must be `active|premium|founding_partner`.

- [ ] **Step 1: Add imports to `partners.py`**

Add to the existing imports at the top of `backend/app/api/v1/partners.py`:

```python
from typing import Annotated

from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_authenticated_user
from app.core.errors import AppError
from app.core.partner_constants import PUBLIC_PARTNER_STATUSES, PartnerStatus
from app.core.passport_stamp_qr import generate_stamp_qr_token
from app.db.session import get_db
from app.models.user import User
from app.schemas.partner import PartnerListResponse, PartnerPublicDetail
from app.schemas.partner_offer_public import PartnerOfferPublicListResponse
from app.schemas.passport_stamp_claim import StampQrGenerateRequest, StampQrGenerateResponse
from app.services.organization_membership_service import OrganizationMembershipService
from app.services.partner_service import PartnerService, default_partner_list_limit
from app.services.public_partner_offer_service import PublicPartnerOfferService
```

(Merge with existing imports — do not duplicate what's already there.)

- [ ] **Step 2: Add the route**

Add this route **before** `GET /{slug}` (FastAPI matches in order — put specific paths before generic `{slug}` paths):

```python
@router.post("/{slug}/passport-qr", response_model=StampQrGenerateResponse)
async def generate_partner_passport_qr(
    slug: str,
    payload: Annotated[StampQrGenerateRequest, Body()],
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    city: str = Query(default="Reims", min_length=1, max_length=128),
) -> StampQrGenerateResponse:
    profile = await PartnerService(session).get_profile_for_qr(
        slug=slug, city=city, user=current_user
    )
    token, expires_at = generate_stamp_qr_token(
        organization_id=str(profile.organization_id),
        partner_profile_id=str(profile.id),
        partner_offer_id=str(payload.partner_offer_id) if payload.partner_offer_id else None,
        expires_in_minutes=payload.expires_in_minutes,
    )
    qr_url = f"/passport/stamp/claim?token={token}"
    return StampQrGenerateResponse(qr_url=qr_url, expires_at=expires_at)
```

- [ ] **Step 3: Add `get_profile_for_qr` to `PartnerService`**

Open `backend/app/services/partner_service.py`. Add this method to the `PartnerService` class:

```python
async def get_profile_for_qr(
    self,
    *,
    slug: str,
    city: str,
    user: User,
) -> PartnerProfile:
    """Load partner profile and verify the calling user has org manager rights."""
    from app.repositories.partner_repository import PartnerRepository
    from app.services.organization_membership_service import OrganizationMembershipService
    from app.core.partner_constants import PUBLIC_PARTNER_STATUSES, PartnerStatus
    from app.core.errors import AppError

    profile = await PartnerRepository(self._session).get_by_slug(city=city, slug=slug)
    if profile is None:
        raise AppError(404, "PARTNER_NOT_FOUND", "Partenaire introuvable.")

    status = (
        profile.partner_status
        if isinstance(profile.partner_status, PartnerStatus)
        else PartnerStatus(profile.partner_status)
    )
    if status not in PUBLIC_PARTNER_STATUSES:
        raise AppError(403, "PARTNER_NOT_ACTIVE", "Ce partenaire ne peut pas émettre de QR.")

    await OrganizationMembershipService(self._session).require_offer_manager(
        organization_id=profile.organization_id,
        user_id=user.id,
    )
    return profile
```

**Note:** Check if `PartnerService` already has a `self._session` attribute — it does if it follows the existing pattern in the codebase. If it doesn't use `self._session`, adapt the import/call pattern accordingly.

- [ ] **Step 4: Commit**

```bash
git add backend/app/api/v1/partners.py backend/app/services/partner_service.py
git commit -m "feat(partners): add POST /{slug}/passport-qr endpoint for stamp QR generation"
```

---

## Task 7: Claim endpoint

**Files:**
- Modify: `backend/app/api/v1/passport.py`

Add `POST /stamps/claim`. Uses `PassportStampClaimService`. Returns 201 for new stamp, 200 for already_claimed.

- [ ] **Step 1: Add imports**

In `backend/app/api/v1/passport.py`, add to the imports:

```python
from fastapi.responses import Response as FastAPIResponse
from app.core.rate_limit import enforce_rate_limit
from app.schemas.passport_stamp_claim import StampClaimRequest, StampClaimResponse
from app.services.passport_stamp_claim_service import PassportStampClaimService
```

(Merge with existing — `enforce_rate_limit` may already be imported.)

- [ ] **Step 2: Add the route**

Add after the existing `GET /stamps` route:

```python
@router.post("/stamps/claim", response_model=StampClaimResponse)
async def claim_passport_stamp(
    payload: StampClaimRequest,
    request: Request,
    current_user: Annotated[User, Depends(require_authenticated_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    response: FastAPIResponse,
) -> StampClaimResponse:
    await enforce_rate_limit(
        f"stamp:claim:{current_user.id}",
        limit=20,
        window_seconds=3600,
    )
    result, created = await PassportStampClaimService(session).claim(current_user, payload.token)
    response.status_code = 201 if created else 200
    return result
```

- [ ] **Step 3: Verify `Request` is already imported**

The existing `passport.py` imports `from fastapi import APIRouter, Body, Depends, Query, Request` — confirm `Request` is there. If not, add it.

- [ ] **Step 4: Commit**

```bash
git add backend/app/api/v1/passport.py
git commit -m "feat(passport): add POST /stamps/claim endpoint for QR stamp claim"
```

---

## Task 8: Backend integration tests

**Files:**
- Create: `backend/tests/test_passport_stamp_qr.py`

All tests are integration tests that skip when `DATABASE_URL` is not set.

- [ ] **Step 1: Create the test file**

```python
"""Passport stamp QR claim integration tests (WEB-PARTNERS-04A)."""

from __future__ import annotations

import os
import time
import uuid
from collections.abc import AsyncGenerator, Iterator

import jwt
import pytest
from app.core.config import get_settings
from app.core.partner_constants import PartnerStatus
from app.core.passport_constants import PassportStampSource
from app.core.passport_stamp_qr import STAMP_QR_TOKEN_TYPE, generate_stamp_qr_token
from app.db.seeds.reims_signed_partners import seed_reims_signed_partners
from app.db.session import dispose_db, get_session_factory, init_db
from app.main import create_app
from app.models.organization import Organization
from app.models.partner_profile import PartnerProfile
from app.models.passport import Passport, PassportStamp
from app.models.user import User
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select


def _database_url() -> str | None:
    return os.environ.get("DATABASE_URL")


@pytest.fixture
def stamp_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    database_url = _database_url()
    if not database_url:
        pytest.skip("DATABASE_URL not set — skip stamp QR integration tests")
    monkeypatch.setenv("DATABASE_URL", database_url)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
async def stamp_client(stamp_env: None) -> AsyncGenerator[AsyncClient, None]:
    settings = get_settings()
    init_db(settings)
    application = create_app()
    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    await dispose_db()


@pytest.fixture
async def seeded_partners(stamp_client: AsyncClient) -> None:
    session_factory = get_session_factory()
    if session_factory is None:
        pytest.skip("Database session factory not configured")
    async with session_factory() as session:
        await seed_reims_signed_partners(session)
        await session.commit()


async def _create_test_user_with_passport(
    session_factory: object,
) -> tuple[User, Passport, str]:
    """Create a test user, activate their passport, return (user, passport, auth_token)."""
    from app.core.security import create_access_token, hash_password
    from app.models.passport import PassportTier

    factory = session_factory  # type: ignore[assignment]
    async with factory() as session:
        # Create user
        test_user = User(
            id=uuid.uuid4(),
            email=f"stamp_test_{uuid.uuid4().hex[:8]}@example.com",
            hashed_password=hash_password("TestPassword123!"),
            is_active=True,
        )
        session.add(test_user)

        # Get basic tier
        tier = await session.scalar(
            select(PassportTier).where(PassportTier.code == "basic").limit(1)
        )
        if tier is None:
            from app.db.seeds.passport_tiers import seed_passport_tiers
            await seed_passport_tiers(session)
            await session.flush()
            tier = await session.scalar(
                select(PassportTier).where(PassportTier.code == "basic").limit(1)
            )
        assert tier is not None

        # Create passport
        passport = Passport(
            id=uuid.uuid4(),
            user_id=test_user.id,
            tier_id=tier.id,
            city="Reims",
            passport_number=f"YNCP-{uuid.uuid4().hex[:8].upper()}",
            qr_token=uuid.uuid4().hex,
            stamps_count=0,
        )
        session.add(passport)
        await session.commit()

        auth_token = create_access_token(test_user.id)
        return test_user, passport, auth_token


async def _get_active_org(session_factory: object) -> Organization:
    """Return the first active partner's organization."""
    factory = session_factory  # type: ignore[assignment]
    async with factory() as session:
        result = await session.execute(
            select(Organization)
            .join(PartnerProfile)
            .where(
                PartnerProfile.partner_status.in_(["active", "premium", "founding_partner"])
            )
            .limit(1)
        )
        org = result.scalar_one_or_none()
        assert org is not None, "No active partner org found — seed required"
        return org


async def _get_active_profile(session_factory: object) -> PartnerProfile:
    """Return the first active partner profile."""
    factory = session_factory  # type: ignore[assignment]
    async with factory() as session:
        result = await session.execute(
            select(PartnerProfile)
            .where(
                PartnerProfile.partner_status.in_(["active", "premium", "founding_partner"])
            )
            .limit(1)
        )
        profile = result.scalar_one_or_none()
        assert profile is not None
        return profile


def _make_valid_token(
    organization_id: str,
    partner_profile_id: str,
    *,
    partner_offer_id: str | None = None,
    expires_in_minutes: int = 60,
) -> str:
    token, _ = generate_stamp_qr_token(
        organization_id=organization_id,
        partner_profile_id=partner_profile_id,
        partner_offer_id=partner_offer_id,
        expires_in_minutes=expires_in_minutes,
    )
    return token


def _make_expired_token(organization_id: str, partner_profile_id: str) -> str:
    settings = get_settings()
    import secrets
    from datetime import UTC, datetime, timedelta

    now = datetime.now(UTC)
    payload = {
        "typ": STAMP_QR_TOKEN_TYPE,
        "organization_id": organization_id,
        "partner_profile_id": partner_profile_id,
        "nonce": secrets.token_urlsafe(16),
        "iat": now,
        "exp": now - timedelta(seconds=1),  # already expired
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


@pytest.mark.integration
@pytest.mark.anyio
async def test_claim_valid_token_creates_stamp(
    stamp_client: AsyncClient,
    seeded_partners: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None

    _, _, auth_token = await _create_test_user_with_passport(session_factory)
    profile = await _get_active_profile(session_factory)
    token = _make_valid_token(str(profile.organization_id), str(profile.id))

    response = await stamp_client.post(
        "/api/v1/passport/stamps/claim",
        json={"token": token},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "created"
    assert body["already_claimed"] is False
    assert body["stamp"]["stamp_source"] == "qr"
    assert body["passport"]["stamps_count"] == 1


@pytest.mark.integration
@pytest.mark.anyio
async def test_claim_same_token_twice_returns_already_claimed(
    stamp_client: AsyncClient,
    seeded_partners: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None

    _, _, auth_token = await _create_test_user_with_passport(session_factory)
    profile = await _get_active_profile(session_factory)
    token = _make_valid_token(str(profile.organization_id), str(profile.id))

    first = await stamp_client.post(
        "/api/v1/passport/stamps/claim",
        json={"token": token},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert first.status_code == 201

    second = await stamp_client.post(
        "/api/v1/passport/stamps/claim",
        json={"token": token},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert second.status_code == 200
    assert second.json()["status"] == "already_claimed"
    assert second.json()["already_claimed"] is True


@pytest.mark.integration
@pytest.mark.anyio
async def test_existing_stamp_from_old_flow_returns_already_claimed(
    stamp_client: AsyncClient,
    seeded_partners: None,
) -> None:
    """A stamp created via Mode 1 (ORGANIZATION source) blocks Mode 2 claim."""
    from app.repositories.passport_repository import PassportRepository
    from datetime import UTC, datetime

    session_factory = get_session_factory()
    assert session_factory is not None

    user, passport, auth_token = await _create_test_user_with_passport(session_factory)
    profile = await _get_active_profile(session_factory)

    # Pre-create a stamp with ORGANIZATION source (simulating Mode 1)
    async with session_factory() as session:
        repo = PassportRepository(session)
        await repo.add_stamp_if_missing(
            passport_id=passport.id,
            organization_id=profile.organization_id,
            stamped_at=datetime.now(UTC),
            stamp_source=PassportStampSource.ORGANIZATION,
        )
        await session.commit()

    # Mode 2 claim on the same org should return already_claimed
    token = _make_valid_token(str(profile.organization_id), str(profile.id))
    response = await stamp_client.post(
        "/api/v1/passport/stamps/claim",
        json={"token": token},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 200
    assert response.json()["already_claimed"] is True


@pytest.mark.integration
@pytest.mark.anyio
async def test_claim_expired_token_returns_410(
    stamp_client: AsyncClient,
    seeded_partners: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None

    _, _, auth_token = await _create_test_user_with_passport(session_factory)
    profile = await _get_active_profile(session_factory)
    token = _make_expired_token(str(profile.organization_id), str(profile.id))

    response = await stamp_client.post(
        "/api/v1/passport/stamps/claim",
        json={"token": token},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 410
    assert response.json()["detail"]["code"] == "STAMP_TOKEN_EXPIRED"


@pytest.mark.integration
@pytest.mark.anyio
async def test_claim_invalid_signature_returns_400(
    stamp_client: AsyncClient,
    seeded_partners: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None

    _, _, auth_token = await _create_test_user_with_passport(session_factory)
    profile = await _get_active_profile(session_factory)

    import secrets as _secrets
    from datetime import UTC, datetime, timedelta

    bad_secret = "wrong_secret_key_that_does_not_match"
    payload = {
        "typ": STAMP_QR_TOKEN_TYPE,
        "organization_id": str(profile.organization_id),
        "partner_profile_id": str(profile.id),
        "nonce": _secrets.token_urlsafe(16),
        "iat": datetime.now(UTC),
        "exp": datetime.now(UTC) + timedelta(hours=1),
    }
    bad_token = jwt.encode(payload, bad_secret, algorithm="HS256")

    response = await stamp_client.post(
        "/api/v1/passport/stamps/claim",
        json={"token": bad_token},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "STAMP_TOKEN_INVALID"


@pytest.mark.integration
@pytest.mark.anyio
async def test_claim_signed_partner_returns_403(
    stamp_client: AsyncClient,
    seeded_partners: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None

    _, _, auth_token = await _create_test_user_with_passport(session_factory)

    # Find a signed (non-public) partner
    async with session_factory() as session:
        result = await session.execute(
            select(PartnerProfile)
            .where(PartnerProfile.partner_status == "signed")
            .limit(1)
        )
        signed_profile = result.scalar_one_or_none()
    if signed_profile is None:
        pytest.skip("No signed partner in seed data")

    token = _make_valid_token(str(signed_profile.organization_id), str(signed_profile.id))

    response = await stamp_client.post(
        "/api/v1/passport/stamps/claim",
        json={"token": token},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "PARTNER_NOT_ACTIVE"


@pytest.mark.integration
@pytest.mark.anyio
async def test_claim_unauthenticated_returns_401(
    stamp_client: AsyncClient,
    seeded_partners: None,
) -> None:
    response = await stamp_client.post(
        "/api/v1/passport/stamps/claim",
        json={"token": "any_token"},
    )
    assert response.status_code == 401


@pytest.mark.integration
@pytest.mark.anyio
async def test_claim_response_does_not_expose_internal_fields(
    stamp_client: AsyncClient,
    seeded_partners: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None

    _, _, auth_token = await _create_test_user_with_passport(session_factory)
    profile = await _get_active_profile(session_factory)
    token = _make_valid_token(str(profile.organization_id), str(profile.id))

    response = await stamp_client.post(
        "/api/v1/passport/stamps/claim",
        json={"token": token},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    body = response.json()
    stamp = body["stamp"]
    # Internal fields must not be present
    for forbidden in ("passport_id", "metadata", "stamped_by_user_id", "metadata_"):
        assert forbidden not in stamp, f"Internal field '{forbidden}' exposed in claim response"


@pytest.mark.integration
@pytest.mark.anyio
async def test_list_stamps_returns_only_current_user_stamps(
    stamp_client: AsyncClient,
    seeded_partners: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None

    _, _, auth_token_a = await _create_test_user_with_passport(session_factory)
    _, _, auth_token_b = await _create_test_user_with_passport(session_factory)
    profile = await _get_active_profile(session_factory)

    # User A claims a stamp
    token = _make_valid_token(str(profile.organization_id), str(profile.id))
    claim_response = await stamp_client.post(
        "/api/v1/passport/stamps/claim",
        json={"token": token},
        headers={"Authorization": f"Bearer {auth_token_a}"},
    )
    assert claim_response.status_code == 201

    # User B lists stamps — should see 0
    list_response = await stamp_client.get(
        "/api/v1/passport/stamps",
        headers={"Authorization": f"Bearer {auth_token_b}"},
    )
    assert list_response.status_code == 200
    assert list_response.json()["total"] == 0


@pytest.mark.integration
@pytest.mark.anyio
async def test_generate_qr_requires_auth(stamp_client: AsyncClient) -> None:
    response = await stamp_client.post(
        "/api/v1/partners/belga-queen/passport-qr",
        json={},
    )
    assert response.status_code == 401


@pytest.mark.integration
@pytest.mark.anyio
async def test_generate_qr_non_member_returns_403(
    stamp_client: AsyncClient,
    seeded_partners: None,
) -> None:
    session_factory = get_session_factory()
    assert session_factory is not None

    # User with no org membership
    _, _, auth_token = await _create_test_user_with_passport(session_factory)

    response = await stamp_client.post(
        "/api/v1/partners/belga-queen/passport-qr",
        json={"expires_in_minutes": 60},
        headers={"Authorization": f"Bearer {auth_token}"},
        params={"city": "Reims"},
    )
    assert response.status_code == 403
```

- [ ] **Step 2: Run the tests**

```bash
cd backend
uv run pytest tests/test_passport_stamp_qr.py -q -m integration
```

Expected: all tests PASS (or skip if `DATABASE_URL` not set).

- [ ] **Step 3: Commit**

```bash
git add backend/tests/test_passport_stamp_qr.py
git commit -m "test(passport): add 11 integration tests for QR stamp claim flow"
```

---

## Task 9: Backend quality

**Files:** backend source

- [ ] **Step 1: Run ruff**

```bash
cd backend
uv run ruff check app/core/passport_stamp_qr.py app/api/v1/partners.py app/api/v1/passport.py app/services/passport_stamp_claim_service.py app/services/partner_service.py app/repositories/passport_repository.py app/repositories/partner_repository.py app/schemas/passport_stamp_claim.py tests/test_passport_stamp_qr.py
```

Expected: `All checks passed!`

Fix any reported issues before continuing.

- [ ] **Step 2: Run mypy**

```bash
uv run mypy app/core/passport_stamp_qr.py app/api/v1/partners.py app/api/v1/passport.py app/services/passport_stamp_claim_service.py app/schemas/passport_stamp_claim.py app/repositories/passport_repository.py app/repositories/partner_repository.py tests/test_passport_stamp_qr.py
```

Expected: `Success: no issues found in N source files`

Fix any type errors before continuing.

- [ ] **Step 3: Commit fixes if any**

```bash
git add -p  # stage only quality-fix changes
git commit -m "fix(passport): ruff/mypy cleanups for WEB-PARTNERS-04A backend"
```

---

## Task 10: Frontend types

**Files:**
- Modify: `frontend/packages/types/src/passport.ts`

Check the current content of this file — `PassportStampSource` is exported from there. Add `"qr"` and the new claim types.

- [ ] **Step 1: Read the current file**

Open `frontend/packages/types/src/passport.ts`. Find the `PassportStampSource` type (currently `"organization"`) and the existing `PassportStamp` type.

- [ ] **Step 2: Add QR to PassportStampSource**

Find and update:

```typescript
export type PassportStampSource = "organization" | "qr";
```

- [ ] **Step 3: Add claim result types**

At the end of the file, add:

```typescript
export type PassportStampClaimOrganization = {
  id: string;
  slug: string;
  name: string;
  city: string;
  logo_url: string | null;
};

export type PassportStampClaimItem = {
  id: string;
  organization_id: string;
  organization: PassportStampClaimOrganization;
  stamp_source: PassportStampSource;
  stamped_at: string;
};

export type PassportStampClaimPassportSummary = {
  stamps_count: number;
  tier_code: string;
};

export type PassportStampClaimResult = {
  status: "created" | "already_claimed";
  already_claimed: boolean;
  stamp: PassportStampClaimItem;
  passport: PassportStampClaimPassportSummary;
};

export type PassportQrTokenResponse = {
  qr_url: string;
  expires_at: string;
};
```

- [ ] **Step 4: Export from index.ts**

Open `frontend/packages/types/src/index.ts`. Find the `./passport` export block and add the new types:

```typescript
export type {
  // ... existing exports ...
  PassportQrTokenResponse,
  PassportStampClaimItem,
  PassportStampClaimOrganization,
  PassportStampClaimPassportSummary,
  PassportStampClaimResult,
  // ... rest of existing exports ...
} from "./passport";
```

- [ ] **Step 5: Commit**

```bash
cd frontend
git add packages/types/src/passport.ts packages/types/src/index.ts
git commit -m "feat(types): add PassportStampClaimResult and PassportQrTokenResponse types; extend PassportStampSource with qr"
```

---

## Task 11: Frontend utils + tests

**Files:**
- Create: `frontend/packages/utils/src/passport-stamp-claim.ts`
- Create: `frontend/packages/utils/src/passport-stamp-claim.test.ts`
- Modify: `frontend/packages/utils/src/index.ts`

- [ ] **Step 1: Create the utils file**

```typescript
/** Passport stamp QR claim utilities (WEB-PARTNERS-04A). */

import type { PassportStampClaimResult, PassportStampSource } from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

const STAMP_SOURCE_LABELS: Record<PassportStampSource, string> = {
  organization: "Partenaire",
  qr: "QR",
};

export function passportStampSourceLabel(source: PassportStampSource): string {
  return STAMP_SOURCE_LABELS[source] ?? "Tampon";
}

export function passportStampTypeLabel(source: PassportStampSource): string {
  return passportStampSourceLabel(source);
}

export function formatPassportStampDate(stamped_at: string): string {
  const date = new Date(stamped_at);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function buildPassportStampClaimUrl(token: string): string {
  return `/passport/stamp/claim?token=${encodeURIComponent(token)}`;
}

export class PassportStampClaimApi extends ApiClientBase {
  claimStamp(token: string): Promise<PassportStampClaimResult> {
    return this.postJson<PassportStampClaimResult>("/passport/stamps/claim", { token });
  }
}

export function createPassportStampClaimApi(
  client: AuthClient,
  apiBaseUrl: string,
): PassportStampClaimApi {
  return new PassportStampClaimApi(client, apiBaseUrl);
}
```

- [ ] **Step 2: Create the test file**

```typescript
import { describe, expect, it } from "vitest";

import type { PassportStampClaimResult } from "@yunicity/types";

import {
  buildPassportStampClaimUrl,
  formatPassportStampDate,
  passportStampSourceLabel,
  passportStampTypeLabel,
} from "./passport-stamp-claim";

const BASE_CLAIM: PassportStampClaimResult = {
  status: "created",
  already_claimed: false,
  stamp: {
    id: "stamp-1",
    organization_id: "org-1",
    organization: {
      id: "org-1",
      slug: "cafe-local",
      name: "Café Local",
      city: "Reims",
      logo_url: null,
    },
    stamp_source: "qr",
    stamped_at: "2026-05-30T10:00:00Z",
  },
  passport: {
    stamps_count: 1,
    tier_code: "basic",
  },
};

describe("passport-stamp-claim utils", () => {
  it("passportStampSourceLabel returns correct labels", () => {
    expect(passportStampSourceLabel("qr")).toBe("QR");
    expect(passportStampSourceLabel("organization")).toBe("Partenaire");
  });

  it("passportStampTypeLabel delegates to passportStampSourceLabel", () => {
    expect(passportStampTypeLabel("qr")).toBe("QR");
    expect(passportStampTypeLabel("organization")).toBe("Partenaire");
  });

  it("buildPassportStampClaimUrl encodes token correctly", () => {
    expect(buildPassportStampClaimUrl("abc123")).toBe(
      "/passport/stamp/claim?token=abc123",
    );
    expect(buildPassportStampClaimUrl("a.b+c=d")).toContain("/passport/stamp/claim?token=");
  });

  it("formatPassportStampDate returns French locale date", () => {
    const result = formatPassportStampDate("2026-05-30T10:00:00Z");
    expect(result).toContain("2026");
    expect(result.toLowerCase()).toContain("mai");
  });

  it("formatPassportStampDate returns empty string for invalid date", () => {
    expect(formatPassportStampDate("not-a-date")).toBe("");
  });

  it("already_claimed:true parses as already claimed", () => {
    const alreadyClaimed: PassportStampClaimResult = {
      ...BASE_CLAIM,
      status: "already_claimed",
      already_claimed: true,
    };
    expect(alreadyClaimed.already_claimed).toBe(true);
    expect(alreadyClaimed.status).toBe("already_claimed");
  });

  it("created:false is not a fake stamp — organization name comes from response", () => {
    expect(BASE_CLAIM.stamp.organization.name).toBe("Café Local");
    expect(BASE_CLAIM.stamp.organization.name).not.toBe("");
  });
});
```

- [ ] **Step 3: Export from utils index**

Open `frontend/packages/utils/src/index.ts`. Add exports for the new utils (find the passport-related export block):

```typescript
export {
  buildPassportStampClaimUrl,
  formatPassportStampDate,
  passportStampSourceLabel,
  passportStampTypeLabel,
  PassportStampClaimApi,
  createPassportStampClaimApi,
} from "./passport-stamp-claim";
```

- [ ] **Step 4: Run utils tests**

```bash
cd frontend
pnpm --filter @yunicity/utils test
```

Expected: all tests pass including the new `passport-stamp-claim.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add packages/utils/src/passport-stamp-claim.ts packages/utils/src/passport-stamp-claim.test.ts packages/utils/src/index.ts
git commit -m "feat(utils): add passport stamp claim utils and tests"
```

---

## Task 12: Claim page

**Files:**
- Create: `frontend/apps/web/app/passport/stamp/claim/page.tsx`

This page auto-fires the claim on mount if the user is authenticated. No confirmation screen. Handles all 5 states.

- [ ] **Step 1: Check that the nested directory structure is correct**

The path `app/passport/stamp/claim/page.tsx` maps to `/passport/stamp/claim` in Next.js App Router. Verify `app/passport/` directory already exists (it does — `app/passport/page.tsx` exists).

- [ ] **Step 2: Create the page**

```tsx
"use client";

import { PassportAppShell } from "@/components/passport/passport-app-shell";
import type { PassportStampClaimResult } from "@yunicity/types";
import {
  PASSPORT_STAMP_CLAIM_ALREADY_CLAIMED_BODY,
  PASSPORT_STAMP_CLAIM_CTA_PARTNER,
  PASSPORT_STAMP_CLAIM_CTA_PASSPORT,
  PASSPORT_STAMP_CLAIM_ERROR_BODY,
  PASSPORT_STAMP_CLAIM_EXPIRED_BODY,
  PASSPORT_STAMP_CLAIM_INVALID_BODY,
  PASSPORT_STAMP_CLAIM_LOADING,
  PASSPORT_STAMP_CLAIM_PARTNER_INACTIVE_BODY,
  PASSPORT_STAMP_CLAIM_SUCCESS_BODY,
  PASSPORT_STAMP_CLAIM_SUCCESS_TITLE,
  partnerPublicHref,
} from "@yunicity/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";
import { useYunicityApi } from "@/hooks/use-yunicity-api";

type ClaimState =
  | { kind: "loading" }
  | { kind: "success"; result: PassportStampClaimResult }
  | { kind: "already_claimed"; result: PassportStampClaimResult }
  | { kind: "expired" }
  | { kind: "invalid" }
  | { kind: "partner_inactive" }
  | { kind: "error"; message: string };

function resolveClaimState(error: unknown): ClaimState {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes("STAMP_TOKEN_EXPIRED")) return { kind: "expired" };
    if (msg.includes("STAMP_TOKEN_INVALID")) return { kind: "invalid" };
    if (msg.includes("PARTNER_NOT_ACTIVE")) return { kind: "partner_inactive" };
    return { kind: "error", message: msg };
  }
  return { kind: "error", message: "Erreur inattendue." };
}

export default function PassportStampClaimPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const api = useYunicityApi();
  const [claimState, setClaimState] = useState<ClaimState>({ kind: "loading" });

  const token = searchParams.get("token") ?? "";

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const redirect = encodeURIComponent(`/passport/stamp/claim?token=${token}`);
      router.push(`/login?redirect=${redirect}`);
      return;
    }
    if (!token) {
      setClaimState({ kind: "invalid" });
      return;
    }

    let cancelled = false;
    void api.claimPassportStamp(token).then((result) => {
      if (cancelled) return;
      if (result.already_claimed) {
        setClaimState({ kind: "already_claimed", result });
      } else {
        setClaimState({ kind: "success", result });
      }
    }).catch((err: unknown) => {
      if (cancelled) return;
      setClaimState(resolveClaimState(err));
    });
    return () => { cancelled = true; };
  }, [authLoading, user, token, api, router]);

  return (
    <PassportAppShell>
      <div className="mx-auto max-w-md space-y-8 px-4 py-12">
        {claimState.kind === "loading" ? (
          <div className="rounded-3xl border border-neutral-200/90 bg-white p-8 shadow-sm">
            <p className="text-center text-sm text-neutral-500" role="status">
              {PASSPORT_STAMP_CLAIM_LOADING}
            </p>
          </div>
        ) : claimState.kind === "success" ? (
          <div className="rounded-3xl border border-yunicity-primary/20 bg-white p-8 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-yunicity-primary">Passport</p>
            <h1 className="mt-2 text-2xl font-bold text-neutral-900">{PASSPORT_STAMP_CLAIM_SUCCESS_TITLE}</h1>
            <p className="mt-2 text-sm text-neutral-600">
              {PASSPORT_STAMP_CLAIM_SUCCESS_BODY.replace("{partner}", claimState.result.stamp.organization.name)}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/passport"
                className="flex items-center justify-center rounded-2xl bg-yunicity-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                {PASSPORT_STAMP_CLAIM_CTA_PASSPORT}
              </Link>
              <Link
                href={partnerPublicHref({ slug: claimState.result.stamp.organization.slug, city: claimState.result.stamp.organization.city })}
                className="flex items-center justify-center rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700 hover:border-yunicity-primary/30"
              >
                {PASSPORT_STAMP_CLAIM_CTA_PARTNER}
              </Link>
            </div>
          </div>
        ) : claimState.kind === "already_claimed" ? (
          <div className="rounded-3xl border border-neutral-200/90 bg-white p-8 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Passport</p>
            <h1 className="mt-2 text-xl font-bold text-neutral-900">{PASSPORT_STAMP_CLAIM_ALREADY_CLAIMED_BODY}</h1>
            <div className="mt-6">
              <Link
                href="/passport"
                className="flex items-center justify-center rounded-2xl bg-yunicity-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                {PASSPORT_STAMP_CLAIM_CTA_PASSPORT}
              </Link>
            </div>
          </div>
        ) : claimState.kind === "expired" ? (
          <MessageCard title={PASSPORT_STAMP_CLAIM_EXPIRED_BODY} />
        ) : claimState.kind === "invalid" ? (
          <MessageCard title={PASSPORT_STAMP_CLAIM_INVALID_BODY} />
        ) : claimState.kind === "partner_inactive" ? (
          <MessageCard title={PASSPORT_STAMP_CLAIM_PARTNER_INACTIVE_BODY} />
        ) : (
          <MessageCard title={PASSPORT_STAMP_CLAIM_ERROR_BODY} />
        )}
      </div>
    </PassportAppShell>
  );
}

function MessageCard({ title }: { title: string }) {
  return (
    <div className="rounded-3xl border border-neutral-200/90 bg-white p-8 shadow-sm">
      <p className="text-center text-sm font-medium text-neutral-700">{title}</p>
      <div className="mt-6">
        <Link
          href="/passport"
          className="flex items-center justify-center rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700"
        >
          Mon Passport
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add microcopy constants**

The page uses constants like `PASSPORT_STAMP_CLAIM_SUCCESS_TITLE`. These must exist in the utils package. Open `frontend/packages/utils/src/passport-labels.ts` (or the appropriate labels file) and add:

```typescript
export const PASSPORT_STAMP_CLAIM_LOADING = "Validation de votre tampon…";
export const PASSPORT_STAMP_CLAIM_SUCCESS_TITLE = "Tampon ajouté à votre Passport";
export const PASSPORT_STAMP_CLAIM_SUCCESS_BODY = "Bienvenue chez {partner}. Votre tampon Passport a bien été enregistré.";
export const PASSPORT_STAMP_CLAIM_ALREADY_CLAIMED_BODY = "Ce tampon est déjà dans votre Passport.";
export const PASSPORT_STAMP_CLAIM_EXPIRED_BODY = "Ce QR a expiré. Demandez un nouveau QR au partenaire.";
export const PASSPORT_STAMP_CLAIM_INVALID_BODY = "Ce QR n'est pas valide.";
export const PASSPORT_STAMP_CLAIM_PARTNER_INACTIVE_BODY = "Ce partenaire n'est pas actif pour le moment.";
export const PASSPORT_STAMP_CLAIM_ERROR_BODY = "Une erreur est survenue. Réessayez plus tard.";
export const PASSPORT_STAMP_CLAIM_CTA_PASSPORT = "Voir mon Passport";
export const PASSPORT_STAMP_CLAIM_CTA_PARTNER = "Voir le partenaire";
```

Export these from `frontend/packages/utils/src/index.ts` in the passport labels block.

- [ ] **Step 4: Add `claimPassportStamp` to api client**

Check `frontend/packages/utils/src/yunicity-api.ts` — the main API class. Add a `claimPassportStamp` method that calls `POST /passport/stamps/claim`:

```typescript
claimPassportStamp(token: string): Promise<PassportStampClaimResult> {
  return this.passport.claimStamp(token);
}
```

Where `this.passport` is the `PassportStampClaimApi` instance (or adapt to the existing API class structure in `yunicity-api.ts` — follow the existing pattern for other passport calls like `listPassportOffers`).

- [ ] **Step 5: Commit**

```bash
git add frontend/apps/web/app/passport/stamp/claim/page.tsx frontend/packages/utils/src/passport-labels.ts frontend/packages/utils/src/index.ts frontend/packages/utils/src/yunicity-api.ts
git commit -m "feat(web): add /passport/stamp/claim page with 5 UI states"
```

---

## Task 13: Stamp history section

**Files:**
- Create: `frontend/apps/web/components/passport/passport-stamps-section.tsx`

This component fetches stamps from `GET /passport/stamps` and renders the history. It uses the existing `usePassportStamps` hook if it exists, or fetches directly.

- [ ] **Step 1: Check if `usePassportStamps` hook exists**

Look at `frontend/apps/web/hooks/use-passport-stamps.ts`. If it exists, use it. If it doesn't, the component fetches via the API client directly.

- [ ] **Step 2: Create the component**

```tsx
"use client";

import type { PassportStampResponse } from "@yunicity/types";
import {
  PASSPORT_STAMP_CLAIM_CTA_PARTNER,
  formatPassportStampDate,
  partnerPublicHref,
  passportStampSourceLabel,
} from "@yunicity/utils";
import Link from "next/link";

type PassportStampsSectionProps = {
  stamps: PassportStampResponse[];
  isLoading: boolean;
};

export function PassportStampsSection({ stamps, isLoading }: PassportStampsSectionProps) {
  if (isLoading) {
    return (
      <section className="space-y-3">
        <h3 className="text-xl font-bold text-neutral-900">Tampons récents</h3>
        <p className="text-sm text-neutral-500">Chargement…</p>
      </section>
    );
  }

  return (
    <section className="scroll-mt-28 space-y-4" id="passport-stamps">
      <h3 className="text-xl font-bold text-neutral-900">Tampons récents</h3>
      {stamps.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
          Vos premiers tampons apparaîtront ici lorsque vous visiterez un partenaire Yunicity.
        </p>
      ) : (
        <ul className="space-y-3">
          {stamps.map((stamp) => (
            <li
              key={stamp.id}
              className="flex items-center gap-4 rounded-2xl border border-neutral-100 bg-neutral-50/80 px-4 py-3"
            >
              {stamp.organization?.logo_url ? (
                <img
                  src={stamp.organization.logo_url}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="h-10 w-10 shrink-0 rounded-xl bg-yunicity-primary/10" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-neutral-900">
                  {stamp.organization?.name ?? "Partenaire"}
                </p>
                <p className="text-xs text-neutral-500">
                  {stamp.stamp_source ? passportStampSourceLabel(stamp.stamp_source) : "Tampon"}
                  {" · "}
                  {formatPassportStampDate(stamp.stamped_at.toString())}
                </p>
              </div>
              {stamp.organization && (
                <Link
                  href={partnerPublicHref({ slug: stamp.organization.slug, city: stamp.organization.city })}
                  className="shrink-0 text-xs font-semibold text-yunicity-primary hover:underline"
                >
                  {PASSPORT_STAMP_CLAIM_CTA_PARTNER}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/apps/web/components/passport/passport-stamps-section.tsx
git commit -m "feat(web): add PassportStampsSection component for stamp history in Passport"
```

---

## Task 14: Wire stamps section to passport dashboard

**Files:**
- Modify: `frontend/apps/web/components/passport/passport-dashboard-screen.tsx`
- Modify: `frontend/apps/web/hooks/use-passport-dashboard-context.ts`

The `PassportDashboardScreen` already renders `PassportOffersList` in the `privileges` tab and `PassportPartnerOffersSection` in `overview`. We add `PassportStampsSection` to the `overview` tab, below offers.

- [ ] **Step 1: Check `use-passport-stamps.ts` hook**

Open `frontend/apps/web/hooks/use-passport-stamps.ts`. It should already fetch from `GET /passport/stamps`. Verify it exposes `{ stamps, isLoading }`. If the hook doesn't exist, create it:

```typescript
"use client";

import type { PassportStampResponse } from "@yunicity/types";
import { useCallback, useEffect, useState } from "react";
import { useYunicityApi } from "@/hooks/use-yunicity-api";

export function usePassportStamps(enabled: boolean) {
  const api = useYunicityApi();
  const [stamps, setStamps] = useState<PassportStampResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    try {
      const data = await api.listPassportStamps();
      setStamps(data.items);
    } catch {
      setStamps([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, api]);

  useEffect(() => { void reload(); }, [reload]);

  return { stamps, isLoading };
}
```

- [ ] **Step 2: Verify `api.listPassportStamps()` exists**

Open `frontend/packages/utils/src/passport-api.ts` (or `yunicity-api.ts`). Check for `listPassportStamps`. If missing, add it to call `GET /passport/stamps`:

```typescript
listPassportStamps(params?: { city?: string; source?: string; limit?: number; offset?: number }): Promise<PassportStampListResponse> {
  const search = new URLSearchParams();
  if (params?.city) search.set("city", params.city);
  if (params?.source) search.set("source", params.source);
  if (params?.limit !== undefined) search.set("limit", String(params.limit));
  if (params?.offset !== undefined) search.set("offset", String(params.offset));
  const qs = search.toString();
  return this.getJson<PassportStampListResponse>(`/passport/stamps${qs ? `?${qs}` : ""}`);
}
```

- [ ] **Step 3: Add stamps to `usePassportDashboardContext`**

Open `frontend/apps/web/hooks/use-passport-dashboard-context.ts`.

Find where `usePassportStamps` is called (it should already be there from the existing `PassportStampsList` component). If `stamps` and `stampsLoading` are already in the context return object, nothing to change here. If not, add:

```typescript
const { stamps, isLoading: stampsLoading } = usePassportStamps(hasPassport);
```

And include in the return:
```typescript
stamps,
stampsLoading,
```

- [ ] **Step 4: Add `PassportStampsSection` to overview tab**

In `frontend/apps/web/components/passport/passport-dashboard-screen.tsx`:

Add the import:
```tsx
import { PassportStampsSection } from "./passport-stamps-section";
```

In the `overview` tab section (after `PassportPartnerOffersSection`):
```tsx
<PassportStampsSection stamps={ctx.stamps} isLoading={ctx.stampsLoading} />
```

- [ ] **Step 5: Commit**

```bash
git add frontend/apps/web/components/passport/passport-dashboard-screen.tsx frontend/apps/web/hooks/use-passport-dashboard-context.ts frontend/apps/web/hooks/use-passport-stamps.ts
git commit -m "feat(web): add PassportStampsSection to passport overview tab"
```

---

## Task 15: Frontend quality

- [ ] **Step 1: Run utils tests**

```bash
cd frontend
pnpm --filter @yunicity/utils test
```

Expected: all 337+ tests pass.

- [ ] **Step 2: Run web typecheck**

```bash
pnpm --filter web typecheck
```

Expected: no errors. If errors, fix before proceeding.

- [ ] **Step 3: Run web build**

```bash
pnpm --filter web build
```

Expected: successful build, 30+ routes compiled.

- [ ] **Step 4: Commit any quality fixes**

```bash
git add -p
git commit -m "fix(web): typecheck and build fixes for WEB-PARTNERS-04A frontend"
```

---

## Final checklist (acceptance criteria)

- [ ] `PassportStampSource.QR` enum value exists in Python and TypeScript
- [ ] `POST /api/v1/partners/{slug}/passport-qr` returns `{ qr_url, expires_at }` for org members
- [ ] `POST /api/v1/passport/stamps/claim` returns 201 for new stamp, 200 for already_claimed
- [ ] Claim flow reuses `add_stamp_if_missing()` — idempotent via `unique(passport_id, organization_id)`
- [ ] `signed`/`paused` partners blocked at generation AND claim
- [ ] `stamp_source = QR` only set in `PassportStampClaimService` — `scan_redemption_service.py` unchanged
- [ ] `/passport/stamp/claim?token=...` page handles all 5 states
- [ ] `PassportStampsSection` shows real stamps in `/passport` overview
- [ ] No internal fields (`passport_id`, `metadata_`, `stamped_by_user_id`) in claim response
- [ ] All 11 backend tests pass
- [ ] All frontend utils tests pass
- [ ] `pnpm --filter web typecheck` clean
- [ ] `pnpm --filter web build` clean
