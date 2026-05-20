import { FEED_EMPTY_BODY, FEED_EMPTY_TITLE } from "@yunicity/utils";

export function FeedEmptyState() {
  return (
    <article className="rounded-2xl border border-dashed border-yunicity-border bg-yunicity-surface p-10 text-center">
      <h2 className="text-lg font-semibold text-neutral-900">{FEED_EMPTY_TITLE}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-neutral-600">
        {FEED_EMPTY_BODY}
      </p>
    </article>
  );
}
