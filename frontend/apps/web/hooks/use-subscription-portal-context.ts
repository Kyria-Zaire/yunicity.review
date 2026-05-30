"use client";

import type {
  SubscriptionCommunityStats,
  SubscriptionMe,
  SubscriptionPlansResponse,
} from "@yunicity/types";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export type SubscriptionPortalContextState = {
  loading: boolean;
  error: string | null;
  plans: SubscriptionPlansResponse | null;
  me: SubscriptionMe | null;
  community: SubscriptionCommunityStats | null;
  reload: () => void;
};

export function useSubscriptionPortalContext(): SubscriptionPortalContextState {
  const api = useYunicityApi();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlansResponse | null>(null);
  const [me, setMe] = useState<SubscriptionMe | null>(null);
  const [community, setCommunity] = useState<SubscriptionCommunityStats | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        api.listSubscriptionPlans(),
        api.getMySubscription(),
        api.getSubscriptionCommunityStats(),
      ]);
      const plansRes = results[0];
      const meRes = results[1];
      const communityRes = results[2];

      if (plansRes.status === "fulfilled") {
        setPlans(plansRes.value);
      } else {
        setPlans(null);
        setError("Impossible de charger les offres.");
      }

      if (meRes.status === "fulfilled") {
        setMe(meRes.value);
      } else {
        setMe(null);
      }

      if (communityRes.status === "fulfilled") {
        setCommunity(communityRes.value);
      } else {
        setCommunity({ supporter_count: 0, avatars: [] });
      }
    } catch {
      setError("Impossible de charger les abonnements.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  return { loading, error, plans, me, community, reload: load };
}
