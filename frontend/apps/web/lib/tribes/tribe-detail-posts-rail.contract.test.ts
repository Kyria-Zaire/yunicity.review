import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const NON_MEMBER_POSTS_GATE = "Rejoignez la tribu pour découvrir ses publications.";
const SOURCE = readFileSync(
  fileURLToPath(new URL("../../components/tribes/tribe-detail-posts-rail.tsx", import.meta.url)),
  "utf-8",
);

describe("TribeDetailPostsRail — contrat d'accès publications", () => {
  it("rend toujours l'ancre Publications au lieu de démonter la section non-membre", () => {
    expect(SOURCE).toContain('id="tribe-posts"');
    expect(SOURCE).toContain("TRIBE_DETAIL_PORTAL_POSTS_TITLE");
    expect(SOURCE).not.toMatch(/if\s*\(\s*!canSeePosts\s*\)\s*return\s+null/);
  });

  it("affiche un état d'accès honnête pour un non-membre sans utiliser le faux vide membre", () => {
    expect(SOURCE).toContain(NON_MEMBER_POSTS_GATE);
    expect(SOURCE).toMatch(/!\s*canSeePosts\s*\?\s*\(/);
    expect(SOURCE.indexOf("!canSeePosts ?")).toBeLessThan(SOURCE.indexOf("posts.length === 0 ?"));
  });

  it("préserve les branches historiques des membres autorisés", () => {
    expect(SOURCE).toContain("TRIBE_DETAIL_PORTAL_POSTS_EMPTY");
    expect(SOURCE).toContain("posts.map((post)");
    expect(SOURCE).toContain("post.body");
    expect(SOURCE).toContain("canSeePosts && posts.length > 0");
  });
});
