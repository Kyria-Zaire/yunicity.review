# WEB-PARTNERS-05A — Partner Event Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrichir les events avec le statut partenaire de leur organisation, filtrer par `organization_slug`, exposer `/partners/{slug}/events`, seeder 4 events partenaires Reims, et ajouter les types/utils frontend correspondants.

**Architecture:** On enrichit le schéma `LocalEventOrganizationSummary` existant (sans migration), on étend le repository avec un filtre `organization_slug` et une méthode `list_for_partner_slug`, on ajoute une méthode de service dédiée à l'endpoint `/partners/{slug}/events`, et on extende les types TypeScript dans `@yunicity/types`.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2.0 async, Pydantic v2, TypeScript strict, Vitest

---

## File Map

### Backend — fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `backend/app/schemas/local_event.py` | +`is_partner: bool`, `+partner_status: str \| None` dans `LocalEventOrganizationSummary` |
| `backend/app/repositories/local_event_repository.py` | +`list_public_for_organization_slug()`, +`list_public_for_partner_org()` |
| `backend/app/services/local_event_service.py` | +gate partenaire dans `create_for_organization()`, +`list_public` supporte `organization_slug`, +`_to_response` enrichit `is_partner`/`partner_status`, +`list_partner_events()` |
| `backend/app/api/v1/events.py` | +query param `organization_slug` dans `list_local_events` |
| `backend/app/api/v1/partners.py` | +endpoint `GET /partners/{slug}/events` |

### Backend — fichiers créés

| Fichier | Rôle |
|---------|------|
| `backend/app/db/seeds/reims_partner_events.py` | Seed idempotent 4 events partenaires |
| `backend/tests/test_partner_events_api.py` | 10 tests d'intégration |

### Backend — fichiers modifiés (infrastructure)

| Fichier | Changement |
|---------|-----------|
| `backend/app/db/seeds/__main__.py` | Import + appel `seed_reims_partner_events` |

### Frontend — fichiers modifiés

| Fichier | Changement |
|---------|-----------|
| `frontend/packages/types/src/local-event.ts` | +`is_partner: boolean`, `+partner_status: PartnerStatus \| null` dans `LocalEventOrganization` |
| `frontend/packages/types/src/index.ts` | Rien à ajouter si `LocalEventOrganization` déjà exporté |

### Frontend — fichiers créés

| Fichier | Rôle |
|---------|------|
| `frontend/packages/utils/src/partner-events.ts` | Utils : `eventIsPartnerEvent`, `eventOrganizerLabel`, `eventPartnerBadgeLabel`, `buildPartnerEventsUrl` |
| `frontend/packages/utils/src/partner-events.test.ts` | Tests vitest |

---

## Task 1 — Enrichir `LocalEventOrganizationSummary` (schema backend)

**Files:**
- Modify: `backend/app/schemas/local_event.py:17-26`

- [ ] **Step 1 : Ajouter les deux champs au schema**

Remplacer le bloc `LocalEventOrganizationSummary` existant dans `backend/app/schemas/local_event.py` :

```python
class LocalEventOrganizationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    name: str
    city: str
    logo_url: str | None = None
    is_verified: bool = False
    is_partner: bool = False
    partner_status: str | None = None
    created_at: datetime | None = None
```

- [ ] **Step 2 : Vérifier aucune migration nécessaire**

Ces champs sont calculés à la construction du schema, pas stockés. Vérifier qu'il n'y a pas de colonne `is_partner` dans les modèles SQLAlchemy :

```bash
cd backend
grep -r "is_partner" app/models/
```

Résultat attendu : aucun fichier. Ces champs seront peuplés dans `_to_response` (Task 4).

- [ ] **Step 3 : Commit**

```bash
git add backend/app/schemas/local_event.py
git commit -m "feat(events): add is_partner and partner_status to LocalEventOrganizationSummary"
```

---

## Task 2 — Ajouter le filtre `organization_slug` au repository

**Files:**
- Modify: `backend/app/repositories/local_event_repository.py`

- [ ] **Step 1 : Écrire le test qui va échouer**

Dans `backend/tests/test_partner_events_api.py` (créer le fichier) :

```python
"""Partner events API (WEB-PARTNERS-05A)."""

from __future__ import annotations

import pytest
from httpx import AsyncClient

pytestmark = [pytest.mark.integration, pytest.mark.asyncio]


@pytest.mark.integration
@pytest.mark.asyncio
async def test_filter_by_organization_slug_unknown_returns_empty(
    auth_client: AsyncClient,
) -> None:
    """Unknown slug → empty list, no 404."""
    response = await auth_client.get("/api/v1/events?organization_slug=slug-inexistant")
    assert response.status_code == 200
    assert response.json()["items"] == []
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

```bash
cd backend
uv run pytest tests/test_partner_events_api.py::test_filter_by_organization_slug_unknown_returns_empty -v
```

Résultat attendu : FAIL (le param `organization_slug` est ignoré pour l'instant, liste non vide ou le test ne compile pas).

- [ ] **Step 3 : Ajouter `list_public_for_city` avec support `organization_slug`**

Dans `backend/app/repositories/local_event_repository.py`, modifier la méthode `list_public_for_city` pour accepter le filtre optionnel `organization_slug` :

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
    from app.models.organization import Organization  # local import évite circulaire

    stmt = (
        select(LocalEvent)
        .options(
            selectinload(LocalEvent.organization),
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
        stmt = (
            stmt
            .join(Organization, Organization.id == LocalEvent.organization_id)
            .where(Organization.slug == organization_slug.strip().lower())
        )
    result = await self._session.execute(stmt)
    return list(result.scalars().all())
```

Ajouter également une méthode dédiée pour le endpoint `/partners/{slug}/events` :

```python
async def list_public_for_partner_org(
    self,
    *,
    organization_id: uuid.UUID,
    upcoming_only: bool,
    limit: int,
    offset: int,
    now: datetime,
) -> tuple[list[LocalEvent], int]:
    base = (
        select(LocalEvent)
        .options(
            selectinload(LocalEvent.organization),
            selectinload(LocalEvent.neighborhood),
        )
        .where(
            LocalEvent.organization_id == organization_id,
            LocalEvent.moderation_status == LocalEventModerationStatus.APPROVED.value,
            LocalEvent.is_cancelled.is_(False),
            LocalEvent.visibility == "public",
        )
    )
    if upcoming_only:
        base = base.where(LocalEvent.starts_at >= now)

    count_result = await self._session.execute(
        select(func.count()).select_from(base.subquery())
    )
    total = int(count_result.scalar_one())

    result = await self._session.execute(
        base.order_by(LocalEvent.starts_at.asc())
        .limit(limit)
        .offset(offset)
    )
    return list(result.scalars().all()), total
```

S'assurer que `uuid` est déjà importé (il l'est).

- [ ] **Step 4 : Lancer le test**

```bash
cd backend
uv run pytest tests/test_partner_events_api.py::test_filter_by_organization_slug_unknown_returns_empty -v
```

Résultat attendu : FAIL car le service ne passe pas encore `organization_slug` au repo.

- [ ] **Step 5 : Commit intermédiaire**

```bash
git add backend/app/repositories/local_event_repository.py backend/tests/test_partner_events_api.py
git commit -m "feat(events): add organization_slug filter and list_public_for_partner_org to repository"
```

---

## Task 3 — Mettre à jour `list_public` dans le service (filtre organization_slug)

**Files:**
- Modify: `backend/app/services/local_event_service.py:51-80`
- Modify: `backend/app/api/v1/events.py:34-48`

- [ ] **Step 1 : Modifier `list_public` dans le service**

Dans `backend/app/services/local_event_service.py`, modifier la méthode `list_public` :

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

- [ ] **Step 2 : Ajouter le query param `organization_slug` dans la route**

Dans `backend/app/api/v1/events.py`, modifier `list_local_events` :

```python
@router.get("", response_model=LocalEventListResponse)
async def list_local_events(
    session: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
    city: str | None = Query(default=None),
    organization_slug: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(
        default=LOCAL_EVENT_LIST_PAGE_SIZE_DEFAULT,
        ge=1,
        le=LOCAL_EVENT_LIST_PAGE_SIZE_MAX,
    ),
) -> LocalEventListResponse:
    return await LocalEventService(session).list_public(
        current_user,
        city=city,
        page=page,
        page_size=page_size,
        organization_slug=organization_slug,
    )
```

- [ ] **Step 3 : Lancer le test**

```bash
cd backend
uv run pytest tests/test_partner_events_api.py::test_filter_by_organization_slug_unknown_returns_empty -v
```

Résultat attendu : PASS.

- [ ] **Step 4 : Commit**

```bash
git add backend/app/services/local_event_service.py backend/app/api/v1/events.py
git commit -m "feat(events): propagate organization_slug filter through service and route"
```

---

## Task 4 — Gate partenaire dans `create_for_organization` + enrichir `_to_response`

**Files:**
- Modify: `backend/app/services/local_event_service.py`

- [ ] **Step 1 : Écrire les tests**

Ajouter dans `backend/tests/test_partner_events_api.py` :

```python
import uuid
from datetime import UTC, datetime, timedelta

from app.core.organization_constants import (
    OrganizationMemberRole,
    OrganizationMemberStatus,
    OrganizationType,
    OrganizationVisibility,
    VerificationStatus,
)
from app.core.partner_constants import PartnerStatus, PartnershipType
from app.db.session import get_engine
from app.models.organization import Organization, OrganizationMember
from app.models.partner_profile import PartnerProfile
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from tests.conftest_rbac import RbacUserFactory, auth_header


async def _partner_org_owner(
    session: AsyncSession,
    user_id: uuid.UUID,
    suffix: str,
    partner_status: PartnerStatus,
) -> uuid.UUID:
    """Crée une org vérifiée avec PartnerProfile et un membre OWNER."""
    org = Organization(
        slug=f"partner-org-{suffix}",
        name=f"Partner Org {suffix}",
        type=OrganizationType.COMMERCE,
        city="Reims",
        verification_status=VerificationStatus.VERIFIED,
        visibility=OrganizationVisibility.PUBLIC,
    )
    session.add(org)
    await session.flush()
    session.add(
        OrganizationMember(
            organization_id=org.id,
            user_id=user_id,
            role=OrganizationMemberRole.OWNER,
            status=OrganizationMemberStatus.ACTIVE,
        )
    )
    session.add(
        PartnerProfile(
            organization_id=org.id,
            partner_status=partner_status,
            partnership_type=PartnershipType.LOCAL_BUSINESS,
        )
    )
    await session.flush()
    return org.id


@pytest.mark.integration
@pytest.mark.asyncio
async def test_active_partner_can_create_event(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _partner_org_owner(
            session, partner.user_id, "active-ok", PartnerStatus.ACTIVE
        )
        await session.commit()

    starts = datetime.now(UTC) + timedelta(days=14)
    resp = await auth_client.post(
        "/api/v1/organizations/me/events",
        headers=auth_header(partner.access_token),
        json={
            "organization_id": str(org_id),
            "title": "Afterwork pilote",
            "city": "Reims",
            "starts_at": starts.isoformat(),
            "location_name": "Reims centre",
            "event_type": "partner_event",
        },
    )
    assert resp.status_code == 201, resp.text


@pytest.mark.integration
@pytest.mark.asyncio
async def test_signed_partner_cannot_create_event(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _partner_org_owner(
            session, partner.user_id, "signed-blocked", PartnerStatus.SIGNED
        )
        await session.commit()

    starts = datetime.now(UTC) + timedelta(days=14)
    resp = await auth_client.post(
        "/api/v1/organizations/me/events",
        headers=auth_header(partner.access_token),
        json={
            "organization_id": str(org_id),
            "title": "Event bloqué",
            "city": "Reims",
            "starts_at": starts.isoformat(),
            "location_name": "Reims",
            "event_type": "partner_event",
        },
    )
    assert resp.status_code == 403, resp.text
    assert resp.json()["code"] == "PARTNER_NOT_ACTIVE"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_paused_partner_cannot_create_event(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _partner_org_owner(
            session, partner.user_id, "paused-blocked", PartnerStatus.PAUSED
        )
        await session.commit()

    starts = datetime.now(UTC) + timedelta(days=14)
    resp = await auth_client.post(
        "/api/v1/organizations/me/events",
        headers=auth_header(partner.access_token),
        json={
            "organization_id": str(org_id),
            "title": "Event bloqué paused",
            "city": "Reims",
            "starts_at": starts.isoformat(),
            "location_name": "Reims",
        },
    )
    assert resp.status_code == 403, resp.text
    assert resp.json()["code"] == "PARTNER_NOT_ACTIVE"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_classic_org_no_partner_profile_can_create_event(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    """Org sans PartnerProfile → comportement inchangé (pas de gate)."""
    from tests.test_partner_offer_moderation import _verified_org_owner

    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _verified_org_owner(session, partner.user_id, "classic-no-profile")
        await session.commit()

    starts = datetime.now(UTC) + timedelta(days=5)
    resp = await auth_client.post(
        "/api/v1/organizations/me/events",
        headers=auth_header(partner.access_token),
        json={
            "organization_id": str(org_id),
            "title": "Event classique",
            "city": "Reims",
            "starts_at": starts.isoformat(),
            "location_name": "Reims",
        },
    )
    assert resp.status_code == 201, resp.text
```

- [ ] **Step 2 : Lancer les tests pour vérifier qu'ils échouent**

```bash
cd backend
uv run pytest tests/test_partner_events_api.py::test_signed_partner_cannot_create_event tests/test_partner_events_api.py::test_paused_partner_cannot_create_event -v
```

Résultat attendu : FAIL (pas de gate encore).

- [ ] **Step 3 : Ajouter le gate dans `create_for_organization` et enrichir `_to_response`**

Dans `backend/app/services/local_event_service.py` :

**3a. Ajouter l'import en haut (après les imports existants) :**

```python
from app.core.partner_constants import PUBLIC_PARTNER_STATUSES, PartnerStatus
from app.repositories.partner_repository import PartnerRepository
```

**3b. Dans `__init__`, ajouter :**

```python
self._partners = PartnerRepository(session)
```

(après `self._offers = PartnerOfferRepository(session)`)

**3c. Dans `create_for_organization`, après `await self._membership.require_offer_manager(...)` :**

```python
await self._check_partner_status_gate(payload.organization_id)
```

**3d. Ajouter la méthode privée :**

```python
async def _check_partner_status_gate(self, organization_id: uuid.UUID) -> None:
    """Bloque signed/paused si l'org a un PartnerProfile."""
    profile = await self._partners.get_by_organization_id(organization_id)
    if profile is None:
        return
    status = PartnerStatus(profile.partner_status)
    if status not in PUBLIC_PARTNER_STATUSES:
        raise AppError(
            status_code=403,
            code="PARTNER_NOT_ACTIVE",
            detail="Ce partenaire n'est pas encore actif.",
        )
```

**3e. Modifier `_to_response` pour enrichir l'org summary :**

Remplacer le bloc `if org is not None:` dans `_to_response` :

```python
org = event.organization
org_summary = None
if org is not None:
    partner_profile = getattr(org, "partner_profile", None)
    is_partner = partner_profile is not None
    p_status: str | None = partner_profile.partner_status if partner_profile is not None else None
    org_summary = LocalEventOrganizationSummary(
        id=org.id,
        slug=org.slug,
        name=org.name,
        city=org.city,
        logo_url=org.logo_url,
        is_verified=org.verified_at is not None,
        is_partner=is_partner,
        partner_status=p_status,
        created_at=org.created_at,
    )
```

**Note importante** : `org.partner_profile` est chargé via la relation SQLAlchemy `Organization.partner_profile`. Vérifier que cette relation existe dans le modèle :

```bash
cd backend
grep -n "partner_profile" app/models/organization.py
```

Si la relation n'existe pas, aller à l'étape 3f. Si elle existe, passer à l'étape 4.

**3f. La relation `Organization.partner_profile` existe déjà** dans `backend/app/models/organization.py:152` — rien à créer. Passer directement à l'étape suivante.

**3g. Mettre à jour `get_by_id` et `list_public_for_city` dans le repo pour charger `partner_profile` :**

Dans `list_public_for_city`, `list_public_in_bbox` et `get_by_id` du `LocalEventRepository`, ajouter le selectinload de `partner_profile` via la relation `organization` :

```python
.options(
    selectinload(LocalEvent.organization).selectinload(Organization.partner_profile),
    selectinload(LocalEvent.neighborhood),
)
```

Ajouter l'import nécessaire :

```python
from app.models.organization import Organization
```

- [ ] **Step 4 : Lancer tous les tests de la Task 4**

```bash
cd backend
uv run pytest tests/test_partner_events_api.py::test_active_partner_can_create_event tests/test_partner_events_api.py::test_signed_partner_cannot_create_event tests/test_partner_events_api.py::test_paused_partner_cannot_create_event tests/test_partner_events_api.py::test_classic_org_no_partner_profile_can_create_event -v
```

Résultat attendu : tous PASS.

- [ ] **Step 5 : Vérifier que les tests existants passent encore**

```bash
cd backend
uv run pytest tests/test_local_events.py -v
```

Résultat attendu : tous PASS.

- [ ] **Step 6 : Commit**

```bash
git add backend/app/services/local_event_service.py backend/app/repositories/local_event_repository.py backend/app/models/ backend/tests/test_partner_events_api.py
git commit -m "feat(events): add partner status gate on create and enrich organization summary with is_partner/partner_status"
```

---

## Task 5 — Écrire le test `GET /events?organization_slug` avec filtre actif + `is_partner` dans la réponse

**Files:**
- Modify: `backend/tests/test_partner_events_api.py`

- [ ] **Step 1 : Ajouter les tests**

```python
@pytest.mark.integration
@pytest.mark.asyncio
async def test_filter_by_organization_slug_returns_only_org_events(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _partner_org_owner(
            session, partner.user_id, "slug-filter", PartnerStatus.ACTIVE
        )
        # récupérer le slug de l'org créée
        from sqlalchemy import select
        from app.models.organization import Organization
        result = await session.execute(
            select(Organization).where(Organization.id == org_id)
        )
        org = result.scalar_one()
        org_slug = org.slug
        await session.commit()

    starts = datetime.now(UTC) + timedelta(days=14)
    await auth_client.post(
        "/api/v1/organizations/me/events",
        headers=auth_header(partner.access_token),
        json={
            "organization_id": str(org_id),
            "title": "Event Slug Filter Test",
            "city": "Reims",
            "starts_at": starts.isoformat(),
            "location_name": "Reims",
            "event_type": "partner_event",
        },
    )

    resp = await auth_client.get(f"/api/v1/events?organization_slug={org_slug}")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) == 1
    assert items[0]["title"] == "Event Slug Filter Test"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_event_response_exposes_is_partner(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _partner_org_owner(
            session, partner.user_id, "ispartner-check", PartnerStatus.ACTIVE
        )
        await session.commit()

    starts = datetime.now(UTC) + timedelta(days=14)
    create = await auth_client.post(
        "/api/v1/organizations/me/events",
        headers=auth_header(partner.access_token),
        json={
            "organization_id": str(org_id),
            "title": "Is Partner Check",
            "city": "Reims",
            "starts_at": starts.isoformat(),
            "location_name": "Reims",
            "event_type": "partner_event",
        },
    )
    assert create.status_code == 201

    event_id = create.json()["id"]
    resp = await auth_client.get(f"/api/v1/events/{event_id}")
    assert resp.status_code == 200
    org = resp.json()["organization"]
    assert org is not None
    assert org["is_partner"] is True
    assert org["partner_status"] == "active"
    # Champs internes NON exposés
    assert "contact_email" not in org
    assert "contact_phone" not in org
    assert "contract_reference" not in org
    assert "notes_internal" not in org
```

- [ ] **Step 2 : Lancer les tests**

```bash
cd backend
uv run pytest tests/test_partner_events_api.py::test_filter_by_organization_slug_returns_only_org_events tests/test_partner_events_api.py::test_event_response_exposes_is_partner -v
```

Résultat attendu : PASS.

- [ ] **Step 3 : Commit**

```bash
git add backend/tests/test_partner_events_api.py
git commit -m "test(events): add organization_slug filter and is_partner response tests"
```

---

## Task 6 — Service + endpoint `GET /partners/{slug}/events`

**Files:**
- Modify: `backend/app/services/local_event_service.py`
- Modify: `backend/app/api/v1/partners.py`

- [ ] **Step 1 : Écrire les tests**

Ajouter dans `backend/tests/test_partner_events_api.py` :

```python
@pytest.mark.integration
@pytest.mark.asyncio
async def test_partner_events_endpoint_active_returns_events(
    auth_client: AsyncClient,
    rbac_user_factory: RbacUserFactory,
) -> None:
    """GET /partners/{slug}/events → retourne les events futurs."""
    partner = await rbac_user_factory()
    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        org_id = await _partner_org_owner(
            session, partner.user_id, "pe-active", PartnerStatus.ACTIVE
        )
        from sqlalchemy import select
        from app.models.organization import Organization
        result = await session.execute(select(Organization).where(Organization.id == org_id))
        org = result.scalar_one()
        org_slug = org.slug
        await session.commit()

    starts = datetime.now(UTC) + timedelta(days=14)
    await auth_client.post(
        "/api/v1/organizations/me/events",
        headers=auth_header(partner.access_token),
        json={
            "organization_id": str(org_id),
            "title": "Afterwork découverte test",
            "city": "Reims",
            "starts_at": starts.isoformat(),
            "location_name": "Reims",
            "event_type": "partner_event",
        },
    )

    resp = await auth_client.get(f"/api/v1/partners/{org_slug}/events")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert any(e["title"] == "Afterwork découverte test" for e in items)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_partner_events_endpoint_signed_returns_404(
    auth_client: AsyncClient,
) -> None:
    """Partenaire signed → 404."""
    # "daiboken" a partner_status=SIGNED dans le seed
    resp = await auth_client.get("/api/v1/partners/daiboken/events")
    assert resp.status_code == 404


@pytest.mark.integration
@pytest.mark.asyncio
async def test_partner_events_endpoint_unknown_slug_returns_404(
    auth_client: AsyncClient,
) -> None:
    resp = await auth_client.get("/api/v1/partners/slug-qui-nexiste-pas/events")
    assert resp.status_code == 404
```

- [ ] **Step 2 : Lancer les tests pour vérifier qu'ils échouent**

```bash
cd backend
uv run pytest tests/test_partner_events_api.py::test_partner_events_endpoint_active_returns_events tests/test_partner_events_api.py::test_partner_events_endpoint_signed_returns_404 -v
```

Résultat attendu : FAIL (endpoint inexistant → 404 ou 405).

- [ ] **Step 3 : Ajouter `list_partner_events` dans le service**

Dans `backend/app/services/local_event_service.py` :

```python
async def list_partner_events(
    self,
    *,
    slug: str,
    upcoming_only: bool = True,
    limit: int = 20,
    offset: int = 0,
) -> LocalEventListResponse:
    from app.core.partner_constants import PUBLIC_PARTNER_STATUSES

    profile = await self._partners.get_by_slug(
        city="Reims",  # NOTE: city pourrait être un param futur — pour l'instant Reims
        slug=slug.strip().lower(),
    )
    if profile is None or PartnerStatus(profile.partner_status) not in PUBLIC_PARTNER_STATUSES:
        raise AppError(
            status_code=404,
            code="PARTNER_NOT_FOUND",
            detail="Partenaire introuvable.",
        )

    limit = min(max(limit, 1), LOCAL_EVENT_LIST_PAGE_SIZE_MAX)
    offset = max(offset, 0)
    now = datetime.now(UTC)
    rows, total = await self._events.list_public_for_partner_org(
        organization_id=profile.organization_id,
        upcoming_only=upcoming_only,
        limit=limit,
        offset=offset,
        now=now,
    )
    return LocalEventListResponse(
        items=[self._to_response(e) for e in rows],
        total=total,
        page=1,
        page_size=limit,
    )
```

Vérifier que `PartnerStatus` est déjà importé (ajouté à la Task 4).

- [ ] **Step 4 : Ajouter l'endpoint dans `partners.py`**

Dans `backend/app/api/v1/partners.py`, ajouter après l'import existant de `LocalEventListResponse` (ajouter si absent) et l'endpoint :

```python
from app.schemas.local_event import LocalEventListResponse

# Dans le router, avant GET /{slug} :
@router.get("/{slug}/events", response_model=LocalEventListResponse)
async def list_partner_events(
    slug: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    upcoming_only: bool = Query(default=True),
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
) -> LocalEventListResponse:
    from app.services.local_event_service import LocalEventService

    return await LocalEventService(session).list_partner_events(
        slug=slug,
        upcoming_only=upcoming_only,
        limit=limit,
        offset=offset,
    )
```

**Attention à l'ordre des routes FastAPI** : `GET /{slug}/events` doit être déclaré AVANT `GET /{slug}` pour ne pas être capturé par le route paramétrique. Vérifier l'ordre dans `partners.py`.

- [ ] **Step 5 : Lancer les tests**

```bash
cd backend
uv run pytest tests/test_partner_events_api.py::test_partner_events_endpoint_active_returns_events tests/test_partner_events_api.py::test_partner_events_endpoint_signed_returns_404 tests/test_partner_events_api.py::test_partner_events_endpoint_unknown_slug_returns_404 -v
```

Résultat attendu : tous PASS.

- [ ] **Step 6 : Commit**

```bash
git add backend/app/services/local_event_service.py backend/app/api/v1/partners.py
git commit -m "feat(partners): add GET /partners/{slug}/events endpoint"
```

---

## Task 7 — Seed 4 partner events Reims

**Files:**
- Create: `backend/app/db/seeds/reims_partner_events.py`
- Modify: `backend/app/db/seeds/__main__.py`

- [ ] **Step 1 : Créer le fichier seed**

**Contexte important** : `LocalEvent.created_by_user_id` est NOT NULL avec FK vers `users`. Le seed non-demo (run normal) n'a pas de user disponible. La stratégie : créer un user système interne avec UUID déterministe, idempotent.

Créer `backend/app/db/seeds/reims_partner_events.py` :

```python
"""Reims pilot partner events seed (WEB-PARTNERS-05A) — idempotent."""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.local_event_constants import LocalEventModerationStatus, LocalEventType
from app.models.local_event import LocalEvent
from app.models.organization import Organization
from app.models.user import User

logger = logging.getLogger(__name__)

_PILOT_DESCRIPTION = (
    "Un moment pilote proposé dans le cadre du réseau partenaire Yunicity."
)

# UUID stable pour le compte système seed — jamais un vrai utilisateur
_SEED_SYSTEM_USER_ID = uuid.UUID("d6000000-0000-4000-8000-000000000001")

# UUIDs déterministes pour idempotence
REIMS_PARTNER_EVENTS_SEED: tuple[dict[str, Any], ...] = (
    {
        "id": uuid.UUID("d6050000-0000-4000-8000-000000000001"),
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000009"),  # Belga Queen (ACTIVE)
        "title": "Afterwork découverte",
        "location_name_fallback": "Belga Queen, Reims",
    },
    {
        "id": uuid.UUID("d6050000-0000-4000-8000-000000000002"),
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000011"),  # Pittaya (ACTIVE)
        "title": "Découverte culinaire",
        "location_name_fallback": "Pittaya, Reims",
    },
    {
        "id": uuid.UUID("d6050000-0000-4000-8000-000000000003"),
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000012"),  # Centre des Ressources (ACTIVE)
        "title": "Atelier ressources locales",
        "location_name_fallback": "Centre des Ressources, Reims",
    },
    {
        "id": uuid.UUID("d6050000-0000-4000-8000-000000000004"),
        "organization_id": uuid.UUID("d6040000-0000-4000-8000-000000000014"),  # Garçon Barbiers (ACTIVE)
        "title": "Conseils style & entretien",
        "location_name_fallback": "Garçon Barbiers, Reims",
    },
)

_SYNC_FIELDS = ("title", "description", "event_type", "moderation_status")


async def _ensure_seed_system_user(session: AsyncSession) -> uuid.UUID:
    """Crée un compte système interne pour les seeds si absent. Jamais exposé en prod."""
    existing = await session.get(User, _SEED_SYSTEM_USER_ID)
    if existing is not None:
        return _SEED_SYSTEM_USER_ID
    # Vérifier si un user avec cet email existe déjà
    result = await session.execute(
        select(User).where(User.email == "seed-system@yunicity.internal")
    )
    found = result.scalar_one_or_none()
    if found is not None:
        return found.id
    system_user = User(
        id=_SEED_SYSTEM_USER_ID,
        email="seed-system@yunicity.internal",
        full_name="Yunicity System",
        city="Reims",
        is_active=False,  # compte interne jamais utilisable
        hashed_password="!locked",  # valeur invalide — impossible de se connecter
    )
    session.add(system_user)
    await session.flush()
    return _SEED_SYSTEM_USER_ID


def _build_event(entry: dict[str, Any], org: Organization, system_user_id: uuid.UUID) -> LocalEvent:
    starts_at = datetime.now(UTC) + timedelta(days=14)
    location_name = org.address or entry["location_name_fallback"]
    return LocalEvent(
        id=entry["id"],
        organization_id=entry["organization_id"],
        created_by_user_id=system_user_id,
        title=entry["title"],
        description=_PILOT_DESCRIPTION,
        event_type=LocalEventType.PARTNER_EVENT.value,
        city="Reims",
        starts_at=starts_at,
        timezone="Europe/Paris",
        location_name=location_name,
        address=org.address,
        latitude=float(org.latitude) if org.latitude is not None else None,
        longitude=float(org.longitude) if org.longitude is not None else None,
        moderation_status=LocalEventModerationStatus.APPROVED.value,
        moderated_at=datetime.now(UTC),
        visibility="public",
    )


async def seed_reims_partner_events(session: AsyncSession) -> None:
    system_user_id = await _ensure_seed_system_user(session)

    for entry in REIMS_PARTNER_EVENTS_SEED:
        org = await session.get(Organization, entry["organization_id"])
        if org is None:
            logger.warning(
                "partner_event_seed_skip org_not_found org_id=%s", entry["organization_id"]
            )
            continue

        existing = await session.get(LocalEvent, entry["id"])
        if existing is not None:
            for field in _SYNC_FIELDS:
                setattr(existing, field, getattr(_build_event(entry, org, system_user_id), field))
        else:
            by_title = await session.execute(
                select(LocalEvent).where(
                    LocalEvent.title == entry["title"],
                    LocalEvent.organization_id == entry["organization_id"],
                )
            )
            found = by_title.scalar_one_or_none()
            if found is not None:
                for field in _SYNC_FIELDS:
                    setattr(found, field, getattr(_build_event(entry, org, system_user_id), field))
            else:
                session.add(_build_event(entry, org, system_user_id))

    logger.info(
        "reims_partner_events_seed_completed count=%s",
        len(REIMS_PARTNER_EVENTS_SEED),
    )
```

**Note** : Vérifier que `User` a bien un champ `is_active` et `hashed_password`. Si les noms de colonnes diffèrent, adapter à partir de `backend/app/models/user.py` avant d'écrire le code.

- [ ] **Step 2 : Brancher dans `__main__.py`**

Dans `backend/app/db/seeds/__main__.py`, ajouter :

```python
from app.db.seeds.reims_partner_events import seed_reims_partner_events
```

Et dans la fonction `run`, après `await seed_reims_partner_offers(session)` :

```python
await seed_reims_partner_events(session)
```

- [ ] **Step 3 : Écrire le test d'idempotence du seed**

Ajouter dans `backend/tests/test_partner_events_api.py` :

```python
@pytest.mark.integration
@pytest.mark.asyncio
async def test_seed_partner_events_idempotent(
    auth_client: AsyncClient,
) -> None:
    """Le seed ne doit pas créer de doublon si lancé deux fois."""
    from app.db.session import get_engine
    from app.db.seeds.reims_partner_events import seed_reims_partner_events, REIMS_PARTNER_EVENTS_SEED
    from sqlalchemy import select, func
    from app.models.local_event import LocalEvent

    engine = get_engine()
    assert engine is not None
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with factory() as session:
        await seed_reims_partner_events(session)
        await seed_reims_partner_events(session)
        await session.commit()

    async with factory() as session:
        for entry in REIMS_PARTNER_EVENTS_SEED:
            count_result = await session.execute(
                select(func.count()).select_from(LocalEvent).where(
                    LocalEvent.organization_id == entry["organization_id"],
                    LocalEvent.title == entry["title"],
                )
            )
            count = count_result.scalar_one()
            assert count == 1, f"Doublon détecté pour {entry['title']}"
```

- [ ] **Step 4 : Lancer le test**

```bash
cd backend
uv run pytest tests/test_partner_events_api.py::test_seed_partner_events_idempotent -v
```

Résultat attendu : PASS (le seed est idempotent).

- [ ] **Step 5 : Commit**

```bash
git add backend/app/db/seeds/reims_partner_events.py backend/app/db/seeds/__main__.py backend/tests/test_partner_events_api.py
git commit -m "feat(seeds): add idempotent partner events seed for 4 Reims partners"
```

---

## Task 8 — Types et utils frontend

**Files:**
- Modify: `frontend/packages/types/src/local-event.ts`
- Create: `frontend/packages/utils/src/partner-events.ts`
- Create: `frontend/packages/utils/src/partner-events.test.ts`

- [ ] **Step 1 : Mettre à jour `LocalEventOrganization` dans le package types**

Dans `frontend/packages/types/src/local-event.ts`, modifier `LocalEventOrganization` :

```typescript
/** Local events / city moments (TICKET-505). */

import type { FeedNeighborhoodSummary } from "./neighborhood";
import type { PartnerStatus } from "./partner";

export interface LocalEventOrganization {
  id: string;
  slug: string;
  name: string;
  city: string;
  logo_url: string | null;
  is_verified?: boolean;
  is_partner: boolean;
  partner_status: PartnerStatus | null;
  created_at?: string | null;
}

// Le reste du fichier reste identique
```

- [ ] **Step 2 : Créer `partner-events.ts`**

Créer `frontend/packages/utils/src/partner-events.ts` :

```typescript
import type { LocalEvent } from "@yunicity/types";
import type { PartnerStatus } from "@yunicity/types";

const PUBLIC_PARTNER_STATUSES: ReadonlySet<PartnerStatus> = new Set([
  "active",
  "premium",
  "founding_partner",
]);

export function eventIsPartnerEvent(event: LocalEvent): boolean {
  return event.organization?.is_partner === true &&
    event.organization.partner_status !== null &&
    PUBLIC_PARTNER_STATUSES.has(event.organization.partner_status as PartnerStatus);
}

export function eventOrganizerLabel(event: LocalEvent): string {
  if (event.organization?.name) {
    return event.organization.name;
  }
  return "Événement local";
}

export function eventPartnerBadgeLabel(event: LocalEvent): string | null {
  if (!eventIsPartnerEvent(event)) {
    return null;
  }
  const status = event.organization?.partner_status;
  if (status === "premium") return "Partenaire Premium";
  if (status === "founding_partner") return "Partenaire Fondateur";
  return "Partenaire";
}

export function buildPartnerEventsUrl(slug: string, city?: string): string {
  const base = `/partners/${encodeURIComponent(slug)}/events`;
  if (!city) return base;
  return `${base}?city=${encodeURIComponent(city)}`;
}
```

- [ ] **Step 3 : Créer `partner-events.test.ts`**

Créer `frontend/packages/utils/src/partner-events.test.ts` :

```typescript
import { describe, expect, it } from "vitest";

import type { LocalEvent } from "@yunicity/types";

import {
  buildPartnerEventsUrl,
  eventIsPartnerEvent,
  eventOrganizerLabel,
  eventPartnerBadgeLabel,
} from "./partner-events";

function baseEvent(overrides: Partial<LocalEvent> = {}): LocalEvent {
  return {
    id: "evt-1",
    organization_id: null,
    title: "Test Event",
    description: null,
    event_type: "partner_event",
    city: "Reims",
    district: null,
    starts_at: "2026-06-14T18:00:00.000Z",
    ends_at: null,
    timezone: "Europe/Paris",
    location_name: "Reims",
    address: null,
    latitude: null,
    longitude: null,
    cover_image_url: null,
    moderation_status: "approved",
    is_cancelled: false,
    interested_by_me: false,
    interest_count: 0,
    organization: null,
    neighborhood_summary: null,
    created_at: "2026-05-31T00:00:00.000Z",
    ...overrides,
  };
}

describe("eventIsPartnerEvent", () => {
  it("returns true for active partner event", () => {
    const event = baseEvent({
      organization: {
        id: "org-1",
        slug: "belga-queen",
        name: "Belga Queen",
        city: "Reims",
        logo_url: null,
        is_partner: true,
        partner_status: "active",
      },
    });
    expect(eventIsPartnerEvent(event)).toBe(true);
  });

  it("returns true for premium partner", () => {
    const event = baseEvent({
      organization: {
        id: "org-2",
        slug: "premium-org",
        name: "Premium Org",
        city: "Reims",
        logo_url: null,
        is_partner: true,
        partner_status: "premium",
      },
    });
    expect(eventIsPartnerEvent(event)).toBe(true);
  });

  it("returns false when organization is null", () => {
    expect(eventIsPartnerEvent(baseEvent())).toBe(false);
  });

  it("returns false when is_partner is false", () => {
    const event = baseEvent({
      organization: {
        id: "org-3",
        slug: "classic-org",
        name: "Classic Org",
        city: "Reims",
        logo_url: null,
        is_partner: false,
        partner_status: null,
      },
    });
    expect(eventIsPartnerEvent(event)).toBe(false);
  });

  it("returns false for signed partner (not public)", () => {
    const event = baseEvent({
      organization: {
        id: "org-4",
        slug: "signed-org",
        name: "Signed Org",
        city: "Reims",
        logo_url: null,
        is_partner: true,
        partner_status: "signed",
      },
    });
    expect(eventIsPartnerEvent(event)).toBe(false);
  });
});

describe("eventOrganizerLabel", () => {
  it("returns org name when present", () => {
    const event = baseEvent({
      organization: {
        id: "org-1",
        slug: "belga-queen",
        name: "Belga Queen",
        city: "Reims",
        logo_url: null,
        is_partner: true,
        partner_status: "active",
      },
    });
    expect(eventOrganizerLabel(event)).toBe("Belga Queen");
  });

  it("returns fallback label when no organization", () => {
    expect(eventOrganizerLabel(baseEvent())).toBe("Événement local");
  });
});

describe("eventPartnerBadgeLabel", () => {
  it("returns 'Partenaire' for active partner", () => {
    const event = baseEvent({
      organization: {
        id: "org-1",
        slug: "belga-queen",
        name: "Belga Queen",
        city: "Reims",
        logo_url: null,
        is_partner: true,
        partner_status: "active",
      },
    });
    expect(eventPartnerBadgeLabel(event)).toBe("Partenaire");
  });

  it("returns 'Partenaire Premium' for premium", () => {
    const event = baseEvent({
      organization: {
        id: "org-2",
        slug: "premium",
        name: "Premium",
        city: "Reims",
        logo_url: null,
        is_partner: true,
        partner_status: "premium",
      },
    });
    expect(eventPartnerBadgeLabel(event)).toBe("Partenaire Premium");
  });

  it("returns null for non-partner event", () => {
    expect(eventPartnerBadgeLabel(baseEvent())).toBeNull();
  });
});

describe("buildPartnerEventsUrl", () => {
  it("builds URL without city", () => {
    expect(buildPartnerEventsUrl("belga-queen")).toBe("/partners/belga-queen/events");
  });

  it("builds URL with city", () => {
    expect(buildPartnerEventsUrl("belga-queen", "Reims")).toBe(
      "/partners/belga-queen/events?city=Reims",
    );
  });

  it("encodes special characters in slug", () => {
    expect(buildPartnerEventsUrl("gar%C3%A7on-barbiers")).toContain("gar%25C3%25A7on-barbiers");
  });
});
```

- [ ] **Step 4 : Vérifier que le package `@yunicity/utils` exporte les nouveaux utils**

Chercher le fichier d'index du package :

```bash
cat frontend/packages/utils/src/index.ts 2>/dev/null || ls frontend/packages/utils/src/index*
```

Si un barrel `index.ts` existe, ajouter l'export :

```typescript
export * from "./partner-events";
```

Si le package n'utilise pas de barrel d'index (exports directs dans `package.json`), rien à faire.

- [ ] **Step 5 : Lancer les tests frontend**

```bash
cd frontend
pnpm --filter @yunicity/utils test -- --reporter=verbose partner-events
```

Résultat attendu : tous PASS.

- [ ] **Step 6 : Vérifier que les types ne cassent pas les consumers existants**

```bash
cd frontend
pnpm --filter @yunicity/types typecheck 2>/dev/null || pnpm --filter web typecheck
```

Résultat attendu : aucune erreur de type.

- [ ] **Step 7 : Commit**

```bash
git add frontend/packages/types/src/local-event.ts frontend/packages/utils/src/partner-events.ts frontend/packages/utils/src/partner-events.test.ts
git commit -m "feat(frontend): add is_partner/partner_status to LocalEventOrganization type and partner-events utils"
```

---

## Task 9 — Qualité finale (lint, typecheck, tous les tests)

**Files:** aucun nouveau fichier

- [ ] **Step 1 : Lancer tous les tests backend**

```bash
cd backend
uv run pytest tests/test_partner_events_api.py -v
```

Résultat attendu : 10 tests, tous PASS.

- [ ] **Step 2 : Lancer les tests de régression events existants**

```bash
cd backend
uv run pytest tests/test_local_events.py -v
```

Résultat attendu : tous PASS.

- [ ] **Step 3 : Ruff**

```bash
cd backend
uv run ruff check app/api/v1/events.py app/api/v1/partners.py app/services/local_event_service.py app/repositories/local_event_repository.py app/schemas/local_event.py app/db/seeds/reims_partner_events.py tests/test_partner_events_api.py
```

Résultat attendu : aucune erreur.

- [ ] **Step 4 : mypy**

```bash
cd backend
uv run mypy app/api/v1/events.py app/api/v1/partners.py app/services/local_event_service.py app/repositories/local_event_repository.py app/schemas/local_event.py app/db/seeds/reims_partner_events.py
```

Résultat attendu : aucune erreur de type.

- [ ] **Step 5 : Typecheck frontend**

```bash
cd frontend
pnpm --filter @yunicity/utils test
pnpm --filter web typecheck
```

Résultat attendu : tous PASS.

- [ ] **Step 6 : Commit de clôture si des corrections ont été faites**

```bash
git add -p
git commit -m "chore: fix lint and type errors after partner events 05A"
```

---

## Auto-review (spec coverage)

### Spec → Tasks mapping

| Spec | Task couvrant |
|------|---------------|
| LocalEventOrganizationSummary +is_partner +partner_status | Task 1 |
| Ne pas exposer contact_email, phone, notes, contract | Task 1 (non inclus) + test Task 5 |
| GET /events?organization_slug | Task 2 + 3 |
| Org inconnue → liste vide, pas 404 | Task 2 test 1 |
| Gate signed/paused à la création | Task 4 |
| Org classique sans partner_profile → non bloquée | Task 4 test 4 |
| Enrichir event.organization avec is_partner/partner_status | Task 4 (_to_response) |
| Éviter N+1 — eager loading partner_profile | Task 4 (selectinload chaîné) |
| GET /partners/{slug}/events | Task 6 |
| signed → 404, unknown → 404 | Task 6 |
| upcoming_only, limit, offset | Task 6 |
| 4 events partenaires seedés | Task 7 |
| Seed idempotent | Task 7 |
| Types frontend is_partner/partner_status | Task 8 |
| eventIsPartnerEvent, eventOrganizerLabel, eventPartnerBadgeLabel, buildPartnerEventsUrl | Task 8 |
| Tests frontend badge partner / no badge / organizer / URL | Task 8 |
| Lint + typecheck + tests | Task 9 |

### Points de vigilance

1. **Ordre des routes FastAPI** : `GET /{slug}/events` doit être AVANT `GET /{slug}` dans `partners.py`. FastAPI matche dans l'ordre de déclaration.

2. **Relation `Organization.partner_profile`** : elle existe déjà à `app/models/organization.py:152` avec `uselist=False`. Le selectinload chaîné `.selectinload(LocalEvent.organization).selectinload(Organization.partner_profile)` fonctionnera directement.

3. **N+1 sur `list_public_for_city`** : le selectinload chaîné `.selectinload(LocalEvent.organization).selectinload(Organization.partner_profile)` charge tout en 2 requêtes max. Ne pas utiliser `lazy="select"` ou `joinedload` ici.

4. **`interest_count` dans `list_partner_events`** : la méthode `_to_response` passe `interest_count=0` par défaut. Pour l'endpoint public, c'est acceptable au MVP. Si besoin de vrai count plus tard, ajouter une passe similaire à `list_public`.

5. **Seed `created_by_user_id`** : le modèle `LocalEvent` peut avoir `created_by_user_id` NOT NULL. Vérifier : `grep -n "created_by_user_id" app/models/local_event.py`. Si NOT NULL, le seed doit fournir un UUID fictif valide ou rendre le champ nullable (préférer nullable avec migration Alembic si nécessaire — ne pas contourner).

---

## Risques restants après implémentation

| Risque | Probabilité | Mitigation |
|--------|-------------|-----------|
| `created_by_user_id` NOT NULL dans LocalEvent | Résolu | Task 7 crée un user système interne `seed-system@yunicity.internal` avec UUID déterministe |
| `Organization.partner_profile` relation absente | Moyen | Step 3f de Task 4 couvre ce cas |
| Ordre route `/{slug}/events` vs `/{slug}` | Faible | Note de vigilance + vérification manuelle |
| `interest_count` toujours 0 dans `/partners/{slug}/events` | Faible | Acceptable MVP, documenter comme dette |
