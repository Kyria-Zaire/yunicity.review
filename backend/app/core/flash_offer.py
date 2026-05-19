"""Flash offer helpers — dynamic expiry, no cron (TICKET-501)."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from app.core.errors import AppError
from app.core.passport_constants import PartnerOfferStatus
from app.models.passport import PartnerOffer


@dataclass(frozen=True)
class FlashRemainingTime:
    remaining_hours: int
    remaining_minutes: int


@dataclass(frozen=True)
class FlashOfferSnapshot:
    """Public/API view — flash actif uniquement."""

    is_flash: bool
    flash_ends_at: datetime | None = None
    remaining_hours: int | None = None
    remaining_minutes: int | None = None


def _now(now: datetime | None) -> datetime:
    return now if now is not None else datetime.now(UTC)


def is_flash_active(offer: PartnerOffer, *, now: datetime | None = None) -> bool:
    """Flash encore en cours (fenêtre + offre publiée active)."""
    if not offer.is_flash or offer.flash_ends_at is None:
        return False
    current = _now(now)
    if offer.flash_ends_at <= current:
        return False
    status = (
        offer.status
        if isinstance(offer.status, PartnerOfferStatus)
        else PartnerOfferStatus(offer.status)
    )
    if status != PartnerOfferStatus.PUBLISHED or not offer.is_active:
        return False
    if offer.valid_until is not None and offer.valid_until <= current:
        return False
    if offer.valid_from is not None and offer.valid_from > current:
        return False
    return True


def compute_flash_remaining(
    flash_ends_at: datetime,
    *,
    now: datetime | None = None,
) -> FlashRemainingTime:
    current = _now(now)
    delta = flash_ends_at - current
    total_minutes = max(0, int(delta.total_seconds() // 60))
    return FlashRemainingTime(
        remaining_hours=total_minutes // 60,
        remaining_minutes=total_minutes % 60,
    )


def build_flash_snapshot(offer: PartnerOffer, *, now: datetime | None = None) -> FlashOfferSnapshot:
    if not is_flash_active(offer, now=now):
        return FlashOfferSnapshot(is_flash=False)
    assert offer.flash_ends_at is not None
    remaining = compute_flash_remaining(offer.flash_ends_at, now=now)
    return FlashOfferSnapshot(
        is_flash=True,
        flash_ends_at=offer.flash_ends_at,
        remaining_hours=remaining.remaining_hours,
        remaining_minutes=remaining.remaining_minutes,
    )


def validate_flash_fields(
    *,
    is_flash: bool,
    flash_ends_at: datetime | None,
    valid_until: datetime | None,
    status: PartnerOfferStatus | str,
    now: datetime | None = None,
) -> None:
    if not is_flash:
        return

    status_enum = status if isinstance(status, PartnerOfferStatus) else PartnerOfferStatus(status)
    if status_enum == PartnerOfferStatus.ARCHIVED:
        raise AppError(
            status_code=422,
            code="FLASH_NOT_ALLOWED",
            detail="Une offre archivée ne peut pas être flash.",
        )

    if flash_ends_at is None:
        raise AppError(
            status_code=422,
            code="FLASH_ENDS_AT_REQUIRED",
            detail="La date de fin flash est obligatoire pour une offre flash.",
        )

    current = _now(now)
    if flash_ends_at <= current:
        raise AppError(
            status_code=422,
            code="FLASH_ENDS_AT_PAST",
            detail="La fin flash doit être dans le futur.",
        )

    if valid_until is not None and flash_ends_at > valid_until:
        raise AppError(
            status_code=422,
            code="FLASH_AFTER_VALID_UNTIL",
            detail="La fin flash ne peut pas dépasser la date de fin de l'offre.",
        )


def apply_flash_clear_on_archive(offer: PartnerOffer, target: PartnerOfferStatus) -> None:
    if target == PartnerOfferStatus.ARCHIVED:
        offer.is_flash = False
        offer.flash_ends_at = None
