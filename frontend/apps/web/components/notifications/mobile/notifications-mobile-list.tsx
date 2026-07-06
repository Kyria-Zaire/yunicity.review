"use client";

import { NotificationsMobileItem } from "@/components/notifications/mobile/notifications-mobile-item";
import type { NotificationsMobileGroupedSection } from "@yunicity/utils";
import { NOTIFICATIONS_MOBILE_CAUGHT_UP } from "@yunicity/utils";
import { CheckCircle2 } from "lucide-react";

type NotificationsMobileListProps = {
  sections: NotificationsMobileGroupedSection[];
  onMarkRead: (id: string) => void;
  showCaughtUp?: boolean;
};

/** Liste groupée mobile Notifications (MOBILE-NOTIFICATIONS-01). */
export function NotificationsMobileList({
  sections,
  onMarkRead,
  showCaughtUp = true,
}: NotificationsMobileListProps) {
  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <section key={section.section} aria-label={section.label}>
          <h2 className="mb-2 px-0.5 text-sm font-bold text-neutral-900">{section.label}</h2>
          <ul className="space-y-2">
            {section.items.map((item) => (
              <li key={item.id}>
                <NotificationsMobileItem item={item} onMarkRead={onMarkRead} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {showCaughtUp ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-violet-50 text-yunicity-primary">
            <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <p className="text-sm font-semibold text-neutral-700">{NOTIFICATIONS_MOBILE_CAUGHT_UP}</p>
        </div>
      ) : null}
    </div>
  );
}
