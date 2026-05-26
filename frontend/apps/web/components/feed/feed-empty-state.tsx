import { FEED_EMPTY_BODY, FEED_EMPTY_TITLE } from "@yunicity/utils";
import Link from "next/link";

export function FeedEmptyState({ city }: { city?: string }) {
  const place = city?.trim() || "votre ville";
  return (
    <div className="rounded-2xl border border-dashed border-yunicity-border bg-white p-10 text-center shadow-sm">
      <p className="text-lg font-semibold text-neutral-900">{FEED_EMPTY_TITLE}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">
        {FEED_EMPTY_BODY}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/events"
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
