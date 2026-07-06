"use client";

import { NotificationsEmptyState } from "@/components/notifications/notifications-empty-state";
import { SessionExpiredPanel } from "@/components/auth/session-expired-panel";
import {
  NotificationsMobileFilterPills,
  NotificationsMobileHeader,
  NotificationsMobileList,
} from "@/components/notifications/mobile";
import type { UserNotificationItem } from "@yunicity/types";
import type { NotificationEmptyStateView, NotificationLocalHint } from "@yunicity/utils";
import {
  NOTIFICATIONS_ERROR,
  NOTIFICATIONS_LOADING,
  NOTIFICATIONS_RETRY,
  NOTIFICATIONS_SESSION_EXPIRED_MESSAGE,
  NOTIFICATIONS_MOBILE_TAB_EMPTY,
  buildNotificationEmptyState,
  buildNotificationMobileRow,
  countNotificationsMobileTabBadges,
  filterNotificationsByMobileTab,
  groupNotificationMobileRows,
  resolveNotificationDeeplink,
  type NotificationsMobileTabId,
} from "@yunicity/utils";
import { useMemo, useState } from "react";

type NotificationsMobileViewProps = {
  allItems: UserNotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  sessionExpired: boolean;
  localHints: NotificationLocalHint[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onReload: () => void;
};

/** Vue mobile complète Notifications (MOBILE-NOTIFICATIONS-01). */
export function NotificationsMobileView({
  allItems,
  unreadCount,
  isLoading,
  error,
  sessionExpired,
  localHints,
  onMarkRead,
  onMarkAllRead,
  onReload,
}: NotificationsMobileViewProps) {
  const [mobileTab, setMobileTab] = useState<NotificationsMobileTabId>("all");

  const filteredItems = useMemo(
    () => filterNotificationsByMobileTab(allItems, mobileTab),
    [allItems, mobileTab],
  );

  const badges = useMemo(() => countNotificationsMobileTabBadges(allItems), [allItems]);

  const rows = useMemo(
    () =>
      filteredItems.map((item) =>
        buildNotificationMobileRow(item, resolveNotificationDeeplink(item.deeplink, "web")),
      ),
    [filteredItems],
  );

  const sections = useMemo(
    () => groupNotificationMobileRows(rows, filteredItems),
    [filteredItems, rows],
  );

  const emptyState: NotificationEmptyStateView = useMemo(() => {
    if (mobileTab !== "all" && allItems.length > 0 && filteredItems.length === 0) {
      return {
        ...buildNotificationEmptyState("all", localHints),
        body: NOTIFICATIONS_MOBILE_TAB_EMPTY,
      };
    }
    const tabForEmpty =
      mobileTab === "community"
        ? "social"
        : mobileTab === "places" || mobileTab === "offers"
          ? "passport"
          : mobileTab === "events"
            ? "events"
            : mobileTab === "system"
              ? "system"
              : "all";
    return buildNotificationEmptyState(tabForEmpty, localHints);
  }, [allItems.length, filteredItems.length, localHints, mobileTab]);

  return (
    <div className="web-mobile-notifications-only min-w-0 space-y-4 bg-white px-4 pb-24 pt-1">
      <NotificationsMobileHeader
        canMarkAllRead={unreadCount > 0}
        onMarkAllRead={onMarkAllRead}
      />

      <NotificationsMobileFilterPills
        activeTab={mobileTab}
        badges={badges}
        onSelectTab={setMobileTab}
      />

      {sessionExpired ? (
        <SessionExpiredPanel
          message={NOTIFICATIONS_SESSION_EXPIRED_MESSAGE}
          returnPath="/notifications"
        />
      ) : null}

      {!sessionExpired && isLoading ? (
        <p className="py-12 text-center text-sm text-neutral-500" role="status">
          {NOTIFICATIONS_LOADING}
        </p>
      ) : null}

      {!sessionExpired && !isLoading && error ? (
        <div className="space-y-3 py-8 text-center">
          <p className="text-sm text-neutral-700">{NOTIFICATIONS_ERROR}</p>
          <button
            type="button"
            onClick={onReload}
            className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
          >
            {NOTIFICATIONS_RETRY}
          </button>
        </div>
      ) : null}

      {!sessionExpired && !isLoading && !error && filteredItems.length === 0 ? (
        <NotificationsEmptyState view={emptyState} />
      ) : null}

      {!sessionExpired && !isLoading && !error && filteredItems.length > 0 ? (
        <NotificationsMobileList
          sections={sections}
          onMarkRead={onMarkRead}
          showCaughtUp={unreadCount === 0}
        />
      ) : null}
    </div>
  );
}
