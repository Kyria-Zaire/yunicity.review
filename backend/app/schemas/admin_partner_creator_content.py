"""Admin partner creator content moderation schemas (WEB-PARTNERS-06C)."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from app.core.partner_creator_content_constants import (
    PARTNER_CREATOR_CONTENT_REJECTION_REASON_MAX_LENGTH,
)
from app.schemas.partner_creator_content_management import PartnerCreatorContentManagementResponse


class PartnerCreatorContentRejectRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reason: str = Field(min_length=1, max_length=PARTNER_CREATOR_CONTENT_REJECTION_REASON_MAX_LENGTH)


PartnerCreatorContentAdminResponse = PartnerCreatorContentManagementResponse
