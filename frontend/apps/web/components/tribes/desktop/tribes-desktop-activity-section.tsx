"use client";

import type { TribesDesktopActivityItem } from "@yunicity/utils";
import { TRIBES_DESKTOP_ACTIVITY_TITLE, TRIBES_DESKTOP_ACTIVITY_VIEW_POST } from "@yunicity/utils";
import Link from "next/link";

type TribesDesktopActivitySectionProps = {
  items: TribesDesktopActivityItem[];
};

export function TribesDesktopActivitySection({ items }: TribesDesktopActivitySectionProps) {
  if (items.length === 0) return null;

  return (
    <section
      className="space-y-4"
      aria-labelledby="tribes-desktop-activity-title"
      data-tribes-desktop-activity=""
    >
      <h2 id="tribes-desktop-activity-title" className="text-lg font-bold text-neutral-900">
        {TRIBES_DESKTOP_ACTIVITY_TITLE}
      </h2>

      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <li key={item.id}>
            <article className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] text-sm font-bold text-yunicity-primary"
                  aria-hidden
                >
                  {item.tribeName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <Link href={item.tribeHref} className="text-sm font-bold text-neutral-900 hover:text-yunicity-primary">
                      {item.tribeName}
                    </Link>
                    <span className="text-xs text-neutral-400">·</span>
                    <span className="text-xs text-neutral-500">{item.authorLabel}</span>
                    <span className="text-xs text-neutral-400">·</span>
                    <time className="text-xs text-neutral-500">{item.timestampLabel}</time>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-600">{item.excerpt}</p>
                  <Link
                    href={item.href}
                    className="mt-3 inline-flex text-sm font-semibold text-yunicity-primary hover:underline"
                  >
                    {TRIBES_DESKTOP_ACTIVITY_VIEW_POST}
                  </Link>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
