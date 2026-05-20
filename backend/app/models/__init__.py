"""ORM models — import all modules so Alembic sees Base.metadata."""

from app.models.comment import Comment
from app.models.like import Like
from app.models.local_event import EventInterest, LocalEvent
from app.models.local_stamp import CitizenLocalStamp, StampDefinition
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
    PassportTierEvent,
)
from app.models.post import Post
from app.models.push_subscription import PushSubscription
from app.models.rbac import Permission, Role, RolePermission, UserRole
from app.models.refresh_token import RefreshToken
from app.models.report import Report
from app.models.user import User
from app.models.user_notification import UserNotification
from app.models.user_profile import ProfileVisibility, UserProfile

__all__ = [
    "Organization",
    "OrganizationMember",
    "OrganizationVerification",
    "CitizenLocalStamp",
    "Comment",
    "EventInterest",
    "Like",
    "LocalEvent",
    "PartnerLead",
    "StampDefinition",
    "Post",
    "Report",
    "PushSubscription",
    "PartnerOffer",
    "Passport",
    "PassportOfferRedemption",
    "PassportStamp",
    "PassportTier",
    "PassportTierEvent",
    "Permission",
    "ProfileVisibility",
    "RefreshToken",
    "Role",
    "RolePermission",
    "User",
    "UserNotification",
    "UserProfile",
    "UserRole",
]
