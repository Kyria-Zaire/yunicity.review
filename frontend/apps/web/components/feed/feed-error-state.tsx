import { FEED_ERROR_BODY, FEED_ERROR_TITLE } from "@yunicity/utils";

export function FeedErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <article className="rounded-2xl border border-yunicity-border bg-white p-8 text-center">
      <h2 className="text-lg font-semibold text-neutral-900">{FEED_ERROR_TITLE}</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-600">{FEED_ERROR_BODY}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-xl bg-yunicity-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-yunicity-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
      >
        Réessayer
      </button>
    </article>
  );
}
