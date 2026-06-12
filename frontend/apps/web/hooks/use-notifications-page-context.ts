"use client";

import type {
  NotificationInboxTab,
  UserNotificationItem,
  UserNotificationPreferences,
  UserNotificationSummaryResponse,
} from "@yunicity/types";
import {
  buildLocalHintsFromTerritory,
  countUnreadNotificationsByTab,
  filterNotificationsByTab,
  isSessionExpiredAuthError,
  type NotificationLocalHint,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

const DEFAULT_CITY = "Reims";
const INBOX_FETCH_LIMIT = 50;

export function useNotificationsPageContext() {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [tab, setTab] = useState<NotificationInboxTab>("all");
  const [localHints, setLocalHints] = useState<NotificationLocalHint[]>([]);
  const [allItems, setAllItems] = useState<UserNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [summary, setSummary] = useState<UserNotificationSummaryResponse | null>(null);
  const [preferences, setPreferences] = useState<UserNotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const items = useMemo(() => filterNotificationsByTab(allItems, tab), [allItems, tab]);

  const sectionUnreadFromItems = useMemo(
    () => countUnreadNotificationsByTab(allItems),
    [allItems],
  );

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

  const loadInbox = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSessionExpired(false);
    try {
      const data = await api.notifications.listInbox({ tab: "all", limit: INBOX_FETCH_LIMIT });
      setAllItems(data.items);
      setUnreadCount(data.unread_count);
    } catch (err) {
      setAllItems([]);
      if (isSessionExpiredAuthError(err)) {
        setSessionExpired(true);
        setError(null);
      } else {
        setError("load_failed");
      }
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void loadSummary();
    void loadPreferences();
    void loadInbox();
  }, [loadSummary, loadPreferences, loadInbox]);

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
        setAllItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
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
      setAllItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      await loadSummary();
    } catch {
      /* best effort */
    }
  }, [api, loadSummary]);

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

  const resolvedSummary = useMemo((): UserNotificationSummaryResponse | null => {
    if (summary != null) {
      return summary;
    }
    if (allItems.length === 0 && unreadCount === 0) {
      return null;
    }
    return {
      unread_count: unreadCount,
      unread_mentions: sectionUnreadFromItems.mentions,
      unread_social: sectionUnreadFromItems.social,
      unread_events: sectionUnreadFromItems.events,
      unread_passport: sectionUnreadFromItems.passport,
      unread_system: sectionUnreadFromItems.system,
    };
  }, [allItems.length, sectionUnreadFromItems, summary, unreadCount]);

  return {
    tab,
    setTab,
    items,
    unreadCount,
    summary: resolvedSummary,
    preferences,
    hasMore: false,
    isLoading,
    isLoadingMore: false,
    isSavingPrefs,
    error,
    sessionExpired,
    markRead,
    markAllRead,
    loadMore: async () => {},
    updatePreference,
    localHints,
    sectionUnread: sectionUnreadFromItems,
    reload: () => {
      setSessionExpired(false);
      void loadSummary();
      void loadInbox();
    },
  };
}
