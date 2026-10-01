"use client";

import { SessionExpiredPanel } from "@/components/auth/session-expired-panel";
import { NotificationsDesktopFeed } from "@/components/notifications/desktop/notifications-desktop-feed";
import { NotificationsDesktopHeader } from "@/components/notifications/desktop/notifications-desktop-header";
import { NotificationsDesktopToolbar } from "@/components/notifications/desktop/notifications-desktop-toolbar";
import { NotificationsMediumBottomPanels } from "@/components/notifications/medium/notifications-medium-bottom-panels";
import { NotificationsMediumSummaryRow } from "@/components/notifications/medium/notifications-medium-summary-row";
import { NotificationsEmptyState } from "@/components/notifications/notifications-empty-state";
import type { UserNotificationItem, UserNotificationPreferences } from "@yunicity/types";
import type { NotificationLocalHint } from "@yunicity/utils";
import {
  buildNotificationDesktopRow,
  buildNotificationEmptyState,
  buildNotificationMediumSummaryCards,
  filterNotificationsForDesktop,
  groupNotificationDesktopRows,
  hasNotificationDesktopEarlierItems,
  NOTIFICATIONS_DESKTOP_LOAD_PREVIOUS,
  NOTIFICATIONS_ERROR,
  NOTIFICATIONS_LOADING,
  NOTIFICATIONS_RETRY,
  NOTIFICATIONS_SESSION_EXPIRED_MESSAGE,
  resolveNotificationDeeplink,
  sortNotificationsForDesktop,
  type NotificationsDesktopPrimaryTab,
  type NotificationsDesktopSort,
  type NotificationsDesktopTypeFilter,
} from "@yunicity/utils";
import { useMemo, useState } from "react";

type NotificationsMediumScreenProps = {
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

/** Shell Notifications medium — 640 → 1023 px (MEDIUM-NOTIFICATIONS-01). */
export function NotificationsMediumScreen({
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
}: NotificationsMediumScreenProps) {
  const [primaryTab, setPrimaryTab] = useState<NotificationsDesktopPrimaryTab>("all");
  const [typeFilter, setTypeFilter] = useState<NotificationsDesktopTypeFilter>("all");
  const [sort, setSort] = useState<NotificationsDesktopSort>("recent");
  const [showEarlier, setShowEarlier] = useState(false);

  const filteredItems = useMemo(
    () =>
      sortNotificationsForDesktop(
        filterNotificationsForDesktop(allItems, primaryTab, typeFilter),
        sort,
      ),
    [allItems, primaryTab, sort, typeFilter],
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

  const summaryCards = useMemo(
    () =>
      buildNotificationMediumSummaryCards({
        items: allItems,
        unreadCount,
        hrefResolver: (item) => resolveNotificationDeeplink(item.deeplink, "web"),
      }),
    [allItems, unreadCount],
  );

  const emptyState = useMemo(
    () => buildNotificationEmptyState(primaryTab === "unread" ? "unread" : "all", localHints),
    [localHints, primaryTab],
  );

  const canLoadEarlier = !showEarlier && hasNotificationDesktopEarlierItems(filteredItems);

  return (
    <div className="notifications-medium-root w-full min-w-0" data-notifications-medium-root="">
      <NotificationsDesktopHeader unreadCount={unreadCount} onMarkAllRead={onMarkAllRead} />

      <NotificationsMediumSummaryRow
        cards={summaryCards}
        onUnreadClick={() => setPrimaryTab("unread")}
      />

      <NotificationsDesktopToolbar
        primaryTab={primaryTab}
        typeFilter={typeFilter}
        sort={sort}
        unreadCount={unreadCount}
        onPrimaryTabChange={setPrimaryTab}
        onTypeFilterChange={setTypeFilter}
        onSortChange={setSort}
      />

      {sessionExpired ? (
        <SessionExpiredPanel
          message={NOTIFICATIONS_SESSION_EXPIRED_MESSAGE}
          returnPath="/notifications"
        />
      ) : isLoading ? (
        <p className="py-10 text-center text-sm text-neutral-500" role="status">
          {NOTIFICATIONS_LOADING}
        </p>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-center">
          <p className="text-sm text-red-700">{NOTIFICATIONS_ERROR}</p>
          <button
            type="button"
            onClick={onReload}
            className="mt-4 inline-flex items-center justify-center rounded-full border border-red-300 bg-white px-5 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-50"
          >
            {NOTIFICATIONS_RETRY}
          </button>
        </div>
      ) : sections.length === 0 ? (
        <NotificationsEmptyState view={emptyState} />
      ) : (
        <>
          <NotificationsDesktopFeed sections={sections} onMarkRead={onMarkRead} />
          {canLoadEarlier ? (
            <button
              type="button"
              onClick={() => setShowEarlier(true)}
              className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-yunicity-primary px-5 py-3 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
            >
              {NOTIFICATIONS_DESKTOP_LOAD_PREVIOUS}
            </button>
          ) : null}
        </>
      )}

      <NotificationsMediumBottomPanels
        preferences={preferences}
        isSavingPrefs={isSavingPrefs}
        onPreferenceChange={onPreferenceChange}
      />
    </div>
  );
}
