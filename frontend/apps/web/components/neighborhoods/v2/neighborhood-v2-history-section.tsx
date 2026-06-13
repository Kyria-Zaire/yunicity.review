"use client";

import type { NeighborhoodDetailHistory } from "@yunicity/types";
import {
  NEIGHBORHOOD_V2_HISTORY_READ_LESS,
  NEIGHBORHOOD_V2_HISTORY_READ_MORE,
  NEIGHBORHOOD_V2_HISTORY_TITLE,
  NEIGHBORHOOD_V2_HISTORY_COLLAPSE_CHARS,
  truncateNeighborhoodV2Story,
} from "@yunicity/utils";
import { useMemo, useState } from "react";

type NeighborhoodV2HistorySectionProps = {
  history: NeighborhoodDetailHistory;
};

export function NeighborhoodV2HistorySection({ history }: NeighborhoodV2HistorySectionProps) {
  const longStory = history.long_story?.trim() ?? "";
  const featuredQuote = history.featured_quote?.trim() ?? "";
  const [expanded, setExpanded] = useState(false);

  const { preview, canExpand } = useMemo(() => {
    if (!longStory) {
      return { preview: "", canExpand: false };
    }
    if (longStory.length <= NEIGHBORHOOD_V2_HISTORY_COLLAPSE_CHARS) {
      return { preview: longStory, canExpand: false };
    }
    return {
      preview: truncateNeighborhoodV2Story(longStory, NEIGHBORHOOD_V2_HISTORY_COLLAPSE_CHARS),
      canExpand: true,
    };
  }, [longStory]);

  if (!longStory && !featuredQuote) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white px-5 py-6 shadow-sm sm:px-6">
      <h2 className="text-lg font-bold tracking-tight text-neutral-900">{NEIGHBORHOOD_V2_HISTORY_TITLE}</h2>
      <div className="mt-4 space-y-4">
        {longStory ? (
          <div className="max-w-prose">
            <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">
              {expanded || !canExpand ? longStory : preview}
            </p>
            {canExpand ? (
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="mt-3 text-sm font-semibold text-yunicity-primary hover:underline"
              >
                {expanded ? NEIGHBORHOOD_V2_HISTORY_READ_LESS : NEIGHBORHOOD_V2_HISTORY_READ_MORE}
              </button>
            ) : null}
          </div>
        ) : null}

        {featuredQuote ? (
          <blockquote className="rounded-xl bg-yunicity-primary/5 px-4 py-3 text-sm italic leading-relaxed text-neutral-800">
            « {featuredQuote} »
          </blockquote>
        ) : null}
      </div>
    </section>
  );
}
