"use client";

import type {
  NotificationInboxTab,
  UserNotificationItem,
  UserNotificationPreferences,
  UserNotificationSummaryResponse,
} from "@yunicity/types";
import {
  buildLocalHintsFromTerritory,
  type NotificationLocalHint,
} from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

const DEFAULT_CITY = "Reims";

export function useNotificationsPageContext() {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [tab, setTab] = useState<NotificationInboxTab>("all");
  const [localHints, setLocalHints] = useState<NotificationLocalHint[]>([]);
  const [items, setItems] = useState<UserNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [summary, setSummary] = useState<UserNotificationSummaryResponse | null>(null);
  const [preferences, setPreferences] = useState<UserNotificationPreferences | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      const data = await api.notifications.getInboxSummary();
      setSummary(data);
      setUnreadCount(data.unread_count);
    } catch {
      setSummary(null);
    }
  }, [api]);

  const loadPreferences = useCallback(async () => {
    try {
      const data = await api.notifications.getNotificationPreferences();
      setPreferences(data);
    } catch {
      setPreferences(null);
    }
  }, [api]);

  const loadInbox = useCallback(
    async (activeTab: NotificationInboxTab, cursor?: string | null) => {
      const loadingMore = Boolean(cursor);
      if (loadingMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }
      try {
        const data = await api.notifications.listInbox({
          tab: activeTab,
          cursor: cursor ?? undefined,
          limit: 20,
        });
        setItems((prev) => (loadingMore ? [...prev, ...data.items] : data.items));
        setUnreadCount(data.unread_count);
        setNextCursor(data.next_cursor ?? null);
        setHasMore(Boolean(data.has_more));
      } catch {
        if (!loadingMore) {
          setItems([]);
          setError("load_failed");
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [api],
  );

  useEffect(() => {
    void loadSummary();
    void loadPreferences();
  }, [loadSummary, loadPreferences]);

  useEffect(() => {
    void loadInbox(tab);
  }, [tab, loadInbox]);

  useEffect(() => {
    let cancelled = false;

    async function loadTerritoryHints() {
      let city = user?.city?.trim() || DEFAULT_CITY;
      try {
        const profile = await api.getProfileMe();
        city = profile.city?.trim() || user?.city?.trim() || DEFAULT_CITY;
      } catch {
        /* profil optionnel */
      }

      const [eventsRes, tribesRes, neighborhoodsRes, offersRes] = await Promise.allSettled([
        api.events.listEvents({ city }),
        api.tribes.listTribes({ city, page_size: 5 }),
        api.neighborhoods.listNeighborhoods({ city, page_size: 4, featured_only: true }),
        api.fetchPublicPartnerOffers({ city, limit: 8 }),
      ]);

      if (cancelled) return;

      const events = eventsRes.status === "fulfilled" ? eventsRes.value.items : [];
      const tribes = tribesRes.status === "fulfilled" ? tribesRes.value.items : [];
      const neighborhoods =
        neighborhoodsRes.status === "fulfilled" ? neighborhoodsRes.value.items : [];
      const offerTitles =
        offersRes.status === "fulfilled"
          ? offersRes.value.items.map((offer) => offer.title).filter(Boolean)
          : [];

      setLocalHints(
        buildLocalHintsFromTerritory({
          events,
          tribes,
          neighborhoods,
          offerTitles,
        }),
      );
    }

    void loadTerritoryHints();
    return () => {
      cancelled = true;
    };
  }, [api, user?.city]);

  const markRead = useCallback(
    async (id: string) => {
      try {
        await api.notifications.markNotificationRead(id);
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        await loadSummary();
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        /* best effort */
      }
    },
    [api, loadSummary],
  );

  const markAllRead = useCallback(async () => {
    try {
      await api.notifications.markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      await loadSummary();
    } catch {
      /* best effort */
    }
  }, [api, loadSummary]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoadingMore) return;
    await loadInbox(tab, nextCursor);
  }, [hasMore, nextCursor, isLoadingMore, loadInbox, tab]);

  const updatePreference = useCallback(
    async (key: keyof UserNotificationPreferences, value: boolean) => {
      if (!preferences) return;
      setIsSavingPrefs(true);
      try {
        const updated = await api.notifications.updateNotificationPreferences({ [key]: value });
        setPreferences(updated);
      } finally {
        setIsSavingPrefs(false);
      }
    },
    [api, preferences],
  );

  return {
    tab,
    setTab,
    items,
    unreadCount,
    summary,
    preferences,
    hasMore,
    isLoading,
    isLoadingMore,
    isSavingPrefs,
    error,
    markRead,
    markAllRead,
    loadMore,
    updatePreference,
    localHints,
    reload: () => {
      void loadSummary();
      void loadInbox(tab);
    },
  };
}
