import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = fileURLToPath(new URL(".", import.meta.url));
const controller = readFileSync(`${here}../../components/feed/portal/feed-data-controller.tsx`, "utf-8");
const portal = readFileSync(`${here}../../components/feed/portal/feed-portal-screen.tsx`, "utf-8");
const stream = readFileSync(`${here}../../components/feed/desktop/feed-desktop-stream.tsx`, "utf-8");
const hook = readFileSync(`${here}../../hooks/use-feed.ts`, "utf-8");
const shell = readFileSync(`${here}../../components/shell/citizen-authenticated-shell.tsx`, "utf-8");
const responsiveShell = readFileSync(`${here}../../components/feed/feed-responsive-shell.tsx`, "utf-8");
const legacyRail = `${here}../../components/feed/portal/feed-right-rail.tsx`;

function occurrences(source: string, token: string): number {
  return source.split(token).length - 1;
}

describe("R2B unified feed architecture", () => {
  it("keeps the stream list and its functional map in one component", () => {
    expect(occurrences(stream, 'data-feed-stream-list=""')).toBe(1);
    expect(occurrences(stream, "stream.map(")).toBe(1);
    expect(controller).not.toContain('data-feed-stream-list=""');
    expect(controller).not.toContain("displayedPosts.map(");
  });

  it("isolates mobile chrome from the medium header path", () => {
    // R4 : plus de branche par palier. Le contrôleur ne rend aucun chrome, et
    // le shell responsive monte chaque header exactement une fois — l'isolation
    // entre paliers vient des media queries, pas d'un JSX conditionnel.
    expect(controller).not.toMatch(/FeedMobileHeader|FeedMediumHeader|FeedDesktopHeader/);
    expect((responsiveShell.match(/<FeedMobileHeader\b/g) ?? []).length).toBe(1);
    expect((responsiveShell.match(/<FeedMediumHeader\b/g) ?? []).length).toBe(1);
    expect((responsiveShell.match(/<FeedDesktopHeader\b/g) ?? []).length).toBe(1);
    // Aucun élément de shell ne rend le flux lui-même.
    expect(responsiveShell).not.toMatch(/FeedDesktopStream|FeedCard\b|FeedVideoStreamItem/);
  });

  it("removes the duplicated context rail and keeps contextual rendering in the stream", () => {
    expect(existsSync(legacyRail)).toBe(false);
    expect(shell).not.toContain("rightRail");
    expect(stream).toContain("FeedContextStreamItem");
  });

  it("guards automatic pagination without a focusable sentinel", () => {
    expect(stream).toContain("IntersectionObserver");
    expect(stream).toContain("observer.disconnect()");
    expect(stream).toContain('aria-hidden="true"');
    expect(hook).toContain("appendInFlightRef");
    expect(hook).toContain("projectionGenerationRef");
    expect(hook).toContain("hasNextPage: pagination.nextCursor !== null");
  });

  it("keeps the desktop rails in the shell, without legacy portal rails", () => {
    expect((responsiveShell.match(/<FeedDesktopLeftRail\b/g) ?? []).length).toBe(1);
    expect((responsiveShell.match(/<FeedDesktopRightRail\b/g) ?? []).length).toBe(1);
    expect(responsiveShell).not.toContain("web-feed-desktop-contents");
    expect(responsiveShell).not.toContain("<FeedLeftRail");
    expect(portal).toContain("FeedDataController");
  });

  it("separates append failure from the initial feed error", () => {
    expect(hook).toContain("appendError: pagination.appendError");
    expect(stream).toContain('role="alert"');
    expect(stream).toContain("Réessayer");
    expect(stream).toContain(
      "if (!sentinel || !hasNextPage || isLoadingMore || appendError)",
    );
    expect(stream).toContain("min-h-11");
  });

  it("gates the first contextual stream on an enrichment snapshot", () => {
    expect(controller).toContain("enrichmentSourcesSettled");
    expect(controller).toContain("resolveFeedEnrichmentSnapshot");
    expect(controller).toContain("streamWaitingForEnrichment");
    expect(controller).not.toContain("if (!streamIsContextual || portal.loading) return []");
  });
});
