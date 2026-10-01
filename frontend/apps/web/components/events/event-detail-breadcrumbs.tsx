"use client";

import type { EventDetailBreadcrumb } from "@yunicity/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export function EventDetailBreadcrumbs({ items }: { items: EventDetailBreadcrumb[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="text-sm text-neutral-500" data-event-detail-breadcrumbs="">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex min-w-0 items-center gap-1">
              {index > 0 ? (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" aria-hidden />
              ) : null}
              {item.href && !isLast ? (
                <Link href={item.href} className="font-medium text-yunicity-primary hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className={`truncate ${isLast ? "font-semibold text-neutral-800" : ""}`}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
