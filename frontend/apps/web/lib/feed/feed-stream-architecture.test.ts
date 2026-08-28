import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = fileURLToPath(new URL(".", import.meta.url));
const portal = readFileSync(`${here}../../components/feed/portal/feed-portal-screen.tsx`, "utf-8");
const streamList = readFileSync(`${here}../../components/feed/portal/feed-stream-list.tsx`, "utf-8");
const hook = readFileSync(`${here}../../hooks/use-feed.ts`, "utf-8");
const shell = readFileSync(`${here}../../components/shell/citizen-authenticated-shell.tsx`, "utf-8");
const legacyRail = `${here}../../components/feed/portal/feed-right-rail.tsx`;

function occurrences(source: string, token: string): number {
  return source.split(token).length - 1;
}

describe("R2B unified feed architecture", () => {
  it("keeps the stream list and its functional map in one component", () => {
    expect(occurrences(streamList, 'data-feed-stream-list=""')).toBe(1);
    expect(occurrences(streamList, "stream.map(")).toBe(1);
    expect(portal).not.toContain('data-feed-stream-list=""');
    expect(portal).not.toContain("displayedPosts.map(");
  });

  it("does not keep a width-selected publication tree", () => {
    expect(portal).not.toMatch(/window\.innerWidth|matchMedia|FeedCard|FeedVideoStreamItem/);
    const mobileChrome = portal.match(
      /<div className="web-mobile-feed-only[\s\S]*?<FeedMediumHeader/,
    )?.[0];
    expect(mobileChrome).toBeDefined();
    expect(mobileChrome).not.toMatch(/FeedStreamList|FeedCard|FeedVideoStreamItem/);
  });

  it("removes the duplicated context rail and keeps contextual rendering in the stream", () => {
    expect(existsSync(legacyRail)).toBe(false);
    expect(shell).not.toContain("rightRail");
    expect(streamList).toContain("FeedContextStreamItem");
  });

  it("guards automatic pagination without a focusable sentinel", () => {
    expect(streamList).toContain("IntersectionObserver");
    expect(streamList).toContain("observer.disconnect()");
    expect(streamList).toContain('aria-hidden="true"');
    expect(hook).toContain("appendInFlightRef");
    expect(hook).toContain("projectionGenerationRef");
    expect(hook).toContain("hasNextPage: pagination.nextCursor !== null");
  });

  it("keeps the desktop feed toggle without legacy portal rails", () => {
    expect(portal).toContain('className="feed-desktop-view"');
    expect(portal).toContain("<FeedDesktopScreen");
    expect(portal).not.toContain("web-feed-desktop-contents");
    expect(portal).not.toContain("<FeedLeftRail");
  });

  it("separates append failure from the initial feed error", () => {
    expect(hook).toContain("appendError: pagination.appendError");
    expect(streamList).toContain('data-feed-append-error=""');
    expect(streamList).toContain("Réessayer le chargement");
    expect(streamList).toContain(
      "if (!sentinel || !hasNextPage || isLoadingMore || appendError)",
    );
    expect(streamList).toContain("min-h-11");
  });

  it("gates the first contextual stream on an enrichment snapshot", () => {
    expect(portal).toContain("enrichmentSourcesSettled");
    expect(portal).toContain("resolveFeedEnrichmentSnapshot");
    expect(portal).toContain("streamWaitingForEnrichment");
    expect(portal).not.toContain("if (!streamIsContextual || portal.loading) return []");
  });
});
