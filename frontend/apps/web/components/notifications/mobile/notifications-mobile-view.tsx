"use client";

import { SessionExpiredPanel } from "@/components/auth/session-expired-panel";
import { NotificationsMediumBottomPanels } from "@/components/notifications/medium/notifications-medium-bottom-panels";
import {
  NotificationsMobileDontMiss,
  NotificationsMobileHeader,
  NotificationsMobileList,
  NotificationsMobileSummaryBanner,
  NotificationsMobileToolbar,
} from "@/components/notifications/mobile";
import { NotificationsEmptyState } from "@/components/notifications/notifications-empty-state";
import type { UserNotificationItem, UserNotificationPreferences } from "@yunicity/types";
import type { NotificationLocalHint } from "@yunicity/utils";
import {
  buildNotificationDesktopRow,
  buildNotificationEmptyState,
  buildNotificationMediumSummaryCards,
  countNotificationDesktopDisplayedRecent,
  filterNotificationsForDesktop,
  groupNotificationDesktopRows,
  hasNotificationDesktopEarlierItems,
  NOTIFICATIONS_ERROR,
  NOTIFICATIONS_LOADING,
  NOTIFICATIONS_MOBILE_TAB_EMPTY,
  NOTIFICATIONS_RETRY,
  NOTIFICATIONS_SESSION_EXPIRED_MESSAGE,
  resolveNotificationDeeplink,
  sortNotificationsForDesktop,
  type NotificationsDesktopPrimaryTab,
  type NotificationsDesktopTypeFilter,
} from "@yunicity/utils";
import { useMemo, useState } from "react";

type NotificationsMobileViewProps = {
  allItems: UserNotificationItem[];
  unreadCount: number;
  preferences: UserNotificationPreferences | null;
  isLoading: boolean;
  isSavingPrefs: boolean;
  error: string | null;
  sessionExpired: boolean;
  localHints: NotificationLocalHint[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onPreferenceChange: (key: keyof UserNotificationPreferences, value: boolean) => void;
  onReload: () => void;
};

/** Vue mobile Notifications — maquette R2 + bottom navbar shell. */
export function NotificationsMobileView({
  allItems,
  unreadCount,
  preferences,
  isLoading,
  isSavingPrefs,
  error,
  sessionExpired,
  localHints,
  onMarkRead,
  onMarkAllRead,
  onPreferenceChange,
  onReload,
}: NotificationsMobileViewProps) {
  const [primaryTab, setPrimaryTab] = useState<NotificationsDesktopPrimaryTab>("all");
  const [typeFilter, setTypeFilter] = useState<NotificationsDesktopTypeFilter>("all");
  const [showEarlier, setShowEarlier] = useState(false);

  const filteredItems = useMemo(
    () =>
      sortNotificationsForDesktop(
        filterNotificationsForDesktop(allItems, primaryTab, typeFilter),
        "recent",
      ),
    [allItems, primaryTab, typeFilter],
  );

  const rows = useMemo(
    () =>
      filteredItems.map((item) =>
        buildNotificationDesktopRow(item, resolveNotificationDeeplink(item.deeplink, "web")),
      ),
    [filteredItems],
  );

  const sections = useMemo(
    () => groupNotificationDesktopRows(rows, filteredItems, { includeEarlier: showEarlier }),
    [filteredItems, rows, showEarlier],
  );

  const displayedCount = useMemo(
    () => countNotificationDesktopDisplayedRecent(allItems),
    [allItems],
  );

  const summaryCards = useMemo(
    () =>
      buildNotificationMediumSummaryCards({
        items: allItems,
        unreadCount,
        hrefResolver: (item) => resolveNotificationDeeplink(item.deeplink, "web"),
      }),
    [allItems, unreadCount],
  );

  const emptyState = useMemo(() => {
    if (allItems.length > 0 && filteredItems.length === 0) {
      return {
        ...buildNotificationEmptyState("all", localHints),
        body: NOTIFICATIONS_MOBILE_TAB_EMPTY,
      };
    }
    return buildNotificationEmptyState(primaryTab === "unread" ? "unread" : "all", localHints);
  }, [allItems.length, filteredItems.length, localHints, primaryTab]);

  const canLoadEarlier = !showEarlier && hasNotificationDesktopEarlierItems(filteredItems);

  return (
    <div
      className="web-mobile-notifications-only min-w-0 bg-[#F4F5F7]"
      data-notifications-mobile=""
    >
      <NotificationsMobileHeader />

      <div className="space-y-4 px-4 pb-4 pt-3">
        <NotificationsMobileSummaryBanner
          unreadCount={unreadCount}
          displayedCount={displayedCount}
          onMarkAllRead={onMarkAllRead}
        />

        <NotificationsMobileToolbar
          primaryTab={primaryTab}
          typeFilter={typeFilter}
          unreadCount={unreadCount}
          onPrimaryTabChange={setPrimaryTab}
          onTypeFilterChange={setTypeFilter}
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
          <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center">
            <p className="text-sm text-red-700">{NOTIFICATIONS_ERROR}</p>
            <button
              type="button"
              onClick={onReload}
              className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
            >
              {NOTIFICATIONS_RETRY}
            </button>
          </div>
        ) : null}

        {!sessionExpired && !isLoading && !error && sections.length === 0 ? (
          <NotificationsEmptyState view={emptyState} />
        ) : null}

        {!sessionExpired && !isLoading && !error && sections.length > 0 ? (
          <NotificationsMobileList
            sections={sections}
            onMarkRead={onMarkRead}
            canLoadEarlier={canLoadEarlier}
            onLoadEarlier={() => setShowEarlier(true)}
          />
        ) : null}

        <NotificationsMobileDontMiss cards={summaryCards} />

        <NotificationsMediumBottomPanels
          preferences={preferences}
          isSavingPrefs={isSavingPrefs}
          onPreferenceChange={onPreferenceChange}
        />
      </div>
    </div>
  );
}
