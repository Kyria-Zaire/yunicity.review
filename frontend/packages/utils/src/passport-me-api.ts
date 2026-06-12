import type {
  ChallengeClaimResponse,
  PassportBadgesResponse,
  PassportChallengesResponse,
  PassportOverviewResponse,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

export class PassportMeApi extends ApiClientBase {
  getMyPassport(): Promise<PassportOverviewResponse> {
    return this.getJson<PassportOverviewResponse>("/me/passport");
  }

  getMyPassportBadges(): Promise<PassportBadgesResponse> {
    return this.getJson<PassportBadgesResponse>("/me/passport/badges");
  }

  getMyPassportChallenges(): Promise<PassportChallengesResponse> {
    return this.getJson<PassportChallengesResponse>("/me/passport/challenges");
  }

  claimChallengeReward(challengeCode: string): Promise<ChallengeClaimResponse> {
    return this.postJson<ChallengeClaimResponse>(
      `/me/passport/challenges/${encodeURIComponent(challengeCode)}/claim`,
      {},
    );
  }
}

export function createPassportMeApi(client: AuthClient, apiBaseUrl: string): PassportMeApi {
  return new PassportMeApi(client, apiBaseUrl);
}
