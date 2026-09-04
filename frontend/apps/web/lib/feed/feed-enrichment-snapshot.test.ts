import { describe, expect, it } from "vitest";

import {
  feedEnrichmentForScope,
  isSameFeedVideoEnrichment,
  resolveFeedEnrichmentSnapshot,
  type FeedEnrichmentSnapshot,
} from "@/lib/feed/feed-enrichment-snapshot";

type Enrichment = {
  videos: readonly { id: string }[];
  families: readonly string[];
};

const candidate = (
  videos: readonly { id: string }[],
  families: readonly string[],
): FeedEnrichmentSnapshot<Enrichment> => ({
  scopeKey: "Reims",
  value: { videos, families },
});

describe("feed enrichment snapshot", () => {
  it("does not expose a partial first stream", () => {
    const postsReadyButSourcesPending = resolveFeedEnrichmentSnapshot(
      null,
      candidate([], []),
      false,
    );
    expect(feedEnrichmentForScope(postsReadyButSourcesPending, "Reims")).toBeNull();

    const firstResolved = resolveFeedEnrichmentSnapshot(
      postsReadyButSourcesPending,
      candidate([{ id: "video-1" }], ["must-see", "local-now"]),
      true,
    );
    expect(feedEnrichmentForScope(firstResolved, "Reims")).toEqual({
      videos: [{ id: "video-1" }],
      families: ["must-see", "local-now"],
    });
  });

  it("retains the previous snapshot during reload and replaces it atomically", () => {
    const previous = candidate([{ id: "video-1" }], ["must-see", "tribes"]);
    const pending = resolveFeedEnrichmentSnapshot(
      previous,
      candidate([], ["local-now"]),
      false,
    );
    expect(pending).toBe(previous);

    const resolved = resolveFeedEnrichmentSnapshot(
      pending,
      candidate([], ["local-now"]),
      true,
    );
    expect(resolved?.value).toEqual({ videos: [], families: ["local-now"] });
  });

  it("keeps the current snapshot when video ids and families are unchanged", () => {
    const previous = candidate([{ id: "a" }, { id: "b" }], ["must-see"]);
    const next = candidate([{ id: "a" }, { id: "b" }], ["must-see"]);
    const resolved = resolveFeedEnrichmentSnapshot(
      previous,
      next,
      true,
      isSameFeedVideoEnrichment,
    );
    expect(resolved).toBe(previous);
  });

  it("never exposes a snapshot from another city", () => {
    expect(
      feedEnrichmentForScope(candidate([{ id: "video-1" }], ["must-see"]), "Lyon"),
    ).toBeNull();
  });
});
