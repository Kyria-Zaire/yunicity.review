import { describe, expect, it } from "vitest";

import {
  feedEnrichmentForScope,
  resolveFeedEnrichmentSnapshot,
  type FeedEnrichmentSnapshot,
} from "@/lib/feed/feed-enrichment-snapshot";

type Enrichment = {
  video: string | null;
  families: readonly string[];
};

const candidate = (
  video: string | null,
  families: readonly string[],
): FeedEnrichmentSnapshot<Enrichment> => ({
  scopeKey: "Reims",
  value: { video, families },
});

describe("feed enrichment snapshot", () => {
  it("does not expose a partial first stream", () => {
    const postsReadyButSourcesPending = resolveFeedEnrichmentSnapshot(
      null,
      candidate(null, []),
      false,
    );
    expect(feedEnrichmentForScope(postsReadyButSourcesPending, "Reims")).toBeNull();

    const firstResolved = resolveFeedEnrichmentSnapshot(
      postsReadyButSourcesPending,
      candidate("video-1", ["must-see", "local-now"]),
      true,
    );
    expect(feedEnrichmentForScope(firstResolved, "Reims")).toEqual({
      video: "video-1",
      families: ["must-see", "local-now"],
    });
  });

  it("retains the previous snapshot during reload and replaces it atomically", () => {
    const previous = candidate("video-1", ["must-see", "tribes"]);
    const pending = resolveFeedEnrichmentSnapshot(
      previous,
      candidate(null, ["local-now"]),
      false,
    );
    expect(pending).toBe(previous);

    const resolved = resolveFeedEnrichmentSnapshot(
      pending,
      candidate(null, ["local-now"]),
      true,
    );
    expect(resolved?.value).toEqual({ video: null, families: ["local-now"] });
  });

  it("never exposes a snapshot from another city", () => {
    expect(feedEnrichmentForScope(candidate("video-1", ["must-see"]), "Lyon")).toBeNull();
  });
});
