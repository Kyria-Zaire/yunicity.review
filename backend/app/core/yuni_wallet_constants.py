"""YuniMonnaie wallet domain constants (PASSPORT-02A)."""

from __future__ import annotations

from enum import StrEnum

# MVP YM earn rates — hooks in PASSPORT-02B+ will use these values.
STAMP_EARNED_YM = 1
PARTNER_REDEMPTION_YM = 1
CHALLENGE_COMPLETED_DEFAULT_YM = 10


class YuniWalletStatus(StrEnum):
    ACTIVE = "active"
    SUSPENDED = "suspended"


class YuniTransactionType(StrEnum):
    EARN = "EARN"
    SPEND = "SPEND"
    ADJUSTMENT = "ADJUSTMENT"
    REVERSAL = "REVERSAL"
    EXPIRE = "EXPIRE"


class YuniTransactionReferenceType(StrEnum):
    PASSPORT_STAMP = "passport_stamp"
    PARTNER_REDEMPTION = "partner_redemption"
    PARTNER_OFFER_REDEMPTION = "partner_offer_redemption"
    CHALLENGE = "challenge"
    ADMIN_ADJUSTMENT = "admin_adjustment"
    REWARD_REDEMPTION = "reward_redemption"
    SPEND_REVERSAL = "spend_reversal"
    BACKFILL = "backfill"
    SYSTEM = "system"


YUNI_WALLET_STATUSES: frozenset[str] = frozenset(member.value for member in YuniWalletStatus)
YUNI_TRANSACTION_TYPES: frozenset[str] = frozenset(member.value for member in YuniTransactionType)
YUNI_TRANSACTION_REFERENCE_TYPES: frozenset[str] = frozenset(
    member.value for member in YuniTransactionReferenceType
)
