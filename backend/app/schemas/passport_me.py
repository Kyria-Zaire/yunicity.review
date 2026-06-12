"""Citizen Passport overview API schemas (PASSPORT-05A)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PassportSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    passport_tier: str | None
    reputation: int
    wallet_balance: int
    earned_badges: int
    active_challenges: int
    claimable_rewards: int


class PassportWalletResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    balance: int
    lifetime_earned: int
    lifetime_spent: int


class PassportReputationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_points: int


class PassportOverviewPassportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str
    created_at: datetime


class PassportBadgeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    name: str
    description: str
    rarity: str
    family: str
    earned_at: datetime | None = None


class PassportChallengeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    name: str
    description: str
    progress: int
    target: int
    completed: bool
    reward_claimed: bool
    ym_reward: int


class PassportOverviewResponse(BaseModel):
    summary: PassportSummaryResponse
    passport: PassportOverviewPassportResponse
    wallet: PassportWalletResponse
    reputation: PassportReputationResponse


class PassportBadgesResponse(BaseModel):
    earned: list[PassportBadgeResponse]
    locked: list[PassportBadgeResponse]


class PassportChallengesResponse(BaseModel):
    active: list[PassportChallengeResponse]
    completed: list[PassportChallengeResponse]
    claimable: list[PassportChallengeResponse]


class ChallengeClaimResponse(BaseModel):
    challenge_code: str
    claimed: bool
    ym_awarded: int
    new_balance: int
    message: str
