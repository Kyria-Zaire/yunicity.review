import { FEED_EMPTY_BODY, FEED_EMPTY_DISCOVERY_TITLE, FEED_EMPTY_TITLE } from "@yunicity/utils";
import type { FeedHighlightEvent } from "@yunicity/utils";
import Link from "next/link";

export function FeedEmptyState({
  city,
  highlights = [],
}: {
  city?: string;
  highlights?: FeedHighlightEvent[];
}) {
  const place = city?.trim() || "votre ville";
  const discovery = highlights.slice(0, 3);

  return (
    <div className="rounded-2xl border border-dashed border-yunicity-border bg-white p-10 text-center shadow-sm">
      <p className="text-lg font-semibold text-neutral-900">{FEED_EMPTY_TITLE}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">{FEED_EMPTY_BODY}</p>

      {discovery.length > 0 ? (
        <div className="mx-auto mt-6 max-w-md text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {FEED_EMPTY_DISCOVERY_TITLE} {place}
          </p>
          <ul className="mt-3 space-y-2">
            {discovery.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="block rounded-xl border border-neutral-200/90 bg-neutral-50 px-3 py-2.5 text-left transition hover:border-yunicity-primary/30 hover:bg-white"
                >
                  <p className="text-sm font-medium text-neutral-900">{item.title}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {item.timeBadge} · {item.locationLine}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/sortir"
          className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white hover:bg-yunicity-primary-hover"
        >
          Moments à {place}
        </Link>
        <Link
          href="/map"
          className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Voir la carte
        </Link>
      </div>
    </div>
  );
}
