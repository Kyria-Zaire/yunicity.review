"use client";

import type { AdminActivityFeedItem } from "@yunicity/types";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";

const COCKPIT_ACTIVITY_PREVIEW_LIMIT = 5;

export function useCockpitRecentActivity() {
  const { adminActivityApi } = useAuth();
  const [items, setItems] = useState<AdminActivityFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const feed = await adminActivityApi.getActivityFeed({
        limit: COCKPIT_ACTIVITY_PREVIEW_LIMIT,
      });
      setItems(feed.items);
    } catch (err) {
      setItems([]);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger l'activité récente.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [adminActivityApi]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, isLoading, error };
}
