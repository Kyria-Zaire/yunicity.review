"""Organization domain constants and enums."""

from __future__ import annotations

from enum import StrEnum

ORGANIZATION_DESCRIPTION_MAX_LENGTH = 1000
ORGANIZATION_REJECTION_REASON_MAX_LENGTH = 1000
ORGANIZATION_VERIFICATION_REASON_MAX_LENGTH = 1000

ORGANIZATION_SLUG_MIN_LENGTH = 3
ORGANIZATION_SLUG_MAX_LENGTH = 80

MAX_PENDING_ORGANIZATIONS_PER_USER = 5
ONBOARDING_STEP_INITIAL = "type_name"


class OrganizationType(StrEnum):
    COMMERCE = "commerce"
    ASSOCIATION = "association"
    SCHOOL = "school"
    FREELANCE = "freelance"
    PUBLIC_AGENCY = "public_agency"
    CREATOR = "creator"
    OTHER = "other"


class VerificationStatus(StrEnum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    VERIFIED = "verified"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


class VerificationMethod(StrEnum):
    MANUAL = "manual"
    EMAIL_DOMAIN = "email_domain"
    DOCUMENT = "document"
    PHONE = "phone"
    VIDEO = "video"
    POSTCARD = "postcard"
    TRUSTED_PARTNER = "trusted_partner"


class OrganizationVisibility(StrEnum):
    PRIVATE = "private"
    PUBLIC = "public"
    UNLISTED = "unlisted"


class OrganizationMemberRole(StrEnum):
    OWNER = "owner"
    ADMIN = "admin"
    STAFF = "staff"
    MEMBER = "member"


class OrganizationMemberStatus(StrEnum):
    ACTIVE = "active"
    INVITED = "invited"
    SUSPENDED = "suspended"
    REMOVED = "removed"


ORGANIZATION_TYPES: frozenset[str] = frozenset(m.value for m in OrganizationType)
VERIFICATION_STATUSES: frozenset[str] = frozenset(m.value for m in VerificationStatus)
VERIFICATION_METHODS: frozenset[str] = frozenset(m.value for m in VerificationMethod)
ORGANIZATION_VISIBILITIES: frozenset[str] = frozenset(m.value for m in OrganizationVisibility)
ORGANIZATION_MEMBER_ROLES: frozenset[str] = frozenset(m.value for m in OrganizationMemberRole)
ORGANIZATION_MEMBER_STATUSES: frozenset[str] = frozenset(m.value for m in OrganizationMemberStatus)

ALLOWED_VERIFICATION_TRANSITIONS: dict[VerificationStatus, frozenset[VerificationStatus]] = {
    VerificationStatus.PENDING: frozenset(
        {
            VerificationStatus.UNDER_REVIEW,
            VerificationStatus.VERIFIED,
            VerificationStatus.REJECTED,
        }
    ),
    VerificationStatus.UNDER_REVIEW: frozenset(
        {
            VerificationStatus.VERIFIED,
            VerificationStatus.REJECTED,
            VerificationStatus.SUSPENDED,
        }
    ),
    VerificationStatus.VERIFIED: frozenset({VerificationStatus.SUSPENDED}),
    VerificationStatus.REJECTED: frozenset(
        {VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW}
    ),
    VerificationStatus.SUSPENDED: frozenset(
        {VerificationStatus.VERIFIED, VerificationStatus.UNDER_REVIEW}
    ),
}
