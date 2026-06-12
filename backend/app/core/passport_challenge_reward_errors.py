"""Passport challenge reward claim domain exceptions (PASSPORT-04C)."""


class PassportChallengeRewardError(Exception):
    """Base error for challenge reward claim operations."""


class ChallengeNotFoundError(PassportChallengeRewardError):
    """Challenge catalog entry was not found."""


class UserChallengeNotFoundError(PassportChallengeRewardError):
    """User has not started this challenge."""


class ChallengeNotCompletedError(PassportChallengeRewardError):
    """Challenge progress exists but is not completed yet."""


class ChallengeRewardAlreadyClaimed(PassportChallengeRewardError):
    """Reward was already claimed — prefer idempotent result when handling claims."""


class ChallengeRewardWalletError(PassportChallengeRewardError):
    """Wallet blocked the reward payout — reward_claimed must stay false."""
