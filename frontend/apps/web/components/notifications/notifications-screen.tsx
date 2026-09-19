"use client";

import { NotificationsAppShell } from "@/components/notifications/notifications-app-shell";
import { NotificationsDesktopScreen } from "@/components/notifications/desktop";
import { NotificationsMediumScreen } from "@/components/notifications/medium";
import { NotificationsMobileView } from "@/components/notifications/mobile";
import { useNotificationsPageContext } from "@/hooks/use-notifications-page-context";

export function NotificationsScreen() {
  const ctx = useNotificationsPageContext();

  const sharedProps = {
    allItems: ctx.allItems,
    unreadCount: ctx.unreadCount,
    preferences: ctx.preferences,
    isLoading: ctx.isLoading,
    isSavingPrefs: ctx.isSavingPrefs,
    error: ctx.error,
    sessionExpired: ctx.sessionExpired,
    localHints: ctx.localHints,
    onMarkRead: (id: string) => void ctx.markRead(id),
    onMarkAllRead: () => void ctx.markAllRead(),
    onPreferenceChange: (key: Parameters<typeof ctx.updatePreference>[0], value: boolean) =>
      void ctx.updatePreference(key, value),
    onReload: () => ctx.reload(),
  };

  return (
    <NotificationsAppShell>
      <div className="web-mobile-notifications-only w-full">
        <NotificationsMobileView {...sharedProps} />
      </div>

      <div className="web-medium-notifications-only w-full pb-8 pt-3 md:pt-4">
        <NotificationsMediumScreen {...sharedProps} />
      </div>

      <div className="web-desktop-notifications-only w-full pb-8 pt-4 lg:pt-6">
        <NotificationsDesktopScreen {...sharedProps} />
      </div>
    </NotificationsAppShell>
  );
}
