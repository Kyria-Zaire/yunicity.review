/** Citizen Passport V2 overview API types (PASSPORT-05A). */

export type PassportSummaryResponse = {
  passport_tier: string | null;
  reputation: number;
  wallet_balance: number;
  earned_badges: number;
  active_challenges: number;
  claimable_rewards: number;
};

export type PassportWalletResponse = {
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
};

export type PassportReputationResponse = {
  total_points: number;
};

export type PassportOverviewPassportResponse = {
  status: string;
  created_at: string;
};

export type PassportBadgeResponse = {
  code: string;
  name: string;
  description: string;
  rarity: string;
  family: string;
  earned_at: string | null;
};

export type PassportChallengeResponse = {
  code: string;
  name: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
  reward_claimed: boolean;
  ym_reward: number;
};

export type PassportOverviewResponse = {
  summary: PassportSummaryResponse;
  passport: PassportOverviewPassportResponse;
  wallet: PassportWalletResponse;
  reputation: PassportReputationResponse;
};

export type PassportBadgesResponse = {
  earned: PassportBadgeResponse[];
  locked: PassportBadgeResponse[];
};

export type PassportChallengesResponse = {
  active: PassportChallengeResponse[];
  completed: PassportChallengeResponse[];
  claimable: PassportChallengeResponse[];
};

export type ChallengeClaimResponse = {
  challenge_code: string;
  claimed: boolean;
  ym_awarded: number;
  new_balance: number;
  message: string;
};
