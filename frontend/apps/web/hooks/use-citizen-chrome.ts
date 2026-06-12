"use client";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import { useCallback, useEffect, useSyncExternalStore } from "react";

type CitizenChromeSnapshot = {
  unreadCount: number;
  displayName: string | null;
  isReady: boolean;
};

const INITIAL: CitizenChromeSnapshot = {
  unreadCount: 0,
  displayName: null,
  isReady: false,
};

let snapshot: CitizenChromeSnapshot = INITIAL;
const listeners = new Set<() => void>();
let loadPromise: Promise<void> | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

function setSnapshot(next: CitizenChromeSnapshot) {
  snapshot = next;
  emit();
}

/** Charge profil + badge notifications une seule fois par session (sidebar + top nav). */
export function useCitizenChromeBootstrap() {
  const api = useYunicityApi();
  const { user } = useAuth();

  const load = useCallback(async () => {
    if (!user) {
      setSnapshot(INITIAL);
      return;
    }

    if (loadPromise) {
      await loadPromise;
      return;
    }

    loadPromise = (async () => {
      const fallbackName = user.email?.split("@")[0] ?? null;
      try {
        const [profileRes, inboxRes] = await Promise.allSettled([
          api.getProfileMe(),
          api.notifications.listInbox(1),
        ]);

        const displayName =
          profileRes.status === "fulfilled"
            ? profileRes.value.display_name?.trim() ||
              profileRes.value.username?.trim() ||
              fallbackName
            : fallbackName;

        const unreadCount =
          inboxRes.status === "fulfilled" ? inboxRes.value.unread_count : 0;

        setSnapshot({ unreadCount, displayName, isReady: true });
      } catch {
        setSnapshot({ unreadCount: 0, displayName: fallbackName, isReady: true });
      } finally {
        loadPromise = null;
      }
    })();

    await loadPromise;
  }, [api, user]);

  useEffect(() => {
    void load();
  }, [load]);

  return { refresh: load };
}

export function useCitizenChrome() {
  useCitizenChromeBootstrap();
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Compteur non-lus — une seule requête réseau partagée avec le chrome. */
export function useNotificationUnread(): number {
  return useCitizenChrome().unreadCount;
}
