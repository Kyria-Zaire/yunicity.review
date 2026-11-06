"use client";

import { NotificationsMobileItem } from "@/components/notifications/mobile/notifications-mobile-item";
import type { NotificationsDesktopGroupedSection } from "@yunicity/utils";
import { NOTIFICATIONS_MOBILE_LOAD_PREVIOUS } from "@yunicity/utils";

type NotificationsMobileListProps = {
  sections: NotificationsDesktopGroupedSection[];
  onMarkRead: (id: string) => void;
  canLoadEarlier?: boolean;
  onLoadEarlier?: () => void;
};

export function NotificationsMobileList({
  sections,
  onMarkRead,
  canLoadEarlier = false,
  onLoadEarlier,
}: NotificationsMobileListProps) {
  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white" data-notifications-mobile-list="">
      {sections.map((section) => (
        <section key={section.section} aria-label={section.label}>
          <h2 className="border-b border-neutral-100 bg-neutral-50/80 px-3 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
            {section.label}
          </h2>
          <ul>
            {section.items.map((item) => (
              <li key={item.id}>
                <NotificationsMobileItem item={item} onMarkRead={onMarkRead} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {canLoadEarlier && onLoadEarlier ? (
        <div className="border-t border-neutral-100 p-3">
          <button
            type="button"
            onClick={onLoadEarlier}
            className="inline-flex w-full items-center justify-center rounded-full border border-yunicity-primary px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
          >
            {NOTIFICATIONS_MOBILE_LOAD_PREVIOUS}
          </button>
        </div>
      ) : null}
    </div>
  );
}
