"use client";

import { NotificationCard } from "@/components/notifications/notification-card";
import { NotificationsAppShell } from "@/components/notifications/notifications-app-shell";
import { NotificationsEmptyState } from "@/components/notifications/notifications-empty-state";
import { NotificationsHero } from "@/components/notifications/notifications-hero";
import {
  notificationActiveHeading,
  NotificationsInternalSidebar,
} from "@/components/notifications/notifications-internal-sidebar";
import { NotificationsRightRail } from "@/components/notifications/notifications-right-rail";
import { NotificationsTabs } from "@/components/notifications/notifications-tabs";
import { SessionExpiredPanel } from "@/components/auth/session-expired-panel";
import { useNotificationsPageContext } from "@/hooks/use-notifications-page-context";
import {
  buildNotificationEmptyState,
  NOTIFICATIONS_ERROR,
  NOTIFICATIONS_LOAD_MORE,
  NOTIFICATIONS_LOADING,
  NOTIFICATIONS_MARK_ALL_READ,
  NOTIFICATIONS_RETRY,
  NOTIFICATIONS_SESSION_EXPIRED_MESSAGE,
} from "@yunicity/utils";
import { Check, ChevronDown } from "lucide-react";
import { useMemo } from "react";

export function NotificationsScreen() {
  const ctx = useNotificationsPageContext();

  const sectionUnread = useMemo(
    () =>
      ctx.sectionUnread ?? {
        mentions: ctx.summary?.unread_mentions ?? 0,
        social: ctx.summary?.unread_social ?? 0,
        events: ctx.summary?.unread_events ?? 0,
        passport: ctx.summary?.unread_passport ?? 0,
        system: ctx.summary?.unread_system ?? 0,
      },
    [ctx.sectionUnread, ctx.summary],
  );

  const activeHeading = notificationActiveHeading(ctx.tab);

  const emptyState = useMemo(
    () => buildNotificationEmptyState(ctx.tab, ctx.localHints),
    [ctx.tab, ctx.localHints],
  );

  return (
    <NotificationsAppShell>
      <div className="mx-auto w-full max-w-[1400px] px-3 py-2 sm:px-4 sm:py-4">
        <div className="grid gap-8 xl:grid-cols-[16rem_minmax(0,1fr)_20rem]">
          <NotificationsInternalSidebar
            activeTab={ctx.tab}
            unreadCount={ctx.unreadCount}
            sectionUnread={sectionUnread}
            preferences={ctx.preferences}
            isSavingPrefs={ctx.isSavingPrefs}
            onTabChange={ctx.setTab}
            onMarkAllRead={() => void ctx.markAllRead()}
            onPreferenceChange={(key, value) => void ctx.updatePreference(key, value)}
          />

          <div className="min-w-0">
            <header className="mb-6 space-y-4">
              <NotificationsHero activeHeading={activeHeading} />
              <div className="flex flex-wrap items-center justify-end gap-3 lg:hidden">
                {ctx.unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => void ctx.markAllRead()}
                    className="inline-flex items-center gap-1.5 rounded-full border border-yunicity-primary/20 bg-white px-4 py-2 text-sm font-semibold text-yunicity-primary shadow-sm transition hover:bg-yunicity-primary-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
                  >
                    <Check className="h-4 w-4" aria-hidden />
                    {NOTIFICATIONS_MARK_ALL_READ}
                  </button>
                ) : null}
              </div>
            </header>

            <NotificationsTabs
              active={ctx.tab}
              unreadCount={ctx.unreadCount}
              sectionUnread={sectionUnread}
              onChange={ctx.setTab}
            />

            <div className="mt-6">
              {ctx.sessionExpired ? (
                <SessionExpiredPanel
                  message={NOTIFICATIONS_SESSION_EXPIRED_MESSAGE}
                  returnPath="/notifications"
                />
              ) : ctx.isLoading ? (
                <p className="text-sm text-neutral-500" role="status">
                  {NOTIFICATIONS_LOADING}
                </p>
              ) : ctx.error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-center">
                  <p className="text-sm text-red-700">{NOTIFICATIONS_ERROR}</p>
                  <button
                    type="button"
                    onClick={() => ctx.reload()}
                    className="mt-4 inline-flex items-center justify-center rounded-full border border-red-300 bg-white px-5 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    {NOTIFICATIONS_RETRY}
                  </button>
                </div>
              ) : ctx.items.length === 0 ? (
                <NotificationsEmptyState view={emptyState} />
              ) : (
                <ul className="space-y-3">
                  {ctx.items.map((item) => (
                    <li key={item.id}>
                      <NotificationCard
                        item={item}
                        onMarkRead={(id) => void ctx.markRead(id)}
                      />
                    </li>
                  ))}
                </ul>
              )}

              {ctx.hasMore && !ctx.isLoading ? (
                <button
                  type="button"
                  onClick={() => void ctx.loadMore()}
                  disabled={ctx.isLoadingMore}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white py-3 text-sm font-semibold text-neutral-700 shadow-sm transition hover:border-yunicity-primary/30 hover:text-yunicity-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary disabled:opacity-60"
                >
                  {ctx.isLoadingMore ? NOTIFICATIONS_LOADING : NOTIFICATIONS_LOAD_MORE}
                  <ChevronDown className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
            </div>
          </div>

          <NotificationsRightRail
            summary={ctx.summary}
            localHints={ctx.localHints}
            onShowAll={() => ctx.setTab("all")}
          />
        </div>
      </div>
    </NotificationsAppShell>
  );
}
