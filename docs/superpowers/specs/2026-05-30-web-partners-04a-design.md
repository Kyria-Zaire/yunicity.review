# WEB-PARTNERS-04A — Signed QR Passport Stamp Foundation

**Date**: 2026-05-30  
**Sprint**: WEB PARTNERS ECOSYSTEM  
**Phase**: DESIGN → BUILD  
**Status**: APPROVED

---

## Context

WEB-PARTNERS-01/02/03 are complete. Partners are visible across the platform with real offers. The next step is allowing users to receive a Passport stamp at a partner location via a signed QR.

This ticket adds a **second acquisition mode** for Passport stamps alongside the existing partner-scan flow:

| Mode | Who scans | Implemented |
|------|-----------|-------------|
| Mode 1 | Partner scans user QR | ✅ (scan.py) |
| Mode 2 | User opens partner QR URL | 🔨 WEB-PARTNERS-04A |

Both modes produce the same result: one `passport_stamps` row per partner per Passport, for life.

---

## Decisions Logged

| Question | Decision | Rationale |
|----------|----------|-----------|
| Idempotence | Lifetime per `(passport_id, organization_id)` | Passport = territorial identity, not a farming mechanic |
| QR token strategy | JWT-only, no nonce persistence | 24h expiry + `add_stamp_if_missing()` cover replay risk; revocation deferred to 04B |
| Stamp source tracking | Typed enum column `PassportStampSource.QR` | First-class business data, not a JSONB detail |

---

## Scope

### In scope

- Extend `PassportStampSource` enum: add `QR`
- New helper: `app/core/passport_stamp_qr.py` (JWT generation/verification)
- `POST /api/v1/partners/{slug}/passport-qr` — partner generates QR
- `POST /api/v1/passport/stamps/claim` — user claims stamp via token
- Frontend: `/passport/stamp/claim?token=...` claim page
- Frontend: `PassportStampsSection` in `/passport` (real stamps history)
- Types + utils for stamp claim flow

### Explicitly excluded (deferred)

| Item | Target ticket |
|------|---------------|
| `passport_stamp_qr_tokens` table | WEB-PARTNERS-04B |
| QR revocation before expiry | WEB-PARTNERS-04B |
| Claim audit table | WEB-PARTNERS-04B |
| `PassportStampService` refactor | WEB-PARTNERS-04C |
| Camera QR scanner | Future |
| Event check-in stamps | Future |

---

## Data Model

### No new table. No constraint changes.

The existing `passport_stamps` table and `unique(passport_id, organization_id)` constraint remain unchanged.

### Migration: enum extension only

```sql
ALTER TYPE passportstampsource ADD VALUE IF NOT EXISTS 'qr';
```

Alembic migration file: `app/core/passport_constants.py` updated:

```python
class PassportStampSource(StrEnum):
    ORGANIZATION = "organization"   # existing — partner scans user QR
    QR = "qr"                       # new — user opens partner QR URL
```

### QR context in `metadata_` JSONB

```json
{
  "nonce": "<secrets.token_urlsafe(16)>",
  "partner_offer_id": "<uuid or null>",
  "qr_version": 1
}
```

---

## Token Strategy

### `app/core/passport_stamp_qr.py` (new file)

Separate from `app/core/passport_qr.py` which handles user-facing Passport QR tokens.

**JWT payload**:

```json
{
  "typ": "passport_stamp",
  "organization_id": "<uuid>",
  "partner_profile_id": "<uuid>",
  "partner_offer_id": "<uuid or null>",
  "nonce": "<secrets.token_urlsafe(16)>",
  "iat": <unix timestamp>,
  "exp": <unix timestamp>
}
```

**Algorithm**: HS256, signed with existing `Settings.jwt_secret_key`.

**Expiration**: Default 24 hours (`expires_in_minutes=1440`). Configurable at generation, max 1440 minutes. No minimum enforced for internal use.

**Nonce**: Included for log traceability only. Not persisted to DB.

**Claim URL produced**: `/passport/stamp/claim?token=<jwt>`

---

## Backend Endpoints

### `POST /api/v1/partners/{slug}/passport-qr`

**Auth**: Required (authenticated user).

**Permission**: `OrganizationMembershipService.require_offer_manager(organization_id, user.id)` — same pattern as `scan_redemption_service.py`. Returns 403 if not org owner/staff.

**Validation**:
- Partner profile must exist for slug, else 404
- `partner_profile.partner_status ∈ {active, premium, founding_partner}`, else 403 `PARTNER_NOT_ACTIVE`

**Request body**:
```json
{
  "partner_offer_id": "<uuid>",        // optional
  "expires_in_minutes": 1440           // optional, default 1440, max 1440
}
```

**Response 200**:
```json
{
  "qr_url": "/passport/stamp/claim?token=<jwt>",
  "expires_at": "<ISO datetime>"
}
```

No raw token in response. URL only.

---

### `POST /api/v1/passport/stamps/claim`

**Auth**: Required.

**Rate limit**: `stamp:claim:{user_id}` — 20 requests/hour (same pattern as `passport/offers/{id}/redeem`).

**Request body**:
```json
{
  "token": "<jwt>"
}
```

**Claim flow**:

1. `jwt.decode(token, jwt_secret_key, algorithms=["HS256"])` — on failure → 400 `STAMP_TOKEN_INVALID`
2. Check `payload["exp"] >= now` — on failure → 410 `STAMP_TOKEN_EXPIRED`
3. Check `payload["typ"] == "passport_stamp"` — on failure → 400 `STAMP_TOKEN_INVALID`
4. Load `partner_profile` by `partner_profile_id` — not found → 400 `STAMP_TOKEN_INVALID`
5. Check `partner_status ∈ {active, premium, founding_partner}` → 403 `PARTNER_NOT_ACTIVE`
6. If `partner_offer_id` in payload: load offer, check `is_active == True` and `valid_until >= now` → 410 `OFFER_NOT_ACTIVE_OR_EXPIRED`
7. Load user's active Passport — not found → 404 `PASSPORT_NOT_FOUND`
8. Call `add_stamp_if_missing(passport_id, organization_id, stamp_source=QR, metadata={"nonce": ..., "partner_offer_id": ..., "qr_version": 1})`
9. Result `True` → stamp created, evaluate level hooks → 201
10. Result `False` → stamp already existed → 200

**Response (both 201 and 200)**:
```json
{
  "status": "created" | "already_claimed",
  "already_claimed": true | false,
  "stamp": {
    "id": "<uuid>",
    "organization_id": "<uuid>",
    "organization_name": "<str>",   // derived from Organization.name, not a stored column
    "stamp_source": "qr" | "organization",
    "stamped_at": "<ISO datetime>"
  },
  "passport": {
    "stamps_count": <int>,
    "tier_code": "<str>"
  }
}
```

**Internal fields never exposed**: `passport_id`, `metadata_`, `stamped_by_user_id`, raw nonce as a standalone field.

---

### `GET /api/v1/passport/stamps`

Already implemented. No changes needed.

Returns stamps for the authenticated user's active Passport. Filters: `city`, `source`, `limit`, `offset`.

---

## Permission Model for QR Generation

`OrganizationMembershipService.require_offer_manager(organization_id, user_id)` already implements org owner/staff checks and is already used in `scan_redemption_service.py`. This is the single point of truth.

No additional RBAC work needed for MVP. If a partner doesn't have a user account linked to their org yet, they cannot generate QRs — this is by design and is a product onboarding concern, not a security gap.

---

## Security Rules

| Rule | Enforcement |
|------|-------------|
| Token signed server-side | JWT HS256, `jwt_secret_key` |
| Token expiration mandatory | `exp` claim checked before any processing |
| `organization_id` from token only | Never trusted from request body or URL |
| User auth required for claim | `require_authenticated_user` dependency |
| `signed`/`paused` partners blocked | Checked at generation AND at claim |
| One stamp per org per Passport | `unique(passport_id, organization_id)` constraint |
| Claim rate-limited | 20/hour per user |
| Nonce for log traceability | In JWT payload and `metadata_` JSONB, not a separate DB column |

---

## Frontend

### `/passport/stamp/claim?token=...`

New Next.js page under `app/passport/stamp/claim/page.tsx`.

**Unauthenticated**: Redirect to `/login?redirect=/passport/stamp/claim?token=<token>` — token preserved in redirect URL.

**Authenticated**: Fire `POST /passport/stamps/claim` on mount. No confirmation screen — claim is immediate.

**UI states**:

| State | Message |
|-------|---------|
| `loading` | Skeleton / spinner |
| `created` | "Tampon ajouté à votre Passport" + partner name + CTA "Voir mon Passport" + CTA "Voir le partenaire" |
| `already_claimed` | "Ce tampon est déjà dans votre Passport" + CTA "Voir mon Passport" |
| `expired` | "Ce QR a expiré. Demandez un nouveau QR au partenaire." |
| `invalid` | "Ce QR n'est pas valide." |
| `partner_inactive` | "Ce partenaire n'est pas actif pour le moment." |
| `error` | Generic fallback with retry |

No camera scanner. No QR rendering on this page. Token comes from URL only.

### `PassportStampsSection` in `/passport`

New component replacing the empty state or placeholder in the `PassportDashboardScreen`.

Source: `GET /passport/stamps` (already implemented backend).

Displays per stamp: partner logo/fallback, stamp title, date (`formatPassportStampDate()`), badge (`QR` or `Partenaire` from `passportStampSourceLabel()`).

Empty state: *"Vos premiers tampons apparaîtront ici lorsque vous visiterez un partenaire Yunicity."*

---

## Frontend Types & Utils

### Types (`@yunicity/types`)

```typescript
// PassportStampSource already typed as "organization" — add "qr"
type PassportStampSource = "organization" | "qr";

type PassportStamp = {
  id: string;
  organization_id: string;
  organization_name: string;  // derived from Organization.name in schema
  stamp_source: PassportStampSource;
  stamped_at: string;
  // No separate `title` field — organization_name is the display label for MVP
};

type PassportStampListResponse = {
  items: PassportStamp[];
  count: number;
  total: number;
  offset: number;
  limit: number;
};

type PassportStampClaimResult = {
  status: "created" | "already_claimed";
  already_claimed: boolean;
  stamp: PassportStamp;
  passport: { stamps_count: number; tier_code: string };
};

type PassportQrTokenResponse = {
  qr_url: string;
  expires_at: string;
};
```

### Utils (`@yunicity/utils`)

```typescript
claimPassportStamp(token: string): Promise<PassportStampClaimResult>
listPassportStamps(params?: { city?: string; source?: PassportStampSource; limit?: number; offset?: number }): Promise<PassportStampListResponse>
passportStampTypeLabel(source: PassportStampSource): string   // "QR" | "Partenaire"
passportStampSourceLabel(source: PassportStampSource): string
formatPassportStampDate(stamped_at: string): string           // "12 mai 2026"
buildPassportStampClaimUrl(token: string): string             // "/passport/stamp/claim?token=<token>"
```

### Utils tests

- `passportStampTypeLabel("qr")` → `"QR"`
- `passportStampTypeLabel("organization")` → `"Partenaire"`
- `buildPassportStampClaimUrl("abc")` → `"/passport/stamp/claim?token=abc"`
- `formatPassportStampDate` returns French locale date
- Fixture with `already_claimed: true` parses correctly
- Fixture with `already_claimed: false` parses correctly
- No stamp constructed from fake/invented data

---

## Tests Backend (`test_passport_stamp_qr.py`)

All integration tests, skip when `DATABASE_URL` not set.

1. `test_generate_qr_requires_org_permission` — non-member returns 403
2. `test_generate_qr_requires_active_partner` — `signed` partner returns 403
3. `test_claim_valid_token_creates_stamp` — new stamp, response `status=created`, HTTP 201
4. `test_claim_same_token_twice_returns_already_claimed` — second claim returns 200, `already_claimed=true`
5. `test_existing_stamp_from_old_flow_returns_already_claimed` — stamp from Mode 1 triggers 200 already_claimed on Mode 2 claim
6. `test_claim_expired_token_returns_410` — token with past `exp`
7. `test_claim_invalid_signature_returns_400` — token signed with wrong key
8. `test_claim_signed_partner_returns_403` — partner with `status=signed`
9. `test_claim_inactive_offer_returns_410` — offer `is_active=False`
10. `test_list_stamps_returns_only_current_user_stamps` — stamps from another user not returned
11. `test_claim_response_does_not_expose_internal_fields` — `passport_id`, `metadata_`, `stamped_by_user_id` absent

---

## Quality Gates

```bash
# Backend
uv run alembic revision --autogenerate -m "add qr to passport_stamp_source"
uv run alembic upgrade head
uv run pytest tests/test_passport_stamp_qr.py -q
uv run ruff check app/core/passport_stamp_qr.py app/api/v1 app/services app/repositories tests/test_passport_stamp_qr.py
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
| Compromised `jwt_secret_key` → forged tokens | Key rotation = ops concern, out of scope. Secret stored in env vars. |
| QR URL shared publicly before expiry | 24h expiry limits window. Idempotence limits damage to one stamp per org. |
| Partner generates QR for org they left | Revoked membership blocks `require_offer_manager`. No deferred risk. |
| No per-QR revocation before 24h | Deferred to WEB-PARTNERS-04B via `passport_stamp_qr_tokens` table. |

---

## Tickets Deferred

| Ticket | Content |
|--------|---------|
| WEB-PARTNERS-04B | `passport_stamp_qr_tokens` table, QR revocation, claim audit trail, partner QR management UI |
| WEB-PARTNERS-04C | `PassportStampService` refactor unifying Mode 1 and Mode 2 |
