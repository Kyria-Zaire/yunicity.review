import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const ACTIVE_SURFACES = [
  "components/stories/story-card.tsx",
  "components/stories/stories-left-rail.tsx",
  "components/feed/mobile/feed-mobile-stories-rail.tsx",
  "components/feed/portal/feed-stories-rail.tsx",
] as const;

describe("surfaces Story actives", () => {
  it.each(ACTIVE_SURFACES)("%s passe par la livraison canonique", (relativePath) => {
    const source = readFileSync(resolve(ROOT, relativePath), "utf8");
    expect(source).toMatch(/AuthorizedStoryMedia|StoryRingMedia/);
    expect(source).not.toMatch(/<(?:img|video)[^>]+src=\{(?:story\.media_url|featured\.media_url|item\.imageUrl)\}/s);
    expect(source).not.toContain("window.location.origin");
  });
});
