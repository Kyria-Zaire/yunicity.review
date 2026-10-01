"use client";

import { NotificationsDesktopItem } from "@/components/notifications/desktop/notifications-desktop-item";
import type { NotificationsDesktopGroupedSection } from "@yunicity/utils";

type NotificationsDesktopFeedProps = {
  sections: NotificationsDesktopGroupedSection[];
  onMarkRead: (id: string) => void;
};

export function NotificationsDesktopFeed({ sections, onMarkRead }: NotificationsDesktopFeedProps) {
  return (
    <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
      {sections.map((section) => (
        <section key={section.section} data-notifications-desktop-section={section.section}>
          <h2 className="border-b border-neutral-100 bg-neutral-50/70 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">
            {section.label}
          </h2>
          <ul>
            {section.items.map((item) => (
              <li key={item.id} className="border-b border-neutral-100 last:border-b-0">
                <NotificationsDesktopItem item={item} onMarkRead={onMarkRead} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
