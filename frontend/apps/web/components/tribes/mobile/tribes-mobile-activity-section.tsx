"use client";

import type { TribesDesktopActivityItem } from "@yunicity/utils";
import { TRIBES_DESKTOP_ACTIVITY_TITLE, TRIBES_DESKTOP_ACTIVITY_VIEW_POST } from "@yunicity/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

type TribesMobileActivitySectionProps = {
  items: TribesDesktopActivityItem[];
};

export function TribesMobileActivitySection({ items }: TribesMobileActivitySectionProps) {
  if (items.length === 0) return null;

  return (
    <section
      className="space-y-3"
      aria-labelledby="tribes-mobile-activity-title"
      data-tribes-mobile-activity=""
    >
      <h2 id="tribes-mobile-activity-title" className="text-base font-bold text-neutral-900">
        {TRIBES_DESKTOP_ACTIVITY_TITLE}
      </h2>

      <ul className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm divide-y divide-neutral-100">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className="flex items-start gap-3 px-4 py-3.5 transition active:bg-neutral-50">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] text-sm font-bold text-yunicity-primary"
                aria-hidden
              >
                {item.tribeName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-bold text-neutral-900">{item.tribeName}</span>
                  <span className="text-neutral-400"> · </span>
                  <span className="text-neutral-500">{item.authorLabel}</span>
                </p>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-neutral-600">{item.excerpt}</p>
                <span className="mt-2 inline-flex text-sm font-semibold text-yunicity-primary">
                  {TRIBES_DESKTOP_ACTIVITY_VIEW_POST}
                </span>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
