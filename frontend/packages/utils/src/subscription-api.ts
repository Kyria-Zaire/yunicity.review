import type {
  SubscriptionCheckoutRequest,
  SubscriptionCheckoutResponse,
  SubscriptionCommunityStats,
  SubscriptionMe,
  SubscriptionPlansResponse,
} from "@yunicity/types";

import type { AuthClient } from "./auth/auth-client";
import { ApiClientBase } from "./api-client";

export class SubscriptionsApi extends ApiClientBase {
  listPlans(): Promise<SubscriptionPlansResponse> {
    return this.getJson<SubscriptionPlansResponse>("/subscriptions/plans");
  }

  getCommunityStats(): Promise<SubscriptionCommunityStats> {
    return this.getJson<SubscriptionCommunityStats>("/subscriptions/community-stats");
  }

  getMySubscription(): Promise<SubscriptionMe> {
    return this.getJson<SubscriptionMe>("/subscriptions/me");
  }

  startCheckout(payload: SubscriptionCheckoutRequest): Promise<SubscriptionCheckoutResponse> {
    return this.postJson<SubscriptionCheckoutResponse>("/subscriptions/checkout", payload);
  }
}

export function createSubscriptionsApi(client: AuthClient, apiBaseUrl: string): SubscriptionsApi {
  return new SubscriptionsApi(client, apiBaseUrl);
}

export async function fetchSubscriptionPlansPublic(
  apiBaseUrl: string,
): Promise<SubscriptionPlansResponse> {
  const base = apiBaseUrl.replace(/\/$/, "");
  const response = await fetch(`${base}/api/v1/subscriptions/plans`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("Impossible de charger les offres.");
  }
  return response.json() as Promise<SubscriptionPlansResponse>;
}

export async function fetchSubscriptionCommunityStatsPublic(
  apiBaseUrl: string,
): Promise<SubscriptionCommunityStats> {
  const base = apiBaseUrl.replace(/\/$/, "");
  const response = await fetch(`${base}/api/v1/subscriptions/community-stats`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("Impossible de charger les statistiques.");
  }
  return response.json() as Promise<SubscriptionCommunityStats>;
}
