"""ORM models — import all modules so Alembic sees Base.metadata."""

from app.models.organization import (
    Organization,
    OrganizationMember,
    OrganizationVerification,
)
from app.models.partner_lead import PartnerLead
from app.models.passport import (
    PartnerOffer,
    Passport,
    PassportOfferRedemption,
    PassportStamp,
    PassportTier,
)
from app.models.push_subscription import PushSubscription
from app.models.rbac import Permission, Role, RolePermission, UserRole
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.models.user_profile import ProfileVisibility, UserProfile

__all__ = [
    "Organization",
    "OrganizationMember",
    "OrganizationVerification",
    "PartnerLead",
    "PushSubscription",
    "PartnerOffer",
    "Passport",
    "PassportOfferRedemption",
    "PassportStamp",
    "PassportTier",
    "Permission",
    "ProfileVisibility",
    "RefreshToken",
    "Role",
    "RolePermission",
    "User",
    "UserProfile",
    "UserRole",
]
